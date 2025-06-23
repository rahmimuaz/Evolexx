import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="navbar-container">
      <nav className="navbar">
        <div className="navbar-inner-container">
          <div className="navbar-logo-wrapper">
            <NavLink to="/" className="navbar-logo">
              Admin Portal
            </NavLink>
          </div>

          <div className="navbar-links-desktop">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'active' : ''}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/Products"
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'active' : ''}`
              }
            >
              Inventory
            </NavLink>
            <NavLink
              to="/OrderList"
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'active' : ''}`
              }
            >
              Orders
            </NavLink>
            <NavLink
              to="/ToBeShippedList"
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'active' : ''}`
              }
            >
              Shipments
            </NavLink>
          </div>

          <div className="navbar-mobile-menu-button-wrapper">
            <button
              onClick={toggleMenu}
              className="navbar-mobile-menu-button"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg
                  className="block h-8 w-8"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-8 w-8"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className={`navbar-mobile-menu ${isOpen ? 'open' : ''}`} id="mobile-menu">
          <div className="navbar-mobile-menu-links">
            <NavLink
              to="/"
              onClick={toggleMenu}
              className={({ isActive }) =>
                `navbar-mobile-link ${isActive ? 'active' : ''}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/Products"
              onClick={toggleMenu}
              className={({ isActive }) =>
                `navbar-mobile-link ${isActive ? 'active' : ''}`
              }
            >
              Inventory
            </NavLink>
            <NavLink
              to="/OrderList"
              onClick={toggleMenu}
              className={({ isActive }) =>
                `navbar-mobile-link ${isActive ? 'active' : ''}`
              }
            >
              Orders
            </NavLink>
            <NavLink
              to="/ToBeShippedList"
              onClick={toggleMenu}
              className={({ isActive }) =>
                `navbar-mobile-link ${isActive ? 'active' : ''}`
              }
            >
              Shipments
            </NavLink>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
};

export default Navbar;