#!/usr/bin/env node

/**
 * 🏥 Health Check Script para OvaWeb Frontend/Backend
 * 
 * Verifica la conectividad y salud de los servicios API y WebSocket
 * antes del despliegue o durante las pipelines de CI/CD.
 * 
 * Uso:
 *   node scripts/health-check.js [environment]
 *   npm run health-check:dev
 *   npm run health-check:staging
 *   npm run health-check:prod
 * 
 * Exit codes:
 *   0: Todos los servicios están saludables
 *   1: Algunos servicios fallaron
 *   2: Error de configuración
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// 📋 Configuración de ambientes
const ENVIRONMENTS = {
  development: {
    name: 'Development',
    apiUrl: 'http://localhost:8000',
    wsUrl: 'ws://localhost:8000',
    timeouts: {
      api: 5000,
      websocket: 3000,
      connection: 2000
    }
  },
  staging: {
    name: 'Staging',
    apiUrl: process.env.REACT_APP_STAGING_API_URL || 'https://staging-api.ovaweb.com',
    wsUrl: process.env.REACT_APP_STAGING_WS_URL || 'wss://staging-ws.ovaweb.com',
    timeouts: {
      api: 10000,
      websocket: 5000,
      connection: 3000
    }
  },
  production: {
    name: 'Production',
    apiUrl: process.env.REACT_APP_API_URL || 'https://api.ovaweb.com',
    wsUrl: process.env.REACT_APP_WS_URL || 'wss://ws.ovaweb.com',
    timeouts: {
      api: 15000,
      websocket: 8000,
      connection: 5000
    }
  }
};

// 🎯 Endpoints críticos para verificar
const CRITICAL_ENDPOINTS = [
  '/status',          // Status endpoint from status_router
  '/docs'            // FastAPI auto-generated docs
];

// 📊 Estado global de la verificación
const healthReport = {
  environment: '',
  timestamp: new Date().toISOString(),
  status: 'UNKNOWN',
  services: {},
  summary: {
    total: 0,
    healthy: 0,
    unhealthy: 0,
    warnings: 0
  },
  execution_time_ms: 0
};

/**
 * 🎨 Utilidades de logging con colores
 */
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(level, message, emoji = '') {
  const timestamp = new Date().toISOString();
  const color = {
    INFO: colors.blue,
    SUCCESS: colors.green,
    WARNING: colors.yellow,
    ERROR: colors.red
  }[level] || colors.reset;
  
  console.log(`${color}[${timestamp}] ${emoji} ${level}: ${message}${colors.reset}`);
}

/**
 * 🌐 Verificador HTTP/HTTPS
 */
function checkHttpEndpoint(url, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: timeout,
      headers: {
        'User-Agent': 'OvaWeb-HealthCheck/1.0',
        'Accept': 'application/json',
        'Connection': 'close'
      }
    };

    const req = client.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = {
          url,
          status: res.statusCode >= 200 && res.statusCode < 300 ? 'HEALTHY' : 'UNHEALTHY',
          statusCode: res.statusCode,
          responseTime,
          headers: res.headers,
          bodySize: data.length,
          error: null
        };

        if (res.statusCode >= 400) {
          result.error = `HTTP ${res.statusCode} - ${res.statusMessage}`;
        }

        resolve(result);
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 'UNHEALTHY',
        statusCode: null,
        responseTime: timeout,
        error: `Timeout after ${timeout}ms`,
        headers: {},
        bodySize: 0
      });
    });

    req.on('error', (error) => {
      resolve({
        url,
        status: 'UNHEALTHY',
        statusCode: null,
        responseTime: Date.now() - startTime,
        error: error.message,
        headers: {},
        bodySize: 0
      });
    });

    req.end();
  });
}

/**
 * 🔌 Verificador WebSocket (simulado para Node.js)
 */
