import React from 'react';

/**
 * Componentes de UI para el About Us Section
 * Los componentes SVG han sido reemplazados por imágenes reales
 */

export const CapabilitiesIcons = () => (
  <div className="d-flex justify-content-center gap-4 my-3">
    <span title="Lenguaje Natural" style={{ fontSize: '2rem' }}>💬</span>
    <span title="Visión por Computadora" style={{ fontSize: '2rem' }}>👁️</span>
    <span title="Reconocimiento de Voz" style={{ fontSize: '2rem' }}>🎤</span>
    <span title="Automatización" style={{ fontSize: '2rem' }}>⚙️</span>
  </div>
);

const UIIllustrations = { CapabilitiesIcons };
export default UIIllustrations;
