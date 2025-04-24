/**
 * Utilidades para manejo de medios (audio, imágenes, video)
 */

import Logger from './debug-utils';

const COMPONENT_NAME = 'MediaUtils';

/**
 * Obtiene acceso al micrófono del usuario
 * @returns {Promise<MediaStream>} Stream de audio
 */
export const getAudioStream = async () => {
  try {
    return await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000
      } 
    });
  } catch (error) {
    Logger.error(COMPONENT_NAME, 'Error al acceder al micrófono', error);
    throw new Error('No se pudo acceder al micrófono: ' + error.message);
  }
};

/**
 * Crea un grabador de audio con configuración optimizada
 * @param {MediaStream} stream - Stream de audio
 * @returns {MediaRecorder} Grabador de audio
 */
export const createAudioRecorder = (stream) => {
  const options = { 
    mimeType: 'audio/webm',
    audioBitsPerSecond: 16000
  };
  
  try {
    return new MediaRecorder(stream, options);
  } catch (error) {
    Logger.error(COMPONENT_NAME, 'Error al crear grabador de audio', error);
    throw new Error('No se pudo crear el grabador de audio: ' + error.message);
  }
};

/**
 * Convierte un Blob en un string base64
 * @param {Blob} blob - Blob de datos a convertir
 * @returns {Promise<string>} - String base64 con los datos
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => {
        Logger.error(COMPONENT_NAME, 'Error al convertir Blob a base64', error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      Logger.error(COMPONENT_NAME, 'Error al iniciar conversión a base64', error);
      reject(error);
    }
  });
};

/**
 * Convierte un string base64 en un Blob
 * @param {string} base64 - String base64 a convertir
 * @param {string} mimeType - Tipo MIME del contenido
 * @returns {Blob} - Blob con los datos
 */
export const base64ToBlob = (base64, mimeType) => {
  try {
    // Si ya es una URL completa (data:audio/...), extraer solo la parte base64
    if (base64.startsWith('data:')) {
      const parts = base64.split(',');
      base64 = parts[1];
    }
    
    const byteCharacters = atob(base64);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: mimeType });
  } catch (error) {
    Logger.error(COMPONENT_NAME, 'Error al convertir base64 a Blob', error);
    throw error;
  }
};

/**
 * Reproduce un archivo de audio
 * @param {string} audioSource - Audio en formato base64 o URL
 * @returns {Promise<void>} - Promesa que se resuelve cuando termina la reproducción
 */
export const playAudio = (audioSource) => {
  return new Promise((resolve, reject) => {
    try {
      let audioUrl = audioSource;
      
      // Si es un string base64, convertirlo a URL
      if (typeof audioSource === 'string' && 
          (audioSource.startsWith('data:audio') || audioSource.match(/^[A-Za-z0-9+/=]+$/))) {
        // Es un base64, convertirlo a URL
        if (!audioSource.startsWith('data:')) {
          // Si es un base64 puro sin el prefijo data:
          const blob = base64ToBlob(audioSource, 'audio/mp3');
          audioUrl = URL.createObjectURL(blob);
        }
      }
      
      Logger.debug(COMPONENT_NAME, 'Reproduciendo audio', { urlLength: audioUrl.length });
      
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        if (audioUrl !== audioSource) {
          URL.revokeObjectURL(audioUrl);
        }
        resolve();
      };
      
      audio.onerror = (error) => {
        if (audioUrl !== audioSource) {
          URL.revokeObjectURL(audioUrl);
        }
        Logger.error(COMPONENT_NAME, 'Error al reproducir audio', error);
        reject(error);
      };
      
      audio.play().catch(error => {
        Logger.error(COMPONENT_NAME, 'Error al iniciar reproducción', error);
        reject(error);
      });
    } catch (error) {
      Logger.error(COMPONENT_NAME, 'Error al preparar audio para reproducción', error);
      reject(error);
    }
  });
};

/**
 * Optimiza una imagen para envío
 * @param {File|Blob} imageFile - Archivo de imagen
 * @param {Object} options - Opciones de optimización
 * @param {number} options.maxWidth - Ancho máximo
 * @param {number} options.maxHeight - Alto máximo
 * @param {number} options.quality - Calidad de compresión (0-1)
 * @param {number} options.maxSizeBytes - Tamaño máximo en bytes
 * @param {Array<string>} options.allowedFormats - Formatos MIME permitidos
 * @returns {Promise<{blob: Blob, tooBig: boolean, invalidFormat: boolean}>} Resultado de la optimización
 */
