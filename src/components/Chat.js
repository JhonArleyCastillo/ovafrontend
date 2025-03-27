import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';

// URL base del backend
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://api.ovaonline.tech';

// Componente de icono de enviar
const SendIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
  </svg>
);

// Componente de icono de imagen
const ImageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM12 12L10.2 14.4L7 10L5 13V17H19V13L16 9L12 12Z" fill="currentColor"/>
  </svg>
);

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const ws = useRef(null);
    const messagesEndRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);

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
                    } else if (data.type === 'response' || data.type === 'message') {
                        setIsTyping(false);
                        setMessages(prev => [...prev, { 
                            text: data.message || data.text, 
                            isUser: false 
                        }]);
                    } else if (data.type === 'error') {
                        console.error('Error del servidor:', data.message);
                        setConnectionError(data.message);
                    }
                } catch (error) {
                    console.error('Error al procesar mensaje:', error);
                }
            };

            ws.current.onclose = () => {
                if (isConnected) {
                    setIsConnected(false);
                    setConnectionError('Conexión perdida. Intentando reconectar...');
                    // Intentar reconectar después de 5 segundos
                    reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
                }
            };

            ws.current.onerror = (error) => {
                console.error('Error en WebSocket:', error);
                setConnectionError('Error de conexión');
                setIsConnected(false);
            };
        } catch (error) {
            console.error('Error al crear WebSocket:', error);
            setConnectionError('Error al conectar con el servidor');
            setIsConnected(false);
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
            try {
                const isServerAvailable = await checkConnection();
                if (isServerAvailable) {
                    // Intentar conectar WebSocket
                    connectWebSocket();
                    // Considerar la conexión HTTP exitosa como suficiente para habilitar la carga de imágenes
                    setIsConnected(true); 
                } else {
                    setConnectionError('No se pudo conectar al servidor');
                }
            } catch (error) {
                console.error('Error en la inicialización:', error);
                setConnectionError('Error al inicializar la conexión');
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

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        // Verificar la conexión antes de procesar
        try {
            // Verificar que podamos alcanzar el servidor
            const serverAvailable = await checkConnection();
            if (!serverAvailable) {
                setConnectionError('No se puede conectar al servidor. Por favor, inténtelo de nuevo.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64Image = e.target.result;
                setSelectedImage(base64Image);
                
                // Mostrar imagen en el chat
                const newMessage = { 
                    text: 'Imagen de lenguaje de señas enviada', 
                    isUser: true,
                    image: base64Image 
                };
                setMessages(prev => [...prev, newMessage]);
                
                // Indicar que se está procesando
                setIsTyping(true);
                
                try {
                    // Enviar la imagen al servidor
                    const response = await fetch(`${BACKEND_URL}/analyze-sign-language`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ image: base64Image }),
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.error || 'Error al analizar la imagen');
                    }
                    
                    // Formatear las alternativas si existen
                    let alternativasTexto = '';
                    if (data.alternatives && data.alternatives.length > 0) {
                        alternativasTexto = '\n\nOtras posibilidades:\n' + 
                            data.alternatives.map(alt => 
                                `• ${alt.simbolo}: ${alt.probabilidad}%`
                            ).join('\n');
                    }
                    
                    // Añadir la respuesta al chat
                    setMessages(prev => [...prev, { 
                        text: `Lenguaje de señas detectado: ${data.prediction} (confianza: ${data.confidence}%)${alternativasTexto}`, 
                        isUser: false 
                    }]);
                } catch (error) {
                    console.error('Error:', error);
                    // Añadir mensaje de error
                    setMessages(prev => [...prev, { 
                        text: `No se pudo reconocer el lenguaje de señas: ${error.message}`, 
                        isUser: false 
                    }]);
                    setConnectionError('Error al analizar la imagen');
                } finally {
                    setIsTyping(false);
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error al verificar la conexión:', error);
            setConnectionError('Error al verificar la conexión con el servidor');
        }
    };

    const openImageSelector = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h2>Chat con IA</h2>
                <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
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
                        {message.image && (
                            <div className="message-image">
                                <img src={message.image} alt="Lenguaje de señas" />
                            </div>
                        )}
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
                    type="button"
                    className="upload-button"
                    onClick={openImageSelector}
                    disabled={!isConnected}
                >
                    <ImageIcon />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                />
                <button
                    type="submit"
                    className="send-button"
                    disabled={!isConnected || !inputMessage.trim() || isTyping}
                >
                    <SendIcon />
                </button>
            </form>
        </div>
    );
};

export default Chat;
