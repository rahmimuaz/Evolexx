import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaMoneyBillWave, FaCreditCard, FaUniversity, FaCheck } from 'react-icons/fa';
import BankTransferModal from '../Payment/BankTransferModal';
import './Checkout.css';
import Footer from '../../components/Footer/Footer';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const sriLankaCities = [
  "Colombo",
  "Kandy",
  "Galle",
  "Jaffna",
  "Negombo",
  "Batticaloa",
  "Trincomalee",
  "Matara",
  "Anuradhapura",
  "Ratnapura",
  "Badulla",
  "Kurunegala",
  "Hambantota",
  "Vavuniya",
  "Nuwara Eliya",
  // Add more cities here if needed
];

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

  const [cityInput, setCityInput] = useState(formData.city);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const cityRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [bankTransferProofUrl, setBankTransferProofUrl] = useState(null);

  // Update form data fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Restrict phone input to digits only
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) { // only digits allowed
      setFormData(prev => ({ ...prev, phone: value }));
    }
  };

  // City input handler with autocomplete suggestions
  const handleCityChange = (e) => {
    const value = e.target.value;
    setCityInput(value);
    setFormData(prev => ({ ...prev, city: value }));

    if (value.length > 0) {
      const filteredCities = sriLankaCities.filter(city =>
        city.toLowerCase().startsWith(value.toLowerCase())
      );
      setCitySuggestions(filteredCities);
    } else {
      setCitySuggestions([]);
    }
  };

  // When user selects city from suggestions
  const handleCitySelect = (city) => {
    setCityInput(city);
    setFormData(prev => ({ ...prev, city }));
    setCitySuggestions([]);
  };

  // Close city suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityRef.current && !cityRef.current.contains(event.target)) {
        setCitySuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Payment method change handler
  const handlePaymentMethodChange = (e) => {
    const selectedMethod = e.target.value;
    if (selectedMethod === 'card') return; // prevent card selection
    setFormData(prev => ({ ...prev, paymentMethod: selectedMethod }));
    if (selectedMethod !== 'bank_transfer') setBankTransferProofUrl(null);
  };

  // Validation before submitting
  const validateForm = () => {
  const { fullName, email, address, city, postalCode, phone } = formData;

  if (!fullName.trim()) {
    toast.error('Full name is required');
    return false;
  }
  if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
    toast.error('Valid email is required');
    return false;
  }
  if (!phone.trim() || phone.length < 7) {
    toast.error('Valid phone number is required');
    return false;
  }
  if (!city.trim()) {
    toast.error('City is required');
    return false;
  }
  if (!address.trim()) {
    toast.error('Address is required');
    return false;
  }
  if (!postalCode.trim()) {
    toast.error('Postal code is required');
    return false;
  }
  return true;
};


  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

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

    setIsLoading(true);
    try {
      await placeOrder();
    } finally {
      setIsLoading(false);
    }
  };

  // Place order API call
  const placeOrder = async (proofUrl = null) => {
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

      // Helper to get item price (variation price or product price)
      const getItemPrice = (item) => {
        if (item.product?.hasVariations && item.selectedVariation) {
          const matchingVariation = item.product.variations?.find(v => 
            v.variationId === item.selectedVariation.variationId
          );
          if (matchingVariation) {
            return matchingVariation.discountPrice || matchingVariation.price || item.product.price || 0;
          }
        }
        return item.product?.discountPrice || item.product?.price || 0;
      };

      const orderItems = cartItems.map(item => {
        const orderItem = {
          product: item.product._id,
          quantity: item.quantity,
          price: getItemPrice(item)
        };
        
        // Include complete variation data if available (with images and all details)
        if (item.product?.hasVariations && item.selectedVariation) {
          orderItem.selectedVariation = {
            attributes: item.selectedVariation.attributes,
            stock: item.selectedVariation.stock,
            price: item.selectedVariation.price,
            discountPrice: item.selectedVariation.discountPrice,
            images: item.selectedVariation.images || [] // Include variation images
          };
        }
        
        return orderItem;
      });

      const total = cartItems.reduce(
        (acc, item) => {
          if (!item.product) return acc;
          return acc + getItemPrice(item) * item.quantity;
        },
        0
      );

      const orderData = {
        shippingAddress,
        paymentMethod: formData.paymentMethod,
        bankTransferProof: proofUrl || bankTransferProofUrl,
        orderItems,
        totalPrice: total
      };

      const { data } = await axios.post(
        `${API_BASE_URL}/api/orders`,
        orderData,
        config
      );

      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order/${data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  };

  // Handle bank transfer modal submission
  const handleBankTransferSubmit = (fileUrl) => {
    setBankTransferProofUrl(fileUrl);
    setShowBankTransferModal(false);
    toast.info('Bank transfer proof attached. Proceeding to place order.');
    placeOrder(fileUrl);
  };

  // Image URL helper
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${API_BASE_URL}${imagePath}`;
    if (imagePath.startsWith('uploads/')) return `${API_BASE_URL}/${imagePath}`;
    return `${API_BASE_URL}/uploads/${imagePath}`;
  };

  // Handle product image load error
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  // Helper to get item price (variation price or product price)
  const getItemPrice = (item) => {
    if (item.product?.hasVariations && item.selectedVariation) {
      // Use variation price directly from selectedVariation
      if (item.selectedVariation.discountPrice) {
        return item.selectedVariation.discountPrice;
      }
      if (item.selectedVariation.price) {
        return item.selectedVariation.price;
      }
      // Fallback: try to find matching variation in product
      const matchingVariation = item.product.variations?.find(v => {
        if (!v.attributes || !item.selectedVariation.attributes) return false;
        return Object.keys(item.selectedVariation.attributes).every(key => 
          v.attributes[key] === item.selectedVariation.attributes[key]
        );
      });
      if (matchingVariation) {
        return matchingVariation.discountPrice || matchingVariation.price || item.product.price || 0;
      }
    }
    return item.product?.discountPrice || item.product?.price || 0;
  };

  // Calculate totals - use variation price if available
  const subtotal = cartItems.reduce(
    (acc, item) => {
      if (!item.product) return acc;
      return acc + getItemPrice(item) * item.quantity;
    },
    0
  );
  const shipping = 0;
  const total = subtotal + shipping;

  return (
    <div className="checkout-page-container">
      <div className="checkout-max-width-wrapper">
        <h1 className="checkout-title">Checkout</h1>
        <div className="checkout-grid">
          <div className="shipping-info-section">
            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="checkout-form-cards">
                <div className="checkout-info-card">
                  <div className="checkout-card-header">
                    <h2 className="section-heading">Customer Info</h2>
                    {!(formData.email?.trim() && formData.phone?.trim()) && (
                      <span className="required-indicator">* Required</span>
                    )}
                  </div>
                  <div className="form-grid form-grid-mobile">
                    <div className="form-group">
                      <label htmlFor="email" className="form-label">Email *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">Phone *</label>
                      <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        className="form-input"
                        placeholder="07X XXX XXXX"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="checkout-info-card">
                  <div className="checkout-card-header">
                    <h2 className="section-heading">Shipping Address</h2>
                    {!(formData.fullName?.trim() && formData.address?.trim() && cityInput?.trim() && formData.postalCode?.trim()) && (
                      <span className="required-indicator">* Required</span>
                    )}
                  </div>
                  <div className="form-grid form-grid-mobile">
                    <div className="form-group">
                      <label htmlFor="fullName" className="form-label">Full Name *</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="address" className="form-label">Street Address *</label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="123 Main Street, Apartment 4B"
                        required
                      />
                    </div>
                    <div className="form-group form-group-city-row">
                      <label htmlFor="city" className="form-label">City *</label>
                      <div ref={cityRef} style={{ position: 'relative' }}>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={cityInput}
                          onChange={handleCityChange}
                          className="form-input"
                          placeholder="Start typing city name (e.g., Colombo, Kandy)"
                          autoComplete="off"
                          required
                        />
                        {citySuggestions.length > 0 && (
                          <ul className="autocomplete-suggestions">
                            {citySuggestions.map((city) => (
                              <li
                                key={city}
                                onClick={() => handleCitySelect(city)}
                                className="autocomplete-suggestion"
                              >
                                {city}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="form-group form-group-zip">
                      <label htmlFor="postalCode" className="form-label">Zip/Postal Code *</label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="10100"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="checkout-info-card">
                  <div className="checkout-card-header">
                    <h2 className="section-heading">Payment Method</h2>
                  </div>
                  <div className="payment-method-section">
                    <div className="payment-options-list">
                      {[
                        { id: 'cod', label: 'Cash on Delivery', subtext: 'Pay when your order arrives', icon: FaMoneyBillWave },
                        { id: 'card', label: 'Card Payment', subtext: 'Coming soon', icon: FaCreditCard, disabled: true },
                        { id: 'bank_transfer', label: 'Bank Transfer', subtext: 'Transfer to our bank account', icon: FaUniversity }
                      ].map((method) => {
                        const isSelected = formData.paymentMethod === method.id;
                        const IconComponent = method.icon;
                        return (
                          <label
                            key={method.id}
                            htmlFor={method.id}
                            className={`payment-option-row ${method.disabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                          >
                            <div className="payment-option-icon">
                              <IconComponent size={24} />
                            </div>
                            <div className="payment-option-content">
                              <span className="payment-option-label">{method.label}</span>
                              {method.subtext && (
                                <span className="payment-option-subtext">{method.subtext}</span>
                              )}
                            </div>
                            <div className="payment-option-radio">
                              <input
                                type="radio"
                                id={method.id}
                                name="paymentMethod"
                                value={method.id}
                                checked={isSelected}
                                onChange={handlePaymentMethodChange}
                                className="payment-radio-input"
                                disabled={method.disabled}
                              />
                              <span className={`payment-radio-custom ${isSelected ? 'selected' : ''}`}>
                                {isSelected && <FaCheck size={12} />}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="place-order-button-container">
                      <button
                        type="submit"
                        className="place-order-button"
                        disabled={isLoading}
                      >
                        {isLoading ? <div className="spinner-button" /> : 'Place Order'}
                      </button>
                    </div>
                </div>
              </div>
            </form>
          </div>

          <div className="order-summary-section">
            <div className="checkout-card">
              <h2 className="section-heading">Order Summary</h2>
              <div className="summary-items-list">
                {cartItems.map((item) => {
                  // Get variation image if available (use directly from selectedVariation)
                  let imageUrl = null;
                  if (item.product?.hasVariations && item.selectedVariation) {
                    // Use variation images directly from selectedVariation
                    if (item.selectedVariation.images && item.selectedVariation.images.length > 0) {
                      imageUrl = item.selectedVariation.images[0];
                    }
                  }
                  if (!imageUrl && item.product?.images?.length > 0) {
                    imageUrl = item.product.images[0];
                  }
                  
                  return (
                    <div key={item._id} className="summary-item">
                      <div className="summary-item-content">
                        <div className="summary-item-image-container">
                          {imageUrl ? (
                            <>
                              <img
                                src={getImageUrl(imageUrl)}
                                alt={item.product.name}
                                className="summary-item-image"
                                onError={handleImageError}
                              />
                              <div className="summary-item-image-placeholder" style={{ display: 'none' }} />
                            </>
                          ) : (
                            <div className="summary-item-image-placeholder" />
                          )}
                        </div>
                        <div className="summary-item-details">
                          <p className="summary-item-name">{item.product.name}</p>
                          {item.selectedVariation && item.selectedVariation.attributes && (
                            <p className="summary-item-variation" style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                              {Object.entries(item.selectedVariation.attributes).map(([key, value], idx) => (
                                <span key={key} style={{ marginRight: '0.75rem' }}>
                                  <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                                </span>
                              ))}
                            </p>
                          )}
                          <p className="summary-item-quantity" style={{ marginTop: '0.25rem' }}>Quantity: <strong>{item.quantity}</strong></p>
                        </div>
                      </div>
                      <p className="summary-item-price">
                        <span>Rs. {(getItemPrice(item) * item.quantity).toLocaleString()}</span>
                      </p>
                    </div>
                  );
                })}
              </div>

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
        <Footer />
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
