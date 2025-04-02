import React from 'react';

/**
 * Icono de enviar mensaje
 */
export const SendIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
  </svg>
);

/**
 * Icono de subir imagen
 */
export const ImageIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '24px', height: '24px' }}
  >
    <path 
      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM14.14 11.86L11.14 15.73L9 13.14L6 17H18L14.14 11.86Z" 
      fill="white"
    />
  </svg>
);

/**
 * Indicador de conexión
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isConnected - Indica si está conectado
 */
export const ConnectionStatus = ({ isConnected }) => (
  <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
    {isConnected ? 'Conectado' : 'Desconectado'}
  </span>
);

/**
 * Mensaje de error
 * @param {Object} props - Propiedades del componente
 * @param {string} props.message - Mensaje de error
 */
export const ErrorMessage = ({ message }) => (
  message ? (
    <div className="error-message">
      {message}
    </div>
  ) : null
);

/**
 * Mensaje de chat
 * @param {Object} props - Propiedades del componente
 * @param {string} props.text - Texto del mensaje
 * @param {boolean} props.isUser - Indica si el mensaje es del usuario
 * @param {string} [props.image] - URL de la imagen (opcional)
 */
export const ChatMessage = ({ text, isUser, image }) => (
  <div className={`message ${isUser ? 'user-message' : 'bot-message'}`}>
    {image && (
      <div className="message-image">
        <img src={image} alt="Lenguaje de señas" />
      </div>
    )}
    {text}
  </div>
);

/**
 * Indicador de escritura
 */
export const TypingIndicator = () => (
  <div className="bot-message typing">
    Escribiendo...
  </div>
);

export default {
  SendIcon,
  ImageIcon,
  ConnectionStatus,
  ErrorMessage,
  ChatMessage,
  TypingIndicator
}; 