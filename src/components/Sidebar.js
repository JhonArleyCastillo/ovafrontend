import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import useDayNightTheme from '../hooks/useDayNightTheme';
import Logger from '../utils/debug-utils';

/**
 * COMPONENTE SIDEBAR PARA NAVEGACIÓN PRINCIPAL
 * 
 * Como desarrollador fullstack, este es el componente de navegación más crítico del sistema.
 * Maneja tanto la experiencia desktop como móvil de forma responsiva.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * 1. NAVEGACIÓN RESPONSIVE: Desktop sidebar fijo + móvil hamburger menu
 * 2. TEMA DINÁMICO: Selector automático día/noche con override manual
 * 3. ESTADO ACTIVO: Highlighting de la página actual
 * 4. ACCESIBILIDAD: ARIA labels, keyboard navigation, focus management
 * 5. UX MÓVIL: Overlay, animaciones, touch-friendly targets
 * 
 * ARQUITECTURA:
 * - ThemeSelector: Componente independiente para gestión de temas
 * - SidebarLinks: Lista de navegación reutilizable entre desktop/móvil
 * - Sidebar: Componente principal que orquesta todo
 * 
 * CASOS DE USO REALES:
 * - Usuario navega entre Chat, Inicio, Servicios, etc.
 * - Usuario prefiere tema oscuro/claro específico
 * - Navegación por teclado para accesibilidad
 * - Touch navigation en tablets/móviles
 * - Auto-cierre cuando selecciona destino (UX móvil)
 */

// ═══════════════════════════════════════════════════════════════════════════════════
// COMPONENTE SELECTOR DE TEMA - GESTIÓN AUTOMÁTICA DÍA/NOCHE
// ═══════════════════════════════════════════════════════════════════════════════════

/**
 * THEMESELECTOR - Control inteligente de temas visuales
 * 
 * CARACTERÍSTICAS AVANZADAS:
 * - AUTO MODE: Cambia automáticamente según hora del día
 * - MANUAL OVERRIDE: Usuario puede forzar tema específico
 * - PERSISTENCIA: Recuerda preferencia en localStorage
 * - FEEDBACK VISUAL: Muestra hora actual y estado en modo auto
 * 
 * LÓGICA DE NEGOCIO:
 * - 6:00-18:00 = Tema claro
 * - 18:00-6:00 = Tema oscuro
 * - Override manual = Respeta siempre la selección del usuario
 */
