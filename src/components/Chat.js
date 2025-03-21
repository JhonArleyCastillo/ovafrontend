import React, { useEffect, useState } from 'react';
import { escucharRespuestas } from '../api';

function Chat() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    escucharRespuestas(({ texto, audioBase64 }) => {
      setMessages((prev) => [...prev, { texto }]);
      if (audioBase64) {
        reproducirAudio(audioBase64);
      }
    });
  }, []);

  const reproducirAudio = (base64Audio) => {
    const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
    audio.play();
  };

  return (
    <div>
      <h2>Conversación</h2>
      <div style={{ border: '1px solid #ddd', padding: '10px', maxHeight: '200px', overflowY: 'scroll' }}>
        {messages.map((msg, index) => (
          <p key={index}> {msg.texto}</p>
        ))}
      </div>
    </div>
  );
}

export default Chat;
