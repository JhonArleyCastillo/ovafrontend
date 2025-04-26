import Logger from '../utils/debug-utils';
import { API_BASE_URL, API_ROUTES } from '../config/api.routes';
import { COMPONENT_NAMES } from '../config/constants';
import AuthService from './auth.service';

/**
 * Clase para manejar las operaciones con la base de datos a través de la API
 */
class DatabaseService {
  static COMPONENT_NAME = COMPONENT_NAMES.DATABASE_SERVICE;

  /**
   * Método auxiliar para realizar peticiones a la API con autenticación
   * @param {string} url - URL completa del endpoint de la API
   * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
   * @param {Object} body - Datos a enviar (opcional)
   * @returns {Promise<Object>} - Respuesta del servidor
   * @private
   */
  static async _fetchWithAuth(url, method = 'GET', body = null) {
    Logger.debug(this.COMPONENT_NAME, `${method} request a ${url}`);
    
    try {
      // Obtener token de autenticación
      const token = AuthService.getToken();
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Añadir token si existe
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const options = {
        method,
        headers,
        mode: 'cors',
        cache: 'no-cache',
      };
      
      // Añadir body si no es GET y hay datos
      if (method !== 'GET' && body) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          detail: `Error ${response.status}: ${response.statusText}` 
        }));
        throw new Error(errorData.detail || `Error ${response.status}`);
      }
      
      // Si es 204 No Content, no intentar parsear JSON
      if (response.status === 204) {
        return { success: true };
      }
      
      return await response.json();
    } catch (error) {
      Logger.error(this.COMPONENT_NAME, `Error en petición API: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * USUARIOS
   */

  /**
   * Obtener todos los usuarios
   * @returns {Promise<Array>} - Lista de usuarios
   */
  static async getUsuarios() {
    return this._fetchWithAuth(API_ROUTES.USUARIOS);
  }
  
  /**
   * Obtener un usuario por ID
   * @param {number} id - ID del usuario
   * @returns {Promise<Object>} - Datos del usuario
   */
  static async getUsuario(id) {
    return this._fetchWithAuth(API_ROUTES.USUARIO_BY_ID(id));
  }
  
  /**
   * Crear un nuevo usuario
   * @param {Object} userData - Datos del nuevo usuario
   * @returns {Promise<Object>} - Usuario creado
   */
  static async createUsuario(userData) {
    return this._fetchWithAuth(API_ROUTES.USUARIOS, 'POST', userData);
  }
  
  /**
   * Actualizar un usuario
   * @param {number} id - ID del usuario
   * @param {Object} userData - Datos a actualizar
   * @returns {Promise<Object>} - Usuario actualizado
   */
  static async updateUsuario(id, userData) {
    return this._fetchWithAuth(API_ROUTES.USUARIO_BY_ID(id), 'PUT', userData);
  }
  
  /**
   * Eliminar un usuario
   * @param {number} id - ID del usuario
   * @returns {Promise<Object>} - Confirmación
   */
  static async deleteUsuario(id) {
    return this._fetchWithAuth(API_ROUTES.USUARIO_BY_ID(id), 'DELETE');
  }
  
  /**
   * CONTACTOS
   */
  
  /**
   * Enviar un nuevo mensaje de contacto
   * @param {Object} contactData - Datos del mensaje
   * @returns {Promise<Object>} - Mensaje creado
   */
  static async sendContacto(contactData) {
    return this._fetchWithAuth(API_ROUTES.CONTACTOS, 'POST', contactData);
  }
  
  /**
   * Obtener todos los mensajes de contacto (admin)
   * @returns {Promise<Array>} - Lista de mensajes
   */
  static async getContactos() {
    return this._fetchWithAuth(API_ROUTES.CONTACTOS);
  }
  
  /**
   * Actualizar estado de un mensaje (leído/respondido)
   * @param {number} id - ID del mensaje
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} - Mensaje actualizado
   */
  static async updateContacto(id, updateData) {
    return this._fetchWithAuth(API_ROUTES.CONTACTO_BY_ID(id), 'PATCH', updateData);
  }
}

export default DatabaseService;