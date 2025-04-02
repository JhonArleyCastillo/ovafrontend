/**
 * Utilidades para manejo de medios (audio, imágenes, video)
 */

import { Logger } from './debug-utils';

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
 * @param {string} base64Audio - Audio en formato base64
 * @returns {Promise<void>} - Promesa que se resuelve cuando termina la reproducción
 */
export const playAudio = (base64Audio) => {
  return new Promise((resolve, reject) => {
    try {
      const blob = base64ToBlob(base64Audio, 'audio/mp3');
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(url);
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
 * @returns {Promise<Blob>} Imagen optimizada
 */
export const optimizeImage = (imageFile, options = {}) => {
  const { maxWidth = 800, maxHeight = 600, quality = 0.7 } = options;
  
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
        
        // Convertir a blob
        canvas.toBlob((blob) => {
          resolve(blob);
        }, imageFile.type || 'image/jpeg', quality);
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
};

// Exportar objeto con todas las funciones
const MediaUtils = {
  getAudioStream,
  createAudioRecorder,
  blobToBase64,
  base64ToBlob,
  playAudio,
  optimizeImage
};

export default MediaUtils; 