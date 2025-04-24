/**
 * ARCHIVO DE COMPATIBILIDAD
 * 
 * Este archivo ahora solo importa y reexporta ApiService desde services/api.js
 * para mantener compatibilidad con componentes existentes.
 * 
 * TODO: Actualizar todos los importes para usar directamente 'services/api.js'
 * y luego eliminar este archivo.
 */

import ApiService from './services/api.js';

// Exportar como default
export default ApiService;

// Exportar también las funciones de WebSocket para compatibilidad
export const createWebSocketConnection = ApiService.createWebSocketConnection;
export const checkServerStatus = ApiService.checkServerStatus;
export const processImage = ApiService.processImage;
export const analyzeSignLanguage = ApiService.analyzeSignLanguageImage;
export const processAudio = ApiService.processAudio;
export const sendAudioToWebSocket = ApiService.sendAudioToWebSocket;
export const sendTextToWebSocket = ApiService.sendTextToWebSocket;

// Funciones de compatibilidad para las antiguas funciones exportadas
export const enviarAudio = (audioBlob, ws) => {
  if (ws) {
    return ApiService.sendAudioToWebSocket(audioBlob, ws);
  } else {
    console.warn('Se llamó a enviarAudio sin WebSocket, usando HTTP fallback');
    return ApiService.processAudio(audioBlob);
  }
};

export const escucharRespuestas = (callback) => {
  console.warn('escucharRespuestas está deprecado, usar ApiService.createWebSocketConnection');
  return () => {}; // Devolver función de limpieza no-op
};
