import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faCheckCircle, faBox } from '@fortawesome/free-solid-svg-icons';

const LowStockProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/products/admin/low-stock`)
      .then(res => setProducts(res.data))
      .catch(() => {
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [API_BASE_URL]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading Low Stock Products...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex-between mb-5">
        <div>
          <h1 className="page-title"><FontAwesomeIcon icon={faExclamationTriangle} /> Low Stock Products</h1>
          <p className="page-subtitle">Products running low on inventory</p>
        </div>
        <button onClick={() => navigate('/Products')} className="btn btn-secondary">
          ← Back to Products
        </button>
      </div>

      {/* Alert Box */}
      {products.length > 0 && (
        <div className="alert alert-warning">
          <strong>Action Required!</strong> You have {products.length} product{products.length !== 1 ? 's' : ''} with low stock. Please restock soon to avoid shortages.
        </div>
      )}

      {/* Products Table */}
      <div className="admin-table-container">
        <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    <div className="empty-state-icon"><FontAwesomeIcon icon={faCheckCircle} /></div>
                    <div className="empty-state-title">All Good!</div>
                    <div className="empty-state-text">No products with low stock found</div>
                  </div>
                </td>
              </tr>
            ) : (
              products.map(product => (
                <tr key={product._id}>
                  <td>
                    <span className="text-bold">{product.productId}</span>
                  </td>
                  <td>
                    <div className="flex gap-3" style={{ alignItems: 'center' }}>
                      {product.images && product.images[0] && (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            objectFit: 'cover', 
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border-color)'
                          }}
                        />
                      )}
                      <span className="text-bold">{product.name}</span>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>
                    <span className="badge badge-warning">
                      {product.stock} left
                    </span>
                  </td>
                  <td className="text-bold">${product.price?.toFixed(2) || 'N/A'}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        onClick={() => navigate(`/EditProduct/${product._id}`)}
                        className="btn btn-sm btn-primary"
                        title="Restock Product"
                      >
                        <FontAwesomeIcon icon={faBox} /> Restock
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default LowStockProducts;
