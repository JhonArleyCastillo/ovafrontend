import React, { useState } from "react";
import axios from "axios";

function ImageUploader({ onResult }) {
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const uploadImage = async () => {
        if (!file) {
            alert("Por favor selecciona una imagen");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post("http://localhost:8000/procesar-imagen", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            onResult(response.data);
        } catch (error) {
            console.error("Error al procesar imagen:", error);
            alert("Hubo un error al procesar la imagen.");
        }
    };

    return (
        <div>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <button onClick={uploadImage}>📷 Analizar Imagen</button>
        </div>
    );
}

export default ImageUploader;
