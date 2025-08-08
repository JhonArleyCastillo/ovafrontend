import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Logger from '../utils/debug-utils';

/**
 * Componente para monitorear y mostrar el estado de conexión WebSocket
 * Proporciona información visual del estado de la conexión en tiempo real
 */
const WebSocketMonitor = ({ 
  wsConnection, 
  onReconnect, 
  showDetails = false, 
  position = 'bottom-right',
  className = ''
}) => {
  const [connectionState, setConnectionState] = useState('disconnected');
  const [lastError, setLastError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!wsConnection) return;

    // Actualizar estado de conexión
    const updateConnectionState = () => {
      if (wsConnection.getConnectionState) {
        const state = wsConnection.getConnectionState();
        setConnectionState(state);
        
        if (state === 'connected') {
          setLastError(null);
          setReconnectAttempts(0);
        }
      } else if (wsConnection.readyState) {
        // Fallback para WebSocket estándar
        switch (wsConnection.readyState) {
          case WebSocket.CONNECTING:
            setConnectionState('connecting');
            break;
          case WebSocket.OPEN:
            setConnectionState('connected');
            setLastError(null);
            setReconnectAttempts(0);
            break;
          case WebSocket.CLOSING:
          case WebSocket.CLOSED:
            setConnectionState('disconnected');
            break;
          default:
            setConnectionState('unknown');
        }
      }
    };

    // Monitorear cambios cada segundo
    const interval = setInterval(updateConnectionState, 1000);
    
    // Actualizar inmediatamente
    updateConnectionState();

    return () => clearInterval(interval);
  }, [wsConnection]);

  // Obtener información de estilo según el estado
  const getStatusInfo = () => {
    switch (connectionState) {
      case 'connected':
        return {
          color: 'success',
          icon: 'bi-wifi',
          text: 'Conectado',
          pulse: false
        };
      case 'connecting':
        return {
          color: 'warning',
          icon: 'bi-wifi',
          text: 'Conectando...',
          pulse: true
        };
      case 'reconnecting':
        return {
          color: 'info',
          icon: 'bi-arrow-clockwise',
          text: `Reconectando... (${reconnectAttempts})`,
          pulse: true
        };
      case 'failed':
        return {
          color: 'danger',
          icon: 'bi-wifi-off',
          text: 'Error de conexión',
          pulse: false
        };
      case 'disconnected':
      default:
        return {
          color: 'secondary',
          icon: 'bi-wifi-off',
          text: 'Desconectado',
          pulse: false
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Obtener clases de posición
  const getPositionClasses = () => {
    const baseClasses = 'position-fixed';
    switch (position) {
      case 'top-left':
        return `${baseClasses} top-0 start-0 m-3`;
      case 'top-right':
        return `${baseClasses} top-0 end-0 m-3`;
      case 'bottom-left':
        return `${baseClasses} bottom-0 start-0 m-3`;
      case 'bottom-right':
      default:
        return `${baseClasses} bottom-0 end-0 m-3`;
    }
  };

  // Manejar reconexión manual
  const handleReconnect = () => {
    Logger.info('WebSocketMonitor', 'Reconexión manual solicitada');
    setReconnectAttempts(prev => prev + 1);
    
    if (wsConnection && wsConnection.restart) {
      wsConnection.restart();
    } else if (onReconnect) {
      onReconnect();
    }
  };

  // Render compacto
  if (!showDetails && !isExpanded) {
    return (
      <div className={`${getPositionClasses()} ${className}`} style={{ zIndex: 1050 }}>
        <div 
          className={`badge bg-${statusInfo.color} d-flex align-items-center user-select-none`}
          style={{ cursor: 'pointer' }}
          onClick={() => setIsExpanded(true)}
          title={`Estado: ${statusInfo.text}${lastError ? ` | Error: ${lastError}` : ''}`}
        >
          <i className={`${statusInfo.icon} me-1 ${statusInfo.pulse ? 'spinner-grow spinner-grow-sm' : ''}`}></i>
          <span className="small">{statusInfo.text}</span>
        </div>
      </div>
    );
  }

  // Render expandido
  return (
    <div className={`${getPositionClasses()} ${className}`} style={{ zIndex: 1050 }}>
      <div className="card border-0 shadow-sm" style={{ minWidth: '250px' }}>
        <div className="card-header d-flex justify-content-between align-items-center py-2">
          <h6 className="card-title mb-0">
            <i className="bi bi-router me-2"></i>
            Estado de Conexión
          </h6>
          {!showDetails && (
            <button 
              className="btn-close btn-close-sm"
              onClick={() => setIsExpanded(false)}
              aria-label="Cerrar"
            ></button>
          )}
        </div>
        
        <div className="card-body py-2">
          {/* Estado principal */}
          <div className="d-flex align-items-center mb-2">
            <div className={`badge bg-${statusInfo.color} me-2`}>
              <i className={`${statusInfo.icon} ${statusInfo.pulse ? 'spinner-grow spinner-grow-sm' : ''}`}></i>
            </div>
            <span className="fw-medium">{statusInfo.text}</span>
          </div>

          {/* Información adicional */}
          {wsConnection && wsConnection.url && (
            <div className="small text-muted mb-2">
              <i className="bi bi-link-45deg me-1"></i>
              {wsConnection.url.replace(/^wss?:\/\//, '')}
            </div>
          )}

          {/* Error actual */}
          {lastError && (
            <div className="alert alert-danger alert-sm py-1 mb-2">
              <i className="bi bi-exclamation-triangle me-1"></i>
              <small>{lastError}</small>
            </div>
          )}

          {/* Intentos de reconexión */}
          {reconnectAttempts > 0 && (
            <div className="small text-info mb-2">
              <i className="bi bi-arrow-repeat me-1"></i>
              Intentos: {reconnectAttempts}
            </div>
          )}

          {/* Botones de acción */}
          <div className="d-flex gap-2">
            {connectionState !== 'connected' && connectionState !== 'connecting' && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={handleReconnect}
                disabled={connectionState === 'connecting'}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Reconectar
              </button>
            )}
            
            {connectionState === 'connected' && wsConnection && wsConnection.restart && (
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => wsConnection.restart()}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Reiniciar
              </button>
            )}
          </div>
        </div>

        {/* Información técnica en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="card-footer py-1">
            <details className="small">
              <summary className="text-muted user-select-none" style={{ cursor: 'pointer' }}>
                Info técnica
              </summary>
              <div className="mt-1">
                <div>ReadyState: {wsConnection?.readyState || 'N/A'}</div>
                <div>Estado: {connectionState}</div>
                {wsConnection?._manager && (
                  <div>Manager: Activo</div>
                )}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

WebSocketMonitor.propTypes = {
  wsConnection: PropTypes.object,
  onReconnect: PropTypes.func,
  showDetails: PropTypes.bool,
  position: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
  className: PropTypes.string
};

export default WebSocketMonitor;
