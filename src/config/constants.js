/**
 * Constantes de la aplicación
 */

// URL base para la API
export const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://api.ovaonline.tech';

// Rutas de la API
export const API_ROUTES = {
  STATUS: '/status',
  CHAT_WS: '/api/ws/chat',
  ANALYZE_IMAGE: '/api/analyze-sign-language',
  VOICE_PROCESSING: '/api/process-voice',
  IMAGE_PROCESSING: '/api/process-image',
};

// Nombres de componentes para logs
export const COMPONENT_NAMES = {
  APP: 'App',
  CHAT: 'Chat',
  VOICE_RECORDER: 'VoiceRecorder',
  IMAGE_UPLOADER: 'ImageUploader',
  API_SERVICE: 'ApiService',
  CHAT_UTILS: 'ChatUtils',
};

// Configuración de WebSocket
export const WEBSOCKET_CONFIG = {
  RECONNECT_INTERVAL: 5000, // 5 segundos
};

// Configuración de UI
export const UI_CONFIG = {
  SUPPORTED_LANGUAGES: ['es', 'en'],
  DEFAULT_LANGUAGE: 'es',
  ANIMATION_DURATION: 300, // ms
};

export default {
  API_BASE_URL,
  API_ROUTES,
  COMPONENT_NAMES,
  WEBSOCKET_CONFIG,
  UI_CONFIG,
}; 