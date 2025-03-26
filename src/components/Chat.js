import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import API_ROUTES from '../config/api';
import './Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const websocketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Inicializar WebSocket
    websocketRef.current = new WebSocket(API_ROUTES.WEBSOCKET_URL);

    websocketRef.current.onopen = () => {
      console.log('WebSocket conectado');
      setIsConnected(true);
    };

    websocketRef.current.onmessage = (event) => {
      const response = JSON.parse(event.data);
      if (response.texto) {
        setMessages(prev => [...prev, { text: response.texto, isUser: false }]);
      }
    };

    websocketRef.current.onerror = (error) => {
      console.error('Error en WebSocket:', error);
      setIsConnected(false);
    };

    websocketRef.current.onclose = () => {
      console.log('WebSocket desconectado');
      setIsConnected(false);
    };

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isConnected) return;

    const message = inputMessage.trim();
    setMessages(prev => [...prev, { text: message, isUser: true }]);
    setInputMessage('');

    // Enviar mensaje al backend
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(message);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.isUser ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-content">
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="chat-input"
          disabled={!isConnected}
        />
        <button
          type="submit"
          className="send-button"
          disabled={!isConnected || !inputMessage.trim()}
        >
          Enviar
        </button>
      </form>
      {!isConnected && (
        <div className="connection-status">
          Desconectado. Intentando reconectar...
        </div>
      )}
    </div>
  );
};

export default Chat;
