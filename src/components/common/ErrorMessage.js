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
    <div className="alert alert-danger alert-dismissible fade show" role="alert">
      <i className="bi bi-exclamation-triangle me-2"></i>
      {message}
      {onDismiss && (
        <button 
          type="button" 
          className="btn-close" 
          onClick={onDismiss}
          aria-label="Close"
        ></button>
      )}
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.string,
  onDismiss: PropTypes.func
};

export default ErrorMessage;