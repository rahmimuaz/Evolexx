import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const IMAGE_BASE_URL = 'http://localhost:5001/';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/products');
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      setError('Error fetching products');
      setLoading(false);
    }
  };

  const generateImageUrl = (product) => {
    if (product.images && product.images.length > 0) {
      const imageUrl = product.images[0].startsWith('http') 
        ? product.images[0] 
        : `http://localhost:5001/${product.images[0].replace(/^\//, '')}`;
      return imageUrl;
    }
    return '/logo192.png';
  };

  if (loading) {
    return (
      <div className="loading-container">
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

  return (
    <div className="home-page-container">

      <div className="max-width-wrapper top-nav-section">
        <div className="filter-buttons-group">
          <button className="filter-button">Phone</button>
          <button className="filter-button">Accessories</button>
          <button className="filter-button">New Deals</button>
          <button className="filter-button">Popular</button>
        </div>
        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search"
              className="search-input"
            />
            <div className="search-icon">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="info-buttons-group">
          <button className="filter-button">About</button>
          <button className="filter-button">FAQ's</button>
        </div>
      </div>
      <div className="max-width-wrapper hero-banner-section">
        <img
          src="/logo512.png"
          alt="Hero Banner"
          className="hero-banner-image"
        />
      </div>

      <div className="max-width-wrapper features-section">
        <div className="feature-card">
          <svg className="feature-card-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.001 12.001 0 002.944 12c.048 2.923 1.11 5.632 3.04 7.056A12.001 12.001 0 0012 21.056c2.923-.048 5.632-1.11 7.056-3.04A12.001 12.001 0 0021.056 12a11.955 11.955 0 01-3.04-8.618z" />
          </svg>
          <h3 className="feature-card-title">Fast & Free Shipping</h3>
          <p className="feature-card-description">Every single order ships for free.</p>
        </div>
        <div className="feature-card middle-card">
          <svg className="feature-card-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h.01M7 16h.01M17 16h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="feature-card-title">30 DAYS RETURNS POLICY</h3>
          <p className="feature-card-description">Product returns are accepted within 30 days.</p>
        </div>
        <div className="feature-card">
          <svg className="feature-card-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <h3 className="feature-card-title">TOP QUALITY PRODUCTS</h3>
          <p className="feature-card-description">We always provide high quality Products.</p>
        </div>
      </div>

      <div className="max-width-wrapper explore-products-heading-section">
        <h2 className="explore-products-title">Explore Products</h2>
      </div>

      <div className="max-width-wrapper product-grid">
        {products.map((product) => {
          const imageUrl = generateImageUrl(product);

          return (
            <div key={product._id} className="product-card">
              <Link to={`/products/${product._id}`} className="product-link">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="product-image"
                    onError={(e) => {
                      e.target.src = '/logo192.png';
                    }}
                  />
                )}
                <div className="product-info-padding">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <div className="product-price-and-rating">
                    <p className="product-price">${product.price ? product.price.toFixed(2) : 'N/A'}</p>
                    <div className="product-rating">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="star-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.683-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.565-1.839-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="rating-count">(0)</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Home;