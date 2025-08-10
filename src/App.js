import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import { ovalogo } from './images'; // Importar el logo de OVA desde el índice de imágenes
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import PrivateRoute from './components/admin/PrivateRoute';
import AboutUsSection from './components/AboutUsSection';
import ServicesSection from './components/ServicesSection';
import Diagnostics from './components/Diagnostics';
import DatabaseService from './services/database.service';
import useDayNightTheme from './hooks/useDayNightTheme';
// Outlet import consolidado arriba

// Componentes para las diferentes rutas
const HomePage = () => (
  <div className="container p-4">
    <h1>Bienvenido a HelpOVA</h1>
    <p className="lead">Asistente Inteligente Multimodal - Su socio en soluciones de IA</p>
    
    {/* Hero section con descripción principal */}
    <div className="row mb-5">
      <div className="col-md-8">
  <div className="card border-0 bg-theme-secondary">
          <div className="card-body">
            <h2>Transformando la interacción digital</h2>
            <p className="fs-5">OVA es una plataforma de asistencia virtual avanzada que combina tecnologías de procesamiento de lenguaje natural, reconocimiento de voz y análisis de imágenes para ofrecer una experiencia interactiva única.</p>
            <Link to="/about" className="btn btn-primary mt-2">Conozca más sobre nosotros</Link>
          </div>
        </div>
      </div>
      <div className="col-md-4 d-flex justify-content-center align-items-center">
        <img src={ovalogo} alt="OVA Assistant" className="img-fluid rounded shadow" style={{ maxHeight: '250px' }} />
      </div>
    </div>
    
    {/* Sección de características */}
    <h3 className="mb-4">¿Qué hace único a OVA?</h3>
    <div className="row mb-5">
      <div className="col-md-4 mb-3">
        <div className="card h-100">
          <div className="card-body">
            <div className="text-center mb-3">
              <i className="bi bi-chat-dots text-primary" style={{ fontSize: '2rem' }}></i>
            </div>
            <h5 className="card-title text-center">Inteligencia Conversacional</h5>
            <p className="card-text">Nuestra IA entiende el contexto y mantiene conversaciones naturales y fluidas.</p>
          </div>
        </div>
      </div>
      <div className="col-md-4 mb-3">
        <div className="card h-100">
          <div className="card-body">
            <div className="text-center mb-3">
              <i className="bi bi-camera text-primary" style={{ fontSize: '2rem' }}></i>
            </div>
            <h5 className="card-title text-center">Análisis Visual</h5>
            <p className="card-text">Procesamos y analizamos imágenes para reconocer objetos, personas y lenguaje de señas.</p>
          </div>
        </div>
      </div>
      <div className="col-md-4 mb-3">
        <div className="card h-100">
          <div className="card-body">
            <div className="text-center mb-3">
              <i className="bi bi-mic text-primary" style={{ fontSize: '2rem' }}></i>
            </div>
            <h5 className="card-title text-center">Reconocimiento de Voz</h5>
            <p className="card-text">Interactúa mediante comandos de voz con respuestas precisas y naturales.</p>
          </div>
        </div>
      </div>
    </div>
    
    {/* Sección de casos de uso */}
    <h3 className="mb-4">Soluciones para diversos sectores</h3>
    <div className="row mb-4">
      <div className="col-md-6 mb-3">
        <div className="card h-100">
          <div className="card-body">
            <h5 className="card-title">Educación</h5>
            <p className="card-text">Facilitamos el aprendizaje mediante asistentes virtuales personalizados para estudiantes y profesores.</p>
            <Link to="/services" className="btn btn-outline-primary btn-sm">Más información</Link>
          </div>
        </div>
      </div>
      <div className="col-md-6 mb-3">
        <div className="card h-100">
          <div className="card-body">
            <h5 className="card-title">Atención al Cliente</h5>
            <p className="card-text">Mejora la experiencia de tus clientes con respuestas rápidas y precisas a sus consultas.</p>
            <Link to="/services" className="btn btn-outline-primary btn-sm">Más información</Link>
          </div>
        </div>
      </div>
    </div>
    
    {/* Call to action */}
    <div className="row mt-5">
      <div className="col-12 text-center">
  <div className="card bg-theme-tertiary text-primary-theme">
          <div className="card-body py-4">
            <h4>¿Listo para probar nuestro asistente inteligente?</h4>
            <p>Accede a nuestro chat y descubre el potencial de OVA</p>
            <Link to="/chat" className="btn btn-light">Ir al Chat</Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AboutPage = () => (
  <AboutUsSection />
);

const ServicesPage = () => (
  <ServicesSection />
);

const ContactPage = () => {
  const [formData, setFormData] = React.useState({
    nombre: '',
    apellido: '',
    asunto: '',
    message: '',
    contactInfo: ''
  });
  const [submitted, setSubmitted] = React.useState(false);
  const [errors, setErrors] = React.useState({
    nombre: '',
    apellido: '',
    asunto: '',
    message: '',
    contactInfo: ''
  });

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Limpiar errores cuando el usuario comienza a escribir
    setErrors(prevState => ({
      ...prevState,
      [name]: ''
    }));

    // Validaciones en vivo
    if (['nombre','apellido','asunto','message'].includes(name) && value.trim() === '') {
      setErrors(prev => ({ ...prev, [name]: `El campo ${name} no puede estar vacío` }));
    }
    if (name === 'contactInfo' && value.trim() !== '' && !validateEmail(value)) {
      setErrors(prevState => ({
        ...prevState,
        contactInfo: 'Por favor ingresa un correo electrónico válido (ejemplo: usuario@dominio.com)'
      }));
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { nombre:'', apellido:'', asunto:'', message:'', contactInfo:'' };
    
    // Validar campos vacíos
    ['nombre','apellido','asunto','message','contactInfo'].forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = `Por favor ingresa ${field}`;
        valid = false;
      }
    });
    // Largo mínimo del mensaje
    if (formData.message.trim().length < 10) {
      newErrors.message = 'Tu mensaje es muy corto, por favor sé más específico';
      valid = false;
    }
    // Validar email
    if (formData.contactInfo && !validateEmail(formData.contactInfo)) {
      newErrors.contactInfo = 'Por favor ingresa un correo electrónico válido';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Enviar datos al backend
      DatabaseService.sendContacto({
        nombre: formData.nombre,
        apellido: formData.apellido,
        asunto: formData.asunto,
        mensaje: formData.message,
        email: formData.contactInfo
      })
      .then(() => {
        setSubmitted(true);
        setFormData({ nombre:'', apellido:'', asunto:'', message:'', contactInfo:'' });
        setErrors({ nombre:'', apellido:'', asunto:'', message:'', contactInfo:'' });
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error(err);
        // Mostrar error general
        alert(err.message || 'Error al enviar el mensaje');
      });
    }
  };

  return (
    <div className="container p-4">
      <h1>Contáctenos</h1>
      <div className="row">
        <div className="col-md-8 mx-auto">
          {submitted ? (
            <div className="alert alert-success" role="alert">
              <h4 className="alert-heading">¡Gracias por contactarnos!</h4>
              <p>Hemos recibido tu mensaje. Nos pondremos en contacto contigo pronto.</p>
              <hr />
              <button 
                className="btn btn-outline-success btn-sm" 
                onClick={() => setSubmitted(false)}
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <p className="lead mb-4">Completa el formulario a continuación para enviarnos tu consulta o solicitud. Nos pondremos en contacto contigo lo antes posible.</p>
                
                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-4">
                    <label htmlFor="nombre" className="form-label">Nombre:</label>
                    <input 
                      type="text" 
                      className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                      id="nombre" 
                      name="nombre" 
                      value={formData.nombre}
                      onChange={handleChange}
                      placeholder="Tu nombre"
                      required
                    />
                    {errors.nombre && (
                      <div className="invalid-feedback">
                        {errors.nombre}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="apellido" className="form-label">Apellido:</label>
                    <input 
                      type="text" 
                      className={`form-control ${errors.apellido ? 'is-invalid' : ''}`}
                      id="apellido" 
                      name="apellido" 
                      value={formData.apellido}
                      onChange={handleChange}
                      placeholder="Tu apellido"
                      required
                    />
                    {errors.apellido && (
                      <div className="invalid-feedback">
                        {errors.apellido}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="asunto" className="form-label">Asunto:</label>
                    <input 
                      type="text" 
                      className={`form-control ${errors.asunto ? 'is-invalid' : ''}`}
                      id="asunto" 
                      name="asunto" 
                      value={formData.asunto}
                      onChange={handleChange}
                      placeholder="Asunto de tu mensaje"
                      required
                    />
                    {errors.asunto && (
                      <div className="invalid-feedback">
                        {errors.asunto}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="message" className="form-label">Tu solicitud o consulta:</label>
                    <textarea 
                      className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                      id="message" 
                      name="message" 
                      rows="5" 
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Escribe aquí tu mensaje..."
                      required
                    ></textarea>
                    {errors.message && (
                      <div className="invalid-feedback">
                        {errors.message}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="contactInfo" className="form-label">Correo electrónico:</label>
                    <input 
                      type="email" 
                      className={`form-control ${errors.contactInfo ? 'is-invalid' : ''}`}
                      id="contactInfo" 
                      name="contactInfo" 
                      value={formData.contactInfo}
                      onChange={handleChange}
                      placeholder="ejemplo@dominio.com"
                      required
                    />
                    {errors.contactInfo && (
                      <div className="invalid-feedback">
                        {errors.contactInfo}
                      </div>
                    )}
                  </div>
                  
                  <div className="d-grid">
                    <button type="submit" className="btn btn-primary">
                      Enviar mensaje
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          <div className="card mt-4 border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="card-title">Información de contacto</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="bi bi-envelope me-2"></i>
                  Email: info@ova.com
                </li>
                <li className="mb-2">
                  <i className="bi bi-telephone me-2"></i>
                  Teléfono: +573204578232
                </li>
                <li>
                  <i className="bi bi-geo-alt me-2"></i>
                  Dirección: Calle 4 con carrera 25a#34 , Popayan, Colombia
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ChatPage eliminado: no se utiliza

// Layout principal con Sidebar
const MainLayout = () => (
  <div className="d-flex flex-column flex-lg-row min-vh-100">
    <Sidebar />
    <main className="flex-grow-1 px-3">
      <Outlet /> {/* Aquí se renderizarán las rutas hijas */}
    </main>
  </div>
);

function App() {
  // Inicializar el tema día/noche automático
  // Ejecuta el hook por sus efectos (clase en <html>); no necesitamos sus valores aquí
  useDayNightTheme();
  const [messages, setMessages] = useState([]);  // Control global de mensajes
  const wsRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const backoff = useRef(5000); // 5s inicial
  const isDev = process.env.NODE_ENV !== 'production';

  // Conexión y reconexión controlada
  /* eslint-disable no-console */
  const connectWebSocket = useCallback(() => {
    if (!isDev) {
      // eslint-disable-next-line no-console
      console.info('ℹ️ WebSocket local deshabilitado en producción (se usa conexión robusta dentro de Chat).');
      return;
    }
    wsRef.current = new WebSocket('ws://localhost:8000/api/chat');
  // eslint-disable-next-line no-console
  console.log('🔗 Intentando conectar WebSocket (DEV local)...');

    wsRef.current.onopen = () => {
      // eslint-disable-next-line no-console
      console.log('✅ WebSocket conectado');
      backoff.current = 5000; // Reset backoff
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, data]);
      } catch (e) {
  // eslint-disable-next-line no-console
        console.warn('Mensaje no JSON:', event.data);
      }
    };

    wsRef.current.onclose = (e) => {
      // eslint-disable-next-line no-console
      console.warn('⚠️ WebSocket cerrado. Intentando reconectar en', backoff.current / 1000, 's...', e);
      reconnectTimeout.current = setTimeout(() => {
        backoff.current = Math.min(backoff.current * 2, 30000); // Exponencial hasta 30s
        connectWebSocket();
      }, backoff.current);
    };

    wsRef.current.onerror = (e) => {
      // eslint-disable-next-line no-console
      console.error('❌ WebSocket error:', e);
      wsRef.current.close();
    };
  }, [isDev]);
  /* eslint-enable no-console */

  useEffect(() => {
    if (isDev) connectWebSocket();
    return () => {
  // eslint-disable-next-line no-console
  console.log('🧹 Limpiando WebSocket al desmontar');
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connectWebSocket, isDev]);

  return (
    <Router>
      <Routes>
        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        } />
  {/* Diagnostics route */}
  <Route path="/diagnostics" element={<Diagnostics />} />
        
        {/* Public routes with Sidebar */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="chat" element={<Chat messages={messages} setMessages={setMessages} socket={isDev ? wsRef.current : null} />} />
        </Route>

        {/* Catch-all for 404 */}
        <Route path="*" element={<div>404 - Página no encontrada</div>} />
      </Routes>
    </Router>
  );
}

export default App;
