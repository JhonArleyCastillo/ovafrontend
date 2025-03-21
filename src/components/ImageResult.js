import React from 'react';
import PropTypes from 'prop-types';

const ImageResult = ({ result }) => {
  if (!result) return null;

  return (
    <div className="image-result">
      <h3>Descripción de la imagen:</h3>
      <p>{result.descripcion}</p>
      
      {result.objetos_detectados && result.objetos_detectados.length > 0 && (
        <>
          <h3>Objetos detectados:</h3>
          <ul>
            {result.objetos_detectados.map((objeto, index) => (
              <li key={index}>{objeto}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

ImageResult.propTypes = {
  result: PropTypes.shape({
    descripcion: PropTypes.string,
    objetos_detectados: PropTypes.arrayOf(PropTypes.string),
  }),
};

export default ImageResult;
