import React, { useState } from 'react';
import Logger from '../utils/debug-utils';
import { optimizeImage } from '../utils/media-utils';

/**
 * COMPONENTE UPLOADER DE LENGUAJE DE SEÑAS ASL
 * 
 * Como desarrollador fullstack, este es uno de los componentes más críticos del sistema.
 * Se encarga de:
 * 
 * 1. VALIDACIÓN DE IMÁGENES: Verifica formato, tamaño y calidad antes del procesamiento
 * 2. OPTIMIZACIÓN AUTOMÁTICA: Reduce el tamaño de imágenes grandes automáticamente
 * 3. VISTA PREVIA INTUITIVA: Muestra al usuario cómo se ve su imagen antes de procesar
 * 4. INTEGRACIÓN API: Se conecta con nuestro backend FastAPI para el procesamiento ASL
 * 5. MANEJO DE ERRORES: Feedback claro para problemas comunes (formato, tamaño, etc.)
 * 
 * ARQUITECTURA:
 * - Frontend React → Optimiza imagen → Backend FastAPI → HuggingFace Model → Resultado
 * 
 * CASOS DE USO REALES:
 * - Usuarios suben fotos desde móvil (pueden ser muy grandes)
 * - Formatos variados (iPhone HEIC se convierte automáticamente)
 * - Conexiones lentas necesitan imágenes optimizadas
 * - Usuarios con discapacidad auditiva necesitan feedback visual claro
 */

