import { Check } from "lucide-react";
import "./Results.css";
function Results() {const[Reference, setReference] = React.useState('');
    const
    return(
        <section className="results "id="results">
            <div className="results-content">
                <p className="section-subtitle">PATIENT RESULT PORTER</p>
                <h2>
                    Access Your <span>Laboratory Test Results online</span>
                </h2>
                <p>Enter your result reference number to access your laboratory result online</p>
                <form className="results-form">
                <label htmlFor="">Result Reference Number</label>
                <div className="result-input">
                    <input type="text" placeholder="e.g,RML-2026-00125" />
                    <button type="submit">Check Result</button>
                    </div>
                    </form>
                    <p className="result-note">your reference number can be found on your laboratory receipt or report.</p>
            </div>
            <div className="results-card">
                <div className="result-card-icon">
                < Check/></div>
                <h3>Secure Results</h3>
                <p>Access your laboratory report conveniently from your phone 
                    or computer.</p>
                    <div className="result-card-line"></div>
                    <div className="result-status">
                        <span></span>
                        <p>Results available online</p>
                    </div>
                </div>
        </section>
    );
    }
    export default Results;