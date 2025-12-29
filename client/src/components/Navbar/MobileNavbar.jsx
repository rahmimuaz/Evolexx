import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './MobileNavbar.css';
import {
  FaBars,
  FaTimes,
  FaShoppingCart,
  FaSearch
} from 'react-icons/fa';
import { useUser } from '../../context/UserContext';
import { useCart } from '../../context/CartContext';
import Modal from '../Modal/Modal';
import Login from '../../pages/Login/Login';
import Register from '../../pages/Login/Register';


const MobileNavbar = () => {
  const { user, logout } = useUser();
  const { cartItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [navTheme, setNavTheme] = useState('dark');
  const [navScrolled, setNavScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const menuRef = useRef(null);
  const lastScrollRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    const handleClickOutsideMenu = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutsideMenu);
    }
    return () => document.removeEventListener('mousedown', handleClickOutsideMenu);
  }, [menuOpen]);

  // FIX: Apply dark/light theme based on current path and scroll position
  useEffect(() => {
    // Check if we are on the Home page
    // Also check for common path variations of home, e.g., /index.html
    const isHomePage = location.pathname === '/' || location.pathname === '/index.html';

    const handleAutoTheme = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const bgThresholdPx = 24;
      // This threshold defines how far down you scroll before the theme switches from 'dark' to 'light' on the homepage
      const themeSwitchThresholdPx = Math.min(windowHeight, 120);
      
      // Nav Hide/Show Logic
      const last = lastScrollRef.current;
      if (scrollY > last && scrollY > 80) {
        setNavHidden(true);
      } else {
        setNavHidden(false);
      }
      lastScrollRef.current = scrollY;
      
      // Theme Logic
      if (isHomePage) {
        // On Home page, use Dark theme near top (over dark hero), Light when scrolled
        const atTopForTheme = scrollY < themeSwitchThresholdPx;
        setNavTheme(atTopForTheme ? 'dark' : 'light');
      } else {
        // On ALL other pages, ALWAYS use the Light theme regardless of scroll position (to prevent white-on-white)
        setNavTheme('light');
      }

      setNavScrolled(scrollY > bgThresholdPx);
    };

    handleAutoTheme();
    window.addEventListener('scroll', handleAutoTheme, { passive: true });
    return () => window.removeEventListener('scroll', handleAutoTheme);
  }, [location.pathname]); // Re-run effect when path changes

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    const delayDebounce = setTimeout(() => {
      fetch(`${API_BASE_URL}/api/products/search?query=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(Array.isArray(data) ? data : []);
          setSearchError(null);
        })
        .catch(() => setSearchError('Error fetching results'))
        .finally(() => setSearchLoading(false));
    }, 350);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, API_BASE_URL]);

  const handleSearchSelect = (productSlug) => {
    setMobileSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/product/${productSlug}`);
  };

  return (
    <nav className={`mnav ${navTheme} ${navScrolled ? 'scrolled' : ''} ${navHidden ? 'hidden' : ''}`}>
      {mobileSearchOpen && (
        <div className="mnav-search-overlay">
          <div className="mnav-search-input-wrapper">
            <span className="mnav-search-input-icon"><FaSearch size={18} /></span>
            <input
              type="text"
              placeholder="Search.."
              className="mnav-search-input"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              className="mnav-search-cancel"
              aria-label="Close search"
              type="button"
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
                setSearchError(null);
              }}
              title="Close"
            >
              <FaTimes size={16} />
            </button>
            {(searchLoading || searchResults.length > 0 || searchError) && searchQuery && (
              <div className="mnav-suggestions">
                {searchLoading && <div className="mnav-suggestion-loading">Searching...</div>}
                {searchError && <div className="mnav-suggestion-error">{searchError}</div>}
                {!searchLoading && !searchError && searchResults.length === 0 && (
                  <div className="mnav-suggestion-empty">No products found</div>
                )}
                {searchResults.map((product) => (
                  <div
                    className="mnav-suggestion-item"
                    key={product._id}
                    onClick={() => handleSearchSelect(product.slug || product._id)}
                  >
                    <img
                      src={product.images?.[0]}
                      alt={product.name}
                      className="mnav-suggestion-img"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/40x40/6b7280/ffffff?text=N/A'; }}
                    />
                    <div className="mnav-suggestion-info">
                      <div className="mnav-suggestion-name">{product.name}</div>
                      <div className="mnav-suggestion-price">
                        Rs. {product.price?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mnav-container" style={{ display: mobileSearchOpen ? 'none' : undefined }}>
        <button className="mnav-hamburger" onClick={toggleMenu} aria-label="Toggle menu">
          <span className={`mnav-hamburger-icon ${menuOpen ? 'open' : ''}`}>
            {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </span>
        </button>

        <div className="mnav-left">
          <Link to="/" className="mnav-brand">EVOLEXX</Link>
        </div>

        <div ref={menuRef} className={`mnav-center ${menuOpen ? 'open' : ''}`}>
          <div className="mnav-links">
            <button
              className="mnav-link mnav-link-button"
              onClick={() => setMobileProfileOpen(!mobileProfileOpen)}
              aria-expanded={mobileProfileOpen}
            >
              Profile
            </button>
            {mobileProfileOpen && (
              <div className="mnav-submenu">
                {user ? (
                  <>
                    <Link to="/my-orders" className="mnav-submenu-link" onClick={() => { setMenuOpen(false); setMobileProfileOpen(false); }}>
                      My Orders
                    </Link>
                    <Link to="/settings" className="mnav-submenu-link" onClick={() => { setMenuOpen(false); setMobileProfileOpen(false); }}>
                      Settings
                    </Link>
                    <button
                      className="mnav-submenu-link mnav-submenu-button"
                      onClick={() => { 
                        logout(); 
                        setMenuOpen(false); 
                        setMobileProfileOpen(false);
                        navigate('/');
                      }}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="mnav-submenu-link mnav-submenu-button"
                      onClick={() => { setLoginModalOpen(true); setMenuOpen(false); setMobileProfileOpen(false); }}
                    >
                      Login
                    </button>
                    <button
                      className="mnav-submenu-link mnav-submenu-button"
                      onClick={() => { setRegisterModalOpen(true); setMenuOpen(false); setMobileProfileOpen(false); }}
                    >
                      Register
                    </button>
                  </>
                )}
              </div>
            )}
            <Link to="/" className={`mnav-link ${location.pathname === '/' ? 'is-active' : ''}`} onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/category/preowned-phones" className={`mnav-link ${location.pathname === '/category/preowned-phones' ? 'is-active' : ''}`} onClick={() => setMenuOpen(false)}>Pre Owned</Link>
            <Link to="/category/mobile-accessories" className={`mnav-link ${location.pathname === '/category/mobile-accessories' ? 'is-active' : ''}`} onClick={() => setMenuOpen(false)}>Accessories</Link>
          </div>
        </div>

        <div className="mnav-right">
          {user && (
            <Link to="/cart" className="mnav-cart-button">
              <FaShoppingCart size={18} />
              {cartItems.length > 0 && (
                <span className="cart-count">{cartItems.length}</span>
              )}
            </Link>
          )}
          <button
            className="mnav-search-button"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Open search"
          >
            <FaSearch size={18} />
          </button>
        </div>
      </div>

      {/* Login/Register Modals */}
      <Modal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} title="Login">
        <Login
          asModal
          onSuccess={() => {
            setLoginModalOpen(false);
            setMenuOpen(false);
            setMobileProfileOpen(false);
          }}
          onSwitchRegister={() => {
            setLoginModalOpen(false);
            setRegisterModalOpen(true);
          }}
        />
      </Modal>
      <Modal isOpen={registerModalOpen} onClose={() => setRegisterModalOpen(false)} title="Register">
        <Register
          asModal
          onSuccess={() => {
            setRegisterModalOpen(false);
            setMenuOpen(false);
            setMobileProfileOpen(false);
          }}
          onSwitchLogin={() => {
            setRegisterModalOpen(false);
            setLoginModalOpen(true);
          }}
        />
      </Modal>
    </nav>
  );
};

export default MobileNavbar;