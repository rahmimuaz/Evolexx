import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../../context/UserContext';
import { Link } from 'react-router-dom';
import './MyOrders.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const MyOrders = () => {
  const { user } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);

        const pendingOrdersPromise = axios.get(`${API_BASE_URL}/api/orders/myorders`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        const shippedOrdersPromise = axios.get(`${API_BASE_URL}/api/tobeshipped/myorders`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        const [pendingOrdersRes, shippedOrdersRes] = await Promise.all([
          pendingOrdersPromise,
          shippedOrdersPromise
        ]);

        // Add a 'type' identifier to each order to distinguish them
        const pendingOrders = pendingOrdersRes.data.map(order => ({ ...order, type: 'Order' }));
        const shippedOrders = shippedOrdersRes.data.map(order => ({ ...order, type: 'ToBeShipped' }));

        const combinedOrders = [...pendingOrders, ...shippedOrders];

        // Sort orders by creation date (most recent first)
        combinedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        console.log('Combined orders for MyOrders:', combinedOrders); // Debugging
        setOrders(combinedOrders);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching orders:', err.message || err);
        setError('Failed to fetch orders. Please try again.');
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (!user) return <div className="orders-message">Please log in to view your orders.</div>;
  if (loading) return <div className="orders-message">Loading your orders...</div>;
  if (error) return <div className="orders-message error">{error}</div>;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/logo192.png';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${API_BASE_URL}${imagePath}`;
    if (imagePath.startsWith('uploads/')) return `${API_BASE_URL}/${imagePath}`;
    return `${API_BASE_URL}/uploads/${imagePath}`;
  };

  const getPrimaryImageForOrder = (order) => {
    try {
      const firstItem = order?.orderItems?.[0];
      // Use variation image if available, otherwise use item.image, otherwise product image
      let imageUrl = null;
      if (firstItem?.selectedVariation?.images && firstItem.selectedVariation.images.length > 0) {
        imageUrl = firstItem.selectedVariation.images[0];
      } else if (firstItem?.image) {
        imageUrl = firstItem.image;
      } else if (firstItem?.product?.images && firstItem.product.images.length > 0) {
        imageUrl = firstItem.product.images[0];
      }
      return imageUrl ? getImageUrl(imageUrl) : '/logo192.png';
    } catch (e) {
      return '/logo192.png';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#f59e0b';
      case 'accepted':
      case 'approved':
        return '#10b981';
      case 'shipped':
        return '#3b82f6';
      case 'delivered':
        return '#059669';
      case 'declined':
      case 'denied':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '⏳';
      case 'accepted':
      case 'approved':
        return '✅';
      case 'shipped':
        return '🚚';
      case 'delivered':
        return '📦';
      case 'declined':
      case 'denied':
        return '❌';
      default:
        return '📋';
    }
  };

  const getOrderTypeBadge = (type) => {
    return type === 'ToBeShipped' ? 'Shipped' : 'Processing';
  };

  const getOrderTypeColor = (type) => {
    return type === 'ToBeShipped' ? '#3b82f6' : '#f59e0b';
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2 className="orders-heading">My Orders</h2>
        <p className="orders-subtitle">Track and manage your orders</p>
      </div>
      
      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No orders found</h3>
          <p>You haven't placed any orders yet. Start shopping to see your orders here!</p>
          <Link to="/" className="shop-now-btn">Start Shopping</Link>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-image">
                <img src={getPrimaryImageForOrder(order)} alt={order.orderNumber || 'Order'} onError={(e) => (e.currentTarget.src = '/logo192.png')} />
              </div>
              <div className="order-card-header">
                <div className="order-info">
                  <h3 className="order-number">{order.orderNumber || 'N/A'}</h3>
                  <div className="order-type-badge" style={{ backgroundColor: getOrderTypeColor(order.type) }}>
                    {getOrderTypeBadge(order.type)}
                  </div>
                </div>
                <div className="order-date">
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : ''}
                </div>
              </div>

              <div className="order-card-body">
                <div className="order-status">
                  <span className="status-icon">{getStatusIcon(order.status)}</span>
                  <span 
                    className="status-text" 
                    style={{ color: getStatusColor(order.status) }}
                  >
                    {order.status || 'N/A'}
                  </span>
                </div>
                
                <div className="order-total">
                  <span className="total-label">Total Amount</span>
                  <span className="total-amount">
                    Rs. {order.totalPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="order-card-footer">
                <div className="order-actions">
                  {order.type === 'Order' ? (
                    <Link to={`/order/${order._id}`} className="view-details-btn">
                      View Details
                    </Link>
                  ) : order.type === 'ToBeShipped' ? (
                    <Link to={`/tobeshipped/order/${order._id}`} className="view-shipment-btn">
                      Track Shipment
                    </Link>
                  ) : (
                    <span className="no-action">No Action Available</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;