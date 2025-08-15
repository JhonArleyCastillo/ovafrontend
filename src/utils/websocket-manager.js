/**
 * 🔌 WebSocket Manager - Gestor Robusto de Conexiones WebSocket
 * 
 * Este archivo es el CORAZÓN de las comunicaciones en tiempo real de la aplicación.
 * Como desarrollador fullstack, aquí es donde manejamos todos los aspectos complejos
 * de las conexiones WebSocket, desde la detección automática de servidores hasta
 * la reconexión inteligente cuando la conexión se pierde.
 * 
 * 🎯 ¿QUÉ HACE ESTE ARCHIVO?
 * - Maneja conexiones WebSocket robustas con el backend FastAPI
 * - Implementa retry automático con backoff exponencial
 * - Detecta automáticamente si el servidor está disponible
 * - Configura diferentes endpoints según el entorno (dev/staging/prod)
 * - Mantiene heartbeats para detectar conexiones muertas
 * - Rota entre múltiples URLs si una falla
 * 
 * 🔗 CONEXIÓN CON EL BACKEND:
 * Este manager se conecta al endpoint '/api/chat' del FastAPI backend.
 * El backend maneja estas conexiones en websocket_routes.py usando el
 * WebSocketConnectionManager que ya humanizamos.
 * 
 * 💡 TIP PARA DEBUGGING:
 * Si los mensajes no llegan, revisa:
 * 1. Los logs del navegador (este archivo loggea todo)
 * 2. El estado de la conexión con getConnectionState()
 * 3. Que el backend esté ejecutándose en el puerto correcto
 * 4. Los CORS en el backend si hay problemas de origen cruzado
 * 
 * 🛠️ CONFIGURACIÓN POR ENTORNOS:
 * - Development: localhost:8000
 * - Staging: staging-api.ovaonline.tech  
 * - Production: api.ovaonline.tech
 * 
 * Incluye retry automático, detección de servidor y configuración por entornos
 */

import Logger from '../utils/debug-utils';

// 🔧 CONFIGURACIÓN MAESTRAÁ DEL WEBSOCKET
// Esta configuración controla todos los aspectos del comportamiento WebSocket.
// Como desarrollador, aquí es donde ajustas timeouts, reintentos, y URLs.

// ⏱️ Tiempos de espera críticos
export const WS_CONFIG = {
  // Tiempos de espera (ajustables según la latencia de tu servidor)
  CONNECTION_TIMEOUT: 10000, // 10 segundos - si el servidor tarda más, hay un problema
  HEARTBEAT_INTERVAL: 30000, // 30 segundos - ping/pong para mantener viva la conexión
  
  // 🔄 Configuración de retry inteligente
  // Estos valores implementan backoff exponencial para no sobrecargar el servidor
  MAX_RETRY_ATTEMPTS: 5,      // Máximo 5 intentos antes de rendirse
  INITIAL_RETRY_DELAY: 1000,  // Empieza con 1 segundo
  MAX_RETRY_DELAY: 30000,     // Nunca esperes más de 30 segundos
  RETRY_BACKOFF_FACTOR: 2,    // Duplica el tiempo en cada intento: 1s, 2s, 4s, 8s, 16s
  
  // 🚦 Estados de conexión (útiles para mostrar indicators en la UI)
  CONNECTION_STATES: {
    CONNECTING: 'connecting',     // Mostrando spinner
    CONNECTED: 'connected',       // Todo OK, icono verde
    DISCONNECTED: 'disconnected', // Desconectado, icono gris
    RECONNECTING: 'reconnecting', // Reintentando, icono amarillo
    FAILED: 'failed'             // Error fatal, icono rojo
  },
  
  // 📋 Códigos de cierre estándar WebSocket RFC 6455
  // Útiles para debugging: cada código te dice exactamente qué pasó
  CLOSE_CODES: {
    NORMAL: 1000,                    // Cierre normal - todo OK
    GOING_AWAY: 1001,               // Usuario cerró la pestaña/navegador
    PROTOCOL_ERROR: 1002,           // Error de protocolo WebSocket
    UNSUPPORTED_DATA: 1003,         // Datos no soportados
    ABNORMAL_CLOSURE: 1006,         // Conexión perdida sin close frame
    INVALID_FRAME_PAYLOAD_DATA: 1007, // Datos corruptos
    POLICY_VIOLATION: 1008,         // Violación de política (CORS, etc.)
    MESSAGE_TOO_BIG: 1009,         // Mensaje demasiado grande
    MISSING_EXTENSION: 1010,        // Extensión requerida no presente
    INTERNAL_ERROR: 1011,          // Error interno del servidor
    SERVICE_RESTART: 1012,         // Servidor reiniciándose
    TRY_AGAIN_LATER: 1013,        // Servidor sobrecargado
    BAD_GATEWAY: 1014,            // Gateway malo
    TLS_HANDSHAKE: 1015           // Error SSL/TLS
  },
  
  // 🌐 URLs por entorno - AQUÍ CONFIGURAS TUS SERVIDORES
  // Como desarrollador fullstack, aquí mapeas frontend a backend
  ENDPOINTS: {
    development: {
      primary: 'ws://localhost:8000/api/chat',    // Tu servidor local FastAPI
      fallback: 'ws://127.0.0.1:8000/api/chat'   // IP en caso de problemas DNS
    },
    staging: {
      primary: 'wss://staging-api.ovaonline.tech/api/chat',  // Servidor de pruebas
      fallback: 'wss://staging.ovaonline.tech/api/chat'      // Backup staging
    },
    production: {
      primary: 'wss://www.api.ovaonline.tech/api/chat',      // Servidor producción
      fallback: 'wss://www.api.ovaonline.tech/ws/chat'       // Ruta alternativa prod
    }
  }
};

