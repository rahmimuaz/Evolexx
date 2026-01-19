import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartBar, 
  faBox, 
  faPlus, 
  faExclamationTriangle, 
  faTimesCircle, 
  faStar, 
  faClipboardList,
  faShoppingCart, 
  faTruck, 
  faUsers, 
  faUser, 
  faSignOutAlt, 
  faBell,
  faChevronLeft,
  faChevronRight,
  faTimes,
  faVideo,
  faReceipt
} from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';

const Sidebar = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const [lowStockRes, outOfStockRes, ordersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/products/admin/low-stock`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get(`${API_BASE_URL}/api/products/admin/out-of-stock`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get(`${API_BASE_URL}/api/orders`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
        ]);
        
        const lowStock = lowStockRes.data.map(p => ({ 
          type: 'low', 
          msg: `Low stock: ${p.name} (${p.stock})`, 
          link: `/EditProduct/${p._id}` 
        }));
        
        const outOfStock = outOfStockRes.data.map(p => ({ 
          type: 'out', 
          msg: `Out of stock: ${p.name}`, 
          link: `/EditProduct/${p._id}` 
        }));
        
        const newOrders = ordersRes.data
          .filter(o => o.status === 'pending')
          .map(o => ({ 
            type: 'order', 
            msg: `New order: #${o.orderNumber}`, 
            link: `/OrderList` 
          }));
        
        const allAlerts = [...lowStock, ...outOfStock, ...newOrders];
        setAlerts(allAlerts);
        setUnreadCount(allAlerts.length);
      } catch (err) {
        setAlerts([]);
        setUnreadCount(0);
      }
    };
    fetchAlerts();

    // Refresh alerts every 60 seconds
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [API_BASE_URL]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setUnreadCount(0);
    }
  };

  const handleNotificationClick = (link) => {
    setShowNotifications(false);
    if (link) navigate(link);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        {/* Logo Section */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            {isSidebarOpen && <span className="logo-text">Evolexx Admin</span>}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <NavLink
            to="/"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Dashboard"
          >
            <span className="sidebar-icon"><FontAwesomeIcon icon={faChartBar} /></span>
            {isSidebarOpen && <span className="sidebar-text">Dashboard</span>}
          </NavLink>

          {/* Inventory Section */}
          <div className="sidebar-section-title">
            {isSidebarOpen && <span>INVENTORY</span>}
          </div>

          <NavLink
            to="/Products"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Products"
          >
            <span className="sidebar-icon"><FontAwesomeIcon icon={faBox} /></span>
            {isSidebarOpen && <span className="sidebar-text">Products</span>}
          </NavLink>

          <NavLink
            to="/AddProduct"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Add Product"
          >
            <span className="sidebar-icon"><FontAwesomeIcon icon={faPlus} /></span>
            {isSidebarOpen && <span className="sidebar-text">Add Product</span>}
          </NavLink>

          <NavLink
            to="/admin/low-stock"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Low Stock"
          >
            <span className="sidebar-icon"><FontAwesomeIcon icon={faExclamationTriangle} /></span>
            {isSidebarOpen && <span className="sidebar-text">Low Stock</span>}
          </NavLink>

          <NavLink
            to="/admin/out-of-stock"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Out of Stock"
          >
            <span className="sidebar-icon"><FontAwesomeIcon icon={faTimesCircle} /></span>
            {isSidebarOpen && <span className="sidebar-text">Out of Stock</span>}
          </NavLink>

          <NavLink
            to="/admin/new-arrivals"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="New Arrivals"
          >
            <span className="sidebar-icon"><FontAwesomeIcon icon={faStar} /></span>
            {isSidebarOpen && <span className="sidebar-text">New Arrivals</span>}
          </NavLink>

          <NavLink
            to="/admin/product-order"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Product Order"
          >
            <span className="sidebar-icon"><FontAwesomeIcon icon={faClipboardList} /></span>
            {isSidebarOpen && <span className="sidebar-text">Product Order</span>}
          </NavLink>

          {/* Orders Section */}
          <div className="sidebar-section-title">
            {isSidebarOpen && <span>ORDERS</span>}
          </div>

          <NavLink
            to="/OrderList"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Orders"
          >
            <span className="sidebar-icon"><FontAwesomeIcon icon={faShoppingCart} /></span>
            {isSidebarOpen && <span className="sidebar-text">Orders</span>}
          </NavLink>

          <NavLink
            to="/ToBeShippedList"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Shipments"
          >
            <span className="sidebar-icon"><FontAwesomeIcon icon={faTruck} /></span>
            {isSidebarOpen && <span className="sidebar-text">Shipments</span>}
          </NavLink>

          <NavLink
            to="/admin/local-sales"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Local Sales"
          >
            <span className="sidebar-icon"><FontAwesomeIcon icon={faReceipt} /></span>
            {isSidebarOpen && <span className="sidebar-text">Local Sales</span>}
          </NavLink>

          {/* Users Section */}
          <div className="sidebar-section-title">
            {isSidebarOpen && <span>USERS</span>}
          </div>

          <NavLink
            to="/admin/users"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Customers"
          >
            <span className="sidebar-icon"><FontAwesomeIcon icon={faUsers} /></span>
            {isSidebarOpen && <span className="sidebar-text">Customers</span>}
          </NavLink>

          <NavLink
            to="/register"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Register Admin"
          >
            <span className="sidebar-icon"><FontAwesomeIcon icon={faUser} /></span>
            {isSidebarOpen && <span className="sidebar-text">Register Admin</span>}
          </NavLink>

          {/* Settings Section */}
          <div className="sidebar-section-title">
            {isSidebarOpen && <span>SETTINGS</span>}
          </div>

          <NavLink
            to="/admin/hero-video"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Hero Video"
          >
            <span className="sidebar-icon"><FontAwesomeIcon icon={faVideo} /></span>
            {isSidebarOpen && <span className="sidebar-text">Hero Video</span>}
          </NavLink>
        </nav>

        {/* Bottom Section */}
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-link logout-link" title="Sign Out">
            <span className="sidebar-icon"><FontAwesomeIcon icon={faSignOutAlt} /></span>
            {isSidebarOpen && <span className="sidebar-text">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`admin-main ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Top Bar */}
        <header className="admin-topbar">
          <button onClick={toggleSidebar} className="sidebar-toggle-btn" title="Toggle Sidebar">
            <FontAwesomeIcon icon={isSidebarOpen ? faChevronLeft : faChevronRight} />
          </button>

          <div className="topbar-right">
            {/* Notifications */}
            <div className="notifications-container">
              <button onClick={toggleNotifications} className="notification-btn" title="Notifications">
                <span className="notification-icon"><FontAwesomeIcon icon={faBell} /></span>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>Notifications</h4>
                    <button onClick={() => setShowNotifications(false)} className="close-btn">
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                  <div className="notification-body">
                    {alerts.length === 0 ? (
                      <div className="notification-empty">No new alerts</div>
                    ) : (
                      <ul className="notification-list">
                        {alerts.map((alert, idx) => (
                          <li
                            key={idx}
                            className={`notification-item notification-${alert.type}`}
                            onClick={() => handleNotificationClick(alert.link)}
                          >
                            {alert.msg}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="user-info">
              <span className="user-icon"><FontAwesomeIcon icon={faUser} /></span>
              <span className="user-name">Admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Sidebar;

