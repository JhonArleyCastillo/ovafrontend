import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente para mostrar mensajes de error
 * @param {Object} props - Propiedades del componente
 * @param {string} props.message - Mensaje de error a mostrar
 * @param {function} [props.onDismiss] - Función para cerrar el mensaje
 */
const ErrorMessage = ({ message, onDismiss }) => {
  if (!message) return null;
  
  return (
    <div className="error-message">
      <span className="error-text">{message}</span>
      {onDismiss && (
        <button className="dismiss-error" onClick={onDismiss}>
          ✕
        </button>
      )}
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.string,
  onDismiss: PropTypes.func
};

export default ErrorMessage; 