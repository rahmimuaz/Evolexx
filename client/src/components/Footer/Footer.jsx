import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaXTwitter, FaFacebookF, FaInstagram, FaEnvelope } from 'react-icons/fa6';
import './Footer.css';

// Brand logos as SVG components for crisp rendering
const AppleLogo = () => (
  <svg viewBox="0 0 384 512" fill="currentColor">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
  </svg>
);

const XiaomiLogo = () => (
  <svg viewBox="0 0 1024 1024" fill="currentColor">
    <path d="M512 0C229.2 0 0 229.2 0 512s229.2 512 512 512 512-229.2 512-512S794.8 0 512 0zm196.5 665.3H315.5V358.7h98.7v207.9h195.6V358.7h98.7v306.6z"/>
  </svg>
);

const GoogleLogo = () => (
  <svg viewBox="0 0 488 512" fill="currentColor">
    <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
  </svg>
);

const JBLLogo = () => (
  <svg viewBox="0 0 100 40" fill="currentColor">
    <text x="5" y="30" fontFamily="Arial Black, sans-serif" fontSize="28" fontWeight="900">JBL</text>
  </svg>
);

const AnkerLogo = () => (
  <svg viewBox="0 0 120 40" fill="currentColor">
    <text x="5" y="28" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700">ANKER</text>
  </svg>
);

const BaseusLogo = () => (
  <svg viewBox="0 0 140 40" fill="currentColor">
    <text x="5" y="28" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="600">Baseus</text>
  </svg>
);

const SamsungLogo = () => (
  <svg viewBox="0 0 160 40" fill="currentColor">
    <text x="5" y="28" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="700" letterSpacing="3">SAMSUNG</text>
  </svg>
);

// Brand data
const brands = [
  { name: 'Apple', Logo: AppleLogo },
  { name: 'Xiaomi', Logo: XiaomiLogo },
  { name: 'Google', Logo: GoogleLogo },
  { name: 'JBL', Logo: JBLLogo },
  { name: 'Anker', Logo: AnkerLogo },
  { name: 'Baseus', Logo: BaseusLogo },
  { name: 'Samsung', Logo: SamsungLogo },
];

const Footer = ({ showBrands = false }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <div className="footer-wrapper">
      {/* Featured Brands Section - Only shown on Homepage */}
      {/* TODO: Add brands slider in future */}
      {false && showBrands && (
        <section className="brands-section">       
          <div className="brands-slider">
            <div className="brands-track">
              {/* First set of logos */}
              {brands.map((brand, index) => (
                <div key={`brand-1-${index}`} className="brand-logo" title={brand.name}>
                  <brand.Logo />
                </div>
              ))}
              {/* Duplicate for seamless loop */}
              {brands.map((brand, index) => (
                <div key={`brand-2-${index}`} className="brand-logo" title={brand.name}>
                  <brand.Logo />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="footer-cta">
        <h2 className="cta-headline">Confidence in Every Purchase</h2>
        <p className="cta-subtext">
          Get updates on new arrivals, trusted brands, and special discounts delivered to your inbox.
        </p>
        
        <form className="cta-form" onSubmit={handleSubscribe}>
          <div className="cta-input-wrapper">
            <svg 
              className="cta-mail-icon" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="cta-input"
              required
            />
            <button type="submit" className="cta-button">
              {subscribed ? 'Subscribed!' : 'Subscribe'}
            </button>
          </div>
        </form>
        
        <p className="cta-trust-line">
          We respect your privacy. No spam, unsubscribe anytime.
        </p>
      </section>

      {/* Main Footer */}
      <footer className="footer-main">
        {/* Logo */}
        <div className="footer-logo">
          <span className="footer-logo-text">EVOLEXX</span>
        </div>

        {/* Navigation Links - onClick scrolls to top when navigating from footer (e.g. mobile) */}
        <nav className="footer-nav">
          <Link to="/category/mobile-phones" className="footer-nav-link" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>Mobiles</Link>
          <Link to="/category/mobile-accessories" className="footer-nav-link" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>Accessories</Link>
          <Link to="/contact" className="footer-nav-link" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>Contact</Link>
          <Link to="/refund-policy" className="footer-nav-link" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>Refund Policy</Link>
          <Link to="/privacy-policy" className="footer-nav-link" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>Privacy Policy</Link>
          <Link to="/terms" className="footer-nav-link" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>Terms & Conditions</Link>
        </nav>

        {/* Social Icons */}
        <div className="footer-social">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon-link" aria-label="Twitter">
            <FaXTwitter />
          </a>
          <a href="https://www.facebook.com/share/1AhBWsAw2h/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="social-icon-link" aria-label="Facebook">
            <FaFacebookF />
          </a>
          <a href="https://www.instagram.com/evolexx_lk?igsh=czEwYXJmcGhxMnY0&utm_source=qr" target="_blank" rel="noopener noreferrer" className="social-icon-link" aria-label="Instagram">
            <FaInstagram />
          </a>
          <a href="mailto:evolexxlk@gmail.com" className="social-icon-link" aria-label="Email">
            <FaEnvelope />
          </a>
        </div>

        {/* Copyright */}
        <p className="footer-copyright">
          © {new Date().getFullYear()} Evolexx, All rights reserved
        </p>
      </footer>
    </div>
  );
};

export default Footer;