/**
 * 🎯 WebSocketManager - Clase Principal de Gestión WebSocket
 * 
 * Esta clase es tu mejor amiga para manejar conexiones WebSocket complejas.
 * Encapsula toda la lógica de conexión, reconexión, heartbeats, y manejo de errores
 * que normalmente tendrías que implementar una y otra vez.
 * 
 * 💼 ¿CÓMO LA USAS?
 * ```javascript
 * const wsManager = new WebSocketManager('ChatComponent');
 * await wsManager.connect({
 *   onMessage: (event) => console.log('Mensaje:', event.data),
 *   onOpen: () => console.log('¡Conectado!'),
 *   onClose: () => console.log('Desconectado'),
 *   onError: (error) => console.error('Error:', error)
 * });
 * ```
 * 
 * 🔄 GESTIÓN AUTOMÁTICA:
 * - Detecta automáticamente el entorno (dev/staging/prod)
 * - Rota entre URLs si una falla
 * - Implementa backoff exponencial para reintentos
 * - Mantiene heartbeats automáticos
 * - Limpia recursos automáticamente
 */
export class WebSocketManager {
  constructor(componentName = 'WebSocketManager') {
    // 🏷️ Identificación para logs (útil cuando tienes múltiples instances)
    this.componentName = componentName;
    
    // 🔌 Estado de la conexión WebSocket
    this.ws = null;                    // Instancia actual del WebSocket
    this.currentUrl = null;            // URL a la que estamos conectados
    this.retryCount = 0;              // Contador de reintentos actuales
    this.retryTimer = null;           // Timer para programar reintentos
    this.heartbeatTimer = null;       // Timer para heartbeats periódicos
    this.connectionState = WS_CONFIG.CONNECTION_STATES.DISCONNECTED;
    this.handlers = {};               // Callbacks personalizados del usuario
    this.shouldReconnect = true;      // Flag para controlar reconexión automática
    this.connectionTimeout = null;     // Timer para timeout de conexión inicial
    
    // 🌍 Detección automática de entorno
    // NODE_ENV viene del build de React, determina qué URLs usar
    const env = process.env.NODE_ENV || 'development';
    this.endpoints = WS_CONFIG.ENDPOINTS[env] || WS_CONFIG.ENDPOINTS.development;
    
    Logger.debug(this.componentName, `🚀 WebSocket Manager inicializado para entorno: ${env}`);
    Logger.debug(this.componentName, `🎯 URLs disponibles: ${JSON.stringify(this.endpoints)}`);
  }