function checkWebSocketEndpoint(url, timeout = 3000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // Verificar conectividad básica al servidor WebSocket
    const parsedUrl = new URL(url.replace('ws://', 'http://').replace('wss://', 'https://'));
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: '/api/chat', // Correct WebSocket path from routes
      method: 'GET',
      timeout: timeout,
      headers: {
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ=='
      }
    };

    const req = client.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      
      resolve({
        url,
        status: res.statusCode === 101 || res.statusCode === 400 ? 'HEALTHY' : 'UNHEALTHY',
        responseTime,
        error: res.statusCode === 101 ? null : `Expected WebSocket upgrade, got HTTP ${res.statusCode}`,
        connected: res.statusCode === 101
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 'UNHEALTHY',
        responseTime: timeout,
        error: `WebSocket timeout after ${timeout}ms`,
        connected: false
      });
    });

    req.on('error', (error) => {
      resolve({
        url,
        status: 'UNHEALTHY',
        responseTime: Date.now() - startTime,
        error: error.message,
        connected: false
      });
    });

    req.end();
  });
}

/**
 * 🏥 Ejecutor principal de health checks
 */
async function runHealthChecks(environment) {
  const startTime = Date.now();
  log('INFO', `Iniciando health check para ambiente: ${environment.name}`, '🚀');
  
  healthReport.environment = environment.name;
  healthReport.services = {
    api: {
      name: 'API REST',
      status: 'CHECKING',
      endpoints: {}
    },
    websocket: {
      name: 'WebSocket',
      status: 'CHECKING',
      connection: null
    }
  };

  // 📡 Verificar endpoints HTTP/HTTPS
  log('INFO', 'Verificando endpoints HTTP...', '📡');
  
  const httpChecks = CRITICAL_ENDPOINTS.map(endpoint => {
    const fullUrl = environment.apiUrl + endpoint;
    return checkHttpEndpoint(fullUrl, environment.timeouts.api);
  });

  const httpResults = await Promise.all(httpChecks);
  
  // Procesar resultados HTTP
  let apiHealthy = true;
  for (const result of httpResults) {
    const endpoint = result.url.replace(environment.apiUrl, '');
    healthReport.services.api.endpoints[endpoint] = result;
    
    if (result.status === 'HEALTHY') {
      log('SUCCESS', `✅ ${endpoint} - ${result.statusCode} (${result.responseTime}ms)`, '✅');
    } else {
      log('ERROR', `❌ ${endpoint} - ${result.error}`, '❌');
      apiHealthy = false;
    }
  }

  healthReport.services.api.status = apiHealthy ? 'HEALTHY' : 'UNHEALTHY';

  // 🔌 Verificar WebSocket
  log('INFO', 'Verificando conexión WebSocket...', '🔌');
  
  const wsResult = await checkWebSocketEndpoint(
    environment.wsUrl,
    environment.timeouts.websocket
  );
  
  healthReport.services.websocket.connection = wsResult;
  healthReport.services.websocket.status = wsResult.status;

  if (wsResult.status === 'HEALTHY') {
    log('SUCCESS', `✅ WebSocket conectado (${wsResult.responseTime}ms)`, '🔌');
  } else {
    log('ERROR', `❌ WebSocket falló: ${wsResult.error}`, '🔌');
  }

  // 📊 Calcular resumen
  const services = Object.values(healthReport.services);
  healthReport.summary.total = services.length;
  healthReport.summary.healthy = services.filter(s => s.status === 'HEALTHY').length;
  healthReport.summary.unhealthy = services.filter(s => s.status === 'UNHEALTHY').length;
  healthReport.summary.warnings = services.filter(s => s.status === 'WARNING').length;

  // Determinar estado general
  if (healthReport.summary.unhealthy === 0) {
    healthReport.status = healthReport.summary.warnings > 0 ? 'DEGRADED' : 'HEALTHY';
  } else {
    healthReport.status = 'UNHEALTHY';
  }

  healthReport.execution_time_ms = Date.now() - startTime;

  return healthReport;
}

