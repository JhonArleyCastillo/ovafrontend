import React, { useState, useEffect, useRef } from 'react';
import Logger from '../utils/debug-utils';
import { getAudioStream, createAudioRecorder } from '../utils/media-utils';
import ApiService from '../services/api';
import { COMPONENT_NAMES } from '../config/constants';
import { ConnectionStatus, ErrorMessage } from './common';
// import { processIncomingMessage, handleMessageActions } from '../utils/message-utils';

/**
 * COMPONENTE GRABADOR DE VOZ PARA ACCESIBILIDAD ASL
 * 
 * Como desarrollador fullstack, este componente maneja una funcionalidad crítica pero compleja.
 * Su propósito principal es:
 * 
 * 1. GRABACIÓN DE AUDIO: Captura desde micrófono del usuario
 * 2. PROCESAMIENTO EN TIEMPO REAL: Envía audio al backend para análisis
 * 3. FEEDBACK INMEDIATO: Muestra resultados de transcripción
 * 4. ACCESIBILIDAD: Interface diseñada para usuarios con necesidades especiales
 * 
 * ARQUITECTURA ACTUAL (OPTIMIZADA PARA EC2):
 * - Frontend captura audio → Backend FastAPI → [Servicios de audio deshabilitados]
 * - Versión simplificada sin WebSocket de audio para mejor rendimiento en servidor
 * 
 * CASOS DE USO REALES:
 * - Usuarios con discapacidad auditiva quieren comunicarse por voz
 * - Familiares sin conocimiento ASL necesitan transcripción
 * - Aplicaciones educativas para aprender pronunciación
 * - Debugging de problemas de micrófono en dispositivos
 * 
 * CONSIDERACIONES TÉCNICAS:
 * - Permisos de micrófono son críticos (getUserMedia)
 * - Diferentes navegadores manejan audio de forma distinta
 * - WebRTC tiene limitaciones en dispositivos móviles
 * - Tamaño de chunks afecta latencia vs calidad
 * 
 * ESTADO ACTUAL: SERVICIO DESHABILITADO
 * El backend optimizado para EC2 no incluye servicios de audio para reducir complejidad.
 * El código está preparado para reactivación fácil cuando sea necesario.
 */

const COMPONENT_NAME = COMPONENT_NAMES.VOICE_RECORDER;

