/**
 * 💬 CHAT COMPONENT - Corazón de la Comunicación ASL
 * 
 * Este es el componente MÁS IMPORTANTE de toda la aplicación.
 * Aquí es donde ocurre toda la magia de la comunicación en lengua de señas.
 * 
 * 🎯 ¿QUÉ HACE ESTE COMPONENTE?
 * - Maneja el chat en tiempo real con WebSockets
 * - Procesa imágenes de lenguaje de señas a través del backend
 * - Reproduce audio automáticamente para accesibilidad
 * - Gestiona modales de privacidad y términos de uso
 * - Mantiene historial de conversación
 * - Maneja errores de conexión con reconexión automática
 * 
 * 🔗 CONEXIONES FULLSTACK:
 * - Frontend: Este componente React
 * - WebSocket: Conexión en tiempo real al backend FastAPI
 * - Backend: Endpoints de procesamiento ASL (/api/chat/*)
 * - AI Service: Integración con Gradio Space para reconocimiento
 * 
 * 🛠️ ARQUITECTURA:
 * - Chat.js (este archivo): Lógica principal y WebSocket management
 * - ChatHeader.js: Barra superior con controles
 * - MessageList.js: Lista scrolleable de mensajes
 * - ChatInput.js: Input de texto y botones de acción
 * - message-utils.js: Utilidades para procesar mensajes
 * 
 * 💡 PARA DESARROLLADORES:
 * Si algo no funciona, revisa en este orden:
 * 1. WebSocket connection (logs en consola)
 * 2. Backend está running (http://localhost:8000/status)
 * 3. Gradio Space está activo (verificar en backend logs)
 * 4. Permisos de micrófono/cámara en el navegador
 * 
 * 🔒 PRIVACIDAD:
 * Incluye modal de términos y condiciones que se debe aceptar
 * antes de usar el chat. Cumple con GDPR y mejores prácticas.
 */

// 📦 IMPORTACIONES NECESARIAS
import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import Logger from '../utils/debug-utils';                    // Sistema de logging humanizado
import ApiService from '../services/api';                     // Servicio de API humanizado  
import { WS_ROUTES } from '../config/api.routes';            // Rutas WebSocket
import { formatImageAnalysisResult } from '../services/chatUtils';  // Formateo de resultados ASL
import { ErrorMessage } from './common';                      // Componente de errores
import ChatHeader from './Chat/ChatHeader';                   // Header del chat
import MessageList from './Chat/MessageList';                 // Lista de mensajes
import ChatInput from './Chat/ChatInput';                     // Input y controles
import { COMPONENT_NAMES } from '../config/constants';        // Constantes centralizadas
import { processIncomingMessage, handleMessageActions, createTextMessage, createAudioMessage } from '../utils/message-utils';
import { playAudio } from '../utils/media-utils';            // Utilidades de audio
import { useNavigate } from 'react-router-dom';              // Navegación React Router

// 🏷️ Nombre del componente para logging consistente
const COMPONENT_NAME = COMPONENT_NAMES.CHAT;

// 📋 MODAL DE PRIVACIDAD Y TÉRMINOS
// 
// Este modal es OBLIGATORIO antes de usar el chat. Cumple con:
// - GDPR (Reglamento General de Protección de Datos)
// - Mejores prácticas de privacidad
// - Transparencia sobre uso de datos
// - Términos claros de uso del servicio
//
// 💡 NOTA LEGAL: Este modal se muestra solo una vez y se guarda 
// la aceptación en localStorage. En producción, considera también
// guardar en backend para audit trail completo.

const PrivacyTermsModal = ({ onAccept, onDecline }) => (
  <div className="modal fade show terms-modal" tabIndex="-1" style={{ display: 'block', background: 'rgba(0,0,0,0.55)' }}>
    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
      <div className="modal-content">
        <div className="modal-header">
          <h4 className="modal-title">🔒 Aviso de Privacidad y Términos de Uso</h4>
        </div>
        <div className="modal-body">
          <div className="mb-2">
            <span className="badge-legal">GDPR</span>
            <span className="badge-legal">Protección de Datos</span>
            <span className="badge-legal">Transparencia</span>
          </div>
          <h5>🛡️ Aviso de Privacidad</h5>
          <p>
            Este asistente virtual procesa las imágenes y audio que proporciones durante la conversación
            para traducir lenguaje de señas y mejorar la comunicación accesible.
          </p>
          <ul>
            <li>✅ <strong>No almacenamos</strong> datos personales sin tu consentimiento explícito.</li>
            <li>✅ <strong>No compartimos</strong> tu información con terceros.</li>
            <li>✅ <strong>Puedes solicitar</strong> la eliminación de tus datos en cualquier momento.</li>
            <li>✅ <strong>Utilizamos conexiones seguras</strong> (HTTPS/WSS) para proteger tus datos.</li>
            <li>✅ <strong>Procesamiento temporal</strong>: Las imágenes se procesan y descartan inmediatamente.</li>
          </ul>

          <h5 className="mt-4">📜 Términos de Uso</h5>
          <ul>
            <li>🤖 El asistente es una herramienta automatizada y sus respuestas son <strong>orientativas</strong>.</li>
            <li>⚠️ No debe considerarse asesoramiento profesional (médico, legal, financiero, etc.).</li>
            <li>🚫 Está prohibido el uso del asistente para actividades ilegales o no autorizadas.</li>
            <li>🔄 Nos reservamos el derecho de modificar estos términos en cualquier momento.</li>
            <li>🎯 El servicio está optimizado para lenguaje de señas colombiano (LSC).</li>
          </ul>

          <div className="alert alert-info mt-3">
            <strong>💡 Nota:</strong> Este sistema utiliza inteligencia artificial para reconocimiento de gestos.
            La precisión puede variar según la calidad de la imagen y la iluminación.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onAccept}>
            ✅ Acepto los términos y política de privacidad
          </button>
          <button className="btn btn-secondary" onClick={onDecline}>
            ❌ No acepto (volver al inicio)
          </button>
        </div>
      </div>
    </div>
  </div>
);