export const optimizeImage = async (imageFile, options = {}) => {
  const { 
    maxWidth = 1200, 
    maxHeight = 900, 
    quality = 0.8, 
    maxSizeBytes = 5 * 1024 * 1024, // 5MB por defecto
    allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  } = options;
  
  try {
    // Verificar el tipo de archivo usando magic bytes
    const magicBytesResult = await detectImageType(imageFile);
    
    // Si no se pudo detectar un tipo válido o el tipo detectado no está en los permitidos
    if (!magicBytesResult.valid || !allowedFormats.includes(magicBytesResult.detectedType)) {
      Logger.warn(COMPONENT_NAME, `Formato de imagen no válido según magic bytes: ${magicBytesResult.detectedType || 'desconocido'}`);
      return { 
        blob: imageFile, 
        tooBig: false, 
        invalidFormat: true,
        formatError: 'La extensión de la imagen no es permitida',
        detectedType: magicBytesResult.detectedType,
        declaredType: imageFile.type
      };
    }
    
    // Si la imagen ya es menor que el tamaño máximo, podríamos devolverla directamente
    if (imageFile.size <= maxSizeBytes) {
      Logger.debug(COMPONENT_NAME, `Imagen ya es menor que ${maxSizeBytes/1024/1024}MB, no requiere optimización`);
      return { 
        blob: imageFile, 
        tooBig: false,
        invalidFormat: false,
        detectedType: magicBytesResult.detectedType
      };
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calcular dimensiones manteniendo aspecto
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          // Dibujar en canvas para redimensionar
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Intentamos con diferentes calidades si la imagen es grande
          const tryQuality = (currentQuality) => {
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Error al crear blob de la imagen'));
                return;
              }
              
              if (blob.size <= maxSizeBytes || currentQuality <= 0.3) {
                // Si la imagen es menor que el máximo o hemos llegado a la calidad mínima aceptable
                Logger.debug(COMPONENT_NAME, `Imagen optimizada: ${blob.size/1024/1024}MB con calidad ${currentQuality}`);
                resolve({ 
                  blob, 
                  tooBig: blob.size > maxSizeBytes,
                  invalidFormat: false,
                  detectedType: magicBytesResult.detectedType
                });
              } else {
                // Intentar con menor calidad
                const newQuality = Math.max(0.3, currentQuality - 0.1);
                Logger.debug(COMPONENT_NAME, `Imagen aún muy grande (${blob.size/1024/1024}MB), intentando con calidad ${newQuality}`);
                tryQuality(newQuality);
              }
            }, magicBytesResult.detectedType || imageFile.type || 'image/jpeg', currentQuality);
          };
          
          // Comenzar con la calidad especificada
          tryQuality(quality);
        };
        
        img.onerror = () => {
          Logger.error(COMPONENT_NAME, 'Error al cargar la imagen');
          reject(new Error('No se pudo cargar la imagen'));
        };
        
        img.src = e.target.result;
      };
      
      reader.onerror = () => {
        Logger.error(COMPONENT_NAME, 'Error al leer la imagen', reader.error);
        reject(new Error('Error al leer la imagen'));
      };
      
      reader.readAsDataURL(imageFile);
    });
  } catch (error) {
    Logger.error(COMPONENT_NAME, 'Error en la validación/optimización de imagen', error);
    throw error;
  }
};

/**
 * Detecta el tipo real de archivo usando magic bytes (firmas de archivo)
 * @param {File|Blob} file - Archivo a verificar
 * @returns {Promise<{valid: boolean, detectedType: string|null, allowedType: boolean}>} Resultado de la validación
 */
export const detectImageType = (file) => {
  return new Promise((resolve, reject) => {
    // Definir magic bytes para tipos de imagen permitidos
    const signatures = {
      // JPEG: SOI marker (Start of Image) seguido por APP0 (0xFFD8FFE0) o APP1 (0xFFD8FFE1) o otros
      'image/jpeg': [[0xFF, 0xD8, 0xFF]],
      // PNG: 8 bytes de firma estándar
      'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
      // WebP: RIFF header (52 49 46 46) + file size + WEBP (57 45 42 50)
      'image/webp': [[0x52, 0x49, 0x46, 0x46, undefined, undefined, undefined, undefined, 0x57, 0x45, 0x42, 0x50]]
    };
    
    // Obtener los primeros 12 bytes para verificar la firma
    const reader = new FileReader();
    reader.onloadend = (e) => {
      try {
        const arr = new Uint8Array(e.target.result);
        let detectedType = null;
        
        // Verificar cada formato contra los bytes leídos
        for (const [mimeType, signatureList] of Object.entries(signatures)) {
          for (const signature of signatureList) {
            let matches = true;
            
            for (let i = 0; i < signature.length; i++) {
              // Si hay un byte indefinido en la firma, lo saltamos (comodín)
              if (signature[i] === undefined) continue;
              
              if (arr[i] !== signature[i]) {
                matches = false;
                break;
              }
            }
            
            if (matches) {
              detectedType = mimeType;
              break;
            }
          }
          
          if (detectedType) break;
        }
        
        // Determinar si el tipo detectado está permitido
        const allowedType = detectedType !== null;
        
        Logger.debug(COMPONENT_NAME, `Análisis de magic bytes: tipo=${detectedType}, permitido=${allowedType}`);
        
        resolve({
          valid: detectedType !== null,
          detectedType,
          allowedType,
          declaredType: file.type
        });
      } catch (error) {
        Logger.error(COMPONENT_NAME, 'Error al analizar magic bytes', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      Logger.error(COMPONENT_NAME, 'Error al leer archivo para magic bytes', error);
      reject(error);
    };
    
    // Leer solo los primeros bytes del archivo como ArrayBuffer
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
};

// Exportar objeto con todas las funciones
const MediaUtils = {
  getAudioStream,
  createAudioRecorder,
  blobToBase64,
  base64ToBlob,
  playAudio,
  optimizeImage,
  detectImageType
};

export default MediaUtils;