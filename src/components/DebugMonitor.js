import React, { useState, useEffect } from 'react';
import { Logger } from '../utils/debug-utils';

// Estilos inline para el monitor
const styles = {
  container: {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    width: '300px',
    maxHeight: '400px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: '12px',
    padding: '10px',
    borderRadius: '5px',
    zIndex: 9999,
    overflow: 'auto',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px',
    borderBottom: '1px solid #444',
    paddingBottom: '5px',
  },
  title: {
    margin: 0,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: 'transparent',
    border: '1px solid #666',
    color: '#FFF',
    cursor: 'pointer',
    borderRadius: '3px',
    padding: '2px 5px',
  },
  logEntry: {
    margin: '5px 0',
    borderBottom: '1px dashed #333',
    paddingBottom: '5px',
  },
  timestamp: {
    color: '#888',
    fontSize: '10px',
  },
  logLevel: {
    fontWeight: 'bold',
    padding: '2px 4px',
    borderRadius: '3px',
    marginRight: '5px',
  },
  debugLevel: {
    backgroundColor: '#444',
  },
  infoLevel: {
    backgroundColor: '#2196F3',
  },
  warnLevel: {
    backgroundColor: '#FF9800',
  },
  errorLevel: {
    backgroundColor: '#F44336',
  },
  message: {
    wordBreak: 'break-word',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: '5px',
  },
  statusOnline: {
    backgroundColor: '#4CAF50',
  },
  statusOffline: {
    backgroundColor: '#F44336',
  },
};

/**
 * Monitor de depuración para mostrar en la interfaz
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isVisible - Si el monitor debe ser visible
 * @param {Object} props.states - Estados de la aplicación para mostrar
 * @param {string} props.title - Título del monitor
 */
const DebugMonitor = ({ isVisible = false, states = {}, title = 'Debug Monitor' }) => {
  const [visible, setVisible] = useState(isVisible);
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const maxLogs = 50;

  // useEffect ahora se llama incondicionalmente, pero su contenido puede estar condicionado
  useEffect(() => {
    // Solo ejecutar la lógica en entorno de desarrollo
    if (process.env.NODE_ENV !== 'production') {
      // Función para interceptar console.log y otros
      const intercept = (method, level) => {
        const originalMethod = console[method];
        console[method] = (...args) => {
          // Llamar al método original
          originalMethod.apply(console, args);
          
          // Añadir a nuestros logs
          const logEntry = {
            timestamp: new Date(),
            level,
            message: args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' '),
          };
          
          setLogs(prevLogs => {
            const newLogs = [logEntry, ...prevLogs];
            // Limitar la cantidad de logs
            return newLogs.slice(0, maxLogs);
          });
        };
        
        // Devolver una función para restaurar el comportamiento original
        return () => {
          console[method] = originalMethod;
        };
      };
      
      // Interceptar diferentes niveles de log
      const restoreDebug = intercept('log', 'debug');
      const restoreInfo = intercept('info', 'info');
      const restoreWarn = intercept('warn', 'warn');
      const restoreError = intercept('error', 'error');
      
      // Monitorear el estado de conexión del WebSocket principal
      const monitorConnection = () => {
        try {
          // Verificar si hay un WebSocket global
          const ws = window._debugWs;
          if (ws) {
            setIsConnected(ws.readyState === WebSocket.OPEN);
          }
        } catch (error) {
          // Ignorar errores
        }
        
        // Verificar cada segundo
        setTimeout(monitorConnection, 1000);
      };
      
      monitorConnection();
      
      // Cleanup
      return () => {
        restoreDebug();
        restoreInfo();
        restoreWarn();
        restoreError();
      };
    }
    
    // Si estamos en producción, devolvemos una función de limpieza vacía
    return () => {};
  }, [maxLogs]);

  // Renderizado condicional basado en visible, no afecta a los hooks
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  if (!visible) {
    return (
      <button 
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: '#FFF',
          border: 'none',
          borderRadius: '5px',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
        onClick={() => setVisible(true)}
      >
        Mostrar Debug
      </button>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h4 style={styles.title}>
          <span 
            style={{
              ...styles.statusDot, 
              ...(isConnected ? styles.statusOnline : styles.statusOffline)
            }}
          ></span>
          {title}
        </h4>
        <div>
          <button 
            style={styles.button} 
            onClick={() => setLogs([])}
            title="Limpiar logs"
          >
            Limpiar
          </button>
          <button 
            style={styles.button} 
            onClick={() => setVisible(false)}
            title="Cerrar monitor"
          >
            X
          </button>
        </div>
      </div>
      
      {/* Estados */}
      <div style={{ marginBottom: '10px' }}>
        {Object.entries(states).map(([key, value]) => (
          <div key={key} style={{ fontSize: '11px', marginBottom: '3px' }}>
            <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </div>
        ))}
      </div>
      
      {/* Logs */}
      <div>
        {logs.map((log, index) => (
          <div key={index} style={styles.logEntry}>
            <div style={styles.timestamp}>
              {log.timestamp.toLocaleTimeString()}
            </div>
            <div>
              <span 
                style={{
                  ...styles.logLevel,
                  ...(log.level === 'debug' ? styles.debugLevel : 
                    log.level === 'info' ? styles.infoLevel :
                      log.level === 'warn' ? styles.warnLevel : 
                        styles.errorLevel)
                }}
              >
                {log.level.toUpperCase()}
              </span>
              <span style={styles.message}>{log.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugMonitor; 