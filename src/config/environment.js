/**
 * Configuración de entornos para despliegue
 * Define URLs y configuraciones específicas para cada entorno
 */

// Configuración base
const ENV_CONFIG = {
  development: {
    API_BASE_URL: 'http://localhost:8000',
    WS_BASE_URL: 'ws://localhost:8000',
    WS_FALLBACK_URL: 'ws://127.0.0.1:8000',
    DEBUG_ENABLED: true,
    RETRY_ATTEMPTS: 3,
    HEARTBEAT_INTERVAL: 30000,
    CONNECTION_TIMEOUT: 10000
  },
  
  staging: {
    API_BASE_URL: 'https://staging-api.ovaonline.tech',
    WS_BASE_URL: 'wss://staging-api.ovaonline.tech',
    WS_FALLBACK_URL: 'wss://staging.ovaonline.tech',
    DEBUG_ENABLED: true,
    RETRY_ATTEMPTS: 5,
    HEARTBEAT_INTERVAL: 45000,
    CONNECTION_TIMEOUT: 15000
  },
  
  production: {
  API_BASE_URL: 'https://api.ovaonline.tech',
  WS_BASE_URL: 'wss://api.ovaonline.tech',
  WS_FALLBACK_URL: 'wss://www.api.ovaonline.tech',
    DEBUG_ENABLED: false,
    RETRY_ATTEMPTS: 5,
    HEARTBEAT_INTERVAL: 60000,
    CONNECTION_TIMEOUT: 20000
  }
};

// Detectar entorno actual
const getCurrentEnv = () => {
  // Verificar variable de entorno específica
  if (process.env.REACT_APP_ENV) {
    return process.env.REACT_APP_ENV;
  }
  
  // Verificar NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  // Verificar por hostname para staging
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('staging') || hostname.includes('test')) {
      return 'staging';
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
  }
  
  // Por defecto development
  return 'development';
};

// Obtener configuración actual
const currentEnv = getCurrentEnv();
const config = {
  ...ENV_CONFIG[currentEnv],
  CURRENT_ENV: currentEnv
};

// Permitir override por variables de entorno
if (process.env.REACT_APP_API_BASE_URL) {
  config.API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
}

if (process.env.REACT_APP_WS_BASE_URL) {
  config.WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL;
}

// Validación de configuración
const validateConfig = () => {
  const required = ['API_BASE_URL', 'WS_BASE_URL'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Configuración incompleta. Faltan: ${missing.join(', ')}`);
    throw new Error(`Configuración incompleta: ${missing.join(', ')}`);
  }
  
  console.info(`✅ Configuración cargada para entorno: ${currentEnv}`);
  console.info(`📡 API Base URL: ${config.API_BASE_URL}`);
  console.info(`🔌 WebSocket URL: ${config.WS_BASE_URL}`);
  
  if (config.DEBUG_ENABLED) {
    console.info('🐛 Debug habilitado');
  }
};

// Validar configuración al cargar
validateConfig();

export default config;

// Exports individuales para compatibilidad
export const {
  API_BASE_URL,
  WS_BASE_URL,
  WS_FALLBACK_URL,
  DEBUG_ENABLED,
  RETRY_ATTEMPTS,
  HEARTBEAT_INTERVAL,
  CONNECTION_TIMEOUT,
  CURRENT_ENV
} = config;

// Función helper para obtener URL completa de WebSocket
export const getWebSocketUrl = (path = '/api/chat') => {
  return `${WS_BASE_URL}${path}`;
};

// Función helper para obtener URL de fallback
export const getFallbackWebSocketUrl = (path = '/api/chat') => {
  return `${WS_FALLBACK_URL}${path}`;
};

// Función para verificar si estamos en desarrollo
export const isDevelopment = () => currentEnv === 'development';

// Función para verificar si estamos en producción
export const isProduction = () => currentEnv === 'production';

// Función para verificar si estamos en staging
export const isStaging = () => currentEnv === 'staging';
