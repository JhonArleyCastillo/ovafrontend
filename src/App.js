import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import VoiceRecorder from './components/VoiceRecorder';
import ImageUploader from './components/ImageUploader';
import ImageResult from './components/ImageResult';
import DebugMonitor from './components/DebugMonitor';
import { Logger } from './utils';
import './App.css';
// Importar la utilidad de diagnóstico
import './utils/connection-test';

// Nombre del componente para los logs
const COMPONENT_NAME = 'App';

// Componentes de la landing page
const Home = () => (
  <div className="page-container">
    <div className="hero-section">
      <h1>Asistente Inteligente Multimodal</h1>
      <p>Interactúa con tu asistente a través de voz e imágenes</p>
    </div>
    <div className="features-grid">
      <Link to="/asistente-voz" className="feature-card">
        <span className="feature-icon">🎙️</span>
        <h3>Interacción por Voz</h3>
        <p>Comunícate naturalmente con tu asistente</p>
      </Link>
      <Link to="/asistente-imagen" className="feature-card">
        <span className="feature-icon">📷</span>
        <h3>Análisis de Imágenes</h3>
        <p>Analiza y comprende imágenes en tiempo real</p>
      </Link>
      <Link to="/asistente-chat" className="feature-card">
        <span className="feature-icon">💬</span>
        <h3>Chat Inteligente</h3>
        <p>Conversaciones naturales y contextuales</p>
      </Link>
    </div>
  </div>
);

// Componentes de los asistentes
const AsistenteVoz = () => (
  <div className="assistant-container">
    <h1>Asistente por Voz</h1>
    <div className="assistant-content">
      <VoiceRecorder />
      <Chat />
    </div>
  </div>
);

const AsistenteImagen = () => {
  const [imageResult, setImageResult] = useState(null);
  
  return (
    <div className="assistant-container">
      <h1>Asistente por Imágenes</h1>
      <div className="assistant-content">
        <ImageUploader onResult={setImageResult} />
        <ImageResult result={imageResult} />
      </div>
    </div>
  );
};

const AsistenteChat = () => (
  <div className="assistant-container">
    <h1>Asistente por Chat</h1>
    <div className="assistant-content">
      <Chat />
    </div>
  </div>
);

const About = () => (
  <div className="page-container">
    <h1>Sobre Nosotros</h1>
    <div className="about-content">
      <p>Somos un equipo apasionado por la inteligencia artificial y la innovación tecnológica.</p>
      <p>Nuestra misión es hacer la tecnología más accesible y útil para todos.</p>
    </div>
  </div>
);

const Services = () => (
  <div className="page-container">
    <h1>Nuestros Servicios</h1>
    <div className="services-grid">
      <div className="service-card">
        <h3>Asistente Virtual</h3>
        <p>Interacción natural a través de voz y texto</p>
      </div>
      <div className="service-card">
        <h3>Análisis de Imágenes</h3>
        <p>Reconocimiento y análisis de imágenes en tiempo real</p>
      </div>
      <div className="service-card">
        <h3>Chat Inteligente</h3>
        <p>Conversaciones contextuales y personalizadas</p>
      </div>
    </div>
  </div>
);

const Contact = () => (
  <div className="page-container">
    <h1>Contacto</h1>
    <div className="contact-form">
      <form>
        <div className="form-group">
          <label htmlFor="name">Nombre</label>
          <input type="text" id="name" name="name" />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" />
        </div>
        <div className="form-group">
          <label htmlFor="message">Mensaje</label>
          <textarea id="message" name="message"></textarea>
        </div>
        <button type="submit">Enviar Mensaje</button>
      </form>
    </div>
  </div>
);

function App() {
  const [appState, setAppState] = useState({
    initialized: false,
    route: window.location.pathname
  });
  
  // Registrar información de inicialización
  useEffect(() => {
    Logger.info(COMPONENT_NAME, 'Aplicación inicializada', {
      env: process.env.NODE_ENV,
      backendUrl: process.env.REACT_APP_BACKEND_URL || 'https://api.ovaonline.tech'
    });
    
    setAppState(prev => ({
      ...prev,
      initialized: true
    }));
    
    // Registrar cambios de ruta
    const handleRouteChange = () => {
      const newRoute = window.location.pathname;
      Logger.debug(COMPONENT_NAME, `Cambio de ruta: ${newRoute}`);
      setAppState(prev => ({ ...prev, route: newRoute }));
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    // Añadir mensaje en consola sobre la utilidad de diagnóstico
    if (process.env.NODE_ENV === 'production') {
      console.info(
        '%c🔍 Herramienta de diagnóstico disponible',
        'background: #4CAF50; color: white; padding: 5px; border-radius: 3px; font-weight: bold;'
      );
      console.info(
        '%cPara diagnosticar problemas de conexión, ejecuta en la consola: %ctestConnection()',
        'color: #333; font-size: 14px;',
        'color: #1976D2; font-weight: bold; font-size: 14px;'
      );
    }
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      Logger.info(COMPONENT_NAME, 'Aplicación desmontada');
    };
  }, []);

  return (
    <Router>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/asistente-voz" element={<AsistenteVoz />} />
            <Route path="/asistente-imagen" element={<AsistenteImagen />} />
            <Route path="/asistente-chat" element={<AsistenteChat />} />
          </Routes>
        </main>
        
        {/* DebugMonitor solo se muestra en desarrollo */}
        {process.env.NODE_ENV !== 'production' && (
          <DebugMonitor 
            isVisible={false} 
            title="Monitor de Depuración"
            states={{ ...appState, timestamp: new Date().toLocaleTimeString() }}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
