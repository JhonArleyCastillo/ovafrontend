import { useState, useEffect } from 'react';

/**
 * Hook personalizado para manejar el tema día/noche automáticamente
 * basado en la hora local del usuario
 */
const useDayNightTheme = () => {
  const [theme, setTheme] = useState('light');
  const [isAutoMode, setIsAutoMode] = useState(true);

  /**
   * Función principal day_night que determina si es de día o noche
   * @returns {string} 'light' para día, 'dark' para noche
   */
  // eslint-disable-next-line camelcase
  const day_night = () => {
    const now = new Date();
    const hour = now.getHours();
    
    // Consideramos día: 6:00 AM - 6:00 PM (18:00)
    // Consideramos noche: 6:00 PM - 6:00 AM
    const isDayTime = hour >= 6 && hour < 18;
    
    return isDayTime ? 'light' : 'dark';
  };

  /**
   * Aplicar el tema al documento
   * @param {string} newTheme - 'light' o 'dark'
   */
  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    
    if (newTheme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }
    
    // Guardar preferencia en localStorage
    localStorage.setItem('theme-preference', newTheme);
    localStorage.setItem('auto-theme', isAutoMode.toString());
  };

  /**
   * Actualizar tema automáticamente
   */
  const updateAutoTheme = () => {
    if (isAutoMode) {
      const autoTheme = day_night();
      setTheme(autoTheme);
      applyTheme(autoTheme);
    }
  };

  /**
   * Cambiar tema manualmente
   * @param {string} newTheme - 'light', 'dark', o 'auto'
   */
  const setManualTheme = (newTheme) => {
    if (newTheme === 'auto') {
      setIsAutoMode(true);
      updateAutoTheme();
    } else {
      setIsAutoMode(false);
      setTheme(newTheme);
      applyTheme(newTheme);
    }
  };

  /**
   * Obtener información del tema actual
   */
  const getThemeInfo = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    const autoTheme = day_night();
    
    return {
      currentTime: timeString,
      autoDetectedTheme: autoTheme,
      isDay: autoTheme === 'light',
      isNight: autoTheme === 'dark',
      activeTheme: theme,
      isAutoMode
    };
  };

  // Effect para inicializar el tema
  // Intentional: initialize once on mount
  useEffect(() => {
    // Comprobar preferencias guardadas
    const savedTheme = localStorage.getItem('theme-preference');
    const savedAutoMode = localStorage.getItem('auto-theme') === 'true';
    
    if (savedTheme && !savedAutoMode) {
      setIsAutoMode(false);
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Modo automático por defecto
      setIsAutoMode(true);
      updateAutoTheme();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect para actualizar tema automáticamente cada minuto
  // Intentional: depend only on isAutoMode to tick every minuto
  useEffect(() => {
    if (!isAutoMode) return;

    const interval = setInterval(() => {
      updateAutoTheme();
    }, 60000); // Verificar cada minuto

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoMode]);

  // Effect para escuchar cambios de visibilidad de página
  // Intentional: depend only on isAutoMode for visibility updates
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAutoMode) {
        updateAutoTheme();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoMode]);

  return {
    theme,
    setTheme: setManualTheme,
    isAutoMode,
  // eslint-disable-next-line camelcase
  day_night, // Exportar la función principal
    getThemeInfo,
    updateAutoTheme
  };
};

export default useDayNightTheme;