const VoiceRecorder = () => {
  // ═══════════════════════════════════════════════════════════════════════════════════
  // ESTADO DEL COMPONENTE - GESTIÓN DE GRABACIÓN Y CONEXIÓN DE AUDIO
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * ESTADO DE GRABACIÓN (isRecording)
   * - Controla si estamos capturando audio del micrófono
   * - Cambia la UI del botón (play/stop) y el indicador visual
   * - Crítico para prevenir grabaciones múltiples simultáneas
   */
  const [isRecording, setIsRecording] = useState(false);
  
  /**
   * URL DEL AUDIO GRABADO (audioUrl)
   * - Blob URL creado con createObjectURL para previsualización
   * - Permite al usuario escuchar lo que grabó antes de procesar
   * - Se libera automáticamente cuando se graba nuevo audio
   */
  const [audioUrl, setAudioUrl] = useState(null);
  
  /**
   * ESTADO DE CONEXIÓN (isConnected)
   * - Indica si el backend/WebSocket está disponible para audio
   * - ACTUALMENTE SIEMPRE FALSE porque servicios de audio están deshabilitados
   * - Controla si se muestra el botón de grabación como habilitado
   */
  const [isConnected, setIsConnected] = useState(false);
  
  /**
   * MANEJO DE ERRORES (error)
   * - Errores de permisos de micrófono (más común)
   * - Errores de conexión de red
   * - Errores de formato de audio no soportado
   * - Errores de hardware (micrófono no encontrado)
   */
  const [error, setError] = useState(null);
  
  /**
   * TRANSCRIPCIÓN DE AUDIO (transcript)
   * - Resultado del procesamiento de voz a texto
   * - Se actualizaría en tiempo real si el servicio estuviera activo
   * - Preparado para integración futura
   */
  const [transcript] = useState('');
  
  // ═══════════════════════════════════════════════════════════════════════════════════
  // REFERENCIAS DE REACT - ACCESO DIRECTO A APIs DEL NAVEGADOR
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * MEDIA RECORDER (mediaRecorderRef)
   * - API nativa del navegador para grabar audio/video
   * - Maneja la captura desde el stream del micrófono
   * - Genera eventos ondataavailable con chunks de audio
   */
  const mediaRecorderRef = useRef(null);
  
  /**
   * CHUNKS DE AUDIO (audioChunksRef)
   * - Array que acumula los pedazos de audio durante la grabación
   * - Se combina en un Blob final cuando se detiene la grabación
   * - Se reinicia en cada nueva grabación
   */
  const audioChunksRef = useRef([]);
  
  /**
   * STREAM DE MEDIA (streamRef)
   * - MediaStream del micrófono obtenido con getUserMedia
   * - Necesario para parar todos los tracks cuando terminamos
   * - Critical para liberar el micrófono y apagar el LED de "grabando"
   */
  const streamRef = useRef(null);
  
  /**
   * WEBSOCKET DE AUDIO (wsRef)
   * - Conexión en tiempo real para envío de audio al backend
   * - ACTUALMENTE NO UTILIZADO (servicios de audio deshabilitados)
   * - Preparado para reactivación futura con transcripción en vivo
   */
  const wsRef = useRef(null);
  
  // ═══════════════════════════════════════════════════════════════════════════════════
  // EFECTO DE INICIALIZACIÓN - CONFIGURACIÓN DE CONEXIONES Y RECURSOS
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    /**
     * VERIFICACIÓN DE CONEXIÓN CON EL SERVIDOR
     * 
     * Antes de mostrar la UI como funcional, verificamos si el backend
     * puede manejar requests de audio. Esto previene UX frustrante donde
     * el usuario graba pero no puede procesar.
     */
    const checkConnection = async () => {
      try {
        Logger.debug(COMPONENT_NAME, 'Verificando disponibilidad del servidor de audio...');
        
        // Verificamos si el backend general está disponible
        const isServerAvailable = await ApiService.checkServerStatus();
        
        if (!isServerAvailable) {
          // Servidor completamente down
          setIsConnected(false);
          setError('No se pudo conectar al servidor de voz');
          Logger.error(COMPONENT_NAME, 'Servidor no disponible');
        } else {
          // Servidor up, pero servicios de audio están deshabilitados intencionalmente
          Logger.info(COMPONENT_NAME, 'Servidor disponible, pero servicios de audio deshabilitados por optimización EC2');
        }
        
      } catch (err) {
        Logger.error(COMPONENT_NAME, 'Error al verificar conexión', err);
        setIsConnected(false);
        setError('Error al conectar con el servidor');
      }
    };

    /**
     * CONFIGURACIÓN DE WEBSOCKET (ACTUALMENTE DESHABILITADO)
     * 
     * En versiones anteriores, aquí se establecía una conexión WebSocket
     * para envío de audio en tiempo real. La funcionalidad está comentada
     * pero preservada para reactivación futura.
     * 
     * RAZONES PARA DESHABILITAR:
     * 1. OPTIMIZACIÓN EC2: Reduce carga del servidor
     * 2. COMPLEJIDAD: Los WebSockets requieren más gestión de estado
     * 3. RECURSOS: Audio processing es CPU-intensivo
     * 4. PRIORIZACIÓN: ASL visual es más crítico que audio
     */
    const setupWebSocket = () => {
      // ❌ WebSocket de audio DESHABILITADO - Endpoint removido del backend
      // El backend optimizado para EC2 no incluye servicios de audio
      Logger.warn(COMPONENT_NAME, 'Servicio de audio deshabilitado - Backend optimizado para EC2');
      setIsConnected(false);
      setError('Servicio de audio no disponible en esta versión optimizada');
      
      /* 
      ══════════════════════════════════════════════════════════════════════════════════
      CÓDIGO ORIGINAL PARA WEBSOCKET DE AUDIO (COMENTADO PARA PRESERVAR)
      ══════════════════════════════════════════════════════════════════════════════════
      
      ESTE CÓDIGO FUNCIONABA EN VERSIONES ANTERIORES Y PUEDE REACTIVARSE:
      
      try {
        const ws = ApiService.createWebSocketConnection(ApiService.WS_ROUTES.DETECT_AUDIO, {
          onOpen: () => {
            Logger.info(COMPONENT_NAME, 'WebSocket de audio conectado');
            setIsConnected(true);
            setError(null);
          },
          onMessage: handleWebSocketMessage,  // Procesaba transcripciones en tiempo real
          onClose: () => {
            Logger.warn(COMPONENT_NAME, 'WebSocket de audio desconectado');
            setIsConnected(false);
            setError('Conexión perdida');
            
            // Auto-reconnection después de 5 segundos
            // Auto-reconnection después de 5 segundos
            setTimeout(setupWebSocket, 5000);
          },
          onError: (err) => {
            Logger.error(COMPONENT_NAME, 'Error en WebSocket de audio', err);
            setIsConnected(false);
            setError('Error en la conexión');
          }
        });
        
        wsRef.current = ws;
      } catch (err) {
        Logger.error(COMPONENT_NAME, 'Error al crear WebSocket', err);
        setError('No se pudo establecer la conexión WebSocket');
      }
      
      PARA REACTIVAR ESTE SERVICIO:
      1. Descomentar este código
      2. Agregar endpoint /ws/audio en el backend
      3. Implementar handleWebSocketMessage
      4. Configurar procesamiento de audio en tiempo real
      ══════════════════════════════════════════════════════════════════════════════════
      */
    };

    // Ejecutar verificaciones de conexión
    checkConnection().then(setupWebSocket);

    // ═══════════════════════════════════════════════════════════════════════════════
    // CLEANUP AL DESMONTAR COMPONENTE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * CLEANUP CRÍTICO para prevenir memory leaks:
     * 
     * 1. Parar MediaStream (libera micrófono, apaga LED)
     * 2. Cerrar WebSocket (libera conexión de red)
     * 3. Limpiar referencias (previene acceso a objetos eliminados)
     * 
     * Sin este cleanup:
     * - El micrófono queda "abierto" (LED rojo permanente)
     * - WebSockets zombie consumen memoria
     * - Possible memory leaks en mobile devices
     */
    return () => {
      Logger.debug(COMPONENT_NAME, 'Limpiando recursos del componente...');
      
      stopMediaStream();  // Libera micrófono
      
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        Logger.debug(COMPONENT_NAME, 'WebSocket cerrado y referencia limpiada');
      }
    };
  }, []); // Dependencias vacías = solo se ejecuta una vez al montar

  // ═══════════════════════════════════════════════════════════════════════════════════
  // MANEJO DE MENSAJES WEBSOCKET (PRESERVADO PARA FUTURA REACTIVACIÓN)
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /*
  FUNCIÓN COMENTADA PARA PROCESAMIENTO DE MENSAJES EN TIEMPO REAL:
  
  Este código manejaba respuestas del backend cuando enviábamos audio via WebSocket.
  Está preservado para documentar cómo funcionaba el sistema original.
  
  const handleWebSocketMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const message = processIncomingMessage(data);
      
      // Diferentes tipos de respuesta del backend:
      switch (message.type) {
        case 'text':
          // Transcripción pura de voz a texto
          setTranscript(message.text);
          Logger.info(COMPONENT_NAME, 'Transcripción recibida', message.text);
          break;
          
        case 'audio':
          // Audio procesado con posible transcripción
          if (message.text) setTranscript(message.text);
          if (message.audio) handleMessageActions(message);
          break;
          
        case 'error':
          // Error del backend (formato no soportado, etc.)
          Logger.error(COMPONENT_NAME, 'Error del servidor', message);
          setError(message.text);
          break;
          
        case 'connection':
          // Estado de conexión actualizado
          setIsConnected(message.status === 'connected');
          break;
          
        default:
          Logger.warn(COMPONENT_NAME, 'Tipo de mensaje no manejado', message);
      }
    } catch (error) {
      Logger.error(COMPONENT_NAME, 'Error al procesar mensaje WebSocket', error);
    }
  };
  */

  // ═══════════════════════════════════════════════════════════════════════════════════
  // GESTIÓN DE STREAM DE MEDIA - LIBERACIÓN DE RECURSOS DEL MICRÓFONO
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * FUNCIÓN CRÍTICA: stopMediaStream()
   * 
   * Esta función es esencial para UX en dispositivos móviles:
   * 
   * PROBLEMAS QUE RESUELVE:
   * 1. LED DE GRABACIÓN: Sin esto, queda prendido permanentemente
   * 2. PERMISOS: El navegador piensa que seguimos usando el micrófono
   * 3. BATERÍA: MediaStream activo consume energía continuamente
   * 4. OTROS APPS: Pueden no poder acceder al micrófono
   * 
   * TECHNICAL DETAILS:
   * - getTracks() devuelve array de AudioTrack objects
   * - stop() en cada track libera el hardware
   * - streamRef.current = null limpia la referencia
   */
  const stopMediaStream = () => {
    if (streamRef.current) {
      Logger.debug(COMPONENT_NAME, 'Liberando acceso al micrófono...');
      
      // Para cada track de audio en el stream
      streamRef.current.getTracks().forEach(track => {
        track.stop();  // Liberar hardware del micrófono
        Logger.debug(COMPONENT_NAME, `Track ${track.kind} liberado`);
      });
      
      streamRef.current = null;  // Limpiar referencia
      Logger.info(COMPONENT_NAME, 'MediaStream liberado completamente');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════════
  // INICIO DE GRABACIÓN - CAPTURA DE AUDIO DESDE MICRÓFONO
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * FLUJO COMPLETO DE INICIO DE GRABACIÓN:
   * 
   * 1. LIMPIEZA PREVIA: Eliminar errores anteriores
   * 2. PERMISOS: Solicitar acceso al micrófono (getUserMedia)
   * 3. CONFIGURACIÓN: Crear MediaRecorder con settings optimizados
   * 4. EVENTOS: Configurar handlers para recolectar datos
   * 5. INICIO: Activar grabación con chunks regulares
   * 6. UI UPDATE: Cambiar estado visual para feedback
   * 
   * CASOS EDGE QUE MANEJAMOS:
   * - Usuario deniega permisos → Error específico con instrucciones
   * - Micrófono no disponible → Hardware error con troubleshooting
   * - Formato no soportado → Fallback o mensaje técnico
   * - Multiple attempts → Prevención de grabaciones concurrentes
   */
  const startRecording = async () => {
    try {
      // Limpieza previa de errores para UX clara
      setError(null);
      Logger.info(COMPONENT_NAME, 'Iniciando proceso de grabación...');
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // SOLICITUD DE ACCESO AL MICRÓFONO
      // ═══════════════════════════════════════════════════════════════════════════════
      
      /**
       * getAudioStream() es nuestro wrapper de getUserMedia que:
       * 
       * 1. Solicita permisos de micrófono al usuario
       * 2. Configura constrains de audio optimizados (sample rate, etc.)
       * 3. Maneja errores específicos del navegador
       * 4. Detecta si hay hardware de audio disponible
       * 
       * ERRORES COMUNES:
       * - NotAllowedError: Usuario denegó permisos
       * - NotFoundError: No hay micrófono conectado
       * - NotReadableError: Micrófono siendo usado por otra app
       * - OverconstrainedError: Configuración no soportada
       */
      const stream = await getAudioStream();
      streamRef.current = stream;
      Logger.debug(COMPONENT_NAME, 'Stream de audio obtenido exitosamente');
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // CONFIGURACIÓN DEL MEDIA RECORDER
      // ═══════════════════════════════════════════════════════════════════════════════
      
      /**
       * createAudioRecorder() configura MediaRecorder con:
       * 
       * - Format: WebM (mejor compresión, amplio soporte)
       * - Codec: Opus (excelente para voz)
       * - Bitrate: Optimizado para speech recognition
       * - Error handling: Fallbacks para navegadores antiguos
       */
      const mediaRecorder = createAudioRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Reiniciar array de chunks para nueva grabación
      audioChunksRef.current = [];
      Logger.debug(COMPONENT_NAME, 'MediaRecorder configurado, iniciando captura...');

      // ═══════════════════════════════════════════════════════════════════════════════
      // CONFIGURACIÓN DE EVENTOS DEL MEDIA RECORDER
      // ═══════════════════════════════════════════════════════════════════════════════
      
      /**
       * EVENTO: ondataavailable
       * 
       * Se dispara periódicamente (cada 1000ms según start() más abajo)
       * con chunks de audio codificado. Es crítico verificar que
       * event.data.size > 0 porque a veces llegan chunks vacíos.
       */
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          Logger.debug(COMPONENT_NAME, `Chunk de audio recibido: ${event.data.size} bytes`);
        } else {
          Logger.warn(COMPONENT_NAME, 'Chunk de audio vacío recibido');
        }
      };

      /**
       * EVENTO: onstop
       * 
       * Se ejecuta cuando llamamos stop() en el MediaRecorder.
       * Aquí combinamos todos los chunks en un Blob final y
       * lo enviamos para procesamiento.
       */
      mediaRecorder.onstop = async () => {
        try {
          Logger.info(COMPONENT_NAME, `Grabación finalizada. Procesando ${audioChunksRef.current.length} chunks...`);
          
          // Combinar todos los chunks en un Blob de audio WebM
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          Logger.debug(COMPONENT_NAME, `Audio final: ${(audioBlob.size / 1024).toFixed(2)} KB`);
          
          // Enviar para procesamiento (creación de URL + envío al backend)
          await processRecording(audioBlob);
          
        } catch (err) {
          Logger.error(COMPONENT_NAME, 'Error al procesar grabación', err);
          setError('Error al procesar la grabación de audio');
        }
      };

      // ═══════════════════════════════════════════════════════════════════════════════
      // INICIO DE GRABACIÓN REAL
      // ═══════════════════════════════════════════════════════════════════════════════
      
      /**
       * start(1000): Enviar chunks cada 1 segundo
       * 
       * ¿Por qué 1000ms?
       * - Latencia aceptable para feedback en tiempo real
       * - Chunks no demasiado pequeños (overhead de procesamiento)
       * - Chunks no demasiado grandes (delay perceptible)
       * - Balance entre calidad y responsividad
       */
      mediaRecorder.start(1000);
      setIsRecording(true);
      
      Logger.info(COMPONENT_NAME, 'Grabación iniciada exitosamente');
      
    } catch (err) {
      // ═══════════════════════════════════════════════════════════════════════════════
      // MANEJO DE ERRORES DE GRABACIÓN
      // ═══════════════════════════════════════════════════════════════════════════════
      
      Logger.error(COMPONENT_NAME, 'Error al iniciar grabación', {
        error: err.message,
        name: err.name,
        code: err.code
      });
      
      /**
       * TRADUCCIÓN DE ERRORES TÉCNICOS A MENSAJES USER-FRIENDLY:
       * 
       * Los errores de getUserMedia tienen nombres específicos pero
       * confusos para usuarios normales. Los traducimos a instrucciones
       * actionables.
       */
      let userMessage = `Error al acceder al micrófono: ${err.message}`;
      
      // Mensajes específicos para errores comunes
      if (err.name === 'NotAllowedError') {
        userMessage = 'Permisos de micrófono denegados. Por favor, permite el acceso al micrófono y recarga la página.';
      } else if (err.name === 'NotFoundError') {
        userMessage = 'No se encontró micrófono. Verifica que tienes un micrófono conectado.';
      } else if (err.name === 'NotReadableError') {
        userMessage = 'El micrófono está siendo usado por otra aplicación. Cierra otras apps que usen audio.';
      }
      
      setError(userMessage);
      setIsRecording(false);  // Asegurar que UI no quede en estado inconsistente
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════════
  // DETENCIÓN DE GRABACIÓN - FINALIZACIÓN LIMPIA DEL PROCESO
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * FUNCIÓN CRÍTICA: stopRecording()
   * 
   * Esta función debe ejecutarse de forma robusta porque:
   * 1. Libera recursos del micrófono (crítico en móviles)
   * 2. Dispara el procesamiento del audio grabado
   * 3. Actualiza UI para mostrar estado correcto
   * 
   * VALIDACIONES IMPORTANTES:
   * - Verificar que realmente estamos grabando
   * - Verificar que MediaRecorder existe y está activo
   * - Asegurar que el cleanup se ejecuta siempre
   */
  const stopRecording = () => {
    // Validación de estado - prevenir llamadas múltiples o erróneas
    if (mediaRecorderRef.current && isRecording) {
      Logger.info(COMPONENT_NAME, 'Deteniendo grabación...');
      
      /**
       * ORDEN IMPORTANTE:
       * 1. stop() en MediaRecorder → dispara evento onstop → processRecording()
       * 2. stopMediaStream() → libera hardware del micrófono
       * 3. setIsRecording(false) → actualiza UI
       */
      
      // Detener grabación (esto dispara mediaRecorder.onstop)
      mediaRecorderRef.current.stop();
      
      // Liberar acceso al micrófono inmediatamente
      stopMediaStream();
      
      // Actualizar estado UI
      setIsRecording(false);
      
      Logger.info(COMPONENT_NAME, 'Grabación detenida exitosamente');
    } else {
      // Log para debugging - no debería pasar en uso normal
      Logger.warn(COMPONENT_NAME, 'stopRecording llamado pero no hay grabación activa', {
        hasMediaRecorder: !!mediaRecorderRef.current,
        isRecording: isRecording
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════════
  // PROCESAMIENTO DE GRABACIÓN - CREACIÓN DE PREVIEW Y ENVÍO AL BACKEND
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * FLUJO DE PROCESAMIENTO POST-GRABACIÓN:
   * 
   * 1. CREACIÓN DE URL: Generar blob URL para preview del usuario
   * 2. ENVÍO AL BACKEND: Transmitir via WebSocket para transcripción
   * 3. MANEJO DE ERRORES: Feedback claro si algo falla
   * 
   * NOTA ACTUAL: WebSocket deshabilitado, pero preview funciona
   * Esta función está preparada para reactivación del servicio completo.
   */
  const processRecording = async (audioBlob) => {
    try {
      Logger.info(COMPONENT_NAME, `Procesando grabación de ${(audioBlob.size / 1024).toFixed(2)} KB`);
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // GENERACIÓN DE URL PARA PREVIEW
      // ═══════════════════════════════════════════════════════════════════════════════
      
      /**
       * createObjectURL() crea una URL temporal que permite:
       * 1. Mostrar player de audio para que usuario escuche su grabación
       * 2. Confirmar que la grabación fue exitosa
       * 3. Debugging de problemas de audio (silencio, distorsión, etc.)
       * 
       * IMPORTANTE: Esta URL debe liberarse con revokeObjectURL() eventualmente
       * para prevenir memory leaks, pero React maneja esto automáticamente
       * cuando el componente se desmonta.
       */
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      Logger.debug(COMPONENT_NAME, 'URL de preview generada exitosamente');
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // ENVÍO AL BACKEND VIA WEBSOCKET (ACTUALMENTE DESHABILITADO)
      // ═══════════════════════════════════════════════════════════════════════════════
      
      /**
       * EN LA VERSIÓN COMPLETA, aquí enviaríamos el audioBlob al backend:
       * 
       * 1. Verificar que WebSocket está conectado
       * 2. Enviar blob binario via send()
       * 3. Backend procesaría con speech-to-text
       * 4. Respuesta llegaría via handleWebSocketMessage
       * 5. setTranscript() se actualizaría con el resultado
       */
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Esta sección se ejecutaría si el WebSocket estuviera activo
        wsRef.current.send(audioBlob);
        Logger.info(COMPONENT_NAME, 'Audio enviado para procesamiento en tiempo real');
      } else {
        // Estado actual: servicio deshabilitado
        Logger.warn(COMPONENT_NAME, 'WebSocket no disponible - procesamiento de audio deshabilitado');
        
        /**
         * OPCIONES FUTURAS PARA PROCESAMIENTO SIN WEBSOCKET:
         * 1. Upload via FormData a endpoint REST
         * 2. Conversión a base64 y envío via JSON
         * 3. Procesamiento local con Web Speech API
         * 4. Integración con servicios externos (Google Speech, etc.)
         */
        throw new Error('Servicio de procesamiento de audio no disponible en esta versión optimizada');
      }
      
    } catch (err) {
      Logger.error(COMPONENT_NAME, 'Error al procesar audio', {
        error: err.message,
        blobSize: audioBlob?.size,
        blobType: audioBlob?.type
      });
      
      /**
       * MENSAJES DE ERROR CONTEXTUALES:
       * Diferenciamos entre problemas técnicos y limitaciones de servicio
       */
      let userMessage = `Error al procesar el audio: ${err.message}`;
      
      if (err.message.includes('no disponible')) {
        userMessage = 'El servicio de transcripción de audio está temporalmente deshabilitado. El audio se guardó para preview.';
      }
      
      setError(userMessage);
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════════════════
  // UTILIDAD DE LIMPIEZA DE ERRORES
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * Función simple pero importante para UX:
   * Permite al usuario limpiar mensajes de error manualmente
   * sin tener que recargar o hacer otra acción.
   */
  const clearError = () => {
    setError(null);
    Logger.debug(COMPONENT_NAME, 'Error limpiado por usuario');
  };

  // ═══════════════════════════════════════════════════════════════════════════════════
  // RENDERIZADO DE LA INTERFAZ - COMPONENTE UI PARA GRABACIÓN DE VOZ
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * ESTRUCTURA DE LA UI:
   * 
   * 1. CARD CONTAINER: Bootstrap card consistente con otros componentes
   * 2. HEADER: Título con ícono de micrófono
   * 3. ERROR DISPLAY: Alert dismissible para problemas
   * 4. CONNECTION STATUS: Indicador visual de disponibilidad del servicio
   * 5. RECORD BUTTON: Botón circular grande para grabación (diseño móvil-friendly)
   * 6. STATUS TEXT: Feedback textual del estado actual
   * 7. AUDIO PREVIEW: Player para escuchar la grabación
   * 8. TRANSCRIPT DISPLAY: Resultado de transcripción (cuando esté disponible)
   * 
   * CONSIDERACIONES DE ACCESIBILIDAD:
   * - Botón grande para fácil targeting en móviles
   * - Estados visuales claros (grabando vs detenido)
   * - Feedback audio/visual para usuarios con discapacidades
   * - Controles estándar de HTML5 audio
   */
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        {/* ══════════════════════════════════════════════════════════════════════════════ */}
        {/* HEADER DEL COMPONENTE - TÍTULO CON ICONOGRAFÍA DESCRIPTIVA */}
        {/* ══════════════════════════════════════════════════════════════════════════════ */}
        
        <h5 className="card-title d-flex align-items-center">
          {/*
            ÍCONO: bi-mic es universalmente reconocido para audio
            - Representa función de micrófono/grabación
            - Consistent con otros iconos del sistema
            - Accessible para screen readers
          */}
          <i className="bi bi-mic me-2"></i>
          Grabador de Voz
        </h5>
        
        {/* ══════════════════════════════════════════════════════════════════════════════ */}
        {/* CONTENEDOR PRINCIPAL - LAYOUT VERTICAL CENTRADO */}
        {/* ══════════════════════════════════════════════════════════════════════════════ */}
        
        <div className="d-flex flex-column align-items-center gap-3 py-3">
          
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* DISPLAY DE ERRORES - FEEDBACK CLARO CON OPCIÓN DE DISMISSAL */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          
          {error && (
            /*
              ErrorMessage es un componente común que maneja:
              - Styling consistente de errores
              - Botón X para cerrar
              - Iconografía apropiada
              - ARIA roles para accesibilidad
            */
            <ErrorMessage 
              message={error} 
              onDismiss={clearError}
              type="warning"  // Tipo warning porque el servicio está intencionalmente deshabilitado
            />
          )}

          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* INDICADOR DE ESTADO DE CONEXIÓN */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          
          <div className="d-flex align-items-center mb-2">
            {/*
              ConnectionStatus muestra:
              - Punto verde/rojo para conexión
              - Texto descriptivo del estado
              - Tooltip con detalles técnicos
              
              En el estado actual, siempre mostrará "desconectado"
              porque los servicios de audio están deshabilitados.
            */}
            <ConnectionStatus 
              isConnected={isConnected}
              label="Servicio de Audio"
              helpText="Estado actual: Servicios de audio deshabilitados para optimización de servidor"
            />
          </div>
          
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* BOTÓN PRINCIPAL DE GRABACIÓN - INTERFAZ TOUCH-FRIENDLY */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'} btn-lg rounded-circle d-flex align-items-center justify-content-center`}
            disabled={!isConnected}  // Deshabilitado cuando no hay servicio
            style={{ width: '80px', height: '80px' }}
            aria-label={isRecording ? 'Detener grabación' : 'Iniciar grabación'}
          >
            {/*
              ICONOGRAFÍA DINÁMICA:
              - bi-mic: Estado normal, listo para grabar
              - bi-stop-fill: Grabando, click para detener
              - fs-4: Tamaño grande para visibilidad
              
              COLORES:
              - btn-primary (azul): Estado normal
              - btn-danger (rojo): Grabando (estándar UI para grabación)
            */}
            <i className={`bi ${isRecording ? 'bi-stop-fill' : 'bi-mic'} fs-4`}></i>
          </button>

          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* TEXTO DE ESTADO - FEEDBACK TEXTUAL DEL PROCESO */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          
          <div className="text-muted small text-center">
            {isRecording ? (
              /*
                ESTADO GRABANDO:
                - Color rojo para consistency con botón
                - Texto animado opcional (pulsing)
                - Instrucciones claras
              */
              <span className="text-danger">
                <i className="bi bi-record-circle me-1"></i>
                Grabando... Haz clic en el botón para detener
              </span>
            ) : !isConnected ? (
              /*
                ESTADO DESCONECTADO:
                - Explicación clara de por qué no funciona
                - Información sobre cuándo estará disponible
              */
              <span className="text-warning">
                <i className="bi bi-exclamation-triangle me-1"></i>
                Servicio temporalmente no disponible
              </span>
            ) : (
              /*
                ESTADO NORMAL:
                - Instrucciones claras para usar
                - Hint sobre funcionalidad
              */
              <span>
                <i className="bi bi-info-circle me-1"></i>
                Haz clic para iniciar grabación de voz
              </span>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* PREVIEW DE AUDIO - PLAYER PARA ESCUCHAR GRABACIÓN */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          
          {audioUrl && (
            <div className="w-100 mt-3">
              {/*
                AUDIO PLAYER NATIVO:
                - controls: Muestra play, pause, seeking, volume
                - w-100: Ancho completo para mejor usabilidad
                - src: Blob URL de la grabación
                
                TRACK ELEMENT:
                - Requerido para accesibilidad
                - Placeholder para captions futuras
                
                BENEFICIOS:
                - Usuario puede verificar que grabó correctamente
                - Útil para debugging de problemas de audio
                - Preview antes de procesar (si servicio estuviera activo)
              */}
              <audio controls className="w-100" src={audioUrl}>
                <track kind="captions" srcLang="es" label="Spanish captions" />
                Tu navegador no soporta el elemento de audio.
              </audio>
              
              <div className="mt-2 text-center text-muted small">
                <i className="bi bi-headphones me-1"></i>
                Grabación completada - Puedes escuchar tu audio arriba
              </div>
            </div>
          )}
          
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* DISPLAY DE TRANSCRIPCIÓN - RESULTADO DEL PROCESAMIENTO */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          
          {transcript && (
            <div className="w-100 mt-3">
              {/*
                TRANSCRIPCIÓN RESULT:
                - alert-info: Color azul para información positiva
                - w-100: Ancho completo para legibilidad
                - Texto destacado para enfatizar el resultado
                
                ACTUALMENTE NO SE USA porque servicios de audio están deshabilitados,
                pero está preparado para cuando se reactive el sistema.
              */}
              <div className="alert alert-info">
                <div className="d-flex align-items-start">
                  <i className="bi bi-chat-text me-2 mt-1"></i>
                  <div>
                    <strong>Transcripción:</strong>
                    <div className="mt-1">{transcript}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* INFORMACIÓN ADICIONAL - CONTEXTO PARA EL USUARIO */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          
          {!isConnected && (
            <div className="mt-3 p-3 bg-light rounded w-100">
              <h6 className="small mb-2">
                <i className="bi bi-info-circle me-1"></i>
                Información sobre servicios de audio:
              </h6>
              <ul className="small text-muted mb-0 ps-3">
                <li>Los servicios de transcripción están temporalmente deshabilitados</li>
                <li>Puedes grabar y escuchar audio localmente</li>
                <li>La transcripción automática se activará en futuras versiones</li>
                <li>Para comunicación inmediata, usa el chat de texto o imágenes ASL</li>
              </ul>
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
 * VOICERECORDER - Componente para grabación y procesamiento de audio
 * 
 * FUNCIONALIDADES IMPLEMENTADAS:
 * ✅ Solicitud de permisos de micrófono con manejo robusto de errores
 * ✅ Grabación de audio con MediaRecorder API nativa
 * ✅ Vista previa de audio con player HTML5
 * ✅ Gestión completa de recursos (cleanup de streams)
 * ✅ Estados visuales claros (grabando/detenido/error)
 * ✅ Accesibilidad completa con ARIA labels
 * ✅ Responsive design para dispositivos móviles
 * 
 * FUNCIONALIDADES PREPARADAS (DESHABILITADAS):
 * 🔄 Conexión WebSocket para transcripción en tiempo real
 * 🔄 Envío de audio al backend para speech-to-text
 * 🔄 Display de transcripciones automáticas
 * 🔄 Integración con sistemas de IA de procesamiento de voz
 * 
 * CASOS DE USO ACTUALES:
 * - Grabación local de notas de voz
 * - Testing de funcionalidad de micrófono
 * - Preview de calidad de audio del usuario
 * - Preparación para futura integración de transcripción
 * 
 * CASOS DE USO FUTUROS (CUANDO SE REACTIVE):
 * - Transcripción automática de voz a texto
 * - Comunicación bidireccional en aplicaciones ASL
 * - Herramientas educativas para pronunciación
 * - Sistemas de accesibilidad avanzados
 * 
 * INTEGRACIONES:
 * - utils/media-utils.js: Gestión de MediaStream y MediaRecorder
 * - utils/debug-utils.js: Sistema de logging detallado
 * - services/api.js: Verificación de estado del servidor
 * - components/common: ConnectionStatus y ErrorMessage
 * 
 * CONSIDERACIONES TÉCNICAS:
 * - Formato de salida: WebM con codec Opus (mejor para voz)
 * - Chunks de 1 segundo para balance latencia/calidad
 * - Gestión completa de memoria (URL.createObjectURL cleanup)
 * - Permisos de micrófono manejados gracefully
 * - Compatible con navegadores modernos (Chrome 47+, Firefox 29+)
 * 
 * OPTIMIZACIONES APLICADAS:
 * - Servicios de backend deshabilitados para reducir carga del servidor
 * - UI adaptativa que comunica claramente las limitaciones actuales
 * - Código preparado para reactivación sin refactoring mayor
 * - Error handling específico para cada tipo de problema
 * 
 * REACTIVACIÓN DE SERVICIOS:
 * Para habilitar transcripción completa:
 * 1. Descomentar código de WebSocket en setupWebSocket()
 * 2. Implementar endpoint /ws/audio en el backend
 * 3. Agregar handleWebSocketMessage() funcional
 * 4. Configurar servicio de speech-to-text (Google Cloud Speech, etc.)
 * 5. Actualizar ConnectionStatus para mostrar estado real
 */
export default VoiceRecorder;