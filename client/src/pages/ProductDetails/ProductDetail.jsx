// ProductDetail.jsx - Redesigned modern product page
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './ProductDetail.css';
import Footer from '../../components/Footer/Footer';
import { useUser } from '../../context/UserContext';
import Modal from '../../components/Modal/Modal';
import Login from '../../pages/Login/Login';
import Register from '../../pages/Login/Register';
import ReactMarkdown from 'react-markdown';
import { FaShieldAlt, FaTruck, FaUndo, FaHeart, FaRegHeart, FaCheck, FaStar, FaRegStar, FaPlus, FaMinus } from 'react-icons/fa';

const ProductDetail = () => {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [productId, setProductId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const { addToCart } = useCart();
  const { user } = useUser();
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [activeTab, setActiveTab] = useState('DESCRIPTION');
  const [wishlist, setWishlist] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [openAccordion, setOpenAccordion] = useState(null); // Track which accordion is open
  const [imageZoom, setImageZoom] = useState({ x: 0, y: 0, show: false, active: false });
  const [hasPurchasedProduct, setHasPurchasedProduct] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        let response;
        const identifier = slug || id;
        
        if (identifier) {
          // Try slug endpoint first, fallback to ID endpoint
          try {
            response = await axios.get(`${API_BASE_URL}/api/products/p/${identifier}`);
          } catch {
            // Fallback to direct ID lookup
            response = await axios.get(`${API_BASE_URL}/api/products/${identifier}`);
          }
        }
        
        if (response?.data) {
          setProduct(response.data);
          setProductId(response.data._id);
          if (response.data.images && response.data.images.length > 0) {
            setMainImage(response.data.images[0]);
          }
          // Fetch related products from same category
          if (response.data.category) {
            try {
              const relatedRes = await axios.get(`${API_BASE_URL}/api/products/category/${response.data.category}`);
              setRelatedProducts(relatedRes.data.filter(p => p._id !== response.data._id).slice(0, 5));
            } catch {
              setRelatedProducts([]);
            }
          }
        }
        setLoading(false);
      } catch (err) {
        setError('Error fetching product details.');
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug, id, API_BASE_URL]);

  // Scroll to top when product changes (when navigating to a new product)
  useEffect(() => {
    if (product) {
      // Small delay to ensure page has rendered
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [slug, id, product]);

  useEffect(() => {
    if (product && product.images && product.images.length > 0 && !mainImage) {
      setMainImage(product.images[0]);
    }
  }, [product, mainImage]);

  useEffect(() => {
    if (product && productId) {
      axios
        .get(`${API_BASE_URL}/api/products/${productId}/reviews`)
        .then((res) => setReviews(res.data))
        .catch(() => setReviews([]));
    }
  }, [product, productId, API_BASE_URL]);

  // Check if user has purchased this product
  useEffect(() => {
    const checkUserPurchase = async () => {
      if (!user || !productId) {
        setHasPurchasedProduct(false);
        return;
      }

      setCheckingPurchase(true);
      try {
        // Fetch user's orders from both Order and ToBeShipped collections
        const [ordersRes, shippedOrdersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/orders/myorders`, {
            headers: { Authorization: `Bearer ${user.token}` }
          }).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/api/tobeshipped/myorders`, {
            headers: { Authorization: `Bearer ${user.token}` }
          }).catch(() => ({ data: [] }))
        ]);

        const allOrders = [...ordersRes.data, ...shippedOrdersRes.data];
        
        // Check if any order contains this product
        const hasPurchased = allOrders.some(order => {
          if (order.orderItems && Array.isArray(order.orderItems)) {
            return order.orderItems.some(item => {
              // Handle both populated and non-populated product references
              const itemProductId = item.product?._id || item.product;
              return itemProductId && itemProductId.toString() === productId.toString();
            });
          }
          return false;
        });

        setHasPurchasedProduct(hasPurchased);
      } catch (error) {
        console.error('Error checking purchase status:', error);
        setHasPurchasedProduct(false);
      } finally {
        setCheckingPurchase(false);
      }
    };

    checkUserPurchase();
  }, [user, productId, API_BASE_URL]);

  useEffect(() => {
    if (product && Array.isArray(product.details?.color) && product.details.color.length > 0) {
      setSelectedColor(product.details.color[0]);
    }
  }, [product]);

  const handleQuantityChange = (type) => {
    setQuantity((prev) => {
      if (type === 'increment' && prev < (product?.stock || 99)) return prev + 1;
      if (type === 'decrement' && prev > 1) return prev - 1;
      return prev;
    });
  };

  const handleAddToCart = () => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    if (product) {
      addToCart({ ...product, selectedColor }, quantity);
      navigate('/cart');
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    if (product) {
      addToCart({ ...product, selectedColor }, quantity);
      navigate('/checkout');
    }
  };

  const handleThumbnailClick = (imagePath) => {
    setMainImage(imagePath);
  };

  const cleanImagePath = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('uploads/')) return `${API_BASE_URL}/${imagePath}`;
    if (imagePath.startsWith('/uploads/')) return `${API_BASE_URL}${imagePath}`;
    return `${API_BASE_URL}/uploads/${imagePath}`;
  };

  const currentMainImageUrl = cleanImagePath(mainImage);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    
    // Check if user has purchased the product
    if (!hasPurchasedProduct) {
      setReviewError('You can only review products you have purchased.');
      return;
    }
    
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/products/${productId}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setReviewComment('');
      setReviewRating(5);
      setReviews(prev => [...prev, response.data.review]);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
    : '0';

  // Color mapping for swatches
  const getColorHex = (colorName) => {
    const colors = {
      'white': '#ffffff', 'black': '#000000', 'red': '#e53935', 'blue': '#1976d2',
      'green': '#388e3c', 'yellow': '#fbc02d', 'gray': '#9e9e9e', 'grey': '#9e9e9e',
      'pink': '#e91e63', 'purple': '#9c27b0', 'orange': '#ff9800', 'brown': '#795548',
      'gold': '#ffd700', 'silver': '#c0c0c0', 'navy': '#001f3f', 'beige': '#f5f5dc',
      'cream': '#fffdd0', 'midnight': '#191970', 'space gray': '#4a4a4a', 'rose gold': '#b76e79'
    };
    return colors[colorName?.toLowerCase()] || '#cccccc';
  };

  if (loading) return <div className="pd-loading"><div className="pd-spinner"></div></div>;
  if (error) return <div className="pd-error">{error}</div>;
  if (!product) return <div className="pd-not-found">Product not found.</div>;

  return (
    <div className="pd-page">
      {/* Breadcrumb */}
      <div className="pd-breadcrumb">
        <Link to="/">Home</Link>
        <span className="pd-breadcrumb-sep">→</span>
        <Link to={`/category/${product.category?.toLowerCase().replace(/\s+/g, '-')}`}>{product.category}</Link>
        <span className="pd-breadcrumb-sep">→</span>
        <span className="pd-breadcrumb-current">{product.name}</span>
      </div>

      {/* Main Product Section */}
      <div className="pd-main">
        {/* Thumbnails - Vertical */}
        <div className="pd-thumbnails">
          {product.images?.map((img, i) => (
            <div
              key={i}
              className={`pd-thumb ${mainImage === img ? 'active' : ''}`}
              onClick={() => handleThumbnailClick(img)}
            >
              <img src={cleanImagePath(img)} alt={`${product.name} ${i + 1}`} onError={(e) => (e.target.src = '/logo192.png')} />
            </div>
              ))}
            </div>

        {/* Main Image */}
        <div 
          className={`pd-main-image ${imageZoom.active ? 'zoom-active' : ''}`}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setImageZoom({ x, y, show: true, active: !imageZoom.active });
          }}
          onMouseMove={(e) => {
            if (imageZoom.active) {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setImageZoom(prev => ({ ...prev, x, y, show: true }));
            }
          }}
          onMouseLeave={() => {
            if (!imageZoom.active) {
              setImageZoom({ x: 0, y: 0, show: false, active: false });
            }
          }}
        >
          {currentMainImageUrl ? (
            <>
              <img 
                src={currentMainImageUrl} 
                alt={product.name} 
                onError={(e) => (e.target.src = '/logo192.png')}
                style={{
                  transform: imageZoom.active ? `scale(2.5)` : 'scale(1)',
                  transformOrigin: `${imageZoom.x}% ${imageZoom.y}%`,
                }}
              />
              {imageZoom.active && imageZoom.show && (
                <div 
                  className="pd-zoom-overlay"
                  style={{
                    backgroundImage: `url(${currentMainImageUrl})`,
                    backgroundPosition: `${imageZoom.x}% ${imageZoom.y}%`,
                    backgroundSize: '250%',
                  }}
                />
              )}
            </>
          ) : (
            <div className="pd-no-image">No Image Available</div>
          )}
        </div>

        {/* Product Info */}
        <div className="pd-info">
          {product.details?.brand && <p className="pd-brand">{product.details.brand}</p>}
          <h1 className="pd-title">{product.name}</h1>
          
          <div className="pd-price-row">
            {product.discountPrice ? (
              <>
                <span className="pd-old-price">Rs. {product.price?.toLocaleString()}</span>
                <span className="pd-current-price">Rs. {product.discountPrice?.toLocaleString()}</span>
              </>
            ) : (
              <span className="pd-current-price">Rs. {product.price?.toLocaleString()}</span>
            )}
          </div>
             {/* Koko Payment Option */}
          <div className="pd-koko-payment">
            <span className="pd-koko-text">
            3 x <strong>Rs. {Math.ceil((product.discountPrice || product.price) / 3).toLocaleString()}</strong> with <img src="/koko.webp" alt="Koko" className="pd-koko-logo" />
            </span>
          </div>
          <div className="pd-rating-row">
            <div className="pd-stars">
              {[...Array(5)].map((_, i) => (
                i < Math.floor(averageRating) ? <FaStar key={i} /> : <FaRegStar key={i} />
              ))}
            </div>
            <span className="pd-rating-text">{reviews.length > 0 ? `${averageRating} (${reviews.length} reviews)` : 'No reviews yet'}</span>
            </div>
          <p className="pd-description">{product.description}</p>

          {/* Color Selection */}
          {Array.isArray(product.details?.color) && product.details.color.length > 0 && (
            <div className="pd-option-section">
              <p className="pd-option-label">Select color</p>
              <div className="pd-color-swatches">
                {product.details.color.map((color, idx) => (
                  <button
                    key={idx}
                    className={`pd-color-swatch ${selectedColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: getColorHex(color) }}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                          >
                    {selectedColor === color && <FaCheck className="pd-swatch-check" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Wishlist */}
          <div className="pd-quantity-row">
            <div className="pd-quantity">
              <button onClick={() => handleQuantityChange('decrement')}>−</button>
              <span>{quantity}</span>
              <button onClick={() => handleQuantityChange('increment')}>+</button>
            </div>
            <button className="pd-wishlist-btn" onClick={() => setWishlist(!wishlist)}>
              {wishlist ? <FaHeart /> : <FaRegHeart />}
            </button>
          </div>

          {/* Add to Cart & Buy Now */}
          <div className="pd-actions">
            <button 
              className="pd-add-cart-btn" 
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              ADD TO CART
            </button>
            <button className="pd-buy-now-btn" onClick={handleBuyNow} disabled={product.stock <= 0}>
              BUY NOW
            </button>
          </div>

          {/* Stock Status */}
          <div className="pd-stock-status">
            {product.stock > 0 ? (
              <span className="pd-in-stock"><FaCheck /> In stock ({product.stock} available)</span>
            ) : (
              <span className="pd-out-stock">Out of stock</span>
            )}
          </div>

          {/* Policy Accordion */}
          <div className="pd-policy-accordion">
            <div className="pd-accordion-item">
              <button 
                className="pd-accordion-header"
                onClick={() => setOpenAccordion(openAccordion === 'security' ? null : 'security')}
              >
                <div className="pd-accordion-title-wrapper">
                  <FaShieldAlt className="pd-accordion-icon" />
                  <span className="pd-accordion-title">Security Policy</span>
                </div>
                {openAccordion === 'security' ? <FaMinus /> : <FaPlus />}
              </button>
              {openAccordion === 'security' && (
                <div className="pd-accordion-content">
                  <p>Safe & Secure Checkout</p>
                  <p>Your payment information is encrypted and secure. We use industry-standard SSL encryption to protect your data during checkout.</p>
                </div>
              )}
            </div>

            <div className="pd-accordion-item">
              <button 
                className="pd-accordion-header"
                onClick={() => setOpenAccordion(openAccordion === 'delivery' ? null : 'delivery')}
              >
                <div className="pd-accordion-title-wrapper">
                  <FaTruck className="pd-accordion-icon" />
                  <span className="pd-accordion-title">Delivery Policy</span>
                </div>
                {openAccordion === 'delivery' ? <FaMinus /> : <FaPlus />}
              </button>
              {openAccordion === 'delivery' && (
                <div className="pd-accordion-content">
                  <p>Island-wide delivery within 3-7 days</p>
                  <p>We deliver to all locations across Sri Lanka. Standard delivery takes 3-7 business days. Express delivery options are available for major cities.</p>
                </div>
              )}
            </div>

            <div className="pd-accordion-item">
              <button 
                className="pd-accordion-header"
                onClick={() => setOpenAccordion(openAccordion === 'return' ? null : 'return')}
              >
                <div className="pd-accordion-title-wrapper">
                  <FaUndo className="pd-accordion-icon" />
                  <span className="pd-accordion-title">Return Policy</span>
                </div>
                {openAccordion === 'return' ? <FaMinus /> : <FaPlus />}
              </button>
              {openAccordion === 'return' && (
                <div className="pd-accordion-content">
                  <p>7-day hassle-free returns</p>
                  <p>Not satisfied with your purchase? Return it within 7 days of delivery for a full refund. Items must be in original condition with all packaging intact.</p>
                </div>
              )}
            </div>
          </div>
        </div>
          </div>

      {/* Tabs */}
      <div className="pd-tabs">
        {['DESCRIPTION', 'DETAILS', 'COMMENTS'].map(tab => (
          <button
            key={tab}
            className={`pd-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
        </div>

      {/* Tab Content */}
      <div className="pd-tab-content">
        {activeTab === 'DESCRIPTION' && (
          <div className="pd-description-content">
            {product.longDescription ? (() => {
              // Process markdown to remove blank lines between list items
              const processedMarkdown = product.longDescription
                .split('\n')
                .reduce((acc, line, index, array) => {
                  const prevLine = array[index - 1];
                  const nextLine = array[index + 1];
                  // Match list items: - * + or numbered lists
                  const isListItem = /^[\s]*[-*+]\s/.test(line) || /^[\s]*\d+\.\s/.test(line);
                  const prevIsListItem = prevLine && (/^[\s]*[-*+]\s/.test(prevLine) || /^[\s]*\d+\.\s/.test(prevLine));
                  const nextIsListItem = nextLine && (/^[\s]*[-*+]\s/.test(nextLine) || /^[\s]*\d+\.\s/.test(nextLine));
                  
                  // If current line is blank and it's between list items, skip it
                  if (line.trim() === '' && (prevIsListItem && nextIsListItem)) {
                    return acc;
                  }
                  
                  // If current line is blank and previous is a list item, skip it
                  if (line.trim() === '' && prevIsListItem) {
                    return acc;
                  }
                  
                  acc.push(line);
                  return acc;
                }, [])
                .join('\n');
              
              return (
                <ReactMarkdown 
                  components={{
                    p: ({node, ...props}) => {
                      // Check if paragraph is inside a list item
                      const isInList = node?.parent?.tagName === 'li';
                      if (isInList) {
                        // For paragraphs inside list items, render as span to avoid any block-level spacing
                        return <span style={{display: 'inline'}} {...props} />;
                      }
                      return <p style={{
                        marginBottom: '1em', 
                        marginTop: '0'
                      }} {...props} />;
                    },
                    h1: ({node, ...props}) => <h1 style={{marginTop: '1.5em', marginBottom: '0.5em'}} {...props} />,
                    h2: ({node, ...props}) => <h2 style={{marginTop: '1.5em', marginBottom: '0.5em'}} {...props} />,
                    h3: ({node, ...props}) => <h3 style={{marginTop: '1.5em', marginBottom: '0.5em'}} {...props} />,
                    ul: ({node, ...props}) => {
                      // Check if this list follows a heading
                      const prevSibling = node?.previousSibling;
                      const isAfterHeading = prevSibling && (prevSibling.tagName === 'h1' || prevSibling.tagName === 'h2' || prevSibling.tagName === 'h3' || prevSibling.tagName === 'strong');
                      return <ul style={{
                        marginTop: isAfterHeading ? '4px' : '0.5em', 
                        marginBottom: '0.5em', 
                        paddingLeft: '1.5em'
                      }} {...props} />;
                    },
                    ol: ({node, ...props}) => {
                      // Check if this list follows a heading
                      const prevSibling = node?.previousSibling;
                      const isAfterHeading = prevSibling && (prevSibling.tagName === 'h1' || prevSibling.tagName === 'h2' || prevSibling.tagName === 'h3' || prevSibling.tagName === 'strong');
                      return <ol style={{
                        marginTop: isAfterHeading ? '4px' : '0.5em', 
                        marginBottom: '0.5em', 
                        paddingLeft: '1.5em'
                      }} {...props} />;
                    },
                    li: ({node, ...props}) => <li style={{
                      margin: '0',
                      padding: '0',
                      marginTop: '0', 
                      marginBottom: '0',
                      paddingTop: '0',
                      paddingBottom: '0',
                      lineHeight: '1.1'
                    }} {...props} />,
                    strong: ({node, ...props}) => <strong style={{fontWeight: '600'}} {...props} />,
                    em: ({node, ...props}) => <em style={{fontStyle: 'italic'}} {...props} />,
                  }}
                >
                  {processedMarkdown}
                </ReactMarkdown>
              );
            })() : (
              <p>{product.description}</p>
            )}
          </div>
        )}

        {activeTab === 'DETAILS' && (
          <div className="pd-details-content">
            {product.details ? (
              <table className="pd-specs-table">
                <tbody>
                {Object.entries(product.details).map(([key, value]) => {
                  // Format the value for display
                  let displayValue = value;
                  
                  // Handle boolean values (toggle fields) - show "Yes" or "No"
                  if (typeof value === 'boolean') {
                    displayValue = value ? 'Yes' : 'No';
                  }
                  // Handle arrays
                  else if (Array.isArray(value)) {
                    displayValue = value.join(', ');
                  }
                  // Handle string values
                  else {
                    displayValue = value;
                  }
                  
                  return (
                    <tr key={key}>
                      <td className="pd-spec-key">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}</td>
                      <td className="pd-spec-value">{displayValue}</td>
                    </tr>
                  );
                })}
                  <tr>
                    <td className="pd-spec-key">Warranty</td>
                    <td className="pd-spec-value">{product.warrantyPeriod || 'No Warranty'}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p>No specifications available.</p>
            )}
          </div>
        )}

        {activeTab === 'COMMENTS' && (
          <div className="pd-comments-content">
            <div className="pd-comments-grid">
              {/* Reviews List */}
              <div className="pd-reviews-list">
                <h3>{reviews.length} REVIEW{reviews.length !== 1 ? 'S' : ''}</h3>
                <div className="pd-reviews-avg">
                  <div className="pd-stars">
                    {[...Array(5)].map((_, i) => (
                      i < Math.floor(averageRating) ? <FaStar key={i} /> : <FaRegStar key={i} />
                    ))}
                  </div>
                  <span>{averageRating}/5</span>
                </div>

                {reviews.length === 0 ? (
                  <p className="pd-no-reviews">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map((review, idx) => (
                    <div key={idx} className="pd-review-item">
                      <div className="pd-review-avatar">
                        {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="pd-review-content">
                        <div className="pd-review-header">
                          <span className="pd-review-name">{review.user?.name || 'Anonymous'}</span>
                          <div className="pd-review-stars">
                            {[...Array(5)].map((_, i) => (
                              i < review.rating ? <FaStar key={i} /> : <FaRegStar key={i} />
                            ))}
                            <span>({review.rating}/5)</span>
                          </div>
                        </div>
                        <p className="pd-review-text">{review.comment}</p>
                        <span className="pd-review-date">
                          {review.date ? new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>
                  </div>
                  ))
                )}
              </div>

              {/* Write Review Form */}
              <div className="pd-write-review">
                <h3>WRITE YOUR REVIEW</h3>
                {!user ? (
                  <p className="pd-login-notice">Please log in to submit a review.</p>
                ) : checkingPurchase ? (
                  <p className="pd-checking-purchase">Checking purchase status...</p>
                ) : !hasPurchasedProduct ? (
                  <div className="pd-purchase-required">
                    <p className="pd-purchase-message">
                      You must purchase this product before you can write a review.
                    </p>
                    <p className="pd-purchase-hint">
                      Only customers who have purchased this product can submit reviews.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit}>
                    <div className="pd-form-group">
                      <label>Your Rating*</label>
                      <div className="pd-rating-select">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            className={reviewRating >= star ? 'active' : ''}
                            onClick={() => setReviewRating(star)}
                          >
                            {reviewRating >= star ? <FaStar /> : <FaRegStar />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="pd-form-group">
                      <label>Write your review*</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience with this product..."
                        required
                        rows={4}
                      />
                    </div>
                    <button type="submit" className="pd-submit-review" disabled={reviewSubmitting}>
                      {reviewSubmitting ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
                    </button>
                    {reviewError && <p className="pd-review-error">{reviewError}</p>}
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="pd-related">
          <h2 className="pd-related-title">RELATED PRODUCTS</h2>
          <div className="pd-related-grid">
            {relatedProducts.map(rp => (
              <Link 
                to={`/product/${rp.slug || rp._id}`} 
                key={rp._id} 
                className="pd-related-card"
                onClick={() => {
                  // Scroll to top immediately when clicking related product
                  window.scrollTo({ top: 0, behavior: 'auto' });
                }}
              >
                <div className="pd-related-img">
                  <img src={cleanImagePath(rp.images?.[0])} alt={rp.name} onError={(e) => (e.target.src = '/logo192.png')} />
          </div>
                <div className="pd-related-info">
                  <p className="pd-related-brand">{rp.details?.brand || rp.category}</p>
                  <p className="pd-related-name">{rp.name}</p>
                  <div className="pd-related-price">
                    {rp.discountPrice ? (
                      <>
                        <span className="pd-related-old">Rs. {rp.price?.toLocaleString()}</span>
                        <span className="pd-related-current">Rs. {rp.discountPrice?.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="pd-related-current">Rs. {rp.price?.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          </div>
        )}

      <Footer />

      {/* Modals */}
      <Modal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} title="Login">
        <Login
          asModal
          sourcePage="productDetail"
          onSuccess={() => setLoginModalOpen(false)}
          onSwitchRegister={() => { setLoginModalOpen(false); setRegisterModalOpen(true); }}
        />
      </Modal>
      <Modal isOpen={registerModalOpen} onClose={() => setRegisterModalOpen(false)} title="Register">
        <Register
          asModal
          onSuccess={() => setRegisterModalOpen(false)}
          onSwitchLogin={() => { setRegisterModalOpen(false); setLoginModalOpen(true); }}
        />
      </Modal>
    </div>
  );
};

export default ProductDetail;
