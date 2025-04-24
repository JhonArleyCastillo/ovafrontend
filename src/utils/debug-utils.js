/**
 * Utilidades de depuración para la aplicación
 * Proporciona herramientas para facilitar la depuración de componentes React
 */

// Determina si estamos en modo de desarrollo
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Sistema de registro centralizado con diferentes niveles
 */
export default class Logger {
  /**
   * Registra mensajes de depuración (solo en desarrollo)
   * @param {string} component - Nombre del componente que genera el mensaje
   * @param {string} message - Mensaje de depuración
   * @param {any} data - Datos adicionales opcionales
   */
  static debug(component, message, data) {
    if (isDev) {
      console.log(`[DEBUG][${component}] ${message}`, data !== undefined ? data : '');
    }
  }

  /**
   * Registra errores (siempre)
   * @param {string} component - Nombre del componente que genera el mensaje
   * @param {string} message - Mensaje de error
   * @param {Error|any} error - Objeto de error o datos adicionales
   */
  static error(component, message, error) {
    console.error(`[ERROR][${component}] ${message}`, error !== undefined ? error : '');
  }

  /**
   * Registra advertencias (siempre)
   * @param {string} component - Nombre del componente que genera el mensaje
   * @param {string} message - Mensaje de advertencia
   * @param {any} data - Datos adicionales opcionales
   */
  static warn(component, message, data) {
    console.warn(`[WARN][${component}] ${message}`, data !== undefined ? data : '');
  }

  /**
   * Registra información (siempre)
   * @param {string} component - Nombre del componente que genera el mensaje
   * @param {string} message - Mensaje informativo
   * @param {any} data - Datos adicionales opcionales
   */
  static info(component, message, data) {
    console.info(`[INFO][${component}] ${message}`, data !== undefined ? data : '');
  }
}

/**
 * Crea un WebSocket monitorizado que registra los mensajes
 * @param {string} url - URL del WebSocket
 * @param {string} component - Nombre del componente para los logs
 * @returns {WebSocket} WebSocket con monitorización
 */
export const createMonitoredWebSocket = (url, component) => {
  Logger.debug(component, `Creando WebSocket monitoreado para ${url}`);
  
  const socket = new WebSocket(url);
  
  // Interceptar eventos de envío
  const originalSend = socket.send;
  socket.send = function(data) {
    Logger.debug(component, 'WS enviando', data);
    return originalSend.call(this, data);
  };
  
  // Interceptar eventos de recepción
  socket.addEventListener('message', (event) => {
    Logger.debug(component, 'WS recibido', event.data);
  });
  
  // Interceptar eventos de error
  socket.addEventListener('error', (error) => {
    Logger.error(component, 'WS error', error);
  });
  
  // Interceptar eventos de conexión y desconexión
  socket.addEventListener('open', () => {
    Logger.info(component, 'WS conectado');
  });
  
  socket.addEventListener('close', (event) => {
    Logger.info(component, `WS desconectado (código: ${event.code})`, event.reason);
  });
  
  // Guardar en window para monitoreo global (solo en desarrollo)
  if (isDev && typeof window !== 'undefined') {
    window._debugWs = socket;
  }
  
  return socket;
};

/**
 * Ejecuta una llamada a API con manejo seguro de errores
 * @param {Function} apiCall - Función que realiza la llamada a la API
 * @param {string} component - Nombre del componente para los logs
 * @param {string} errorMessage - Mensaje de error personalizado
 * @returns {Promise<Object>} Resultado con indicador de éxito
 */
export const safeApiCall = async (apiCall, component, errorMessage) => {
  try {
    Logger.debug(component, 'Iniciando llamada API');
    const result = await apiCall();
    Logger.debug(component, 'Llamada API exitosa', result);
    return { success: true, data: result };
  } catch (error) {
    Logger.error(component, errorMessage, error);
    return { success: false, error };
  }
};

/**
 * Hook para monitorear cambios en el estado de un componente
 * @param {string} component - Nombre del componente para los logs
 * @param {Object} statesToWatch - Objeto con los estados a monitorear
 */
export const useStateMonitor = (component, statesToWatch) => {
  if (isDev) {
    // Este código solo se ejecuta en desarrollo
    console.groupCollapsed(`[MONITOR][${component}] Estado actualizado`);
    Object.entries(statesToWatch).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    console.groupEnd();
  }
};

/**
 * Ayudante para medir el tiempo de ejecución de funciones
 * @param {Function} fn - Función a ejecutar y medir
 * @param {string} component - Nombre del componente para los logs
 * @param {string} functionName - Nombre de la función para los logs
 * @returns {any} Resultado de la función
 */
export const measurePerformance = (fn, component, functionName) => {
  if (!isDev) return fn();
  
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  Logger.debug(component, `${functionName} ejecutado en ${end - start}ms`);
  
  return result;
};