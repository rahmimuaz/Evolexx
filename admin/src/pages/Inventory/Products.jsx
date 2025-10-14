import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products`);
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (productId) => {
    navigate(`/EditProduct/${productId}`);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/products/${productId}`);
      setProducts(prev => prev.filter(p => p._id !== productId));
    } catch (err) {
      console.error("Error deleting product:", err);
      alert('Error deleting product. Please try again.');
    }
  };

  const getStockBadge = (stock) => {
    if (stock === 0) {
      return <span className="badge badge-error">Out of Stock</span>;
    } else if (stock < 5) {
      return <span className="badge badge-warning">Low Stock ({stock})</span>;
    }
    return <span className="badge badge-success">{stock} in stock</span>;
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.productId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(products.map(p => p.category))];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading Products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Page Header with Search & Filters */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 className="page-title">Products</h1>
            <p className="page-subtitle">{products.length} total products</p>
          </div>
          <button 
            onClick={() => navigate('/AddProduct')} 
            className="btn btn-primary"
            style={{ 
              background: '#0f172a',
              border: 'none'
            }}
          >
            Add Product
          </button>
        </div>

        {/* Search and Filters Row */}
        <div className="flex gap-3" style={{ alignItems: 'flex-end' }}>
          <div style={{ flex: '1', maxWidth: '400px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>

          <div style={{ flex: '0 0 200px' }}>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Image</th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th style={{ width: '200px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <div className="empty-state-title">No products found</div>
                    <div className="empty-state-text">
                      {searchTerm || categoryFilter !== 'all' 
                        ? 'Try adjusting your filters' 
                        : 'Start by adding your first product'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td>
                    {product.images && product.images[0] ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        style={{ 
                          width: '45px', 
                          height: '45px', 
                          objectFit: 'cover', 
                          borderRadius: '0.5rem',
                          border: '1px solid #e2e8f0'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '0.5rem',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        border: '1px solid #e2e8f0'
                      }}>
                        📦
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>{product.name}</span>
                      <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>ID: {product.productId}</span>
                    </div>
                  </td>
                  <td style={{ color: '#64748b' }}>{product.category}</td>
                  <td style={{ fontWeight: '600', color: '#0f172a' }}>
                    LKR {product.price?.toLocaleString() || 'N/A'}
                    {product.discountPrice && (
                      <div style={{ fontSize: '0.8125rem', color: '#22c55e', fontWeight: '500' }}>
                        LKR {product.discountPrice.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: '600', color: product.stock === 0 ? '#ef4444' : product.stock < 5 ? '#f59e0b' : '#0f172a' }}>
                    {product.stock}
                  </td>
                  <td>
                    {product.stock === 0 ? (
                      <span className="badge badge-error">Out of Stock</span>
                    ) : product.stock < 5 ? (
                      <span className="badge badge-warning">Low Stock</span>
                    ) : (
                      <span className="badge badge-success">In Stock</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '0.625rem' }}>
                      <button
                        onClick={() => handleEdit(product._id)}
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          borderRadius: '0.375rem',
                          border: 'none',
                          background: '#3b82f6',
                          color: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#2563eb'}
                        onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          borderRadius: '0.375rem',
                          border: 'none',
                          background: '#ef4444',
                          color: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#dc2626'}
                        onMouseOut={(e) => e.target.style.background = '#ef4444'}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      {filteredProducts.length > 0 && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
          Showing {filteredProducts.length} of {products.length} products
        </div>
      )}
    </div>
  );
};

export default Products;

