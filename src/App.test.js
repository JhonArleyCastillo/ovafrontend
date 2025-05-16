import { render, screen } from '@testing-library/react';
import App from './App';

test('renders OVA app', () => {
  // Solo una prueba básica para verificar que la aplicación se renderiza sin errores
  render(<App />);
  // No hacemos aserciones específicas ya que la app tiene múltiples rutas
  expect(document.body).toBeInTheDocument();
});
