import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './ProductDetail.css';
import Footer from '../../components/Footer/Footer';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');

  const { addToCart } = useCart();

  const IMAGE_BASE_URL = 'http://localhost:5001/uploads/';

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/products/${id}`);
        setProduct(response.data);
        setLoading(false);
        if (response.data.images && response.data.images.length > 0) {
          setMainImage(response.data.images[0]);
        }
      } catch (err) {
        setError('Error fetching product details.');
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product && product.images && product.images.length > 0 && !mainImage) {
      setMainImage(product.images[0]);
    }
  }, [product, mainImage]);

  const handleQuantityChange = (type) => {
    if (type === 'increment') {
      setQuantity(prev => prev + 1);
    } else if (type === 'decrement' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  const handleBuyNow = () => {
    alert(`Buying ${quantity} of ${product.name} now!`);
  };

  const handleThumbnailClick = (imagePath) => {
    setMainImage(imagePath);
  };

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="not-found-message">
        Product not found.
      </div>
    );
  }

  const cleanImagePath = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    if (imagePath.startsWith('uploads/')) {
      return `http://localhost:5001/${imagePath}`;
    }
    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:5001${imagePath}`;
    }
    return `http://localhost:5001/uploads/${imagePath}`;
  };

  const currentMainImageUrl = cleanImagePath(mainImage);

  return (
    <div className="product-detail-page-container">
      <div className="product-detail-main-content">
        <div className="image-gallery-section">
          <div className="main-image-container">
            {currentMainImageUrl ? (
              <img
                src={currentMainImageUrl}
                alt={product.name}
                className="main-image"
                onError={(e) => {
                  e.target.src = '/logo192.png';
                }}
              />
            ) : (
              <div className="no-image-placeholder">
                No Image Available
              </div>
            )}
          </div>
          <div className="thumbnail-container">
            {product.images.map((imagePath, index) => (
              <img
                key={index}
                src={cleanImagePath(imagePath)}
                alt={`${product.name} thumbnail ${index + 1}`}
                className={`thumbnail-image ${mainImage === imagePath ? 'selected' : ''}`}
                onClick={() => handleThumbnailClick(imagePath)}
                onError={(e) => {
                  e.target.src = '/logo192.png';
                }}
              />
            ))}
          </div>
        </div>

        <div className="product-info-section">
          <h1 className="product-name">{product.name}</h1>
          <p className="product-tagline">We always provide high quality Products.</p>
          <div className="price-section">
            <p className="product-price">Rs. {product.price ? product.price.toLocaleString() : 'N/A'}</p>
          </div>

          <div className="color-options-section">
            <p className="color-options-title">Color family</p>
            <div className="color-swatches">
              <div className="color-swatch red"></div>
              <div className="color-swatch black"></div>
              <div className="color-swatch gray"></div>
            </div>
          </div>
          <div className="product-ratings">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.683-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.565-1.839-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-gray-600 text-sm">Ratings</span>
          </div>

          <div className="quantity-selector-section">
            <div className="quantity-controls">
              <button
                onClick={() => handleQuantityChange('decrement')}
                className="quantity-button decrement"
              >
                -
              </button>
              <input
                type="text"
                value={quantity.toString().padStart(2, '0')}
                readOnly
                className="quantity-input"
              />
              <button
                onClick={() => handleQuantityChange('increment')}
                className="quantity-button increment"
              >
                +
              </button>
            </div>
            <span className="stock-info">Only {product.stock} left in stock</span>
          </div>

          <div className="action-buttons-container">
            <button
              onClick={handleAddToCart}
              className="action-button add-to-cart-button"
            >
              ADD TO CART
            </button>
            <button
              onClick={handleBuyNow}
              className="action-button buy-now-button"
            >
              BUY NOW
            </button>
          </div>
        </div>

        <div className="side-info-section">
          <div>
            <h2 className="info-block-title">Delivery Options</h2>
            <div className="info-list">
              <div className="info-list-item">
                <svg className="h-6 w-6 mr-2 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-2 4l-3 3m0 0l3 3m-3-3h8" />
                </svg>
                <div>
                  <p className="font-semibold">Standard</p>
                  <p className="sub-text">Guaranteed by</p>
                </div>
              </div>
              <div className="info-list-item">
                <svg className="h-6 w-6 mr-2 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l2 2m0 0l4-4m-4 4H7m-2 4h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="font-semibold">Cash on Delivery Available</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="info-block-title">Return & Warranty</h2>
            <div className="info-list">
              <div className="info-list-item">
                <svg className="h-6 w-6 mr-2 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-semibold">7 days easy return</p>
              </div>
              <div className="info-list-item">
                <svg className="h-6 w-6 mr-2 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.001 12.001 0 002.944 12c.048 2.923 1.11 5.632 3.04 7.056A12.001 12.001 0 0012 21.056c2.923-.048 5.632-1.11 7.056-3.04A12.001 12.001 0 0021.056 12a11.955 11.955 0 01-3.04-8.618z" />
                </svg>
                <p className="font-semibold">6 Months Seller Warranty</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr />
        < Footer />
    </div>
  );
};

export default ProductDetail;
