import "./Contact.css";

function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="contact-heading">
        <p className="section-subtitle">CONTACT US</p>
        <h2>
          We're Here to <span>Help You</span>
        </h2>
        <p>Have a question or need assistance? Feel free to reach out to us!</p>
      </div>

      <div className="contact-content">
        <div className="contact-details">
          <div className="contact-item">
            <div className="contact-icon">📍</div>
            <div className="contact-text">
              <h3>Our Location</h3>
              <p>123 Main Street, City, State 12345</p>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">📞</div>
            <div className="contact-text">
              <h3>Phone Number</h3>
              <p>(123) 456-7890</p>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">✉️</div>
            <div>
              <h3>Email</h3>
              <p>info@reliancemedlab.com</p>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">🕒</div>
            <div>
              <h3>Opening Hours</h3>
              <p>Monday - Saturday: 8:00 AM - 6:00 PM</p>
              <p>Sunday: 12:00 PM - 6:00 PM</p>
            </div>
          </div>
        </div>

        <div className="contact-card">
          <h3>Need Assistance?</h3>
          <p>Feel free to contact us at any time!</p>
          <a href="tel:+2348000000">Call Our Laboratory</a>
        </div>
      </div>
    </section>
  );
}

export default Contact;
                