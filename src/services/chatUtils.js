import Logger from '../utils/debug-utils';
import { COMPONENT_NAMES } from '../config/constants';

const COMPONENT_NAME = COMPONENT_NAMES.CHAT_UTILS;

/**
 * Formatea los resultados del análisis de imagen para mostrar en el chat
 * @param {Object} data - Datos del análisis de la imagen
 * @returns {string} - Texto formateado para mostrar en el chat
 */
export const formatImageAnalysisResult = (data) => {
  try {
    // Asegurarse de que los datos tengan el formato correcto
    const prediction = data.prediction || 'No se pudo determinar';
    const confidence = data.confidence || 0;
    const alternatives = Array.isArray(data.alternatives) ? data.alternatives : [];
              
    // Formatear las alternativas
    let alternativasTexto = '';
    if (alternatives.length > 0) {
      alternativasTexto = '\n\nOtras posibilidades:\n' + 
        alternatives.map(alt => 
          `• ${alt.simbolo || alt.prediction}: ${alt.probabilidad || alt.confidence}%`
        ).join('\n');
    }
              
  return `Resultado: ${prediction} (confianza: ${confidence}%)${alternativasTexto}`;
  } catch (error) {
    Logger.error(COMPONENT_NAME, 'Error al formatear resultado de análisis', error);
    return 'Error al procesar el resultado del análisis';
  }
};

/**
 * Agrega un mensaje al historial de mensajes
 * @param {function} setMessages - Función setState para actualizar los mensajes
 * @param {string} text - Texto del mensaje
 * @param {boolean} isUser - Indica si el mensaje es del usuario
 * @param {string} [image] - Imagen opcional del mensaje
 */
export const addMessage = (setMessages, text, isUser, image = null) => {
  const newMessage = { text, isUser };
  if (image) newMessage.image = image;
  
  setMessages(prev => [...prev, newMessage]);
};

/**
 * Agrega un mensaje de error al historial de mensajes
 * @param {function} setMessages - Función setState para actualizar los mensajes
 * @param {Error} error - Error ocurrido
 */
export const addErrorMessage = (setMessages, error) => {
  const errorMessage = error?.message || 'Error desconocido';
  addMessage(setMessages, `Error: ${errorMessage}`, false);
};

/**
 * Lee una imagen como Base64
 * @param {File} file - Archivo de imagen
 * @returns {Promise<string>} - Imagen en formato Base64
 */
export const readImageAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    
    reader.onerror = (error) => {
      Logger.error(COMPONENT_NAME, 'Error al leer el archivo', error);
      reject(new Error('No se pudo leer la imagen'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Analiza texto para identificar comandos especiales
 * @param {string} text - Texto a analizar
 * @returns {Object} - Resultado del análisis { isCommand, command, args }
 */
export const parseTextCommand = (text) => {
  // Identificar comandos que comienzan con /
  if (text.startsWith('/')) {
    const parts = text.substring(1).split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    return {
      isCommand: true,
      command,
      args
    };
  }
  
  return { isCommand: false };
};

/**
 * Formatea mensajes para mostrar en el chat según el tipo
 * @param {Object} data - Datos del mensaje
 * @returns {string} - Texto formateado para mostrar
 */
export const formatMessage = (data) => {
  if (data.type === 'image_analysis') {
    return formatImageAnalysisResult(data);
  }
  
  if (data.type === 'voice_recognition') {
    return `Transcripción: ${data.text || 'No se pudo transcribir el audio'}`;
  }
  
  return data.text || data.message || 'Mensaje sin contenido';
};

const ChatUtils = {
  formatImageAnalysisResult,
  addMessage,
  addErrorMessage,
  readImageAsBase64,
  parseTextCommand,
  formatMessage
};

export default ChatUtils; 