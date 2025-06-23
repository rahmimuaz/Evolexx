import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import useLocation
import { useUser } from '../../context/UserContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useUser();
  const { cartItems } = useCart();
  const location = useLocation(); // Get current location

  // Helper function to determine if a link is active
  const isActiveLink = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-left-section">
            <div className="navbar-brand-wrapper">
              <Link to="/" className="navbar-brand">
                Mobile Shop
              </Link>
            </div>
            <div className="navbar-links">
              <Link
                to="/"
                className={`navbar-link ${isActiveLink('/')}`} // Apply active class
              >
                Home
              </Link>
              <Link
                to="/products"
                className={`navbar-link ${isActiveLink('/products')}`} // Apply active class
              >
                Products
              </Link>
              {user && (
                <Link
                  to="/cart"
                  className={`navbar-link ${isActiveLink('/cart')}`} // Apply active class
                >
                  Cart ({cartItems.length})
                </Link>
              )}
            </div>
          </div>
          <div className="navbar-right-section">
            {user ? (
              <div className="user-info-group">
                <span className="user-welcome-text">Welcome, {user.name}</span>
                <button
                  onClick={logout}
                  className="logout-button"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-links-group">
                <Link
                  to="/login"
                  className="login-link"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="register-button"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;