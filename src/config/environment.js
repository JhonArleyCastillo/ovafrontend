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
    API_BASE_URL: 'https://www.api.ovaonline.tech',
    WS_BASE_URL: 'wss://www.api.ovaonline.tech',
    WS_FALLBACK_URL: 'wss://www.api.ovaonline.tech',
    DEBUG_ENABLED: false,
    RETRY_ATTEMPTS: 5,
    HEARTBEAT_INTERVAL: 60000,
    CONNECTION_TIMEOUT: 20000,
    // Seguridad: Solo HTTPS en producción
    ENFORCE_HTTPS: true,
    ALLOWED_PROTOCOLS: ['https:', 'wss:']
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
    // eslint-disable-next-line no-console
    console.error(`✖ Configuración incompleta. Faltan: ${missing.join(', ')}`);
    throw new Error(`Configuración incompleta: ${missing.join(', ')}`);
  }

  // Seguridad: Validar HTTPS en producción
  if (config.ENFORCE_HTTPS && currentEnv === 'production') {
    const urls = [config.API_BASE_URL, config.WS_BASE_URL, config.WS_FALLBACK_URL];
    const insecureUrls = urls.filter(url => {
      const protocol = new URL(url).protocol;
      return !config.ALLOWED_PROTOCOLS.includes(protocol);
    });
    
    if (insecureUrls.length > 0) {
      // eslint-disable-next-line no-console
      console.error(`🚨 SEGURIDAD: URLs inseguras detectadas en producción: ${insecureUrls.join(', ')}`);
      throw new Error(`URLs inseguras no permitidas en producción: ${insecureUrls.join(', ')}`);
    }
    
    // eslint-disable-next-line no-console
    console.info('🔒 Validación de seguridad HTTPS: PASSED');
  }
  
  // eslint-disable-next-line no-console
  console.info(`✅ Configuración cargada para entorno: ${currentEnv}`);
  // eslint-disable-next-line no-console
  console.info(`📡 API Base URL: ${config.API_BASE_URL}`);
  // eslint-disable-next-line no-console
  console.info(`🔌 WebSocket URL: ${config.WS_BASE_URL}`);
  
  if (config.DEBUG_ENABLED) {
  // eslint-disable-next-line no-console
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

// Función para forzar HTTPS en producción
export const enforceHTTPS = () => {
  if (isProduction() && typeof window !== 'undefined') {
    if (window.location.protocol !== 'https:') {
      // eslint-disable-next-line no-console
      console.warn('🔒 Redirigiendo a HTTPS por seguridad...');
      window.location.href = window.location.href.replace('http:', 'https:');
      return false; // Indica que se está redirigiendo
    }
  }
  return true; // OK para continuar
};

// Función para validar URL antes de hacer requests
export const validateSecureUrl = (url) => {
  if (isProduction()) {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'wss:') {
      throw new Error(`🚨 URL insegura rechazada en producción: ${url}`);
    }
  }
  return true;
};

// Función para obtener URL de API validada
export const getSecureApiUrl = (endpoint = '') => {
  const baseUrl = config.API_BASE_URL;
  validateSecureUrl(baseUrl);
  return `${baseUrl}${endpoint}`;
};

// Función para obtener URL de WebSocket validada
export const getSecureWebSocketUrl = (path = '/api/chat') => {
  const wsUrl = `${config.WS_BASE_URL}${path}`;
  validateSecureUrl(wsUrl);
  return wsUrl;
};
