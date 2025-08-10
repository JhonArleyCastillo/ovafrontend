/**
 * Utilidades para manejar mensajes estandarizados entre cliente y servidor
 */

import Logger from './debug-utils';

const COMPONENT_NAME = 'MessageUtils';

/**
 * Tipos de mensajes soportados
 */
export const MESSAGE_TYPES = {
  TEXT: 'text',
  AUDIO: 'audio',
  IMAGE: 'image',
  SIGN_LANGUAGE: 'sign_language',
  TYPING: 'typing',
  ERROR: 'error',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected'
};

/**
 * Crea un mensaje de texto para enviar al servidor
 * @param {string} text - Texto del mensaje
 * @param {boolean} isUser - Si el mensaje es del usuario
 * @returns {Object} - Mensaje en formato estandarizado
 */
export const createTextMessage = (text, isUser = true) => {
  return {
    type: MESSAGE_TYPES.TEXT,
    text: text,
  // eslint-disable-next-line camelcase
  is_user: isUser,
    timestamp: new Date().toISOString()
  };
};

/**
 * Crea un mensaje de tipeo (escribiendo...)
 * @param {boolean} isTyping - Estado del tipeo
 * @returns {Object} - Mensaje en formato estandarizado
 */
export const createTypingMessage = (isTyping = true) => {
  return {
    type: MESSAGE_TYPES.TYPING,
  // eslint-disable-next-line camelcase
  is_typing: isTyping,
    timestamp: new Date().toISOString()
  };
};

/**
 * Crea un mensaje de imagen para enviar al servidor
 * @param {string} imageBase64 - Imagen en formato base64
 * @param {string} [text] - Texto opcional
 * @returns {Object} - Mensaje en formato estandarizado
 */
export const createImageMessage = (imageBase64, text = '') => {
  return {
    type: MESSAGE_TYPES.IMAGE,
    image: imageBase64,
    text: text,
  // eslint-disable-next-line camelcase
  is_user: true,
    timestamp: new Date().toISOString()
  };
};

/**
 * Crea un mensaje de audio para enviar al servidor
 * @param {string} audioBase64 - Audio en formato base64
 * @param {string} [text] - Transcripción opcional
 * @returns {Object} - Mensaje en formato estandarizado
 */
export const createAudioMessage = (audioBase64, text = '') => {
  return {
    type: MESSAGE_TYPES.AUDIO,
    audio: audioBase64,
    text: text,
  // eslint-disable-next-line camelcase
  is_user: true,
    timestamp: new Date().toISOString()
  };
};

/**
 * Procesa un mensaje recibido del servidor y lo convierte a formato de UI
 * @param {Object} message - Mensaje recibido del servidor
 * @returns {Object} - Mensaje procesado para mostrar en UI
 */
export const processIncomingMessage = (message) => {
  try {
    // Si es un objeto JSON como string, parsearlo
    if (typeof message === 'string') {
      try {
        message = JSON.parse(message);
      } catch (e) {
        // Si no es un JSON válido, tratarlo como un mensaje de texto simple
        return { text: message, isUser: false, type: 'text' };
      }
    }

    // Determinar el tipo de mensaje
    const type = message.type || 'text';

    switch (type) {
      case MESSAGE_TYPES.TEXT:
        return {
          id: message.id,
          text: message.text,
          // eslint-disable-next-line camelcase
          isUser: message.is_user || false,
          timestamp: message.timestamp,
          type: 'text'
        };
      
      case MESSAGE_TYPES.AUDIO:
        return {
          id: message.id,
          text: message.text || 'Mensaje de audio recibido',
          // eslint-disable-next-line camelcase
          isUser: message.is_user || false,
          audio: message.audio,
          timestamp: message.timestamp,
          type: 'audio'
        };
        
      case MESSAGE_TYPES.IMAGE:
        return {
          id: message.id,
          text: message.text || 'Imagen recibida',
          // eslint-disable-next-line camelcase
          isUser: message.is_user || false,
          image: message.image,
          objects: message.objects,
          timestamp: message.timestamp,
          type: 'image'
        };
        
      case MESSAGE_TYPES.SIGN_LANGUAGE:
        return {
          id: message.id,
          text: message.text || 'Análisis de lenguaje de señas',
          // eslint-disable-next-line camelcase
          isUser: message.is_user || false,
          image: message.image,
          confidence: message.confidence,
          alternatives: message.alternatives,
          timestamp: message.timestamp,
          type: 'sign_language'
        };
      
      case MESSAGE_TYPES.TYPING:
        return {
          isTyping: message.is_typing !== false,
          type: 'typing'
        };
      
      case MESSAGE_TYPES.ERROR:
        return {
          text: message.error || 'Error desconocido',
          isUser: false,
          code: message.code,
          details: message.details,
          type: 'error'
        };
      
      case MESSAGE_TYPES.CONNECTED:
      case MESSAGE_TYPES.DISCONNECTED:
        return {
          type: 'connection',
          status: message.type,
          // eslint-disable-next-line camelcase
          clientId: message.client_id,
          text: `Conexión ${message.type === 'connected' ? 'establecida' : 'cerrada'}`
        };
      
      default:
        Logger.warn(COMPONENT_NAME, `Tipo de mensaje no reconocido: ${type}`, message);
        return {
          text: message.text || message.message || 'Mensaje no reconocido',
          isUser: message.is_user || false,
          type: 'unknown'
        };
    }
  } catch (error) {
    Logger.error(COMPONENT_NAME, 'Error al procesar mensaje', error);
    return {
      text: 'Error al procesar el mensaje',
      isUser: false,
      type: 'error'
    };
  }
};

/**
 * Procesa un mensaje después de ser recibido del servidor
 * @param {Object} message - Mensaje procesado
 */
export const handleMessageActions = (message) => {
  try {
    switch (message.type) {
      case 'audio':
        // Reproducir audio si está disponible
        if (message.audio) {
          import('./media-utils').then(({ playAudio }) => {
            playAudio(message.audio).catch(error => {
              Logger.error(COMPONENT_NAME, 'Error al reproducir audio', error);
            });
          });
        }
        break;
        
      // Agregar más acciones según sea necesario
      
      default:
        // No hay acciones especiales para otros tipos de mensajes
        break;
    }
    
    return message;
  } catch (error) {
    Logger.error(COMPONENT_NAME, 'Error al manejar acciones de mensaje', error);
    return message;
  }
};

const MessageUtils = {
  MESSAGE_TYPES,
  createTextMessage,
  createTypingMessage,
  createImageMessage,
  createAudioMessage,
  processIncomingMessage,
  handleMessageActions
};

export default MessageUtils;