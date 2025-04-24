import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getAudioStream, createAudioRecorder } from '../../utils/media-utils';
import Logger from '../../utils/debug-utils';

/**
 * Componente para la entrada de texto del chat
 * @param {Object} props - Propiedades del componente
 * @param {function} props.onSendMessage - Función para enviar mensaje
 * @param {function} props.onImageUpload - Función para subir imagen
 * @param {function} props.onSignLanguageUpload - Función para procesar lenguaje de señas
 * @param {function} props.onAudioRecord - Función para enviar audio grabado
 * @param {boolean} props.isConnected - Estado de la conexión
 * @param {boolean} props.isTyping - Indica si el bot está escribiendo
 */
const ChatInput = ({ onSendMessage, onImageUpload, onSignLanguageUpload, onAudioRecord, isConnected, isTyping }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  
  const fileInputRef = useRef(null);
  const signLanguageInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // Verificar permiso de micrófono al inicio
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        // Solo verificamos, no grabamos todavía
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setAudioPermissionGranted(true);
      } catch (error) {
        Logger.warn('ChatInput', 'No hay permisos de micrófono', error);
        setAudioPermissionGranted(false);
      }
    };
    
    checkMicrophonePermission();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;
    
    onSendMessage(inputMessage);
    setInputMessage('');
  };

  // Detener la grabación y liberar recursos
  const stopMediaStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Iniciar grabación de audio
  const startRecording = async () => {
    try {
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
          onAudioRecord(audioBlob);
        } catch (err) {
          Logger.error('ChatInput', 'Error al procesar grabación', err);
        }
      };

      // Iniciar grabación
      mediaRecorder.start();
      setIsRecording(true);
      Logger.info('ChatInput', 'Grabación iniciada');
    } catch (err) {
      Logger.error('ChatInput', 'Error al iniciar grabación', err);
      setIsRecording(false);
    }
  };

  // Detener grabación de audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      stopMediaStream();
      setIsRecording(false);
      Logger.info('ChatInput', 'Grabación detenida');
    }
  };

  // Alternar entre iniciar/detener grabación
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <form onSubmit={handleSubmit} className='p-3 bg-light border-top'>
      <div className='input-group'>
        <input
          type='text'
          className='form-control'
          placeholder='Escribe un mensaje...'
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isTyping || isRecording}
        />
        <button
          type='button'
          className='btn btn-outline-secondary'
          onClick={() => fileInputRef.current?.click()}
          disabled={isRecording}
          title='Subir imagen'
        >
          <i className='bi bi-image'></i>
        </button>
        <button
          type='button'
          className='btn btn-outline-success'
          onClick={() => signLanguageInputRef.current?.click()}
          disabled={isRecording}
          title='Analizar lenguaje de señas'
        >
          <i className='bi bi-translate'></i>
        </button>
        <button
          type='button'
          className={`btn ${isRecording ? 'btn-danger' : 'btn-outline-secondary'}`}
          onClick={toggleRecording}
          disabled={!audioPermissionGranted || isTyping}
          title={isRecording ? 'Detener grabación' : 'Grabar mensaje de voz'}
        >
          <i className={`bi ${isRecording ? 'bi-stop-fill' : 'bi-mic-fill'}`}></i>
        </button>
        <button
          type='submit'
          className='btn btn-primary'
          disabled={!inputMessage.trim() || isTyping || isRecording}
          title='Enviar mensaje'
        >
          <i className='bi bi-send'></i>
        </button>
        <input
          type='file'
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0])}
          accept='image/*'
          className='d-none'
        />
        <input
          type='file'
          ref={signLanguageInputRef}
          onChange={(e) => e.target.files?.[0] && onSignLanguageUpload(e.target.files[0])}
          accept='.jpg,.jpeg,.png,.webp,image/jpeg,image/jpg,image/png,image/webp'
          className='d-none'
        />
      </div>
      {isRecording && (
        <div className='text-center mt-2'>
          <span className='badge bg-danger'>
            <i className='bi bi-record-circle me-1'></i> Grabando...
          </span>
        </div>
      )}
    </form>
  );
};

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  onImageUpload: PropTypes.func.isRequired,
  onSignLanguageUpload: PropTypes.func,
  onAudioRecord: PropTypes.func,
  isConnected: PropTypes.bool.isRequired,
  isTyping: PropTypes.bool.isRequired
};

ChatInput.defaultProps = {
  onAudioRecord: () => {},
  onSignLanguageUpload: () => {}
};

export default ChatInput;