/**
 * Configuración centralizada de rutas API para el frontend.
 */

// URL base de la API - Determina automáticamente basado en el entorno
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_PROD_API_URL || 'https://api.ovaonline.tech'
  : process.env.REACT_APP_DEV_API_URL || 'http://localhost:8000';

export const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
export const WS_BASE_URL = `${WS_PROTOCOL}//${API_BASE_URL.replace(/^https?:\/\//, '')}`;

// Rutas WebSocket
export const WS_ROUTES = {
  DETECT_AUDIO: `${WS_BASE_URL}/api/detect`,
  CHAT: `${WS_BASE_URL}/api/chat`,
};

// Rutas REST
export const REST_ROUTES = {
  STATUS: `${API_BASE_URL}/status`,
  PROCESS_IMAGE: `${API_BASE_URL}/api/process-image`,
  ANALYZE_SIGN_LANGUAGE: `${API_BASE_URL}/api/analyze-sign-language`,
  PROCESS_VOICE: `${API_BASE_URL}/api/process-voice`,
};

// Exportar todas las rutas juntas para facilitar importación
export const API_ROUTES = {
  ...REST_ROUTES,
  WS: WS_ROUTES,
};

export default API_ROUTES;