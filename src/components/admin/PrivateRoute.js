import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import AuthService from '../../services/auth.service';

/**
 * Componente para proteger rutas que requieren autenticación de administrador
 * Si el usuario no está autenticado, se redirige a la página de inicio de sesión
 */
const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = AuthService.isAuthenticated();
  
  // Verificar si el token es válido
  useEffect(() => {
    // Si hay un token inválido, limpiarlo
    if (!isAuthenticated && localStorage.getItem(AuthService.TOKEN_KEY)) {
      AuthService.logout();
    }
  }, [isAuthenticated]);
  
  // Si no está autenticado, redirigir al login guardando la ruta a la que intentaba acceder
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  
  // Si está autenticado, mostrar el componente hijo
  return children;
};

export default PrivateRoute;

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};