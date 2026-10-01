import { 
    Check,
    Plus
    
} from 'lucide-react';
import './About.css';



function About() {
  return (
    <section className="about" id="about">
      <div className="about-image">
        <div className="about-card">
          <div className="about-icon">
            <Plus />
          </div>
          <h3>Quality Diagnostics</h3>
          <p>Accurate testing. Reliable results.</p>
        </div>

        <div className="experience-card">
          <strong>100%</strong>
          <span>Commitment to Quality</span>
        </div>
      </div>

      <div className="about-content">
        <p className="section-subtitle">ABOUT RELIANCE</p>
        <h2>
          Your Health Deserves <span>Reliable Results.</span>
        </h2>

        <p>
          Reliance Medical Laboratory is committed to providing dependable laboratory
          testing services with accuracy, professionalism, and care.
        </p>

        <p>
          We combine modern laboratory practices with a patient-focused approach to
          deliver results that healthcare professionals can rely on when making important
          medical decisions.
        </p>

        <div className="about-points">
          <div>
            <Check />
            <span>Accurate laboratory testing</span>

          </div>
          <div>
            <Check />
            <span>Professional laboratory services</span>
          </div>
          <div>
            <Check />
            <span>Patient-focused care</span>
          </div>
        </div>

        <a href="#services" className="about-button">
          Discover Our Services
        </a>
      </div>
    </section>
  );
}

export default About;