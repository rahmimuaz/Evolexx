import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import BankTransferModal from '../Payment/BankTransferModal'
import './Checkout.css'; // Assuming you have a CSS file for styles

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const { user } = useUser();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    paymentMethod: 'cod'
  });

  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [bankTransferProofUrl, setBankTransferProofUrl] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentMethodChange = (e) => {
    const selectedMethod = e.target.value;
    setFormData(prev => ({
      ...prev,
      paymentMethod: selectedMethod
    }));

    if (selectedMethod === 'card') {
      navigate('/card-payment');
    }

    if (selectedMethod !== 'bank_transfer') {
      setBankTransferProofUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }

    if (formData.paymentMethod === 'bank_transfer') {
      setShowBankTransferModal(true);
      return;
    }

    placeOrder();
  };

  const placeOrder = async (proofUrl = null) => {
    console.log('=== PLACE ORDER ===');
    console.log('Proof URL for placeOrder (if bank transfer):', proofUrl);
    console.log('Current payment method:', formData.paymentMethod);

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };

      const shippingAddress = {
        fullName: formData.fullName,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        phone: formData.phone
      };

      const orderItems = cartItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      }));

      const total = cartItems.reduce((acc, item) => acc + (item.product ? item.product.price * item.quantity : 0), 0);

      // Debug: Log the order data being sent
      const orderData = {
        shippingAddress,
        paymentMethod: formData.paymentMethod,
        bankTransferProof: proofUrl || bankTransferProofUrl, // Use passed proofUrl or state
        orderItems,
        totalPrice: total
      };

      console.log('Sending order data:', {
        paymentMethod: orderData.paymentMethod,
        bankTransferProof: orderData.bankTransferProof,
        hasProof: !!orderData.bankTransferProof,
        proofType: typeof orderData.bankTransferProof,
        proofValue: orderData.bankTransferProof
      });

      const { data } = await axios.post(
        'http://localhost:5001/api/orders',
        orderData,
        config
      );

      console.log('Order created successfully:', {
        orderId: data._id,
        bankTransferProof: data.bankTransferProof,
        hasProof: !!data.bankTransferProof
      });

      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order/${data._id}`);
    } catch (error) {
      console.error('Order creation error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  };


  const handleBankTransferSubmit = (fileUrl) => {
    console.log('=== BANK TRANSFER SUBMIT ===');
    console.log('Received fileUrl:', fileUrl);
    console.log('FileUrl type:', typeof fileUrl);
    console.log('FileUrl length:', fileUrl ? fileUrl.length : 'null/undefined');

    setBankTransferProofUrl(fileUrl);
    console.log('bankTransferProofUrl state set to:', fileUrl);

    setShowBankTransferModal(false);
    toast.info('Bank transfer proof attached. Proceeding to place order.');

    // Pass fileUrl directly to placeOrder to avoid state timing issues
    placeOrder(fileUrl);
  };

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

  const subtotal = cartItems.reduce((acc, item) => acc + (item.product ? item.product.price * item.quantity : 0), 0);
  const shipping = 0;
  const total = subtotal + shipping;

  return (
    <div className="checkout-page-container">
      <div className="checkout-max-width-wrapper">
        <h1 className="checkout-title">Checkout</h1>
        <div className="checkout-grid">
          <div className="shipping-info-section">
            <div className="checkout-card">
              <h2 className="section-heading">Shipping Information</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="fullName" className="form-label">Full Name</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="city" className="form-label">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="address" className="form-label">Address</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="postalCode" className="form-label">Postal Code</label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="payment-method-section">
                  <h2 className="section-heading">Payment Method</h2>
                  <div className="payment-options-group">
                    <div className="radio-option">
                      <input
                        type="radio"
                        id="cod"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={handlePaymentMethodChange}
                        className="radio-input"
                      />
                      <label htmlFor="cod" className="radio-label">
                        Cash on Delivery
                      </label>
                    </div>

                    <div className="radio-option">
                      <input
                        type="radio"
                        id="card"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={handlePaymentMethodChange}
                        className="radio-input"
                      />
                      <label htmlFor="card" className="radio-label">
                        Card Payment
                      </label>
                    </div>

                    <div className="radio-option">
                      <input
                        type="radio"
                        id="bank_transfer"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={formData.paymentMethod === 'bank_transfer'}
                        onChange={handlePaymentMethodChange}
                        className="radio-input"
                      />
                      <label htmlFor="bank_transfer" className="radio-label">
                        Bank Transfer
                      </label>
                    </div>
                  </div>
                </div>

                <div className="place-order-button-container">
                  <button
                    type="submit"
                    className="place-order-button"
                  >
                    Place Order
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="order-summary-section">
            <div className="checkout-card">
              <h2 className="section-heading">Order Summary</h2>
              <div className="summary-items-list">
                {cartItems.map((item) => (
                  <div key={item._id} className="summary-item">
                    <div className="summary-item-content">
                      <div className="summary-item-image-container">
                        {item.product.images && item.product.images.length > 0 ? (
                          <>
                            <img
                              src={getImageUrl(item.product.images[0])}
                              alt={item.product.name}
                              className="summary-item-image"
                              onError={handleImageError}
                            />
                            <div className="summary-item-image-placeholder" style={{ display: 'none' }}>
                              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </>
                        ) : (
                          <div className="summary-item-image-placeholder">
                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="summary-item-details">
                        <p className="summary-item-name">{item.product.name}</p>
                        <p className="summary-item-quantity">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="summary-item-price">Rs. {(item.product.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
                <div className="summary-totals">
                  <div className="summary-line">
                    <p className="summary-label">Subtotal</p>
                    <p className="summary-value">Rs. {subtotal.toLocaleString()}</p>
                  </div>
                  <div className="summary-line">
                    <p className="summary-label">Shipping</p>
                    <p className="summary-value">Free</p>
                  </div>
                  <div className="summary-line total-line">
                    <p>Total</p>
                    <p>Rs. {total.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBankTransferModal && (
        <BankTransferModal
          onClose={() => setShowBankTransferModal(false)}
          onSubmit={handleBankTransferSubmit}
        />
      )}
    </div>
  );
};

export default Checkout;