  /**
   * 🏥 Verificación de Salud del Servidor
   * 
   * Antes de intentar una conexión WebSocket, verificamos si el servidor HTTP
   * está respondiendo. Esto evita timeouts largos y proporciona feedback rápido.
   * 
   * 🔍 ESTRATEGIA DE VERIFICACIÓN:
   * 1. Intenta /chat/health (endpoint específico para WebSocket)
   * 2. Si falla, intenta /api/chat/health (ruta alternativa)
   * 3. Como último recurso, intenta /status (endpoint general)
   * 
   * 💡 TIP: Si constantemente falla aquí, revisa:
   * - Que el backend FastAPI esté ejecutándose
   * - Que los endpoints de health estén implementados
   * - La configuración de CORS en el backend
   * 
   * @param {string} wsUrl - URL del WebSocket (convertimos a HTTP para verificar)
   * @returns {Promise<boolean>} - true si el servidor responde
   */
  async checkServerAvailability(wsUrl) {
    try {
      // 🔄 Conversión inteligente: WebSocket URL → HTTP URL
      // ws://localhost:8000/api/chat → http://localhost:8000
      // wss://api.example.com/api/chat → https://api.example.com
      const parsed = new URL(wsUrl);
      const httpProto = parsed.protocol === 'wss:' ? 'https:' : 'http:';
      const origin = `${httpProto}//${parsed.host}`;
      
      // 🎯 Endpoints a verificar en orden de prioridad
      const healthUrl = `${origin}/chat/health`;      // Específico para chat
      const apiHealthUrl = `${origin}/api/chat/health`; // Alternativa API
      const statusUrl = `${origin}/status`;            // Fallback general
      
      // 🚀 Primer intento: endpoint específico de WebSocket
      Logger.debug(this.componentName, `🔍 Verificando salud del servidor: ${healthUrl}`);
      
      // ⏰ Control de timeout para evitar esperas eternas
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos máximo
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,    // Para cancelar si tarda mucho
        cache: 'no-cache'            // Siempre verificar estado actual
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        Logger.debug(this.componentName, `✅ Servidor WebSocket disponible en ${healthUrl}`);
        return true;
      } else {
        // 🔄 Estrategia de fallback: probar endpoints alternativos
        Logger.warn(this.componentName, `⚠️ WS health respondió ${response.status}. Probando ${apiHealthUrl}`);
        
        const resApi = await fetch(apiHealthUrl, { method: 'GET', cache: 'no-cache' });
        if (resApi.ok) {
          Logger.debug(this.componentName, `✅ Servidor disponible en ruta alternativa: ${apiHealthUrl}`);
          return true;
        }
        
        Logger.warn(this.componentName, `⚠️ API health respondió ${resApi.status}. Probando fallback: ${statusUrl}`);
        const res2 = await fetch(statusUrl, { method: 'GET', cache: 'no-cache' });
        if (res2.ok) {
          Logger.debug(this.componentName, `✅ Servidor HTTP disponible (fallback): ${statusUrl}`);
          return true;
        }
        
        Logger.error(this.componentName, '❌ Ningún endpoint responde. Servidor probablemente offline.');
        return false;
      }
    } catch (error) {
      // 💥 Captura errores de red, CORS, timeouts, etc.
      Logger.warn(this.componentName, `🚫 Error verificando servidor: ${error.message}`);
      return false;
    }
  }

  /**
   * 📈 Cálculo de Delay con Backoff Exponencial
   * 
   * Implementa la estrategia "exponential backoff with jitter" que es el estándar
   * en sistemas distribuidos para evitar el "thundering herd problem".
   * 
   * 🧮 FÓRMULA: 
   * delay = min(INITIAL_DELAY * (BACKOFF_FACTOR ^ attempt), MAX_DELAY) + jitter
   * 
   * 📊 EJEMPLO CON VALORES ACTUALES:
   * Intento 1: 1s + jitter
   * Intento 2: 2s + jitter  
   * Intento 3: 4s + jitter
   * Intento 4: 8s + jitter
   * Intento 5: 16s + jitter
   * 
   * 🎲 JITTER: Añade aleatoriedad para evitar que múltiples clientes
   * reconecten exactamente al mismo tiempo y saturen el servidor.
   * 
   * @param {number} attempt - Número de intento actual (0-based)
   * @returns {number} Delay en milisegundos antes del próximo intento
   */
  calculateRetryDelay(attempt) {
    // 📈 Backoff exponencial: cada intento espera el doble que el anterior
    const delay = Math.min(
      WS_CONFIG.INITIAL_RETRY_DELAY * Math.pow(WS_CONFIG.RETRY_BACKOFF_FACTOR, attempt),
      WS_CONFIG.MAX_RETRY_DELAY
    );
    
    // 🎲 Jitter: añadimos hasta 10% de variación aleatoria
    // Esto distribuye las reconexiones en el tiempo y evita sobrecargar el servidor
    const jitter = Math.random() * 0.1 * delay;
    const finalDelay = Math.floor(delay + jitter);
    
    Logger.debug(this.componentName, `⏱️ Delay calculado para intento ${attempt}: ${finalDelay}ms`);
    return finalDelay;
  }

  /**
   * 🚀 Método Principal de Conexión
   * 
   * Este es el método que llamas desde tus componentes React para establecer
   * una conexión WebSocket. Guarda los handlers y delega a attemptConnection().
   * 
   * 💡 USO TÍPICO:
   * ```javascript
   * const wsManager = new WebSocketManager('ChatComponent');
   * await wsManager.connect({
   *   onOpen: () => setConnectionStatus('connected'),
   *   onMessage: handleIncomingMessage,
   *   onClose: () => setConnectionStatus('disconnected'),
   *   onError: handleConnectionError
   * });
   * ```
   * 
   * @param {Object} handlers - Objeto con callbacks para eventos WebSocket
   * @param {Function} handlers.onOpen - Llamado cuando se establece conexión
   * @param {Function} handlers.onMessage - Llamado cuando llega un mensaje
   * @param {Function} handlers.onClose - Llamado cuando se cierra conexión
   * @param {Function} handlers.onError - Llamado cuando hay un error
   * @returns {Promise<WebSocket>} - Promesa que resuelve con el WebSocket conectado
   */
  async connect(handlers = {}) {
    Logger.debug(this.componentName, `🎯 Iniciando proceso de conexión con handlers: ${Object.keys(handlers).join(', ')}`);
    
    this.handlers = handlers;          // Guardamos handlers para reconexiones automáticas
    this.shouldReconnect = true;       // Habilitamos reconexión automática
    
    return this.attemptConnection();
  }

  /**
   * 🔄 Motor de Intentos de Conexión
   * 
   * Esta es la lógica核心 que maneja toda la complejidad de conectar:
   * - Rotación inteligente entre URLs disponibles
   * - Verificación de salud del servidor antes de conectar
   * - Manejo de timeouts y cleanup automático
   * - Configuración de event listeners
   * 
   * 🎯 ESTRATEGIA DE ROTACIÓN DE URLs:
   * 1. Genera todas las variantes posibles (/api/chat y /ws/chat)
   * 2. Elimina duplicados manteniendo el orden
   * 3. Rota por intento: intento 0 = URL primaria, intento 1 = fallback, etc.
   * 
   * 💡 TIP: Si siempre falla en el primer intento pero funciona en reintentos,
   * probablemente el servidor tarda en inicializar. Considera aumentar
   * CONNECTION_TIMEOUT o agregar un health check más robusto.
   * 
   * @param {boolean} isRetry - true si es un reintento automático
   * @returns {Promise<WebSocket>} - WebSocket conectado o null si falla
   */
  async attemptConnection(isRetry = false) {
    // 🛑 Verificación de seguridad: ¿el usuario canceló la conexión?
    if (!this.shouldReconnect) {
      Logger.debug(this.componentName, '🚫 Conexión cancelada por usuario o deshabilitada');
      return null;
    }

    // 🔀 Generación inteligente de candidatos de conexión
    // Tomamos las URLs base y generamos variantes con diferentes rutas
    const base = [this.endpoints.primary, this.endpoints.fallback];
    const variants = base.flatMap(u => {
      // Si la URL contiene /api/chat, también probamos /ws/chat
      if (u.includes('/api/chat')) return [u, u.replace('/api/chat', '/ws/chat')];
      // Si contiene /ws/chat, también probamos /api/chat  
      if (u.includes('/ws/chat')) return [u, u.replace('/ws/chat', '/api/chat')];
      // Si no tiene ninguna, la devolvemos tal como está
      return [u];
    });
    
    // 🔄 Eliminamos duplicados pero preservamos el orden (Set mantiene insertion order)
    const candidates = Array.from(new Set(variants));
    
    // 📍 Selección de URL por rotación: usamos el retryCount como índice
    // Intento 0: candidates[0], Intento 1: candidates[1], etc.
    // Si hay más intentos que candidatos, usamos el último
    const index = Math.min(this.retryCount, candidates.length - 1);
    const url = candidates[index];
    this.currentUrl = url;
    
    // 📊 Logging diferenciado para conexiones iniciales vs reintentos
    if (isRetry) {
      this.connectionState = WS_CONFIG.CONNECTION_STATES.RECONNECTING;
      Logger.debug(this.componentName, `🔄 Reintentando conexión (${this.retryCount}/${WS_CONFIG.MAX_RETRY_ATTEMPTS}) a ${url}`);
    } else {
      this.connectionState = WS_CONFIG.CONNECTION_STATES.CONNECTING;
      Logger.debug(this.componentName, `🚀 Iniciando conexión inicial a ${url}`);
    }

    // 🏥 Verificación proactiva de salud del servidor
    // Solo en los primeros intentos - después asumimos que el problema es temporal
    const isServerAvailable = await this.checkServerAvailability(url);
    if (!isServerAvailable && this.retryCount < 2) {
      Logger.warn(this.componentName, `🚫 Servidor no disponible en ${url}. Programando reintento...`);
      this.scheduleRetry();
      return null;
    }

    try {
      // 🧹 Limpieza preventiva: eliminar cualquier conexión anterior
      this.cleanup();
      
      // 🔌 Creación de la nueva conexión WebSocket
      Logger.debug(this.componentName, `🔗 Creando WebSocket hacia ${url}...`);
      this.ws = new WebSocket(url);
      
      // ⏰ Configuración de timeout de conexión
      // Si el WebSocket se queda en estado CONNECTING más de X segundos, algo está mal
      this.connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          Logger.warn(this.componentName, `⏰ Timeout de conexión WebSocket (${WS_CONFIG.CONNECTION_TIMEOUT}ms)`);
          this.ws.close();
          this.scheduleRetry();
        }
      }, WS_CONFIG.CONNECTION_TIMEOUT);

      // 🎯 Configuración de todos los event listeners
      this.setupEventListeners();
      
      // 📞 Devolvemos una Promise que resuelve cuando se abre la conexión
      return new Promise((resolve, reject) => {
        // ✅ Éxito: conexión establecida
        this.ws.addEventListener('open', () => {
          Logger.debug(this.componentName, '🎉 Conexión WebSocket exitosa!');
          resolve(this.ws);
        }, { once: true });
        
        // ❌ Error: fallo en la conexión
        this.ws.addEventListener('error', (error) => {
          Logger.error(this.componentName, '💥 Error en conexión WebSocket:', error);
          reject(new Error('Error en conexión WebSocket'));
        }, { once: true });
      });
      
    } catch (error) {
      // 🚨 Captura errores síncronos (ej: URL malformada)
      Logger.error(this.componentName, `💥 Error creando WebSocket: ${error.message}`, error);
      this.scheduleRetry();
      return null;
    }
  }

  /**
   * 🎛️ Configuración de Event Listeners
   * 
   * Aquí es donde "cableamos" todos los eventos del WebSocket a nuestros
   * métodos internos. Es importante no establecer los listeners directamente
   * en el constructor porque podríamos tener memory leaks.
   * 
   * 🔗 CONEXIÓN DE EVENTOS:
   * - onopen → onConnectionOpen (maneja éxito de conexión)
   * - onmessage → onMessage (procesa mensajes entrantes)
   * - onclose → onConnectionClose (maneja desconexiones)
   * - onerror → onConnectionError (maneja errores)
   */
  setupEventListeners() {
    if (!this.ws) {
      Logger.warn(this.componentName, '⚠️ No se puede configurar listeners: WebSocket no existe');
      return;
    }

    // 🔗 Asignación de handlers internos
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
    
    Logger.debug(this.componentName, '🎛️ Event listeners configurados exitosamente');
  }

  /**
   * 🎉 Handler de Conexión Exitosa
   * 
   * ¡Éxito! El WebSocket se conectó correctamente. Aquí es donde:
   * - Reseteamos contadores y timers
   * - Iniciamos el sistema de heartbeat
   * - Notificamos al componente React que estamos conectados
   * 
   * 💡 NOTA: Este método se llamará tanto en conexiones iniciales como
   * en reconexiones automáticas. Tu componente React debería manejar
   * ambos casos de manera idéntica.
   */
  onConnectionOpen(event) {
    // 📝 Log de éxito (reducido a debug para minimizar ruido en consola)
    Logger.debug(this.componentName, `✅ WebSocket conectado exitosamente a ${this.currentUrl}`);
    
    // 🧹 Limpieza de timers y reset de estado
    this.clearTimers();                 // Cancelar timeouts pendientes
    this.retryCount = 0;               // Resetear contador de reintentos
    this.connectionState = WS_CONFIG.CONNECTION_STATES.CONNECTED;
    
    // 💓 Iniciar sistema de heartbeat para mantener viva la conexión
    this.startHeartbeat();
    
    // 📢 Notificar al componente React que estamos conectados
    if (this.handlers.onOpen) {
      try {
        this.handlers.onOpen(event);
      } catch (error) {
        Logger.error(this.componentName, '💥 Error en handler onOpen personalizado:', error);
      }
    }
  }

  /**
   * 📨 Handler de Mensajes Entrantes
   * 
   * Cada vez que el servidor nos envía algo, este método se ejecuta.
   * Aquí solo hacemos logging y delegamos al handler personalizado del componente.
   * 
   * 💡 TIPOS DE MENSAJES COMUNES:
   * - Mensajes de chat del usuario
   * - Respuestas de procesamiento ASL
   * - Pings/pongs del heartbeat
   * - Notificaciones de estado del servidor
   * 
   * 🔍 DEBUGGING: Si no recibes mensajes, verifica:
   * 1. Que el handler onMessage esté configurado
   * 2. Que el backend esté enviando a la conexión correcta
   * 3. El formato del mensaje (debe ser texto válido o JSON)
   */
  onMessage(event) {
    // 📊 Log truncado para no llenar la consola con mensajes largos
    const preview = event.data?.substring(0, 100) || '[mensaje vacío]';
    Logger.debug(this.componentName, `📨 Mensaje recibido: ${preview}${event.data?.length > 100 ? '...' : ''}`);
    
    // 📢 Delegar al handler personalizado del componente
    if (this.handlers.onMessage) {
      try {
        this.handlers.onMessage(event);
      } catch (error) {
        Logger.error(this.componentName, '💥 Error en handler onMessage personalizado:', error);
      }
    } else {
      Logger.warn(this.componentName, '⚠️ Mensaje recibido pero no hay handler onMessage configurado');
    }
  }

  /**
   * 🔌 Handler de Cierre de Conexión
   * 
   * Cuando la conexión WebSocket se cierra, necesitamos entender POR QUÉ
   * se cerró para decidir si debemos reconectar automáticamente o no.
   * 
   * 🔍 CÓDIGOS DE CIERRE IMPORTANTES:
   * - 1000: Cierre normal (usuario cerró pestaña, etc.) - NO reconectar
   * - 1006: Cierre anormal (red, servidor caído) - SÍ reconectar  
   * - 1011: Error interno del servidor - SÍ reconectar
   * - 1012: Servidor reiniciándose - SÍ reconectar
   * 
   * 💡 ESTRATEGIA DE RECONEXIÓN:
   * - Solo reconectamos si shouldReconnect = true
   * - No reconectamos en cierres normales (código 1000)
   * - Limitamos a MAX_RETRY_ATTEMPTS intentos
   */
  onConnectionClose(event) {
    // 📊 Información detallada del cierre para debugging
    const closeInfo = {
      code: event.code,
      reason: event.reason || 'Sin razón especificada',
      wasClean: event.wasClean     // true = cierre controlado, false = abrupto
    };
    
    Logger.warn(this.componentName, `🔌 WebSocket cerrado: ${JSON.stringify(closeInfo)}`);
    
    // 📊 Actualizar estado interno
    this.connectionState = WS_CONFIG.CONNECTION_STATES.DISCONNECTED;
    this.clearTimers();    // Limpiar heartbeats y timeouts
    
    // 🤔 ¿Debemos reconectar automáticamente?
    const shouldRetry = this.shouldReconnect &&                           // Reconexión habilitada
                       event.code !== WS_CONFIG.CLOSE_CODES.NORMAL &&     // No fue cierre normal
                       this.retryCount < WS_CONFIG.MAX_RETRY_ATTEMPTS;     // No hemos agotado intentos
    
    if (shouldRetry) {
      Logger.debug(this.componentName, '🔄 Programando reconexión automática...');
      this.scheduleRetry();
    } else if (this.retryCount >= WS_CONFIG.MAX_RETRY_ATTEMPTS) {
      // 💀 Hemos agotado todos los intentos - marcar como fallido
      this.connectionState = WS_CONFIG.CONNECTION_STATES.FAILED;
  Logger.error(this.componentName, `❌ Máximo número de reintentos alcanzado (${WS_CONFIG.MAX_RETRY_ATTEMPTS}). Conexión marcada como fallida.`);
    } else {
      // ✋ Cierre normal o reconexión deshabilitada
  Logger.debug(this.componentName, `✋ No se reintentará conexión: código=${event.code}, shouldReconnect=${this.shouldReconnect}`);
    }
    
    // 📢 Notificar al componente React del cierre
    if (this.handlers.onClose) {
      try {
        this.handlers.onClose(event);
      } catch (error) {
        Logger.error(this.componentName, '💥 Error en handler onClose personalizado:', error);
      }
    }
  }

  /**
   * ❌ Handler de Errores de Conexión
   * 
   * Este handler se ejecuta cuando hay errores durante la conexión o
   * transmisión de datos. Es importante NO manejar reconexión aquí
   * porque onClose siempre se ejecuta después de onError.
   * 
   * 🚨 ERRORES COMUNES:
   * - Error de red (sin internet, servidor caído)
   * - Error de protocolo (datos corruptos)
   * - Error de autenticación (tokens inválidos)
   * - Error de CORS (dominios no permitidos)
   * 
   * 💡 DEBUGGING: Los errores WebSocket son notoriamente poco informativos.
   * Si hay problemas, también revisa:
   * - Network tab del DevTools
   * - Logs del servidor backend
   * - Configuración de proxy/firewall
   */
  onConnectionError(event) {
    Logger.error(this.componentName, `❌ Error en WebSocket ${this.currentUrl}:`, event);
    
    // 🚫 NO programar retry aquí - se hará en onClose que siempre se ejecuta después
    // onError → onClose es la secuencia normal de eventos
    
    // 📢 Notificar al componente React del error
    if (this.handlers.onError) {
      try {
        this.handlers.onError(event);
      } catch (error) {
        Logger.error(this.componentName, '💥 Error en handler onError personalizado:', error);
      }
    }
  }

  /**
   * ⏰ Programador de Reintentos
   * Cuando una conexión falla, este método programa el próximo intento
   * usando backoff exponencial para no sobrecargar el servidor.
   * 
   * 🔄 FLUJO DE RECONEXIÓN:
   * 1. Incrementa retryCount
   * 2. Calcula delay con backoff exponencial + jitter
   * 3. Programa timer para llamar attemptConnection(true)
   * 4. Si se agotaron intentos, no hace nada
   * 
   * 🛡️ PROTECCIONES:
   * - Verifica shouldReconnect (usuario puede deshabilitar)
   * - Respeta MAX_RETRY_ATTEMPTS
   * - Usa jitter para evitar thundering herd
   */
  scheduleRetry() {
    // 🚫 Verificaciones de seguridad
    if (!this.shouldReconnect) {
      Logger.debug(this.componentName, '🚫 Reconexión deshabilitada por usuario');
      return;
    }
    
    if (this.retryCount >= WS_CONFIG.MAX_RETRY_ATTEMPTS) {
      Logger.error(this.componentName, `🚫 Máximo de reintentos alcanzado (${WS_CONFIG.MAX_RETRY_ATTEMPTS})`);
      return;
    }

    // 📈 Incrementar contador e calcular delay
    this.retryCount++;
    const delay = this.calculateRetryDelay(this.retryCount);
    
    Logger.debug(this.componentName, `⏰ Programando reintento ${this.retryCount}/${WS_CONFIG.MAX_RETRY_ATTEMPTS} en ${delay}ms`);
    
    // ⏲️ Programar el reintento
    this.retryTimer = setTimeout(() => {
      Logger.debug(this.componentName, `🔄 Ejecutando reintento ${this.retryCount}...`);
      this.attemptConnection(true);   // true = es reintento
    }, delay);
  }

  /**
   * 💓 Sistema de Heartbeat
   * 
   * Los heartbeats son pings periódicos que enviamos al servidor para:
   * 1. Detectar conexiones "zombi" (aparentan estar vivas pero no funcionan)
   * 2. Mantener viva la conexión a través de firewalls/proxies
   * 3. Detectar problemas de red antes de que el usuario intente enviar datos
   * 
   * 📡 FUNCIONAMIENTO:
   * - Cada 30 segundos enviamos {"type": "ping"}
   * - El servidor debería responder con {"type": "pong"}
   * - Si el envío falla, la conexión está rota
   * 
   * 💡 TIP: Si ves muchos errores de heartbeat, verifica:
   * - Configuración de timeout en tu firewall/proxy
   * - Que el backend maneje mensajes de ping correctamente
   * - La estabilidad de la conexión de red
   */
  startHeartbeat() {
    // 🧹 Limpiar heartbeat anterior si existe
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    Logger.debug(this.componentName, `💓 Iniciando heartbeat cada ${WS_CONFIG.HEARTBEAT_INTERVAL}ms`);
    
    this.heartbeatTimer = setInterval(() => {
      // ✅ Solo enviar si la conexión está realmente abierta
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          const pingMessage = JSON.stringify({ type: 'ping', timestamp: Date.now() });
          this.ws.send(pingMessage);
          Logger.debug(this.componentName, '💓 Heartbeat enviado');
        } catch (error) {
          // ⚠️ Si el ping falla, la conexión probablemente está rota
          Logger.warn(this.componentName, '💔 Error enviando heartbeat - conexión posiblemente rota:', error);
          // No forzamos cierre aquí - dejamos que el sistema lo detecte naturalmente
        }
      } else {
        // 🚫 WebSocket no está abierto - detener heartbeat
        Logger.debug(this.componentName, '💔 Deteniendo heartbeat: WebSocket no está abierto');
        this.clearTimers();
      }
    }, WS_CONFIG.HEARTBEAT_INTERVAL);
  }

  /**
   * 📤 Envío de Mensajes
   * 
   * Método seguro para enviar datos a través del WebSocket.
   * Incluye validación de estado y manejo de errores.
   * 
   * 💡 USO TÍPICO:
   * ```javascript
   * // Enviar objeto JSON
   * wsManager.send({ type: 'chat_message', content: 'Hola!' });
   * 
   * // Enviar string directo
   * wsManager.send('mensaje simple');
   * ```
   * 
   * 🛡️ VALIDACIONES:
   * - Verifica que WebSocket existe y está abierto
   * - Convierte objetos a JSON automáticamente
   * - Captura errores de serialización y envío
   * - Devuelve booleano indicando éxito/fallo
   * 
   * @param {string|Object} data - Datos a enviar (string o objeto serializable)
   * @returns {boolean} - true si se envió exitosamente, false en caso contrario
   */
  send(data) {
    // ✅ Verificar que tenemos una conexión válida
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      Logger.warn(this.componentName, '🚫 No se puede enviar mensaje: WebSocket no conectado');
      Logger.debug(this.componentName, `Estado actual: ${this.ws ? this.ws.readyState : 'null'}`);
      return false;
    }

    try {
      // 🔄 Serialización automática: objeto → JSON string
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      
      // 📤 Envío real del mensaje
      this.ws.send(message);
      
      // 📝 Log truncado para no saturar consola con mensajes largos
      const preview = message.substring(0, 100);
      Logger.debug(this.componentName, `📤 Mensaje enviado: ${preview}${message.length > 100 ? '...' : ''}`);
      
      return true;
    } catch (error) {
      // 💥 Capturar errores de serialización JSON o envío
      Logger.error(this.componentName, '💥 Error enviando mensaje:', error);
      Logger.debug(this.componentName, 'Datos que causaron error:', data);
      return false;
    }
  }

  /**
   * 🚪 Desconexión Manual
   * 
   * Cierra la conexión WebSocket de manera controlada y deshabilita
   * la reconexión automática. Usar cuando el usuario se desconecta
   * intencionalmente o cuando la aplicación se cierra.
   * 
   * 🔧 PARÁMETROS:
   * - code: Código de cierre estándar (1000 = normal)
   * - reason: Texto descriptivo para logs y debugging
   * 
   * @param {number} code - Código de cierre WebSocket (por defecto: 1000 = normal)
   * @param {string} reason - Razón descriptiva de la desconexión
   */
  disconnect(code = WS_CONFIG.CLOSE_CODES.NORMAL, reason = 'Desconexión solicitada') {
    Logger.debug(this.componentName, `🚪 Desconectando WebSocket: ${reason} (código: ${code})`);
    
    // 🚫 Deshabilitar reconexión automática - esto es una desconexión intencional
    this.shouldReconnect = false;
    
    // 🧹 Limpiar todos los recursos (timers, listeners, etc.)
    this.cleanup();
    
    // 🔌 Cerrar conexión si está abierta
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(code, reason);
    }
    
    // 📊 Actualizar estado
    this.connectionState = WS_CONFIG.CONNECTION_STATES.DISCONNECTED;
  }

  /**
   * 🧹 Limpieza de Timers
   * 
   * Cancela todos los timers activos para evitar memory leaks y
   * operaciones fantasma después de que se cierre la conexión.
   * 
   * ⏰ TIMERS QUE LIMPIAMOS:
   * - retryTimer: Timer de reconexión automática
   * - heartbeatTimer: Timer de pings periódicos
   * - connectionTimeout: Timer de timeout de conexión inicial
   * 
   * 💡 IMPORTANTE: Siempre llamar este método antes de crear
   * una nueva conexión o al cerrar la aplicación.
   */
  clearTimers() {
    // 🔄 Cancelar timer de reintentos
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
      Logger.debug(this.componentName, '⏰ Timer de reintento cancelado');
    }
    
    // 💓 Cancelar timer de heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      Logger.debug(this.componentName, '💓 Timer de heartbeat cancelado');
    }
    
    // ⏰ Cancelar timeout de conexión inicial
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
      Logger.debug(this.componentName, '⏰ Timeout de conexión cancelado');
    }
  }

  /**
   * 🧹 Limpieza Completa de Recursos
   * 
   * Método maestro que limpia TODOS los recursos del WebSocketManager.
   * Cancela timers, elimina listeners, y resetea referencias para
   * evitar memory leaks y comportamientos inesperados.
   * 
   * 🔧 QUÉ LIMPIA:
   * - Todos los timers (retry, heartbeat, connection timeout)
   * - Event listeners del WebSocket
   * - Referencias al objeto WebSocket
   * 
   * 💡 USO: Llamar antes de crear nueva conexión o al destruir el manager
   */
  cleanup() {
    Logger.debug(this.componentName, '🧹 Iniciando limpieza completa de recursos...');
    
    // ⏰ Limpiar todos los timers
    this.clearTimers();
    
    // 🔗 Limpiar event listeners para evitar memory leaks
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      
      Logger.debug(this.componentName, '🔗 Event listeners removidos del WebSocket');
    }
    
    Logger.debug(this.componentName, '✅ Limpieza completa finalizada');
  }

  /**
   * 📊 Obtener Estado Actual
   * 
   * Devuelve el estado actual de la conexión. Útil para mostrar
   * indicadores de estado en la UI (conectado/desconectado/reconectando).
   * 
   * 🔄 ESTADOS POSIBLES:
   * - 'connecting': Estableciendo conexión inicial
   * - 'connected': Conectado y funcional
   * - 'disconnected': Sin conexión
   * - 'reconnecting': Reintentando conexión automáticamente
   * - 'failed': Error fatal, reconexión falló múltiples veces
   * 
   * @returns {string} Estado actual de la conexión
   */
  getConnectionState() {
    return this.connectionState;
  }

  /**
   * ✅ Verificar Si Está Conectado
   * 
   * Método de conveniencia que verifica si el WebSocket está
   * realmente abierto y listo para enviar/recibir datos.
   * 
   * 💡 USA ESTO ANTES DE ENVIAR DATOS CRÍTICOS:
   * ```javascript
   * if (wsManager.isConnected()) {
   *   wsManager.send({ type: 'important_message', data: '...' });
   * } else {
   *   console.log('Esperando conexión...');
   * }
   * ```
   * 
   * @returns {boolean} true si está conectado y listo, false en caso contrario
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * 🔄 Reinicio Completo de Conexión
   * 
   * Fuerza un reinicio completo de la conexión WebSocket.
   * Útil cuando detectas problemas y quieres "empezar de cero".
   * 
   * 🔄 PROCESO DE REINICIO:
   * 1. Desconecta la conexión actual (si existe)
   * 2. Resetea contadores de retry
   * 3. Habilita reconexión automática
   * 4. Intenta nueva conexión después de 1 segundo
   * 
   * 💡 USO TÍPICO:
   * - Cuando la conexión está "trabada"
   * - Después de cambios de red (WiFi → móvil)
   * - Como última opción cuando otros métodos fallan
   */
  restart() {
    Logger.debug(this.componentName, '🔄 Iniciando reinicio completo de conexión WebSocket...');
    
    // 🚪 Desconectar conexión actual
    this.disconnect();
    
    // ⏳ Esperar un poco antes de reconectar para dar tiempo a la limpieza
    setTimeout(() => {
      Logger.debug(this.componentName, '🚀 Ejecutando reconexión después de reinicio...');
      
      // 🔄 Resetear estado para empezar de cero
      this.retryCount = 0;
      this.shouldReconnect = true;
      
      // 🎯 Intentar nueva conexión
      this.attemptConnection();
    }, 1000);
  }
}

// 📤 EXPORTACIÓN POR DEFECTO
// Exportamos la clase WebSocketManager como export default para facilitar su importación:
// import WebSocketManager from './websocket-manager';

export default WebSocketManager;
