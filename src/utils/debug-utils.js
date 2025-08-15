/**
 * 🐛 DEBUG UTILITIES - Sistema Central de Logging y Debugging
 * 
 * Este archivo es tu MEJOR AMIGO para debugging en la aplicación.
 * Como desarrollador fullstack, pasas mucho tiempo rastreando bugs
 * y entendiendo qué está pasando. Este sistema te da superpoderes.
 * 
 * 🎯 ¿QUÉ PROPORCIONA?
 * - Sistema de logging centralizado con niveles (debug, info, warn, error)
 * - Monitoreo automático de WebSockets para ver mensajes en tiempo real
 * - Wrapper seguro para llamadas API que maneja errores elegantemente
 * - Monitor de estado de React para ver cambios en componentes
 * - Medición de rendimiento para optimizar funciones lentas
 * 
 * 💡 CONFIGURACIÓN AUTOMÁTICA POR ENTORNO:
 * - Desarrollo: Logs verbose, monitoreo completo, timing detallado
 * - Producción: Solo errores críticos, logging mínimo para performance
 * 
 * 🔧 USO TÍPICO EN COMPONENTES:
 * ```javascript
 * import Logger from '../utils/debug-utils';
 * 
 * function ChatComponent() {
 *   useEffect(() => {
 *     Logger.info('ChatComponent', 'Componente montado');
 *   }, []);
 * 
 *   const handleSendMessage = (message) => {
 *     Logger.debug('ChatComponent', 'Enviando mensaje', { message });
 *     // ... lógica del mensaje
 *   };
 * }
 * ```
 * 
 * 🚀 VENTAJAS PARA FULLSTACK:
 * - Logs consistentes entre frontend y backend
 * - Fácil filtrado por componente en DevTools
 * - Debugging de WebSocket sin tools externos
 * - Timing automático para detectar bottlenecks
 * 
 * Proporciona herramientas para facilitar la depuración de componentes React
 */
/* eslint-disable no-console */

// 🌍 Detección inteligente de entorno
// NODE_ENV viene del build process de React. En development = logs verbose,
// en production = solo errores críticos para mejor performance.
const isDev = process.env.NODE_ENV !== 'production';

/**
 * 📋 Logger - Sistema de Registro Centralizado
 * 
 * Esta clase es el corazón del sistema de debugging. Proporciona logging
 * estructurado que te ayuda a rastrear qué está pasando en cada componente.
 * 
 * 🎨 FORMATO DE LOGS:
 * [NIVEL][NombreComponente] Mensaje + datos opcionales
 * Ejemplo: [DEBUG][ChatComponent] Mensaje enviado {"text": "Hola", "timestamp": 123456}
 * 
 * 💡 NIVELES DE LOG:
 * - DEBUG: Información detallada (solo desarrollo) - para rastrear flujos
 * - INFO: Información importante (siempre) - eventos significativos
 * - WARN: Advertencias (siempre) - problemas que pueden causar issues
 * - ERROR: Errores (siempre) - problemas críticos que necesitan atención
 * 
 * 🔧 TIP PARA DESARROLLADORES:
 * Usa nombres de componente consistentes para poder filtrar logs en DevTools:
 * Logger.debug('ChatComponent', 'usuario escribiendo...'); // ✅ Bueno
 * Logger.debug('chat', 'usuario escribiendo...');         // ❌ Inconsistente
 */
export default class Logger {
  /**
   * 🔍 DEBUG - Logging de Desarrollo
   * 
   * Usa este nivel para información muy detallada que te ayuda a entender
   * el flujo de tu aplicación paso a paso. Solo aparece en desarrollo.
   * 
   * 💡 CUÁNDO USAR:
   * - Entrada y salida de funciones importantes
   * - Estado de variables durante ejecución
   * - Flujo de datos entre componentes
   * - Debugging de lógica compleja
   * 
   * 📝 EJEMPLO:
   * ```javascript
   * Logger.debug('SignLanguageUploader', 'Procesando imagen', { 
   *   size: file.size, 
   *   type: file.type,
   *   timestamp: Date.now()
   * });
   * ```
   * 
   * @param {string} component - Nombre del componente (usa PascalCase consistente)
   * @param {string} message - Mensaje descriptivo de lo que está pasando
   * @param {any} data - Datos adicionales (objetos, arrays, valores) - opcional
   */
  static debug(component, message, data) {
    if (isDev) {
      console.log(`[DEBUG][${component}] ${message}`, data !== undefined ? data : '');
    }
  }

