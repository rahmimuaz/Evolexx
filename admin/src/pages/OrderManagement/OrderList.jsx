import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';

const OrderList = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchOrders = useCallback(async () => {
    if (!token) {
      setError('Not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch orders.');
      }

      const data = await response.json();
      const sortedOrders = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
    } catch (err) {
      setError(err.message || 'Error fetching orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);


  const handleStatusChange = async (orderId, newStatus) => {
    if (!token) {
      setError('Not authenticated.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order status.');
      }

      if (newStatus === 'accepted') {
        setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
        toast.success('Order accepted! Redirecting to To Be Shipped List.');
        navigate('/ToBeShippedList');
      } else if (newStatus === 'declined') {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );
        toast.success('Order declined successfully!');
      } else {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );
        toast.success('Order status updated successfully!');
      }
    } catch (err) {
      setError(err.message || 'Error updating order status. Please try again.');
    }
  };

  const handleDeleteOrder = (orderId) => {
    setOrderToDelete(orderId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!token || !orderToDelete) {
      setError('Not authenticated or no order selected for deletion.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete order.');
      }

      setOrders(prevOrders => prevOrders.filter(order => order._id !== orderToDelete));
      toast.success('Order deleted successfully!');
      setOrderToDelete(null);
      setShowDeleteModal(false);
    } catch (err) {
      setError(err.message || 'Error deleting order. Please try again.');
      setOrderToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const cancelDelete = () => {
    setOrderToDelete(null);
    setShowDeleteModal(false);
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      pending: 'badge badge-warning',
      completed: 'badge badge-success',
      failed: 'badge badge-error',
    };
    return badges[status] || 'badge badge-gray';
  };

  const sortOrders = (ordersToSort) => {
    return [...ordersToSort].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'total':
          aValue = a.totalPrice;
          bValue = b.totalPrice;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesPaymentStatus = filterPaymentStatus === 'all' || order.paymentStatus === filterPaymentStatus;
    const matchesPaymentMethod = filterPaymentMethod === 'all' || order.paymentMethod === filterPaymentMethod;

    const matchesSearch = debouncedSearchTerm === '' ||
                          order.orderNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                          (order.user && order.user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
                          (order.user && order.user.name && order.user.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
                          (order.shippingAddress && order.shippingAddress.fullName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
                          (order.shippingAddress && order.shippingAddress.city.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
                          order.orderItems.some(item =>
                            item.product && item.product.name && item.product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                          );
    return matchesStatus && matchesPaymentStatus && matchesPaymentMethod && matchesSearch;
  });

  const sortedFilteredOrders = sortOrders(filteredOrders);

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading Orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 className="page-title">Orders</h1>
            <p className="page-subtitle">{orders.length} total orders</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="admin-btn"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button onClick={fetchOrders} className="admin-btn">
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Filters */}
      {showFilters && (
        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <div className="grid grid-cols-3 gap-3">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Search Orders</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search by Order ID, User, or Product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Order Status</label>
              <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Payment Status</label>
              <select className="form-select" value={filterPaymentStatus} onChange={(e) => setFilterPaymentStatus(e.target.value)}>
                <option value="all">All Payment Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={filterPaymentMethod} onChange={(e) => setFilterPaymentMethod(e.target.value)}>
                <option value="all">All Methods</option>
                <option value="cod">Cash on Delivery</option>
                <option value="card">Card Payment</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Sort By</label>
              <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date">Date</option>
                <option value="total">Total Amount</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Sort Order</label>
              <select className="form-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
        Showing {sortedFilteredOrders.length} of {orders.length} orders
      </div>

      {/* Orders Table */}
      {sortedFilteredOrders.length === 0 ? (
        <div className="admin-card">
          <div className="empty-state">
            <div className="empty-state-icon"><FontAwesomeIcon icon={faShoppingCart} /></div>
            <div className="empty-state-title">No orders found</div>
            <div className="empty-state-text">No orders match your current filters</div>
          </div>
        </div>
      ) : (
        <div className="admin-table-container">
          <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th style={{ width: '140px' }}>Status</th>
                <th style={{ width: '120px' }}>Payment</th>
                <th style={{ width: '140px' }}>Total</th>
                <th style={{ width: '220px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFilteredOrders.map(order => (
                <React.Fragment key={order._id}>
                  <tr>
                    <td>
                      <span style={{ fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap' }}>
                        #{order.orderNumber}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>
                        {order.user ? order.user.name || 'N/A' : 'Deleted User'}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {order.orderItems && order.orderItems.length > 0 ? (
                        <>
                          {order.orderItems.slice(0, 1).map((item, idx) => (
                            <div key={idx}>
                              <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                                {item.product ? item.product.name : item.name || 'Unknown'} (×{item.quantity})
                              </div>
                              {item.selectedVariation && item.selectedVariation.attributes && (
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.125rem' }}>
                                  {Object.entries(item.selectedVariation.attributes).map(([key, value]) => (
                                    <span key={key} style={{ marginRight: '0.5rem' }}>
                                      {key.charAt(0).toUpperCase() + key.slice(1)}: <strong>{value}</strong>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          {order.orderItems.length > 1 && (
                            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                              +{order.orderItems.length - 1} more items
                            </div>
                          )}
                        </>
                      ) : 'No items'}
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="form-select"
                        style={{ 
                          fontSize: '0.8125rem', 
                          padding: '0.375rem 0.75rem',
                          minWidth: '120px'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accept</option>
                        <option value="declined">Decline</option>
                      </select>
                    </td>
                    <td>
                      <span className={getPaymentStatusBadge(order.paymentStatus)}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap' }}>
                      LKR {order.totalPrice.toLocaleString()}
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '0.625rem' }}>
                        <button
                          onClick={() => toggleExpand(order._id)}
                          className="admin-btn"
                          title={expandedOrders[order._id] ? 'Hide Details' : 'View Details'}
                        >
                          {expandedOrders[order._id] ? 'Hide' : 'View'}
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order._id)}
                          className="admin-btn admin-btn-delete"
                          title="Delete Order"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedOrders[order._id] && (
                    <tr>
                      <td colSpan="7" style={{ backgroundColor: '#f8fafc', padding: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                          <div>
                            <strong style={{ color: '#0f172a', fontSize: '0.875rem' }}>Order Date:</strong>
                            <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                              {new Date(order.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                          <div>
                            <strong style={{ color: '#0f172a', fontSize: '0.875rem' }}>Shipping Address:</strong>
                            <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                              {order.shippingAddress ? (
                                <>
                                  {order.shippingAddress.fullName}, {order.shippingAddress.address},{' '}
                                  {order.shippingAddress.city}, {order.shippingAddress.postalCode},{' '}
                                  {order.shippingAddress.phone}
                                </>
                              ) : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <strong style={{ color: '#0f172a', fontSize: '0.875rem' }}>Payment Method:</strong>
                            <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                              {order.paymentMethod === 'cod' ? 'Cash on Delivery' :
                               order.paymentMethod === 'card' ? 'Card Payment' :
                               order.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <strong style={{ color: '#0f172a', fontSize: '0.875rem' }}>All Products:</strong>
                            <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                              {order.orderItems && order.orderItems.length > 0 ? (
                                order.orderItems.map((item, idx) => {
                                  // Get variation image if available, otherwise product image, otherwise item.image
                                  const itemImage = item.selectedVariation?.images && item.selectedVariation.images.length > 0
                                    ? item.selectedVariation.images[0]
                                    : (item.image || (item.product?.images && item.product.images.length > 0 ? item.product.images[0] : null));
                                  
                                  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
                                  const imageUrl = itemImage 
                                    ? (itemImage.startsWith('http') ? itemImage : `${API_BASE_URL}/${itemImage}`)
                                    : null;
                                  
                                  return (
                                    <div key={idx} style={{ 
                                      marginBottom: '1rem', 
                                      padding: '0.75rem', 
                                      background: 'white', 
                                      borderRadius: '4px',
                                      border: '1px solid #e5e7eb',
                                      display: 'flex',
                                      gap: '0.75rem',
                                      alignItems: 'flex-start'
                                    }}>
                                      {imageUrl && (
                                        <img 
                                          src={imageUrl} 
                                          alt={item.product?.name || item.name || 'Product'}
                                          style={{
                                            width: '60px',
                                            height: '60px',
                                            objectFit: 'cover',
                                            borderRadius: '4px',
                                            border: '1px solid #e5e7eb'
                                          }}
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                      )}
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#0f172a' }}>
                                          {item.product ? item.product.name : item.name || 'Unknown'}
                                        </div>
                                        {item.selectedVariation && item.selectedVariation.attributes && (
                                          <div style={{ fontSize: '0.8125rem', marginBottom: '0.25rem', color: '#64748b' }}>
                                            {Object.entries(item.selectedVariation.attributes).map(([key, value], attrIdx) => (
                                              <span key={attrIdx} style={{ marginRight: '0.75rem' }}>
                                                <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                        <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                                          Quantity: <strong>{item.quantity}</strong> × LKR {item.price?.toLocaleString()} = LKR {(item.price * item.quantity)?.toLocaleString()}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : 'No items'}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="admin-card" style={{ maxWidth: '500px', margin: 0 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.5rem' }}>
              Confirm Deletion
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9375rem' }}>
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={cancelDelete}
                style={{
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  borderRadius: '0.375rem',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#0f172a',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#f8fafc'}
                onMouseOut={(e) => e.target.style.background = 'white'}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                style={{
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  borderRadius: '0.375rem',
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#dc2626'}
                onMouseOut={(e) => e.target.style.background = '#ef4444'}
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
