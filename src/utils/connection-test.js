/**
 * Utilidad para diagnosticar problemas de conexión
 */
import { API_BASE_URL, API_ROUTES } from '../config/constants';

/**
 * Realiza una prueba completa de conexión y devuelve resultados detallados
 * @returns {Promise<Object>} - Resultados de las pruebas
 */
export const runConnectionDiagnostic = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    }
  };

  // 1. Verificar si el navegador está online
  results.tests.browserOnline = {
    name: 'Estado de conexión del navegador',
    passed: window.navigator.onLine,
    details: window.navigator.onLine ? 'El navegador está online' : 'El navegador está offline'
  };

  // 2. Prueba de estado del servidor
  try {
    const statusUrl = `${API_BASE_URL}${API_ROUTES.STATUS}`;
    console.log(`Probando conexión a: ${statusUrl}`);
    
    const startTime = performance.now();
    const response = await fetch(statusUrl, { 
      mode: 'cors',
      cache: 'no-cache' 
    });
    const endTime = performance.now();
    
    const responseTime = Math.round(endTime - startTime);
    const responseData = await response.json();
    
    results.tests.statusEndpoint = {
      name: 'Conexión al endpoint de estado',
      passed: response.ok,
      responseTime: `${responseTime}ms`,
      status: response.status,
      statusText: response.statusText,
      details: response.ok 
        ? `Conexión exitosa en ${responseTime}ms` 
        : `Error de conexión: ${response.status} ${response.statusText}`,
      data: responseData
    };
  } catch (error) {
    results.tests.statusEndpoint = {
      name: 'Conexión al endpoint de estado',
      passed: false,
      details: `Error: ${error.message}`,
      error: error.toString()
    };
  }

  // 3. Prueba de WebSocket
  try {
    let wsUrl = '';
    if (API_BASE_URL.startsWith('https://')) {
      wsUrl = `${API_BASE_URL.replace('https://', 'wss://')}${API_ROUTES.CHAT_WS}`;
    } else if (API_BASE_URL.startsWith('http://')) {
      wsUrl = `${API_BASE_URL.replace('http://', 'ws://')}${API_ROUTES.CHAT_WS}`;
    }

    console.log(`Probando conexión WebSocket a: ${wsUrl}`);
    
    const wsConnectionResult = await new Promise((resolve) => {
      const ws = new WebSocket(wsUrl);
      
      const timeoutId = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          resolve({
            passed: false,
            details: 'Timeout - No se pudo establecer conexión en 5 segundos'
          });
        }
      }, 5000);
      
      ws.onopen = () => {
        clearTimeout(timeoutId);
        ws.close();
        resolve({
          passed: true,
          details: 'Conexión WebSocket establecida correctamente'
        });
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeoutId);
        resolve({
          passed: false,
          details: 'Error al conectar WebSocket',
          error: 'Error de conexión WebSocket'
        });
      };
    });
    
    results.tests.webSocketConnection = {
      name: 'Prueba de conexión WebSocket',
      passed: wsConnectionResult.passed,
      details: wsConnectionResult.details,
      url: wsUrl
    };
  } catch (error) {
    results.tests.webSocketConnection = {
      name: 'Prueba de conexión WebSocket',
      passed: false,
      details: `Error: ${error.message}`,
      error: error.toString()
    };
  }

  // Calcular resumen
  results.summary.totalTests = Object.keys(results.tests).length;
  results.summary.passedTests = Object.values(results.tests).filter(test => test.passed).length;
  results.summary.failedTests = results.summary.totalTests - results.summary.passedTests;
  results.summary.allTestsPassed = results.summary.failedTests === 0;

  return results;
};

/**
 * Ejecuta el diagnóstico y muestra los resultados en consola
 */
export const logConnectionDiagnostic = async () => {
  console.log('🔍 Iniciando diagnóstico de conexión...');
  const results = await runConnectionDiagnostic();
  
  console.group('📊 Resultados del diagnóstico de conexión');
  console.log(`⏱️ Timestamp: ${results.timestamp}`);
  console.log(`✅ Pruebas exitosas: ${results.summary.passedTests}/${results.summary.totalTests}`);
  
  // Mostrar cada prueba
  Object.entries(results.tests).forEach(([key, test]) => {
    console.group(`${test.passed ? '✅' : '❌'} ${test.name}`);
    console.log(`Estado: ${test.passed ? 'Exitoso' : 'Fallido'}`);
    console.log(`Detalles: ${test.details}`);
    if (test.responseTime) console.log(`Tiempo de respuesta: ${test.responseTime}`);
    if (test.data) console.log('Datos:', test.data);
    if (test.error) console.log(`Error: ${test.error}`);
    console.groupEnd();
  });
  
  console.log(`Diagnóstico completo: ${results.summary.allTestsPassed ? '✅ Todo OK' : '❌ Hay problemas'}`);
  console.groupEnd();
  
  return results;
};

// Añadir al objeto window para poder ejecutarlo desde la consola del navegador
if (typeof window !== 'undefined') {
  window.testConnection = logConnectionDiagnostic;
}

export default {
  runConnectionDiagnostic,
  logConnectionDiagnostic
}; 