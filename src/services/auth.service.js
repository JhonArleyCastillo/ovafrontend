import { API_BASE_URL } from '../config/api.routes';
import Logger from '../utils/debug-utils';
import { COMPONENT_NAMES } from '../config/constants';

/**
 * Servicio para manejar la autenticación de administradores
 */
class AuthService {
  static COMPONENT_NAME = COMPONENT_NAMES.AUTH_SERVICE || 'AuthService';
  static TOKEN_KEY = 'admin_token';
  static USER_KEY = 'admin_user';

  /**
   * Inicia sesión con credenciales de administrador
   * @param {string} email - Correo electrónico del administrador
   * @param {string} password - Contraseña del administrador
   * @returns {Promise<Object>} - Datos del administrador y token JWT
   */
  static async login(email, password) {
    Logger.debug(this.COMPONENT_NAME, `Iniciando sesión como ${email}`);
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/api/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
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
      Logger.error(this.COMPONENT_NAME, `Error de inicio de sesión: ${error.message}`, error);
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
        // Intentar cerrar sesión en el servidor
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          // Si hay error al cerrar sesión en el servidor, solo lo registramos 
          // pero continuamos con el proceso de logout local
          Logger.warn(this.COMPONENT_NAME, `Error al cerrar sesión en servidor: ${err.message}`);
        });
      }
      
      // Eliminar datos de sesión locales
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      
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