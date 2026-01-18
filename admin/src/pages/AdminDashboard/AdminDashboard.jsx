import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox, 
  faShoppingCart, 
  faClock, 
  faExclamationTriangle, 
  faCheckCircle, 
  faChartBar, 
  faSync,
  faCheck
} from '@fortawesome/free-solid-svg-icons';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orderStats, setOrderStats] = useState({ labels: [], data: [] });
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalUsers: 0,
    completedOrders: 0
  });
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');

      // Fetch all necessary data
      const [ordersRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/products`)
      ]);

      const orders = await ordersRes.json();
      const products = await productsRes.json();

      // Calculate stats
      const stats = {
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0),
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'delivered').length,
        lowStockProducts: products.filter(p => p.stock > 0 && p.stock < 5).length,
        outOfStockProducts: products.filter(p => p.stock === 0).length,
        totalUsers: 0
      };

      setDashboardStats(stats);

      // Process order stats for chart
      const dateMap = {};
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const date = orderDate.toISOString().split('T')[0];
        dateMap[date] = (dateMap[date] || 0) + 1;
      });

      const labels = Object.keys(dateMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).slice(-7); // Last 7 days
      const data = labels.map(date => dateMap[date]);
      setOrderStats({ labels, data });

    } catch (err) {
      // Failed to fetch dashboard data
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid - 5 Cards in Single Line */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/Products')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <div className="stat-card-title">Total Products</div>
            <div className="stat-card-icon"><FontAwesomeIcon icon={faBox} /></div>
          </div>
          <div className="stat-card-value">{dashboardStats.totalProducts}</div>
          <div className="stat-card-change positive">→ View all products</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/OrderList')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <div className="stat-card-title">Total Orders</div>
            <div className="stat-card-icon"><FontAwesomeIcon icon={faShoppingCart} /></div>
          </div>
          <div className="stat-card-value">{dashboardStats.totalOrders}</div>
          <div className="stat-card-change positive">→ View all orders</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/OrderList')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <div className="stat-card-title">Pending Orders</div>
            <div className="stat-card-icon"><FontAwesomeIcon icon={faClock} /></div>
          </div>
          <div className="stat-card-value">{dashboardStats.pendingOrders}</div>
          <div className="stat-card-change"><FontAwesomeIcon icon={faExclamationTriangle} /> Needs attention</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/low-stock')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <div className="stat-card-title">Low Stock</div>
            <div className="stat-card-icon"><FontAwesomeIcon icon={faExclamationTriangle} /></div>
          </div>
          <div className="stat-card-value">{dashboardStats.lowStockProducts}</div>
          <div className="stat-card-change">→ View products</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Completed</div>
            <div className="stat-card-icon"><FontAwesomeIcon icon={faCheckCircle} /></div>
          </div>
          <div className="stat-card-value">{dashboardStats.completedOrders}</div>
          <div className="stat-card-change positive"><FontAwesomeIcon icon={faCheck} /> Delivered orders</div>
        </div>
      </div>

      {/* Orders Chart */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Orders Overview (Last 7 Days)</h2>
          <button onClick={fetchDashboardData} className="btn btn-sm btn-secondary">
            <FontAwesomeIcon icon={faSync} /> Refresh
          </button>
        </div>
        <div className="admin-card-body">
          {orderStats.labels.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FontAwesomeIcon icon={faChartBar} /></div>
              <div className="empty-state-title">No order data available</div>
              <div className="empty-state-text">Orders will appear here once they are placed</div>
            </div>
          ) : (
            <div style={{ height: '220px' }}>
              <Line
                data={{
                  labels: orderStats.labels.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                  datasets: [
                    {
                      label: 'New Orders',
                      data: orderStats.data,
                      borderColor: '#0f172a',
                      backgroundColor: 'rgba(15, 23, 42, 0.05)',
                      borderWidth: 2.5,
                      fill: true,
                      tension: 0.4,
                      pointRadius: 4,
                      pointHoverRadius: 6,
                      pointBackgroundColor: '#0f172a',
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      pointHoverBackgroundColor: '#0f172a',
                      pointHoverBorderColor: '#fff',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: { 
                      enabled: true,
                      backgroundColor: '#0f172a',
                      padding: 12,
                      titleFont: { size: 13, weight: '600' },
                      bodyFont: { size: 12 },
                      borderColor: '#e2e8f0',
                      borderWidth: 1,
                      cornerRadius: 8,
                      displayColors: false,
                    },
                    filler: {
                      propagate: false
                    }
                  },
                  scales: {
                    x: { 
                      grid: { 
                        display: false 
                      },
                      ticks: {
                        font: { size: 11 },
                        color: '#64748b'
                      }
                    },
                    y: { 
                      beginAtZero: true,
                      ticks: { 
                        stepSize: 1,
                        font: { size: 11 },
                        color: '#64748b'
                      },
                      grid: { 
                        color: 'rgba(0, 0, 0, 0.04)',
                        drawBorder: false
                      },
                      border: {
                        display: false
                      }
                    },
                  },
                  interaction: {
                    intersect: false,
                    mode: 'index',
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
