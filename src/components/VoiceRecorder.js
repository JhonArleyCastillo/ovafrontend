import React, { useRef, useState } from "react";
import { enviarAudio } from "../api";

function VoiceRecorder({ onTextDetected }) {
    const mediaRecorderRef = useRef(null);
    const [recording, setRecording] = useState(false);

    const startRecording = async () => {
        setRecording(true);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            enviarAudio(audioBlob);
        };

        mediaRecorder.start();

        setTimeout(() => {
            mediaRecorder.stop();
            setRecording(false);
        }, 5000);  // Graba 5 segundos máximo
    };

    return (
        <div>
            <button onClick={startRecording} disabled={recording}>
                {recording ? "🎙️ Grabando..." : "🎤 Hablar"}
            </button>
        </div>
    );
}

export default VoiceRecorder;
