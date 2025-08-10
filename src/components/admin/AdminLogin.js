import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import { API_BASE_URL, API_BACKUP_URL } from '../../config/api.routes';
import Logger from '../../utils/debug-utils';

/**
 * Componente de inicio de sesión para administradores
 */
function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [serverStatus, setServerStatus] = useState({
    checking: true,
    available: false,
    message: 'Verificando conexión con el servidor...',
    bestServer: null,
    serverList: []
  });
  const navigate = useNavigate();

  // Verificar disponibilidad del servidor al cargar
  useEffect(() => {
    async function checkServerAvailability() {
      try {
        const serverList = AuthService.getServerList();
        // Verificar todos los servidores disponibles
        const apiAvailability = await AuthService.isApiAvailable(true);
        
        if (apiAvailability.isAvailable && apiAvailability.bestServer) {
          setServerStatus({
            checking: false,
            available: true,
            message: 'Servidor conectado correctamente',
            bestServer: apiAvailability.bestServer,
            serverList,
            details: apiAvailability.results
          });
        } else {
          // Realizar un diagnóstico completo si no hay servidor disponible
          const fullDiagnosis = await AuthService.diagnosisApiConnection();
          setDiagnosis(fullDiagnosis);
          
          setServerStatus({
            checking: false,
            available: false,
            message: 'No se pudo establecer conexión con ningún servidor. Consulte el diagnóstico para más detalles.',
            serverList,
            details: fullDiagnosis
          });
        }
      } catch (error) {
        setServerStatus({
          checking: false,
          available: false,
          message: `Error al verificar la disponibilidad del servidor: ${error.message}`,
          serverList: AuthService.getServerList()
        });
      }
    }
    
    checkServerAvailability();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Indicar que se quiere intentar con todos los servidores disponibles
      const options = { 
        tryAllServers: true,
        forceServerCheck: !serverStatus.available // Forzar verificación si no hay conexión
      };
      
      await AuthService.login(email, password, options);
      
      // Redireccionar al panel de administración
      navigate('/admin/dashboard');
    } catch (error) {
      if (error.type === 'network' || 
          error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') || 
          error.message.includes('Network request failed') ||
          error.message.includes('No se pudo conectar al servidor')) {
        
        // Ejecutar diagnóstico completo si hay un error de red
        const fullDiagnosis = await AuthService.diagnosisApiConnection();
        setDiagnosis(fullDiagnosis);
        setShowDiagnostics(true);
        
        setError(`Error de conexión: No se pudo contactar con ningún servidor. 
          Se ha realizado un diagnóstico completo de la red que puedes revisar más abajo.`);
        
        Logger.error('AdminLogin', `Error de conexión: ${error.message}`);
      } else if (error.type === 'authentication') {
        setError('Credenciales incorrectas. Por favor, verifica tu correo y contraseña.');
      } else if (error.type === 'server') {
        setError(`Error del servidor: ${error.message}. Por favor, inténtalo más tarde o contacta al administrador.`);
      } else {
        setError(error.message || 'Error al iniciar sesión. Verifique sus credenciales.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const runDiagnostic = async () => {
    setLoading(true);
    setShowDiagnostics(true);
    
    try {
      const fullDiagnosis = await AuthService.diagnosisApiConnection();
      setDiagnosis(fullDiagnosis);
      
      // Actualizar estado del servidor basado en el diagnóstico
      const isAvailable = fullDiagnosis.success;
      const bestServer = fullDiagnosis.diagnosis.servers.bestServer;
      
      setServerStatus(prevStatus => ({
        ...prevStatus,
        checking: false,
        available: isAvailable,
        message: isAvailable 
          ? `Conexión establecida con ${bestServer}`
          : 'No se pudo establecer conexión con ningún servidor',
        bestServer,
        details: fullDiagnosis
      }));
    } catch (error) {
      setError(`Error al realizar diagnóstico: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Renderizar resultados del diagnóstico
  const renderDiagnostics = () => {
    if (!diagnosis) return null;
    
    return (
      <div className="mt-4 border rounded p-3 bg-light">
        <h5 className="mb-3">Diagnóstico de conexión</h5>
        
        <div className="mb-3">
          <h6 className="text-muted">Servidores verificados:</h6>
          <ul className="list-group">
            {diagnosis.diagnosis.servers.checked.map((server, index) => {
              const result = diagnosis.diagnosis.servers.results[server] || {};
              const isAvailable = result.isAvailable;
              const responseTime = result.responseTime;
              
              return (
                <li key={index} className={`list-group-item ${isAvailable ? 'list-group-item-success' : 'list-group-item-danger'} d-flex justify-content-between align-items-center`}>
                  {server}
                  {isAvailable ? (
                    <span className="badge bg-success rounded-pill">{responseTime}ms</span>
                  ) : (
                    <span className="badge bg-danger rounded-pill">
                      {result.details?.errorType || 'Error'}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="mb-3">
          <h6 className="text-muted">Resolución DNS:</h6>
          <ul className="list-group">
            {Object.keys(diagnosis.diagnosis.dns).map((hostname, index) => {
              const result = diagnosis.diagnosis.dns[hostname];
              return (
                <li key={index} className={`list-group-item ${result.resolved ? 'list-group-item-success' : 'list-group-item-danger'}`}>
                  {hostname}: {result.resolved ? 'Resuelto correctamente' : `Error - ${result.reason || 'No resuelto'}`}
                </li>
              );
            })}
          </ul>
        </div>
        
        {Object.keys(diagnosis.diagnosis.ssl).length > 0 && (
          <div className="mb-3">
            <h6 className="text-muted">Certificados SSL:</h6>
            <ul className="list-group">
              {Object.keys(diagnosis.diagnosis.ssl).map((url, index) => {
                const result = diagnosis.diagnosis.ssl[url];
                return (
                  <li key={index} className={`list-group-item ${result.valid ? 'list-group-item-success' : 'list-group-item-danger'}`}>
                    {url}: {result.valid ? 'Certificado válido' : `Error - ${result.reason || 'Inválido'}`}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        
        <div className="mt-3">
          <h6 className="text-muted">Recomendaciones:</h6>
          <ul className="list-group">
            {!diagnosis.success && (
              <>
                <li className="list-group-item">
                  Verifica si el backend está ejecutándose correctamente en los servidores configurados.
                </li>
                <li className="list-group-item">
                  Comprueba la configuración de red y firewall en el servidor.
                </li>
                <li className="list-group-item">
                  Si estás en desarrollo local, asegúrate de que la API esté ejecutándose en localhost:8000.
                </li>
                <li className="list-group-item">
                  Verifica que el dominio api.ovaonline.tech esté resolviendo correctamente.
                </li>
                <li className="list-group-item">
                  Considera configurar variables de entorno REACT_APP_DEV_API_URL o REACT_APP_PROD_API_URL.
                </li>
              </>
            )}
            {diagnosis.success && (
              <li className="list-group-item list-group-item-success">
                ¡Conexión disponible! Se usará el servidor: {diagnosis.diagnosis.servers.bestServer}
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="card shadow-sm border-0 col-lg-6 col-md-8 col-sm-10 col-12">
        <div className="card-header bg-primary text-white text-center py-3">
          <h2 className="h4 mb-0">Inicio de sesión - Administración</h2>
        </div>

        <div className="card-body p-4">
          {/* Mostrar el estado del servidor */}
          {serverStatus.checking ? (
            <div className="alert alert-info d-flex align-items-center" role="alert">
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              <div>{serverStatus.message}</div>
            </div>
          ) : serverStatus.available ? (
            <div className="alert alert-success" role="alert">
              <i className="bi bi-check-circle-fill me-2"></i>
              {serverStatus.message}
              {serverStatus.bestServer && (
                <div className="small mt-1">Usando servidor: {serverStatus.bestServer}</div>
              )}
            </div>
          ) : (
            <div className="alert alert-warning" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {serverStatus.message}
              <div className="mt-2">
                <button 
                  className="btn btn-sm btn-outline-warning" 
                  onClick={runDiagnostic}
                  disabled={loading}
                >
                  Ejecutar diagnóstico completo
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-x-circle-fill me-2"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Correo electrónico:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="form-control"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">Contraseña:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="form-control"
              />
            </div>

            <div className="d-grid gap-2">
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || (serverStatus.checking && !serverStatus.available)}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {diagnosis ? 'Analizando conexión...' : 'Iniciando sesión...'}
                  </>
                ) : 'Iniciar sesión'}
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
            <Link to="/" className="text-decoration-none">Volver a la página principal</Link>
            
            {!showDiagnostics && !serverStatus.checking && (
              <div className="mt-2">
                <button 
                  className="btn btn-sm btn-link text-muted" 
                  onClick={() => setShowDiagnostics(true)}
                  type="button"
                >
                  Mostrar información de diagnóstico
                </button>
              </div>
            )}
          </div>
          
          {showDiagnostics && renderDiagnostics()}
          
          <div className="mt-4">
            <div className="small text-muted">
              <p>Información de configuración:</p>
              <ul className="mb-2">
                <li>Servidor principal: {API_BASE_URL}</li>
                {API_BACKUP_URL && API_BACKUP_URL !== API_BASE_URL && (
                  <li>Servidor de respaldo: {API_BACKUP_URL}</li>
                )}
                <li>Modo: {process.env.NODE_ENV || 'development'}</li>
              </ul>
              
              <p>Si encuentras problemas de conexión:</p>
              <ul>
                <li>Verifica tu conexión a internet</li>
                <li>Comprueba que la API esté activa</li>
                <li>Si estás en entorno de desarrollo, asegúrate de que el servidor local esté ejecutándose (localhost:8000)</li>
                <li>Verifica la configuración DNS de api.ovaonline.tech</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;