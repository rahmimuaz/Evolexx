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
import { FaShieldAlt, FaTruck, FaUndo, FaHeart, FaRegHeart, FaCheck, FaStar, FaRegStar } from 'react-icons/fa';

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

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        let response;
        if (slug) {
          response = await axios.get(`${API_BASE_URL}/api/products/p/${slug}`);
        } else if (id) {
          response = await axios.get(`${API_BASE_URL}/api/products/${id}`);
        }
        
        if (response?.data) {
        setProduct(response.data);
          setProductId(response.data._id);
        if (response.data.images && response.data.images.length > 0) {
          setMainImage(response.data.images[0]);
        }
          // Fetch related products from same category
          if (response.data.category) {
            const relatedRes = await axios.get(`${API_BASE_URL}/api/products/category/${response.data.category}`);
            setRelatedProducts(relatedRes.data.filter(p => p._id !== response.data._id).slice(0, 5));
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
        <div className="pd-main-image">
          {currentMainImageUrl ? (
            <img src={currentMainImageUrl} alt={product.name} onError={(e) => (e.target.src = '/logo192.png')} />
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

          {/* Trust Badges */}
          <div className="pd-trust-badges">
            <div className="pd-badge">
              <FaShieldAlt className="pd-badge-icon" />
              <p className="pd-badge-title">Security Policy</p>
              <p className="pd-badge-text">Safe & Secure Checkout</p>
            </div>
            <div className="pd-badge">
              <FaTruck className="pd-badge-icon" />
              <p className="pd-badge-title">Delivery Policy</p>
              <p className="pd-badge-text">Island-wide delivery within 3-7 days</p>
            </div>
            <div className="pd-badge">
              <FaUndo className="pd-badge-icon" />
              <p className="pd-badge-title">Return Policy</p>
              <p className="pd-badge-text">7-day hassle-free returns</p>
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
            {product.longDescription ? (
              <ReactMarkdown>{product.longDescription}</ReactMarkdown>
            ) : (
              <p>{product.description}</p>
            )}
          </div>
        )}

        {activeTab === 'DETAILS' && (
          <div className="pd-details-content">
            {product.details ? (
              <table className="pd-specs-table">
                <tbody>
                {Object.entries(product.details).map(([key, value]) => (
                    <tr key={key}>
                      <td className="pd-spec-key">{key.charAt(0).toUpperCase() + key.slice(1)}</td>
                      <td className="pd-spec-value">{Array.isArray(value) ? value.join(', ') : value}</td>
                    </tr>
                ))}
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
                  {!user && <p className="pd-login-notice">Please log in to submit a review.</p>}
              </form>
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
              <Link to={`/product/${rp.slug || rp._id}`} key={rp._id} className="pd-related-card">
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
