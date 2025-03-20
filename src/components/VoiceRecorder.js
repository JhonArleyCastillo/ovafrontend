import React, { useEffect, useState, useRef } from 'react';



const AudioChat = () => {
    const [texto, setTexto] = useState('');
    const audioRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        const socket = new WebSocket("wss://api.ovaonline.tech/api/detect");
        socketRef.current = socket;

        socket.onopen = () => {
            console.log('Conectado al WebSocket');
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // Mostrar el texto recibido
            setTexto(data.texto);

            // Decodificar el audio base64
            const audioBlob = base64ToBlob(data.audio, 'audio/wav');
            const audioUrl = URL.createObjectURL(audioBlob);

            // Reproducir el audio
            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.play();
            }
        };

        socket.onerror = (error) => {
            console.error('Error en WebSocket:', error);
        };

        socket.onclose = () => {
            console.log('WebSocket cerrado');
        };

        return () => {
            socket.close();
        };
    }, []);

    const enviarAudio = async (archivo) => {
        const audioBlob = new Blob([archivo], { type: 'audio/wav' });
        const arrayBuffer = await audioBlob.arrayBuffer();

        // Enviar el audio como bytes al backend
        socketRef.current.send(arrayBuffer);
    };

    const grabarYEnviar = () => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            const mediaRecorder = new MediaRecorder(stream);
            const chunks = [];

            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(chunks, { type: 'audio/wav' });
                enviarAudio(audioBlob);
            };

            mediaRecorder.start();

            setTimeout(() => {
                mediaRecorder.stop();
            }, 5000); // Graba 5 segundos (ajusta según necesites)
        }).catch((err) => {
            console.error('Error al acceder al micrófono:', err);
        });
    };

    return (
        <div>
            <h2>Asistente Inteligente Multimodal</h2>
            <p>{texto}</p>
            <button onClick={grabarYEnviar}>🎤 Grabar y Enviar</button>
            <audio ref={audioRef} controls />
        </div>
    );
};

// Función para convertir base64 a Blob
function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);

        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
}

export default AudioChat;
