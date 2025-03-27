import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';

// URL base del backend
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://api.ovaonline.tech';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState('');
    const ws = useRef(null);
    const messagesEndRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const connectWebSocket = () => {
        try {
            const wsUrl = BACKEND_URL.replace('https://', 'wss://');
            ws.current = new WebSocket(`${wsUrl}/ws/chat`);

            ws.current.onopen = () => {
                setIsConnected(true);
                setConnectionError('');
                console.log('Conectado al servidor WebSocket');
            };

            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'typing') {
                        setIsTyping(true);
                    } else if (data.type === 'message') {
                        setIsTyping(false);
                        setMessages(prev => [...prev, { text: data.text, isUser: false }]);
                    }
                } catch (error) {
                    console.error('Error al procesar mensaje:', error);
                }
            };

            ws.current.onclose = () => {
                setIsConnected(false);
                setConnectionError('Conexión perdida. Intentando reconectar...');
                // Intentar reconectar después de 5 segundos
                reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
            };

            ws.current.onerror = (error) => {
                console.error('Error en WebSocket:', error);
                setConnectionError('Error de conexión');
            };
        } catch (error) {
            console.error('Error al crear WebSocket:', error);
            setConnectionError('Error al conectar con el servidor');
        }
    };

    const checkConnection = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/status`);
            if (!response.ok) throw new Error('Error en la conexión');
            const data = await response.json();
            return data.status === 'ok';
        } catch (error) {
            console.error('Error al verificar conexión:', error);
            return false;
        }
    };

    useEffect(() => {
        const init = async () => {
            const isServerAvailable = await checkConnection();
            if (isServerAvailable) {
                connectWebSocket();
            } else {
                setConnectionError('No se pudo conectar al servidor');
            }
        };

        init();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !isConnected || isTyping) return;

        const newMessage = { text: inputMessage, isUser: true };
        setMessages(prev => [...prev, newMessage]);
        
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ text: inputMessage }));
        } else {
            setConnectionError('Error: No hay conexión con el servidor');
        }
        
        setInputMessage('');
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h2>Chat con IA</h2>
                <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? 'Conectado' : 'Desconectado'}
                </div>
            </div>
            
            {connectionError && (
                <div className="error-message">
                    {connectionError}
                </div>
            )}
            
            <div className="messages-container">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}
                    >
                        {message.text}
                    </div>
                ))}
                {isTyping && (
                    <div className="bot-message typing">
                        Escribiendo...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

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
                    type="submit"
                    className="send-button"
                    disabled={!isConnected || !inputMessage.trim() || isTyping}
                >
                    <i className="fas fa-paper-plane"></i>
                </button>
            </form>
        </div>
    );
};

export default Chat;
