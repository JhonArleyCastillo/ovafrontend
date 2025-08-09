/**
 * Configuración avanzada de WebSocket con manejo robusto de conexiones
 * Incluye retry automático, detección de servidor y configuración por entornos
 */

import Logger from '../utils/debug-utils';

// Configuración de retry y timeout
export const WS_CONFIG = {
  // Tiempos de espera
  CONNECTION_TIMEOUT: 10000, // 10 segundos para timeout de conexión
  HEARTBEAT_INTERVAL: 30000, // 30 segundos entre heartbeats
  
  // Configuración de retry
  MAX_RETRY_ATTEMPTS: 5,
  INITIAL_RETRY_DELAY: 1000, // 1 segundo inicial
  MAX_RETRY_DELAY: 30000, // Máximo 30 segundos
  RETRY_BACKOFF_FACTOR: 2, // Factor exponencial
  
  // Estados de conexión
  CONNECTION_STATES: {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    RECONNECTING: 'reconnecting',
    FAILED: 'failed'
  },
  
  // Códigos de cierre conocidos
  CLOSE_CODES: {
    NORMAL: 1000,
    GOING_AWAY: 1001,
    PROTOCOL_ERROR: 1002,
    UNSUPPORTED_DATA: 1003,
    ABNORMAL_CLOSURE: 1006,
    INVALID_FRAME_PAYLOAD_DATA: 1007,
    POLICY_VIOLATION: 1008,
    MESSAGE_TOO_BIG: 1009,
    MISSING_EXTENSION: 1010,
    INTERNAL_ERROR: 1011,
    SERVICE_RESTART: 1012,
    TRY_AGAIN_LATER: 1013,
    BAD_GATEWAY: 1014,
    TLS_HANDSHAKE: 1015
  },
  
  // URLs por entorno
  ENDPOINTS: {
    development: {
      primary: 'ws://localhost:8000/api/chat',
      fallback: 'ws://127.0.0.1:8000/api/chat'
    },
    staging: {
      primary: 'wss://staging-api.ovaonline.tech/api/chat',
      fallback: 'wss://staging.ovaonline.tech/api/chat'
    },
    production: {
  primary: 'wss://www.api.ovaonline.tech/api/chat',
  fallback: 'wss://www.api.ovaonline.tech/api/chat'
    }
  }
};

/**
 * Clase para gestión avanzada de conexiones WebSocket
 */
export class WebSocketManager {
  constructor(componentName = 'WebSocketManager') {
    this.componentName = componentName;
    this.ws = null;
    this.currentUrl = null;
    this.retryCount = 0;
    this.retryTimer = null;
    this.heartbeatTimer = null;
    this.connectionState = WS_CONFIG.CONNECTION_STATES.DISCONNECTED;
    this.handlers = {};
    this.shouldReconnect = true;
    this.connectionTimeout = null;
    
    // Obtener URLs según el entorno
    const env = process.env.NODE_ENV || 'development';
    this.endpoints = WS_CONFIG.ENDPOINTS[env] || WS_CONFIG.ENDPOINTS.development;
    
    Logger.info(this.componentName, `WebSocket Manager inicializado para entorno: ${env}`);
  }

