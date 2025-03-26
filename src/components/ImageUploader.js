import React, { useState } from 'react';
import PropTypes from 'prop-types';
import API_ROUTES from '../config/api';
import './ImageUploader.css';

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
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(API_ROUTES.IMAGE_PROCESSING, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al procesar la imagen');
      }

      const data = await response.json();
      onResult(data);
    } catch (err) {
      setError('Error al procesar la imagen. Por favor, intenta de nuevo.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="image-uploader">
      <h2>📷 Análisis de Imágenes</h2>
      <div className="upload-container">
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
      </div>

      {selectedImage && (
        <div className="preview-container">
          <img src={selectedImage} alt="Preview" className="image-preview" />
        </div>
      )}

      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Procesando imagen...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

ImageUploader.propTypes = {
  onResult: PropTypes.func.isRequired,
};

export default ImageUploader;