  /**
   * ❌ ERROR - Errores Críticos
   * 
   * Usa este nivel para errores que necesitan atención inmediata.
   * Estos logs aparecen tanto en desarrollo como en producción.
   * 
   * 🚨 CUÁNDO USAR:
   * - Fallos de conexión al backend
   * - Errores de parsing JSON
   * - Excepciones no manejadas
   * - Fallos de autenticación
   * - Problemas que rompen funcionalidad
   * 
   * 💡 TIP: Incluye siempre el objeto Error completo para stack traces
   * 
   * 📝 EJEMPLO:
   * ```javascript
   * try {
   *   await api.processSignLanguage(image);
   * } catch (error) {
   *   Logger.error('SignLanguageUploader', 'Falló procesamiento ASL', error);
   *   // El objeto error incluye stack trace automáticamente
   * }
   * ```
   * 
   * @param {string} component - Nombre del componente donde ocurrió el error
   * @param {string} message - Descripción clara del error
   * @param {Error|any} error - Objeto Error o datos adicionales del error
   */
  static error(component, message, error) {
    console.error(`[ERROR][${component}] ${message}`, error !== undefined ? error : '');
  }

  /**
   * ⚠️ WARN - Advertencias Importantes
   * 
   * Usa este nivel para situaciones que no son errores pero podrían
   * causar problemas o comportamientos inesperados. Siempre visible.
   * 
   * 🔶 CUÁNDO USAR:
   * - APIs que devuelven datos en formato inesperado
   * - Timeouts de conexión
   * - Validaciones que fallan pero no rompen la app
   * - Configuración subóptima detectada
   * - Uso deprecated de funciones
   * 
   * 💡 TIP: Las advertencias son tu "early warning system" para prevenir errores
   * 
   * 📝 EJEMPLO:
   * ```javascript
   * if (response.confidence < 0.7) {
   *   Logger.warn('SignLanguageProcessor', 'Confianza baja en reconocimiento', {
   *     confidence: response.confidence,
   *     expected: '>= 0.7'
   *   });
   * }
   * ```
   * 
   * @param {string} component - Nombre del componente que genera la advertencia
   * @param {string} message - Descripción de qué podría estar mal
   * @param {any} data - Datos adicionales que ayuden a entender el problema
   */
  static warn(component, message, data) {
    console.warn(`[WARN][${component}] ${message}`, data !== undefined ? data : '');
  }

  /**
   * ℹ️ INFO - Información Importante
   * 
   * Usa este nivel para eventos significativos que siempre quieres ver,
   * tanto en desarrollo como en producción. Son los "hitos" de tu app.
   * 
   * 📘 CUÁNDO USAR:
   * - Usuario se autentica exitosamente
   * - WebSocket se conecta/desconecta
   * - Carga de archivos completada
   * - Cambios importantes de estado de la aplicación
   * - Eventos de negocio significativos
   * 
   * 💡 TIP: Usa INFO para eventos que ayudan a entender el journey del usuario
   * 
   * 📝 EJEMPLO:
   * ```javascript
   * Logger.info('ChatComponent', 'Usuario conectado al chat', {
   *   userId: user.id,
   *   timestamp: new Date().toISOString(),
   *   connectionType: 'websocket'
   * });
   * ```
   * 
   * @param {string} component - Nombre del componente que reporta el evento
   * @param {string} message - Descripción del evento importante
   * @param {any} data - Datos de contexto del evento (opcional pero recomendado)
   */
  static info(component, message, data) {
    console.info(`[INFO][${component}] ${message}`, data !== undefined ? data : '');
  }
}

/**
 * 🔌 WebSocket Monitor - Debugging de Conexiones en Tiempo Real
 * 
 * Esta función es INCREÍBLEMENTE útil para debugging de WebSockets.
 * En lugar de usar herramientas externas, intercepta y loggea todo
 * el tráfico WebSocket automáticamente.
 * 
 * 🎯 QUÉ MONITOREA:
 * - Todos los mensajes enviados (send)
 * - Todos los mensajes recibidos (onmessage)
 * - Eventos de conexión/desconexión
 * - Errores de conexión con detalles
 * 
 * 💡 VENTAJAS:
 * - Ver mensajes en tiempo real en la consola del navegador
 * - No necesitas abrir Network tab constantemente
 * - Debugging más fácil de lógica de chat/tiempo real
 * - Se integra perfectamente con el resto del logging
 * 
 * 🔧 USO:
 * ```javascript
 * import { createMonitoredWebSocket } from '../utils/debug-utils';
 * 
 * // En lugar de: new WebSocket(url)
 * const ws = createMonitoredWebSocket(url, 'ChatComponent');
 * // ¡Ahora verás todos los mensajes automáticamente!
 * ```
 * 
 * 🚀 BONUS: En desarrollo, el WebSocket se guarda en window._debugWs
 * para que puedas inspeccionarlo desde la consola del navegador.
 * 
 * @param {string} url - URL del WebSocket a monitorear
 * @param {string} component - Nombre del componente para identificar logs
 * @returns {WebSocket} WebSocket con monitorización automática integrada
 */
