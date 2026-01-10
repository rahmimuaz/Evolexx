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
  const [activeTab, setActiveTab] = useState('DESCRIPTION');
  const [wishlist, setWishlist] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [openAccordion, setOpenAccordion] = useState(null);
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

  // Get current images
  const getCurrentImages = () => {
    if (product?.images && product.images.length > 0) {
      return product.images;
    }
    return [];
  };

  const handleQuantityChange = (type) => {
    setQuantity((prev) => {
      const maxStock = product?.stock || 99;
      if (type === 'increment' && prev < maxStock) return prev + 1;
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
      addToCart(product, quantity);
      navigate('/cart');
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    if (product) {
      addToCart(product, quantity);
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

  // Color mapping for swatches - handles both color names and hex codes
  const getColorHex = (colorValue) => {
    if (!colorValue) return '#cccccc';
    
    // If it's already a hex color code, use it directly
    if (colorValue.startsWith('#')) {
      return colorValue;
    }
    
    // Otherwise, try to match color names
    const colors = {
      'white': '#ffffff', 'black': '#000000', 'red': '#e53935', 'blue': '#1976d2',
      'green': '#388e3c', 'yellow': '#fbc02d', 'gray': '#9e9e9e', 'grey': '#9e9e9e',
      'pink': '#e91e63', 'purple': '#9c27b0', 'orange': '#ff9800', 'brown': '#795548',
      'gold': '#ffd700', 'silver': '#c0c0c0', 'navy': '#001f3f', 'beige': '#f5f5dc',
      'cream': '#fffdd0', 'midnight': '#191970', 'space gray': '#4a4a4a', 'rose gold': '#b76e79'
    };
    return colors[colorValue?.toLowerCase()] || '#cccccc';
  };

  // Convert hex color code to color name (for display in details)
  const hexToColorName = (hexCode) => {
    if (!hexCode || !hexCode.startsWith('#')) return null;
    
    // Normalize hex code (convert to lowercase, remove spaces)
    const normalizedHex = hexCode.toLowerCase().trim();
    
    // Common hex to color name mapping
    const hexToName = {
      '#ffffff': 'White', '#000000': 'Black', '#e53935': 'Red', '#1976d2': 'Blue',
      '#388e3c': 'Green', '#fbc02d': 'Yellow', '#9e9e9e': 'Gray', '#e91e63': 'Pink',
      '#9c27b0': 'Purple', '#ff9800': 'Orange', '#795548': 'Brown', '#ffd700': 'Gold',
      '#c0c0c0': 'Silver', '#001f3f': 'Navy', '#f5f5dc': 'Beige', '#fffdd0': 'Cream',
      '#191970': 'Midnight Blue', '#4a4a4a': 'Space Gray', '#b76e79': 'Rose Gold',
      '#ff0000': 'Red', '#00ff00': 'Green', '#0000ff': 'Blue', '#ffff00': 'Yellow',
      '#ff00ff': 'Magenta', '#00ffff': 'Cyan', '#808080': 'Gray', '#800000': 'Maroon',
      '#008000': 'Green', '#000080': 'Navy', '#800080': 'Purple', '#ffc0cb': 'Pink'
    };
    
    return hexToName[normalizedHex] || null;
  };

  // Check if a value is a hex color code
  const isHexColorCode = (value) => {
    if (!value || typeof value !== 'string') return false;
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value.trim());
  };

  // Add structured data (JSON-LD) for SEO
  useEffect(() => {
    if (!product) return;

    const baseUrl = window.location.origin;
    const productUrl = `${baseUrl}/product/${product.slug || product._id}`;
    const productImage = product.images && product.images[0] 
      ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}/${product.images[0]}`)
      : `${baseUrl}/logo192.png`;
    
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": product.description,
      "image": product.images?.map(img => img.startsWith('http') ? img : `${API_BASE_URL}/${img}`) || [productImage],
      "brand": {
        "@type": "Brand",
        "name": product.details?.brand || "Evolexx"
      },
      "offers": {
        "@type": "Offer",
        "url": productUrl,
        "priceCurrency": "LKR",
        "price": product.discountPrice || product.price,
        "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "Evolexx"
        }
      },
      "category": product.category
    };

    // Add aggregate rating if reviews exist
    if (reviews.length > 0) {
      structuredData.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": averageRating,
        "reviewCount": reviews.length
      };
    }

    // Remove existing structured data script if any
    const existingScript = document.getElementById('product-structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data script
    const script = document.createElement('script');
    script.id = 'product-structured-data';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById('product-structured-data');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [product, reviews, API_BASE_URL]);

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
          {getCurrentImages().map((img, i) => (
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
        <div className="pd-main-image">
          {currentMainImageUrl ? (
            <img 
              src={currentMainImageUrl} 
              alt={product.name} 
              onError={(e) => (e.target.src = '/logo192.png')}
            />
          ) : (
            <div className="pd-no-image">No Image Available</div>
          )}
        </div>

        {/* Product Info */}
        <div className="pd-info">
          {product.details?.brand && <p className="pd-brand">{product.details.brand}</p>}
          <h1 className="pd-title">{product.name}</h1>
          
          <div className="pd-price-row">
            {product.discountPrice && product.discountPrice < product.price ? (
              <>
                <span className="pd-current-price">Rs. {product.discountPrice?.toLocaleString()}</span>
                <span className="pd-old-price">Rs. {product.price?.toLocaleString()}</span>
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
              disabled={!product.stock || product.stock <= 0}
            >
              ADD TO CART
            </button>
            <button 
              className="pd-buy-now-btn" 
              onClick={handleBuyNow} 
              disabled={!product.stock || product.stock <= 0}
            >
              BUY NOW
            </button>
          </div>

          {/* Stock Status */}
          <div className="pd-stock-status">
            {product.stock > 0 ? (
              <span className="pd-in-stock">
                <FaCheck /> In stock ({product.stock} available)
              </span>
            ) : (
              <span className="pd-out-stock">
                Out of stock
              </span>
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
                    h1: ({node, children, ...props}) => <h1 style={{marginTop: '1.5em', marginBottom: '0.5em'}} {...props}>{children}</h1>,
                    h2: ({node, children, ...props}) => <h2 style={{marginTop: '1.5em', marginBottom: '0.5em'}} {...props}>{children}</h2>,
                    h3: ({node, children, ...props}) => <h3 style={{marginTop: '1.5em', marginBottom: '0.5em'}} {...props}>{children}</h3>,
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
                  // Skip color field if it's a hex code
                  if (key.toLowerCase() === 'color' && isHexColorCode(value)) {
                    // Try to convert hex to color name
                    const colorName = hexToColorName(value);
                    // If we can't convert it, hide this field from details table
                    if (!colorName) {
                      return null;
                    }
                    // If we can convert it, use the color name instead
                    value = colorName;
                  }
                  
                  // Format the value for display
                  let displayValue = value;
                  
                  // Handle boolean values (toggle fields) - show "Yes" or "No"
                  if (typeof value === 'boolean') {
                    displayValue = value ? 'Yes' : 'No';
                  }
                  // Handle arrays
                  else if (Array.isArray(value)) {
                    // Check if array contains hex codes for color field
                    if (key.toLowerCase() === 'color') {
                      displayValue = value.map(v => {
                        if (isHexColorCode(v)) {
                          const colorName = hexToColorName(v);
                          return colorName || v; // Use color name if available, otherwise keep original
                        }
                        return v;
                      }).join(', ');
                    } else {
                      displayValue = value.join(', ');
                    }
                  }
                  // Handle string values - check if it's a hex code
                  else if (typeof value === 'string' && key.toLowerCase() === 'color' && isHexColorCode(value)) {
                    const colorName = hexToColorName(value);
                    displayValue = colorName || value;
                  }
                  else {
                    displayValue = value;
                  }
                  
                  return (
                    <tr key={key}>
                      <td className="pd-spec-key">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}</td>
                      <td className="pd-spec-value">{displayValue}</td>
                    </tr>
                  );
                }).filter(Boolean)}
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
