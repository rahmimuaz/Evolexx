import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../../context/UserContext';
import { Link } from 'react-router-dom';
import { FaBox, FaTruck, FaSearch, FaCalendarAlt, FaCheck, FaUndo } from 'react-icons/fa';
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
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnError, setReturnError] = useState(null);
  const [existingReturns, setExistingReturns] = useState([]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on user change; selectedOrder used to avoid overwriting initial selection
  }, [user]);

  useEffect(() => {
    const fetchReturns = async () => {
      if (!user) return;
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/returns/my`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setExistingReturns(data || []);
      } catch {
        setExistingReturns([]);
      }
    };
    fetchReturns();
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
          setSelectedOrderDetails({ ...data, type: 'ToBeShipped' });
        } else {
          const { data } = await axios.get(
            `${API_BASE_URL}/api/orders/${selectedOrder}`,
            { headers: { Authorization: `Bearer ${user.token}` } }
          );
          setSelectedOrderDetails({ ...data, type: 'Order' });
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
      case 'delivered': return '#22c55e';
      case 'shipped': return '#f97316';
      case 'accepted':
      case 'approved': return '#eab308';
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
    const city = addr?.city || order?.city || '';
    const location = city || addr?.address || order?.address || '—';
    return `Store → ${location}`;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${API_BASE_URL}${imagePath}`;
    if (imagePath.startsWith('uploads/')) return `${API_BASE_URL}/${imagePath}`;
    return `${API_BASE_URL}/uploads/${imagePath}`;
  };

  const getTimelineSteps = (order) => {
    if (!order) return [];
    const status = (order.status || '').toLowerCase();
    const createdAt = order.createdAt ? new Date(order.createdAt) : null;
    const shippedAt = order.shippedAt || order.updatedAt || createdAt;
    const deliveredAt = order.deliveredAt || order.updatedAt || createdAt;

    const steps = [
      { label: 'Packaged', done: true, date: createdAt },
      { label: 'Ready to ship', done: ['accepted', 'approved', 'shipped', 'delivered'].includes(status), date: status !== 'pending' ? createdAt : null },
      { label: 'In Transit', done: ['shipped', 'delivered'].includes(status), date: ['shipped', 'delivered'].includes(status) ? shippedAt : null },
      { label: 'Delivered', done: status === 'delivered', date: status === 'delivered' ? deliveredAt : null }
    ];
    return steps;
  };

  const getOrderTrackingStatus = (order) => {
    if (!order) return 'Select an order';
    const status = (order.status || '').toLowerCase();
    if (status === 'delivered') return 'Delivered';
    if (status === 'shipped') return 'Product in Transit';
    if (status === 'accepted' || status === 'approved') return 'Ready to Ship';
    return 'Processing';
  };

  const getEstDays = (order) => {
    if (!order) return null;
    const status = (order.status || '').toLowerCase();
    if (status === 'delivered') return null;
    if (status === 'shipped') return 3;
    return 3;
  };

  const isOrderDelivered = (order) => (order?.status || '').toLowerCase() === 'delivered';

  const hasReturnForOrder = (orderId, orderType) => {
    const id = orderId?.toString?.() || orderId;
    return existingReturns.some((r) => {
      const rid = (orderType === 'Order' ? r.orderId : r.toBeShippedId)?.toString?.();
      return rid === id && ['pending', 'approved', 'received'].includes(r.status);
    });
  };

  const handleRequestReturn = () => setReturnModalOpen(true);

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrderDetails || !user) return;
    const form = e.target;
    const items = [];
    const orderType = selectedOrderDetails.type === 'ToBeShipped' ? 'ToBeShipped' : 'Order';
    const orderId = selectedOrderDetails._id;

    selectedOrderDetails.orderItems?.forEach((item, idx) => {
      const cb = form.querySelector(`input[name="return-item-${idx}"]`);
      if (cb?.checked) {
        const qtyInput = form.querySelector(`input[name="return-qty-${idx}"]`);
        const qty = Math.min(parseInt(qtyInput?.value || 1, 10) || 1, item.quantity || 1);
        items.push({ orderItemIndex: idx, quantity: qty });
      }
    });

    if (items.length === 0) {
      setReturnError('Please select at least one item to return.');
      return;
    }

    setReturnSubmitting(true);
    setReturnError(null);
    try {
      const payload = {
        orderType,
        items,
        reason: form.reason?.value || 'other',
        description: form.description?.value || '',
      };
      if (orderType === 'Order') payload.orderId = orderId;
      else payload.toBeShippedId = orderId;

      await axios.post(
        `${API_BASE_URL}/api/returns`,
        payload,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setReturnModalOpen(false);
      const { data } = await axios.get(`${API_BASE_URL}/api/returns/my`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setExistingReturns(data || []);
    } catch (err) {
      setReturnError(err.response?.data?.message || 'Failed to submit return request.');
    } finally {
      setReturnSubmitting(false);
    }
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
          <div className="orders-banner order-tracking-card">
            <div className="order-tracking-header">
              <div>
                <h3 className="order-tracking-title">Order Tracking</h3>
                <p className="order-tracking-subtitle">
                  {selectedOrderDetails ? getOrderTrackingStatus(selectedOrderDetails) : 'Select an order to track'}
                </p>
              </div>
              {selectedOrderDetails && getEstDays(selectedOrderDetails) && (
                <span className="order-tracking-est">EST: {getEstDays(selectedOrderDetails)} days</span>
              )}
            </div>
            <div className="order-tracking-timeline">
              {selectedOrderDetails ? (
                getTimelineSteps(selectedOrderDetails).map((step, i) => (
                  <React.Fragment key={i}>
                    <div className={`order-tracking-step ${step.done ? 'done' : ''}`}>
                      <div className={`order-tracking-icon ${step.done ? 'done' : ''}`}>
                        {step.done ? <FaCheck /> : null}
                      </div>
                      <div className="order-tracking-step-content">
                        <strong>{step.label}</strong>
                        <span className="order-tracking-step-date">
                          {step.done && step.date
                            ? new Date(step.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })
                            : 'Waiting...'}
                        </span>
                      </div>
                    </div>
                    {i < getTimelineSteps(selectedOrderDetails).length - 1 && (
                      <div className={`order-tracking-line ${step.done ? 'done' : ''}`} />
                    )}
                  </React.Fragment>
                ))
              ) : (
                <p className="order-tracking-empty">Select an order from the list to view tracking.</p>
              )}
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

                <div className="sidebar-addresses">
                  <div className="addr-row-h sender">
                    <span className="addr-dot-h green" />
                    <div>
                      <strong>EVOLEXX Store</strong>
                      <p>Colombo, Sri Lanka</p>
                    </div>
                  </div>
                  <div className="addr-row-h receiver">
                    <span className="addr-dot-h orange" />
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

                {/* Order details - products always visible */}
                <div className="sidebar-order-details">
                  <h4 className="sidebar-details-title">Products in this order</h4>
                  {selectedOrderDetails.orderItems && selectedOrderDetails.orderItems.length > 0 ? (
                    <div className="sidebar-products-list">
                      {selectedOrderDetails.orderItems.map((item, idx) => {
                        const img = item.selectedVariation?.images?.[0] || item.image || item.product?.images?.[0];
                        const name = item.name || item.product?.name || 'Product';
                        return (
                          <div key={item._id || idx} className="sidebar-product-row">
                            <div className="sidebar-product-img-wrap">
                              {img ? (
                                <>
                                  <img src={getImageUrl(img)} alt={name} className="sidebar-product-img" onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }} />
                                  <div className="sidebar-product-placeholder" style={{ display: 'none' }}>📦</div>
                                </>
                              ) : (
                                <div className="sidebar-product-placeholder">📦</div>
                              )}
                            </div>
                            <div className="sidebar-product-info">
                              <strong>{name}</strong>
                              {item.selectedVariation?.attributes && (
                                <div className="sidebar-product-variation">
                                  {Object.entries(item.selectedVariation.attributes).map(([k, v]) => (
                                    <span key={k}>{k}: {v}</span>
                                  ))}
                                </div>
                              )}
                              <span className="sidebar-product-qty">Qty: {item.quantity}</span>
                            </div>
                            <div className="sidebar-product-price">
                              Rs. {(item.price * item.quantity).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="sidebar-no-products">No products in this order.</p>
                  )}
                  <div className="sidebar-total-row">
                    <span>Total:</span>
                    <strong>Rs. {selectedOrderDetails.totalPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</strong>
                  </div>

                  {isOrderDelivered(selectedOrderDetails) && !hasReturnForOrder(selectedOrderDetails._id, selectedOrderDetails.type) && (
                    <button type="button" className="sidebar-return-btn" onClick={handleRequestReturn}>
                      <FaUndo /> Request Return
                    </button>
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

      {/* Return Request Modal */}
      {returnModalOpen && selectedOrderDetails && (
        <div className="return-modal-overlay" onClick={() => !returnSubmitting && setReturnModalOpen(false)}>
          <div className="return-modal" onClick={(e) => e.stopPropagation()}>
            <div className="return-modal-header">
              <h3>Request Return</h3>
              <button type="button" className="return-modal-close" onClick={() => !returnSubmitting && setReturnModalOpen(false)} aria-label="Close">&times;</button>
            </div>
            <form onSubmit={handleReturnSubmit} className="return-modal-body">
              <p className="return-modal-hint">Select items you want to return and provide a reason.</p>

              <div className="return-items-section">
                <label className="return-label">Items to return</label>
                {selectedOrderDetails.orderItems?.map((item, idx) => {
                  const name = item.name || item.product?.name || 'Product';
                  return (
                    <div key={idx} className="return-item-row">
                      <label className="return-item-check">
                        <input type="checkbox" name={`return-item-${idx}`} />
                        <span>{name} × {item.quantity}</span>
                      </label>
                      <input type="number" name={`return-qty-${idx}`} min={1} max={item.quantity || 1} defaultValue={item.quantity || 1} className="return-qty-input" />
                    </div>
                  );
                })}
              </div>

              <div className="return-field">
                <label className="return-label" htmlFor="return-reason">Reason *</label>
                <select id="return-reason" name="reason" required className="return-select">
                  <option value="defective">Defective</option>
                  <option value="wrong_item">Wrong Item</option>
                  <option value="not_as_described">Not as Described</option>
                  <option value="changed_mind">Changed Mind</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="return-field">
                <label className="return-label" htmlFor="return-desc">Additional details (optional)</label>
                <textarea id="return-desc" name="description" rows={3} className="return-textarea" placeholder="Describe the issue..." />
              </div>

              {returnError && <p className="return-error">{returnError}</p>}

              <div className="return-modal-actions">
                <button type="button" className="return-btn-cancel" onClick={() => !returnSubmitting && setReturnModalOpen(false)} disabled={returnSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="return-btn-submit" disabled={returnSubmitting}>
                  {returnSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
