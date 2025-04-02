import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente de spinner de carga
 * @param {Object} props - Propiedades del componente
 * @param {string} [props.size] - Tamaño del spinner (small, medium, large)
 * @param {string} [props.color] - Color del spinner
 * @param {string} [props.text] - Texto a mostrar debajo del spinner
 */
const LoadingSpinner = ({ size = 'medium', color = '#1976D2', text = 'Cargando...' }) => {
  const spinnerStyle = {
    borderColor: `${color} transparent transparent transparent`
  };
  
  return (
    <div className={`loading-spinner-container ${size}`}>
      <div className="loading-spinner" style={spinnerStyle}></div>
      {text && <div className="loading-text">{text}</div>}
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.string,
  text: PropTypes.string
};

export default LoadingSpinner; 