import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente que muestra el estado de la conexión
 * @param {boolean} isConnected - Indica si está conectado al servidor 
 */
const ConnectionStatus = ({ isConnected }) => (
  <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
    {isConnected ? 'Conectado' : 'Desconectado'}
  </span>
);

ConnectionStatus.propTypes = {
  isConnected: PropTypes.bool.isRequired
};

export default ConnectionStatus; 