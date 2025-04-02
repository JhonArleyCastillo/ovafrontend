import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Chat.css';
import { Logger, useStateMonitor } from '../utils/debug-utils';
import ApiService from '../services/api';
import { formatImageAnalysisResult, addMessage, addErrorMessage, readImageAsBase64 } from '../services/chatUtils';
import { ErrorMessage } from '../components/common';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { COMPONENT_NAMES, WEBSOCKET_CONFIG, API_ROUTES } from '../config/constants';

const COMPONENT_NAME = COMPONENT_NAMES.CHAT;

const Chat = () => {
  // Estado
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  
  // Referencias
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Monitorear estados
  const stateMonitor = {
    isConnected,
    isTyping,
    messagesCount: messages.length,
    connectionError: connectionError || 'ninguno'
  };
  
  useStateMonitor(COMPONENT_NAME, stateMonitor);

  /**
   * Manejar mensajes entrantes del WebSocket
   */
  const handleWebSocketMessage = useCallback((event) => {
    try {
      Logger.debug(COMPONENT_NAME, 'Mensaje recibido');
      const data = JSON.parse(event.data);
      
      if (data.type === 'typing') {
        setIsTyping(true);
      } else if (data.type === 'response' || data.type === 'message') {
        setIsTyping(false);
        addMessage(setMessages, data.message || data.text, false);
      } else if (data.type === 'error') {
        Logger.error(COMPONENT_NAME, 'Error del servidor', data.message);
        setConnectionError(data.message);
      }
    } catch (error) {
      Logger.error(COMPONENT_NAME, 'Error al procesar mensaje WebSocket', error);
    }
  }, []);

  /**
   * Conectar al WebSocket del chat
   */
  const connectWebSocket = useCallback(() => {
    try {
      // Si ya existe una conexión abierta, no hacemos nada
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        Logger.debug(COMPONENT_NAME, 'WebSocket ya está conectado');
        return;
      }

      // Configurar los manejadores de eventos
      const handlers = {
        onOpen: () => {
          Logger.info(COMPONENT_NAME, 'WebSocket conectado con éxito');
          setIsConnected(true);
          setConnectionError('');
        },
        onMessage: handleWebSocketMessage,
        onClose: () => {
          Logger.warn(COMPONENT_NAME, 'Conexión WebSocket cerrada');
          setIsConnected(false);
          setConnectionError('Conexión perdida. Intentando reconectar...');
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, WEBSOCKET_CONFIG.RECONNECT_INTERVAL);
        },
        onError: (error) => {
          Logger.error(COMPONENT_NAME, 'Error en WebSocket', error);
          setConnectionError('Error de conexión');
          setIsConnected(false);
        }
      };

      // Crear la conexión
      ws.current = ApiService.createWebSocketConnection(API_ROUTES.CHAT_WS, handlers);
    } catch (error) {
      Logger.error(COMPONENT_NAME, 'Error al crear WebSocket', error);
      setConnectionError('Error al conectar con el servidor');
      setIsConnected(false);
    }
  }, [handleWebSocketMessage]);

  /**
   * Inicializar componente al montar
   */
  useEffect(() => {
    const init = async () => {
      Logger.info(COMPONENT_NAME, 'Inicializando componente Chat');
      try {
        // Verificar estado del servidor antes de intentar conectar
        Logger.debug(COMPONENT_NAME, 'Verificando estado del servidor...');
        const isServerAvailable = await ApiService.checkServerStatus();
        
        if (isServerAvailable) {
          Logger.info(COMPONENT_NAME, 'Servidor disponible, conectando WebSocket...');
          connectWebSocket();
        } else {
          Logger.error(COMPONENT_NAME, 'No se pudo conectar al servidor. Verifique la URL del backend.');
          setConnectionError('No se pudo conectar al servidor. Verifique si el backend está activo y accesible desde esta ubicación.');
          setIsConnected(false);
          
          // Intentar reconectar después de un tiempo
          Logger.info(COMPONENT_NAME, 'Programando intento de reconexión...');
          reconnectTimeoutRef.current = setTimeout(init, WEBSOCKET_CONFIG.RECONNECT_INTERVAL * 2);
        }
      } catch (error) {
        Logger.error(COMPONENT_NAME, 'Error en la inicialización', error);
        setConnectionError(`Error al inicializar la conexión: ${error.message}`);
        setIsConnected(false);
        
        // Intentar reconectar después de un tiempo
        reconnectTimeoutRef.current = setTimeout(init, WEBSOCKET_CONFIG.RECONNECT_INTERVAL * 2);
      }
    };

    init();

    // Limpiar recursos al desmontar
    return () => {
      Logger.info(COMPONENT_NAME, 'Limpiando recursos');
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connectWebSocket]);

  /**
   * Manejar envío de mensaje de texto
   */
  const handleSendMessage = useCallback((message) => {
    Logger.debug(COMPONENT_NAME, 'Enviando mensaje', message);
    addMessage(setMessages, message, true);
        
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ text: message }));
    } else {
      Logger.error(COMPONENT_NAME, 'No hay conexión WebSocket abierta');
      setConnectionError('Error: No hay conexión con el servidor');
    }
  }, []);

  /**
   * Manejar carga de imagen
   */
  const handleImageUpload = useCallback(async (file) => {
    Logger.debug(COMPONENT_NAME, 'Evento de carga de imagen activado');
    
    if (!file) {
      Logger.debug(COMPONENT_NAME, 'No se seleccionó ningún archivo');
      return;
    }
        
    Logger.debug(COMPONENT_NAME, 'Archivo seleccionado', file.name);
    
    try {
      // Leer la imagen como base64
      const base64Image = await readImageAsBase64(file);
      
      // Mostrar imagen en el chat
      addMessage(setMessages, 'Imagen de lenguaje de señas enviada', true, base64Image);
      setIsTyping(true);
      
      // Analizar la imagen
      const { success, data, error } = await ApiService.analyzeSignLanguageImage(base64Image);
      
      if (success && data) {
        // Formatear y mostrar resultado
        const resultText = formatImageAnalysisResult(data);
        addMessage(setMessages, resultText, false);
      } else {
        throw new Error(error?.message || 'Error al analizar la imagen');
      }
    } catch (error) {
      Logger.error(COMPONENT_NAME, 'Error al procesar la imagen', error);
      addErrorMessage(setMessages, error);
    } finally {
      setIsTyping(false);
    }
  }, []);
  
  const clearError = () => setConnectionError('');

  return (
    <div className="chat-container">
      <ChatHeader isConnected={isConnected} />
            
      <ErrorMessage 
        message={connectionError} 
        onDismiss={clearError} 
      />
            
      <MessageList 
        messages={messages}
        isTyping={isTyping}
      />

      <ChatInput 
        onSendMessage={handleSendMessage}
        onImageUpload={handleImageUpload}
        isConnected={isConnected}
        isTyping={isTyping}
      />
    </div>
  );
};

export default Chat;
