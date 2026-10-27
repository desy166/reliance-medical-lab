import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Booking from './components/Booking'
import Contact from './components/Contact';
import Footer from './components/Footer';
import Results from './components/Results';
import AdminDashboard from './components/AdminDashboard';


function App() {
  if (window.location.pathname === '/admin') {
    return <AdminDashboard />;
  }

  return (
    <>
      <Navbar />
      <Hero />
      <Services />
      < Results />  
      <About />
      <Booking />
      <Contact />
      <Footer />
    </>
  );
}

export default App;