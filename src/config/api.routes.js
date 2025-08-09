/**
 * Configuración centralizada de rutas API para el frontend.
 */

// Definir valores por defecto para los entornos
const DEFAULT_PROD_API_URL = 'https://www.api.ovaonline.tech';
const DEFAULT_DEV_API_URL = 'http://localhost:8000';
// Ya no usamos la IP directa para evitar errores de certificado SSL
const BACKUP_API_URL = DEFAULT_PROD_API_URL; // Usamos el dominio en lugar de la IP

// Timeout para peticiones API en milisegundos
export const API_TIMEOUT = 10000; // 10 segundos

// URL base de la API - Determina automáticamente basado en el entorno
let apiBaseUrl = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_PROD_API_URL || DEFAULT_PROD_API_URL
  : process.env.REACT_APP_DEV_API_URL || DEFAULT_DEV_API_URL;

// Asegurar que en producción siempre usemos HTTPS
if (process.env.NODE_ENV === 'production' && apiBaseUrl.startsWith('http:')) {
  apiBaseUrl = apiBaseUrl.replace('http:', 'https:');
}

export const API_BASE_URL = apiBaseUrl;

// URL de respaldo para intentar si la principal falla
let backupUrl = process.env.REACT_APP_BACKUP_API_URL || BACKUP_API_URL;

// Asegurar que la URL de respaldo también use HTTPS en producción
if (process.env.NODE_ENV === 'production' && backupUrl.startsWith('http:')) {
  backupUrl = backupUrl.replace('http:', 'https:');
}

export const API_BACKUP_URL = backupUrl;

export const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
export const WS_BASE_URL = `${WS_PROTOCOL}//${API_BASE_URL.replace(/^https?:\/\//, '')}`;

// Rutas WebSocket
export const WS_ROUTES = {
  // DETECT_AUDIO: `${WS_BASE_URL}/api/detect`, // ❌ REMOVIDO - Endpoint no disponible en backend optimizado
  CHAT: `${WS_BASE_URL}/api/chat`, // ✅ Disponible
};

// Rutas REST
export const REST_ROUTES = {
  STATUS: `${API_BASE_URL}/status`,
  ASL_PREDICT_SPACE: `${API_BASE_URL}/api/image/asl/predict_space`,
  CHAT: `${API_BASE_URL}/api/image/chat`,
  // Rutas de autenticación
  AUTH_LOGIN: `${API_BASE_URL}/api/auth/token`,
  AUTH_LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  ADMIN_LIST: `${API_BASE_URL}/api/auth/admins`,
  ADMIN_SESSIONS: `${API_BASE_URL}/api/auth/sessions`,
  
  // Rutas para operaciones con la base de datos
  // Usuarios
  USUARIOS: `${API_BASE_URL}/api/usuarios`,
  USUARIO_BY_ID: (id) => `${API_BASE_URL}/api/usuarios/${id}`,
  
  // Contactos
  CONTACTOS: `${API_BASE_URL}/api/contactos`,
  CONTACTO_BY_ID: (id) => `${API_BASE_URL}/api/contactos/${id}`,
};

// Exportar todas las rutas juntas para facilitar importación
export const API_ROUTES = {
  ...REST_ROUTES,
  WS: WS_ROUTES,
};

export default API_ROUTES;