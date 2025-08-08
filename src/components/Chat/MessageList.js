import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { playAudio } from '../../utils/media-utils';

/**
 * Componente para mostrar la lista de mensajes del chat
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.messages - Array de mensajes
 * @param {boolean} props.isTyping - Indica si el bot está escribiendo
 * @param {boolean} props.autoPlayAudio - Indica si se reproduce el audio automáticamente
 */
const MessageList = ({ messages, isTyping, autoPlayAudio }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handlePlayAudio = (audioUrl) => {
    playAudio(audioUrl);
  };

  const renderMessageContent = (message) => {
    // Contenido según el tipo de mensaje
    switch (message.type) {
      case 'text':
        return <div>{message.text}</div>;

      case 'image':
        return (
          <>
            <img 
              src={message.image} 
              alt="Imagen adjunta" 
              className="img-fluid rounded mb-2"
              style={{ maxHeight: '200px' }}
            />
            {message.text && <div>{message.text}</div>}
          </>
        );

      case 'audio':
        return (
          <div>
            {message.text && <div className="mb-2">{message.text}</div>}
            {message.audio && (
              <div className="d-flex align-items-center">
                <button
                  className="btn btn-sm btn-outline-secondary me-2"
                  onClick={() => handlePlayAudio(message.audio)}
                >
                  <i className="bi bi-play-fill"></i>
                </button>
                <audio controls className="w-100" preload="metadata">
                  <source src={message.audio} type="audio/webm" />
                  <track kind="captions" srcLang="es" label="Español" />
                  Tu navegador no soporta la reproducción de audio.
                </audio>
              </div>
            )}
          </div>
        );

      case 'error':
        return (
          <div className="alert alert-danger d-flex align-items-center mb-0" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <div>{message.text}</div>
          </div>
        );

      default:
        return <div>{message.text}</div>;
    }
  };

  return (
    <div className="d-flex flex-column gap-3">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`d-flex ${message.isUser ? 'justify-content-end' : 'justify-content-start'}`}
        >
          <div
            className={`message ${message.isUser ? 'user-message' : message.type === 'error' ? 'bot-message text-danger' : 'bot-message'}`}
            style={{ maxWidth: '75%' }}
          >
            {renderMessageContent(message)}
          </div>
        </div>
      ))}
      
      {isTyping && (
        <div className="d-flex justify-content-start">
          <div className="message bot-message d-flex align-items-center" style={{ maxWidth: '75%' }}>
            <span className="me-2">Escribiendo</span>
            <div className="spinner-grow spinner-grow-sm text-secondary" role="status">
              <span className="visually-hidden">Escribiendo...</span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

MessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.shape({
    text: PropTypes.string.isRequired,
    isUser: PropTypes.bool.isRequired,
    type: PropTypes.string,
    image: PropTypes.string,
    audio: PropTypes.string
  })).isRequired,
  isTyping: PropTypes.bool.isRequired,
  autoPlayAudio: PropTypes.bool
};

MessageList.defaultProps = {
  autoPlayAudio: true
};

export default MessageList;