  /**
   * Verifica si el servidor está disponible antes de intentar conexión WebSocket
   * @param {string} wsUrl - URL del WebSocket
   * @returns {Promise<boolean>}
   */
  async checkServerAvailability(wsUrl) {
    try {
  // Derivar origen a partir de la URL WS (evitar reemplazos de path frágiles)
  const parsed = new URL(wsUrl);
  const httpProto = parsed.protocol === 'wss:' ? 'https:' : 'http:';
  const origin = `${httpProto}//${parsed.host}`;
  const healthUrl = `${origin}/chat/health`;
  const statusUrl = `${origin}/status`;
      
      // Intentar primero endpoint específico de WS
      Logger.debug(this.componentName, `Verificando disponibilidad WS health: ${healthUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
      
      let response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        Logger.info(this.componentName, `Servidor WS disponible en ${healthUrl}`);
        return true;
      } else {
        // Intentar con /status como respaldo
        Logger.warn(this.componentName, `WS health respondió ${response.status}. Probando ${statusUrl}`);
        const res2 = await fetch(statusUrl, { method: 'GET', cache: 'no-cache' });
        if (res2.ok) {
          Logger.info(this.componentName, `Servidor HTTP disponible en ${statusUrl}`);
          return true;
        }
        return false;
      }
    } catch (error) {
      Logger.warn(this.componentName, `Servidor no disponible: ${error.message}`);
      return false;
    }
  }

  /**
   * Calcula el delay para el próximo intento de conexión
   * @param {number} attempt - Número de intento actual
   * @returns {number} Delay en milisegundos
   */
  calculateRetryDelay(attempt) {
    const delay = Math.min(
      WS_CONFIG.INITIAL_RETRY_DELAY * Math.pow(WS_CONFIG.RETRY_BACKOFF_FACTOR, attempt),
      WS_CONFIG.MAX_RETRY_DELAY
    );
    
    // Agregar un poco de jitter para evitar thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * Conecta al WebSocket con retry automático
   * @param {Object} handlers - Manejadores de eventos
   * @returns {Promise<WebSocket>}
   */
  async connect(handlers = {}) {
    this.handlers = handlers;
    this.shouldReconnect = true;
    
    return this.attemptConnection();
  }

  /**
   * Intenta establecer conexión con retry automático
   * @param {boolean} isRetry - Si es un reintento
   * @returns {Promise<WebSocket>}
   */
  async attemptConnection(isRetry = false) {
    if (!this.shouldReconnect) {
      Logger.info(this.componentName, 'Conexión cancelada por usuario');
      return null;
    }

  // Construir candidatos de conexión: primary, fallback, y variante de path '/ws/chat'
  const candidates = [this.endpoints.primary, this.endpoints.fallback];
  const altPrimary = this.endpoints.primary.replace('/api/chat', '/ws/chat');
  if (!candidates.includes(altPrimary)) candidates.push(altPrimary);

  // Determinar qué URL usar (rotación por intento)
  const index = Math.min(this.retryCount, candidates.length - 1);
  const url = candidates[index];
    this.currentUrl = url;
    
    if (isRetry) {
      this.connectionState = WS_CONFIG.CONNECTION_STATES.RECONNECTING;
      Logger.info(this.componentName, `Reintentando conexión (${this.retryCount}/${WS_CONFIG.MAX_RETRY_ATTEMPTS}) a ${url}`);
    } else {
      this.connectionState = WS_CONFIG.CONNECTION_STATES.CONNECTING;
      Logger.info(this.componentName, `Iniciando conexión a ${url}`);
    }

    // Verificar disponibilidad del servidor primero
    const isServerAvailable = await this.checkServerAvailability(url);
    if (!isServerAvailable && this.retryCount < 2) {
      // Si el servidor no está disponible, incrementar contador y reintentar
      this.scheduleRetry();
      return null;
    }

    try {
      // Limpiar conexión anterior si existe
      this.cleanup();
      
      // Crear nueva conexión WebSocket
      this.ws = new WebSocket(url);
      
      // Configurar timeout de conexión
      this.connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          Logger.warn(this.componentName, 'Timeout de conexión WebSocket');
          this.ws.close();
          this.scheduleRetry();
        }
      }, WS_CONFIG.CONNECTION_TIMEOUT);

      // Configurar event listeners
      this.setupEventListeners();
      
      return new Promise((resolve, reject) => {
        this.ws.addEventListener('open', () => {
          resolve(this.ws);
        }, { once: true });
        
        this.ws.addEventListener('error', () => {
          reject(new Error('Error en conexión WebSocket'));
        }, { once: true });
      });
      
    } catch (error) {
      Logger.error(this.componentName, `Error al crear WebSocket: ${error.message}`, error);
      this.scheduleRetry();
      return null;
    }
  }

  /**
   * Configura los event listeners del WebSocket
   */
  setupEventListeners() {
    if (!this.ws) return;

    this.ws.onopen = (event) => {
      this.onConnectionOpen(event);
    };

    this.ws.onmessage = (event) => {
      this.onMessage(event);
    };

    this.ws.onclose = (event) => {
      this.onConnectionClose(event);
    };

    this.ws.onerror = (event) => {
      this.onConnectionError(event);
    };
  }

  /**
   * Maneja la apertura exitosa de conexión
   */
  onConnectionOpen(event) {
    Logger.info(this.componentName, `✅ WebSocket conectado exitosamente a ${this.currentUrl}`);
    
    // Limpiar timers y resetear contadores
    this.clearTimers();
    this.retryCount = 0;
    this.connectionState = WS_CONFIG.CONNECTION_STATES.CONNECTED;
    
    // Iniciar heartbeat
    this.startHeartbeat();
    
    // Llamar handler personalizado
    if (this.handlers.onOpen) {
      this.handlers.onOpen(event);
    }
  }

  /**
   * Maneja mensajes recibidos
   */
  onMessage(event) {
    Logger.debug(this.componentName, `📨 Mensaje recibido: ${event.data?.substring(0, 100)}...`);
    
    if (this.handlers.onMessage) {
      this.handlers.onMessage(event);
    }
  }

  /**
   * Maneja el cierre de conexión
   */
  onConnectionClose(event) {
    const closeInfo = {
      code: event.code,
      reason: event.reason || 'Sin razón especificada',
      wasClean: event.wasClean
    };
    
    Logger.warn(this.componentName, `🔌 WebSocket cerrado: ${JSON.stringify(closeInfo)}`);
    
    this.connectionState = WS_CONFIG.CONNECTION_STATES.DISCONNECTED;
    this.clearTimers();
    
    // Determinar si debemos reconectar
    const shouldRetry = this.shouldReconnect && 
                       event.code !== WS_CONFIG.CLOSE_CODES.NORMAL &&
                       this.retryCount < WS_CONFIG.MAX_RETRY_ATTEMPTS;
    
    if (shouldRetry) {
      this.scheduleRetry();
    } else if (this.retryCount >= WS_CONFIG.MAX_RETRY_ATTEMPTS) {
      this.connectionState = WS_CONFIG.CONNECTION_STATES.FAILED;
      Logger.error(this.componentName, `❌ Máximo número de reintentos alcanzado (${WS_CONFIG.MAX_RETRY_ATTEMPTS})`);
    }
    
    // Llamar handler personalizado
    if (this.handlers.onClose) {
      this.handlers.onClose(event);
    }
  }

  /**
   * Maneja errores de conexión
   */
  onConnectionError(event) {
    Logger.error(this.componentName, `❌ Error en WebSocket ${this.currentUrl}:`, event);
    
    // No programar retry aquí, se hará en onClose
    if (this.handlers.onError) {
      this.handlers.onError(event);
    }
  }

  /**
   * Programa un reintento de conexión
   */
  scheduleRetry() {
    if (!this.shouldReconnect || this.retryCount >= WS_CONFIG.MAX_RETRY_ATTEMPTS) {
      return;
    }

    this.retryCount++;
    const delay = this.calculateRetryDelay(this.retryCount);
    
    Logger.info(this.componentName, `🔄 Programando reintento ${this.retryCount}/${WS_CONFIG.MAX_RETRY_ATTEMPTS} en ${delay}ms`);
    
    this.retryTimer = setTimeout(() => {
      this.attemptConnection(true);
    }, delay);
  }

  /**
   * Inicia el sistema de heartbeat
   */
  startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
          Logger.debug(this.componentName, '💓 Heartbeat enviado');
        } catch (error) {
          Logger.warn(this.componentName, 'Error enviando heartbeat:', error);
        }
      }
    }, WS_CONFIG.HEARTBEAT_INTERVAL);
  }

  /**
   * Envía un mensaje por el WebSocket
   * @param {string|Object} data - Datos a enviar
   * @returns {boolean} True si se envió exitosamente
   */
  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      Logger.warn(this.componentName, 'No se puede enviar mensaje: WebSocket no conectado');
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
      Logger.debug(this.componentName, `📤 Mensaje enviado: ${message.substring(0, 100)}...`);
      return true;
    } catch (error) {
      Logger.error(this.componentName, 'Error enviando mensaje:', error);
      return false;
    }
  }

  /**
   * Cierra la conexión WebSocket
   * @param {number} code - Código de cierre
   * @param {string} reason - Razón del cierre
   */
  disconnect(code = WS_CONFIG.CLOSE_CODES.NORMAL, reason = 'Desconexión solicitada') {
    Logger.info(this.componentName, `🔌 Desconectando WebSocket: ${reason}`);
    
    this.shouldReconnect = false;
    this.cleanup();
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(code, reason);
    }
  }

  /**
   * Limpia timers y recursos
   */
  clearTimers() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  /**
   * Limpia todos los recursos
   */
  cleanup() {
    this.clearTimers();
    
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
    }
  }

  /**
   * Obtiene el estado actual de la conexión
   * @returns {string} Estado actual
   */
  getConnectionState() {
    return this.connectionState;
  }

  /**
   * Verifica si está conectado
   * @returns {boolean}
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Reinicia la conexión
   */
  restart() {
    Logger.info(this.componentName, '🔄 Reiniciando conexión WebSocket');
    this.disconnect();
    setTimeout(() => {
      this.retryCount = 0;
      this.shouldReconnect = true;
      this.attemptConnection();
    }, 1000);
  }
}

export default WebSocketManager;
