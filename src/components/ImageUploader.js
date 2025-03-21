import React, { useState } from 'react';
import PropTypes from 'prop-types';

const ImageUploader = ({ onResult }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await fetch('http://localhost:8000/procesar-imagen', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al procesar la imagen');
      }

      const data = await response.json();
      onResult(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="image-uploader">
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
      />
      {previewUrl && (
        <div>
          <img src={previewUrl} alt="Preview" style={{ maxWidth: '300px' }} />
          <button onClick={handleUpload}>Analizar Imagen</button>
        </div>
      )}
    </div>
  );
};

ImageUploader.propTypes = {
  onResult: PropTypes.func.isRequired
};

export default ImageUploader;
