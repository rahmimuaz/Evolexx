import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import Modal from '../Modal';
import Login from '../../pages/Login/Login';
import Register from '../../pages/Login/Register';

const Navbar = () => {
  const { user, logout } = useUser();
  const { cartItems } = useCart();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const navigate = useNavigate();

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    // Clear search state when closing
    if (searchOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSearchError(null);
    }
  };
  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Debounced search
  React.useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    const delayDebounce = setTimeout(() => {
      fetch('http://localhost:5001/api/products/search?query=' + encodeURIComponent(searchQuery))
        .then(res => res.json())
        .then(data => {
          console.log('Search response:', data);
          setSearchResults(Array.isArray(data) ? data : []);
          setSearchError(null);
        })
        .catch(() => setSearchError('Error fetching results'))
        .finally(() => setSearchLoading(false));
    }, 350);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearchSelect = (productId) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/products/${productId}`);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Hamburger (mobile) */}
        <button className="hamburger-button" onClick={toggleMenu} aria-label="Toggle menu">
          <FaBars />
        </button>
        {/* Left Section */}
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">EVOLEXX</Link>
        </div>

        {/* Center Section */}
        <div className={`navbar-center ${menuOpen ? 'open' : ''}`}>
          <div className="navbar-links">
            <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active-link' : ''}`} onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/phones" className={`navbar-link ${location.pathname === '/phones' ? 'active-link' : ''}`} onClick={() => setMenuOpen(false)}>Phones</Link>
            <Link to="/accessories" className={`navbar-link ${location.pathname === '/accessories' ? 'active-link' : ''}`} onClick={() => setMenuOpen(false)}>Accessories</Link>
            <Link to="/newdeals" className={`navbar-link ${location.pathname === '/newdeals' ? 'active-link' : ''}`} onClick={() => setMenuOpen(false)}>New Deals</Link>
          </div>
        </div>

        <div className="navbar-divider" />

        {/* Right Section */}
        <div className="navbar-right">
           {/* Conditional rendering for Search Icon or Search Bar */}
          {!searchOpen ? (
            <button className="search-icon-button" onClick={toggleSearch} aria-label="Open search">
              <FaSearch size={18} />
            </button>
          ) : (
            <div className="search-bar-integrated">
              <div className="search-input-wrapper-inner">
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
                  onClick={toggleSearch}
                  aria-label="Close search"
                  type="button"
                >
                  &times;
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
                      onClick={() => handleSearchSelect(product._id)}
                    >
                      <img src={product.images?.[0]} alt={product.name} className="search-suggestion-img" onError={(e) => { e.target.onerror = null; e.target.src = '/logo192.png'; }} />
                      <div className="search-suggestion-info">
                        <div className="search-suggestion-name">{product.name}</div>
                        <div className="search-suggestion-price">Rs. {product.price?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</div>
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

         

          {/* Profile Dropdown */}
          <div className="profile-dropdown-wrapper">
            <button className="profile-icon-button" onClick={toggleDropdown} aria-label="Toggle profile menu">
              <FaUserCircle size={22} />
            </button>

            <div className={`dropdown-menu ${dropdownOpen ? 'show-dropdown' : ''}`}>
              {user ? (
                <>
                  <span className="dropdown-text">Hello, {user.name}</span>
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
      <Modal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} title="Login">
        <Login asModal onSuccess={() => setLoginModalOpen(false)} onSwitchRegister={() => { setLoginModalOpen(false); setRegisterModalOpen(true); }} />
      </Modal>
      <Modal isOpen={registerModalOpen} onClose={() => setRegisterModalOpen(false)} title="Register">
        <Register asModal onSuccess={() => setRegisterModalOpen(false)} onSwitchLogin={() => { setRegisterModalOpen(false); setLoginModalOpen(true); }} />
      </Modal>
    </nav>
  );
};

export default Navbar;