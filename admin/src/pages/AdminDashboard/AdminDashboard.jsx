import React from 'react';
import { useNavigate } from 'react-router-dom';

import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">
        Welcome to the Admin Dashboard
      </h1>
      <p className="dashboard-description">
        Here you can get a quick overview of your inventory, orders, and shipments.
        Use the navigation bar above to manage different aspects of your application.
      </p>

      <div className="dashboard-cards-grid">
        <div className="dashboard-card dashboard-card-blue">
          <svg className="dashboard-card-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m7 0V5a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6" />
          </svg>
          <h2 className="dashboard-card-title">Inventory Summary</h2>
          <p className="dashboard-card-description">Manage your products and stock levels.</p>
          <button
            onClick={() => navigate('/AddProduct')}
            className="dashboard-button blue-text"
          >
            Add Product
          </button>
          <button
            onClick={() => navigate('/Products')}
            className="dashboard-button blue-text"
          >
            View All Products
          </button>
        </div>

        <div className="dashboard-card dashboard-card-green">
          <svg className="dashboard-card-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h2 className="dashboard-card-title">Order Overview</h2>
          <p className="dashboard-card-description">Process new orders and track their status.</p>
          <button
            onClick={() => navigate('/OrderList')}
            className="dashboard-button green-text"
          >
            View Orders
          </button>
        </div>

        <div className="dashboard-card dashboard-card-purple">
          <svg className="dashboard-card-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 17l4 4m0 0l4-4m-4 4V3" />
          </svg>
          <h2 className="dashboard-card-title">Shipment Status</h2>
          <p className="dashboard-card-description">Monitor all outgoing shipments.</p>
          <button
            onClick={() => navigate('/ToBeShippedList')}
            className="dashboard-button purple-text"
          >
            View Shipments
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;