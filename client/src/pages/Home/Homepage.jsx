import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';

const Homepage = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Replace with actual fetch logic
    setProducts([
      {
        _id: '1',
        name: 'iPhone 14',
        description: 'Powerful and sleek',
        price: 999.99,
        images: ['https://via.placeholder.com/150'],
      },
      {
        _id: '2',
        name: 'AirPods Pro',
        description: 'Crystal clear sound',
        price: 199.99,
        images: ['https://via.placeholder.com/150'],
      },
    ]);
  }, []);

  const generateImageUrl = (product) => {
    return product.images?.[0] || '/logo512.png';
  };

  return (
    <div className="home">
     <header className="header">
  <div className="header-row">
    <div className="nav-buttons">
      <button>Phone</button>
      <button>Accessories</button>
      <button>New Deals</button>
      <button>Popular</button>
    </div>

    <div className="search">
      <input type="text" placeholder="Search" />
      <svg className="search-icon" viewBox="0 0 24 24" stroke="currentColor" fill="none">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>

    <div className="nav-info">
      <button>About</button>
      <button>FAQ's</button>
    </div>
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

export default Homepage;
