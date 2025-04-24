import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import ovalogo from './ovalogo.png'; // Importar el logo de OVA

// Componentes para las diferentes rutas
const HomePage = () => (
  <div className="container p-4">
    <h1>Bienvenido a OVA</h1>
    <p className="lead">Asistente Inteligente Multimodal - Su socio en soluciones de IA</p>
    
    {/* Hero section con descripción principal */}
    <div className="row mb-5">
      <div className="col-md-8">
        <div className="card border-0 bg-light">
          <div className="card-body">
            <h2>Transformando la interacción digital</h2>
            <p className="fs-5">OVA es una plataforma de asistencia virtual avanzada que combina tecnologías de procesamiento de lenguaje natural, reconocimiento de voz y análisis de imágenes para ofrecer una experiencia interactiva única.</p>
            <a href="/about" className="btn btn-primary mt-2">Conozca más sobre nosotros</a>
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
            <a href="/services" className="btn btn-outline-primary btn-sm">Más información</a>
          </div>
        </div>
      </div>
      <div className="col-md-6 mb-3">
        <div className="card h-100">
          <div className="card-body">
            <h5 className="card-title">Atención al Cliente</h5>
            <p className="card-text">Mejora la experiencia de tus clientes con respuestas rápidas y precisas a sus consultas.</p>
            <a href="/services" className="btn btn-outline-primary btn-sm">Más información</a>
          </div>
        </div>
      </div>
    </div>
    
    {/* Call to action */}
    <div className="row mt-5">
      <div className="col-12 text-center">
        <div className="card bg-primary text-white">
          <div className="card-body py-4">
            <h4>¿Listo para probar nuestro asistente inteligente?</h4>
            <p>Accede a nuestro chat y descubre el potencial de OVA</p>
            <a href="/chat" className="btn btn-light">Ir al Chat</a>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AboutPage = () => (
  <div className="container p-4">
    <h1>Sobre Nosotros</h1>
    <p>Somos un proyecto innovador que combina tecnologías de procesamiento de lenguaje natural, reconocimiento de voz y análisis de imágenes para crear un asistente virtual completo.</p>
  </div>
);

const ServicesPage = () => (
  <div className="container p-4">
    <h1>Nuestros Servicios</h1>
    <ul className="list-group">
      <li className="list-group-item">Asistente Virtual de Voz</li>
      <li className="list-group-item">Chat Inteligente</li>
      <li className="list-group-item">Análisis de Imágenes</li>
      <li className="list-group-item">Reconocimiento de Lenguaje de Señas</li>
    </ul>
  </div>
);

const ContactPage = () => (
  <div className="container p-4">
    <h1>Contacto</h1>
    <p>Para más información, por favor contáctenos:</p>
    <p>Email: info@ova.com</p>
    <p>Teléfono: +123 456 7890</p>
  </div>
);

const ChatPage = () => (
  <div className="flex-grow-1 d-flex flex-column overflow-hidden">
    <Chat />
  </div>
);

function App() {
  return (
    <Router>
      <div className="d-flex vh-100 overflow-hidden">
        <Sidebar />
        <main className="flex-grow-1 overflow-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
