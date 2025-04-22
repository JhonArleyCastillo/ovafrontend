import React, { useState } from 'react';
import Logger from '../utils/debug-utils';
import './SignLanguageUploader.css';

const SignLanguageUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setError(null); // Limpiar errores anteriores
    
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecciona un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.onerror = () => {
        setError('Error al leer el archivo');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor, selecciona una imagen primero');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/process-sign-language', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al procesar la imagen');
      }

      const result = await response.json();
      Logger.info('SignLanguageUploader', 'Imagen procesada exitosamente', result);
    } catch (error) {
      setError(error.message || 'Error al procesar la imagen');
      Logger.error('SignLanguageUploader', 'Error al procesar la imagen', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="sign-language-uploader">
      <h3>Subir Imagen de Lenguaje de Señas</h3>
      <div className="upload-container">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="file-input"
        />
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {previewUrl && (
          <div className="preview-container">
            <img src={previewUrl} alt="Vista previa" className="preview-image" />
          </div>
        )}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="upload-button"
        >
          {isUploading ? 'Procesando...' : 'Procesar Imagen'}
        </button>
      </div>
    </div>
  );
};

export default SignLanguageUploader; 