export const createMonitoredWebSocket = (url, component) => {
  Logger.debug(component, `🔌 Creando WebSocket monitoreado para ${url}`);
  
  const socket = new WebSocket(url);
  
  // 📤 Interceptar método send() para loggear mensajes salientes
  const originalSend = socket.send;
  socket.send = function(data) {
    Logger.debug(component, '📤 WS enviando:', data);
    return originalSend.call(this, data);
  };
  
  // 📨 Interceptar mensajes entrantes
  socket.addEventListener('message', (event) => {
    Logger.debug(component, '📨 WS recibido:', event.data);
  });
  
  // ❌ Interceptar errores para debugging inmediato
  socket.addEventListener('error', (error) => {
    Logger.error(component, '💥 WS error detectado:', error);
  });
  
  // 🎉 Logs de eventos de lifecycle para seguir el estado
  socket.addEventListener('open', () => {
    Logger.info(component, '✅ WS conectado exitosamente');
  });
  
  socket.addEventListener('close', (event) => {
    Logger.info(component, `🔌 WS desconectado (código: ${event.code})`, {
      reason: event.reason,
      wasClean: event.wasClean
    });
  });
  
  // 🛠️ Herramienta de debugging: guardar en window para inspección manual
  if (isDev && typeof window !== 'undefined') {
    window._debugWs = socket;
    Logger.debug(component, '🛠️ WebSocket disponible en window._debugWs para debugging');
  }
  
  return socket;
};

/**
 * 🛡️ Safe API Call - Wrapper Inteligente para Llamadas Backend
 * 
 * Este wrapper es tu red de seguridad para TODAS las llamadas al backend.
 * En lugar de manejar try/catch en cada componente, centraliza el manejo
 * de errores y proporciona logging consistente.
 * 
 * 🎯 BENEFICIOS:
 * - Manejo consistente de errores en toda la app
 * - Logging automático de éxito/fallo de APIs
 * - Resultado estructurado fácil de manejar
 * - Menos código repetitivo en componentes
 * 
 * 💡 PATRÓN DE USO:
 * ```javascript
 * // En lugar de esto:
 * try {
 *   const result = await api.processSignLanguage(image);
 *   setResult(result);
 * } catch (error) {
 *   console.error('Error:', error);
 *   setError(error.message);
 * }
 * 
 * // Usa esto:
 * const { success, data, error } = await safeApiCall(
 *   () => api.processSignLanguage(image),
 *   'SignLanguageUploader',
 *   'Error procesando imagen ASL'
 * );
 * 
 * if (success) {
 *   setResult(data);
 * } else {
 *   setError(error.message);
 * }
 * ```
 * 
 * 🔄 ESTRUCTURA DE RESPUESTA:
 * - Success: { success: true, data: resultado }
 * - Error: { success: false, error: objetoError }
 * 
 * @param {Function} apiCall - Función async que realiza la llamada al backend
 * @param {string} component - Nombre del componente para logs de contexto
 * @param {string} errorMessage - Mensaje personalizado para errores
 * @returns {Promise<Object>} Objeto con { success, data?, error? }
 */
export const safeApiCall = async (apiCall, component, errorMessage) => {
  try {
    Logger.debug(component, '🚀 Iniciando llamada segura al backend...');
    const result = await apiCall();
    Logger.debug(component, '✅ Llamada API exitosa:', result);
    return { success: true, data: result };
  } catch (error) {
    Logger.error(component, `💥 ${errorMessage}:`, error);
    return { success: false, error };
  }
};

