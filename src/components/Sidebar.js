import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>OVA</h1>
      </div>
      <nav>
        <ul>
          <li>
            <Link to="/">
              <span className="icon">🏠</span>
              <span className="text">Inicio</span>
            </Link>
          </li>
          <li>
            <Link to="/about">
              <span className="icon">👥</span>
              <span className="text">Sobre Nosotros</span>
            </Link>
          </li>
          <li>
            <Link to="/services">
              <span className="icon">⚡</span>
              <span className="text">Servicios</span>
            </Link>
          </li>
          <li>
            <Link to="/contact">
              <span className="icon">📧</span>
              <span className="text">Contacto</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar; 