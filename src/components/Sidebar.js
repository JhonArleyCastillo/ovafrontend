import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setIsSearchActive(true);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Helpova Assistant</h1>
        <div className={`search-container ${isSearchActive ? 'active' : ''}`}>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => setIsSearchActive(true)}
            onBlur={() => setIsSearchActive(false)}
          />
        </div>
      </div>

      <div className="nav-section">
        <h2>Descripción</h2>
        <p>
                    Helpova Assistant es un asistente inteligente multimodal que combina 
                    capacidades de procesamiento de voz y análisis de imágenes. 
                    Permite interactuar mediante comandos de voz y proporciona 
                    descripciones detalladas de imágenes subidas por el usuario.
        </p>
      </div>

      <div className="nav-section">
        <h2>Team</h2>
        <div className="team-member">
          <img 
            src="/path-to-your-photo.jpg" 
            alt="Desarrollador" 
            className="team-photo"
          />
          <h3>Nombre del Desarrollador</h3>
          <p>Desarrollador Full Stack</p>
          <a 
            href="/path-to-cv.pdf" 
            target="_blank" 
            rel="noopener noreferrer"
            className="cv-link"
          >
                        Ver CV
          </a>
        </div>
      </div>

      <div className="nav-section">
        <h2>Playground</h2>
        <Link to="/playground" className="nav-link">
                    🎮 Ir al Playground
        </Link>
        <p className="playground-description">
                    Prueba el asistente de voz y el análisis de imágenes en tiempo real.
        </p>
      </div>
    </div>
  );
};

export default Sidebar; 