import Logger from './debug-utils';

/**
 * Utilidades para diagnosticar y resolver problemas de red
 */
class NetworkUtils {
  static COMPONENT_NAME = 'NetworkUtils';
  
  /**
   * Asegura que una URL use HTTPS si estamos en una página HTTPS
   * @param {string} url - URL a verificar y convertir si es necesario
   * @returns {string} - URL con el protocolo correcto
   */
  static ensureSecureUrl(url) {
    // Si estamos en una página HTTPS, forzamos HTTPS en todas las URLs
    if (window.location.protocol === 'https:' && url.startsWith('http:')) {
      Logger.info(this.COMPONENT_NAME, `Cambiando ${url} a HTTPS para evitar problemas de contenido mixto`);
      return url.replace('http:', 'https:');
    }
    return url;
  }
  
  /**
   * Verifica la conectividad a un servidor haciendo un ping al endpoint de estado
   * @param {string} baseUrl - URL base del servidor (ej: https://api.example.com)
   * @param {number} timeout - Tiempo límite en ms para la respuesta
   * @returns {Promise<{isAvailable: boolean, responseTime: number, details: Object}>} - Resultado del diagnóstico
   */
  static async checkServerConnectivity(baseUrl, timeout = 5000) {
    // Asegurar que usamos HTTPS si estamos en una página HTTPS
    baseUrl = this.ensureSecureUrl(baseUrl);
    
    const startTime = Date.now();
    const statusUrl = `${baseUrl}/status`;
    
    Logger.debug(this.COMPONENT_NAME, `Verificando conectividad a ${baseUrl} (timeout: ${timeout}ms)`);
    
    try {
      // Configurar timeout con AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(statusUrl, { 
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      
      // Limpiar el timeout
      clearTimeout(timeoutId);
      
      // Calcular tiempo de respuesta
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          isAvailable: false,
          responseTime,
          details: {
            status: response.status,
            statusText: response.statusText,
            error: `HTTP Error: ${response.status} ${response.statusText}`
          }
        };
      }
      
      // Intentar obtener la respuesta como JSON
      const data = await response.json().catch(() => ({ status: 'unknown' }));
      
      Logger.debug(this.COMPONENT_NAME, `Servidor ${baseUrl} disponible, tiempo de respuesta: ${responseTime}ms`);
      
      return {
        isAvailable: true,
        responseTime,
        details: {
          status: response.status,
          data
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      let errorType = 'unknown';
      
      if (error.name === 'AbortError') {
        errorType = 'timeout';
        Logger.warn(this.COMPONENT_NAME, `Timeout al conectar a ${baseUrl} después de ${responseTime}ms`);
      } else if (error.message.includes('Failed to fetch')) {
        errorType = 'connection_failed';
        Logger.warn(this.COMPONENT_NAME, `Error de conexión a ${baseUrl}: ${error.message}`);
      } else {
        Logger.error(this.COMPONENT_NAME, `Error al verificar ${baseUrl}: ${error.message}`, error);
      }
      
      return {
        isAvailable: false,
        responseTime,
        details: {
          errorType,
          message: error.message,
          error
        }
      };
    }
  }
  
  /**
   * Verifica la conectividad a múltiples servidores y devuelve el mejor disponible
   * @param {Array<string>} serverUrls - Lista de URLs de servidores a verificar
   * @param {number} timeout - Tiempo límite en ms para cada servidor
   * @returns {Promise<{bestServer: string|null, results: Object}>} - Mejor servidor y resultados completos
   */
  static async findBestAvailableServer(serverUrls, timeout = 3000) {
    if (!serverUrls || !serverUrls.length) {
      return { bestServer: null, results: {} };
    }
    
    Logger.debug(this.COMPONENT_NAME, `Buscando mejor servidor entre ${serverUrls.length} opciones`);
    
    const results = {};
    let bestServer = null;
    let fastestResponseTime = Infinity;
    
    // Verificar todos los servidores en paralelo
    const checkPromises = serverUrls.map(async (url) => {
      // Asegurar que usamos HTTPS si estamos en una página HTTPS
      url = this.ensureSecureUrl(url);
      
      const result = await this.checkServerConnectivity(url, timeout);
      results[url] = result;
      
      // Si está disponible y es más rápido que el actual mejor servidor, actualizar
      if (result.isAvailable && result.responseTime < fastestResponseTime) {
        fastestResponseTime = result.responseTime;
        bestServer = url;
      }
    });
    
    // Esperar a que todas las verificaciones terminen
    await Promise.all(checkPromises);
    
    Logger.info(this.COMPONENT_NAME, bestServer 
      ? `Mejor servidor disponible: ${bestServer} (${fastestResponseTime}ms)` 
      : 'No hay servidores disponibles');
    
    return { bestServer, results };
  }
  
