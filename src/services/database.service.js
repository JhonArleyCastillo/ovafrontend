import Logger from '../utils/debug-utils';
import { API_BASE_URL, API_ROUTES, API_TIMEOUT } from '../config/api.routes';
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
      
      // Implementar timeout usando AbortController
      const controller = new AbortController();
      options.signal = controller.signal;
      const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
      
      let response;
      try {
        response = await fetch(url, options);
        // Limpiar el tiempo de espera una vez que la solicitud se completa
        clearTimeout(timeout);
      } catch (error) {
        // Si se agotó el tiempo o hay un error de red, lanzamos un error específico
        if (error.name === 'AbortError') {
          throw new Error('La solicitud al servidor tardó demasiado tiempo. Por favor, inténtalo de nuevo más tarde.');
        } else {
          throw new Error(`Error de conexión: ${error.message}`);
        }
      }
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || `Error ${response.status}: ${response.statusText}`;
        } catch (e) {
          // Si no podemos parsear la respuesta como JSON
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Si es 204 No Content, no intentar parsear JSON
      if (response.status === 204) {
        return { success: true };
      }
      
      return await response.json();
    } catch (error) {
      // Mejorar los mensajes de error para problemas comunes
      let errorMessage = error.message;
      
      if (error.message.includes('NetworkError') || 
          error.message.includes('Failed to fetch') || 
          error.message.includes('Network request failed')) {
        
        errorMessage = 'No se pudo conectar al servidor. Por favor, verifica tu conexión a internet o inténtalo más tarde.';
      }
      
      Logger.error(this.COMPONENT_NAME, `Error en petición API: ${errorMessage}`, error);
      throw new Error(errorMessage);
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