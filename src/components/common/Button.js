import React from 'react';
import PropTypes from 'prop-types';

const Button = ({ 
  onClick, 
  children, 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  icon
}) => {
  const buttonSize = {
    small: 'btn-sm',
    medium: '',
    large: 'btn-lg'
  }[size];

  return (
    <button
      type={type}
      className={`btn btn-${variant} ${buttonSize} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <span className="spinner-border spinner-border-sm me-2" role="status">
          <span className="visually-hidden">Cargando...</span>
        </span>
      )}
      {icon && <i className={`bi bi-${icon} ${children ? 'me-2' : ''}`}></i>}
      {children}
    </button>
  );
};

Button.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node,
  variant: PropTypes.oneOf([
    'primary', 'secondary', 'success', 'danger',
    'warning', 'info', 'light', 'dark', 'link',
    'outline-primary', 'outline-secondary', 'outline-success',
    'outline-danger', 'outline-warning', 'outline-info',
    'outline-light', 'outline-dark'
  ]),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
  icon: PropTypes.string
};

export default Button;