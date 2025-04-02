import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente que muestra un indicador de "escribiendo..."
 * @param {Object} props - Propiedades del componente 
 * @param {string} [props.text] - Texto alternativo
 * @param {string} [props.className] - Clase CSS adicional
 */
const TypingIndicator = ({ text = 'Escribiendo...', className = '' }) => {
  return (
    <div className={`bot-message typing ${className}`}>
      {text}
      <span className="dot">.</span>
      <span className="dot">.</span>
      <span className="dot">.</span>
    </div>
  );
};

TypingIndicator.propTypes = {
  text: PropTypes.string,
  className: PropTypes.string
};

export default TypingIndicator; 