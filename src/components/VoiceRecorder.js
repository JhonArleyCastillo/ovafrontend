import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { enviarAudio, escucharRespuestas } from '../api';
import './VoiceRecorder.css';

const VoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const cleanupRef = useRef(null);

  useEffect(() => {
    // Configurar el listener de respuestas
    cleanupRef.current = escucharRespuestas(({ texto, audioBase64 }) => {
      if (audioBase64) {
        // Convertir el audio base64 a URL
        const audioBlob = new Blob(
          [Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))],
          { type: 'audio/wav' }
        );
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      }
      if (texto) {
        console.log('Respuesta del asistente:', texto);
      }
    });

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 16000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        enviarAudio(audioBlob);
      };

      mediaRecorder.start(1000); // Enviar datos cada segundo
      setIsRecording(true);
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const getConnectionStatusClass = () => {
    return isConnected ? 'connected' : 'disconnected';
  };

  return (
    <div className="voice-recorder">
      <h2>🎙️ Grabador de Voz</h2>
      <div className="controls">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`record-button ${isRecording ? 'recording' : ''}`}
          disabled={!isConnected}
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
      <div className={`connection-status ${getConnectionStatusClass()}`}>
        {isConnected ? 'Conectado' : 'Desconectado'}
      </div>
    </div>
  );
};

VoiceRecorder.propTypes = {
  // No props required
};

export default VoiceRecorder;