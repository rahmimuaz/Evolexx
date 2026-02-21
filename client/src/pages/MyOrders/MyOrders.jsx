import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../../context/UserContext';
import { Link } from 'react-router-dom';
import { FaBox, FaTruck, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import './MyOrders.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const MyOrders = () => {
  const { user } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [pendingRes, shippedRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/orders/myorders`, {
            headers: { Authorization: `Bearer ${user.token}` }
          }),
          axios.get(`${API_BASE_URL}/api/tobeshipped/myorders`, {
            headers: { Authorization: `Bearer ${user.token}` }
          })
        ]);
        const pending = pendingRes.data.map(o => ({ ...o, type: 'Order' }));
        const shipped = shippedRes.data.map(o => ({ ...o, type: 'ToBeShipped' }));
        const combined = [...pending, ...shipped].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrders(combined);
        if (combined.length > 0 && !selectedOrder) {
          setSelectedOrder(combined[0]._id);
        }
      } catch (err) {
        setError('Failed to fetch orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  useEffect(() => {
    if (!selectedOrder || !user || orders.length === 0) return;
    const order = orders.find(o => o._id === selectedOrder);
    if (!order) return;

    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        if (order.type === 'ToBeShipped') {
          const { data } = await axios.get(
            `${API_BASE_URL}/api/tobeshipped/order/${selectedOrder}`,
            { headers: { Authorization: `Bearer ${user.token}` } }
          );
          setSelectedOrderDetails(data);
        } else {
          const { data } = await axios.get(
            `${API_BASE_URL}/api/orders/${selectedOrder}`,
            { headers: { Authorization: `Bearer ${user.token}` } }
          );
          setSelectedOrderDetails(data);
        }
      } catch {
        setSelectedOrderDetails(null);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [selectedOrder, user, orders]);

  const filteredOrders = orders.filter(
    o =>
      !searchQuery ||
      (o.orderNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'delivered': return '#374151';
      case 'shipped': return '#4b5563';
      case 'accepted':
      case 'approved': return '#6b7280';
      case 'pending': return '#9ca3af';
      case 'declined':
      case 'denied': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  const getStatusLabel = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'delivered': return 'Delivered';
      case 'shipped': return 'In Transit';
      case 'accepted':
      case 'approved': return 'Approved';
      case 'pending': return 'Processing';
      case 'declined':
      case 'denied': return 'Declined';
      default: return status || 'N/A';
    }
  };

  const getTypeIcon = (type) =>
    type === 'ToBeShipped' ? (
      <span className="parcel-icon shipping"><FaTruck /></span>
    ) : (
      <span className="parcel-icon courier"><FaBox /></span>
    );

  const getTypeLabel = (type) =>
    type === 'ToBeShipped' ? 'Shipping' : 'Processing';

  const getRouteText = (order) => {
    const addr = order?.shippingAddress;
    if (!addr) return '—';
    const city = addr.city || '';
    return city ? `Store → ${city}` : (addr.address || '—');
  };

  const getTimelineSteps = (order) => {
    if (!order) return [];
    const status = (order.status || '').toLowerCase();
    const createdAt = order.createdAt ? new Date(order.createdAt) : null;
    const city = order.shippingAddress?.city || 'Destination';
    const steps = [];

    if (status === 'delivered') {
      steps.push({ label: 'Delivered', location: city, date: createdAt, active: true });
      steps.push({ label: 'In Transit', location: 'On the way', date: createdAt, active: false });
      steps.push({ label: 'Approved', location: 'Order approved', date: createdAt, active: false });
    } else if (status === 'shipped') {
      steps.push({ label: 'In Transit', location: 'On the way', date: createdAt, active: true });
      steps.push({ label: 'Approved', location: 'Order approved', date: createdAt, active: false });
    } else {
      const label = status === 'pending' ? 'New' : 'Approved';
      steps.push({ label, location: 'Order placed', date: createdAt, active: true });
    }
    return steps;
  };

  if (!user) {
    return (
      <div className="my-orders-page">
        <div className="orders-login-msg">Please log in to view your orders.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="my-orders-page">
        <div className="my-orders-layout">
          <div className="my-orders-main" style={{ padding: '2rem' }}>
            <div className="skeleton skeleton-title" style={{ width: '200px', height: '28px', marginBottom: '1.5rem' }} />
            <div className="skeleton skeleton-text" style={{ width: '100%', height: '120px', marginBottom: '1.5rem', borderRadius: '12px' }} />
            <div className="skeleton skeleton-text" style={{ width: '100%', height: '200px', borderRadius: '8px' }} />
          </div>
          <div className="my-orders-sidebar" style={{ padding: '2rem' }}>
            <div className="skeleton skeleton-title" style={{ width: '60%', height: '24px', marginBottom: '1rem' }} />
            <div className="skeleton skeleton-text" style={{ width: '100%', height: '100px', marginBottom: '1rem', borderRadius: '8px' }} />
            <div className="skeleton skeleton-text" style={{ width: '80%', height: '80px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-orders-page">
        <div className="orders-error-msg">{error}</div>
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <div className="my-orders-layout">
        {/* Main content card */}
        <div className="my-orders-main">
          <div className="orders-banner">
            <div className="banner-content">
              <h3>Track your orders</h3>
              <p>View status and delivery details for all your purchases.</p>
              <Link to="/" className="banner-btn">Start Shopping</Link>
            </div>
            <div className="banner-illustration">
              <div className="delivery-truck-icon">📦</div>
            </div>
          </div>

          <div className="orders-section">
            <div className="section-header">
              <h4>Your orders</h4>
              <div className="section-actions">
                <div className="search-wrap">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by order number"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="date-range">
                  <FaCalendarAlt />
                  <span>
                    {orders.length > 0
                      ? `${new Date(Math.min(...orders.map(o => new Date(o.createdAt)))).toLocaleDateString()} - ${new Date(Math.max(...orders.map(o => new Date(o.createdAt)))).toLocaleDateString()}`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="empty-orders">
                <div className="empty-icon">📦</div>
                <h3>No orders yet</h3>
                <p>Start shopping to see your orders here.</p>
                <Link to="/" className="shop-btn">Shop Now</Link>
              </div>
            ) : (
              <div className="parcels-list-wrapper">
                <div className="parcels-list">
                {filteredOrders.map((order) => (
                  <div
                    key={order._id}
                    className={`parcel-row ${selectedOrder === order._id ? 'selected' : ''}`}
                    onClick={() => setSelectedOrder(order._id)}
                  >
                    <div className="parcel-type">{getTypeIcon(order.type)}</div>
                    <div className="parcel-type-label">{getTypeLabel(order.type)}</div>
                    <div className="parcel-route">{getRouteText(order)}</div>
                    <div className="parcel-id">{order.orderNumber || order._id?.slice(-8)}</div>
                    <div className="parcel-date">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : '—'}
                    </div>
                    <div className="parcel-status">
                      <span
                        className="status-dot"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      />
                      {getStatusLabel(order.status)}
                    </div>
                    <div className="parcel-price">
                      Rs. {order.totalPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - selected order details */}
        <aside className="my-orders-sidebar">
          {selectedOrder && filteredOrders.some(o => o._id === selectedOrder) ? (
            loadingDetails ? (
              <div className="sidebar-loading">
                <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: '1rem' }} />
                <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: '1rem' }} />
                <div className="skeleton" style={{ width: '100%', height: '120px', borderRadius: '8px' }} />
              </div>
            ) : selectedOrderDetails ? (
              <>
                <div className="sidebar-header">
                  <span className="sidebar-icon">
                    {selectedOrderDetails.type === 'ToBeShipped' ? <FaTruck /> : <FaBox />}
                  </span>
                  <div>
                    <span className="sidebar-type">
                      {selectedOrderDetails.type === 'ToBeShipped' ? 'Shipping' : 'Order'}
                    </span>
                    <span className="sidebar-tracking">
                      {selectedOrderDetails.orderNumber || selectedOrderDetails._id?.slice(-8)}
                    </span>
                  </div>
                </div>

                <div className="sidebar-map">
                  <div className="map-placeholder">
                    <div className="map-route">
                      <span className="map-point sender">SENDER</span>
                      <div className="map-line" />
                      <span className="map-point receiver">RECEIVER</span>
                    </div>
                  </div>
                </div>

                <div className="sidebar-addresses">
                  <div className="addr-row sender">
                    <span className="addr-dot green" />
                    <div>
                      <strong>EVOLEXX Store</strong>
                      <p>Colombo, Sri Lanka</p>
                    </div>
                  </div>
                  <div className="addr-row receiver">
                    <span className="addr-dot orange" />
                    <div>
                      <strong>{selectedOrderDetails.shippingAddress?.fullName || 'Customer'}</strong>
                      <p>
                        {[
                          selectedOrderDetails.shippingAddress?.address,
                          selectedOrderDetails.shippingAddress?.city
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="sidebar-timeline">
                  {getTimelineSteps(selectedOrderDetails).map((step, i) => (
                    <div key={i} className={`timeline-step ${step.active ? 'active' : ''}`}>
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <strong>{step.label}</strong>
                        <span>{step.location}</span>
                        {step.date && (
                          <span className="timeline-date">
                            {new Date(step.date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sidebar-footer">
                  <div className="total-row">
                    <span>Total cost:</span>
                    <strong>Rs. {selectedOrderDetails.totalPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  {selectedOrderDetails.type === 'Order' ? (
                    <Link
                      to={`/order/${selectedOrderDetails._id}`}
                      className="sidebar-payment-btn"
                    >
                      View Details
                    </Link>
                  ) : (
                    <Link
                      to={`/tobeshipped/order/${selectedOrderDetails._id}`}
                      className="sidebar-payment-btn"
                    >
                      Track Shipment
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <div className="sidebar-empty">Unable to load order details.</div>
            )
          ) : (
            <div className="sidebar-empty">
              {orders.length === 0
                ? 'No orders to display.'
                : 'Select an order to view details.'}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default MyOrders;
