import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';
import {
  FaBars,
  FaShoppingCart,
  FaUserCircle,
  FaSearch,
  FaSignInAlt,
  FaUserPlus,
  FaSignOutAlt,
  FaCog
} from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useUser();
  const { cartItems } = useCart();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const toggleSearch = () => setSearchOpen(!searchOpen);

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Left Section */}
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">EVOLEXX</Link>
        </div>

        {/* Center Section */}
        <div className="navbar-center">
          <div className="navbar-links">
            <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active-link' : ''}`}>Home</Link>
            <Link to="/phones" className={`navbar-link ${location.pathname === '/phones' ? 'active-link' : ''}`}>Phones</Link>
            <Link to="/accessories" className={`navbar-link ${location.pathname === '/accessories' ? 'active-link' : ''}`}>Accessories</Link>
            <Link to="/newdeals" className={`navbar-link ${location.pathname === '/newdeals' ? 'active-link' : ''}`}>New Deals</Link>
          </div>
        </div>
        <div className="navbar-divider" />

        {/* Right Section */}
        <div className="navbar-right">
          {user && (
            <Link to="/cart" className="cart-button">
              <FaShoppingCart size={18} />
              <span className="cart-count">{cartItems.length}</span>
            </Link>
          )}

          {/* Search */}
          <div className="search-wrapper">
            <button className="search-icon-button" onClick={toggleSearch}>
              <FaSearch size={18} />
            </button>
            {searchOpen && (
              <input
                type="text"
                placeholder="Search..."
                className="search-input-navbar"
              />
            )}
          </div>

          {/* Dropdown */}
          <div className="profile-dropdown-wrapper">
            <button className="profile-icon-button" onClick={toggleDropdown}>
              <FaUserCircle size={22} />
            </button>

            <div className={`dropdown-menu ${dropdownOpen ? 'show-dropdown' : ''}`}>
              {user ? (
                <>
                  <span className="dropdown-text">Welcome, {user.name}</span>
                  <Link to="/settings" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
                    <FaCog className="dropdown-icon" />
                    Settings
                  </Link>
                  <button className="logout-dropdown-button" onClick={logout}>
                    <FaSignOutAlt className="dropdown-icon" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
                    <FaSignInAlt className="dropdown-icon" />
                    Login
                  </Link>
                  <Link to="/register" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
                    <FaUserPlus className="dropdown-icon" />
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