  /**
   * Comprueba si una URL tiene un certificado SSL válido
   * @param {string} url - URL a verificar
   * @returns {Promise<boolean>} - true si el certificado es válido
   */
  static async checkSSLCertificate(url) {
    // Asegurar que usamos HTTPS si estamos en una página HTTPS
    url = this.ensureSecureUrl(url);
    
    if (!url.startsWith('https://')) {
      return { valid: false, reason: 'Not HTTPS' };
    }
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return { valid: true };
    } catch (error) {
      // Los errores de certificado generalmente tienen mensajes específicos
      const isCertificateError = error.message.includes('certificate') || 
                                 error.message.includes('SSL') ||
                                 error.message.includes('TLS');
      
      return { 
        valid: false, 
        reason: isCertificateError ? 'Invalid Certificate' : 'Connection Error',
        error: error.message 
      };
    }
  }
  
  /**
   * Realiza pruebas de resolución DNS para diagnosticar problemas
   * @param {string} hostname - Nombre de host a resolver
   * @returns {Promise<Object>} - Resultado del diagnóstico
   */
  static async checkDNS(hostname) {
    try {
      // Extraer hostname de URL completa si es necesario
      if (hostname.startsWith('http')) {
        hostname = new URL(hostname).hostname;
      }
      
      // Asegurar que usamos HTTPS si estamos en una página HTTPS
      hostname = this.ensureSecureUrl(`http://${hostname}`).replace('http://', '');
      
      // No podemos hacer una verdadera resolución DNS desde el navegador,
      // pero podemos intentar hacer una petición para ver si se resuelve
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      await fetch(`https://${hostname}/favicon.ico`, { 
        method: 'HEAD',
        signal: controller.signal
      }).catch(() => {});
      
      clearTimeout(timeoutId);
      
      // Si llegamos aquí sin error de timeout, asumimos que el DNS resolvió correctamente
      return { resolved: true };
    } catch (error) {
      const isDNSError = error.message.includes('DNS') || 
                         error.name === 'TypeError' || 
                         error.name === 'AbortError';
      
      return {
        resolved: false,
        reason: isDNSError ? 'DNS Resolution Failed' : 'Other Error',
        error: error.message
      };
    }
  }
}

/**
 * Encuentra el mejor servidor disponible de una lista
 * @param {Array<string>} serverUrls - Lista de URLs de servidores para probar
 * @param {number} timeout - Tiempo máximo de espera en ms (opcional)
 * @returns {Promise<{bestServer: string|null, results: Object}>} - El mejor servidor disponible
 */
export const findBestAvailableServer = async (serverUrls, timeout = 5000) => {
  // Filtrar URLs inválidas o que usen directamente IP con HTTPS
  const validServerUrls = serverUrls.filter(url => {
    // Evitar URLs HTTPS que usen IP directamente (causará error de certificado)
    if (url.startsWith('https://') && /^https:\/\/\d+\.\d+\.\d+\.\d+/.test(url)) {
      console.warn(`Omitiendo URL inválida: ${url} - No se puede usar HTTPS con IP directa`);
      return false;
    }
    return true;
  });

  if (!validServerUrls.length) {
    return { bestServer: null, results: { error: 'No hay URLs de servidor válidas' } };
  }

  return NetworkUtils.findBestAvailableServer(validServerUrls, timeout);
};

export default NetworkUtils;