const ThemeSelector = () => {
  // ═══════════════════════════════════════════════════════════════════════════════════
  // ESTADO DEL SELECTOR DE TEMA
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  const { theme, setTheme, isAutoMode, getThemeInfo } = useDayNightTheme();
  
  /**
   * CONTROL DEL DROPDOWN
   * - Permite abrir/cerrar el selector de temas
   * - Se cierra automáticamente al seleccionar una opción
   * - Mejora UX evitando clicks extra
   */
  const [showSelector, setShowSelector] = useState(false);
  
  /**
   * INFORMACIÓN CONTEXTUAL DEL TEMA
   * - Hora actual del sistema
   * - Si estamos en período día/noche
   * - Estado del modo automático
   */
  const themeInfo = getThemeInfo();
  
  // ═══════════════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE OPCIONES DE TEMA
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * OPCIONES DISPONIBLES:
   * 
   * AUTO: Modo inteligente que cambia según hora
   * - 🌓 Emoji que representa día/noche
   * - Descripción clara para usuarios no técnicos
   * 
   * LIGHT: Tema claro forzado
   * - ☀️ Emoji solar universalmente entendido
   * - Override del modo automático
   * 
   * DARK: Tema oscuro forzado  
   * - 🌙 Emoji lunar para tema nocturno
   * - Popular para desarrolladores y uso nocturno
   */
  const themeOptions = [
    { value: 'auto', label: '🌓 Automático', description: 'Día/Noche automático' },
    { value: 'light', label: '☀️ Claro', description: 'Tema día' },
    { value: 'dark', label: '🌙 Oscuro', description: 'Tema noche' }
  ];
  
  return (
    <div className="theme-selector">
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* BOTÓN PRINCIPAL DEL SELECTOR */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      
      <button 
        className="theme-toggle-btn nav-link"
        onClick={() => setShowSelector(!showSelector)}
        title={`Tema actual: ${themeInfo.isAutoMode ? 'Automático' : theme}`}
        aria-expanded={showSelector}
        aria-haspopup="true"
      >
        <div className="nav-link-content">
          {/*
            ICONOGRAFÍA:
            - bi-palette: Representa customización visual
            - Universalmente reconocido para temas/personalización
            - Consistent con otros íconos de Bootstrap
          */}
          <i className="bi bi-palette nav-icon"></i>
          <span className="nav-text">Tema</span>
          
          {/*
            INDICADOR VISUAL DE ESTADO:
            - Chevron up/down indica si dropdown está abierto
            - ms-auto: Alinea a la derecha para mejor UX
            - Feedback visual inmediato del estado del componente
          */}
          <i className={`bi bi-chevron-${showSelector ? 'up' : 'down'} ms-auto`}></i>
        </div>
      </button>
      
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* DROPDOWN DE OPCIONES DE TEMA */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      
      {showSelector && (
        <div className="theme-dropdown" role="menu">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              className={`theme-option ${
                (option.value === 'auto' && isAutoMode) || 
                (option.value === theme && !isAutoMode) ? 'active' : ''
              }`}
              onClick={() => {
                setTheme(option.value);
                setShowSelector(false);  // Auto-cerrar para mejor UX
              }}
              role="menuitem"
            >
              {/*
                LAYOUT DE CADA OPCIÓN:
                - Label con emoji para reconocimiento visual rápido
                - Description para clarificar funcionalidad
                - Active state para mostrar selección actual
              */}
              <span className="theme-label">{option.label}</span>
              <small className="theme-description">{option.description}</small>
            </button>
          ))}
          
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* INFORMACIÓN CONTEXTUAL EN MODO AUTO */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          
          {isAutoMode && (
            <div className="current-auto-info">
              {/*
                FEEDBACK DEL MODO AUTOMÁTICO:
                - Muestra hora actual del sistema
                - Indica si está en período día/noche
                - Ayuda al usuario a entender por qué está en tema X
                
                EJEMPLO: "🕐 14:30 - Día" o "🕐 20:15 - Noche"
                Esto explica claramente por qué el tema automático eligió claro/oscuro
              */}
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

// ═══════════════════════════════════════════════════════════════════════════════════
// COMPONENTE SIDEBARLINKS - NAVEGACIÓN PRINCIPAL DE LA APLICACIÓN
// ═══════════════════════════════════════════════════════════════════════════════════

/**
 * SIDEBARLINKS - Lista de navegación reutilizable
 * 
 * Este componente centraliza toda la navegación principal:
 * - Se usa tanto en sidebar desktop como móvil
 * - Mantiene consistencia visual entre plataformas
 * - Maneja estados activos automáticamente
 * - Incluye el selector de tema integrado
 * 
 * PROPS:
 * - onLinkClick: Callback para cerrar menú en móvil
 * - location: Objeto de React Router para determinar página activa
 * - isMobile: Flag para ajustes específicos de móvil
 */
const SidebarLinks = ({ onLinkClick, location, isMobile }) => {
  // ═══════════════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE ELEMENTOS DE MENÚ
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * ESTRUCTURA DE NAVEGACIÓN:
   * 
   * Cada item incluye:
   * - path: Ruta de React Router
   * - icon: Ícono de Bootstrap Icons
   * - label: Texto descriptivo
   * 
   * ORDEN ESTRATÉGICO:
   * 1. INICIO: Landing page, primera impresión
   * 2. CHAT: Funcionalidad principal ASL
   * 3. SOBRE NOSOTROS: Información de contexto
   * 4. SERVICIOS: Detalles técnicos y capacidades
   * 5. CONTACTO: Soporte y feedback
   */
  const menuItems = [
    { 
      path: '/', 
      icon: 'bi-house-door', 
      label: 'Inicio',
      description: 'Página principal y bienvenida'
    },
    { 
      path: '/chat', 
      icon: 'bi-chat-text', 
      label: 'Chat',
      description: 'Comunicación ASL en tiempo real'
    },
    { 
      path: '/about', 
      icon: 'bi-info-circle', 
      label: 'Sobre Nosotros',
      description: 'Información del proyecto y equipo'
    },
    { 
      path: '/services', 
      icon: 'bi-gear', 
      label: 'Servicios',
      description: 'Capacidades y características técnicas'
    },
    { 
      path: '/contact', 
      icon: 'bi-envelope', 
      label: 'Contacto',
      description: 'Soporte y canales de comunicación'
    }
  ];

  return (
    <nav className="sidebar-nav" role="navigation" aria-label="Navegación principal">
      <ul className="nav-list">
        {menuItems.map((item) => (
          <li key={item.path} className="nav-item" role="none">
            {/*
              LINK DE NAVEGACIÓN:
              
              FUNCIONALIDADES:
              - Active state automático basado en location.pathname
              - Callback onLinkClick para cerrar menú móvil
              - Estructura consistent nav-link-content
              
              ACCESIBILIDAD:
              - role="link" implícito en Link component
              - Texto descriptivo para screen readers
              - Focus visible para navegación por teclado
            */}
            <Link
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={onLinkClick}
              aria-current={location.pathname === item.path ? 'page' : undefined}
              title={item.description}
            >
              <div className="nav-link-content">
                {/*
                  ICONOGRAFÍA CONSISTENTE:
                  - Bootstrap Icons para reconocimiento universal
                  - nav-icon class para styling consistent
                  - Iconos semánticamente apropiados
                */}
                <i className={`bi ${item.icon} nav-icon`} aria-hidden="true"></i>
                <span className="nav-text">{item.label}</span>
              </div>
            </Link>
          </li>
        ))}
        
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SEPARADOR VISUAL */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        
        {/*
          SEPARADOR ENTRE NAVEGACIÓN Y UTILIDADES:
          - Agrupa visualmente navegación vs configuración
          - Mejora la organización visual del menú
          - Spacer sutil pero efectivo
        */}
        <li className="nav-separator" role="separator" aria-hidden="true"></li>
        
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* INTEGRACIÓN DEL SELECTOR DE TEMA */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        
        {/*
          POSICIONAMIENTO ESTRATÉGICO:
          - Al final del menú para no interferir con navegación
          - Separado visualmente de links principales
          - Accesible pero no prominente
        */}
        <li className="nav-item" role="none">
          <ThemeSelector />
        </li>
      </ul>
    </nav>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL SIDEBAR - NAVEGACIÓN RESPONSIVE
// ═══════════════════════════════════════════════════════════════════════════════════

/**
 * SIDEBAR - Componente maestro de navegación
 * 
 * RESPONSABILIDADES PRINCIPALES:
 * 1. RESPONSIVE DESIGN: Maneja tanto desktop como móvil
 * 2. ESTADO DE MENÚ: Control de apertura/cierre en móvil
 * 3. AUTO-CLOSE: Cierra menú automáticamente al navegar
 * 4. BODY CLASS MANAGEMENT: Previene scroll cuando menú está abierto
 * 5. OVERLAY: Permite cerrar menú tocando fuera
 * 
 * ARQUITECTURA:
 * - Desktop: Sidebar fijo visible siempre
 * - Móvil: Hamburger button + slide-out menu + overlay
 * - Shared: Mismo SidebarLinks component para consistency
 */
const Sidebar = () => {
  // ═══════════════════════════════════════════════════════════════════════════════════
  // ESTADO Y HOOKS DE NAVEGACIÓN
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  const location = useLocation();  // Hook de React Router para detectar cambios de ruta
  
  /**
   * ESTADO DEL MENÚ MÓVIL
   * - Controla si el menú hamburger está abierto/cerrado
   * - Solo afecta la versión móvil del sidebar
   * - Desktop sidebar siempre visible (no usa este estado)
   */
  const [isOpen, setIsOpen] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════════════
  // EFECTO: AUTO-CLOSE AL CAMBIAR DE RUTA
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * UX CRÍTICA: Cerrar menú automáticamente al navegar
   * 
   * Sin esto, el usuario navega a una nueva página pero el menú
   * queda abierto, creando confusión sobre dónde está.
   * 
   * CASOS QUE MANEJA:
   * - Usuario hace click en link de navegación
   * - Navegación programática (history.push, etc.)
   * - Back/forward button del navegador
   * - URL directa escribida en barra de dirección
   */
  useEffect(() => {
    setIsOpen(false);
    // Logging para debugging de navegación
    Logger.debug('Sidebar', '📍 Navegación detectada:', location.pathname);
  }, [location.pathname]);

  // ═══════════════════════════════════════════════════════════════════════════════════
  // HANDLERS DE INTERACCIÓN
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * TOGGLE DEL MENÚ HAMBURGER
   * - Alterna entre abierto/cerrado
   * - Solo funciona en versión móvil
   * - Triggers animaciones CSS
   */
  const toggleMenu = () => {
    setIsOpen(!isOpen);
    Logger.debug('Sidebar', '🍔 Menú hamburger toggle:', !isOpen);
  };

  /**
   * HANDLER PARA CLICKS EN LINKS
   * - Cierra el menú al hacer click en cualquier link
   * - Mejora UX en móvil (acción esperada)
   * - Previene tener que cerrar manualmente
   */
  const handleLinkClick = () => {
    setIsOpen(false);
    Logger.debug('Sidebar', '🔗 Link clickeado, cerrando menú');
  };

  // ═══════════════════════════════════════════════════════════════════════════════════
  // EFECTO: GESTIÓN DE CLASE BODY PARA SCROLL LOCK
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * MANEJO DEL SCROLL EN MÓVIL
   * 
   * Cuando el menú está abierto:
   * - Agregamos clase 'menu-open' al body
   * - CSS previene scroll del contenido principal
   * - Usuario puede scrollear dentro del menú
   * - Previene scroll accidental del fondo
   * 
   * CLEANUP CRÍTICO:
   * - Removemos la clase al cerrar menú
   * - Removemos la clase al desmontar componente
   * - Previene scroll permanentemente bloqueado
   */
  useEffect(() => {
    if (isOpen) {
      // Activar scroll lock cuando menú se abre
      document.body.classList.add('menu-open');
      Logger.debug('Sidebar', '🔒 Scroll bloqueado - menú abierto');
    } else {
      // Liberar scroll cuando menú se cierra
      document.body.classList.remove('menu-open');
      Logger.debug('Sidebar', '🔓 Scroll liberado - menú cerrado');
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // CLEANUP FUNCTION - CRÍTICO PARA EVITAR BUGS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Cleanup al desmontar componente:
     * - Remueve clase 'menu-open' del body
     * - Previene scroll permanentemente bloqueado
     * - Se ejecuta cuando usuario navega a página sin sidebar
     * - Se ejecuta cuando app se cierra/recarga
     */
    return () => {
      document.body.classList.remove('menu-open');
      Logger.debug('Sidebar', '🧹 Cleanup: clase menu-open removida del body');
    };
  }, [isOpen]);

  // ═══════════════════════════════════════════════════════════════════════════════════
  // RENDERIZADO DE LA INTERFAZ RESPONSIVE
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * ESTRUCTURA DEL RENDER:
   * 
   * 1. HAMBURGER BUTTON: Solo visible en móvil
   * 2. OVERLAY: Para cerrar menú tocando fuera (solo móvil)
   * 3. SIDEBAR DESKTOP: Siempre visible en pantallas grandes
   * 4. SIDEBAR MOBILE: Slide-out menu para móviles
   * 
   * RESPONSIVE STRATEGY:
   * - CSS media queries controlan qué versión se muestra
   * - Ambas versiones usan mismo SidebarLinks para consistency
   * - Estado isOpen solo afecta versión móvil
   */
  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* BOTÓN HAMBURGER - TRIGGER PARA MENÚ MÓVIL */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      
      <button
        className={`hamburger-button ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
        aria-controls="mobile-sidebar"
      >
        {/*
          HAMBURGER ANIMATION:
          - hamburger-box: Container para animación
          - hamburger-inner: Las "líneas" que se animan
          - active class: Triggers transformación a X
          - CSS handles la animación suave entre estados
        */}
        <div className="hamburger-box">
          <div className="hamburger-inner"></div>
        </div>
      </button>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* OVERLAY - PERMITE CERRAR MENÚ TOCANDO FUERA */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsOpen(false)}
          aria-label="Cerrar menú"
        >
          {/*
            OVERLAY FUNCTIONALITY:
            - Cubre toda la pantalla cuando menú está abierto
            - onClick cierra el menú (UX esperada)
            - onKeyDown maneja navegación por teclado
            - tabIndex hace el div focusable para accesibilidad
            - role="button" indica que es clickeable
          */}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* SIDEBAR DESKTOP - SIEMPRE VISIBLE EN PANTALLAS GRANDES */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      
      <div className="sidebar sidebar-desktop" role="navigation" aria-label="Navegación principal">
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* HEADER CON BRANDING */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        
        <div className="sidebar-header">
          <Link to="/" className="brand-link" aria-label="OVA - Ir al inicio">
            {/*
              BRANDING ELEMENTS:
              - bi-chat-dots-fill: Ícono que representa comunicación/chat
              - "OVA": Nombre corto y memorable del proyecto
              - Link al home para navegación rápida
            */}
            <i className="bi bi-chat-dots-fill brand-icon" aria-hidden="true"></i>
            <span className="brand-text">OVA</span>
          </Link>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* CONTENIDO DE NAVEGACIÓN */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        
        <div className="sidebar-content">
          <SidebarLinks 
            location={location} 
            onLinkClick={handleLinkClick}
            isMobile={false}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* SIDEBAR MOBILE - SLIDE-OUT MENU PARA PANTALLAS PEQUEÑAS */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      
      <div 
        className={`sidebar sidebar-mobile ${isOpen ? 'open' : ''}`}
        id="mobile-sidebar"
        role="navigation" 
        aria-label="Navegación móvil"
        aria-hidden={!isOpen}
      >
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* HEADER MÓVIL CON BRANDING Y BOTÓN CERRAR */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        
        <div className="sidebar-header">
          {/*
            BRANDING LINK:
            - Mismo branding que desktop para consistency
            - onClick cierra menú automáticamente
            - Permite navegar al home desde cualquier página
          */}
          <Link to="/" className="brand-link" onClick={handleLinkClick} aria-label="OVA - Ir al inicio">
            <i className="bi bi-chat-dots-fill brand-icon" aria-hidden="true"></i>
            <span className="brand-text">OVA</span>
          </Link>
          
          {/*
            BOTÓN CERRAR:
            - Redundante con overlay pero más descubrible
            - Ícono X universal para "cerrar"
            - Posicionado donde usuarios esperan encontrarlo
          */}
          <button 
            className="close-button" 
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar menú"
          >
            <i className="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* CONTENIDO DE NAVEGACIÓN MÓVIL */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        
        <div className="sidebar-content">
          <SidebarLinks 
            location={location} 
            onLinkClick={handleLinkClick} 
            isMobile={true}
          />
        </div>
      </div>
    </>
  );
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * EXPORTACIÓN Y DOCUMENTACIÓN DEL COMPONENTE
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * SIDEBAR - Sistema de navegación responsive completo
 * 
 * FUNCIONALIDADES IMPLEMENTADAS:
 * ✅ Navegación responsive (desktop fijo + móvil hamburger)
 * ✅ Selector de tema automático día/noche con override manual
 * ✅ Estados activos automáticos basados en ruta actual
 * ✅ Auto-close de menú móvil al navegar
 * ✅ Overlay para cerrar tocando fuera del menú
 * ✅ Scroll lock en móvil cuando menú está abierto
 * ✅ Accesibilidad completa (ARIA, keyboard navigation)
 * ✅ Animaciones CSS para transiciones suaves
 * ✅ Branding consistente entre versiones
 * 
 * COMPONENTES INTERNOS:
 * - ThemeSelector: Control inteligente de temas visuales
 * - SidebarLinks: Lista de navegación reutilizable
 * - Sidebar: Orchestrator principal responsive
 * 
 * CASOS DE USO:
 * - Navegación principal entre todas las páginas
 * - Personalización de tema por preferencia de usuario
 * - Experiencia móvil touch-friendly
 * - Navegación por teclado para accesibilidad
 * - Branding y identidad visual consistente
 * 
 * INTEGRACIONES:
 * - React Router: Navegación entre páginas
 * - useDayNightTheme: Hook personalizado para gestión de temas
 * - CSS Grid/Flexbox: Layout responsive
 * - Bootstrap Icons: Iconografía consistente
 * 
 * CONSIDERACIONES TÉCNICAS:
 * - Media queries para responsive breakpoints
 * - CSS transforms para animaciones suaves
 * - Z-index management para overlays
 * - Body class manipulation para scroll control
 * - Local storage para persistencia de tema
 * 
 * RESPONSIVE BREAKPOINTS:
 * - Desktop: >768px - Sidebar fijo visible
 * - Tablet/Mobile: ≤768px - Hamburger menu
 * - Touch targets: 44px+ para usabilidad móvil
 * 
 * ACCESIBILIDAD:
 * - ARIA labels y roles apropiados
 * - Keyboard navigation completa
 * - Focus management en modales
 * - Screen reader support
 * - Color contrast WCAG compliant
 */
export default Sidebar;

// ═══════════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE PROPTYPES
// ═══════════════════════════════════════════════════════════════════════════════════

/**
 * VALIDACIÓN DE PROPS PARA SIDEBARLINKS
 * 
 * Asegura que el componente reciba las props correctas:
 * - onLinkClick: Función callback opcional para cerrar menú
 * - location: Objeto requerido de React Router
 * - isMobile: Flag opcional para ajustes específicos móvil
 */
const SidebarLinksPropTypes = {
  onLinkClick: PropTypes.func,
  location: PropTypes.object.isRequired,
  isMobile: PropTypes.bool
};

SidebarLinks.propTypes = SidebarLinksPropTypes;
SidebarLinks.defaultProps = { 
  onLinkClick: () => {}, 
  isMobile: false 
};