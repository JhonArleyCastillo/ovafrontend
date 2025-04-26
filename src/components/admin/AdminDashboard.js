import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/auth.service';

/**
 * Panel de administración principal
 * Muestra información y opciones disponibles para los administradores
 */
function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar autenticación al cargar
    const currentAdmin = AuthService.getCurrentAdmin();
    
    if (!currentAdmin) {
      // Redireccionar si no hay sesión
      navigate('/admin/login');
      return;
    }
    
    setAdmin(currentAdmin);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (!admin) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100">
      {/* Barra de navegación superior */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container-fluid">
          <a className="navbar-brand" href="/admin/dashboard">Panel de Administración</a>
          <div className="navbar-nav ms-auto">
            <div className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i className="bi bi-person-circle me-1"></i>
                {admin.sub || 'Administrador'}
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); }}>Mi perfil</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Cerrar sesión</a></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="container-fluid">
        <div className="row">
          {/* Sidebar */}
          <div className="col-md-3 col-lg-2 d-md-block bg-white shadow-sm sidebar p-0">
            <div className="list-group list-group-flush">
              <a href="#" className="list-group-item list-group-item-action active py-3" aria-current="true">
                <i className="bi bi-speedometer2 me-2"></i>
                Dashboard
              </a>
              <a href="#" className="list-group-item list-group-item-action py-3">
                <i className="bi bi-people me-2"></i>
                Usuarios
              </a>
              <a href="#" className="list-group-item list-group-item-action py-3">
                <i className="bi bi-gear me-2"></i>
                Configuración
              </a>
              <a href="#" className="list-group-item list-group-item-action py-3">
                <i className="bi bi-bar-chart me-2"></i>
                Estadísticas
              </a>
            </div>
          </div>

          {/* Contenido principal */}
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
              <h1 className="h2">Dashboard</h1>
              <div className="btn-toolbar mb-2 mb-md-0">
                <div className="btn-group me-2">
                  <button type="button" className="btn btn-sm btn-outline-secondary">Exportar</button>
                </div>
                <button type="button" className="btn btn-sm btn-outline-secondary dropdown-toggle">
                  <i className="bi bi-calendar me-1"></i>
                  Esta semana
                </button>
              </div>
            </div>

            <div className="row my-4">
              <div className="col-12">
                <h2 className="h4">Bienvenido al Panel de Administración</h2>
                <p className="text-muted">Desde aquí podrás gestionar todos los aspectos de la aplicación.</p>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="card-title mb-0">Usuarios Activos</h5>
                      <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                        <i className="bi bi-people text-primary"></i>
                      </div>
                    </div>
                    <h2 className="display-6 fw-bold">120</h2>
                    <p className="card-text text-success">
                      <i className="bi bi-arrow-up me-1"></i>
                      12% desde el mes pasado
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="card-title mb-0">Consultas Hoy</h5>
                      <div className="bg-success bg-opacity-10 p-2 rounded-circle">
                        <i className="bi bi-chat-dots text-success"></i>
                      </div>
                    </div>
                    <h2 className="display-6 fw-bold">45</h2>
                    <p className="card-text text-success">
                      <i className="bi bi-arrow-up me-1"></i>
                      5% desde ayer
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="card-title mb-0">Consultas Totales</h5>
                      <div className="bg-info bg-opacity-10 p-2 rounded-circle">
                        <i className="bi bi-bar-chart text-info"></i>
                      </div>
                    </div>
                    <h2 className="display-6 fw-bold">1,250</h2>
                    <p className="card-text text-success">
                      <i className="bi bi-arrow-up me-1"></i>
                      20% desde el mes pasado
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white">
                <h5 className="card-title mb-0">Actividad Reciente</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Usuario</th>
                        <th scope="col">Actividad</th>
                        <th scope="col">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">1</th>
                        <td>Usuario1</td>
                        <td>Inicio de sesión</td>
                        <td>Hoy, 10:30 AM</td>
                      </tr>
                      <tr>
                        <th scope="row">2</th>
                        <td>Usuario2</td>
                        <td>Consulta realizada</td>
                        <td>Hoy, 9:15 AM</td>
                      </tr>
                      <tr>
                        <th scope="row">3</th>
                        <td>Usuario3</td>
                        <td>Subida de imagen</td>
                        <td>Ayer, 4:45 PM</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;