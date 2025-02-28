const socket = new WebSocket("ws://localhost:8000/ws");

export const enviarAudio = (audioBlob) => {
    audioBlob.arrayBuffer().then((buffer) => {
        socket.send(buffer);
    });
};

export const escucharRespuestas = (callback) => {
    socket.onmessage = (event) => {
        const { texto, audio } = JSON.parse(event.data);

        callback({ texto, audioBase64: audio });
    };
};
