import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductOrder = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/products/sorted`);
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    // Work directly with the products array
    const newList = [...products];
    const draggedProduct = newList[draggedItem];
    newList.splice(draggedItem, 1);
    newList.splice(index, 0, draggedProduct);
    
    setProducts(newList);
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSaveOrder = async () => {
    try {
      setSaving(true);
      const orderedProducts = products.map((product, index) => ({
        id: product._id,
        displayOrder: index + 1
      }));
      await axios.put(`${API_BASE_URL}/api/products/order`, { orderedProducts });
      alert('Product order saved successfully!');
    } catch (err) {
      console.error('Error saving order:', err);
      alert('Error saving order');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <div>
            <h1 className="page-title">Product Display Order</h1>
            <p className="page-subtitle">Drag and drop to reorder how products appear on the website</p>
          </div>
          <button 
            onClick={handleSaveOrder}
            disabled={saving}
            className="btn btn-primary"
            style={{ background: '#22c55e', border: 'none' }}
          >
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>

      {/* Products List */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '0.75rem', 
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '60px 60px 1fr 150px 100px 100px',
          gap: '1rem',
          padding: '1rem',
          background: '#f8fafc',
          fontWeight: '600',
          fontSize: '0.875rem',
          color: '#64748b',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <span>Order</span>
          <span>Image</span>
          <span>Product</span>
          <span>Category</span>
          <span>Price</span>
          <span>Stock</span>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <p>No products found</p>
          </div>
        ) : (
          products.map((product, index) => (
            <div
              key={product._id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 60px 1fr 150px 100px 100px',
                gap: '1rem',
                padding: '1rem',
                alignItems: 'center',
                cursor: 'grab',
                borderBottom: '1px solid #f1f5f9',
                background: draggedItem === index ? '#f0f9ff' : 'white',
                border: draggedItem === index ? '2px solid #3b82f6' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem', color: '#94a3b8' }}>⋮⋮</span>
                <span style={{ fontWeight: '600', color: '#64748b' }}>{index + 1}</span>
              </div>
              
              {product.images?.[0] ? (
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  style={{ 
                    width: '45px', 
                    height: '45px', 
                    objectFit: 'cover', 
                    borderRadius: '0.375rem',
                    border: '1px solid #e2e8f0'
                  }}
                />
              ) : (
                <div style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '0.375rem',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>📦</div>
              )}
              
              <div>
                <p style={{ fontWeight: '500', color: '#0f172a', marginBottom: '0.25rem' }}>
                  {product.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  ID: {product.productId}
                </p>
              </div>
              
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                {product.category}
              </span>
              
              <span style={{ fontWeight: '600', color: '#0f172a' }}>
                Rs. {(product.discountPrice || product.price)?.toLocaleString()}
              </span>
              
              <span style={{ 
                fontWeight: '500', 
                color: product.stock === 0 ? '#ef4444' : product.stock < 5 ? '#f59e0b' : '#22c55e'
              }}>
                {product.stock}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
        Showing {products.length} products • Drag rows to reorder
      </div>
    </div>
  );
};

export default ProductOrder;

