import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';
import { FaBars, FaShoppingCart, FaUserCircle } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useUser();
  const { cartItems } = useCart();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Left section */}
        <div className="navbar-left">
          <button className="hamburger-button">
            <FaBars size={20} />
          </button>
        </div>

        {/* Center brand */}
        <div className="navbar-center">
          <Link to="/" className="navbar-brand">EVOLEXX</Link>
        </div>

        {/* Right section */}
        <div className="navbar-right">
          {user && (
            <Link to="/cart" className="cart-button">
              <FaShoppingCart size={18} />
              <span className="cart-count">{cartItems.length}</span>
            </Link>
          )}

          <div className="profile-dropdown-wrapper">
            <button className="profile-icon-button" onClick={toggleDropdown}>
              <FaUserCircle size={22} />
            </button>

            {dropdownOpen && (
              <div className="dropdown-menu">
                {user ? (
                  <>
                    <span className="dropdown-text">Welcome, {user.name}</span>
                    <button className="logout-dropdown-button" onClick={logout}>Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="dropdown-link" onClick={() => setDropdownOpen(false)}>Login</Link>
                    <Link to="/register" className="dropdown-link" onClick={() => setDropdownOpen(false)}>Register</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
