import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import VoiceRecorder from "./components/VoiceRecorder";
import ImageUploader from "./components/ImageUploader";
import ImageResult from "./components/ImageResult";
import "./App.css";

function App() {
    const [imageResult, setImageResult] = useState(null);

    return (
        <Router>
            <div className="app-container">
                <Sidebar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={
                            <div>
                                <h1>🎙️ Asistente Inteligente Multimodal</h1>
                                <div className="section">
                                    <h2>🗣️ Interacción por Voz</h2>
                                    <VoiceRecorder />
                                    <Chat />
                                </div>
                                <div className="section">
                                    <h2>📷 Análisis de Imágenes</h2>
                                    <ImageUploader onResult={setImageResult} />
                                    <ImageResult result={imageResult} />
                                </div>
                            </div>
                        } />
                        <Route path="/playground" element={
                            <div className="playground">
                                <h1>🎮 Playground</h1>
                                <div className="playground-container">
                                    <VoiceRecorder />
                                    <Chat />
                                    <ImageUploader onResult={setImageResult} />
                                    <ImageResult result={imageResult} />
                                </div>
                            </div>
                        } />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
