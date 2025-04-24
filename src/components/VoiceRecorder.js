import React, { useState, useEffect, useRef } from 'react';
import Logger from '../utils/debug-utils';
import { getAudioStream, createAudioRecorder, playAudio } from '../utils/media-utils';
import ApiService from '../services/api';
import { COMPONENT_NAMES } from '../config/constants';
import { ConnectionStatus, ErrorMessage } from './common';
import { processIncomingMessage, handleMessageActions } from '../utils/message-utils';

const COMPONENT_NAME = COMPONENT_NAMES.VOICE_RECORDER;

const VoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const wsRef = useRef(null);
  
  useEffect(() => {
    // Verificar la conexión con el servidor al iniciar
    const checkConnection = async () => {
      try {
        const isServerAvailable = await ApiService.checkServerStatus();
        setIsConnected(isServerAvailable);
        if (!isServerAvailable) {
          setError('No se pudo conectar al servidor de voz');
        }
      } catch (err) {
        Logger.error(COMPONENT_NAME, 'Error al verificar conexión', err);
        setIsConnected(false);
        setError('Error al conectar con el servidor');
      }
    };

    const setupWebSocket = () => {
      // Crear WebSocket para la comunicación de audio
      try {
        const ws = ApiService.createWebSocketConnection(ApiService.WS_ROUTES.DETECT_AUDIO, {
          onOpen: () => {
            Logger.info(COMPONENT_NAME, 'WebSocket de audio conectado');
            setIsConnected(true);
            setError(null);
          },
          onMessage: handleWebSocketMessage,
          onClose: () => {
            Logger.warn(COMPONENT_NAME, 'WebSocket de audio desconectado');
            setIsConnected(false);
            setError('Conexión perdida');
            
            // Reintentar conexión después de 5 segundos
            setTimeout(setupWebSocket, 5000);
          },
          onError: (err) => {
            Logger.error(COMPONENT_NAME, 'Error en WebSocket de audio', err);
            setIsConnected(false);
            setError('Error en la conexión');
          }
        });
        
        wsRef.current = ws;
      } catch (err) {
        Logger.error(COMPONENT_NAME, 'Error al crear WebSocket', err);
        setError('No se pudo establecer la conexión WebSocket');
      }
    };

    checkConnection().then(setupWebSocket);

    // Limpiar recursos al desmontar
    return () => {
      stopMediaStream();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const handleWebSocketMessage = (event) => {
    try {
      // Procesar el mensaje recibido en formato estandarizado
      const data = JSON.parse(event.data);
      const message = processIncomingMessage(data);
      
      // Manejar según el tipo de mensaje
      switch (message.type) {
        case 'text':
          setTranscript(message.text);
          break;
          
        case 'audio':
          // Si hay texto, mostrarlo
          if (message.text) {
            setTranscript(message.text);
          }
          
          // Reproducir el audio automáticamente
          if (message.audio) {
            handleMessageActions(message);
          }
          break;
          
        case 'error':
          Logger.error(COMPONENT_NAME, 'Error del servidor', message);
          setError(message.text);
          break;
          
        case 'connection':
          setIsConnected(message.status === 'connected');
          break;
          
        default:
          Logger.warn(COMPONENT_NAME, 'Tipo de mensaje no manejado', message);
      }
    } catch (error) {
      Logger.error(COMPONENT_NAME, 'Error al procesar mensaje WebSocket', error);
    }
  };

  const stopMediaStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      
      // Obtener acceso al micrófono
      const stream = await getAudioStream();
      streamRef.current = stream;
      
      // Crear grabador
      const mediaRecorder = createAudioRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Configurar eventos
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          processRecording(audioBlob);
        } catch (err) {
          Logger.error(COMPONENT_NAME, 'Error al procesar grabación', err);
          setError('Error al procesar la grabación de audio');
        }
      };

      // Iniciar grabación
      mediaRecorder.start(1000); // Enviar datos cada segundo
      setIsRecording(true);
      Logger.info(COMPONENT_NAME, 'Grabación iniciada');
    } catch (err) {
      Logger.error(COMPONENT_NAME, 'Error al iniciar grabación', err);
      setError(`Error al acceder al micrófono: ${err.message}`);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      stopMediaStream();
      setIsRecording(false);
      Logger.info(COMPONENT_NAME, 'Grabación detenida');
    }
  };

  const processRecording = async (audioBlob) => {
    try {
      // Crear URL para previsualización
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      // Enviar el audio al WebSocket si está conectado
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(audioBlob);
        Logger.info(COMPONENT_NAME, 'Audio enviado para procesamiento');
      } else {
        throw new Error('No hay conexión WebSocket disponible');
      }
    } catch (err) {
      Logger.error(COMPONENT_NAME, 'Error al procesar audio', err);
      setError(`Error al procesar el audio: ${err.message}`);
    }
  };
  
  const clearError = () => setError(null);

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h5 className="card-title d-flex align-items-center">
          <i className="bi bi-mic me-2"></i>
          Grabador de Voz
        </h5>
        
        <div className="d-flex flex-column align-items-center gap-3 py-3">
          {error && <ErrorMessage message={error} onDismiss={clearError} />}

          <div className="d-flex align-items-center mb-2">
            <ConnectionStatus isConnected={isConnected} />
          </div>
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'} btn-lg rounded-circle d-flex align-items-center justify-content-center`}
            disabled={!isConnected}
            style={{ width: '80px', height: '80px' }}
          >
            <i className={`bi ${isRecording ? 'bi-stop-fill' : 'bi-mic'} fs-4`}></i>
          </button>

          <div className="text-muted small">
            {isRecording ? 
              <span className="text-danger">Grabando...</span> : 
              'Haz clic para grabar'
            }
          </div>

          {audioUrl && (
            <div className="w-100 mt-3">
              <audio controls className="w-100" src={audioUrl}>
                <track kind="captions" />
              </audio>
            </div>
          )}
          
          {transcript && (
            <div className="w-100 mt-3">
              <div className="alert alert-info">
                <strong>Transcripción:</strong> {transcript}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;