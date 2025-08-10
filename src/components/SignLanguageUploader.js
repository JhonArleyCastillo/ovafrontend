import React, { useState } from 'react';
import Logger from '../utils/debug-utils';
import { optimizeImage } from '../utils/media-utils';

const SignLanguageUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  // Constantes para validación de archivos
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en bytes
  const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  // const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    setError(null); // Limpiar errores anteriores
    
    if (file) {
      try {
        // Validar y optimizar la imagen con la función mejorada
  const { blob: optimizedImage, tooBig, invalidFormat } = await optimizeImage(file, {
          maxWidth: 1200,
          maxHeight: 900,
          quality: 0.8,
          maxSizeBytes: MAX_FILE_SIZE,
          allowedFormats: ALLOWED_FORMATS
        });
        
        // Si el formato no está permitido, mostrar mensaje de error específico
        if (invalidFormat) {
          setError('La extensión de la imagen no es permitida');
          return;
        }
        
        // Si la imagen sigue siendo demasiado grande después de optimizar
        if (tooBig) {
          setError('La imagen es demasiado grande y no se pudo reducir por debajo de 5MB');
          return;
        }
        
        // Si todo está bien, establecer el archivo optimizado y mostrar vista previa
        setSelectedFile(optimizedImage);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.onerror = () => {
          setError('Error al leer el archivo');
        };
        reader.readAsDataURL(optimizedImage);
        
      } catch (err) {
        Logger.error('SignLanguageUploader', 'Error al procesar archivo', err);
        setError('Error al procesar la imagen');
      }
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
    <div className="card shadow-sm">
      <div className="card-body">
        <h5 className="card-title d-flex align-items-center">
          <i className="bi bi-translate me-2"></i>
          Análisis de Lenguaje de Señas
        </h5>
        
        <div className="d-flex flex-column align-items-center gap-3 py-2">
          <div className="mb-3 w-100">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              className="form-control"
              id="signLanguageInput"
            />
            <label className="form-text" htmlFor="signLanguageInput">
              Formatos permitidos: JPG, PNG, WebP (máx. 5MB)
            </label>
          </div>
          
          {error && (
            <div className="alert alert-danger w-100" role="alert">
              {error}
            </div>
          )}
          
          {previewUrl && (
            <div className="mb-3 text-center">
              <img 
                src={previewUrl} 
                alt="Vista previa" 
                className="img-fluid rounded" 
                style={{ maxHeight: '200px' }}
              />
            </div>
          )}
          
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="btn btn-success w-100"
          >
            {isUploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Procesando...
              </>
            ) : 'Procesar Imagen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignLanguageUploader;