import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import VoiceRecorder from './components/VoiceRecorder';
import SignLanguageUploader from './components/SignLanguageUploader';
import DebugMonitor from './components/DebugMonitor';
import Logger from './utils/debug-utils';
import './App.css';
// Importar la utilidad de diagnóstico
import './utils/connection-test';

// Nombre del componente para los logs
const COMPONENT_NAME = 'App';

// Componentes de la landing page
const Home = () => {
  // useEffect para hacer scroll al top del contenedor principal
  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, []); // El array vacío asegura que se ejecute solo al montar el componente

  return (
    <div className="home-container">
      <h1>Bienvenido al Asistente Virtual</h1>
      <div className="home-content">
        <VoiceRecorder />
        <SignLanguageUploader />
        <Chat />
      </div>
    </div>
  );
};

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
        <h3>Asistente Virtual por Voz</h3>
        <p>Interactúa naturalmente con nuestro asistente mediante comandos de voz. Graba mensajes de voz y recibe respuestas tanto en audio como en texto, permitiendo una comunicación fluida y accesible.</p>
      </div>
      <div className="service-card">
        <h3>Intérprete de Lenguaje de Señas</h3>
        <p>Sube imágenes de lenguaje de señas y obtén interpretaciones instantáneas. Nuestro sistema de IA analiza las señas y proporciona traducciones precisas con niveles de confianza.</p>
      </div>
      <div className="service-card">
        <h3>Chat Inteligente</h3>
        <p>Comunícate por texto con nuestro asistente virtual. Envía mensajes, imágenes y recibe respuestas contextuales. Ideal para consultas rápidas y soporte continuo.</p>
      </div>
      <div className="service-card">
        <h3>Accesibilidad Universal</h3>
        <p>Diseñado para ser accesible a todos los usuarios, independientemente de sus capacidades. Interfaz adaptativa que soporta múltiples formas de interacción: voz, texto e imágenes.</p>
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
