import React, { useState, useEffect } from 'react';
import DatabaseService from '../services/database.service';

/**
 * Componente para administración de usuarios
 * Demuestra cómo conectar con la base de datos desde el frontend
 */
const UsuariosAdmin = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newUsuario, setNewUsuario] = useState({ nombre: '', email: '' });

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsuarios();
  }, []);

  // Función para cargar usuarios desde la API
  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const data = await DatabaseService.getUsuarios();
      setUsuarios(data);
      setError(null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error al cargar usuarios:', err);
      setError('No se pudieron cargar los usuarios. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUsuario({
      ...newUsuario,
      [name]: value
    });
  };

  // Crear nuevo usuario
  const handleCreateUsuario = async (e) => {
    e.preventDefault();
    
    if (!newUsuario.nombre || !newUsuario.email) {
      setError('Nombre y email son requeridos');
      return;
    }

    try {
      await DatabaseService.createUsuario(newUsuario);
      // Limpiar formulario
      setNewUsuario({ nombre: '', email: '' });
      // Recargar lista
      loadUsuarios();
    } catch (err) {
      setError('Error al crear usuario: ' + err.message);
    }
  };

  // Eliminar usuario
  const handleDeleteUsuario = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await DatabaseService.deleteUsuario(id);
        // Recargar lista
        loadUsuarios();
      } catch (err) {
        setError('Error al eliminar usuario: ' + err.message);
      }
    }
  };

  return (
    <div className="usuarios-admin">
      <h2>Administración de Usuarios</h2>
      
      {/* Mostrar errores */}
      {error && (
        <div className="alert alert-danger">
          {error}
          <button onClick={() => setError(null)} className="ml-2">&times;</button>
        </div>
      )}
      
      {/* Formulario para crear usuarios */}
      <div className="card mb-4">
        <div className="card-header">
          Nuevo Usuario
        </div>
        <div className="card-body">
          <form onSubmit={handleCreateUsuario}>
            <div className="form-group mb-3">
              <label htmlFor="nombre">Nombre:</label>
              <input
                type="text"
                className="form-control"
                id="nombre"
                name="nombre"
                value={newUsuario.nombre}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group mb-3">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={newUsuario.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary">
              Crear Usuario
            </button>
          </form>
        </div>
      </div>
      
      {/* Lista de usuarios */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Lista de Usuarios</span>
          <button onClick={loadUsuarios} className="btn btn-sm btn-outline-secondary">
            Refrescar
          </button>
        </div>
        <div className="card-body">
          {loading ? (
            <p>Cargando usuarios...</p>
          ) : usuarios.length > 0 ? (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Fecha de Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.nombre}</td>
                    <td>{user.email}</td>
                    <td>{new Date(user.fecha_registro).toLocaleDateString()}</td>
                    <td>
                      <button 
                        onClick={() => handleDeleteUsuario(user.id)} 
                        className="btn btn-sm btn-danger"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay usuarios registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsuariosAdmin;