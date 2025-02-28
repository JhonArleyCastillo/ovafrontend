import React from "react";

function ImageResult({ result }) {
    if (!result) return null;

    return (
        <div style={{ border: "1px solid #ccc", padding: "10px", marginTop: "10px" }}>
            <h3>📊 Resultados de Análisis</h3>
            <p><strong>Descripción:</strong> {result.descripcion}</p>

            <h4>Objetos Detectados:</h4>
            <ul>
                {result.objetos_detectados.length === 0 ? (
                    <li>No se detectaron objetos.</li>
                ) : (
                    result.objetos_detectados.map((obj, index) => (
                        <li key={index}>{obj.name} (Confianza: {Math.round(obj.confidence * 100)}%)</li>
                    ))
                )}
            </ul>
        </div>
    );
}

export default ImageResult;
