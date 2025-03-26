import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { enviarAudio, escucharRespuestas } from '../api';
import './Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    // Configurar el listener de respuestas
    cleanupRef.current = escucharRespuestas(({ texto, audioBase64 }) => {
      setMessages(prev => [...prev, { 
        text: texto, 
        isUser: false,
        audio: audioBase64 
      }]);
    });

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    setMessages(prev => [...prev, { text: message, isUser: true }]);
    setInputMessage('');

    // Enviar mensaje al backend
    enviarAudio(message);
  };

  return (
    <div className="chat-container">
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? 'Conectado' : 'Desconectado'}
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.isUser ? 'user' : 'assistant'}`}
          >
            <div className="message-content">
              {message.text}
            </div>
            {message.audio && (
              <audio 
                controls 
                className="audio-player"
                src={`data:audio/wav;base64,${message.audio}`}
              >
                <track kind="captions" src="" label="Subtítulos" />
                Tu navegador no soporta el elemento de audio.
              </audio>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="chat-input-container">
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
    </div>
  );
};

Chat.propTypes = {
  // No props required
};

export default Chat;
