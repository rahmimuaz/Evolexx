import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Products.css';

const Products = () => {
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
        <div className="spinner"></div>
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
    
    <div className="products-container">
      
      <div className="products-header">
        
        <div className="products-header-content">
          
          <h1 className="products-title">Our Products</h1>
          
          <p className="products-description">
            Browse our collection of products.
          </p>
        </div>
      </div>

      
      <div className="product-grid">
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
                  
                  <div className="product-meta">
                    
                    <p className="product-price">${product.price ? product.price.toFixed(2) : 'N/A'}</p>
                    
                    <div className="product-ratings">
                      {[...Array(5)].map((_, i) => (
                        
                        <svg key={i} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.683-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.565-1.839-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      
                      <span className="product-ratings-count">(0)</span>
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

export default Products;