import React from "react";
import './Hero.css';
function Hero() {
  return (
    <section className="hero" id="home">
        <div className="hero-content">
            <p>TRUSTED MEDICAL DIAGNOSTICS</p>
            <h1>Accurate Results</h1>
            <span>Better Healthcare.</span>
            <p className="hero-description">
              At Reliance Medical Laboratoty, 
              we provide reliable and accurate diagnostic testing to help you and your healthcare provider make
               informed decisions.
            </p>
            <div className="hero-buttons">
                <a href="#booking" className="primary-btn">Book a Test</a>
                <a href="#services" className="secondary-btn">Explore Services</a>
          </div>
          <div className="hero-features">
            <strong>✔</strong>
            Accurate Testing
            <strong>✔</strong>
            Fast Results <br />
            <strong>✔</strong>
            Professional Care
          </div>
        </div>
        <div/>
        <div className="hero-image">
            <div className="medical-icon">+</div>
            <h3>Reliable Diagnostics</h3>
            <p>Quality laboratory testing you can trust.</p>
            </div>
            </section>
    
      );
    }

    export default Hero;