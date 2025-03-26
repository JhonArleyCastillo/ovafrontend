import React, { useState, useEffect, useRef } from 'react';
import API_ROUTES from '../config/api';
import './VoiceRecorder.css';

const VoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const mediaRecorderRef = useRef(null);
  const websocketRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    // Inicializar WebSocket
    websocketRef.current = new WebSocket(API_ROUTES.WEBSOCKET_URL);

    websocketRef.current.onopen = () => {
      console.log('WebSocket conectado');
      setIsConnected(true);
    };

    websocketRef.current.onmessage = (event) => {
      const response = JSON.parse(event.data);
      if (response.audio) {
        // Convertir el audio base64 a URL
        const audioBlob = new Blob(
          [Uint8Array.from(atob(response.audio), c => c.charCodeAt(0))],
          { type: 'audio/wav' }
        );
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      }
      if (response.texto) {
        console.log('Respuesta del asistente:', response.texto);
      }
    };

    websocketRef.current.onerror = (error) => {
      console.error('Error en WebSocket:', error);
      setIsConnected(false);
    };

    websocketRef.current.onclose = () => {
      console.log('WebSocket desconectado');
      setIsConnected(false);
    };

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
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
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(audioBlob);
        }
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
      {audioUrl && (
        <div className="audio-player">
          <audio controls src={audioUrl} />
        </div>
      )}
      {!isConnected && (
        <div className="connection-status">
          Desconectado. Intentando reconectar...
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
