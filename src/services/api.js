import { Logger, safeApiCall, createMonitoredWebSocket } from '../utils/debug-utils';
import { API_BASE_URL, API_ROUTES, COMPONENT_NAMES } from '../config/constants';

/**
 * Clase para manejar las operaciones de la API
 */
class ApiService {
  static COMPONENT_NAME = COMPONENT_NAMES.API_SERVICE;

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
      return data && (data.status === 'connected' || data.status === 'ok');
    } catch (error) {
      Logger.error(this.COMPONENT_NAME, `Error al verificar conexión: ${error.message}`, error);
      console.error('Error completo:', error);
      return false;
    }
  }

  /**
   * Crea una conexión WebSocket
   * @param {string} path - Ruta específica para la conexión WebSocket
   * @param {Object} handlers - Manejadores de eventos del WebSocket
   * @returns {WebSocket} - Instancia del WebSocket
   */
  static createWebSocketConnection(path, handlers) {
    try {
      let wsUrl = '';
      
      // Construir la URL del WebSocket correctamente
      if (API_BASE_URL.startsWith('https://')) {
        wsUrl = API_BASE_URL.replace('https://', 'wss://');
      } else if (API_BASE_URL.startsWith('http://')) {
        wsUrl = API_BASE_URL.replace('http://', 'ws://');
      } else {
        // Si no tiene protocolo, asumimos que es una URL relativa y usamos wss en producción
        wsUrl = window.location.protocol === 'https:' 
          ? `wss://${window.location.host}${API_BASE_URL}`
          : `ws://${window.location.host}${API_BASE_URL}`;
      }
      
      const wsEndpoint = `${wsUrl}${path}`;
      
      Logger.debug(this.COMPONENT_NAME, `Creando conexión WebSocket a: ${wsEndpoint}`);
      Logger.info(this.COMPONENT_NAME, `API_BASE_URL: ${API_BASE_URL}, path: ${path}`);
      
      const wsInstance = createMonitoredWebSocket(wsEndpoint, this.COMPONENT_NAME);
      
      if (handlers.onOpen) wsInstance.onopen = handlers.onOpen;
      if (handlers.onMessage) wsInstance.onmessage = handlers.onMessage;
      if (handlers.onClose) wsInstance.onclose = handlers.onClose;
      if (handlers.onError) wsInstance.onerror = handlers.onError;
      
      return wsInstance;
    } catch (error) {
      Logger.error(this.COMPONENT_NAME, 'Error al crear WebSocket: ${error.message}', error);
      console.error('Error completo al crear WebSocket:', error);
      throw error;
    }
  }

  /**
   * Analiza una imagen de lenguaje de señas
   * @param {string} base64Image - Imagen en formato base64
   * @returns {Promise<Object>} - Resultados del análisis
   */
  static async analyzeSignLanguageImage(base64Image) {
    const endpoint = `${API_BASE_URL}${API_ROUTES.ANALYZE_IMAGE}`;
    Logger.debug(this.COMPONENT_NAME, `Enviando imagen al servidor: ${endpoint}`);
    
    return await safeApiCall(
      async () => {
        const requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image }),
        };
                  
        const response = await fetch(endpoint, requestOptions);
        if (!response.ok) {
          throw new Error('Error del servidor: ${response.status}');
        }
                  
        const responseData = await response.json();
        if (!responseData) {
          throw new Error('Respuesta vacía del servidor');
        }
                  
        return responseData;
      },
      this.COMPONENT_NAME,
      'Error al analizar imagen'
    );
  }

  /**
   * Procesa una imagen genérica
   * @param {File} imageFile - Archivo de imagen
   * @returns {Promise<Object>} - Resultados del procesamiento
   */
  static async processImage(imageFile) {
    const endpoint = `${API_BASE_URL}${API_ROUTES.IMAGE_PROCESSING}`;
    Logger.debug(this.COMPONENT_NAME, `Procesando imagen: ${endpoint}`);
    
    return await safeApiCall(
      async () => {
        const formData = new FormData();
        formData.append('file', imageFile);

        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Error del servidor: ${response.status}');
        }

        const responseData = await response.json();
        return responseData;
      },
      this.COMPONENT_NAME,
      'Error al procesar imagen'
    );
  }

  /**
   * Envía un audio para procesamiento
   * @param {Blob} audioBlob - Blob de audio
   * @returns {Promise<Object>} - Resultados del procesamiento
   */
  static async processAudio(audioBlob) {
    const endpoint = `${API_BASE_URL}${API_ROUTES.VOICE_PROCESSING}`;
    Logger.debug(this.COMPONENT_NAME, `Procesando audio: ${endpoint}`);
    
    return await safeApiCall(
      async () => {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');

        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Error del servidor: ${response.status}');
        }

        const responseData = await response.json();
        return responseData;
      },
      this.COMPONENT_NAME,
      'Error al procesar audio'
    );
  }
}

export default ApiService; 