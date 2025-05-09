import { API_BASE_URL, API_BACKUP_URL, API_TIMEOUT } from '../config/api.routes';
import Logger from '../utils/debug-utils';
import { COMPONENT_NAMES } from '../config/constants';
import NetworkUtils from '../utils/network-utils';

/**
 * Constantes para manejo de errores
 */
const ERROR_TYPES = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  SERVER: 'server',
  UNKNOWN: 'unknown'
};

/**
 * Servicio para manejar la autenticación de administradores
 */
class AuthService {
  static COMPONENT_NAME = COMPONENT_NAMES.AUTH_SERVICE || 'AuthService';
  static TOKEN_KEY = 'admin_token';
  static USER_KEY = 'admin_user';
  static API_RETRY = 'api_retry_attempted'; // Para evitar bucles de retry
  static BEST_SERVER_KEY = 'best_server_url'; // Para almacenar la mejor URL de servidor

  /**
   * Lista de servidores disponibles ordenados por preferencia
   * @returns {Array<string>} Lista de URLs de servidores
   */
  static getServerList() {
    const serverList = [
      API_BASE_URL,
      API_BACKUP_URL
    ];
    
    // Filtrar valores duplicados y vacíos
    return [...new Set(serverList)].filter(Boolean);
  }

  /**
   * Obtiene el mejor servidor disponible o lo determina automáticamente
   * @param {boolean} forceCheck - Si es true, ignora la caché y verifica de nuevo
   * @returns {Promise<string>} - La URL del mejor servidor disponible
   */
  static async getBestServer(forceCheck = false) {
    // Si ya tenemos un servidor conocido y no forzamos verificación, usarlo
    const cachedBestServer = sessionStorage.getItem(this.BEST_SERVER_KEY);
    if (cachedBestServer && !forceCheck) {
      return cachedBestServer;
    }
    
    // Obtener lista de servidores para verificar
    const serverList = this.getServerList();
    
    if (!serverList.length) {
      Logger.error(this.COMPONENT_NAME, 'No hay servidores configurados');
      return API_BASE_URL; // Por defecto
    }
    
    try {
      // Verificar conectividad de todos los servidores y obtener el mejor
      const { bestServer } = await NetworkUtils.findBestAvailableServer(serverList, 3000);
      
      if (bestServer) {
        // Guardar el mejor servidor en sessionStorage
        sessionStorage.setItem(this.BEST_SERVER_KEY, bestServer);
        return bestServer;
      } else {
        // Si ningún servidor está disponible, usar el predeterminado
        Logger.warn(this.COMPONENT_NAME, `Ningún servidor está disponible. Usando el predeterminado: ${API_BASE_URL}`);
        return API_BASE_URL;
      }
    } catch (error) {
      Logger.error(this.COMPONENT_NAME, `Error al determinar el mejor servidor: ${error.message}`, error);
      return API_BASE_URL; // En caso de error, usar el predeterminado
    }
  }

  /**
   * Inicia sesión con credenciales de administrador
   * @param {string} email - Correo electrónico del administrador
   * @param {string} password - Contraseña del administrador
   * @param {Object} options - Opciones adicionales
   * @param {boolean} options.tryAllServers - Si es true, intenta con todos los servidores
   * @param {boolean} options.forceServerCheck - Si es true, verifica disponibilidad del servidor
   * @returns {Promise<Object>} - Datos del administrador y token JWT
   */
  static async login(email, password, { tryAllServers = true, forceServerCheck = false } = {}) {
    Logger.debug(this.COMPONENT_NAME, `Iniciando sesión como ${email}`);
    
    // Preparar datos del formulario
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    // Determinar el mejor servidor antes de intentar el login
    let apiBaseUrl;
    try {
      apiBaseUrl = await this.getBestServer(forceServerCheck);
    } catch (error) {
      apiBaseUrl = API_BASE_URL; // En caso de error, usar el por defecto
    }
    
    // Construir URL completa para la autenticación
    const apiUrl = `${apiBaseUrl}/api/auth/token`;
    
    // Verificar si ya intentamos con todos los servidores
    const retriedAll = sessionStorage.getItem(this.API_RETRY) === 'true';
    if (retriedAll && !forceServerCheck) {
      // Limpiar bandera para permitir nuevos intentos
      sessionStorage.removeItem(this.API_RETRY);
    }
    
    try {
      Logger.debug(this.COMPONENT_NAME, `Intentando conectar a: ${apiUrl}`);
      
      // Realizar diagnóstico rápido del servidor
      const connectivityCheck = await NetworkUtils.checkServerConnectivity(apiBaseUrl, 3000);
      if (!connectivityCheck.isAvailable) {
        Logger.warn(
          this.COMPONENT_NAME, 
          `El servidor ${apiBaseUrl} no está disponible. Detalles: ${JSON.stringify(connectivityCheck.details)}`
        );
        
        if (tryAllServers && !retriedAll) {
          // Marcar que ya intentamos con todos los servidores
          sessionStorage.setItem(this.API_RETRY, 'true');
          
          // Forzar una nueva verificación de servidores disponibles
          return this.login(email, password, { 
            tryAllServers: true, 
            forceServerCheck: true 
          });
        }
        
        throw new Error(`El servidor no está disponible (${connectivityCheck.details.errorType || 'error desconocido'})`);
      }
      
      // Configuración del tiempo límite con AbortController
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
        signal: controller.signal,
      });
      
