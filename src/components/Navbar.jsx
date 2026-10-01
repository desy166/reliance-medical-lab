import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src="/logo.png" alt="Logo" />
        <span className="logo-icon">+</span>
        <div className="logo-text">
          <h2>RELIANCE</h2>
          <p>medical laboratory</p>
        </div>
      </div>

      <ul className="nav-links">
        <li><a href="#home">Home</a></li>
        <li><a href="#services">Our Services</a></li>
        <li><a href="#about">About Us</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>

      <a href="#booking" className="nav-button">Book a Test</a>
    </nav>
  );
}

export default Navbar;