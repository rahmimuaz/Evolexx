import React from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './Cart.css';
import Footer from '../../components/Footer/Footer';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  const handleQuantityChange = (id, type) => {
    const item = cartItems.find(i => i._id === id);
    if (!item) return;

    if (type === 'increment') {
      updateQuantity(item.product._id, item.quantity + 1, item.selectedVariation);
    } else if (type === 'decrement' && item.quantity > 1) {
      updateQuantity(item.product._id, item.quantity - 1, item.selectedVariation);
    }
  };

  // Filter out invalid cart items (where product is null)
  const validCartItems = cartItems.filter(item => item.product);
  
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

  // Calculate subtotal using variation price or product price
  const subtotal = validCartItems.reduce(
    (acc, item) => {
      const itemPrice = getItemPrice(item);
      return acc + itemPrice * item.quantity;
    },
    0
  );

  const cleanImagePath = (imagePath) => {
    if (!imagePath) return '';
    // If it's already a full URL (http/https), return as is (handles Cloudinary URLs)
    if (imagePath.startsWith('http')) return imagePath;
    // Handle uploads/ paths (local storage)
    if (imagePath.startsWith('uploads/')) return `${API_BASE_URL}/${imagePath}`;
    if (imagePath.startsWith('/uploads/')) return `${API_BASE_URL}${imagePath}`;
    // Default fallback
    return `${API_BASE_URL}/uploads/${imagePath}`;
  };

  const onImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  const anyOutOfStock = validCartItems.some(item => {
    if (item.product?.hasVariations && item.selectedVariation) {
      // Use variation stock directly from selectedVariation
      if (item.selectedVariation.stock !== undefined) {
        return item.selectedVariation.stock <= 0;
      }
      // Fallback: try to find matching variation in product
      const matchingVariation = item.product.variations?.find(v => {
        if (!v.attributes || !item.selectedVariation.attributes) return false;
        return Object.keys(item.selectedVariation.attributes).every(key => 
          v.attributes[key] === item.selectedVariation.attributes[key]
      );
      });
      return (matchingVariation?.stock || 0) <= 0;
    }
    return (item.product?.stock || 0) <= 0;
  });

  return (
    <div className="cart">
      <h1 className="cart-title">Cart</h1>
      <main className="cart-content max-width">
        <div className="cart-items-wrapper">
          <section className="cart-items">
            {validCartItems.length === 0 ? (
              <p className="empty-message">Your cart is empty.</p>
            ) : (
              validCartItems.map(item => (
                <article className="cart-item" key={item._id}>
                  <div className="image-wrapper">
                    {(() => {
                      // Get variation image if available, otherwise product image
                      let imageUrl = null;
                      if (item.product?.hasVariations && item.selectedVariation) {
                        // Use variation images directly from selectedVariation
                        if (item.selectedVariation.images && item.selectedVariation.images.length > 0) {
                          imageUrl = item.selectedVariation.images[0];
                        } else {
                          // Fallback: try to find matching variation in product to get its image
                          const matchingVariation = item.product.variations?.find(v => {
                            if (!v.attributes || !item.selectedVariation.attributes) return false;
                            return Object.keys(item.selectedVariation.attributes).every(key => 
                              v.attributes[key] === item.selectedVariation.attributes[key]
                        );
                          });
                        if (matchingVariation?.images && matchingVariation.images.length > 0) {
                          imageUrl = matchingVariation.images[0];
                          }
                        }
                      }
                      if (!imageUrl && item.product?.images?.length > 0) {
                        imageUrl = item.product.images[0];
                      }
                      
                      return imageUrl ? (
                        <>
                          <img
                            src={cleanImagePath(imageUrl)}
                            alt={item.product.name}
                            onError={onImageError}
                            className="product-image"
                          />
                        <div className="image-placeholder" style={{ display: 'none' }}>
                          <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className="placeholder-icon">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        </>
                      ) : (
                        <div className="image-placeholder">
                          <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className="placeholder-icon">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="details">
                    <h2 className="product-name">{item.product?.name || 'N/A'}</h2>
                    <p className="product-desc">{item.product?.description || 'N/A'}</p>
                    <div className="variation-quantity-row">
                      {item.selectedVariation && item.selectedVariation.attributes && (
                        <div className="product-variation">
                          {Object.entries(item.selectedVariation.attributes).map(([key, value]) => (
                            <span key={key} className="variation-attr">
                              {key}: <strong>{value}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="quantity-controls">
                        <button
                          onClick={() => handleQuantityChange(item._id, 'decrement')}
                          className="qty-btn"
                          aria-label="Decrease quantity"
                        >-</button>
                        <span className="qty-display">{String(item.quantity).padStart(2, '0')}</span>
                        <button
                          onClick={() => handleQuantityChange(item._id, 'increment')}
                          className="qty-btn"
                          aria-label="Increase quantity"
                        >+</button>
                        <button
                          onClick={() => removeFromCart(item.product._id, item.selectedVariation)}
                          className="remove-btn"
                        >Remove</button>
                      </div>
                    </div>
                    {(() => {
                      let stock = 0;
                      if (item.product?.hasVariations && item.selectedVariation) {
                        // Use variation stock directly from selectedVariation
                        if (item.selectedVariation.stock !== undefined) {
                          stock = item.selectedVariation.stock;
                        } else {
                          // Fallback: try to find matching variation in product
                          const matchingVariation = item.product.variations?.find(v => {
                            if (!v.attributes || !item.selectedVariation.attributes) return false;
                            return Object.keys(item.selectedVariation.attributes).every(key => 
                              v.attributes[key] === item.selectedVariation.attributes[key]
                            );
                          });
                          stock = matchingVariation?.stock || 0;
                        }
                      } else {
                        stock = item.product?.stock || 0;
                      }
                      
                      return stock <= 0 ? (
                        <p className="cart-out-of-stock" style={{ color: 'red', fontWeight: 'bold' }}>
                          Out of Stock
                        </p>
                      ) : null;
                    })()}
                  </div>

                  <div className="item-price">
                    <span>Rs. {(getItemPrice(item) * item.quantity).toLocaleString()}</span>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>

        <aside className="cart-summary">
          <h2 className="summary-title">Order Summary</h2>
          
          
          {/* Products List */}
          {validCartItems.length > 0 && (
            <div className="summary-products">
              {validCartItems.map(item => {
                const itemPrice = getItemPrice(item);
                // Get variation image if available, otherwise product image
                let imageUrl = null;
                if (item.product?.hasVariations && item.selectedVariation) {
                  // Use variation images directly from selectedVariation
                  if (item.selectedVariation.images && item.selectedVariation.images.length > 0) {
                    imageUrl = item.selectedVariation.images[0];
                  } else {
                    // Fallback: try to find matching variation in product to get its image
                    const matchingVariation = item.product.variations?.find(v => {
                      if (!v.attributes || !item.selectedVariation.attributes) return false;
                      return Object.keys(item.selectedVariation.attributes).every(key => 
                        v.attributes[key] === item.selectedVariation.attributes[key]
                  );
                    });
                  if (matchingVariation?.images && matchingVariation.images.length > 0) {
                    imageUrl = matchingVariation.images[0];
                    }
                  }
                }
                if (!imageUrl && item.product?.images?.length > 0) {
                  imageUrl = item.product.images[0];
                }
                
                return (
                  <div key={item._id} className="summary-product-item">
                    {imageUrl && (
                      <img 
                        src={cleanImagePath(imageUrl)} 
                        alt={item.product.name}
                        className="summary-product-image"
                        onError={(e) => (e.target.src = '/logo192.png')}
                      />
                    )}
                    <div className="summary-product-info">
                      <p className="summary-product-name">{item.product?.name}</p>
                      {item.selectedVariation && item.selectedVariation.attributes && (
                        <p className="summary-product-variation">
                          {Object.entries(item.selectedVariation.attributes).map(([key, value]) => (
                            <span key={key}>{key}: {value} </span>
                          ))}
                        </p>
                      )}
                      <p className="summary-product-qty">Qty: {item.quantity}</p>
                    </div>
                    <p className="summary-product-price">
                      Rs. {(itemPrice * item.quantity).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

         

          <div className="summary-details">
            <div className="summary-row subtotal">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
          </div>

          <p className="taxes-note">Taxes and shipping free</p>

          <button
            className="checkout-btn"
            onClick={() => navigate('/checkout')}
            disabled={anyOutOfStock}
          >
            Check Out
          </button>
        </aside>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
