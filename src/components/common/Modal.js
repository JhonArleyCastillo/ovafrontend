import React from 'react';
import PropTypes from 'prop-types';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'medium' 
}) => {
  const modalSize = {
    small: 'modal-sm',
    medium: '',
    large: 'modal-lg',
    extraLarge: 'modal-xl'
  }[size];

  if (!isOpen) return null;

  return (
    <div 
      className="modal fade show" 
      style={{ display: 'block' }} 
      tabIndex="-1"
      role="dialog"
    >
      <div className={`modal-dialog ${modalSize}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            {children}
          </div>
          {footer && (
            <div className="modal-footer">
              {footer}
            </div>
          )}
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'extraLarge'])
};

export default Modal;