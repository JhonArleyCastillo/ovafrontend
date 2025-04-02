import React from 'react';
import PropTypes from 'prop-types';
import { ConnectionStatus } from './common';

/**
 * Componente para el encabezado del chat
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Título del chat
 * @param {boolean} props.isConnected - Estado de la conexión
 */
const ChatHeader = ({ title = 'Chat con IA', isConnected }) => {
  return (
    <div className="chat-header">
      <h2>{title}</h2>
      <ConnectionStatus isConnected={isConnected} />
    </div>
  );
};

ChatHeader.propTypes = {
  title: PropTypes.string,
  isConnected: PropTypes.bool.isRequired
};

export default ChatHeader; 