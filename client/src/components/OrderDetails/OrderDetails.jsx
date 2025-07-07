import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../../context/UserContext';
import { toast } from 'react-toastify';
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
          `http://localhost:5001/api/orders/${id}`,
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
      navigate('/login');
    }
  }, [id, user, navigate]);

  // Updated image handling to support both Cloudinary and local uploads
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';

    // If it's already a full URL (Cloudinary), return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // If it's a local upload path, construct the full URL
    if (imagePath.startsWith('uploads/')) {
      return `http://localhost:5001/${imagePath}`;
    }

    // If it starts with /uploads/, remove the leading slash
    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:5001${imagePath}`;
    }

    // Default case: assume it's a local upload
    return `http://localhost:5001/uploads/${imagePath}`;
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  if (loading) {
    return (
      <div className="order-details-page-container">
        <div className="order-details-max-width-wrapper">
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-details-page-container">
        <div className="order-details-max-width-wrapper">
          <div className="not-found-center-text">
            <h2 className="not-found-title">Order not found</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-details-page-container">
      <div className="order-details-max-width-wrapper">
        <div className="order-details-card">
          {/* Order Header */}
          <div className="order-header">
            <div className="order-header-content">
              <h1 className="order-id-title">Order : ORD {order._id}</h1>
              <div className="order-status-badges">
                <span className={`order-status-badge ${
                  order.status === 'delivered' ? 'status-delivered' :
                  order.status === 'shipped' ? 'status-shipped' :
                  order.status === 'approved' ? 'status-approved' :
                  order.status === 'denied' ? 'status-denied' :
                  'status-default'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <span className={`payment-status-badge ${
                  order.paymentStatus === 'completed' ? 'payment-completed' :
                  order.paymentStatus === 'failed' ? 'payment-failed' :
                  'payment-pending'
                }`}>
                  Payment: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </span>
              </div>
            </div>
            <p className="order-placed-date">
              Placed on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Order Details */}
          <div className="info-section">
            <div className="info-grid">
              {/* Shipping Information */}
              <div>
                <h2 className="info-heading">Shipping Information</h2>
                <div className="info-details-group">
                  <p><span className="font-medium">Name:</span> {order.shippingAddress.fullName}</p>
                  <p><span className="font-medium">Email:</span> {order.shippingAddress.email}</p>
                  <p><span className="font-medium">Phone:</span> {order.shippingAddress.phone}</p>
                  <p><span className="font-medium">Address:</span> {order.shippingAddress.address}</p>
                  <p><span className="font-medium">City:</span> {order.shippingAddress.city}</p>
                  <p><span className="font-medium">Postal Code:</span> {order.shippingAddress.postalCode}</p>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h2 className="info-heading">Payment Information</h2>
                <div className="info-details-group">
                  <p><span className="font-medium">Method:</span> {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</p>
                  <p><span className="font-medium">Status:</span> {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="order-items-section">
            <h2 className="info-heading">Order Items</h2>
            <div className="order-items-list">
              {order.orderItems.map((item) => (
                <div key={item._id} className="order-item">
                  <div className="order-item-details">
                    {item.product.images && item.product.images.length > 0 ? (
                      <>
                        <img
                          src={getImageUrl(item.product.images[0])}
                          alt={item.product.name}
                          className="product-image"
                          onError={handleImageError}
                        />
                        <div className="product-image-placeholder" style={{ display: 'none' }}>
                          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <div className="product-image-placeholder">
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="product-info">
                      <h3 className="product-name">{item.product.name}</h3>
                      <p className="product-quantity">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="item-total-price">
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary-section">
            <div className="order-summary-content">
              <h2 className="summary-heading">Total</h2>
              <p className="total-price">Rs. {order.totalPrice.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;