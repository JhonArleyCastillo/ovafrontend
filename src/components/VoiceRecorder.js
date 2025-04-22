import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Logger from '../utils/debug-utils';
import { getAudioStream, createAudioRecorder, playAudio } from '../utils/media-utils';
import ApiService from '../services/api';
import { COMPONENT_NAMES } from '../config/constants';
import { ConnectionStatus, ErrorMessage } from './common';
import './VoiceRecorder.css';

const COMPONENT_NAME = COMPONENT_NAMES.VOICE_RECORDER;

const VoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

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

    checkConnection();

    // Limpiar recursos al desmontar
    return () => {
      stopMediaStream();
    };
  }, []);

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
      
      // Enviar al servidor para procesamiento
      const { success, data, error } = await ApiService.processAudio(audioBlob);
      
      if (!success || error) {
        throw new Error(error || 'Error al procesar el audio');
      }
      
      // Reproducir respuesta de audio si existe
      if (data && data.audioBase64) {
        await playAudio(data.audioBase64);
      }
      
      Logger.info(COMPONENT_NAME, 'Audio procesado con éxito');
    } catch (err) {
      Logger.error(COMPONENT_NAME, 'Error al procesar audio', err);
      setError(`Error al procesar el audio: ${err.message}`);
    }
  };
  
  const clearError = () => setError(null);

  return (
    <div className="voice-recorder">
      <h2>🎙️ Grabador de Voz</h2>
      <div className="controls">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`record-button ${isRecording ? 'recording' : ''}`}
          disabled={!isConnected}
          title={!isConnected ? 'Servidor desconectado' : isRecording ? 'Detener grabación' : 'Iniciar grabación'}
        >
          {isRecording ? '⏹️ Detener' : '🎤 Grabar'}
        </button>
      </div>
      <div className="recording-status">
        {isRecording ? 'Grabando...' : 'Listo para grabar'}
      </div>
      {audioUrl && (
        <div className="audio-preview">
          <audio controls src={audioUrl} className="audio-player">
            <track kind="captions" src="" label="Subtítulos" />
            <p>Tu navegador no soporta el elemento de audio.</p>
          </audio>
        </div>
      )}
      
      <ConnectionStatus isConnected={isConnected} />
      
      <ErrorMessage 
        message={error}
        onDismiss={clearError}
      />
    </div>
  );
};

VoiceRecorder.propTypes = {
  // No se requieren props
};

export default VoiceRecorder;