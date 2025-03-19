const socket = new WebSocket("wss://18.116.10.48:8000/api/detect");

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
