import React from 'react';
import { image1, image2, image3, image4 } from '../images';
import { CapabilitiesIcons } from './ui/IllustrationComponents';

/**
 * Sección "Sobre Nosotros" que presenta la visión y misión de la empresa,
 * así como sus valores y capacidades en el ámbito de la inteligencia artificial.
 */
const AboutUsSection = () => (
  <section className="about-us-section py-5 px-2 px-md-5 bg-hero-gradient">
    {/* Banner Hero */}
    <div className="text-center mb-5">
      <div className="position-relative mb-4">
        <img 
          src={image1} 
          alt="Banner Hero Corporativo" 
          className="img-fluid rounded shadow w-100" 
          style={{ maxHeight: '400px', objectFit: 'cover' }} 
        />
      </div>
  <h1 className="fw-bold display-5 mb-2 text-accent-purple">Impulsando el futuro con IA</h1>
  <p className="lead text-secondary-theme">Asistentes inteligentes para una nueva generación de creadores y programadores</p>
    </div>

    {/* Visión y Misión */}
    <div className="row align-items-center mb-5">
      <div className="col-md-6 mb-4 mb-md-0">
  <div className="bg-theme-secondary rounded shadow p-4 h-100">
          <h2 className="fw-bold text-accent-green">Nuestra Visión</h2>
          <p>Ser la comunidad líder en el desarrollo de asistentes inteligentes, inspirando a jóvenes y entusiastas de la IA a transformar el mundo con tecnología ética, inclusiva y creativa.</p>
          <h2 className="fw-bold mt-4 text-accent-pink">Nuestra Misión</h2>
          <p>Facilitar el acceso a soluciones de inteligencia artificial de vanguardia, empoderando a programadores y usuarios para crear, aprender y colaborar en un entorno digital seguro y responsable.</p>
        </div>
      </div>
      <div className="col-md-6 text-center">
        <img 
          src={image4} 
          alt="Equipo joven y diverso colaborando con IA" 
          className="img-fluid rounded shadow-sm" 
          style={{ maxHeight: '300px' }} 
        />
        <div className="mt-2 text-muted">Equipo joven y diverso colaborando con IA</div>
      </div>
    </div>

    {/* ¿Por qué IA? */}
    <div className="row align-items-center mb-5">
      <div className="col-md-6 order-2 order-md-1">
  <div className="bg-theme-secondary rounded shadow p-4 h-100">
          <h2 className="fw-bold text-accent-purple">¿Por qué IA?</h2>
          <p>La inteligencia artificial es el motor de la innovación actual. Con IA, potenciamos el lenguaje, la visión, la voz y la automatización para resolver desafíos reales y crear nuevas oportunidades para todos.</p>
          <CapabilitiesIcons />
        </div>
      </div>
      <div className="col-md-6 order-1 order-md-2 text-center mb-4 mb-md-0">
        <img 
          src={image3} 
          alt="Diagrama del proceso: Usuario  Asistente  IA  Solución" 
          className="img-fluid rounded shadow-sm" 
          style={{ maxHeight: '300px' }} 
        />
        <div className="mt-2 text-muted">Usuario  Asistente  IA  Solución</div>
      </div>
    </div>

    {/* Valores y Compromiso */}
    <div className="row mb-5">
      <div className="col-md-8 mx-auto">
  <div className="bg-theme-secondary rounded shadow p-4">
          <div className="row">
            <div className="col-md-3 text-center mb-3 mb-md-0">
              <img 
                src={image2}
                alt="Valores OVA" 
                className="img-fluid rounded-circle shadow-sm" 
                style={{ width: '120px', height: '120px', objectFit: 'cover' }} 
              />
            </div>
            <div className="col-md-9">
              <h2 className="fw-bold mb-3 text-accent-orange">Nuestros Valores</h2>
              <ul className="list-inline fs-5 mb-3">
                <li className="list-inline-item me-4"><span className="badge rounded-pill bg-primary">Innovación</span></li>
                <li className="list-inline-item me-4"><span className="badge rounded-pill bg-success">Ética</span></li>
                <li className="list-inline-item me-4"><span className="badge rounded-pill bg-info text-primary-theme">Inclusión</span></li>
                <li className="list-inline-item me-4"><span className="badge rounded-pill bg-warning text-primary-theme">Colaboración</span></li>
                <li className="list-inline-item"><span className="badge rounded-pill bg-danger">Responsabilidad</span></li>
              </ul>
              <p className="mb-0">Nos comprometemos a inspirar, educar y acompañar a la próxima generación de creadores de IA, promoviendo el desarrollo responsable y el impacto positivo en la sociedad.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Call to Action */}
    <div className="text-center mt-4">
      <a href="/chat" className="btn btn-lg btn-primary px-5 py-3 fw-bold shadow">Únete a la revolución IA</a>
    </div>
  </section>
);

export default AboutUsSection;
