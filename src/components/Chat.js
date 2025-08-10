import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import Logger from '../utils/debug-utils';
import ApiService from '../services/api';
import { WS_ROUTES } from '../config/api.routes';
import { formatImageAnalysisResult } from '../services/chatUtils';
import { ErrorMessage } from './common';
import ChatHeader from './Chat/ChatHeader';
import MessageList from './Chat/MessageList';
import ChatInput from './Chat/ChatInput';
import { COMPONENT_NAMES } from '../config/constants';
import { processIncomingMessage, handleMessageActions, createTextMessage, createAudioMessage } from '../utils/message-utils';
import { playAudio } from '../utils/media-utils';
import { useNavigate } from 'react-router-dom';

const COMPONENT_NAME = COMPONENT_NAMES.CHAT;

// Componentes de aviso de privacidad y términos de uso
const PrivacyTermsModal = ({ onAccept, onDecline }) => (
  <div className="modal fade show" tabIndex="-1" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
      <div className="modal-content">
        <div className="modal-header">
          <h4 className="modal-title">Aviso de Privacidad y Términos de Uso</h4>
        </div>
        <div className="modal-body">
          <h5>Aviso de Privacidad</h5>
          <p>
            Este asistente virtual puede procesar información que proporciones durante la conversación 
            para mejorar la experiencia y responder a tus consultas.
          </p>
          <ul>
            <li>No almacenamos datos personales sin tu consentimiento.</li>
            <li>No compartimos tu información con terceros.</li>
            <li>Puedes solicitar la eliminación de tus datos en cualquier momento.</li>
            <li>Utilizamos conexiones seguras (HTTPS) para proteger tus datos.</li>
          </ul>
          
          <h5 className="mt-4">Términos de Uso</h5>
          <ul>
            <li>El asistente es una herramienta automatizada y sus respuestas son orientativas.</li>
            <li>No debe considerarse asesoramiento profesional (médico, legal, financiero, etc.).</li>
            <li>Está prohibido el uso del asistente para actividades ilegales o no autorizadas.</li>
            <li>Nos reservamos el derecho de modificar estos términos en cualquier momento.</li>
          </ul>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onAccept}>
            Acepto
          </button>
          <button className="btn btn-secondary" onClick={onDecline}>
            No acepto
          </button>
        </div>
      </div>
    </div>
  </div>
);

PrivacyTermsModal.propTypes = {
  onAccept: PropTypes.func.isRequired,
  onDecline: PropTypes.func.isRequired
};

