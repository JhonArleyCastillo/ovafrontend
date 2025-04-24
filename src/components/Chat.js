import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import Logger from '../utils/debug-utils';
import ApiService from '../api';
import { API_ROUTES, WS_ROUTES } from '../config/api.routes';
import { formatImageAnalysisResult } from '../services/chatUtils';
import { ErrorMessage } from './common';
import ChatHeader from './Chat/ChatHeader';
import MessageList from './Chat/MessageList';
import ChatInput from './Chat/ChatInput';
import { COMPONENT_NAMES } from '../config/constants';
import { processIncomingMessage, handleMessageActions, createTextMessage, createImageMessage, createAudioMessage, createTypingMessage } from '../utils/message-utils';
import { playAudio, optimizeImage } from '../utils/media-utils';

const COMPONENT_NAME = COMPONENT_NAMES.CHAT;

const Chat = ({ onImageResult }) => {
  // Estado
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);

  // Referencias
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  /**
   * Añade un mensaje al historial de chat
   */
  const addMessage = useCallback((messageData) => {
    setMessages(prevMessages => [...prevMessages, messageData]);
  }, []);

  /**
   * Añade un mensaje de error al historial de chat
   */
  const addErrorMessage = useCallback((error) => {
    const errorText = error?.message || error?.toString() || 'Error desconocido';
    addMessage({
      text: `Error: ${errorText}`,
      isUser: false,
      type: 'error'
    });
  }, [addMessage]);

  /**
   * Reproduce el audio de un mensaje si está habilitado
   */
  const handleAudioPlayback = useCallback((audioData) => {
    if (autoPlayAudio && audioData) {
      try {
        playAudio(audioData);
      } catch (error) {
        Logger.error(COMPONENT_NAME, 'Error al reproducir audio', error);
      }
    }
  }, [autoPlayAudio]);

  /**
   * Manejar mensajes entrantes del WebSocket
   */
  const handleWebSocketMessage = useCallback((event) => {
    try {
      Logger.debug(COMPONENT_NAME, 'Mensaje recibido');
      let data;
      
      try {
        data = JSON.parse(event.data);
      } catch (error) {
        Logger.warn(COMPONENT_NAME, 'No se pudo parsear el mensaje como JSON', event.data);
        data = { text: event.data, type: 'text' };
      }

      // Procesar el mensaje según su formato estandarizado
      const processedMessage = processIncomingMessage(data);
      Logger.debug(COMPONENT_NAME, 'Mensaje procesado', processedMessage);
      
      // Manejar el tipo de mensaje
      switch (processedMessage.type) {
        case 'text':
          addMessage(processedMessage);
          setIsTyping(false);
          break;
          
        case 'audio':
          // Reproducir el audio automáticamente si está habilitado
          handleAudioPlayback(processedMessage.audio);
          
          // Agregar al chat
          addMessage(processedMessage);
          setIsTyping(false);
          break;

        case 'image':
        case 'sign_language':
          // Ejecutar acciones asociadas al mensaje
          handleMessageActions(processedMessage);
          // Agregar al chat
          addMessage(processedMessage);
          setIsTyping(false);
          break;
          
        case 'typing':
          setIsTyping(processedMessage.isTyping);
          break;
          
        case 'error':
          Logger.error(COMPONENT_NAME, 'Error del servidor', processedMessage);
          setConnectionError(processedMessage.text);
          addErrorMessage(processedMessage.text);
          setIsTyping(false);
          break;
          
        case 'connection':
          if (processedMessage.status === 'connected') {
            if (processedMessage.clientId) {
              setClientId(processedMessage.clientId);
            }
            setIsConnected(true);
            setConnectionError(null);
          } else {
            setIsConnected(false);
            setConnectionError('Conexión cerrada por el servidor');
          }
          break;
          
        default:
          Logger.warn(COMPONENT_NAME, 'Tipo de mensaje no manejado', processedMessage);
          break;
      }
    } catch (error) {
      Logger.error(COMPONENT_NAME, 'Error al procesar mensaje WebSocket', error);
    }
  }, [addErrorMessage, addMessage, handleAudioPlayback]);

  /**
   * Manejar apertura de conexión WebSocket
   */
  const handleWebSocketOpen = () => {
    Logger.info(COMPONENT_NAME, 'WebSocket conectado con éxito');
    setIsConnected(true);
    setConnectionError(null);
  };

  /**
   * Manejar cierre de conexión WebSocket
   */
  const handleWebSocketClose = () => {
    Logger.warn(COMPONENT_NAME, 'Conexión WebSocket cerrada');
    setIsConnected(false);
    setConnectionError('Conexión perdida. Intentando reconectar...');

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      initWebSocket();
    }, 5000);
  };

  /**
   * Manejar error de conexión WebSocket
   */
  const handleWebSocketError = (error) => {
    Logger.error(COMPONENT_NAME, 'Error en WebSocket', error);
    setConnectionError('Error de conexión');
    setIsConnected(false);
  };

  /**
   * Inicializar la conexión WebSocket
   */
  const initWebSocket = useCallback(() => {
    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
      ws.current.close();
    }

    ws.current = ApiService.createWebSocketConnection(WS_ROUTES.CHAT, {
      onOpen: handleWebSocketOpen,
      onMessage: handleWebSocketMessage,
      onClose: handleWebSocketClose,
      onError: handleWebSocketError
    });
  }, [handleWebSocketMessage]);

  /**
   * Inicializar componente al montar
   */
  useEffect(() => {
    Logger.info(COMPONENT_NAME, 'Inicializando WebSocket para chat...');
    initWebSocket();

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
  }, [initWebSocket]);

  /**
   * Manejar envío de mensaje de texto
   * @param {string} message El mensaje a enviar
   * @param {boolean} showInChat Si el mensaje debe mostrarse en el chat (verdadero por defecto)
   */
  const handleSendMessage = useCallback((message, showInChat = true) => {
    Logger.debug(COMPONENT_NAME, 'Enviando mensaje', message);
    
    // Agregar mensaje del usuario a la interfaz si es necesario
    if (showInChat) {
      addMessage({
        text: message,
        isUser: true,
        type: 'text',
        timestamp: new Date().toISOString()
      });
    }

    // Verificar si hay conexión activa
    if (!isConnected) {
      // Agregar mensaje de error solo cuando se intenta enviar sin conexión
      addMessage({
        text: 'No se pudo enviar al sistema: error de conexión',
        isUser: false,
        type: 'error',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Crear mensaje en formato estandarizado
    const standardMessage = createTextMessage(message);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(standardMessage));
      
      // Enviar señal de que estamos esperando respuesta
      setIsTyping(true);
    } else {
      Logger.error(COMPONENT_NAME, 'No hay conexión WebSocket abierta');
      setConnectionError('Error: No hay conexión con el servidor');
    }
  }, [addMessage, isConnected, setConnectionError]);

  /**
   * Manejar grabación de audio
   */
  const handleAudioRecord = useCallback(async (audioBlob) => {
    Logger.debug(COMPONENT_NAME, 'Audio grabado recibido', audioBlob.size);

    try {
      // Crear URL para previsualización
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Agregar mensaje del usuario a la interfaz
      addMessage({
        text: 'Mensaje de voz enviado',
        isUser: true,
        type: 'audio',
        audio: audioUrl,
        timestamp: new Date().toISOString()
      });

      // Verificar si hay conexión activa
      if (!isConnected) {
        // Agregar mensaje de error cuando se intenta enviar sin conexión
        addMessage({
          text: 'No se pudo enviar el audio al sistema: error de conexión',
          isUser: false,
          type: 'error',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Convertir el blob a base64 para enviarlo por WebSocket
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result.split(',')[1];
        
        // Crear mensaje en formato estandarizado para audio
        const standardMessage = createAudioMessage(base64Audio);
        
        // Enviar por WebSocket
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify(standardMessage));
          setIsTyping(true);
        } else {
          Logger.error(COMPONENT_NAME, 'No hay conexión WebSocket abierta para audio');
          setConnectionError('Error: No hay conexión con el servidor');
          addErrorMessage('No se pudo procesar el audio');
        }
      };
    } catch (error) {
      Logger.error(COMPONENT_NAME, 'Error al procesar audio grabado', error);
      addErrorMessage(error);
    }
  }, [addMessage, addErrorMessage, isConnected, setConnectionError]);

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
      const reader = new FileReader();
      const base64ImagePromise = new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Error al leer la imagen'));
        reader.readAsDataURL(file);
      });
      
      const base64Image = await base64ImagePromise;

      // Mostrar imagen en el chat como mensaje del usuario
      addMessage({
        text: 'Imagen enviada',
        isUser: true,
        image: base64Image,
        type: 'image',
        timestamp: new Date().toISOString()
      });
      
      // Verificar si hay conexión activa
      if (!isConnected) {
        // Agregar mensaje de error cuando se intenta enviar sin conexión
        addMessage({
          text: 'No se pudo procesar la imagen: error de conexión',
          isUser: false,
          type: 'error',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // Indicar que estamos procesando
      setIsTyping(true);

      // Crear mensaje en formato estandarizado
      const standardMessage = createImageMessage(base64Image.split(',')[1], 'Análisis de imagen');
      
      // Para imágenes, usamos el endpoint REST en lugar de WebSocket
      const { success, data, error } = await ApiService.processImage(file);

      if (success && data) {
        // Formatear y mostrar resultado
        const resultText = formatImageAnalysisResult(data);
        addMessage({
          text: resultText,
          isUser: false,
          type: 'text',
          timestamp: new Date().toISOString()
        });

        // Pasar el resultado al componente padre si existe
        if (onImageResult) {
          onImageResult(data);
        }
      } else {
        throw new Error(error?.message || 'Error al analizar la imagen');
      }
    } catch (error) {
      Logger.error(COMPONENT_NAME, 'Error al procesar la imagen', error);
      addErrorMessage(error);
    } finally {
      setIsTyping(false);
    }
  }, [addErrorMessage, addMessage, onImageResult, isConnected]);

  /**
   * Manejar carga de imagen de lenguaje de señas
   */
  const handleSignLanguageUpload = useCallback(async (file) => {
    Logger.debug(COMPONENT_NAME, 'Evento de carga de imagen de lenguaje de señas activado');

    if (!file) {
      Logger.debug(COMPONENT_NAME, 'No se seleccionó ningún archivo');
      return;
    }

    try {
      // Validación y optimización de la imagen en un solo paso
      const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en bytes
      
      // Intentar optimizar la imagen y validar formato al mismo tiempo
      const { blob: optimizedImage, tooBig, invalidFormat, formatError } = await optimizeImage(file, {
        maxWidth: 1200,
        maxHeight: 900,
        quality: 0.8,
        maxSizeBytes: MAX_FILE_SIZE,
        allowedFormats: ALLOWED_FORMATS
      });
      
      // Si el formato no está permitido, mostrar mensaje de error específico
      if (invalidFormat) {
        Logger.debug(COMPONENT_NAME, `Formato no válido: ${file.type}`);
        addErrorMessage(new Error('La extensión de la imagen no es permitida'));
        return;
      }
      
      // Si la imagen sigue siendo demasiado grande después de optimizar
      if (tooBig) {
        Logger.debug(COMPONENT_NAME, 'La imagen sigue siendo demasiado grande después de optimizar');
        addErrorMessage(new Error('La imagen es demasiado grande y no se pudo reducir por debajo de 5MB'));
        return;
      }
      
      // Reemplazar el archivo original con la versión optimizada
      file = optimizedImage;
      Logger.debug(COMPONENT_NAME, 'Archivo de lenguaje de señas procesado', file.size);

      // Leer la imagen como base64
      const reader = new FileReader();
      const base64ImagePromise = new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Error al leer la imagen'));
        reader.readAsDataURL(file);
      });
      
      const base64Image = await base64ImagePromise;

      // Mostrar imagen en el chat como mensaje del usuario
      addMessage({
        text: 'Imagen de lenguaje de señas enviada',
        isUser: true,
        image: base64Image,
        type: 'sign_language',
        timestamp: new Date().toISOString()
      });
      
      // Verificar si hay conexión activa
      if (!isConnected) {
        // Agregar mensaje de error cuando se intenta enviar sin conexión
        addMessage({
          text: 'No se pudo procesar el lenguaje de señas: error de conexión',
          isUser: false,
          type: 'error',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // Indicar que estamos procesando
      setIsTyping(true);

      // Para imágenes, usamos el endpoint REST
      try {
        const { success, data, error } = await ApiService.analyzeSignLanguageImage(file);
        
        if (success && data) {
          // Mostrar resultado en el chat
          addMessage({
            text: `Interpretación: ${data.prediction || 'No se pudo interpretar el gesto'}`,
            isUser: false,
            type: 'text',
            timestamp: new Date().toISOString()
          });

          Logger.info(COMPONENT_NAME, 'Lenguaje de señas procesado exitosamente', data);
          
          // Si el gesto se interpretó correctamente, enviar como mensaje al chat
          if (data.prediction) {
            handleSendMessage(data.prediction, false);
          }
        } else {
          throw new Error(error?.message || 'Error al procesar el lenguaje de señas');
        }
      } catch (error) {
        Logger.error(COMPONENT_NAME, 'Error al procesar la imagen de lenguaje de señas', error);
        addErrorMessage(error);
      } finally {
        setIsTyping(false);
      }
    } catch (error) {
      Logger.error(COMPONENT_NAME, 'Error al procesar la imagen', error);
      addErrorMessage(error);
      setIsTyping(false);
    }
  }, [addErrorMessage, addMessage, handleSendMessage, isConnected]);

  /**
   * Alternar reproducción automática de audio
   */
  const toggleAutoPlayAudio = () => {
    setAutoPlayAudio(prev => !prev);
  };

  /**
   * Limpiar mensaje de error
   */
  const clearError = () => setConnectionError(null);

  return (
    <div className="d-flex flex-column h-100">
      <div className="p-3 bg-light border-bottom">
        <ChatHeader 
          isConnected={isConnected} 
          autoPlayAudio={autoPlayAudio}
          onToggleAutoPlayAudio={toggleAutoPlayAudio}
        />
      </div>
      
      {connectionError && (
        <div className="px-3 pt-3">
          <ErrorMessage message={connectionError} onDismiss={clearError} />
        </div>
      )}
      
      <div className="flex-grow-1 overflow-auto p-3">
        <MessageList 
          messages={messages}
          isTyping={isTyping}
          autoPlayAudio={autoPlayAudio}
        />
      </div>
      
      <ChatInput 
        onSendMessage={handleSendMessage}
        onImageUpload={handleImageUpload}
        onSignLanguageUpload={handleSignLanguageUpload}
        onAudioRecord={handleAudioRecord}
        isConnected={isConnected}
        isTyping={isTyping}
      />
    </div>
  );
};

Chat.propTypes = {
  onImageResult: PropTypes.func
};

export default Chat;
