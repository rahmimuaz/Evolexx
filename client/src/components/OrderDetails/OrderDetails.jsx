import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../../context/UserContext';
import { toast } from 'react-toastify';
import { FaBox, FaChevronRight } from 'react-icons/fa';
import './OrderDetails.css';

const OrderDetails = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/orders/${id}`,
          config
        );

        setOrder(data);
        setLoading(false);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch order details');
        navigate('/');
      }
    };

    if (user) {
      fetchOrder();
    } else {
      navigate('/');
    }
  }, [id, user, navigate]);

  const getImageUrl = (imagePath) => {
    const baseUrl = process.env.REACT_APP_API_BASE_URL;
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${baseUrl}${imagePath}`;
    if (imagePath.startsWith('uploads/')) return `${baseUrl}/${imagePath}`;
    return `${baseUrl}/uploads/${imagePath}`;
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
  };

  const getStatusLabel = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'delivered': return 'Delivered';
      case 'shipped': return 'In Transit';
      case 'accepted':
      case 'approved': return 'Ready to Ship';
      case 'pending': return 'Order Placed';
      default: return status || 'Order Placed';
    }
  };

  const getPaymentMethodLabel = (method) => {
    if (!method) return '—';
    const m = (method || '').toLowerCase();
    if (m === 'cod') return 'Cash on Delivery';
    if (m === 'bank_transfer') return 'Bank Transfer';
    if (m === 'card') return 'Card Payment';
    return method;
  };

  if (loading) {
    return (
      <div className="od-page">
        <div className="od-card">
          <div className="od-skeleton od-skeleton-header" />
          <div className="od-skeleton od-skeleton-content" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="od-page">
        <div className="od-card">
          <h2 className="od-not-found">Order not found</h2>
        </div>
      </div>
    );
  }

  const addr = order.shippingAddress || {};

  return (
    <div className="od-page">
      <div className="od-card">
        {/* Header */}
        <div className="od-header">
          <div className="od-header-left">
            <span className="od-icon"><FaBox /></span>
            <div>
              <h1 className="od-order-id">Order {order.orderNumber || id}</h1>
              <span className={`od-status-badge od-status-${(order.status || 'pending').toLowerCase()}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
          </div>
          <div className="od-header-actions">
            <button className="od-btn-primary" onClick={() => navigate('/')}>
              Back to Home
            </button>
            <button className="od-btn-icon" onClick={() => navigate('/my-orders')} title="My Orders">
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* Order Details Row */}
        <div className="od-details-row">
          <div className="od-detail-item">
            <span className="od-detail-label">Order Date</span>
            <span className="od-detail-value">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
            </span>
          </div>
          <div className="od-detail-item">
            <span className="od-detail-label">Delivery Date</span>
            <span className="od-detail-value">
              {order.status === 'delivered' && order.updatedAt
                ? new Date(order.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : '3-7 days'}
            </span>
          </div>
          <div className="od-detail-item">
            <span className="od-detail-label">Courier</span>
            <span className="od-detail-value">Standard Delivery</span>
          </div>
          <div className="od-detail-item">
            <span className="od-detail-label">Address</span>
            <span className="od-detail-value">
              {addr.address ? `${addr.address}, ${addr.city || ''}`.trim() : '—'}
            </span>
          </div>
        </div>

        {/* Order Summary */}
        <div className="od-summary">
          <h2 className="od-section-title">Order Summary</h2>
          <div className="od-summary-box">
            <div className="od-payment-details">
              <h3 className="od-payment-title">Payment Details</h3>
              <div className="od-payment-row">
                <span>Method</span>
                <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
              </div>
              <div className="od-payment-row">
                <span>Status</span>
                <span className={`od-payment-status od-payment-${(order.paymentStatus || 'pending').toLowerCase()}`}>
                  {order.paymentStatus?.charAt(0).toUpperCase()}{order.paymentStatus?.slice(1) || 'Pending'}
                </span>
              </div>
            </div>
            <div className="od-summary-row">
              <span>Sub total</span>
              <span>Rs. {order.totalPrice?.toLocaleString() || '0'}</span>
            </div>
            <div className="od-summary-row">
              <span>Discount</span>
              <span>Rs. 0</span>
            </div>
            <div className="od-summary-row">
              <span>Shipping</span>
              <span>Rs. 0</span>
            </div>
            <div className="od-summary-row od-summary-total">
              <span>Total Amount</span>
              <span>Rs. {order.totalPrice?.toLocaleString() || '0'}</span>
            </div>
          </div>
        </div>

        {/* Order Info - Products */}
        <div className="od-order-info">
          <h2 className="od-section-title">Order Info</h2>
          <div className="od-products-list">
            {order.orderItems?.map((item) => {
              let imageUrl = item.selectedVariation?.images?.[0] || item.image || item.product?.images?.[0];
              const productName = item.name || item.product?.name || 'Product';

              return (
                <div key={item._id} className="od-product-card">
                  <div className="od-product-main">
                    {imageUrl ? (
                      <>
                        <img src={getImageUrl(imageUrl)} alt={productName} className="od-product-img" onError={handleImageError} />
                        <div className="od-product-img-placeholder" style={{ display: 'none' }}>📦</div>
                      </>
                    ) : (
                      <div className="od-product-img-placeholder">📦</div>
                    )}
                    <div className="od-product-info">
                      <h3 className="od-product-name">{productName}</h3>
                      <p className="od-product-price">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                      <p className="od-product-qty">Qty: {item.quantity}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="od-view-details-btn" onClick={() => navigate('/my-orders')}>
            View details <FaChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
