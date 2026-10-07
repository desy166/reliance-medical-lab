import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar-logo">
        <img src="/logo.png" alt="Logo" />
        <span className="logo-icon">+</span>
        <div className="logo-text">
          <h2>RELIANCE</h2>
          <p>medical laboratory</p>
        </div>
      </div>

      <button
        className="menu-toggle"
        type="button"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
      </button>

      <div className={`nav-menu${menuOpen ? ' is-open' : ''}`} id="primary-navigation">
        <ul className="nav-links">
          <li><a href="#home" onClick={closeMenu}>Home</a></li>
          <li><a href="#services" onClick={closeMenu}>Our Services</a></li>
          <li><a href="#about" onClick={closeMenu}>About Us</a></li>
          <li><a href="#contact" onClick={closeMenu}>Contact</a></li>
        </ul>

        <a href="#booking" className="nav-button" onClick={closeMenu}>Book a Test</a>
      </div>
    </nav>
  );
}

export default Navbar;