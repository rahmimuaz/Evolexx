import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';
import {
  FaShoppingCart,
  FaUserCircle,
  FaSearch,
  FaSignInAlt,
  FaUserPlus,
  FaSignOutAlt,
  FaCog,
  FaTimes
} from 'react-icons/fa';
import Modal from '../Modal/Modal';
import Login from '../../pages/Login/Login';
import Register from '../../pages/Login/Register';

const Navbar = () => {
  const { user, logout } = useUser();
  const { cartItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [navTheme, setNavTheme] = useState('light');
  const [navScrolled, setNavScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const dropdownRef = useRef(null);
  const searchBarRef = useRef(null);

  // 🔁 Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      // Close search bar and suggestions when clicking outside
      if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🔁 Close all open elements smoothly on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (dropdownOpen) {
        setDropdownOpen(false);
      }
      if (searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dropdownOpen, searchOpen]);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  // Auto theme + elevation: transparent at top of homepage, glass after scroll or on other routes
  useEffect(() => {
    // Check if we are on the Homepage (dark hero background)
    const isHomePage = location.pathname === '/' || location.pathname === '/homepage';
    
    const handleAutoTheme = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      // show glass after small scroll on all pages
      const bgThresholdPx = 24;
      // theme switch threshold for homepage hero
      const themeThresholdPx = Math.min(windowHeight, 120);
      
      // hide-on-scroll (down), show-on-scroll (up)
      const last = lastScrollRef.current;
      if (scrollY > last && scrollY > 80) {
        setNavHidden(true);
      } else {
        setNavHidden(false);
      }
      lastScrollRef.current = scrollY;
      setNavScrolled(scrollY > bgThresholdPx);
      
      // Theme Logic:
      // - Homepage at top: dark theme (white text for dark hero)
      // - Homepage scrolled: light theme (dark text for white content)
      // - ALL other pages: ALWAYS light theme (dark text for white backgrounds)
      if (isHomePage) {
        const atTopForTheme = scrollY < themeThresholdPx;
        setNavTheme(atTopForTheme ? 'dark' : 'light');
      } else {
        // On Category, Product, Cart, etc. pages - always use light theme
        setNavTheme('light');
      }
    };
    handleAutoTheme();
    window.addEventListener('scroll', handleAutoTheme, { passive: true });
    return () => window.removeEventListener('scroll', handleAutoTheme);
  }, [location.pathname]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    const delayDebounce = setTimeout(() => {
      fetch(`${API_BASE_URL}/api/products/search?query=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(Array.isArray(data) ? data : []);
          setSearchError(null);
        })
        .catch(() => setSearchError('Error fetching results'))
        .finally(() => setSearchLoading(false));
    }, 350);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, API_BASE_URL]);

  const handleSearchSelect = (productSlug) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/product/${productSlug}`);
  };

  return (
    <nav className={`navbar ${navTheme} ${navScrolled ? 'scrolled' : 'at-top'} ${navHidden ? 'hidden' : ''}`}>
      <div className="navbar-container">

        <div className="navbar-left">
          <Link to="/" className="navbar-brand">EVOLEXX</Link>
        </div>

        <div className="navbar-center">
          <div className="navbar-links">
            <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active-link' : ''}`}>Home</Link>
            <Link to="/category/mobile-phones" className={`navbar-link ${location.pathname === '/category/mobile-phones' ? 'active-link' : ''}`}>Brand New</Link>
            <Link to="/category/mobile-accessories" className={`navbar-link ${location.pathname === '/category/mobile-accessories' ? 'active-link' : ''}`}>Accessories</Link>
          </div>
        </div>

        <div className="navbar-divider" />
            
        <div className="navbar-right">
          {!searchOpen ? (
                  <button
                    className="search-icon-button"
                    onClick={() => setSearchOpen(true)}
                    aria-label="Open search"
                  >
                    <FaSearch size={18} />
                  </button>
                ) : (
              <div className={`search-bar-integrated ${searchOpen ? 'visible' : ''}`} ref={searchBarRef}>
                <div className="search-input-wrapper-inner">
                  <span className="search-input-icon"><FaSearch size={18} /></span>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="search-input-navbar"
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <button
                    className="search-bar-close"
                    onClick={() => setSearchOpen(false)}
                    aria-label="Close search"
                    type="button"
                  >
                    <FaTimes />
                  </button>
                </div>
                {(searchLoading || searchResults.length > 0 || searchError) && searchQuery && (
                  <div className="search-suggestions-dropdown">
                    {searchLoading && <div className="search-suggestion-loading">Searching...</div>}
                    {searchError && <div className="search-suggestion-error">{searchError}</div>}
                    {!searchLoading && !searchError && searchResults.length === 0 && (
                      <div className="search-suggestion-empty">No products found</div>
                    )}
                    {searchResults.map(product => (
                      <div
                        className="search-suggestion-item"
                        key={product._id}
                        onClick={() => handleSearchSelect(product.slug || product._id)}
                      >
                        <img
                          src={product.images?.[0]}
                          alt={product.name}
                          className="search-suggestion-img"
                          onError={(e) => { e.target.onerror = null; e.target.src = '/logo192.png'; }}
                        />
                        <div className="search-suggestion-info">
                          <div className="search-suggestion-name">{product.name}</div>
                          <div className="search-suggestion-price">
                            Rs. {product.price?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </div>
            )}

          {user && (
            <Link to="/cart" className="cart-button">
              <FaShoppingCart size={18} />
              <span className="cart-count">{cartItems.length}</span>
            </Link>
          )}

          <div className="profile-dropdown-wrapper" ref={dropdownRef}>
            <button className="profile-icon-button" onClick={toggleDropdown} aria-label="Toggle profile menu">
              <FaUserCircle size={22} />
            </button>
            <div className={`dropdown-menu ${dropdownOpen ? 'show-dropdown' : ''}`}>
              {user ? (
                <>
                  <span className="dropdown-text-1">Signed in as <span className="user-name-dropdown-text">{user.name}</span></span>
                  <Link to="/settings" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
                    <FaCog className="dropdown-icon" />
                    Settings
                  </Link>
                  <Link to="/my-orders" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
                    <FaShoppingCart className="dropdown-icon" />
                    My Orders
                  </Link>
                  <button className="logout-dropdown-button" onClick={logout}>
                    <FaSignOutAlt className="dropdown-icon" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <span className="dropdown-text">Welcome</span>
                  <button className="dropdown-link" onClick={() => { setLoginModalOpen(true); setDropdownOpen(false); }}>
                    <FaSignInAlt className="dropdown-icon" />
                    Login
                  </button>
                  <button className="dropdown-link" onClick={() => { setRegisterModalOpen(true); setDropdownOpen(false); }}>
                    <FaUserPlus className="dropdown-icon" />
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Login/Register Modals */}
      <Modal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} title="Login">
        <Login
          asModal
          onSuccess={() => setLoginModalOpen(false)}
          onSwitchRegister={() => {
            setLoginModalOpen(false);
            setRegisterModalOpen(true);
          }}
        />
      </Modal>
      <Modal isOpen={registerModalOpen} onClose={() => setRegisterModalOpen(false)} title="Register">
        <Register
          asModal
          onSuccess={() => setRegisterModalOpen(false)}
          onSwitchLogin={() => {
            setRegisterModalOpen(false);
            setLoginModalOpen(true);
          }}
        />
      </Modal>
    </nav>
  );
};

export default Navbar;