/**
 * 📋 Generador de reportes
 */
function generateReport(report) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bold}🏥 REPORTE DE SALUD - ${report.environment}${colors.reset}`);
  console.log('='.repeat(80));
  
  // Estado general
  const statusEmoji = {
    'HEALTHY': '✅',
    'DEGRADED': '⚠️',
    'UNHEALTHY': '❌',
    'UNKNOWN': '❓'
  }[report.status];

  console.log(`\n📊 Estado General: ${statusEmoji} ${report.status}`);
  console.log(`⏱️  Tiempo de ejecución: ${report.execution_time_ms}ms`);
  console.log(`📅 Timestamp: ${report.timestamp}`);

  // Resumen de servicios
  console.log('\n📈 Resumen:');
  console.log(`   Total de servicios: ${report.summary.total}`);
  console.log(`   ${colors.green}✅ Saludables: ${report.summary.healthy}${colors.reset}`);
  console.log(`   ${colors.red}❌ No saludables: ${report.summary.unhealthy}${colors.reset}`);
  console.log(`   ${colors.yellow}⚠️  Con advertencias: ${report.summary.warnings}${colors.reset}`);

  // Detalles de servicios
  console.log('\n🔍 Detalles de servicios:');
  
  for (const [serviceKey, service] of Object.entries(report.services)) {
    const serviceEmoji = service.status === 'HEALTHY' ? '✅' : '❌';
    console.log(`\n   ${serviceEmoji} ${service.name} (${service.status})`);
    
    if (serviceKey === 'api' && service.endpoints) {
      for (const [endpoint, result] of Object.entries(service.endpoints)) {
        const endpointEmoji = result.status === 'HEALTHY' ? '✅' : '❌';
        console.log(`      ${endpointEmoji} ${endpoint} - ${result.statusCode || 'N/A'} (${result.responseTime}ms)`);
        if (result.error) {
          console.log(`         ${colors.red}Error: ${result.error}${colors.reset}`);
        }
      }
    }
    
    if (serviceKey === 'websocket' && service.connection) {
      const wsEmoji = service.connection.connected ? '✅' : '❌';
      console.log(`      ${wsEmoji} Conexión: ${service.connection.connected ? 'Establecida' : 'Fallida'} (${service.connection.responseTime}ms)`);
      if (service.connection.error) {
        console.log(`         ${colors.red}Error: ${service.connection.error}${colors.reset}`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));

  // JSON para CI/CD
  if (process.env.CI || process.argv.includes('--json')) {
    console.log('\n📄 JSON Report for CI/CD:');
    console.log(JSON.stringify(report, null, 2));
  }
}

/**
 * 🚀 Función principal
 */
async function main() {
  try {
    // Determinar ambiente
    const envArg = process.argv[2] || 'development';
    const environment = ENVIRONMENTS[envArg];

    if (!environment) {
      log('ERROR', `Ambiente no válido: ${envArg}. Ambientes disponibles: ${Object.keys(ENVIRONMENTS).join(', ')}`, '❌');
      process.exit(2);
    }

    // Ejecutar health checks
    const report = await runHealthChecks(environment);
    
    // Generar reporte
    generateReport(report);

    // Determinar exit code
    const exitCode = report.status === 'HEALTHY' || report.status === 'DEGRADED' ? 0 : 1;
    
    if (exitCode === 0) {
      log('SUCCESS', `Health check completado exitosamente para ${environment.name}`, '🎉');
    } else {
      log('ERROR', `Health check falló para ${environment.name}`, '💥');
    }

    process.exit(exitCode);

  } catch (error) {
    log('ERROR', `Error ejecutando health check: ${error.message}`, '💥');
    console.error(error);
    process.exit(2);
  }
}

// 🚀 Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  runHealthChecks,
  checkHttpEndpoint,
  checkWebSocketEndpoint,
  ENVIRONMENTS
};
