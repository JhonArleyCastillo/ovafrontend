import Logger, { safeApiCall, createMonitoredWebSocket } from '../utils/debug-utils';
import { WebSocketManager } from '../utils/websocket-manager';
import { API_BASE_URL, API_ROUTES, WS_ROUTES } from '../config/api.routes';
import { COMPONENT_NAMES } from '../config/constants';
import { blobToBase64 } from '../utils/media-utils';
import { createImageMessage, createTextMessage, createAudioMessage } from '../utils/message-utils';

/**
 * Clase para manejar las operaciones de la API
 */
class ApiService {
  static COMPONENT_NAME = COMPONENT_NAMES.API_SERVICE;
  static WS_ROUTES = WS_ROUTES;

  /**
   * Verifica el estado de la conexión con el servidor
   * @returns {Promise<boolean>} - true si la conexión es exitosa
   */
  static async checkServerStatus() {
    const statusUrl = `${API_BASE_URL}${API_ROUTES.STATUS}`;
    Logger.debug(this.COMPONENT_NAME, `Verificando estado del servidor en: ${statusUrl}`);
        
    try {
      Logger.info(this.COMPONENT_NAME, `Intentando conexión a: ${statusUrl}`);
      const response = await fetch(statusUrl, { 
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        Logger.error(this.COMPONENT_NAME, `Error de conexión: ${response.status} - ${response.statusText}`);
        throw new Error(`Error de conexión: ${response.status} - ${response.statusText}`);
      }
            
      const data = await response.json();
      Logger.info(this.COMPONENT_NAME, `Respuesta del servidor: ${JSON.stringify(data)}`);
      return data && (data.status === 'connected' || data.status === 'ok' || data.status === 'online');
    } catch (error) {
      Logger.error(this.COMPONENT_NAME, `Error al verificar conexión: ${error.message}`, error);
      return false;
    }
  }
  /**
   * Crea una conexión WebSocket con manejo robusto de estado y retry automático
   * @param {string} url - Ruta específica para la conexión WebSocket (no usado, se gestiona internamente)
   * @param {Object} handlers - Manejadores de eventos del WebSocket
   * @returns {Promise<Object>} - Wrapper del WebSocketManager con API compatible
   */
  static async createRobustWebSocketConnection(url, handlers = {}) {
    try {
      Logger.info(this.COMPONENT_NAME, '🚀 Iniciando conexión WebSocket con manejo robusto');
      
      // Crear instancia del WebSocketManager
      const wsManager = new WebSocketManager(this.COMPONENT_NAME);
      
      // Intentar conectar con los handlers proporcionados
      await wsManager.connect({
        onOpen: (event) => {
          Logger.info(this.COMPONENT_NAME, '✅ WebSocket conectado exitosamente');
          if (handlers.onOpen) {
            handlers.onOpen(event);
          }
        },
        
        onMessage: (event) => {
          Logger.debug(this.COMPONENT_NAME, `📨 Mensaje recibido: ${event.data?.substring(0, 100)}...`);
          if (handlers.onMessage) {
            handlers.onMessage(event);
          }
        },
        
        onClose: (event) => {
          const closeInfo = {
            code: event.code || 'N/A',
            reason: event.reason || 'Sin razón',
            wasClean: event.wasClean || false
          };
          Logger.warn(this.COMPONENT_NAME, `🔌 WebSocket cerrado: ${JSON.stringify(closeInfo)}`);
          if (handlers.onClose) {
            handlers.onClose(event);
          }
        },
        
        onError: (error) => {
          // Solo loggear el error si no es durante el proceso de conexión inicial
          if (wsManager.getConnectionState() === 'connected') {
            Logger.error(this.COMPONENT_NAME, '❌ Error en WebSocket activo:', error);
          } else {
            Logger.debug(this.COMPONENT_NAME, '🔄 Error de conexión (se reintentará automáticamente):', error);
          }
          
          if (handlers.onError) {
            handlers.onError(error);
          }
        }
      });
      
      // Crear wrapper para compatibilidad con código existente
      const wsWrapper = {
        // Propiedades del WebSocket estándar
        get readyState() {
          return wsManager.isConnected() ? WebSocket.OPEN : WebSocket.CLOSED;
        },
        
        get url() {
          return wsManager.currentUrl || 'unknown';
        },
        
        // Métodos del WebSocket estándar
        send: (data) => {
          return wsManager.send(data);
        },
        
        close: (code, reason) => {
          wsManager.disconnect(code, reason);
        },
        
        // Métodos adicionales del manager
        restart: () => {
          wsManager.restart();
        },
        
        getConnectionState: () => {
          return wsManager.getConnectionState();
        },
        
        isConnected: () => {
          return wsManager.isConnected();
        },
        
        // Referencia al manager para acceso avanzado
        _manager: wsManager,
        
        // Función de limpieza para compatibilidad
        cleanupListeners: () => {
          wsManager.cleanup();
        }
      };
      
      Logger.info(this.COMPONENT_NAME, '🎯 WebSocket wrapper creado exitosamente');
      return wsWrapper;
      
    } catch (error) {
      Logger.error(this.COMPONENT_NAME, `❌ Error al crear conexión WebSocket robusta: ${error.message}`, error);
      
      // Retornar un objeto fallback que maneje errores graciosamente
      return {
        readyState: WebSocket.CLOSED,
        url: 'failed',
        send: () => {
          Logger.warn(this.COMPONENT_NAME, '⚠️ Intento de envío en WebSocket fallido');
          return false;
        },
        close: () => {
          Logger.debug(this.COMPONENT_NAME, '🔌 Cierre solicitado en WebSocket fallido');
        },
        restart: () => {
          Logger.info(this.COMPONENT_NAME, '🔄 Reinicio solicitado - creando nueva conexión');
          return this.createRobustWebSocketConnection(url, handlers);
        },
        getConnectionState: () => 'failed',
        isConnected: () => false,
        cleanupListeners: () => {}
      };
    }
  }

  /**
   * Crea una conexión WebSocket con manejo robusto de estado
   * @param {string} url - Ruta específica para la conexión WebSocket
   * @param {Object} handlers - Manejadores de eventos del WebSocket
   * @returns {WebSocket} - Instancia del WebSocket
   */
  static createWebSocketConnection(url, handlers = {}) {
    try {
      // Construir la URL del WebSocket correctamente
      let wsUrl = '';
      
      if (url.startsWith('ws://') || url.startsWith('wss://')) {
        wsUrl = url;
      } else if (API_BASE_URL.startsWith('https://')) {
        wsUrl = API_BASE_URL.replace('https://', 'wss://');
        wsUrl += url;
      } else if (API_BASE_URL.startsWith('http://')) {
        wsUrl = API_BASE_URL.replace('http://', 'ws://');
        wsUrl += url;
      } else {
        // Si no tiene protocolo, asumimos que es una URL relativa y usamos wss en producción
        wsUrl = window.location.protocol === 'https:' 
          ? `wss://${window.location.host}${url}`
          : `ws://${window.location.host}${url}`;
      }
      
      Logger.debug(this.COMPONENT_NAME, `Creando conexión WebSocket a: ${wsUrl}`);
      
      const wsInstance = createMonitoredWebSocket(wsUrl, this.COMPONENT_NAME);
      
      // Configurar manejadores con logging mejorado
      if (handlers.onOpen) {
        wsInstance.onopen = (event) => {
          Logger.info(this.COMPONENT_NAME, `WebSocket conectado exitosamente a ${wsUrl}`);
          handlers.onOpen(event);
        };
      }
      
      if (handlers.onMessage) {
        wsInstance.onmessage = (event) => {
          Logger.debug(this.COMPONENT_NAME, `Mensaje recibido desde ${wsUrl}: ${event.data?.substring(0, 100)}...`);
          handlers.onMessage(event);
        };
      }
      
      if (handlers.onClose) {
        wsInstance.onclose = (event) => {
          const closeInfo = {
            code: event.code || 'N/A',
            reason: event.reason || 'Sin razón',
            wasClean: event.wasClean || false
          };
          Logger.warn(this.COMPONENT_NAME, `WebSocket cerrado: ${JSON.stringify(closeInfo)}`);
          handlers.onClose(event);
        };
      }
      
      if (handlers.onError) {
        wsInstance.onerror = (error) => {
          Logger.error(this.COMPONENT_NAME, `Error en WebSocket ${wsUrl}:`, error);
          handlers.onError(error);
        };
      }
      
      // Función de limpieza personalizada
      wsInstance.cleanupListeners = () => {
        Logger.debug(this.COMPONENT_NAME, `Limpiando listeners de WebSocket ${wsUrl}`);
        wsInstance.onopen = null;
        wsInstance.onmessage = null;
        wsInstance.onclose = null;
        wsInstance.onerror = null;
      };
      
      return wsInstance;
    } catch (error) {
      Logger.error(this.COMPONENT_NAME, `Error al crear WebSocket: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Método base para procesar imágenes (método interno)
   * @param {string|Blob|File} imageInput - Imagen para procesar (base64 o Blob/File)
   * @param {string} endpoint - Endpoint de la API
   * @param {string} logMessage - Mensaje para el registro
   * @param {string} errorMessage - Mensaje de error
   * @returns {Promise<Object>} - Resultados del procesamiento
   * @private
   */
  static async _processImageBase(imageInput, endpoint, logMessage, errorMessage) {
    Logger.debug(this.COMPONENT_NAME, `${logMessage}: ${endpoint}`);
    
    return await safeApiCall(
      async () => {
        let requestOptions;
        
        // Determinar el tipo de entrada y preparar la petición
        if (typeof imageInput === 'string' && imageInput.includes('base64')) {
          // Es una cadena base64, enviamos como JSON
          const base64Image = imageInput.split('base64,')[1] || imageInput;
          requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createImageMessage(base64Image)),
          };
        } else {
          // Es un Blob o File, enviamos como FormData
          const formData = new FormData();
          formData.append('file', imageInput);
          requestOptions = {
            method: 'POST',
            body: formData,
          };
        }
        
        const response = await fetch(endpoint, requestOptions);
        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.status}`);
        }
                  
        const responseData = await response.json();
        if (!responseData) {
          throw new Error('Respuesta vacía del servidor');
        }
                  
        return responseData;
      },
      this.COMPONENT_NAME,
      errorMessage
    );
  }

  // Flujo separado para lenguaje de señas eliminado: usamos solo processImage

  /**
   * Procesa una imagen genérica
   * @param {File|Blob|string} imageInput - Archivo de imagen o imagen base64
   * @returns {Promise<Object>} - Resultados del procesamiento
   */
  static async processImage(imageInput) {
  const endpoint = API_ROUTES.PROCESS_IMAGE;
    return this._processImageBase(
      imageInput, 
      endpoint, 
      'Procesando imagen', 
      'Error al procesar imagen'
    );
  }

  /**
   * Envía un audio para procesamiento
   * @param {Blob} audioBlob - Blob de audio
   * @returns {Promise<Object>} - Resultados del procesamiento
   */
  static async processAudio(audioBlob) {
    const endpoint = API_ROUTES.CHAT;
    Logger.debug(this.COMPONENT_NAME, `Procesando audio: ${endpoint}`);
    
    return await safeApiCall(
      async () => {
        // Usamos FormData para envío HTTP
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');

        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.status}`);
        }

        const responseData = await response.json();
        return responseData;
      },
      this.COMPONENT_NAME,
      'Error al procesar audio'
    );
  }
  
  /**
   * Método base para enviar datos por WebSocket
   * @param {WebSocket} ws - Conexión WebSocket activa
   * @param {Object|string} data - Datos a enviar
   * @param {string} errorMessage - Mensaje de error
   * @returns {boolean} - true si se envió correctamente
   * @private
   */
  static _sendToWebSocket(ws, data, errorMessage) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('La conexión WebSocket no está abierta');
    }

    try {
      if (typeof data === 'string') {
        ws.send(data);
      } else {
        ws.send(JSON.stringify(data));
      }
      return true;
    } catch (error) {
      Logger.error(this.COMPONENT_NAME, `${errorMessage}: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Envía un audio para procesamiento a través de WebSocket
   * @param {Blob} audioBlob - Blob de audio
   * @param {WebSocket} ws - Conexión WebSocket activa
   * @returns {Promise<boolean>} - true si se envió correctamente
   */
  static async sendAudioToWebSocket(audioBlob, ws) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('La conexión WebSocket no está abierta');
    }

    try {
      // Para WebSocket, podemos enviar el audioBlob directamente para binario
      // O codificarlo a base64 si queremos enviarlo como JSON
      if (ws.binaryType === 'arraybuffer') {
        return this._sendToWebSocket(ws, audioBlob, 'Error al enviar audio por WebSocket');
      } else {
        // Convertir a base64 para enviar como JSON
        const base64Audio = await blobToBase64(audioBlob);
        const audioMessage = createAudioMessage(base64Audio);
        return this._sendToWebSocket(ws, audioMessage, 'Error al enviar audio por WebSocket');
      }
    } catch (error) {
      Logger.error(this.COMPONENT_NAME, `Error al enviar audio por WebSocket: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Envía un mensaje de texto a través de WebSocket
   * @param {string} text - Texto del mensaje
   * @param {WebSocket} ws - Conexión WebSocket activa
   * @returns {boolean} - true si se envió correctamente
   */
  static sendTextToWebSocket(text, ws) {
    const textMessage = createTextMessage(text);
    return this._sendToWebSocket(ws, textMessage, 'Error al enviar texto por WebSocket');
  }
}

export default ApiService;