import {
  Droplet,
  Bug,
  Dna,
  Microscope,
  TestTube,
  ClipboardCheck,
  ScanLine,
} from 'lucide-react';
import './Services.css';

function Services() {
  const services = [
    {
      title: 'Blood Tests',
      description: 'Accurate blood testing to help assess different aspects of your health.',
      icon: <Droplet />,
    },
    {
      title: 'Malaria Test',
      description: 'Reliable malaria screening to help detect malaria infection.',
      icon: <Bug />,
    },
    {
      title: 'Genotype Test',
      description: 'Genotype testing to help determine your haemoglobin genotype.',
      icon: <Dna />,
    },
    {
      title: 'Microscopy',
      description: 'Laboratory examination of samples using microscopic techniques.',
      icon: <Microscope />,
    },
    {
      title: 'Urinalysis',
      description: 'Urine testing that helps provide useful information about your health.',
      icon: <TestTube />,
    },
    {
      title: 'Ultrasound Test',
      description: 'Non-invasive ultrasound imaging to examine internal organs and monitor health conditions.',
      icon: <ScanLine />,
    },
    {
      title: 'Screening Tests',
      description: 'Routine screening tests for early detection of health conditions.',
      icon: <ClipboardCheck />,
    },
  ];

  return (
    <section className="services" id="services">
      <div className="services-heading">
        <div>
          <p className="section-subtitle">OUR SERVICES</p>
          <h2>
            Laboratory Services You Can <span>Rely On</span>
          </h2>
        </div>
        <p className="services-intro">
          We provide a range of laboratory testing services with a focus on accuracy,
          reliability and professional care.
        </p>
      </div>

      <div className="services-grid">
        {services.map((service, index) => (
          <div className="service-card" key={index}>
            <div className="service-icon">{service.icon}</div>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <a href="#booking">Learn More</a>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Services;
