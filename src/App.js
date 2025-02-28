import React, { useState } from "react";
import Chat from "./components/Chat";
import VoiceRecorder from "./components/VoiceRecorder";
import ImageUploader from "./components/ImageUploader";
import ImageResult from "./components/ImageResult";

function App() {
    const [imageResult, setImageResult] = useState(null);

    return (
        <div style={styles.appContainer}>
            <h1 style={styles.header}>🎙️ Asistente Inteligente Multimodal</h1>

            <div style={styles.section}>
                <h2>🗣️ Interacción por Voz</h2>
                <VoiceRecorder />
                <Chat />
            </div>

            <div style={styles.section}>
                <h2>📷 Análisis de Imágenes</h2>
                <ImageUploader onResult={setImageResult} />
                <ImageResult result={imageResult} />
            </div>
        </div>
    );
}

const styles = {
    appContainer: {
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        backgroundColor: "#f9f9f9",
        minHeight: "100vh"
    },
    header: {
        textAlign: "center",
        color: "#333"
    },
    section: {
        backgroundColor: "white",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "20px"
    }
};

export default App;