// 🔧 PropTypes para validación de tipos (buenas prácticas React)
PrivacyTermsModal.propTypes = {
  onAccept: PropTypes.func.isRequired,
  onDecline: PropTypes.func.isRequired
};

/**
 * 💬 COMPONENTE PRINCIPAL DE CHAT
 * 
 * Este es donde toda la magia sucede. Maneja:
 * - Estado de mensajes y conexión WebSocket
 * - Modal de privacidad (GDPR compliance)
 * - Integración con el backend ASL
 * - Audio automático para accesibilidad
 * - Manejo de errores y reconexión
 */
const Chat = ({ onImageResult }) => {
  // 📊 ESTADO DEL COMPONENTE
  // Cada variable de estado tiene un propósito específico en la experiencia de chat
  
  const [messages, setMessages] = useState([]);              // 💬 Historial completo de mensajes
  const [isTyping, setIsTyping] = useState(false);           // ⌨️ Indicador de "escribiendo..."
  const [isConnected, setIsConnected] = useState(false);     // 🔌 Estado de conexión WebSocket
  const [connectionError, setConnectionError] = useState(null); // ❌ Errores de conexión
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);  // 🔊 Auto-reproducir respuestas en audio
  const [showPrivacyModal, setShowPrivacyModal] = useState(true); // 🔒 Modal de términos y privacidad
  
  // 📎 REFERENCIAS PARA MANEJO DE RECURSOS
  // useRef mantiene referencias que persisten entre renders sin causar re-renders
  const ws = useRef(null);                    // 🔌 Referencia al WebSocket activo
  const reconnectTimeoutRef = useRef(null);   // ⏰ Timer para reconexión automática
  const navigate = useNavigate();             // 🧭 Hook de navegación de React Router

  // 🔒 VERIFICACIÓN DE PRIVACIDAD AL MONTAR COMPONENTE
  // Comprueba si el usuario ya aceptó los términos previamente
  // Si ya los aceptó, no muestra el modal nuevamente
  useEffect(() => {
    const privacyAccepted = localStorage.getItem('chat_privacy_accepted');
    if (privacyAccepted === 'true') {
      Logger.debug(COMPONENT_NAME, '✅ Usuario ya aceptó términos de privacidad previamente');
      setShowPrivacyModal(false);
    } else {
      Logger.debug(COMPONENT_NAME, '⚠️ Usuario debe aceptar términos de privacidad');
    }
  }, []); // Sin dependencias: solo ejecutar una vez al montar

  // 🔒 HANDLERS DEL MODAL DE PRIVACIDAD
  
  /**
   * ✅ Usuario acepta términos y privacidad
   * Guarda la aceptación en localStorage y cierra el modal
   */
  const handleAcceptPrivacy = () => {
    Logger.info(COMPONENT_NAME, '✅ Usuario aceptó términos de privacidad');
    localStorage.setItem('chat_privacy_accepted', 'true');
    setShowPrivacyModal(false);
  };

  /**
   * ❌ Usuario rechaza términos y privacidad  
   * Cierra modal y navega de vuelta al inicio
   */
  const handleDeclinePrivacy = () => {
    Logger.info(COMPONENT_NAME, '❌ Usuario rechazó términos de privacidad, navegando al inicio');
    setShowPrivacyModal(false);
    navigate('/');
  };

  // 💬 GESTIÓN DE MENSAJES DE CHAT

  /**
   * 📝 Añadir Mensaje al Historial
   * 
   * Función optimizada que añade un nuevo mensaje al historial de chat.
   * Usa useCallback para evitar re-renders innecesarios de componentes hijos.
   * 
   * 🔄 FLUJO:
   * 1. Recibe datos del mensaje (texto, tipo, usuario, etc.)
   * 2. Añade al final del array de mensajes existentes
   * 3. Triggerea re-render de MessageList para mostrar el nuevo mensaje
   * 
   * @param {Object} messageData - Objeto con datos del mensaje
   * @param {string} messageData.text - Contenido del mensaje
   * @param {boolean} messageData.isUser - true si es del usuario, false si es del bot
   * @param {string} messageData.type - Tipo de mensaje ('text', 'image', 'audio', 'error')
   */
  const addMessage = useCallback((messageData) => {
    Logger.debug(COMPONENT_NAME, '📝 Añadiendo mensaje al historial:', { 
      type: messageData.type, 
      isUser: messageData.isUser,
      hasText: !!messageData.text 
    });
    
    setMessages(prevMessages => [...prevMessages, messageData]);
  }, []);

  /**
   * ❌ Añadir Mensaje de Error
   * 
   * Función especializada para manejar errores de manera consistente.
   * Formatea automáticamente los errores y los añade como mensajes del sistema.
   * 
   * 💡 TIPOS DE ERRORES QUE MANEJA:
   * - Errores de conexión WebSocket
   * - Fallos de procesamiento de imagen ASL
   * - Timeouts de respuesta del servidor
   * - Errores de formato de mensaje
   * 
   * @param {string|Error|Object} errorInput - Error en cualquier formato
   */
  const addErrorMessage = useCallback((errorInput) => {
    // 🔄 Normalización inteligente de errores
    let errorText;
    if (typeof errorInput === 'string') {
      // Si ya tiene formato de error, usarlo tal como está
      errorText = errorInput.startsWith('Error:') ? errorInput : `Error: ${errorInput}`;
    } else {
      // Si es un objeto Error o similar, extraer mensaje útil
      const message = errorInput?.message || errorInput?.toString() || 'Error desconocido';
      errorText = `Error: ${message}`;
    }
    
    Logger.error(COMPONENT_NAME, '💥 Añadiendo mensaje de error al chat:', errorText);
    
    // 📝 Añadir como mensaje del sistema (isUser: false, type: 'error')
    addMessage({
      text: errorText,
      isUser: false,
      type: 'error',
      timestamp: new Date().toISOString()
    });
  }, [addMessage]);

  /**
   * 🔊 Reproducción Automática de Audio
   * 
   * Característica de accesibilidad que reproduce automáticamente las respuestas
   * del asistente en audio. Especialmente útil para usuarios con discapacidades visuales.
   * 
   * 🎯 FUNCIONAMIENTO:
   * - Solo reproduce si autoPlayAudio está habilitado
   * - Usa la utilidad playAudio para manejar la reproducción
   * - Captura errores de audio sin romper la experiencia
   * 
   * 💡 CASOS DE USO:
   * - Respuestas del bot tras procesamiento ASL
   * - Confirmaciones de acciones realizadas
   * - Notificaciones importantes del sistema
   * 
   * 🛠️ DEBUGGING: Si el audio no reproduce, verifica:
   * 1. Permisos de audio en el navegador
   * 2. Que el dispositivo no esté en modo silencioso
   * 3. Formato del archivo de audio compatible
   * 
   * @param {string|ArrayBuffer|Blob} audioData - Datos de audio en formato compatible
   */
  const handleAudioPlayback = useCallback((audioData) => {
    if (!autoPlayAudio) {
      Logger.debug(COMPONENT_NAME, '🔇 Auto-play deshabilitado, omitiendo reproducción');
      return;
    }
    
    if (!audioData) {
      Logger.warn(COMPONENT_NAME, '⚠️ No hay datos de audio para reproducir');
      return;
    }
    
    try {
      Logger.debug(COMPONENT_NAME, '🔊 Iniciando reproducción automática de audio');
      playAudio(audioData);
    } catch (error) {
      Logger.error(COMPONENT_NAME, '💥 Error al reproducir audio:', error);
      // No añadir mensaje de error al chat por problemas de audio
      // para no interrumpir la conversación
    }
  }, [autoPlayAudio]);

  // 🔌 MANEJO DE MENSAJES WEBSOCKET

  /**
   * 📨 Procesador Central de Mensajes WebSocket
   * 
   * Este método es el CORAZÓN de la comunicación en tiempo real.
   * Cada mensaje que llega del backend pasa por aquí para ser procesado,
   * validado y convertido en acciones de la UI.
   * 
   * 🔄 FLUJO DE PROCESAMIENTO:
   * 1. Recibe mensaje raw del WebSocket
   * 2. Intenta parsearlo como JSON (fallback a texto plano)
   * 3. Procesa según el protocolo estándar de mensajes
   * 4. Ejecuta acciones específicas según el tipo
   * 5. Actualiza la UI correspondiente
   * 
   * 📋 TIPOS DE MENSAJE QUE MANEJA:
   * - 'text': Respuestas de texto del asistente
   * - 'audio': Respuestas con audio (TTS)
   * - 'image': Resultados de procesamiento ASL con imágenes
   * - 'typing': Indicadores de "escribiendo..."
   * - 'error': Errores del servidor o procesamiento
   * - 'connection': Estados de conexión del backend
   * 
   * 🛠️ DEBUGGING: Si los mensajes no llegan correctamente:
   * 1. Revisa logs de WebSocket en debug-utils
   * 2. Verifica formato JSON en backend
   * 3. Confirma que el protocolo de mensajes coincide
   * 
   * @param {MessageEvent} event - Evento WebSocket con el mensaje
   */
  const handleWebSocketMessage = useCallback((event) => {
    try {
      Logger.debug(COMPONENT_NAME, '📨 Mensaje WebSocket recibido, procesando...');
      let data;
      
      // 🔄 Parsing inteligente: JSON primero, texto plano como fallback
      try {
        data = JSON.parse(event.data);
        Logger.debug(COMPONENT_NAME, '✅ Mensaje parseado como JSON:', { type: data.type });
      } catch (parseError) {
        Logger.warn(COMPONENT_NAME, '⚠️ No se pudo parsear como JSON, usando como texto plano');
        // Si no es JSON válido, tratarlo como mensaje de texto simple
        data = { text: event.data, type: 'text', isUser: false };
      }

      // 🛠️ Procesar mensaje según protocolo estándar
      const processedMessage = processIncomingMessage(data);
      Logger.debug(COMPONENT_NAME, '🔄 Mensaje procesado:', { 
        type: processedMessage.type,
        hasText: !!processedMessage.text,
        hasAudio: !!processedMessage.audio,
        hasImage: !!processedMessage.image
      });
      
      // 🎭 Dispatcher: ejecutar acción según tipo de mensaje
      switch (processedMessage.type) {
        case 'text':
          Logger.debug(COMPONENT_NAME, '💬 Procesando mensaje de texto');
          addMessage(processedMessage);
          setIsTyping(false);
          break;
          
        case 'audio':
          Logger.debug(COMPONENT_NAME, '🔊 Procesando mensaje con audio');
          // 🔊 Reproducir audio automáticamente si está habilitado
          handleAudioPlayback(processedMessage.audio);
          // 📝 Añadir mensaje al chat
          addMessage(processedMessage);
          setIsTyping(false);
          break;

        case 'image':
          Logger.debug(COMPONENT_NAME, '🖼️ Procesando mensaje con imagen (resultado ASL)');
          // 🎬 Ejecutar acciones específicas del mensaje (callbacks, etc.)
          handleMessageActions(processedMessage);
          // 📝 Añadir al historial del chat
          addMessage(processedMessage);
          setIsTyping(false);
          break;
          
        case 'typing':
          Logger.debug(COMPONENT_NAME, `⌨️ Actualizando indicador de escritura: ${processedMessage.isTyping}`);
          setIsTyping(processedMessage.isTyping);
          break;
          
        case 'error':
          Logger.error(COMPONENT_NAME, '💥 Error recibido del servidor:', processedMessage);
          setConnectionError(processedMessage.text);
          addErrorMessage(processedMessage.text);
          setIsTyping(false);
          break;
          
          Logger.debug(COMPONENT_NAME, '🔌 Procesando mensaje de estado de conexión');
          if (processedMessage.status === 'connected') {
            setIsConnected(true);
            setConnectionError(null);
            Logger.info(COMPONENT_NAME, '✅ Servidor confirmó conexión establecida');
          } else {
            setIsConnected(false);
            setConnectionError('Conexión cerrada por el servidor');
            Logger.warn(COMPONENT_NAME, '⚠️ Servidor reportó desconexión');
          }
          break;
          
        default:
          Logger.warn(COMPONENT_NAME, `❓ Tipo de mensaje no reconocido: ${processedMessage.type}`, processedMessage);
          // Agregar como mensaje de texto genérico si tiene contenido
          if (processedMessage.text) {
            addMessage({
              text: processedMessage.text,
              isUser: false,
              type: 'text',
              timestamp: new Date().toISOString()
            });
          }
          break;
      }
    } catch (error) {
      Logger.error(COMPONENT_NAME, '💥 Error crítico al procesar mensaje WebSocket:', error);
      addErrorMessage('Error procesando mensaje del servidor');
    }
  }, [addErrorMessage, addMessage, handleAudioPlayback]);

  // 🔌 GESTIÓN DE CONEXIÓN WEBSOCKET
  
  /**
   * ✅ Handler de Apertura de Conexión
   * 
   * Se ejecuta cuando el WebSocket se conecta exitosamente al backend.
   * Actualiza el estado de la UI para mostrar que estamos conectados.
   */
  const handleWebSocketOpen = () => {
    Logger.info(COMPONENT_NAME, '🎉 WebSocket conectado exitosamente');
    setIsConnected(true);
    setConnectionError(null);
  };

  /**
   * 🔌 Handler de Cierre de Conexión
   * 
   * Se ejecuta cuando se pierde la conexión WebSocket.
   * Implementa reconexión automática para mejorar la experiencia del usuario.
   * 
   * 🔄 ESTRATEGIA DE RECONEXIÓN:
   * - Limpia timers existentes para evitar múltiples intentos
   * - Espera 5 segundos antes de reintentar (evita spam al servidor)
   * - Muestra mensaje informativo al usuario sobre el estado
   */
  const handleWebSocketClose = useCallback(() => {
    Logger.warn(COMPONENT_NAME, '🔌 Conexión WebSocket cerrada, iniciando reconexión...');
    setIsConnected(false);
    setConnectionError('Conexión perdida. Intentando reconectar...');

    // 🧹 Limpiar timeout anterior si existe
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // ⏰ Programar reconexión automática después de 5 segundos
    reconnectTimeoutRef.current = setTimeout(() => {
      Logger.debug(COMPONENT_NAME, '🔄 Ejecutando reconexión automática...');
      initWebSocket();
    }, 5000);
  }, []);

  /**
   * ❌ Handler de Errores de WebSocket
   * 
   * Se ejecuta cuando hay errores en la conexión WebSocket.
   * Proporciona feedback al usuario y logea para debugging.
   * 
   * @param {Event} error - Evento de error del WebSocket
   */
  const handleWebSocketError = (error) => {
    Logger.error(COMPONENT_NAME, '💥 Error en conexión WebSocket:', error);
    setConnectionError('Error de conexión al servidor');
    setIsConnected(false);
  };

  /**
   * 🚀 Inicializador Maestro de WebSocket
   * 
   * Esta función es el NÚCLEO de la conectividad en tiempo real.
   * Maneja toda la complejidad de establecer y mantener la conexión WebSocket
   * con el backend FastAPI.
   * 
   * 🔄 FLUJO DE INICIALIZACIÓN:
   * 1. Verifica si ya hay una conexión activa (evita duplicados)
   * 2. Limpia conexiones anteriores apropiadamente
   * 3. Verifica disponibilidad del servidor backend
   * 4. Establece nueva conexión con handlers robustos
   * 5. Configura event listeners para todos los eventos WebSocket
   * 
   * 🛡️ MANEJO DE ERRORES:
   * - Verifica servidor antes de conectar (evita errores inútiles)
   * - Limpia recursos anteriores para evitar memory leaks
   * - Maneja errores de conexión graciosamente
   * - Proporciona feedback claro al usuario
   * 
   * 🔧 DEBUGGING: Si la conexión falla constantemente:
   * 1. Verifica que el backend esté ejecutándose (http://localhost:8000/status)
   * 2. Revisa configuración de CORS en el backend
   * 3. Confirma que el endpoint WebSocket esté habilitado
   * 4. Verifica firewall/proxy no esté bloqueando WebSockets
   */
  const initWebSocket = useCallback(async () => {
    // 🔍 Verificar si ya tenemos una conexión activa
    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
      Logger.debug(COMPONENT_NAME, '🔌 Conexión WebSocket ya existe, limpiando...');
      
      // 🧹 Limpiar listeners anteriores si existen
      if (ws.current.cleanupListeners) {
        ws.current.cleanupListeners();
      }
      
      // 🔌 Cerrar conexión anterior
      ws.current.close();
    }

    try {
      Logger.debug(COMPONENT_NAME, '🚀 Inicializando WebSocket con sistema robusto...');
      
      // 🎯 Intentar conexión robusta primero (con retry automático)
      ws.current = await ApiService.createRobustWebSocketConnection(WS_ROUTES.CHAT, {
        onOpen: handleWebSocketOpen,
        onMessage: handleWebSocketMessage,
        onClose: handleWebSocketClose,
        onError: handleWebSocketError
      });
      
      // 📢 ÚNICO mensaje info permitido desde Chat (requerimiento específico)
      Logger.info(COMPONENT_NAME, '✅ WebSocket inicializado exitosamente con sistema robusto');
      
    } catch (error) {
      Logger.error(COMPONENT_NAME, '💥 Error al inicializar WebSocket robusto:', error);
      
      // 🔄 Fallback: intentar conexión estándar si la robusta falla
      Logger.debug(COMPONENT_NAME, '🔄 Intentando fallback a conexión WebSocket estándar...');
      try {
        ws.current = ApiService.createWebSocketConnection(WS_ROUTES.CHAT, {
          onOpen: handleWebSocketOpen,
          onMessage: handleWebSocketMessage,
          onClose: handleWebSocketClose,
          onError: handleWebSocketError
        });
        
        Logger.debug(COMPONENT_NAME, '✅ Fallback exitoso: WebSocket estándar conectado');
      } catch (fallbackError) {
        Logger.error(COMPONENT_NAME, '❌ Error crítico: ambos métodos de conexión fallaron:', fallbackError);
        setConnectionError('No se pudo establecer conexión con el servidor. Verifica tu conexión de red.');
      }
    }
  }, [handleWebSocketMessage, handleWebSocketClose]);

  // ⚡ LIFECYCLE: INICIALIZACIÓN Y CLEANUP
  
  /**
   * 🎬 Hook de Inicialización del Componente
   * 
   * Se ejecuta una vez cuando el componente se monta.
   * Establece la conexión WebSocket y configura cleanup automático.
   * 
   * 🔄 FLUJO:
   * 1. Monta el componente → inicializa WebSocket
   * 2. Desmonta el componente → limpia recursos automáticamente
   * 
   * 🧹 CLEANUP AUTOMÁTICO:
   * React ejecuta la función de cleanup cuando el componente se desmonta,
   * evitando memory leaks y conexiones huérfanas.
   */
  useEffect(() => {
    Logger.debug(COMPONENT_NAME, '🎬 Componente montado: inicializando WebSocket para chat');
    initWebSocket();

    // 🧹 Función de cleanup que React ejecuta al desmontar
    return () => {
      Logger.debug(COMPONENT_NAME, '🧹 Desmontando Chat: limpiando recursos WebSocket');
      
      // 🔌 Cerrar WebSocket si existe
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      
      // ⏰ Cancelar timers de reconexión
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [initWebSocket]);

  // 💬 HANDLERS DE ENVÍO DE MENSAJES

  /**
   * 📤 Envío de Mensajes de Texto
   * 
   * Maneja el envío de mensajes de texto del usuario al backend ASL.
   * Incluye validación de conexión, formato estándar, y feedback visual.
   * 
   * 🔄 FLUJO COMPLETO:
   * 1. Valida que hay conexión WebSocket activa
   * 2. Añade mensaje del usuario al chat (si showInChat = true)  
   * 3. Formatea mensaje según protocolo estándar
   * 4. Envía por WebSocket al backend
   * 5. Activa indicador "escribiendo..." esperando respuesta
   * 
   * 💡 PARÁMETROS:
   * - message: Texto del usuario a enviar
   * - showInChat: Si mostrar el mensaje en la UI (útil para comandos silenciosos)
   * 
   * 🛠️ MANEJO DE ERRORES:
   * - Sin conexión: Muestra error sin romper la experiencia
   * - WebSocket cerrado: Intenta reconexión automática
   * - Mensaje malformado: Logs para debugging
   * 
   * @param {string} message - El mensaje de texto a enviar al backend
   * @param {boolean} showInChat - Si mostrar en la UI (default: true)
   */
  const handleSendMessage = useCallback((message, showInChat = true) => {
    Logger.debug(COMPONENT_NAME, '📤 Preparando envío de mensaje de texto:', { 
      length: message.length, 
      showInChat,
      isConnected 
    });
    
    // 📝 Añadir mensaje del usuario al chat si es visible
    if (showInChat) {
      addMessage({
        text: message,
        isUser: true,
        type: 'text',
        timestamp: new Date().toISOString()
      });
    }

    // 🚨 Verificar estado de conexión ANTES de enviar
    if (!isConnected) {
      Logger.warn(COMPONENT_NAME, '⚠️ Intento de envío sin conexión WebSocket');
      addMessage({
        text: '❌ No se pudo enviar mensaje: error de conexión. Verifica tu internet.',
        isUser: false,
        type: 'error',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 📦 Crear mensaje en formato estándar del protocolo
    const standardMessage = createTextMessage(message);

    // 📡 Enviar por WebSocket si la conexión está abierta
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(standardMessage));
      
      // ⌨️ Activar indicador "escribiendo..." mientras esperamos respuesta
      setIsTyping(true);
      
      Logger.debug(COMPONENT_NAME, '✅ Mensaje enviado exitosamente al backend');
    } else {
      Logger.error(COMPONENT_NAME, '💥 WebSocket no está abierto para envío');
      setConnectionError('Conexión perdida con el servidor');
      addMessage({
        text: '❌ Error: WebSocket no conectado. Reintentando conexión...',
        isUser: false,
        type: 'error',
        timestamp: new Date().toISOString()
      });
    }
  }, [addMessage, isConnected]);

  /**
   * 🎤 Procesamiento de Grabaciones de Audio  
   * 
   * Maneja audio grabado desde el micrófono para enviarlo al backend ASL.
   * El audio puede ser procesado por sistemas de reconocimiento de voz.
   * 
   * 🔄 FLUJO DE PROCESAMIENTO:
   * 1. Recibe blob de audio del componente VoiceRecorder
   * 2. Crea URL local para previsualización en el chat  
   * 3. Convierte a base64 para transmisión por WebSocket
   * 4. Envía al backend con formato estándar
   * 5. Backend puede usar speech-to-text o procesamiento directo
   * 
   * 🎯 CASOS DE USO:
   * - Usuario habla en español y quiere traducir a LSC (Lengua de Señas Colombiana)
   * - Comandos de voz para controlar la interfaz
   * - Dictado de texto largo más cómodo que escribir
   * 
   * 🛠️ DEBUGGING AUDIO:
   * - Verifica permisos de micrófono en navegador
   * - Confirma que el formato de audio es compatible (webm/mp4)
   * - Revisa tamaño del blob (muy grande = problemas de transmisión)
   * 
   * @param {Blob} audioBlob - Blob con datos de audio del micrófono
   */
  const handleAudioRecord = useCallback(async (audioBlob) => {
    Logger.debug(COMPONENT_NAME, '🎤 Audio grabado recibido:', { 
      size: audioBlob.size,
      type: audioBlob.type
    });

    try {
      // 🔊 Crear URL temporal para previsualización en el chat
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // 📝 Añadir mensaje visual del usuario con preview de audio
      addMessage({
        text: '🎤 Mensaje de voz enviado',
        isUser: true,
        type: 'audio',
        audio: audioUrl,
        timestamp: new Date().toISOString()
      });

      // 🚨 Verificar conexión antes de procesar y enviar
      if (!isConnected) {
        Logger.warn(COMPONENT_NAME, '⚠️ Intento de envío de audio sin conexión');
        addMessage({
          text: '❌ No se pudo enviar el audio: error de conexión. Verifica tu internet.',
          isUser: false,
          type: 'error',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // 🔄 Conversión a base64 para transmisión por WebSocket
      Logger.debug(COMPONENT_NAME, '🔄 Convirtiendo audio a base64 para transmisión...');
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result.split(',')[1]; // Remover prefijo data:audio/...;base64,
        
        Logger.debug(COMPONENT_NAME, '📦 Audio convertido a base64, preparando envío...');
        
        // 📦 Crear mensaje en formato estándar del protocolo para audio
        const standardMessage = createAudioMessage(base64Audio);
        
        // 📡 Enviar por WebSocket al backend
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify(standardMessage));
          
          // ⌨️ Activar indicador "procesando..." para audio
          setIsTyping(true);
          
          Logger.debug(COMPONENT_NAME, '✅ Audio enviado exitosamente al backend');
        } else {
          Logger.error(COMPONENT_NAME, '💥 WebSocket no disponible para envío de audio');
          setConnectionError('Conexión perdida con el servidor');
          addErrorMessage('No se pudo procesar el audio - sin conexión');
        }
      };
      
      // 📈 Manejar errores de conversión base64
      reader.onerror = () => {
        Logger.error(COMPONENT_NAME, '💥 Error al convertir audio a base64');
        addErrorMessage('Error procesando archivo de audio');
      };
      
    } catch (error) {
      Logger.error(COMPONENT_NAME, '💥 Error crítico al procesar audio grabado:', error);
      addErrorMessage('Error interno procesando audio');
    }
  }, [addMessage, addErrorMessage, isConnected]);

  /**
   * 🖼️ Procesamiento de Imágenes ASL
   * 
   * Este método es CRÍTICO para la funcionalidad principal de la app:
   * el reconocimiento de lenguaje de señas a partir de imágenes.
   * 
   * 🔄 FLUJO COMPLETO DE PROCESAMIENTO:
   * 1. Usuario selecciona imagen desde SignLanguageUploader
   * 2. Convierte imagen a base64 para preview
   * 3. Muestra imagen en el chat como mensaje del usuario
   * 4. Envía archivo original al backend FastAPI 
   * 5. Backend procesa con Gradio Space (AI model)
   * 6. Recibe predicción y confianza del reconocimiento
   * 7. Muestra resultado formateado en el chat
   * 8. Notifica al componente padre si hay callback
   * 
   * 🎯 BACKEND CONNECTION:
   * - Usa ApiService.processSignLanguage() que ya humanizamos
   * - Conecta con el endpoint /api/chat/process_sign_language
   * - El backend usa el modelo de IA en Gradio Space
   * 
   * 🛠️ DEBUGGING: Si el reconocimiento falla:
   * 1. Verifica que el backend esté running
   * 2. Confirma que Gradio Space esté activo
   * 3. Revisa formato y calidad de la imagen
   * 4. Verifica logs del backend para errores específicos
   * 
   * @param {File} file - Archivo de imagen seleccionado por el usuario
   */
  const handleImageUpload = useCallback(async (file) => {
    Logger.debug(COMPONENT_NAME, '🖼️ Procesamiento de imagen ASL iniciado:', { 
      name: file.name, 
      size: file.size, 
      type: file.type 
    });

    if (!file) {
      Logger.warn(COMPONENT_NAME, '⚠️ No se seleccionó archivo de imagen');
      return;
    }

    try {
      // 🔄 Convertir imagen a base64 para preview en el chat
      Logger.debug(COMPONENT_NAME, '🔄 Convirtiendo imagen a base64 para preview...');
      const reader = new FileReader();
      const base64ImagePromise = new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Error al leer archivo de imagen'));
        reader.readAsDataURL(file);
      });
      
      const base64Image = await base64ImagePromise;
      Logger.debug(COMPONENT_NAME, '✅ Imagen convertida a base64:', { length: base64Image.length });

      // 📝 Mostrar imagen en el chat como mensaje del usuario
      addMessage({
        text: '🖼️ Imagen de lenguaje de señas enviada',
        isUser: true,
        image: base64Image,
        type: 'image',
        timestamp: new Date().toISOString()
      });
      
      // 🚨 Verificar conexión antes de procesar
      if (!isConnected) {
        Logger.warn(COMPONENT_NAME, '⚠️ Sin conexión para procesar imagen ASL');
        addMessage({
          text: '❌ No se pudo procesar la imagen: error de conexión. Verifica tu internet.',
          isUser: false,
          type: 'error',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // ⌨️ Indicar que estamos procesando (puede tomar unos segundos)
      setIsTyping(true);
      
      // 🤖 Enviar al backend para procesamiento con IA
      Logger.debug(COMPONENT_NAME, '🤖 Enviando imagen al backend para reconocimiento ASL...');
      const { success, data, error } = await ApiService.processSignLanguage(file);
      Logger.debug(COMPONENT_NAME, '📥 Respuesta recibida del backend:', { 
        success, 
        hasData: !!data, 
        hasError: !!error 
      });

      if (success && data) {
        // 🎯 Formatear resultado del reconocimiento ASL
        const resultText = data.success 
          ? `🤟 Reconocimiento ASL: "${data.prediction}" (confianza: ${data.confidence}%)`
          : `❌ No se pudo reconocer: ${data.message || 'Imagen no clara o seña no identificada'}`;
          
        Logger.debug(COMPONENT_NAME, '✅ Resultado ASL procesado:', resultText);
        
        addMessage({
          text: resultText,
          isUser: false,
          type: 'text',
          timestamp: new Date().toISOString()
        });

        // 📢 Notificar al componente padre si hay callback (para analytics, etc.)
        if (onImageResult) {
          onImageResult(data);
        }
      } else {
        throw new Error(error?.message || 'Error al analizar lenguaje de señas');
      }
    } catch (error) {
      Logger.error(COMPONENT_NAME, '💥 Error crítico procesando imagen ASL:', error);
      addErrorMessage(`Error procesando imagen: ${error.message}`);
    } finally {
      // 🏁 Siempre limpiar indicador de "procesando"
      setIsTyping(false);
    }
  }, [addErrorMessage, addMessage, onImageResult, isConnected]);

  // 🎛️ MÉTODOS UTILITARIOS DE CONFIGURACIÓN

  /**
   * 🔊 Toggle de Auto-Play de Audio
   * 
   * Permite al usuario habilitar/deshabilitar la reproducción automática
   * de respuestas en audio. Útil para accesibilidad.
   */
  const toggleAutoPlayAudio = () => {
    const newValue = !autoPlayAudio;
    setAutoPlayAudio(newValue);
    Logger.debug(COMPONENT_NAME, `🔊 Auto-play audio ${newValue ? 'habilitado' : 'deshabilitado'}`);
  };

  /**
   * 🧹 Limpiar Mensajes de Error
   * 
   * Permite al usuario cerrar manualmente mensajes de error
   * que aparecen en la UI por problemas de conexión.
   */
  const clearError = () => {
    Logger.debug(COMPONENT_NAME, '🧹 Limpiando mensaje de error de conexión');
    setConnectionError(null);
  };

  // 🎨 RENDERIZADO PRINCIPAL DEL COMPONENTE
  return (
    <div className="d-flex flex-column h-100">
      {/* 🔒 Modal de Privacidad (solo se muestra si no ha sido aceptado) */}
      {showPrivacyModal && (
        <PrivacyTermsModal 
          onAccept={handleAcceptPrivacy} 
          onDecline={handleDeclinePrivacy} 
        />
      )}
      
      {/* 💬 Interfaz Principal del Chat (solo después de aceptar términos) */}
      {!showPrivacyModal && (
        <>
          {/* 📋 Header con Estado de Conexión y Controles */}
          <div className="p-3 bg-theme-secondary border-bottom">
            <ChatHeader 
              isConnected={isConnected} 
              autoPlayAudio={autoPlayAudio}
              onToggleAutoPlayAudio={toggleAutoPlayAudio}
            />
          </div>
          
          {/* ⚠️ Alertas de Error de Conexión */}
          {connectionError && (
            <div className="px-3 pt-3">
              <ErrorMessage message={connectionError} onDismiss={clearError} />
            </div>
          )}
          
          {/* 🔌 Indicador de Reconexión Automática */}
          {!isConnected && (
            <div className="px-3">
              <div className="alert alert-warning py-2 mb-2">
                <i className="bi bi-wifi-off me-2"></i>
                🔄 Intentando reconectar automáticamente al servidor...
              </div>
            </div>
          )}
          
          {/* 💬 Área Principal de Mensajes (scrolleable) */}
          <div className="flex-grow-1 overflow-auto p-3">
            <MessageList 
              messages={messages}
              isTyping={isTyping}
              autoPlayAudio={autoPlayAudio}
            />
          </div>
          
          {/* ⌨️ Input de Chat con Controles de Envío */}
          <ChatInput 
            onSendMessage={handleSendMessage}
            onImageUpload={handleImageUpload}
            onAudioRecord={handleAudioRecord}
            isConnected={isConnected}
            isTyping={isTyping}
          />
        </>
      )}
      
      {/* 
      💡 NOTA DE DESARROLLO:
      Monitor de WebSocket eliminado de la UI para simplificar la experiencia.
      El estado de conexión se muestra en el header y alertas contextuales.
      */}
    </div>
  );
};

// 🔧 PROP TYPES PARA VALIDACIÓN
// Definimos las props esperadas para mejor desarrollo y debugging
Chat.propTypes = {
  onImageResult: PropTypes.func  // Callback opcional para resultados de procesamiento ASL
};

// 📤 EXPORTACIÓN DEL COMPONENTE
export default Chat;
