/**
 * Archivo índice para exportar todas las utilidades
 */

import { default as Logger } from './debug-utils';
export * from './debug-utils';
export { Logger };
export * from './media-utils';

export default {
  Logger,
  ...require('./media-utils')
}; 