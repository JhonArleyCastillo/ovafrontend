import React from 'react';
import { image5, image6, image7, image8 } from '../images';

/**
 * Componente que muestra los servicios ofrecidos por OVA
 * Diseñado con un enfoque limpio y explícito para diferentes tipos de clientes
 */
const ServicesSection = () => (
  <section className="services-section py-5">
    {/* Banner de servicios */}
    <div className="container mb-5">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold text-primary mb-3">Nuestros Servicios</h1>
        <p className="lead text-muted col-lg-8 mx-auto">
          Soluciones de inteligencia artificial personalizadas para impulsar el crecimiento y la innovación en tu empresa o proyecto
        </p>
      </div>

      {/* Consultoría de IA */}
      <div className="row g-4 mb-5">
        <div className="col-md-6">
          <div className="h-100 p-5 bg-light rounded-3 shadow-sm">
            <h2 className="fw-bold">Consultoría de IA</h2>
            <p className="mb-4">Asesoramos a organizaciones en la implementación de estrategias de inteligencia artificial, identificando oportunidades y elaborando hojas de ruta para la adopción de estas tecnologías.</p>
            <ul className="list-unstyled mb-4">
              <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Evaluación de necesidades y oportunidades</li>
              <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Definición de estrategia de IA</li>
              <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Asesoría en selección de tecnologías</li>
              <li><i className="bi bi-check-circle-fill text-success me-2"></i>Capacitación en IA para equipos</li>
            </ul>
            <button className="btn btn-outline-primary" type="button" data-bs-toggle="modal" data-bs-target="#consultoriaModal">Más detalles</button>
          </div>
        </div>        <div className="col-md-6 d-flex align-items-center">
          <div className="d-flex flex-column align-items-center w-100">
            <img 
              src={image5} 
              alt="Consultoría de Inteligencia Artificial" 
              className="img-fluid rounded shadow-sm mb-3" 
              style={{ maxHeight: '250px', objectFit: 'cover' }}
            />
            <p className="text-center">Transformamos ideas en soluciones concretas usando inteligencia artificial</p>
          </div>
        </div>
      </div>

      {/* Desarrollo a Medida */}
      <div className="row g-4 mb-5">
        <div className="col-md-6 order-md-2">
          <div className="h-100 p-5 bg-light rounded-3 shadow-sm">
            <h2 className="fw-bold">Desarrollo a Medida</h2>
            <p className="mb-4">Creamos aplicaciones y sistemas personalizados que integran inteligencia artificial para resolver problemas específicos de tu negocio.</p>
            <ul className="list-unstyled mb-4">
              <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Asistentes virtuales personalizados</li>
              <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Sistemas de reconocimiento de imágenes</li>
              <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Procesamiento de lenguaje natural</li>
              <li><i className="bi bi-check-circle-fill text-success me-2"></i>Integración con sistemas existentes</li>
            </ul>
            <button className="btn btn-outline-primary" type="button" data-bs-toggle="modal" data-bs-target="#desarrolloModal">Más detalles</button>
          </div>
        </div>        <div className="col-md-6 order-md-1 d-flex align-items-center">
          <div className="d-flex flex-column align-items-center w-100">
            <img 
              src={image6} 
              alt="Desarrollo de Software a Medida" 
              className="img-fluid rounded shadow-sm mb-3" 
              style={{ maxHeight: '250px', objectFit: 'cover' }}
            />
            <p className="text-center">Software inteligente que se adapta a tus necesidades específicas</p>
          </div>
        </div>
      </div>

      {/* Análisis de Datos */}
      <div className="row g-4 mb-5">
        <div className="col-md-6">
          <div className="h-100 p-5 bg-light rounded-3 shadow-sm">
            <h2 className="fw-bold">Análisis de Datos</h2>
            <p className="mb-4">Transformamos tus datos en insights accionables mediante técnicas avanzadas de análisis y visualización, ayudándote a tomar decisiones basadas en evidencia.</p>
            <ul className="list-unstyled mb-4">
              <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Minería de datos y descubrimiento de patrones</li>
              <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Visualización avanzada de datos</li>
              <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Modelos predictivos y prescriptivos</li>
              <li><i className="bi bi-check-circle-fill text-success me-2"></i>Dashboards interactivos</li>
            </ul>
            <button className="btn btn-outline-primary" type="button" data-bs-toggle="modal" data-bs-target="#analisisModal">Más detalles</button>
          </div>
        </div>        <div className="col-md-6 d-flex align-items-center">
          <div className="d-flex flex-column align-items-center w-100">
            <img 
              src={image7} 
              alt="Análisis de Datos" 
              className="img-fluid rounded shadow-sm mb-3" 
              style={{ maxHeight: '250px', objectFit: 'cover' }}
            />
            <p className="text-center">Convierte datos en decisiones inteligentes para tu organización</p>
          </div>
        </div>
      </div>

      {/* Implementación de IA */}
      <div className="row g-4">
        <div className="col-md-6 order-md-2">
          <div className="h-100 p-5 bg-light rounded-3 shadow-sm">
            <h2 className="fw-bold">Implementación de IA para Empresas</h2>
            <p className="mb-4">Llevamos la IA a tu organización con soluciones llave en mano, integrando las tecnologías más avanzadas con tus procesos de negocio actuales.</p>
            <ul className="list-unstyled mb-4">
              <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Automatización de procesos con IA</li>
              <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Sistemas de recomendación personalizados</li>
              <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Chatbots y asistentes virtuales corporativos</li>
              <li><i className="bi bi-check-circle-fill text-success me-2"></i>Soluciones de visión artificial</li>
            </ul>
            <button className="btn btn-outline-primary" type="button" data-bs-toggle="modal" data-bs-target="#implementacionModal">Más detalles</button>
          </div>
        </div>        <div className="col-md-6 order-md-1 d-flex align-items-center">
          <div className="d-flex flex-column align-items-center w-100">
            <img 
              src={image8} 
              alt="Implementación de IA para Empresas" 
              className="img-fluid rounded shadow-sm mb-3" 
              style={{ maxHeight: '250px', objectFit: 'cover' }}
            />
            <p className="text-center">Inteligencia artificial integrada en tus operaciones diarias</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-5">
        <p className="lead">¿Necesitas una solución personalizada?</p>
        <a href="/contact" className="btn btn-primary btn-lg px-4">Contáctanos</a>
      </div>
    </div>

    {/* Modales con más información */}
    <div className="modal fade" id="consultoriaModal" tabIndex="-1" aria-labelledby="consultoriaModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="consultoriaModalLabel">Consultoría de Inteligencia Artificial</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <p>Nuestra consultoría de IA ofrece un enfoque integral que combina conocimiento técnico con comprensión del negocio:</p>
            <h6 className="fw-bold mt-4">Para Startups y Emprendedores</h6>
            <p>Te ayudamos a identificar cómo la IA puede convertirse en tu ventaja competitiva, con soluciones escalables que crecen con tu negocio.</p>
            
            <h6 className="fw-bold mt-4">Para Empresas Establecidas</h6>
            <p>Evaluamos tus procesos actuales y diseñamos estrategias para integrar IA de manera efectiva, maximizando el ROI y minimizando disrupciones.</p>
            
            <h6 className="fw-bold mt-4">Para el Sector Educativo</h6>
            <p>Creamos planes de implementación de IA que mejoran la experiencia educativa y optimizan procesos administrativos.</p>
            
            <h6 className="fw-bold mt-4">Metodología</h6>
            <ol>
              <li>Diagnóstico inicial y evaluación de madurez digital</li>
              <li>Identificación de casos de uso de alto impacto</li>
              <li>Diseño de estrategia y hoja de ruta</li>
              <li>Plan de implementación por fases</li>
              <li>Medición de resultados y optimización continua</li>
            </ol>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <a href="/contact" className="btn btn-primary">Solicitar consultoría</a>
          </div>
        </div>
      </div>
    </div>
    
    <div className="modal fade" id="desarrolloModal" tabIndex="-1" aria-labelledby="desarrolloModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="desarrolloModalLabel">Desarrollo de Software a Medida</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <p>Diseñamos y desarrollamos soluciones de software innovadoras que incorporan las últimas tecnologías de IA:</p>
            
            <h6 className="fw-bold mt-4">Tipos de Soluciones</h6>
            <ul>
              <li><strong>Chatbots y Asistentes Virtuales:</strong> Automatiza atención al cliente y procesos internos</li>
              <li><strong>Sistemas de Procesamiento de Documentos:</strong> Extracción automática de información de documentos</li>
              <li><strong>Análisis de Sentimiento:</strong> Monitoreo de redes sociales y feedback de clientes</li>
              <li><strong>Reconocimiento Visual:</strong> Identificación de objetos, personas o situaciones en imágenes y videos</li>
            </ul>
            
            <h6 className="fw-bold mt-4">Proceso de Desarrollo</h6>
            <ol>
              <li>Definición de requerimientos y alcance</li>
              <li>Diseño de arquitectura y prototipado</li>
              <li>Desarrollo iterativo con feedback continuo</li>
              <li>Pruebas y control de calidad</li>
              <li>Implementación y capacitación</li>
              <li>Soporte y mantenimiento continuo</li>
            </ol>
            
            <h6 className="fw-bold mt-4">Tecnologías</h6>
            <p>Utilizamos frameworks modernos y librerías especializadas en IA como TensorFlow, PyTorch, Hugging Face, y más, siempre adaptándonos a las necesidades específicas de cada proyecto.</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <a href="/contact" className="btn btn-primary">Solicitar desarrollo</a>
          </div>
        </div>
      </div>
    </div>
    
    <div className="modal fade" id="analisisModal" tabIndex="-1" aria-labelledby="analisisModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="analisisModalLabel">Análisis de Datos</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <p>Convertimos tus datos en un activo estratégico para la toma de decisiones informadas:</p>
            
            <h6 className="fw-bold mt-4">Servicios de Análisis</h6>
            <ul>
              <li><strong>Análisis Descriptivo:</strong> Entender qué ha sucedido y por qué</li>
              <li><strong>Análisis Predictivo:</strong> Anticipar eventos futuros mediante modelos estadísticos y machine learning</li>
              <li><strong>Análisis Prescriptivo:</strong> Recomendaciones sobre acciones a tomar</li>
              <li><strong>Visualización de Datos:</strong> Dashboards interactivos para monitoreo en tiempo real</li>
            </ul>
            
            <h6 className="fw-bold mt-4">Aplicaciones por Sector</h6>
            <ul>
              <li><strong>Retail:</strong> Optimización de inventario, personalización de ofertas</li>
              <li><strong>Finanzas:</strong> Detección de fraude, análisis de riesgo</li>
              <li><strong>Salud:</strong> Predicción de resultados clínicos, optimización de recursos</li>
              <li><strong>Manufactura:</strong> Mantenimiento predictivo, control de calidad</li>
              <li><strong>Educación:</strong> Análisis de rendimiento, personalización de aprendizaje</li>
            </ul>
            
            <h6 className="fw-bold mt-4">Metodología</h6>
            <ol>
              <li>Recolección y limpieza de datos</li>
              <li>Exploración y análisis preliminar</li>
              <li>Construcción de modelos y validación</li>
              <li>Visualización y comunicación de resultados</li>
              <li>Implementación de soluciones basadas en datos</li>
            </ol>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <a href="/contact" className="btn btn-primary">Solicitar análisis</a>
          </div>
        </div>
      </div>
    </div>
    
    <div className="modal fade" id="implementacionModal" tabIndex="-1" aria-labelledby="implementacionModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="implementacionModalLabel">Implementación de IA para Empresas</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <p>Integramos soluciones de IA en tus operaciones diarias, con un enfoque práctico y orientado a resultados:</p>
            
            <h6 className="fw-bold mt-4">Soluciones Empresariales</h6>
            <ul>
              <li><strong>Automatización Inteligente:</strong> Reducción de tareas manuales y repetitivas</li>
              <li><strong>IA para Atención al Cliente:</strong> Chatbots, análisis de llamadas, personalización</li>
              <li><strong>Visión Artificial:</strong> Control de calidad, seguridad, monitoreo</li>
              <li><strong>Optimización de Procesos:</strong> Mejora continua basada en análisis de datos</li>
              <li><strong>Sistemas de Recomendación:</strong> Para clientes, productos o contenido</li>
            </ul>
            
            <h6 className="fw-bold mt-4">Beneficios</h6>
            <ul>
              <li>Reducción de costos operativos</li>
              <li>Mejora en la experiencia del cliente</li>
              <li>Optimización de recursos</li>
              <li>Toma de decisiones más rápida y precisa</li>
              <li>Ventaja competitiva en el mercado</li>
            </ul>
            
            <h6 className="fw-bold mt-4">Proceso de Implementación</h6>
            <ol>
              <li>Evaluación de infraestructura actual</li>
              <li>Selección de tecnologías apropiadas</li>
              <li>Desarrollo e integración con sistemas existentes</li>
              <li>Pruebas piloto en entornos controlados</li>
              <li>Despliegue gradual y capacitación</li>
              <li>Monitoreo y mejora continua</li>
            </ol>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <a href="/contact" className="btn btn-primary">Solicitar implementación</a>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ServicesSection;
