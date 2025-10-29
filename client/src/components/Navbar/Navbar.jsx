import React, { useState, useEffect, useRef } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [navbarTheme, setNavbarTheme] = useState('light-theme'); // Default theme
  const [isPulled, setIsPulled] = useState(false); // Pulling animation state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const dropdownRef = useRef(null);              // Pulled-center dropdown
  const dropdownRightRef = useRef(null);         // Right-side dropdown
  const menuRef = useRef(null);
  const searchBarRef = useRef(null);
  const mobileMenuSheetRef = useRef(null);       // Mobile menu sheet
  const mobileProfileSheetRef = useRef(null);    // Mobile profile sheet

  // 🔁 Close profile dropdown when clicking outside (support both dropdown instances)
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideLeft = dropdownRef.current && dropdownRef.current.contains(event.target);
      const clickedInsideRight = dropdownRightRef.current && dropdownRightRef.current.contains(event.target);
      const clickedInsideMobileProfile = mobileProfileSheetRef.current && mobileProfileSheetRef.current.contains(event.target);
      if (!clickedInsideLeft && !clickedInsideRight && !clickedInsideMobileProfile) setDropdownOpen(false);

      const clickedInsideMobileMenu = mobileMenuSheetRef.current && mobileMenuSheetRef.current.contains(event.target);
      if (!clickedInsideMobileMenu && !menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🔁 Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutsideMenu = (event) => {
      const clickedInsideMenu = menuRef.current && menuRef.current.contains(event.target);
      const clickedInsideMobileMenuSheet = mobileMenuSheetRef.current && mobileMenuSheetRef.current.contains(event.target);
      if (!clickedInsideMenu && !clickedInsideMobileMenuSheet) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutsideMenu);
    }
    return () => document.removeEventListener('mousedown', handleClickOutsideMenu);
  }, [menuOpen]);

  // 🔁 Close search bar when clicking outside
  useEffect(() => {
    const handleClickOutsideSearch = (event) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        setSearchError(null);
      }
    };
    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutsideSearch);
    }
    return () => document.removeEventListener('mousedown', handleClickOutsideSearch);
  }, [searchOpen]);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  // Dynamic theme detection and pulling animation based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (isMobile) {
        // Keep consistent dark-theme (black text/icons) on mobile
        setNavbarTheme('dark-theme');
        setIsPulled(window.scrollY > 50);
        return;
      }
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Pulling animation: activate when scrolled down on any page
      if (scrollY > 50) { // Start pulling after 50px scroll on any page for more responsive animation
        setIsPulled(true);
      } else {
        setIsPulled(false);
      }
      
      // Theme detection based on current page using location from React Router
      const currentPath = location.pathname;
      
      // Check if we're on homepage (has hero section)
      if (currentPath === '/') {
        if (scrollY < windowHeight) {
          // In hero section - white text on dark background
          setNavbarTheme('light-theme');
        } else {
          // Outside hero section - use dark theme for light backgrounds
          setNavbarTheme('dark-theme');
        }
      } else {
        // On other pages (category pages, etc.) - use dark theme for light backgrounds
        setNavbarTheme('dark-theme');
      }
    };

    // Initial check
    handleScroll();
    
    // Listen for scroll events
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, isMobile]); // include isMobile

  // Handle route changes and reset navbar state
  useEffect(() => {
    // Reset pulling animation when route changes
    setIsPulled(false);
    
    // Set initial theme based on current page with a small delay to ensure proper detection
    const setInitialTheme = () => {
      if (isMobile) {
        setNavbarTheme('dark-theme');
        return;
      }
      const currentPath = location.pathname;
      if (currentPath === '/') {
        // On homepage, check if we're in hero section
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        if (scrollY < windowHeight) {
          setNavbarTheme('light-theme');
        } else {
          setNavbarTheme('dark-theme');
        }
      } else {
        // On other pages, use dark theme
        setNavbarTheme('dark-theme');
      }
    };
    
    // Set theme immediately and also after a short delay
    setInitialTheme();
    const timeoutId = setTimeout(setInitialTheme, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname, isMobile]);

  // Check if mobile/tablet
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleSearchSelect = (productId) => {
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/products/${productId}`);
  };

  const handleMobileNavigate = (path) => {
    console.log('Mobile navigate to:', path); // Debug log
    // Close sheets first, then navigate
    setMenuOpen(false);
    setDropdownOpen(false);
    navigate(path);
  };

  return (
    <nav className={`navbar ${navbarTheme} ${isPulled ? 'pulled' : ''} ${searchOpen ? 'search-open' : ''} ${isMobile ? 'mobile-nav' : ''}`}>
      {mobileSearchOpen && (
        <div className="mobile-search-overlay">
          <div className="search-input-wrapper-inner">
            <span className="search-input-icon"><FaSearch size={18} /></span>
            <input
              type="text"
              placeholder="Search.."
              className="mobile-search-input"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button
              className="mobile-search-cancel"
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
                setSearchError(null);
              }}
              aria-label="Close search"
            >
              <FaTimes size={18} />
            </button>
          </div>
          {(searchLoading || searchResults.length > 0 || searchError) && searchQuery && (
            <div className="search-suggestions-dropdown mobile">
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

      <div className="navbar-container" style={{ display: mobileSearchOpen ? 'none' : undefined }}>
        <button className="hamburger-button" onClick={toggleMenu} aria-label="Toggle menu">
          <FaBars />
        </button>

        <div className="navbar-left">
          <Link to="/" className="navbar-brand">EVOLEXX</Link>
        </div>

        {/* ✅ Mobile dropdown with ref */}
        <div
          ref={menuRef}
          className={`navbar-center ${menuOpen ? 'open' : ''}`}
        >
          <div className="navbar-links">
            {/* Logo - only visible when pulled */}
            {isPulled && (
              <Link to="/" className="navbar-brand" style={{ marginRight: '1rem' }}>EVOLEXX</Link>
            )}
            
            {/* Navigation Links */}
            <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active-link' : ''}`} onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/category/Mobile%20Phone" className={`navbar-link ${location.pathname === '/category/Mobile%20Phone' ? 'active-link' : ''}`} onClick={() => setMenuOpen(false)}>Brand New</Link>
            <Link to="/category/Preowned%20Phones" className={`navbar-link ${location.pathname === '/category/Preowned%20Phones' ? 'active-link' : ''}`} onClick={() => setMenuOpen(false)}>Pre Owned</Link>
            <Link to="/category/Mobile%20Accessories" className={`navbar-link ${location.pathname === '/category/Mobile%20Accessories' ? 'active-link' : ''}`} onClick={() => setMenuOpen(false)}>Accessories</Link>
            
            {/* Icons - only visible when pulled */}
            {isPulled && (
              <>
                {window.innerWidth > 768 ? (
                  <button
                    className="search-icon-button"
                    onClick={() => setSearchOpen(true)}
                    aria-label="Open search"
                  >
                    <FaSearch size={18} />
                  </button>
                ) : (
                  <button
                    className="search-icon-button"
                    onClick={() => setMobileSearchOpen(true)}
                    aria-label="Open mobile search"
                  >
                    <FaSearch size={18} />
                  </button>
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
                  {dropdownOpen && (
                    <div className="dropdown-menu show-dropdown">
                      {user ? (
                        <>
                          <div className="dropdown-text-1">
                            <span className="user-name-dropdown-text">{user.name}</span>
                          </div>
                          <Link to="/myorders" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
                            <FaCog className="dropdown-icon" />
                            My Orders
                          </Link>
                          <button className="logout-dropdown-button" onClick={handleLogout}>
                            <FaSignOutAlt className="dropdown-icon" />
                            Logout
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="dropdown-link" onClick={() => { setDropdownOpen(false); setLoginModalOpen(true); }}>
                            <FaSignInAlt className="dropdown-icon" />
                            Login
                          </button>
                          <button className="dropdown-link" onClick={() => { setDropdownOpen(false); setRegisterModalOpen(true); }}>
                            <FaUserPlus className="dropdown-icon" />
                            Register
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>


        <div className="navbar-right">
          {window.innerWidth > 768 ? (
            <button
              className="search-icon-button"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
            >
              <FaSearch size={18} />
            </button>
          ) : (
            <button
              className="search-icon-button"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Open search"
            >
              <FaSearch size={18} />
            </button>
          )}

          {user && (
            <Link to="/cart" className="cart-button">
              <FaShoppingCart size={18} />
              <span className="cart-count">{cartItems.length}</span>
            </Link>
          )}

    

          {/* Profile dropdown */}
          <div className="profile-dropdown-wrapper" ref={dropdownRightRef}>
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

      {/* Search Bar - Outside navbar container for proper positioning */}
      {searchOpen && window.innerWidth > 768 && (
        <div ref={searchBarRef} className={`search-bar-integrated ${searchOpen ? 'visible' : ''}`}>
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
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
                setSearchError(null);
              }}
              aria-label="Close search"
              type="button"
            >
              <FaTimes size={14} />
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

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <>
          <div className="mobile-bottom-nav">
            <button 
              className={`mobile-nav-item ${menuOpen ? 'active' : ''}`}
              onClick={() => { setMenuOpen(!menuOpen); setDropdownOpen(false); }}
              aria-label="Toggle menu"
            >
              <FaBars size={20} />
              <span>Menu</span>
            </button>
            
            <button 
              className="mobile-nav-item"
              onClick={() => { setMobileSearchOpen(true); setMenuOpen(false); setDropdownOpen(false); }}
              aria-label="Search"
            >
              <FaSearch size={20} />
              <span>Search</span>
            </button>
            
            {user && (
              <Link to="/cart" className="mobile-nav-item" onClick={() => { setMenuOpen(false); setDropdownOpen(false); }}>
                <FaShoppingCart size={20} />
                <span>Cart</span>
                {cartItems.length > 0 && (
                  <span className="mobile-cart-count">{cartItems.length}</span>
                )}
              </Link>
            )}
            
            <button 
              className={`mobile-nav-item ${dropdownOpen ? 'active' : ''}`}
              onClick={() => { setDropdownOpen(!dropdownOpen); setMenuOpen(false); }}
              aria-label="Profile"
            >
              <FaUserCircle size={20} />
              <span>Profile</span>
            </button>
          </div>

          {/* Mobile Menu Sheet - Categories */}
          {menuOpen && (
            <div className="mobile-sheet" ref={mobileMenuSheetRef}>
              <div className="mobile-sheet-header">Categories</div>
              <div className="mobile-sheet-links">
                <button className="mobile-sheet-link" onClick={() => handleMobileNavigate('/')}>Home</button>
                <button className="mobile-sheet-link" onClick={() => handleMobileNavigate('/category/Mobile%20Phone')}>Brand New</button>
                <button className="mobile-sheet-link" onClick={() => handleMobileNavigate('/category/Preowned%20Phones')}>Pre Owned</button>
                <button className="mobile-sheet-link" onClick={() => handleMobileNavigate('/category/Mobile%20Accessories')}>Accessories</button>
              </div>
            </div>
          )}

          {/* Mobile Profile Sheet */}
          {dropdownOpen && (
            <div className="mobile-sheet" ref={mobileProfileSheetRef}>
              <div className="mobile-sheet-header">Account</div>
              <div className="mobile-sheet-links">
                {user ? (
                  <>
                    <button className="mobile-sheet-link" onClick={() => handleMobileNavigate('/my-orders')}>My Orders</button>
                    <button className="mobile-sheet-link" onClick={() => handleMobileNavigate('/settings')}>Settings</button>
                    <button className="mobile-sheet-link danger" onClick={() => { handleLogout(); }}>Logout</button>
                  </>
                ) : (
                  <>
                    <button className="mobile-sheet-link" onClick={() => { setLoginModalOpen(true); setDropdownOpen(false); }}>Login</button>
                    <button className="mobile-sheet-link" onClick={() => { setRegisterModalOpen(true); setDropdownOpen(false); }}>Register</button>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </nav>
  );
};

export default Navbar;
