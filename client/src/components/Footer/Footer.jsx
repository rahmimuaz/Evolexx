import React from 'react';
import './Footer.css'; // or create a separate Footer.css if preferred

const Footer = () => {
  const handleContactClick = () => alert('Contact Clicked');
  const handleAddressClick = () => alert('Address Clicked');
  const handleFaqClick = () => alert('FAQ Clicked');
  const handleTermsClick = () => alert('Terms Clicked');
  const handleHelpClick = () => alert('Help Clicked');
  const handleReturnsClick = () => alert('Returns Clicked');
  const handleShippingClick = () => alert('Shipping Clicked');
  const handleWarrantyClick = () => alert('Warranty Clicked');

  return (
    <>
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="logo">
              <span className="logo-icon">⚡</span>
              <span className="logo-text">EVOLEXX</span>
            </div>
            <p>Experience the future with our top-notch gadgets and devices.</p>
            <div className="social-icons">
              <button className="footer-link-btn">Instagram</button>
              <button className="footer-link-btn">Facebook</button>
              <button className="footer-link-btn">WhatsApp</button>
            </div>
          </div>

          <div className="footer-links">
            <h4>About Us</h4>
            <ul>
              <li><button onClick={handleContactClick} className="footer-link-btn">Contact</button></li>
              <li><button onClick={handleAddressClick} className="footer-link-btn">Address</button></li>
              <li><button onClick={handleFaqClick} className="footer-link-btn">FAQ’s</button></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Customer Service</h4>
            <ul>
              <li><button onClick={handleTermsClick} className="footer-link-btn">Terms and Conditions</button></li>
              <li><button onClick={handleHelpClick} className="footer-link-btn">Help Center</button></li>
              <li><button onClick={handleReturnsClick} className="footer-link-btn">Returns & Refunds</button></li>
              <li><button onClick={handleShippingClick} className="footer-link-btn">Shipping & Delivery</button></li>
              <li><button onClick={handleWarrantyClick} className="footer-link-btn">Warranty Information</button></li>
            </ul>
          </div>
        </div>
      </footer>
      <hr className="footer-divider" />
      <div className="footer-bottom">
        <p>© 2025 Evolexx. All rights reserved.</p>
      </div>
    </>
  );
};

export default Footer;
