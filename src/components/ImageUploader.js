import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Logger } from '../utils/debug-utils';
import { optimizeImage } from '../utils/media-utils';
import ApiService from '../services/api';
import { COMPONENT_NAMES } from '../config/constants';
import { ErrorMessage, LoadingSpinner } from './common';
import './ImageUploader.css';

const COMPONENT_NAME = COMPONENT_NAMES.IMAGE_UPLOADER;

const ImageUploader = ({ onResult }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setError(null);
      processImage(file);
    }
  };

  const processImage = async (file) => {
    setIsLoading(true);
    setError(null);

    try {
      Logger.info(COMPONENT_NAME, 'Procesando imagen', file.name);
      
      // Optimizar imagen antes de enviar
      const optimizedImage = await optimizeImage(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8
      });
      
      // Procesar con el servicio API
      const { success, data, error } = await ApiService.processImage(optimizedImage);

      if (!success || error) {
        throw new Error(error || 'Error al procesar la imagen');
      }

      // Enviar resultados a través de la prop onResult
      Logger.info(COMPONENT_NAME, 'Imagen procesada con éxito');
      onResult(data);
    } catch (err) {
      Logger.error(COMPONENT_NAME, 'Error al procesar imagen', err);
      setError('Error al procesar la imagen. Por favor, intenta de nuevo.');
      onResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedImage(URL.createObjectURL(file));
        setError(null);
        processImage(file);
      } else {
        setError('El archivo debe ser una imagen.');
      }
    }
  };

  const clearError = () => setError(null);

  return (
    <div className="image-uploader">
      <h2>📷 Análisis de Imágenes</h2>
      <div 
        className="upload-container"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="file-input"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="upload-label">
          {selectedImage ? 'Cambiar imagen' : 'Seleccionar imagen'}
        </label>
        <p className="drag-drop-text">
          o arrastra y suelta aquí
        </p>
      </div>

      {selectedImage && (
        <div className="preview-container">
          <img src={selectedImage} alt="Vista previa" className="image-preview" />
        </div>
      )}

      <LoadingSpinner 
        isLoading={isLoading} 
        text="Procesando imagen..." 
      />

      <ErrorMessage 
        message={error} 
        onDismiss={clearError}
      />
    </div>
  );
};

ImageUploader.propTypes = {
  onResult: PropTypes.func.isRequired,
};

export default ImageUploader;
