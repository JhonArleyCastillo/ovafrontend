import React, { useEffect, useState } from 'react';
import { runConnectionDiagnostic } from '../utils/connection-test';

const Diagnostics = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await runConnectionDiagnostic();
        setResults(res);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) {
    return (
      <div className="container p-4">
        <h1 className="text-primary-theme">Diagnóstico de Conexión</h1>
        <p className="text-secondary-theme">Ejecutando pruebas...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="container p-4">
        <h1 className="text-primary-theme">Diagnóstico de Conexión</h1>
        <div className="alert alert-danger">No se pudieron obtener resultados.</div>
      </div>
    );
  }

  const { summary, tests } = results;

  return (
    <div className="container p-4">
  <h1 className="text-primary-theme">Diagnóstico de Conexión</h1>
      <div className={`alert ${summary.allTestsPassed ? 'alert-success' : 'alert-warning'}`}>
        <strong>Resumen:</strong> {summary.passedTests}/{summary.totalTests} pruebas exitosas
      </div>

      <div className="card">
        <div className="card-body">
          {Object.entries(tests).map(([key, test]) => (
            <div key={key} className="mb-3">
              <h5 className="mb-1 text-primary-theme">{test.name}</h5>
              <div>
                <span className={`badge ${test.passed ? 'bg-success' : 'bg-danger'}`}>{test.passed ? 'OK' : 'Fallo'}</span>
                {test.responseTime && <span className="badge bg-secondary ms-2">{test.responseTime}</span>}
              </div>
              <div className="small text-muted-theme mt-1">{test.details}</div>
              {test.url && <div className="small text-muted-theme">URL: {test.url}</div>}
              {test.error && <div className="small text-danger">Error: {test.error}</div>}
              {test.data && (
                <pre className="p-2 mt-2 small" style={{ whiteSpace: 'pre-wrap', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  {JSON.stringify(test.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Diagnostics;