      // Limpiar el timeout ya que la solicitud se completó
      clearTimeout(timeout);
      
      // Si llegamos aquí con éxito, limpiar la bandera de reintento
      sessionStorage.removeItem(this.API_RETRY);

      if (!response.ok) {
        let errorType = ERROR_TYPES.UNKNOWN;
        let errorMessage = '';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || `Error ${response.status}: ${response.statusText}`;
          
          // Determinar el tipo de error basado en el código de respuesta
          if (response.status === 401 || response.status === 403) {
            errorType = ERROR_TYPES.AUTHENTICATION;
          } else if (response.status >= 500) {
            errorType = ERROR_TYPES.SERVER;
          }
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        
        const error = new Error(errorMessage);
        error.type = errorType;
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      
      // Guardar el token en localStorage
      localStorage.setItem(this.TOKEN_KEY, data.access_token);
      
      // Decodificar el token JWT para extraer información del usuario
      const userData = this.parseJwt(data.access_token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(userData));

      return {
        token: data.access_token,
        user: userData
      };
    } catch (error) {
      // Establecer un tipo de error predeterminado
      if (!error.type) {
        error.type = ERROR_TYPES.UNKNOWN;
      }
      
      // Manejar específicamente errores de timeout y conexión
      if (error.name === 'AbortError' || 
          error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') || 
          error.message.includes('Network request failed')) {
        
        error.type = ERROR_TYPES.NETWORK;
        Logger.warn(this.COMPONENT_NAME, `Error de conexión con API: ${error.message}`);
        
        // Si aún no hemos intentado con todos los servidores, intentarlo
        if (tryAllServers && !retriedAll) {
          Logger.info(this.COMPONENT_NAME, 'Verificando otros servidores disponibles...');
          
          // Marcar que ya intentamos con todos los servidores
          sessionStorage.setItem(this.API_RETRY, 'true');
          
          // Forzar una nueva verificación de servidores disponibles
          return this.login(email, password, { 
            tryAllServers: true, 
            forceServerCheck: true 
          });
        } else {
          // Ya intentamos con todos los servidores
          throw new Error(
            'No se pudo conectar a ningún servidor. Comprueba tu conexión a internet ' +
            'o contacta al administrador si el problema persiste.'
          );
        }
      }
      
      // Registrar el error detallado para depuración
      Logger.error(
        this.COMPONENT_NAME, 
        `Error de inicio de sesión: ${error.message} (Tipo: ${error.type})`, 
        error
      );
      
      // Cualquier otro error, simplemente reenviar
      throw error;
    }
  }

  /**
   * Cierra la sesión del administrador actual
   */
  static async logout() {
    Logger.debug(this.COMPONENT_NAME, 'Cerrando sesión');
    
    try {
      const token = this.getToken();
      
      if (token) {
        // Obtener el mejor servidor disponible
        let apiBaseUrl;
        try {
          apiBaseUrl = await this.getBestServer(); 
        } catch (error) {
          apiBaseUrl = API_BASE_URL; // En caso de error, usar el predeterminado
        }
        
        // Intentar cerrar sesión en el servidor con timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
        
        try {
          await fetch(`${apiBaseUrl}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeout);
        } catch (err) {
          // Si hay error al cerrar sesión en el servidor, solo lo registramos 
          // pero continuamos con el proceso de logout local
          Logger.warn(this.COMPONENT_NAME, `Error al cerrar sesión en servidor: ${err.message}`);
        }
      }
      
      // Eliminar datos de sesión locales
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      sessionStorage.removeItem(this.API_RETRY);
      sessionStorage.removeItem(this.BEST_SERVER_KEY);
      
      return true;
    } catch (error) {
      Logger.error(this.COMPONENT_NAME, `Error al cerrar sesión: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Verifica si hay un administrador autenticado actualmente
   * @returns {boolean} - true si hay un administrador autenticado
   */
  static isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Obtiene el token JWT actual
   * @returns {string|null} - Token JWT o null si no existe
   */
  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtiene los datos del administrador actual
   * @returns {Object|null} - Datos del administrador o null si no existe
   */
  static getCurrentAdmin() {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Comprueba si la API está disponible
   * @param {boolean} checkAllServers - Si debe verificar todos los servidores
   * @returns {Promise<{isAvailable: boolean, bestServer: string|null, details: Object}>} - Resultado del diagnóstico
   */
  static async isApiAvailable(checkAllServers = true) {
    // Lista de servidores a verificar
    const serverList = checkAllServers ? this.getServerList() : [API_BASE_URL];
    
    try {
      // Verificar todos los servidores
      const { bestServer, results } = await NetworkUtils.findBestAvailableServer(serverList);
      
      // Si encontramos un servidor disponible
      if (bestServer) {
        return {
          isAvailable: true,
          bestServer,
          results
        };
      }
      
      return {
        isAvailable: false,
        bestServer: null,
        results
      };
    } catch (error) {
      Logger.error(this.COMPONENT_NAME, `Error al verificar disponibilidad de la API: ${error.message}`, error);
      return {
        isAvailable: false,
        bestServer: null,
        error: error.message
      };
    }
  }
  
  /**
   * Diagnostica problemas de conexión a la API y proporciona información detallada
   * @returns {Promise<Object>} - Diagnóstico detallado
   */
  static async diagnosisApiConnection() {
    Logger.debug(this.COMPONENT_NAME, 'Iniciando diagnóstico de conexión a la API');
    const diagnosis = {
      servers: {},
      dns: {},
      ssl: {}
    };
    
    try {
      // 1. Verificar disponibilidad de servidores
      const serverList = this.getServerList();
      const { bestServer, results } = await NetworkUtils.findBestAvailableServer(serverList);
      
      diagnosis.servers = {
        checked: serverList,
        bestServer,
        results
      };
      
      // 2. Verificar resolución DNS para cada servidor
      for (const server of serverList) {
        try {
          const url = new URL(server);
          const dnsCheck = await NetworkUtils.checkDNS(url.hostname);
          diagnosis.dns[url.hostname] = dnsCheck;
        } catch (e) {
          diagnosis.dns[server] = { error: e.message };
        }
      }
      
      // 3. Verificar certificados SSL para servidores HTTPS
      for (const server of serverList.filter(url => url.startsWith('https'))) {
        try {
          const sslCheck = await NetworkUtils.checkSSLCertificate(server);
          diagnosis.ssl[server] = sslCheck;
        } catch (e) {
          diagnosis.ssl[server] = { error: e.message };
        }
      }
      
      return {
        timestamp: new Date().toISOString(),
        success: !!bestServer,
        diagnosis
      };
    } catch (error) {
      Logger.error(this.COMPONENT_NAME, `Error en diagnóstico de API: ${error.message}`, error);
      return {
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Decodifica un token JWT para extraer la información
   * @param {string} token - Token JWT a decodificar
   * @returns {Object} - Datos decodificados del token
   * @private
   */
  static parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      Logger.error(this.COMPONENT_NAME, `Error al decodificar token JWT: ${error.message}`, error);
      return {};
    }
  }
}

export default AuthService;