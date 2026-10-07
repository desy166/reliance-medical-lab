import { CheckCircle } from 'lucide-react';
import "./Booking.css";

function Booking() {
    return (
        <section className="booking" id="booking">
            <div className="booking-info">
                <p className="section-subtitle">BOOK A TEST</p>
                <h2>
                    Schedule Your <span>Laboratory Test</span>
                </h2>
                <p>Fill out the form below to schedule Your laboratory test.</p>
                <div className="booking-points">
                    <div>
                        <CheckCircle />
                        <span>Simple appointment request</span>
                    </div>
                    <div>
                        <CheckCircle />
                        <span>Professional laboratory service appointment request</span>
                    </div>
                    <div>
                        <CheckCircle />
                        <span>Convenient scheduling</span>
                    </div>
                </div>
            </div>
            <form className="booking-form">
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input type="text" id="name" name="name" placeholder="Enter your full name" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input type="tel" id="phone" name="phone" placeholder="Enter your phone number" required />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input type="email" id="email" name="email" placeholder="Enter your email address" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="test">Test Type</label>
                        <select id="test" name="test" required>
                            <option value="">Select a test</option>
                            <option value="blood">Blood Test</option>
                            <option value="urine">Urine Test</option>
                            <option value="stool">Stool Test</option>
                            <option value="malaria">Malaria Test</option>
                            <option value="genotype">Genotype Test</option>
                            <option value="microscopy">Microscopy</option>
                            <option value="Screening Test">Screening Test</option>
                            <option value="Ultrasound Test">Ultrasound Test</option>
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="date">Preferred Date</label>
                        <input type="date" id="date" name="date" required />
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="">Additional Message</label>
                    <textarea rows="4" placeholder="Tell us anything we should know..."></textarea>
                </div>
                <button type="submit">Request Appointment</button>
            </form>
            </section>
    );
}

export default Booking;