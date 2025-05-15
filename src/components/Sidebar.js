import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const SidebarLinks = ({ onLinkClick, location, centered }) => (
  <ul className={`nav nav-pills flex-column mb-auto${centered ? ' align-items-center' : ''}`}>
    <li className="nav-item">
      <Link
        to="/"
        className={`nav-link text-white ${location.pathname === '/' ? 'active' : ''}`}
        onClick={onLinkClick}
      >
        <i className="bi bi-house-door me-2"></i>
        Inicio
      </Link>
    </li>
    <li>
      <Link
        to="/chat"
        className={`nav-link text-white ${location.pathname === '/chat' ? 'active' : ''}`}
        onClick={onLinkClick}
      >
        <i className="bi bi-chat-text me-2"></i>
        Chat
      </Link>
    </li>
    <li>
      <Link
        to="/about"
        className={`nav-link text-white ${location.pathname === '/about' ? 'active' : ''}`}
        onClick={onLinkClick}
      >
        <i className="bi bi-info-circle me-2"></i>
        Sobre Nosotros
      </Link>
    </li>
    <li>
      <Link
        to="/services"
        className={`nav-link text-white ${location.pathname === '/services' ? 'active' : ''}`}
        onClick={onLinkClick}
      >
        <i className="bi bi-gear me-2"></i>
        Servicios
      </Link>
    </li>
    <li>
      <Link
        to="/contact"
        className={`nav-link text-white ${location.pathname === '/contact' ? 'active' : ''}`}
        onClick={onLinkClick}
      >
        <i className="bi bi-envelope me-2"></i>
        Contacto
      </Link>
    </li>
  </ul>
);

const Sidebar = () => {
  const location = useLocation();
  return (
    <>
      {/* Botón hamburguesa para pantallas pequeñas */}
      <button
        className="btn btn-dark d-lg-none top-0 start-50 m-3"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#sidebarOffcanvas"
        aria-controls="sidebarOffcanvas"
        aria-label="Abrir menú"
        style={{ zIndex: 1051 }}
      >
        <i className="bi bi-list fs-1"></i>
      </button>

      {/* Sidebar fijo para escritorio */}
      <div
        className="d-none d-lg-flex flex-column flex-shrink-0 p-3 bg-dark text-white"
        style={{ width: '280px', height: '100vh', position: 'sticky', top: 0 }}
      >
        <div className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
          <i className="bi bi-chat-dots-fill fs-4 me-2"></i>
          <span className="fs-4">OVA</span>
        </div>
        <hr className="border-light" />
        <SidebarLinks location={location} />
        <hr className="border-light" />
      </div>

      {/* Sidebar Offcanvas Bootstrap para móvil, centrado verticalmente */}
      <div
        className="offcanvas offcanvas-start bg-dark text-white d-lg-none justify-content-center"
        tabIndex="-1"
        id="sidebarOffcanvas"
        aria-labelledby="sidebarOffcanvasLabel"
        style={{ width: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <div className="offcanvas-header justify-content-center">
          <Link to="/" className="d-flex align-items-center text-white text-decoration-none">
            <i className="bi bi-chat-dots-fill fs-4 me-2"></i>
            <span className="fs-4">OVA</span>
          </Link>
          <button
            type="button"
            className="btn-close btn-close-white ms-2"
            data-bs-dismiss="offcanvas"
            aria-label="Cerrar"
          ></button>
        </div>
        <hr className="border-light" />
        <div className="offcanvas-body p-0 d-flex flex-column justify-content-center align-items-center">
          <SidebarLinks location={location} centered onLinkClick={e => {
            // Cierra el offcanvas al hacer click en un link
            if (window.bootstrap) {
              const offcanvas = window.bootstrap.Offcanvas.getOrCreateInstance(document.getElementById('sidebarOffcanvas'));
              offcanvas.hide();
            }
          }} />
        </div>
        <hr className="border-light" />
      </div>
    </>
  );
};

export default Sidebar;