import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { SendIcon, ImageIcon } from '../UIComponents';

/**
 * Componente para la entrada de texto del chat
 * @param {Object} props - Propiedades del componente
 * @param {function} props.onSendMessage - Función para enviar mensaje
 * @param {function} props.onImageUpload - Función para subir imagen
 * @param {boolean} props.isConnected - Estado de la conexión
 * @param {boolean} props.isTyping - Indica si el bot está escribiendo
 */
const ChatInput = ({ onSendMessage, onImageUpload, isConnected, isTyping }) => {
  const [inputMessage, setInputMessage] = useState('');
  const fileInputRef = useRef(null);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isConnected || isTyping) return;
    
    onSendMessage(inputMessage);
    setInputMessage('');
  };
  
  const openImageSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      onImageUpload(event.target.files[0]);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="chat-input-container">
      <input
        type="text"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        placeholder="Escribe un mensaje..."
        className="chat-input"
        disabled={!isConnected || isTyping}
      />
      <button
        type="button"
        className="upload-button"
        onClick={openImageSelector}
        title="Subir imagen de lenguaje de señas"
        disabled={!isConnected}
      >
        <ImageIcon />
      </button>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageChange} 
        accept="image/*" 
        style={{ display: 'none' }} 
        id="upload-image-input"
      />
      <button
        type="submit"
        className="send-button"
        disabled={!isConnected || !inputMessage.trim() || isTyping}
      >
        <SendIcon />
      </button>
    </form>
  );
};

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  onImageUpload: PropTypes.func.isRequired,
  isConnected: PropTypes.bool.isRequired,
  isTyping: PropTypes.bool.isRequired
};

export default ChatInput; 