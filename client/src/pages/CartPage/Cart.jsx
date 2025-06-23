import React from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  const handleLocalQuantityChange = (id, type) => {
    const itemToUpdate = cartItems.find(item => item._id === id);
    if (itemToUpdate) {
      if (type === 'increment') {
        updateQuantity(itemToUpdate.product._id, itemToUpdate.quantity + 1);
      } else if (type === 'decrement' && itemToUpdate.quantity > 1) {
        updateQuantity(itemToUpdate.product._id, itemToUpdate.quantity - 1);
      }
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.product ? item.product.price * item.quantity : 0), 0);

  // Updated image handling to support both Cloudinary and local uploads
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';

    // If it's already a full URL (Cloudinary), return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // If it's a local upload path, construct the full URL
    if (imagePath.startsWith('uploads/')) {
      return `http://localhost:5001/${imagePath}`;
    }

    // If it starts with /uploads/, remove the leading slash
    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:5001${imagePath}`;
    }

    // Default case: assume it's a local upload
    return `http://localhost:5001/uploads/${imagePath}`;
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  return (
    <div className="cart-page-container">
      <header className="cart-header">
        <div className="max-width-wrapper cart-header-content">
          <div className="header-left-group">
            <button className="menu-button">
              <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <div className="brand-logo">
              <svg className="h-6 w-6 mr-2 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v2.172a1 1 0 01.387.973l.67 2.378a1 1 0 00.916.634h3.292a1 1 0 01.95 1.282l-.67 2.378a1 1 0 00-.387.973V18a1 1 0 01-1 1h-2.172a1 1 0 01-.973-.387l-2.378-.67a1 1 0 00-.634-.916H2a1 1 0 01-1-1v-2.172a1 1 0 01-.387-.973l.67-2.378a1 1 0 00.916-.634H18a1 1 0 011 1v2.172a1 1 0 01.387.973l-.67 2.378a1 1 0 00-.916.634H2a1 1 0 01-1-1V2a1 1 0 011-1h9.3z" clipRule="evenodd" />
              </svg>
              EVOLEXX
            </div>
          </div>
          <div className="header-right-group">
            <button className="icon-button hover:text-red-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button className="icon-button hover:text-indigo-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </button>
            <button className="icon-button hover:text-gray-900">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-width-wrapper cart-main">
        <h1 className="cart-title">Cart</h1>

        <div className="cart-grid">
          <div className="cart-items-section">
            {cartItems.length === 0 ? (
              <p className="cart-empty-message">Your cart is empty.</p>
            ) : (
              cartItems.map(item => (
                <div key={item._id} className="cart-item">
                  <div className="product-image-container">
                    {item.product.images && item.product.images.length > 0 ? (
                      <>
                        <img
                          src={getImageUrl(item.product.images[0])}
                          alt={item.product.name}
                          className="product-image-container-img"
                          onError={handleImageError}
                        />
                        <div className="product-image-placeholder" style={{ display: 'none' }}>
                          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <div className="product-image-placeholder">
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="cart-item-details">
                    <h2 className="cart-item-name">{item.product ? item.product.name : 'N/A'}</h2>
                    <p className="cart-item-description">{item.product ? item.product.description : 'N/A'}</p>
                    <div className="quantity-controls">
                      <button
                        onClick={() => handleLocalQuantityChange(item._id, 'decrement')}
                        className="quantity-button decrement"
                      >
                        -
                      </button>
                      <span className="quantity-display">
                        {item.quantity.toString().padStart(2, '0')}
                      </span>
                      <button
                        onClick={() => handleLocalQuantityChange(item._id, 'increment')}
                        className="quantity-button increment"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product._id)}
                        className="remove-button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-price">
                    Rs. {item.product && item.product.price ? (item.product.price * item.quantity).toLocaleString() : 'N/A'}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-summary-section">
            <div className="summary-header">
              <h2 className="summary-title">Add note</h2>
              <svg className="note-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <p className="note-text">write something here to seller</p>

            <div className="summary-details">
              <div className="summary-row">
                <span className="summary-label">Discount</span>
                <span className="summary-value">Rs. 0</span>
              </div>
              <div className="summary-row subtotal-row">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
            </div>

            <p className="taxes-shipping-note">Taxes and shipping Free</p>

            <button
              onClick={handleCheckout}
              className="checkout-button"
            >
              Check out
            </button>
          </div>
        </div>
      </main>

      <footer className="cart-footer">
        <div className="max-width-wrapper footer-grid">
          <div className="footer-brand-section">
            <div className="footer-brand-logo">
              <svg className="h-6 w-6 mr-2 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v2.172a1 1 0 01.387.973l.67 2.378a1 1 0 00.916.634h3.292a1 1 0 01.95 1.282l-.67 2.378a1 1 0 00-.387.973V18a1 1 0 01-1 1h-2.172a1 1 0 01-.973-.387l-2.378-.67a1 1 0 00-.634-.916H2a1 1 0 01-1-1v-2.172a1 1 0 01-.387-.973l.67-2.378a1 1 0 00.916-.634H18a1 1 0 011 1v2.172a1 1 0 01.387.973l-.67 2.378a1 1 0 00-.916.634H2a1 1 0 01-1-1V2a1 1 0 011-1h9.3z" clipRule="evenodd" />
              </svg>
              EVOLEXX
            </div>
            <p className="footer-tagline">Experience the future with our top-notch gadgets and devices.</p>
            <div className="social-links">
              <a href="#" className="social-link"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.79c0-2.508 1.493-3.89 3.776-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.77-1.63 1.563V12h2.77l-.44 2.891h-2.33v6.987C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" /></svg></a>
              <a href="#" className="social-link"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.79c0-2.508 1.493-3.89 3.776-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.77-1.63 1.563V12h2.77l-.44 2.891h-2.33v6.987C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg></a>
              <a href="#" className="social-link"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646A4.188 4.188 0 0021.6 4.06a8.337 8.337 0 01-2.673.957A4.156 4.156 0 0017.3 2.5a4.156 4.156 0 00-4.185 4.185c0 .325.034.64.113.944A11.777 11.777 0 012.66 3.018a4.159 4.159 0 001.298 5.535 4.17 4.17 0 01-1.89-.523v.052a4.156 4.156 0 003.354 4.088 4.187 4.187 0 01-1.883.072 4.144 4.144 0 003.867 2.898A8.344 8.344 0 012 18.275a11.79 11.79 0 006.29 1.976zm0 0" /></svg></a>
            </div>
          </div>
          <div>
            <h3 className="footer-column-heading">About Us</h3>
            <ul className="footer-links-list">
              <li className=''><a href="#" className="hover:text-gray-900">Contact</a></li>
              <li><a href="#" className="hover:text-gray-900">Address</a></li>
              <li><a href="#" className="hover:text-gray-900">FAQ's</a></li>
            </ul>
          </div>
          <div>
            <h3 className="footer-column-heading">Customer service</h3>
            <ul className="footer-links-list">
              <li><a href="#" className="hover:text-gray-900">Terms and Conditions</a></li>
              <li><a href="#" className="hover:text-gray-900">Help Center</a></li>
              <li><a href="#" className="hover:text-gray-900">Returns & Refunds</a></li>
              <li><a href="#" className="hover:text-gray-900">Shipping & Delivery</a></li>
              <li><a href="#" className="hover:text-gray-900">Warranty Information</a></li>
            </ul>
          </div>
        </div>
        <div className="copyright-text">
          © 2025 Evolexx. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Cart;