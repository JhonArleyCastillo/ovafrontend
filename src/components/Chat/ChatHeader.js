import React from 'react';
import PropTypes from 'prop-types';
import { ConnectionStatus } from '../common';

/**
 * Componente para el encabezado del chat
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Título del chat
 * @param {boolean} props.isConnected - Estado de la conexión
 * @param {boolean} props.autoPlayAudio - Indica si el audio se reproduce automáticamente
 * @param {function} props.onToggleAutoPlayAudio - Función para alternar la reproducción automática
 */
const ChatHeader = ({ 
  title = 'Chat Inteligente ASL', 
  isConnected, 
  autoPlayAudio = true, 
  onToggleAutoPlayAudio
}) => {
  return (
    <div className="d-flex justify-content-between align-items-center">
      <div className="d-flex align-items-center">
        <h5 className="mb-0 me-3">
          <i className="bi bi-translate me-2"></i>
          {title}
        </h5>
        <ConnectionStatus isConnected={isConnected} />
      </div>
      
      {/* Toggle para audio automático */}
      {onToggleAutoPlayAudio && (
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="autoPlaySwitch"
            checked={autoPlayAudio}
            onChange={onToggleAutoPlayAudio}
          />
          <label className="form-check-label" htmlFor="autoPlaySwitch">
            <i className={`bi ${autoPlayAudio ? 'bi-volume-up' : 'bi-volume-mute'} me-1`}></i>
            Audio automático
          </label>
        </div>
      )}
    </div>
  );
};

ChatHeader.propTypes = {
  title: PropTypes.string,
  isConnected: PropTypes.bool.isRequired,
  autoPlayAudio: PropTypes.bool,
  onToggleAutoPlayAudio: PropTypes.func
};

export default ChatHeader;