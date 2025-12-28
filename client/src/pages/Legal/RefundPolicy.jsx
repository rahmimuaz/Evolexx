import React from 'react';
import Footer from '../../components/Footer/Footer';
import './Legal.css';

const RefundPolicy = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <h1>Refund Policy</h1>
          <p className="last-updated">Last updated: January 2025</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Overview</h2>
            <p>
              At Evolexx, we want you to be completely satisfied with your purchase. If you're not happy with your order, 
              we're here to help. This Refund Policy outlines the conditions and procedures for returns and refunds.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Eligibility for Returns</h2>
            <p>To be eligible for a return, your item must meet the following conditions:</p>
            <ul>
              <li>The item must be unused and in the same condition that you received it</li>
              <li>The item must be in its original packaging with all tags attached</li>
              <li>You must have the receipt or proof of purchase</li>
              <li>The return request must be made within <strong>14 days</strong> of delivery</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Non-Returnable Items</h2>
            <p>The following items cannot be returned:</p>
            <ul>
              <li>Items that have been opened, used, or damaged by the customer</li>
              <li>Screen protectors and tempered glass once opened</li>
              <li>Earphones and headphones (for hygiene reasons)</li>
              <li>Software and digital products</li>
              <li>Items purchased during clearance sales (unless defective)</li>
              <li>Customized or personalized items</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Refund Process</h2>
            <h3>Step 1: Initiate Return</h3>
            <p>
              Contact our customer service team at <strong>evolexxlk@gmail.com</strong> or call 
              <strong> +94 75 603 1924</strong> to initiate your return. Please provide your order number 
              and reason for return.
            </p>

            <h3>Step 2: Return Authorization</h3>
            <p>
              Once your return request is approved, you will receive a Return Authorization Number (RAN) 
              and instructions on how to return the item.
            </p>

            <h3>Step 3: Ship the Item</h3>
            <p>
              Pack the item securely in its original packaging and ship it to our return address. 
              We recommend using a trackable shipping service.
            </p>

            <h3>Step 4: Refund Processing</h3>
            <p>
              Once we receive and inspect your return, we will notify you of the approval or rejection 
              of your refund. If approved, your refund will be processed within <strong>7-10 business days</strong>.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Refund Methods</h2>
            <p>Refunds will be issued using the same payment method used for the original purchase:</p>
            <ul>
              <li><strong>Credit/Debit Card:</strong> Refund credited within 7-10 business days</li>
              <li><strong>Bank Transfer:</strong> Refund processed within 5-7 business days</li>
              <li><strong>Cash on Delivery:</strong> Refund via bank transfer (bank details required)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Defective or Damaged Products</h2>
            <p>
              If you receive a defective or damaged product, please contact us within <strong>48 hours</strong> of 
              delivery with photos of the damage. We will arrange for a replacement or full refund at no 
              additional cost to you.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Warranty Claims</h2>
            <p>
              Products covered under manufacturer warranty should be claimed directly with the manufacturer 
              or through our authorized service centers. We will assist you in processing warranty claims 
              for products purchased from Evolexx.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Shipping Costs</h2>
            <ul>
              <li>For defective or incorrectly shipped items: Evolexx covers return shipping</li>
              <li>For change of mind returns: Customer bears return shipping costs</li>
              <li>Original shipping costs are non-refundable unless the return is due to our error</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>9. Exchanges</h2>
            <p>
              If you wish to exchange an item for a different size, color, or model, please initiate a 
              return for the original item and place a new order. This ensures faster processing and 
              availability of your preferred item.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Contact Us</h2>
            <p>If you have any questions about our Refund Policy, please contact us:</p>
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

export default RefundPolicy;

