import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import ChatMessage from './Chat/ChatMessage';
import TypingIndicator from './Chat/TypingIndicator';

/**
 * Componente para mostrar la lista de mensajes del chat
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.messages - Array de mensajes
 * @param {boolean} props.isTyping - Indica si el bot está escribiendo
 */
const MessageList = ({ messages, isTyping }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="messages-container">
      {messages.map((message, index) => (
        <ChatMessage 
          key={index}
          text={message.text}
          isUser={message.isUser}
          image={message.image}
        />
      ))}
      
      {isTyping && <TypingIndicator />}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

MessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.shape({
    text: PropTypes.string.isRequired,
    isUser: PropTypes.bool.isRequired,
    image: PropTypes.string
  })).isRequired,
  isTyping: PropTypes.bool.isRequired
};

export default MessageList; 