import React from 'react';
import Footer from '../../components/Footer/Footer';
import './Legal.css';

const PrivacyPolicy = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last updated: January 2025</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>
              At Evolexx ("we," "our," or "us"), we are committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you visit our website 
              or make a purchase from our store.
            </p>
            <p>
              Please read this privacy policy carefully. By using our website, you consent to the practices 
              described in this policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            
            <h3>Personal Information</h3>
            <p>We may collect personal information that you voluntarily provide, including:</p>
            <ul>
              <li>Name and contact information (email address, phone number)</li>
              <li>Billing and shipping addresses</li>
              <li>Payment information (credit card numbers, bank details)</li>
              <li>Account credentials (username, password)</li>
              <li>Order history and preferences</li>
            </ul>

            <h3>Automatically Collected Information</h3>
            <p>When you visit our website, we automatically collect certain information:</p>
            <ul>
              <li>Device information (browser type, operating system)</li>
              <li>IP address and location data</li>
              <li>Pages visited and time spent on our site</li>
              <li>Referring website addresses</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and shipping updates</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Send promotional emails and newsletters (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Detect and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul>
              <li><strong>Service Providers:</strong> Third parties who help us operate our business (payment processors, shipping carriers, email services)</li>
              <li><strong>Business Partners:</strong> Trusted partners for joint promotions or services</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or sale of assets</li>
            </ul>
            <p>
              We do <strong>not</strong> sell, rent, or trade your personal information to third parties for 
              their marketing purposes.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your browsing experience. Cookies are 
              small data files stored on your device that help us:
            </p>
            <ul>
              <li>Remember your preferences and settings</li>
              <li>Keep items in your shopping cart</li>
              <li>Analyze website traffic and usage patterns</li>
              <li>Deliver personalized content and advertisements</li>
            </ul>
            <p>
              You can control cookies through your browser settings. However, disabling cookies may affect 
              website functionality.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul>
              <li>SSL encryption for data transmission</li>
              <li>Secure payment processing through trusted providers</li>
              <li>Regular security assessments and updates</li>
              <li>Limited access to personal information by employees</li>
            </ul>
            <p>
              However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute 
              security of your data.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Your Rights</h2>
            <p>You have the following rights regarding your personal information:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of the information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Data Portability:</strong> Request your data in a portable format</li>
            </ul>
            <p>
              To exercise these rights, please contact us at <strong>evolexxlk@gmail.com</strong>.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in 
              this policy, unless a longer retention period is required by law. Order information is typically 
              retained for 7 years for accounting and legal purposes.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Children's Privacy</h2>
            <p>
              Our website is not intended for children under 16 years of age. We do not knowingly collect 
              personal information from children. If we learn that we have collected information from a child, 
              we will delete it promptly.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new policy on this page and updating the "Last updated" date. Your continued use of our website 
              after changes constitutes acceptance of the revised policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <ul className="contact-list">
              <li><strong>Email:</strong> evolexxlk@gmail.com</li>
              <li><strong>Phone:</strong> +94 75 603 1924</li>
              <li><strong>Address:</strong> 433/1, Kandy Road, Mawanella, Sri Lanka</li>
            </ul>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;

