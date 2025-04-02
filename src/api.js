// Configuración de rutas
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.ovaonline.tech';
const WS_PROTOCOL = 'wss:'; // Forzar WSS en producción
const WS_URL = `${WS_PROTOCOL}//${API_BASE_URL.replace(/^https?:\/\//, '')}/api/detect`;

// Clase para manejar la conexión WebSocket
class WebSocketManager {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageHandlers = new Set();
    this.connect();
  }

  connect() {
    try {
      this.socket = new WebSocket(WS_URL);
      
      this.socket.onopen = () => {
        console.log('WebSocket conectado');
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageHandlers.forEach(handler => handler(data));
        } catch (error) {
          console.error('Error al procesar mensaje:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('Error en WebSocket:', error);
        this.handleReconnect();
      };

      this.socket.onclose = () => {
        console.log('WebSocket desconectado');
        this.handleReconnect();
      };
    } catch (error) {
      console.error('Error al crear WebSocket:', error);
      this.handleReconnect();
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
    }
  }

  send(data) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      console.error('WebSocket no está conectado');
    }
  }

  addMessageHandler(handler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }
}

// Instancia global del WebSocket
const wsManager = new WebSocketManager();

// Funciones de exportación
export const enviarAudio = (audioBlob) => {
  audioBlob.arrayBuffer().then((buffer) => {
    wsManager.send(buffer);
  });
};

export const escucharRespuestas = (callback) => {
  return wsManager.addMessageHandler(({ texto, audio }) => {
    callback({ texto, audioBase64: audio });
  });
};

// Rutas de la API
export const API_ROUTES = {
  WEBSOCKET_URL: WS_URL,
  IMAGE_PROCESSING: `${API_BASE_URL}/procesar-imagen`,
};

export default API_ROUTES;
