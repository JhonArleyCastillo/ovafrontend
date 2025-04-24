import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente que muestra el estado de la conexión
 * @param {boolean} isConnected - Indica si está conectado al servidor 
 */
const ConnectionStatus = ({ isConnected }) => (
  <div className={`badge ${isConnected ? 'bg-success' : 'bg-danger'} d-flex align-items-center`}>
    <div className={`spinner-grow spinner-grow-sm me-1 ${isConnected ? '' : 'd-none'}`} role="status">
      <span className="visually-hidden">Conectando...</span>
    </div>
    {isConnected ? 'Conectado' : 'Desconectado'}
  </div>
);

ConnectionStatus.propTypes = {
  isConnected: PropTypes.bool.isRequired
};

export default ConnectionStatus;