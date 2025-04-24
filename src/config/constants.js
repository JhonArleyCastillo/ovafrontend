/**
 * Constantes de la aplicación
 */

// Importar API_ROUTES completo desde api.routes para evitar duplicación
import { API_BASE_URL, API_ROUTES } from './api.routes';

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