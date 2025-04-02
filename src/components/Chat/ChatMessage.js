import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente para mostrar un mensaje de chat
 * @param {Object} props - Propiedades del componente 
 * @param {string} props.text - Texto del mensaje
 * @param {boolean} props.isUser - Si el mensaje es del usuario
 * @param {string} [props.image] - URL de la imagen (opcional)
 * @param {string} [props.className] - Clase CSS adicional
 */
const ChatMessage = ({ text, isUser, image, className = '' }) => {
  return (
    <div className={`message ${isUser ? 'user-message' : 'bot-message'} ${className}`}>
      {image && (
        <div className="message-image">
          <img src={image} alt="Contenido del mensaje" />
        </div>
      )}
      <div className="message-text">{text}</div>
    </div>
  );
};

ChatMessage.propTypes = {
  text: PropTypes.string.isRequired,
  isUser: PropTypes.bool.isRequired,
  image: PropTypes.string,
  className: PropTypes.string
};

export default ChatMessage; 