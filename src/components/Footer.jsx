
import logo from "../assets/file_00000000bff0820ab8a502466c888f49.png";
import "./Footer.css";
function Footer() {
    return(
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <div className="footer-logo">
                        <img className="footer-logo-mark" src={logo} alt="Reliance Medical Laboratory logo" />
                        <div>
                            <h2>RELIANCE</h2>
                            <p>Medical
                    LABORATORY            
                            </p>
                        </div>
                    </div> 
                    <p>Reliable laboratory diagnostics delivered with accuracy,
                        professionalism,and care.
                         </p>
                </div>
                <div className="footer-links">
                    <h3>Quick links</h3>
                    <a href="#home">Home</a>
                    <a href="#about">About Us</a>
                    <a href="#services">Services</a>
                    <a href="#booking">Book a Test</a>
                    <a href="#contact"> Contact</a>
                    
                </div>
                <div className="footer-links">
                    <h3>Services</h3>
                    <a href="#services">Blood Tests</a>
                    <a href="#services">Malaria Test</a>
                    <a href="#services">Genotype Test</a>
                    <a href="#services">Microscopy</a>
                    <a href="#services">Urinalysis</a>
                    <a href="#services">Ultrasound Test</a>
                    <a href="#services">Screening Tests</a>
                </div>
            </div>
            <div className="footer-bottom">
                <p> © 2026 Reliance Medical 
                    Laboratory. All rights reserved</p>
                    <p>Quality Diagnostics.Better Healthcare.</p>
            </div>
        </footer>
    )
    
}
           export default Footer;
                
