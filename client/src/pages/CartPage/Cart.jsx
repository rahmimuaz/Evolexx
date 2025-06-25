import React from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  const handleQuantityChange = (id, type) => {
    const item = cartItems.find(i => i._id === id);
    if (!item) return;

    if (type === 'increment') {
      updateQuantity(item.product._id, item.quantity + 1);
    } else if (type === 'decrement' && item.quantity > 1) {
      updateQuantity(item.product._id, item.quantity - 1);
    }
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.product?.price || 0) * item.quantity,
    0
  );

  const getImageUrl = (path) => {
    if (!path) return '';

    if (path.startsWith('http://') || path.startsWith('https://')) return path;

    return path.startsWith('/') 
      ? `http://localhost:5001${path}` 
      : `http://localhost:5001/${path}`;
  };

  const onImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  return (
    <div className="cart">
      <main className="cart-content max-width">
        <h1 className="cart-title">Shopping Cart</h1>

        <section className="cart-items">
          {cartItems.length === 0 ? (
            <p className="empty-message">Your cart is empty.</p>
          ) : (
            cartItems.map(item => (
              <article className="cart-item" key={item._id}>
                <div className="image-wrapper">
                  {item.product?.images?.length ? (
                    <>
                      <img
                        src={getImageUrl(item.product.images[0])}
                        alt={item.product.name}
                        onError={onImageError}
                        className="product-image"
                      />
                      <div className="image-placeholder" style={{ display: 'none' }}>
                        <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className="placeholder-icon">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </>
                  ) : (
                    <div className="image-placeholder">
                      <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className="placeholder-icon">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="details">
                  <h2 className="product-name">{item.product?.name || 'N/A'}</h2>
                  <p className="product-desc">{item.product?.description || 'N/A'}</p>

                  <div className="quantity-controls">
                    <button
                      onClick={() => handleQuantityChange(item._id, 'decrement')}
                      className="qty-btn"
                      aria-label="Decrease quantity"
                    >-</button>
                    <span className="qty-display">{String(item.quantity).padStart(2, '0')}</span>
                    <button
                      onClick={() => handleQuantityChange(item._id, 'increment')}
                      className="qty-btn"
                      aria-label="Increase quantity"
                    >+</button>
                    <button
                      onClick={() => removeFromCart(item.product._id)}
                      className="remove-btn"
                    >Remove</button>
                  </div>
                </div>

                <div className="item-price">
                  Rs. {(item.product?.price * item.quantity).toLocaleString() || 'N/A'}
                </div>
              </article>
            ))
          )}
        </section>

        <aside className="cart-summary">
          <h2 className="summary-title">Add a Note</h2>
          <p className="note-instruction">Write something here for the seller</p>

          <div className="summary-details">
            <div className="summary-row">
              <span>Discount</span>
              <span>Rs. 0</span>
            </div>
            <div className="summary-row subtotal">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
          </div>

          <p className="taxes-note">Taxes and shipping free</p>

          <button className="checkout-btn" onClick={() => navigate('/checkout')}>
            Check Out
          </button>
        </aside>
      </main>

      <footer className="footer max-width">
        <section className="footer-brand">
          <div className="brand-logo">
            <svg viewBox="0 0 20 20" fill="currentColor" className="logo-icon">
              <path fillRule="evenodd" clipRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v2.172a1 1 0 01.387.973l.67 2.378a1 1 0 00.916.634h3.292a1 1 0 01.95 1.282l-.67 2.378a1 1 0 00-.387.973V18a1 1 0 01-1 1h-2.172a1 1 0 01-.973-.387l-2.378-.67a1 1 0 00-.634-.916H2a1 1 0 01-1-1v-2.172a1 1 0 01-.387-.973l.67-2.378a1 1 0 00.916-.634H18a1 1 0 011 1v2.172a1 1 0 01.387.973l-.67 2.378a1 1 0 00-.916.634H2a1 1 0 01-1-1V2a1 1 0 011-1h9.3z"/>
            </svg>
            EVOLEXX
          </div>
          <p className="brand-tagline">Experience the future with our top-notch gadgets and devices.</p>
          <nav className="social-links">
            {/* Put your social icons here as links */}
          </nav>
        </section>

        <section className="footer-links">
          <div>
            <h3>About Us</h3>
            <ul>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Address</a></li>
              <li><a href="#">FAQ's</a></li>
            </ul>
          </div>
          <div>
            <h3>Customer Service</h3>
            <ul>
              <li><a href="#">Terms and Conditions</a></li>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Returns & Refunds</a></li>
              <li><a href="#">Shipping & Delivery</a></li>
              <li><a href="#">Warranty Information</a></li>
            </ul>
          </div>
        </section>

        <div className="copyright">
          © 2025 Evolexx. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Cart;