const Chat = ({ onImageResult }) => {
  // Estado
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  // Eliminado clientId no usado
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(true);
  
  // Referencias
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const initWebSocketRef = useRef(null);
  const navigate = useNavigate();

  // Comprobar si ya se ha aceptado la política de privacidad
  useEffect(() => {
    if (localStorage.getItem('chat_privacy_accepted') === 'true') {
      setShowPrivacyModal(false);
    }
  }, [initWebSocketRef]);

  // Manejadores para el modal de privacidad
  const handleAcceptPrivacy = () => {
    localStorage.setItem('chat_privacy_accepted', 'true');
    setShowPrivacyModal(false);
  };

  const handleDeclinePrivacy = () => {
    setShowPrivacyModal(false);
    navigate('/');
  };

  /**
   * Añade un mensaje al historial de chat
   */
  const addMessage = useCallback((messageData) => {
    setMessages(prevMessages => [...prevMessages, messageData]);
  }, []);

  /**
   * Añade un mensaje de error al historial de chat
   */
  const addErrorMessage = useCallback((errorInput) => {
    // Si es un string que ya tiene formato de error, usarlo directamente
    let errorText;
    if (typeof errorInput === 'string') {
      errorText = errorInput.startsWith('Error:') ? errorInput : `Error: ${errorInput}`;
    } else {
      // Si es un objeto error, extraer el mensaje y formatear
      const message = errorInput?.message || errorInput?.toString() || 'Error desconocido';
      errorText = `Error: ${message}`;
    }
    addMessage({
      text: errorText,
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
   * Declarado antes de initWebSocket para evitar no-use-before-define
   */
  const handleWebSocketClose = useCallback(() => {
    Logger.warn(COMPONENT_NAME, 'Conexión WebSocket cerrada');
    setIsConnected(false);
    setConnectionError('Conexión perdida. Intentando reconectar...');

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (initWebSocketRef.current) {
        initWebSocketRef.current();
      }
    }, 5000);
  }, []);

  /**
   * Manejar error de conexión WebSocket
   */
  const handleWebSocketError = (error) => {
    Logger.error(COMPONENT_NAME, 'Error en WebSocket', error);
    setConnectionError('Error de conexión');
    setIsConnected(false);
  };

  /**
   * Inicializar la conexión WebSocket con manejo robusto
   */
  const initWebSocket = useCallback(async () => {
    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
      if (ws.current.cleanupListeners) {
        ws.current.cleanupListeners();
      }
      ws.current.close();
    }

    try {
      Logger.info(COMPONENT_NAME, '🚀 Inicializando WebSocket con manejo robusto...');
      
      ws.current = await ApiService.createRobustWebSocketConnection(WS_ROUTES.CHAT, {
        onOpen: handleWebSocketOpen,
        onMessage: handleWebSocketMessage,
        onClose: handleWebSocketClose,
        onError: handleWebSocketError
      });
      
      Logger.info(COMPONENT_NAME, '✅ WebSocket inicializado exitosamente');
      
    } catch (error) {
      Logger.error(COMPONENT_NAME, '❌ Error al inicializar WebSocket robusto:', error);
      
      // Fallback al método original si el robusto falla
      Logger.warn(COMPONENT_NAME, '🔄 Intentando fallback a conexión WebSocket estándar...');
      try {
        ws.current = ApiService.createWebSocketConnection(WS_ROUTES.CHAT, {
          onOpen: handleWebSocketOpen,
          onMessage: handleWebSocketMessage,
          onClose: handleWebSocketClose,
          onError: handleWebSocketError
        });
      } catch (fallbackError) {
        Logger.error(COMPONENT_NAME, '❌ Error en fallback WebSocket:', fallbackError);
        setConnectionError('No se pudo establecer conexión con el servidor');
      }
    }
  }, [handleWebSocketMessage, handleWebSocketClose]);

  // Mantener una referencia invocable a initWebSocket para usarla desde otros callbacks sin dependencias cíclicas
  useEffect(() => {
    initWebSocketRef.current = initWebSocket;
  }, [initWebSocket]);

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
      setConnectionError('No hay conexión con el servidor');
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
          setConnectionError('No hay conexión con el servidor');
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

  // Crear mensaje en formato estandarizado (no se envía por WS en este flujo)
  // const standardMessage = createImageMessage(base64Image.split(',')[1], 'Análisis de imagen');
      
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

  // Flujo específico de lenguaje de señas removido para simplificar la salida en producción

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
      {showPrivacyModal && (
        <PrivacyTermsModal 
          onAccept={handleAcceptPrivacy} 
          onDecline={handleDeclinePrivacy} 
        />
      )}
      
      {!showPrivacyModal && (
        <>
          <div className="p-3 bg-theme-secondary border-bottom">
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
          {!isConnected && (
            <div className="px-3">
              <div className="alert alert-warning py-2 mb-2">
                <i className="bi bi-wifi-off me-2"></i>
                Intentando reconectar automáticamente al servidor...
              </div>
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
            onAudioRecord={handleAudioRecord}
            isConnected={isConnected}
            isTyping={isTyping}
          />
        </>
      )}
      
  {/* Monitor de WebSocket eliminado: el indicador conectado/desconectado ya no se muestra */}
    </div>
  );
};

Chat.propTypes = {
  onImageResult: PropTypes.func
};

export default Chat;
