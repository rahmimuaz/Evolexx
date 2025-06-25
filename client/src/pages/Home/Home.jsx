import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      return product.images[0].startsWith('http')
        ? product.images[0]
        : `http://localhost:5001/${product.images[0].replace(/^\//, '')}`;
    }
    return '/logo192.png';
  };

  if (loading) return <div className="loader"></div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="home">
      <header className="header">
        <div className="nav-buttons">
          <button>Phone</button>
          <button>Accessories</button>
          <button>New Deals</button>
          <button>Popular</button>
        </div>
        <div className="search">
          <input type="text" placeholder="Search" />
          <svg className="search-icon" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="nav-info">
          <button>About</button>
          <button>FAQ's</button>
        </div>
      </header>

      <section className="banner">
        <img src="/logo512.png" alt="Hero Banner" />
      </section>

      <section className="features">
        <div className="feature">
          <h3>Fast & Free Shipping</h3>
          <p>Every single order ships for free.</p>
        </div>
        <div className="feature">
          <h3>30 Days Returns</h3>
          <p>Product returns accepted within 30 days.</p>
        </div>
        <div className="feature">
          <h3>Top Quality</h3>
          <p>We always provide high quality products.</p>
        </div>
      </section>

      <section className="product-section">
        <h2>Explore Products</h2>
        <div className="product-grid">
          {products.map((product) => {
            const imageUrl = generateImageUrl(product);
            return (
              <Link to={`/products/${product._id}`} className="product-card" key={product._id}>
                <img
                  src={imageUrl}
                  alt={product.name}
                  onError={(e) => (e.target.src = '/logo192.png')}
                />
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <p className="price">${product.price?.toFixed(2) || 'N/A'}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Home;
