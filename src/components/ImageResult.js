import React from 'react';
import PropTypes from 'prop-types';
import { Logger } from '../utils/debug-utils';
import { COMPONENT_NAMES } from '../config/constants';

const COMPONENT_NAME = 'ImageResult';

/**
 * Componente para mostrar los resultados del análisis de imagen
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.result - Resultados del análisis de imagen
 */
const ImageResult = ({ result }) => {
  if (!result) return null;
  
  Logger.debug(COMPONENT_NAME, 'Renderizando resultados', result);

  // Renderizar resultados de descripción de imagen
  const renderDescription = () => {
    if (!result.descripcion) return null;
    
    return (
      <>
        <h3>Descripción de la imagen:</h3>
        <p className="result-description">{result.descripcion}</p>
      </>
    );
  };

  // Renderizar resultados de objetos detectados
  const renderObjects = () => {
    if (!result.objetos_detectados || !result.objetos_detectados.length) return null;
    
    return (
      <>
        <h3>Objetos detectados:</h3>
        <ul className="result-objects">
          {result.objetos_detectados.map((objeto, index) => (
            <li key={index}>{objeto}</li>
          ))}
        </ul>
      </>
    );
  };

  // Renderizar categorías identificadas (si existen)
  const renderCategories = () => {
    if (!result.categorias || !result.categorias.length) return null;
    
    return (
      <>
        <h3>Categorías:</h3>
        <div className="result-categories">
          {result.categorias.map((categoria, index) => (
            <span key={index} className="category-tag">
              {categoria.nombre || categoria} 
              {categoria.confianza && ` (${categoria.confianza}%)`}
            </span>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="image-result">
      {renderDescription()}
      {renderObjects()}
      {renderCategories()}
    </div>
  );
};

ImageResult.propTypes = {
  result: PropTypes.shape({
    descripcion: PropTypes.string,
    objetos_detectados: PropTypes.arrayOf(PropTypes.string),
    categorias: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          nombre: PropTypes.string,
          confianza: PropTypes.number
        })
      ])
    )
  }),
};

export default ImageResult;
