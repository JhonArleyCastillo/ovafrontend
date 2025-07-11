# Sistema de Tema Día/Noche Automático 🌓

## Descripción

El sistema de tema día/noche automático cambia automáticamente entre temas claro y oscuro basado en la hora local del usuario. La función principal `day_night()` detecta si es de día o de noche y aplica el tema correspondiente.

## Funcionalidad Principal

### Función `day_night()`
```javascript
const day_night = () => {
  const now = new Date();
  const hour = now.getHours();
  
  // Día: 6:00 AM - 6:00 PM (18:00)
  // Noche: 6:00 PM - 6:00 AM
  const isDayTime = hour >= 6 && hour < 18;
  
  return isDayTime ? 'light' : 'dark';
};
```

## Características

### ⏰ Detección Automática
- **Día (6:00 AM - 6:00 PM)**: Tema claro
- **Noche (6:00 PM - 6:00 AM)**: Tema oscuro
- **Actualización**: Cada minuto automáticamente
- **Zona horaria**: Basada en la configuración local del usuario

### 🎨 Temas Disponibles
1. **Automático** 🌓: Cambia según la hora
2. **Claro** ☀️: Tema día fijo
3. **Oscuro** 🌙: Tema noche fijo

### 💾 Persistencia
- Las preferencias se guardan en `localStorage`
- Se restaura la configuración al recargar la página
- El modo automático es el predeterminado

### 📱 Interfaz de Usuario
- **Selector en Sidebar**: Control manual del tema
- **Información en vivo**: Muestra hora actual y tema detectado
- **Feedback visual**: Indica el tema activo

## Uso

### Modo Automático (Predeterminado)
```javascript
// Se activa automáticamente al cargar la página
// No requiere configuración adicional
```

### Control Manual
```javascript
import useDayNightTheme from './hooks/useDayNightTheme';

const { theme, setTheme, day_night, getThemeInfo } = useDayNightTheme();

// Cambiar a tema específico
setTheme('light');  // Tema claro
setTheme('dark');   // Tema oscuro
setTheme('auto');   // Volver a automático

// Obtener información actual
const info = getThemeInfo();
console.log(info.currentTime);        // "2:30 PM"
console.log(info.autoDetectedTheme);  // "light" o "dark"
console.log(info.isDay);              // true/false
console.log(info.activeTheme);        // tema actualmente aplicado
```

### Acceso Global (Desarrollo)
```javascript
// En modo desarrollo, estas funciones están disponibles globalmente:
window.day_night();     // Obtener tema automático
window.setTheme('dark'); // Cambiar tema
window.getThemeInfo();   // Información del tema
```

## Personalización

### Variables CSS
El sistema usa variables CSS que se pueden personalizar:

```css
:root {
  /* Tema claro */
  --bg-primary: #ffffff;
  --text-primary: #212529;
  --sidebar-active: #1f6feb;
  
  /* Tema oscuro */
  --bg-primary: #0d1117;
  --text-primary: #f0f6fc;
  --sidebar-active: #1f6feb;
}
```

### Horarios Personalizados
Para cambiar los horarios de día/noche, modifica la función `day_night()`:

```javascript
const day_night = () => {
  const now = new Date();
  const hour = now.getHours();
  
  // Ejemplo: Día de 7:00 AM a 7:00 PM
  const isDayTime = hour >= 7 && hour < 19;
  
  return isDayTime ? 'light' : 'dark';
};
```

## Eventos y Actualizaciones

### Actualización Automática
- **Intervalo**: Cada 60 segundos
- **Visibilidad**: Se actualiza cuando la página vuelve a estar visible
- **Cambio de hora**: Detecta automáticamente cambios de día/noche

### Eventos del Sistema
```javascript
// El hook maneja automáticamente:
// - Cambios de visibilidad de página
// - Intervalos de actualización
// - Persistencia en localStorage
// - Aplicación de temas al DOM
```

## Compatibilidad

### Navegadores
- ✅ Chrome/Edge (moderno)
- ✅ Firefox
- ✅ Safari
- ✅ Navegadores móviles

### Accesibilidad
- ✅ Soporte para `prefers-reduced-motion`
- ✅ Navegación por teclado
- ✅ Focus visible
- ✅ ARIA labels

### Rendimiento
- ✅ Actualización eficiente (solo cuando es necesario)
- ✅ Cleanup automático de intervalos
- ✅ Detección de cambios de visibilidad
- ✅ Variables CSS nativas (GPU optimizadas)

## Ejemplos de Integración

### En Componentes React
```jsx
import useDayNightTheme from './hooks/useDayNightTheme';

const MyComponent = () => {
  const { theme, isAutoMode } = useDayNightTheme();
  
  return (
    <div className={`my-component ${theme}-theme`}>
      <p>Tema actual: {theme}</p>
      <p>Modo automático: {isAutoMode ? 'Sí' : 'No'}</p>
    </div>
  );
};
```

### CSS Condicional
```css
/* Estilos que se adaptan automáticamente */
.my-element {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}
```

## Debugging

### Información de Debug (Desarrollo)
```javascript
// En modo desarrollo, aparece un indicador visual con:
// - Hora actual
// - Tema activo
// - Modo (automático/manual)
// - Estado día/noche
```

### Console Logs
```javascript
// Al inicializar, se muestra en consola:
// "🌓 Sistema de tema día/noche iniciado"
// "🕐 Hora actual: 2:30 PM"
// "🎨 Tema detectado: light"
```

## Próximas Mejoras

- 🔄 Detección de zona horaria específica
- 🌅 Transiciones basadas en amanecer/atardecer
- 📍 Integración con geolocalización
- ⚙️ Configuración personalizable de horarios
- 🎨 Más variantes de temas
