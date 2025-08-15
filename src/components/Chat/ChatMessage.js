import React from 'react';
import PropTypes from 'prop-types';

/**
 * COMPONENTE CHATMESSAGE - RENDERIZADO DE MENSAJES INDIVIDUALES
 * 
 * Como desarrollador fullstack, este es el building block más básico pero crítico
 * del sistema de chat. Cada mensaje que se muestra usa este componente.
 * 
 * RESPONSABILIDADES:
 * 1. RENDERIZADO DUAL: Maneja tanto mensajes de usuario como del bot/sistema
 * 2. SOPORTE MULTIMEDIA: Text + imágenes en el mismo mensaje
 * 3. STYLING DINÁMICO: Diferentes estilos según el remitente
 * 4. ACCESIBILIDAD: Alt text para imágenes, estructura semántica
 * 5. FLEXIBILIDAD: Props opcionales para customización
 * 
 * CASOS DE USO EN EL SISTEMA ASL:
 * - Mensaje de texto del usuario: "Hola, necesito ayuda"
 * - Respuesta del bot: "¡Hola! ¿En qué puedo ayudarte?"
 * - Mensaje con imagen ASL: Texto + imagen de seña
 * - Resultado de procesamiento: "He detectado la letra 'A'"
 * - Mensajes de sistema: "Conexión establecida"
 * - Mensajes de error: "Error al procesar imagen"
 * 
 * ARQUITECTURA DE DATOS:
 * El componente recibe props simples pero puede manejar contenido complejo:
 * - text: Siempre presente, puede ser resultado de IA o input de usuario
 * - isUser: Determina styling y posición (derecha vs izquierda)
 * - image: URL de blob para imágenes ASL o avatares
 * - className: Override para casos especiales (errores, sistema, etc.)
 */

/**
 * FUNCIÓN PRINCIPAL DEL COMPONENTE
 * 
 * @param {Object} props - Propiedades del componente 
 * @param {string} props.text - Texto del mensaje (requerido)
 * @param {boolean} props.isUser - Si el mensaje es del usuario (requerido)
 * @param {string} [props.image] - URL de la imagen (opcional)
 * @param {string} [props.className] - Clase CSS adicional para casos especiales
 */