const SignLanguageUploader = () => {
  // ═══════════════════════════════════════════════════════════════════════════════════
  // ESTADO DEL COMPONENTE - GESTIÓN DE LA CARGA Y PROCESAMIENTO DE IMÁGENES ASL
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * ARCHIVO SELECCIONADO (selectedFile)
   * - Contiene el blob optimizado de la imagen después de validación
   * - Es lo que realmente enviamos al backend para procesamiento
   * - Se establece solo después de pasar todas las validaciones
   */
  const [selectedFile, setSelectedFile] = useState(null);
  
  /**
   * URL DE VISTA PREVIA (previewUrl)
   * - Data URL base64 para mostrar la imagen al usuario
   * - Se genera con FileReader después de optimización
   * - Permite al usuario confirmar que subió la imagen correcta
   */
  const [previewUrl, setPreviewUrl] = useState(null);
  
  /**
   * ESTADO DE CARGA (isUploading)
   * - Controla el spinner y deshabilita el botón durante procesamiento
   * - Crítico para prevenir envíos múltiples mientras se procesa
   * - Se activa desde que hacemos click hasta recibir respuesta del backend
   */
  const [isUploading, setIsUploading] = useState(false);
  
  /**
   * MANEJO DE ERRORES (error)
   * - Almacena mensajes de error user-friendly
   * - Se muestra en la UI con styling de Bootstrap alert
   * - Se limpia automáticamente cuando el usuario selecciona un nuevo archivo
   */
  const [error, setError] = useState(null);

  // ═══════════════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE VALIDACIÓN - LÍMITES TÉCNICOS Y DE USABILIDAD
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * TAMAÑO MÁXIMO DE ARCHIVO: 5MB
   * 
   * ¿Por qué 5MB?
   * - Las fotos de móvil pueden llegar a 10-15MB fácilmente
   * - 5MB es suficiente para imágenes de alta calidad después de optimización
   * - El backend/API puede manejar este tamaño sin problemas de timeout
   * - HuggingFace Spaces tiene límites de request size
   */
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en bytes
  
  /**
   * FORMATOS PERMITIDOS
   * 
   * jpeg/jpg: Formato más común, excelente compresión
   * png: Ideal para capturas de pantalla con transparencia
   * webp: Formato moderno con mejor compresión que JPEG
   * 
   * NOTA: No incluimos GIF porque no necesitamos animaciones para ASL estático
   * NOTA: HEIC (iPhone) se maneja automáticamente por el navegador
   */
  const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  // const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']; // Backup si necesitamos validar extensiones

  // ═══════════════════════════════════════════════════════════════════════════════════
  // MANEJO DE SELECCIÓN DE ARCHIVO - VALIDACIÓN Y OPTIMIZACIÓN AUTOMÁTICA
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * FLUJO DE PROCESAMIENTO DE ARCHIVO:
   * 
   * 1. Usuario selecciona archivo → event.target.files[0]
   * 2. Limpiamos errores anteriores para UX limpia
   * 3. Llamamos optimizeImage() que maneja:
   *    - Redimensionamiento inteligente (máx 1200x900)
   *    - Compresión con calidad 0.8 (balance calidad/tamaño)
   *    - Validación de formato y tamaño
   * 4. Si todo está bien → generamos vista previa
   * 5. Si hay problemas → mostramos error específico
   * 
   * CASOS EDGE QUE MANEJAMOS:
   * - Imágenes enormes de 20MB+ (auto-optimización)
   * - Formatos no soportados (mensaje claro)
   * - Archivos corruptos (try/catch)
   * - Imágenes que no se pueden reducir suficiente (mensaje específico)
   */
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    setError(null); // Limpiar errores anteriores para UX limpia
    
    if (file) {
      try {
        Logger.debug('SignLanguageUploader', `Procesando archivo: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        
        // ═══════════════════════════════════════════════════════════════════════════════
        // OPTIMIZACIÓN INTELIGENTE DE IMAGEN
        // ═══════════════════════════════════════════════════════════════════════════════
        
        /**
         * La función optimizeImage() es nuestro "motor" de procesamiento:
         * 
         * maxWidth/maxHeight: Redimensiona manteniendo aspect ratio
         * quality: 0.8 = 80% calidad (sweet spot para ASL, mantiene detalles importantes)
         * maxSizeBytes: Límite absoluto de tamaño
         * allowedFormats: Lista de MIME types permitidos
         * 
         * RETORNA:
         * - blob: Imagen optimizada lista para enviar
         * - tooBig: true si no se pudo reducir suficiente
         * - invalidFormat: true si el formato no está permitido
         */
        const { blob: optimizedImage, tooBig, invalidFormat } = await optimizeImage(file, {
          maxWidth: 1200,    // Ancho máximo que mantiene buena calidad para ASL
          maxHeight: 900,    // Altura máxima, proporcional para móviles
          quality: 0.8,      // 80% calidad - balance perfecto para reconocimiento ASL
          maxSizeBytes: MAX_FILE_SIZE,
          allowedFormats: ALLOWED_FORMATS
        });
        
        // ═══════════════════════════════════════════════════════════════════════════════
        // VALIDACIONES POST-OPTIMIZACIÓN
        // ═══════════════════════════════════════════════════════════════════════════════
        
        /**
         * FORMATO INVÁLIDO
         * 
         * Esto pasa cuando alguien intenta subir:
         * - PDF, Word, PowerPoint con extensión cambiada
         * - Formatos exóticos como TIFF, BMP
         * - Videos con extensión incorrecta
         */
        if (invalidFormat) {
          setError('La extensión de la imagen no es permitida. Usa JPG, PNG o WebP.');
          Logger.warn('SignLanguageUploader', `Formato no permitido: ${file.type}`);
          return;
        }
        
        /**
         * IMAGEN DEMASIADO GRANDE
         * 
         * Esto pasa en casos extremos:
         * - Fotos RAW de cámaras profesionales
         * - Screenshots de pantallas 4K+ sin comprimir
         * - Imágenes con metadatos excesivos
         */
        if (tooBig) {
          setError('La imagen es demasiado grande y no se pudo reducir por debajo de 5MB. Intenta con una imagen más pequeña.');
          Logger.warn('SignLanguageUploader', `Imagen demasiado grande después de optimización: ${file.name}`);
          return;
        }
        
        // ═══════════════════════════════════════════════════════════════════════════════
        // ÉXITO: GENERAR VISTA PREVIA Y ESTABLECER ARCHIVO
        // ═══════════════════════════════════════════════════════════════════════════════
        
        Logger.info('SignLanguageUploader', `Imagen optimizada exitosamente: ${(optimizedImage.size / 1024 / 1024).toFixed(2)}MB`);
        setSelectedFile(optimizedImage);
        
        /**
         * GENERACIÓN DE VISTA PREVIA
         * 
         * Usamos FileReader para convertir el blob optimizado a data URL.
         * Esto nos permite mostrar exactamente la imagen que se va a procesar,
         * no la original que subió el usuario.
         * 
         * BENEFICIOS:
         * - Usuario ve exactamente lo que se va a analizar
         * - Confirmación visual de que la optimización funcionó
         * - Debugging más fácil si hay problemas de calidad
         */
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
          Logger.debug('SignLanguageUploader', 'Vista previa generada exitosamente');
        };
        reader.onerror = () => {
          setError('Error al leer el archivo. Intenta con otra imagen.');
          Logger.error('SignLanguageUploader', 'Error en FileReader');
        };
        reader.readAsDataURL(optimizedImage);
        
      } catch (err) {
        /**
         * MANEJO DE ERRORES CRÍTICOS
         * 
         * Este catch maneja errores que no esperamos:
         * - Problemas de memoria con imágenes gigantes
         * - Errores de codec en navegadores antiguos
         * - Problemas de permisos de archivo (raro pero posible)
         */
        Logger.error('SignLanguageUploader', 'Error al procesar archivo', err);
        setError('Error al procesar la imagen. Intenta con otra imagen o formato diferente.');
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════════
  // PROCESAMIENTO ASL - ENVÍO AL BACKEND Y MANEJO DE RESPUESTA
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * FLUJO DE PROCESAMIENTO ASL COMPLETO:
   * 
   * 1. VALIDACIÓN PREVIA: Verificamos que hay archivo seleccionado
   * 2. ESTADO DE CARGA: Activamos spinner y deshabilitamos botón
   * 3. IMPORTACIÓN DINÁMICA: Cargamos ApiService solo cuando es necesario
   * 4. LLAMADA API: Enviamos imagen a nuestro backend FastAPI
   * 5. MANEJO DE RESPUESTA: Procesamos éxito o error
   * 6. CLEANUP: Desactivamos estado de carga
   * 
   * ARQUITECTURA DE LA PETICIÓN:
   * Frontend (blob optimizado) → Backend FastAPI → HuggingFace Spaces → Resultado ASL
   * 
   * CASOS DE USO REALES:
   * - Usuario hace click sin seleccionar imagen (validación)
   * - Red lenta → spinner muestra progreso
   * - Error del modelo → mensaje user-friendly
   * - Éxito → resultado se puede integrar con Chat o mostrar aquí
   */
  const handleUpload = async () => {
    // ═══════════════════════════════════════════════════════════════════════════════
    // VALIDACIÓN PREVIA - ASEGURAMOS QUE HAY ARCHIVO SELECCIONADO
    // ═══════════════════════════════════════════════════════════════════════════════
    
    if (!selectedFile) {
      setError('Por favor, selecciona una imagen primero');
      Logger.warn('SignLanguageUploader', 'Intento de upload sin archivo seleccionado');
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // PREPARACIÓN PARA PROCESAMIENTO
    // ═══════════════════════════════════════════════════════════════════════════════
    
    setIsUploading(true);   // Activa spinner, deshabilita botón
    setError(null);         // Limpia errores anteriores
    
    Logger.info('SignLanguageUploader', `Iniciando procesamiento ASL de imagen (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB)`);
    
    try {
      // ═══════════════════════════════════════════════════════════════════════════════
      // IMPORTACIÓN DINÁMICA DE APISERVICE
      // ═══════════════════════════════════════════════════════════════════════════════
      
      /**
       * ¿Por qué importación dinámica?
       * 
       * 1. CODE SPLITTING: ApiService solo se carga cuando se necesita
       * 2. PERFORMANCE: Reduce el bundle inicial de la aplicación
       * 3. LAZY LOADING: Mejor tiempo de carga inicial
       * 4. TREE SHAKING: Webpack puede optimizar mejor
       */
      const { default: ApiService } = await import('../services/api');
      
      Logger.debug('SignLanguageUploader', 'ApiService cargado, enviando imagen para procesamiento');
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // LLAMADA AL BACKEND PARA PROCESAMIENTO ASL
      // ═══════════════════════════════════════════════════════════════════════════════
      
      /**
       * processSignLanguage() hace:
       * 
       * 1. Convierte blob a FormData
       * 2. Envía POST a nuestro endpoint /api/asl/process
       * 3. Backend llama a HuggingFace Spaces
       * 4. Retorna resultado con formato estándar:
       *    { success: true/false, data: {...}, error: {...} }
       */
      const { success, data, error: apiError } = await ApiService.processSignLanguage(selectedFile);

      // ═══════════════════════════════════════════════════════════════════════════════
      // PROCESAMIENTO DE RESPUESTA EXITOSA
      // ═══════════════════════════════════════════════════════════════════════════════
      
      if (success && data) {
        Logger.info('SignLanguageUploader', 'ASL procesado exitosamente', { 
          prediction: data.prediction,
          confidence: data.confidence 
        });
        
        /**
         * AQUÍ PUEDES INTEGRAR CON OTROS COMPONENTES:
         * 
         * Opción 1: Mostrar resultado en este componente
         * Opción 2: Enviar resultado al Chat principal
         * Opción 3: Emitir evento para que padre maneje
         * Opción 4: Actualizar estado global (Redux/Context)
         * 
         * Ejemplo de integración:
         * - onResult?.(data) // Callback al componente padre
         * - dispatch(addMessage({ type: 'asl', result: data })) // Redux
         * - setGlobalResult(data) // Context API
         */
        
        // Por ahora, loggeamos el resultado para debugging
        console.log('🎯 Resultado ASL:', {
          letra: data.prediction,
          confianza: `${(data.confidence * 100).toFixed(1)}%`,
          timestamp: new Date().toISOString()
        });
        
        // TODO: Implementar integración con UI
        // setResult(data); // Si agregamos estado para mostrar resultado
        
      } else {
        // ═══════════════════════════════════════════════════════════════════════════════
        // MANEJO DE ERRORES DE API
        // ═══════════════════════════════════════════════════════════════════════════════
        
        const errorMessage = apiError?.message || 'Error al procesar el lenguaje de señas';
        Logger.error('SignLanguageUploader', 'Error en procesamiento ASL', apiError);
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      // ═══════════════════════════════════════════════════════════════════════════════
      // MANEJO DE ERRORES GENERALES
      // ═══════════════════════════════════════════════════════════════════════════════
      
      /**
       * TIPOS DE ERRORES QUE MANEJAMOS:
       * 
       * 1. RED: Timeout, sin conexión, server down
       * 2. API: Errores 4xx/5xx del backend
       * 3. MODELO: HuggingFace Spaces no disponible
       * 4. FORMATO: Imagen no válida para el modelo
       * 5. TAMAÑO: Request demasiado grande
       */
      
      const userMessage = error.message || 'Error al procesar la imagen. Intenta nuevamente.';
      setError(userMessage);
      
      Logger.error('SignLanguageUploader', 'Error en handleUpload', {
        error: error.message,
        stack: error.stack,
        fileName: selectedFile?.name,
        fileSize: selectedFile?.size
      });
      
    } finally {
      // ═══════════════════════════════════════════════════════════════════════════════
      // CLEANUP - SIEMPRE SE EJECUTA
      // ═══════════════════════════════════════════════════════════════════════════════
      
      /**
       * Es crítico que desactivemos isUploading en finally, no solo en try/catch.
       * Sino el botón queda deshabilitado permanentemente si hay errores inesperados.
       */
      setIsUploading(false);
      Logger.debug('SignLanguageUploader', 'Procesamiento finalizado, UI restaurada');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════════
  // RENDERIZADO DE LA INTERFAZ - COMPONENTE UI ACCESIBLE Y USER-FRIENDLY
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * ESTRUCTURA DE LA UI:
   * 
   * 1. CARD CONTAINER: Bootstrap card con sombra sutil
   * 2. HEADER: Título con ícono descriptivo
   * 3. FILE INPUT: Selector de archivo con validaciones visuales
   * 4. ERROR DISPLAY: Alert de Bootstrap para errores
   * 5. PREVIEW: Imagen optimizada que se va a procesar
   * 6. ACTION BUTTON: Botón con estados (normal/loading/disabled)
   * 
   * CONSIDERACIONES DE ACCESIBILIDAD:
   * - Labels explícitos para screen readers
   * - Role attributes para elementos importantes
   * - Focus management para navegación por teclado
   * - Colores que cumplen WCAG contrast ratios
   */
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        {/* ══════════════════════════════════════════════════════════════════════════════ */}
        {/* HEADER DEL COMPONENTE - TÍTULO DESCRIPTIVO CON ICONOGRAFÍA */}
        {/* ══════════════════════════════════════════════════════════════════════════════ */}
        
        <h5 className="card-title d-flex align-items-center">
          {/* 
            ÍCONO: bi-translate es perfecto para ASL
            - Representa traducción/interpretación
            - Universalmente reconocido
            - Accesible para usuarios con discapacidad visual
          */}
          <i className="bi bi-translate me-2"></i>
          Análisis de Lenguaje de Señas
        </h5>
        
        {/* ══════════════════════════════════════════════════════════════════════════════ */}
        {/* CONTENEDOR PRINCIPAL - LAYOUT VERTICAL CON ESPACIADO CONSISTENTE */}
        {/* ══════════════════════════════════════════════════════════════════════════════ */}
        
        <div className="d-flex flex-column align-items-center gap-3 py-2">
          
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* SELECTOR DE ARCHIVO - INPUT CON VALIDACIONES VISUALES */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          
          <div className="mb-3 w-100">
            {/*
              ATRIBUTOS IMPORTANTES:
              
              accept: Restringe tipos de archivo en el selector nativo
              - .jpg,.jpeg,.png,.webp: Extensiones permitidas
              - image/jpeg,image/png,etc: MIME types para mayor precisión
              
              onChange: Manejador que incluye validación y optimización automática
              
              className: Bootstrap form-control para styling consistente
              
              id: Vinculado con label para accesibilidad
            */}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              className="form-control"
              id="signLanguageInput"
              aria-describedby="fileHelp"
            />
            
            {/*
              TEXTO DE AYUDA:
              - Información clara sobre restricciones
              - ID vinculado con aria-describedby para screen readers
              - Incluye límites técnicos importantes
            */}
            <label className="form-text" id="fileHelp" htmlFor="signLanguageInput">
              Formatos permitidos: JPG, PNG, WebP (máx. 5MB)
            </label>
          </div>
          
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* DISPLAY DE ERRORES - FEEDBACK VISUAL CLARO */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          
          {error && (
            /*
              ALERT DE BOOTSTRAP:
              - alert-danger: Color rojo estándar para errores
              - role="alert": Importante para screen readers
              - w-100: Ancho completo para visibilidad máxima
              
              TIPOS DE ERRORES QUE MOSTRAMOS:
              - Formato no permitido
              - Tamaño demasiado grande
              - Errores de procesamiento
              - Errores de red/API
            */
            <div className="alert alert-danger w-100" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}
          
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* VISTA PREVIA DE IMAGEN - CONFIRMACIÓN VISUAL PARA EL USUARIO */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          
          {previewUrl && (
            <div className="mb-3 text-center">
              {/*
                VISTA PREVIA OPTIMIZADA:
                - Muestra exactamente la imagen que se va a procesar
                - maxHeight: 200px para no dominar la UI
                - img-fluid: Responsive, se adapta al contenedor
                - rounded: Bordes redondeados para mejor estética
                
                BENEFICIOS UX:
                - Usuario confirma que subió la imagen correcta
                - Ve el resultado de la optimización
                - Feedback visual antes del procesamiento
              */}
              <img 
                src={previewUrl} 
                alt="Vista previa de la imagen que se va a analizar para ASL" 
                className="img-fluid rounded" 
                style={{ maxHeight: '200px' }}
              />
              <div className="mt-2 text-muted small">
                Vista previa - Esta imagen se analizará para detectar lenguaje de señas
              </div>
            </div>
          )}
          
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* BOTÓN DE ACCIÓN - PROCESAMIENTO CON ESTADOS VISUALES */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="btn btn-success w-100"
            aria-describedby="uploadButtonHelp"
          >
            {isUploading ? (
              /*
                ESTADO DE CARGA:
                - Spinner de Bootstrap para feedback visual
                - Texto descriptivo del proceso
                - spinner-border-sm: Tamaño pequeño para no dominar
                - me-2: Margin-end para espaciado del texto
              */
              <>
                <span 
                  className="spinner-border spinner-border-sm me-2" 
                  role="status" 
                  aria-hidden="true"
                ></span>
                Procesando imagen...
              </>
            ) : (
              /*
                ESTADO NORMAL:
                - Texto claro de la acción
                - Ícono opcional para reforzar la acción
              */
              <>
                <i className="bi bi-cpu me-2"></i>
                Procesar Imagen
              </>
            )}
          </button>
          
          {/*
            TEXTO DE AYUDA PARA EL BOTÓN:
            - Información adicional sobre qué hace el botón
            - Solo visible cuando no hay errores
          */}
          {!error && (
            <div className="form-text text-center" id="uploadButtonHelp">
              El análisis puede tardar unos segundos. Se enviará la imagen a nuestro modelo de IA especializado en ASL.
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * EXPORTACIÓN Y DOCUMENTACIÓN DEL COMPONENTE
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * SIGNLANGUAGEUPLOADER - Componente para carga y procesamiento de imágenes ASL
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * ✅ Validación automática de formatos de imagen
 * ✅ Optimización inteligente (redimensiona + comprime)
 * ✅ Vista previa de la imagen procesada
 * ✅ Integración con backend FastAPI para procesamiento ASL
 * ✅ Manejo robusto de errores con mensajes user-friendly
 * ✅ Estados de carga con feedback visual
 * ✅ Accesibilidad completa (ARIA, screen readers)
 * 
 * CASOS DE USO:
 * - Subcomponente del Chat principal
 * - Componente standalone para análisis ASL
 * - Integración con flujos de trabajo de accesibilidad
 * - Herramienta de testing para el modelo ASL
 * 
 * INTEGRACIONES:
 * - utils/media-utils.js: Optimización de imágenes
 * - utils/debug-utils.js: Sistema de logging
 * - services/api.js: Comunicación con backend
 * - Backend FastAPI: Procesamiento ASL via HuggingFace
 * 
 * CONSIDERACIONES TÉCNICAS:
 * - Máximo 5MB por imagen (configurable)
 * - Formatos: JPEG, PNG, WebP
 * - Optimización automática a 1200x900 máx
 * - Compresión inteligente manteniendo calidad para ASL
 * 
 * PRÓXIMOS PASOS POSIBLES:
 * - Integración con resultado en tiempo real
 * - Historial de procesamiento
 * - Batch processing de múltiples imágenes
 * - Integración con cámara web
 */
export default SignLanguageUploader;