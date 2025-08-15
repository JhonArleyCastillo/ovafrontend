/**
 * MÉTRICAS DE RENDIMIENTO (Web Vitals) – Monitor en Producción / Desarrollo
 *
 * Este helper permite capturar las Web Vitals claves del front y enviarlas a:
 * - La consola (durante desarrollo, para entender rendimiento)
 * - Un endpoint propio / servicio externo (Sentry, LogRocket, Prometheus Gateway, etc.)
 *
 * MÉTRICAS PRINCIPALES QUE REGISTRA:
 * - CLS (Cumulative Layout Shift): Estabilidad visual. Ideal < 0.1
 * - FID (First Input Delay): Tiempo hasta que la app responde a la primera interacción. Ideal < 100ms
 * - FCP (First Contentful Paint): Primer contenido visible. Menor es mejor (<1.8s ideal)
 * - LCP (Largest Contentful Paint): Render principal. Ideal < 2.5s
 * - TTFB (Time To First Byte): Latencia inicial del servidor
 *
 * USO PRÁCTICO:
 * En index.js:
 *   if (process.env.NODE_ENV === 'development') {
 *     reportWebVitals(console.log); // Observas métricas en consola
 *   }
 *
 * En producción podrías hacer:
 *   reportWebVitals((metric) => {
 *     fetch('/api/metrics', { method: 'POST', body: JSON.stringify(metric) });
 *   });
 *
 * @param {(metric: import('web-vitals').Metric) => void} onPerfEntry Callback para recibir cada métrica
 */
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Cada función captura la métrica y ejecuta el callback provisto
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
