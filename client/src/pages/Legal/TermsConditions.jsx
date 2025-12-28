import React from 'react';
import Footer from '../../components/Footer/Footer';
import './Legal.css';

const TermsConditions = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <h1>Terms & Conditions</h1>
          <p className="last-updated">Last updated: January 2025</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing and using the Evolexx website ("Site"), you agree to be bound by these Terms and 
              Conditions ("Terms"). If you do not agree to these Terms, please do not use our Site or services.
            </p>
            <p>
              We reserve the right to modify these Terms at any time. Your continued use of the Site following 
              any changes indicates your acceptance of the new Terms.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Use of Our Website</h2>
            <p>You agree to use our website only for lawful purposes. You must not:</p>
            <ul>
              <li>Use the Site in any way that violates applicable laws or regulations</li>
              <li>Attempt to gain unauthorized access to our systems or user accounts</li>
              <li>Interfere with or disrupt the Site or its servers</li>
              <li>Use automated systems or software to extract data from the Site</li>
              <li>Transmit any viruses, malware, or harmful code</li>
              <li>Engage in any activity that could damage our reputation</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Account Registration</h2>
            <p>To make purchases, you may need to create an account. You agree to:</p>
            <ul>
              <li>Provide accurate and complete information during registration</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Be responsible for all activities that occur under your account</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms or engage in 
              fraudulent activities.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Products and Pricing</h2>
            <h3>Product Information</h3>
            <p>
              We strive to provide accurate product descriptions and images. However, we do not warrant that 
              product descriptions, colors, or other content is accurate, complete, or error-free.
            </p>

            <h3>Pricing</h3>
            <ul>
              <li>All prices are displayed in Sri Lankan Rupees (LKR) unless otherwise stated</li>
              <li>Prices are subject to change without notice</li>
              <li>We reserve the right to correct pricing errors</li>
              <li>Promotional prices are valid for the specified period only</li>
            </ul>

            <h3>Availability</h3>
            <p>
              Product availability is subject to change. We reserve the right to limit quantities, discontinue 
              products, or refuse orders at our discretion.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Orders and Payment</h2>
            <h3>Order Acceptance</h3>
            <p>
              Your order constitutes an offer to purchase. We reserve the right to accept or reject any order 
              for any reason. Order confirmation does not guarantee acceptance of your order.
            </p>

            <h3>Payment Methods</h3>
            <p>We accept the following payment methods:</p>
            <ul>
              <li>Credit and Debit Cards (Visa, MasterCard, American Express)</li>
              <li>Bank Transfer</li>
              <li>Cash on Delivery (for eligible areas)</li>
            </ul>

            <h3>Payment Security</h3>
            <p>
              All payment transactions are processed through secure, encrypted connections. We do not store 
              your complete credit card information on our servers.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Shipping and Delivery</h2>
            <ul>
              <li>Delivery times are estimates and not guaranteed</li>
              <li>Risk of loss passes to you upon delivery</li>
              <li>We are not responsible for delays caused by carriers or customs</li>
              <li>Additional charges may apply for remote areas</li>
              <li>Please ensure someone is available to receive the delivery</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Returns and Refunds</h2>
            <p>
              Our return and refund policies are outlined in our separate <a href="/refund-policy">Refund Policy</a>. 
              By making a purchase, you agree to be bound by our refund policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Intellectual Property</h2>
            <p>
              All content on this Site, including text, graphics, logos, images, and software, is the property 
              of Evolexx or its content suppliers and is protected by intellectual property laws.
            </p>
            <p>You may not:</p>
            <ul>
              <li>Reproduce, distribute, or modify any content without our written consent</li>
              <li>Use our trademarks or logos without authorization</li>
              <li>Remove any copyright or proprietary notices</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>9. Warranty Disclaimer</h2>
            <p>
              Products are covered by manufacturer warranties where applicable. Evolexx provides no additional 
              warranties beyond what is required by law. To the maximum extent permitted by law:
            </p>
            <ul>
              <li>The Site and products are provided "as is" without warranties of any kind</li>
              <li>We do not warrant that the Site will be uninterrupted or error-free</li>
              <li>We make no warranties regarding the accuracy of product information</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Evolexx shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages arising from:
            </p>
            <ul>
              <li>Your use of or inability to use the Site</li>
              <li>Any products purchased through the Site</li>
              <li>Unauthorized access to your data</li>
              <li>Any third-party content or conduct</li>
            </ul>
            <p>
              Our total liability shall not exceed the amount you paid for the specific product or service 
              giving rise to the claim.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify and hold Evolexx harmless from any claims, damages, losses, or expenses 
              arising from your use of the Site, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Sri Lanka. Any 
              disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts 
              of Sri Lanka.
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable, the remaining provisions shall 
              continue in full force and effect.
            </p>
          </section>

          <section className="legal-section">
            <h2>14. Contact Information</h2>
            <p>For questions about these Terms and Conditions, please contact us:</p>
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

export default TermsConditions;

