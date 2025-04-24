import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Efecto para controlar la clase del body cuando el menú está abierto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    
    // Cleanup al desmontar el componente
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [isMenuOpen]);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  return (
    <>
      {/* Botón hamburguesa visible solo en pantallas pequeñas */}
      <div className="d-lg-none position-fixed top-0 start-0 p-3 z-index-1000">
        <button 
          className="navbar-toggler bg-dark text-white border-0" 
          type="button" 
          onClick={toggleMenu}
          aria-expanded={isMenuOpen ? 'true' : 'false'}
          aria-label="Toggle navigation"
        >
          <i className={`bi ${isMenuOpen ? 'bi-x' : 'bi-list'} fs-1`}></i>
        </button>
      </div>
      
      {/* Sidebar que se colapsa en pantallas pequeñas */}
      <div 
        className={`sidebar d-flex flex-column flex-shrink-0 p-3 bg-dark text-white ${isMenuOpen ? 'show' : ''}`}
        style={{
          width: '280px',
          height: '100vh',
          position: 'sticky',
          top: '0',
          transition: 'all 0.3s ease-in-out',
          transform: isMenuOpen ? 'translateX(0)' : '',
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <Link to="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
            <i className="bi bi-chat-dots-fill fs-4 me-2"></i>
            <span className="fs-4">OVA</span>
          </Link>
          <button 
            className="d-lg-none btn btn-link text-white p-0" 
            onClick={toggleMenu}
            aria-label="Close menu"
          >
            <i className="bi bi-x fs-4"></i>
          </button>
        </div>
        
        <hr className="border-light" />
        
        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item">
            <Link 
              to="/" 
              className={`nav-link text-white ${location.pathname === '/' ? 'active' : ''}`}
              onClick={() => window.innerWidth < 992 && setIsMenuOpen(false)}
            >
              <i className="bi bi-house-door me-2"></i>
              Inicio
            </Link>
          </li>
          <li>
            <Link 
              to="/chat" 
              className={`nav-link text-white ${location.pathname === '/chat' ? 'active' : ''}`}
              onClick={() => window.innerWidth < 992 && setIsMenuOpen(false)}
            >
              <i className="bi bi-chat-text me-2"></i>
              Chat
            </Link>
          </li>
          <li>
            <Link 
              to="/about" 
              className={`nav-link text-white ${location.pathname === '/about' ? 'active' : ''}`}
              onClick={() => window.innerWidth < 992 && setIsMenuOpen(false)}
            >
              <i className="bi bi-info-circle me-2"></i>
              Sobre Nosotros
            </Link>
          </li>
          <li>
            <Link 
              to="/services" 
              className={`nav-link text-white ${location.pathname === '/services' ? 'active' : ''}`}
              onClick={() => window.innerWidth < 992 && setIsMenuOpen(false)}
            >
              <i className="bi bi-gear me-2"></i>
              Servicios
            </Link>
          </li>
          <li>
            <Link 
              to="/contact" 
              className={`nav-link text-white ${location.pathname === '/contact' ? 'active' : ''}`}
              onClick={() => window.innerWidth < 992 && setIsMenuOpen(false)}
            >
              <i className="bi bi-envelope me-2"></i>
              Contacto
            </Link>
          </li>
        </ul>
        
        <hr className="border-light" />
        
        <div className="dropdown">
          <a href="#" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="https://github.com/mdo.png" alt="" width="32" height="32" className="rounded-circle me-2" />
            <strong>Usuario</strong>
          </a>
          <ul className="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
            <li><a className="dropdown-item" href="#">Perfil</a></li>
            <li><a className="dropdown-item" href="#">Configuración</a></li>
            <li><hr className="dropdown-divider" /></li>
            <li><a className="dropdown-item" href="#">Cerrar sesión</a></li>
          </ul>
        </div>
      </div>
      
      {/* Overlay para cerrar el menú al hacer clic fuera en pantallas pequeñas */}
      {isMenuOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark d-lg-none" 
          style={{ opacity: '0.5', zIndex: 999 }}
          onClick={toggleMenu}
        />
      )}
    </>
  );
};

export default Sidebar;