/**
 * 👁️ State Monitor - Vigilante de Estado de React
 * 
 * Hook personalizado para monitorear cambios de estado en tiempo real.
 * Perfecto para debugging de componentes complejos donde necesitas ver
 * exactamente cómo y cuándo cambian los valores.
 * 
 * 🎯 CASOS DE USO:
 * - Debugging de hooks complejos (useEffect con múltiples dependencias)
 * - Seguimiento de estado en componentes con muchas variables
 * - Detectar renders innecesarios por cambios de estado
 * - Entender flujo de datos en componentes padres complejos
 * 
 * 💡 VENTAJAS:
 * - Solo activo en desarrollo (zero performance impact en prod)
 * - Agrupamiento visual en DevTools para fácil lectura
 * - Tracking automático de múltiples variables de estado
 * - Integración perfecta con React DevTools
 * 
 * 🔧 USO EN COMPONENTES:
 * ```javascript
 * import { useStateMonitor } from '../utils/debug-utils';
 * 
 * function ChatComponent() {
 *   const [messages, setMessages] = useState([]);
 *   const [isConnected, setIsConnected] = useState(false);
 *   const [user, setUser] = useState(null);
 * 
 *   // Monitorear todos los estados importantes
 *   useStateMonitor('ChatComponent', {
 *     messages,
 *     isConnected,
 *     user,
 *     messageCount: messages.length
 *   });
 * 
 *   // Ahora verás cada cambio en la consola automáticamente!
 * }
 * ```
 * 
 * 📊 OUTPUT EN CONSOLA:
 * ▼ [MONITOR][ChatComponent] Estado actualizado
 *   messages: [...]
 *   isConnected: true
 *   user: {id: 123, name: "Juan"}
 *   messageCount: 5
 * 
 * @param {string} component - Nombre del componente para identificar logs
 * @param {Object} statesToWatch - Objeto con las variables de estado a monitorear
 */
export const useStateMonitor = (component, statesToWatch) => {
  if (isDev) {
    // 📊 Agrupamiento visual para mejor organización en DevTools
    console.groupCollapsed(`[MONITOR][${component}] 📊 Estado actualizado`);
    
    // 🔍 Mostrar cada variable de estado con su valor actual
    Object.entries(statesToWatch).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    
    console.groupEnd();
  }
};

/**
 * ⏱️ Performance Measurer - Cronómetro para Optimización
 * 
 * Herramienta para medir exactamente cuánto tiempo toman tus funciones.
 * Esencial para identificar bottlenecks y optimizar performance.
 * 
 * 🎯 CASOS DE USO:
 * - Medir tiempo de procesamiento de imágenes ASL
 * - Benchmarking de algoritmos de búsqueda/filtrado
 * - Detectar funciones que causan lag en UI
 * - Optimizar operaciones costosas antes de deploy
 * 
 * 💡 VENTAJAS:
 * - Medición precisa usando performance.now() (sub-millisecond accuracy)
 * - Solo activo en desarrollo para no afectar performance en prod
 * - Resultado automático en logs para fácil tracking
 * - Wrapper transparente - no modifica el comportamiento de tu función
 * 
 * 🔧 USO PRÁCTICO:
 * ```javascript
 * import { measurePerformance } from '../utils/debug-utils';
 * 
 * // Función original costosa
 * const processLargeDataset = (data) => {
 *   return data.map(item => complexTransformation(item));
 * };
 * 
 * // Versión con medición
 * const result = measurePerformance(
 *   () => processLargeDataset(bigData),
 *   'DataProcessor',
 *   'processLargeDataset'
 * );
 * // OUTPUT: [DEBUG][DataProcessor] processLargeDataset ejecutado en 245.67ms
 * ```
 * 
 * 🚀 TIP DE OPTIMIZACIÓN:
 * Si una función toma >100ms regularmente, considera:
 * - Moverla a un Web Worker
 * - Implementar lazy loading
 * - Dividirla en chunks más pequeños
 * - Usar useMemo/useCallback en React
 * 
 * @param {Function} fn - Función a ejecutar y medir
 * @param {string} component - Nombre del componente para logs de contexto
 * @param {string} functionName - Nombre de la función para identificar en logs
 * @returns {any} El resultado original de la función (sin modificar)
 */
export const measurePerformance = (fn, component, functionName) => {
  // 🏃‍♂️ En producción, ejecutar directamente sin overhead de medición
  if (!isDev) return fn();
  
  // ⏱️ Capturar tiempo de inicio con precisión sub-millisecond
  const start = performance.now();
  
  // 🎯 Ejecutar la función original
  const result = fn();
  
  // ⏱️ Capturar tiempo final y calcular duración
  const end = performance.now();
  const duration = (end - start).toFixed(2);
  
  // 📊 Log del resultado con información útil para optimización
  Logger.debug(component, `⏱️ ${functionName} ejecutado en ${duration}ms`);
  
  // 🚨 Advertencia automática para funciones lentas
  if (end - start > 100) {
    Logger.warn(component, `🐌 Función lenta detectada: ${functionName} (${duration}ms) - considera optimización`);
  }
  
  return result;
};