const ChatMessage = ({ text, isUser, image, className = '' }) => {
  // ═══════════════════════════════════════════════════════════════════════════════════
  // RENDERIZADO DEL MENSAJE - ESTRUCTURA ACCESIBLE Y RESPONSIVE
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  /**
   * ESTRUCTURA DEL MENSAJE:
   * 
   * 1. CONTAINER PRINCIPAL: .message con clases dinámicas
   * 2. IMAGEN OPCIONAL: .message-image si hay imagen
   * 3. TEXTO DEL MENSAJE: .message-text siempre presente
   * 
   * LÓGICA DE CLASES CSS:
   * - 'message': Clase base para todos los mensajes
   * - 'user-message' vs 'bot-message': Determina styling y posición
   * - className prop: Permite overrides para casos especiales
   * 
   * CASOS ESPECIALES QUE MANEJA:
   * - Mensaje solo texto: Solo .message-text
   * - Mensaje con imagen: .message-image + .message-text
   * - Mensaje de error: className="error-message"
   * - Mensaje de sistema: className="system-message"
   */
  return (
    <div 
      className={`message ${isUser ? 'user-message' : 'bot-message'} ${className}`}
      role="listitem"
      aria-label={`Mensaje de ${isUser ? 'usuario' : 'asistente'}`}
    >
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* CONTENEDOR DE IMAGEN - SOLO SI HAY IMAGEN */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      
      {image && (
        <div className="message-image">
          {/*
            IMAGEN DEL MENSAJE:
            
            CASOS DE USO:
            - Imagen ASL subida por usuario
            - Avatar o ícono del remitente
            - Diagrama explicativo del bot
            - Captura de pantalla para soporte
            
            CONSIDERACIONES TÉCNICAS:
            - src puede ser blob URL, data URL, o URL remota
            - alt text descriptivo para screen readers
            - CSS handles responsive sizing
            - loading="lazy" para performance si fuera necesario
            
            ACCESIBILIDAD:
            - Alt text describe el contenido de la imagen
            - Si es imagen ASL, alt podría ser "Imagen de seña [letra]"
            - Si es avatar, alt sería "Avatar del usuario" o "Ícono del asistente"
          */}
          <img 
            src={image} 
            alt={isUser ? "Imagen enviada por el usuario" : "Imagen del asistente"}
            className="message-img"
            onError={(e) => {
              // Fallback si la imagen falla al cargar
              console.warn('Error al cargar imagen del mensaje:', image);
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* CONTENIDO DE TEXTO DEL MENSAJE */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      
      <div className="message-text">
        {/*
          TEXTO DEL MENSAJE:
          
          TIPOS DE CONTENIDO QUE MANEJA:
          - Texto simple del usuario: "Hola"
          - Respuesta del bot: "¡Hola! ¿Cómo puedo ayudarte?"
          - Resultado de procesamiento ASL: "He detectado la letra 'A'"
          - Mensajes de estado: "Conectando...", "Procesando imagen..."
          - Mensajes de error: "Error al procesar imagen"
          - Instrucciones: "Sube una imagen con tu seña"
          
          CONSIDERACIONES:
          - text siempre debe estar presente (prop requerida)
          - Puede contener caracteres especiales, emojis, etc.
          - CSS maneja word-wrapping para textos largos
          - Preserva espacios y saltos de línea si es necesario
          
          ACCESIBILIDAD:
          - El div es readable por screen readers automáticamente
          - CSS puede agregar focus styles si es necesario
          - Text color tiene contrast ratio apropiado según isUser
        */}
        {text}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════════
// VALIDACIÓN DE PROPS Y EXPORTACIÓN
// ═══════════════════════════════════════════════════════════════════════════════════

/**
 * CONFIGURACIÓN DE PROPTYPES
 * 
 * Validación estricta para asegurar que el componente reciba datos correctos:
 * 
 * text: string.isRequired
 * - Siempre requerido porque todo mensaje debe tener contenido textual
 * - Puede ser cadena vacía en casos edge, pero debe estar definido
 * - Maneja emojis, caracteres especiales, saltos de línea
 * 
 * isUser: bool.isRequired  
 * - Crítico para determinar styling y posición del mensaje
 * - true = mensaje del usuario (estilo diferente, alineación derecha)
 * - false = mensaje del bot/sistema (estilo diferente, alineación izquierda)
 * 
 * image: string (opcional)
 * - URL de imagen para mensajes multimedia
 * - Puede ser blob URL, data URL, o URL remota
 * - undefined si no hay imagen adjunta
 * 
 * className: string (opcional)
 * - Permite customización para casos especiales
 * - Ej: "error-message", "system-message", "highlight"
 * - Se combina con clases base del componente
 */
ChatMessage.propTypes = {
  text: PropTypes.string.isRequired,
  isUser: PropTypes.bool.isRequired,
  image: PropTypes.string,
  className: PropTypes.string
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * EXPORTACIÓN Y DOCUMENTACIÓN DEL COMPONENTE
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * CHATMESSAGE - Building block fundamental del sistema de chat
 * 
 * FUNCIONALIDADES IMPLEMENTADAS:
 * ✅ Renderizado dual (usuario vs bot) con styling automático
 * ✅ Soporte para mensajes multimedia (texto + imagen)
 * ✅ Clases CSS dinámicas basadas en remitente
 * ✅ Props opcionales para máxima flexibilidad
 * ✅ Accesibilidad con ARIA labels y alt text descriptivo
 * ✅ Manejo de errores de carga de imágenes
 * ✅ Structure semántica para screen readers
 * 
 * CASOS DE USO EN SISTEMA ASL:
 * - Mensajes de conversación normal
 * - Resultados de procesamiento de imágenes ASL
 * - Feedback de estado del sistema
 * - Mensajes de error user-friendly
 * - Instrucciones y ayuda contextual
 * 
 * INTEGRACIONES:
 * - MessageList.js: Renderiza múltiples ChatMessage
 * - Chat.js: Envía props desde estado global
 * - WebSocket: Recibe datos de mensajes en tiempo real
 * - API responses: Muestra resultados de procesamiento ASL
 * 
 * CONSIDERACIONES DE PERFORMANCE:
 * - Componente pure (no efectos secundarios)
 * - Minimal re-renders gracias a props inmutables
 * - Lazy loading de imágenes si fuera necesario
 * - CSS optimizado para animaciones suaves
 * 
 * EXTENSIBILIDAD FUTURA:
 * - Mostrar marcas de tiempo (timestamp)
 * - Confirmaciones de lectura / estado de entrega
 * - Reacciones con emojis
 * - Responder a mensajes (threads / hilos)
 * - Formato de texto enriquecido (markdown)
 * - Reproducción de mensajes de audio
 * - Adjuntos de archivos (imágenes, documentos, etc.)
 * - Acciones sobre el mensaje (copiar, eliminar, editar)
 */
export default ChatMessage; 