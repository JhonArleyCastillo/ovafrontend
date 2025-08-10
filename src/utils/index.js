/**
 * Archivo índice para exportar todas las utilidades
 */

import { default as Logger } from './debug-utils';
export * from './debug-utils';
export { Logger };
export * from './media-utils';

const Utils = {
  Logger,
  // Nota: no incluimos require dinámico para evitar issues con bundlers
};

export default Utils; 