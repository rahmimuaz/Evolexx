import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { useEffect, useState } from 'react';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orderStats, setOrderStats] = useState({ labels: [], data: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch orders and group by date
    const fetchOrderStats = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('http://localhost:5001/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const orders = await res.json();
        // Group orders by date (YYYY-MM-DD)
        const dateMap = {};
        orders.forEach(order => {
          const date = new Date(order.createdAt).toLocaleDateString();
          dateMap[date] = (dateMap[date] || 0) + 1;
        });
        const labels = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b));
        const data = labels.map(date => dateMap[date]);
        setOrderStats({ labels, data });
      } catch (err) {
        setOrderStats({ labels: [], data: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchOrderStats();
  }, []);

  return (
    <div className="admin-dashboard-layout">
      <aside className="admin-sidebar">
        <ul className="sidebar-links">
          <li onClick={() => navigate('/AddProduct')}>Add Product</li>
          <li onClick={() => navigate('/Products')}>View All Products</li>
          <li onClick={() => navigate('/OrderList')}>View Orders</li>
          <li onClick={() => navigate('/ToBeShippedList')}>View Shipments</li>
          <li onClick={() => navigate('/admin/low-stock')}>Low Stock Products</li>
          <li onClick={() => navigate('/admin/out-of-stock')}>Out of Stock Products</li>
          <li onClick={() => navigate('/admin/users')}>View All Users</li>
        </ul>
      </aside>
      <main className="admin-dashboard-main">
        <h1 className="dashboard-title">Welcome to the Admin Dashboard</h1>
        <p className="dashboard-description">
          Here you can get a quick overview of your inventory, orders, and shipments.
        </p>
        <div className="dashboard-graph-placeholder">
          {loading ? (
            <span>Loading order graph...</span>
          ) : orderStats.labels.length === 0 ? (
            <span>No order data available</span>
          ) : (
            <Bar
              data={{
                labels: orderStats.labels,
                datasets: [
                  {
                    label: 'New Orders',
                    data: orderStats.data,
                    backgroundColor: '#3b82f6',
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: { enabled: true },
                },
                scales: {
                  x: { title: { display: true, text: 'Date' } },
                  y: { title: { display: true, text: 'Orders' }, beginAtZero: true },
                },
              }}
              height={80}
            />
          )}
        </div>
        <div className="dashboard-cards-grid">
          {/* Existing cards can be kept or moved as needed */}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;