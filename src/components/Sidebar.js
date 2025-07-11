import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useDayNightTheme from '../hooks/useDayNightTheme';

// Componente para el selector de tema
const ThemeSelector = () => {
  const { theme, setTheme, isAutoMode, getThemeInfo } = useDayNightTheme();
  const [showSelector, setShowSelector] = useState(false);
  
  const themeInfo = getThemeInfo();
  
  const themeOptions = [
    { value: 'auto', label: '🌓 Automático', description: 'Día/Noche automático' },
    { value: 'light', label: '☀️ Claro', description: 'Tema día' },
    { value: 'dark', label: '🌙 Oscuro', description: 'Tema noche' }
  ];
  
  return (
    <div className="theme-selector">
      <button 
        className="theme-toggle-btn nav-link"
        onClick={() => setShowSelector(!showSelector)}
        title={`Tema actual: ${themeInfo.isAutoMode ? 'Automático' : theme}`}
      >
        <div className="nav-link-content">
          <i className="bi bi-palette nav-icon"></i>
          <span className="nav-text">Tema</span>
          <i className={`bi bi-chevron-${showSelector ? 'up' : 'down'} ms-auto`}></i>
        </div>
      </button>
      
      {showSelector && (
        <div className="theme-dropdown">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              className={`theme-option ${(option.value === 'auto' && isAutoMode) || (option.value === theme && !isAutoMode) ? 'active' : ''}`}
              onClick={() => {
                setTheme(option.value);
                setShowSelector(false);
              }}
            >
              <span className="theme-label">{option.label}</span>
              <small className="theme-description">{option.description}</small>
            </button>
          ))}
          
          {isAutoMode && (
            <div className="current-auto-info">
              <small>
                🕐 {themeInfo.currentTime} - {themeInfo.isDay ? 'Día' : 'Noche'}
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SidebarLinks = ({ onLinkClick, location, isMobile }) => {
  const menuItems = [
    { path: '/', icon: 'bi-house-door', label: 'Inicio' },
    { path: '/chat', icon: 'bi-chat-text', label: 'Chat' },
    { path: '/about', icon: 'bi-info-circle', label: 'Sobre Nosotros' },
    { path: '/services', icon: 'bi-gear', label: 'Servicios' },
    { path: '/contact', icon: 'bi-envelope', label: 'Contacto' }
  ];

  return (
    <nav className="sidebar-nav">
      <ul className="nav-list">
        {menuItems.map((item) => (
          <li key={item.path} className="nav-item">
            <Link
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={onLinkClick}
            >
              <div className="nav-link-content">
                <i className={`bi ${item.icon} nav-icon`}></i>
                <span className="nav-text">{item.label}</span>
              </div>
            </Link>
          </li>
        ))}
        
        {/* Separador */}
        <li className="nav-separator"></li>
        
        {/* Selector de tema */}
        <li className="nav-item">
          <ThemeSelector />
        </li>
      </ul>
    </nav>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Manejar el estado del menú
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  // Efecto para body cuando el menú está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }

    // Cleanup al desmontar
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [isOpen]);

  return (
    <>
      {/* Botón hamburguesa mejorado */}
      <button
        className={`hamburger-button ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <div className="hamburger-box">
          <div className="hamburger-inner"></div>
        </div>
      </button>

      {/* Overlay para cerrar el menú en móvil */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>}

      {/* Sidebar Desktop */}
      <div className="sidebar sidebar-desktop">
        <div className="sidebar-header">
          <Link to="/" className="brand-link">
            <i className="bi bi-chat-dots-fill brand-icon"></i>
            <span className="brand-text">OVA</span>
          </Link>
        </div>
        
        <div className="sidebar-content">
          <SidebarLinks location={location} onLinkClick={handleLinkClick} />
        </div>
      </div>

      {/* Sidebar Mobile */}
      <div className={`sidebar sidebar-mobile ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="brand-link" onClick={handleLinkClick}>
            <i className="bi bi-chat-dots-fill brand-icon"></i>
            <span className="brand-text">OVA</span>
          </Link>
          <button 
            className="close-button" 
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar menú"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        <div className="sidebar-content">
          <SidebarLinks location={location} onLinkClick={handleLinkClick} isMobile />
        </div>
      </div>
    </>
  );
};

export default Sidebar;