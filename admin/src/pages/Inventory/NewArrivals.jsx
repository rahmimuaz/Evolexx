import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NewArrivals = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [allRes, newArrivalsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/products`),
        axios.get(`${API_BASE_URL}/api/products/new-arrivals`)
      ]);
      setAllProducts(allRes.data);
      setNewArrivals(newArrivalsRes.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNewArrival = async (productId) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/products/${productId}/toggle-new-arrival`);
      fetchProducts(); // Refresh data
    } catch (err) {
      console.error('Error toggling new arrival:', err);
      alert('Error updating product');
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newList = [...newArrivals];
    const draggedProduct = newList[draggedItem];
    newList.splice(draggedItem, 1);
    newList.splice(index, 0, draggedProduct);
    setNewArrivals(newList);
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSaveOrder = async () => {
    try {
      setSaving(true);
      const orderedProducts = newArrivals.map((product, index) => ({
        id: product._id,
        newArrivalOrder: index + 1
      }));
      await axios.put(`${API_BASE_URL}/api/products/new-arrivals/order`, { orderedProducts });
      alert('Order saved successfully!');
    } catch (err) {
      console.error('Error saving order:', err);
      alert('Error saving order');
    } finally {
      setSaving(false);
    }
  };

  // Filter products that are NOT in new arrivals
  const availableProducts = allProducts.filter(
    product => !product.isNewArrival && 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h1 className="page-title">New Arrivals</h1>
            <p className="page-subtitle">Manage products shown in the New Arrivals section</p>
          </div>
          {newArrivals.length > 0 && (
            <button 
              onClick={handleSaveOrder}
              disabled={saving}
              className="btn btn-primary"
              style={{ background: '#22c55e', border: 'none' }}
            >
              {saving ? 'Saving...' : 'Save Order'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Current New Arrivals */}
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#0f172a' }}>
            Current New Arrivals ({newArrivals.length})
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
            Drag to reorder. Changes are saved when you click "Save Order".
          </p>
          
          <div style={{ 
            background: '#f8fafc', 
            borderRadius: '0.75rem', 
            padding: '1rem',
            minHeight: '400px',
            border: '2px dashed #e2e8f0'
          }}>
            {newArrivals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                <p>No new arrivals yet</p>
                <p style={{ fontSize: '0.875rem' }}>Add products from the right panel</p>
              </div>
            ) : (
              newArrivals.map((product, index) => (
                <div
                  key={product._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                    marginBottom: '0.5rem',
                    cursor: 'grab',
                    border: draggedItem === index ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    boxShadow: draggedItem === index ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: '#64748b',
                    minWidth: '24px'
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ fontSize: '1.25rem', cursor: 'grab' }}>⋮⋮</span>
                  {product.images?.[0] && (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        objectFit: 'cover', 
                        borderRadius: '0.375rem' 
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '500', color: '#0f172a', fontSize: '0.875rem' }}>
                      {product.name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Rs. {product.discountPrice?.toLocaleString() || product.price?.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleNewArrival(product._id)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      borderRadius: '0.375rem',
                      border: 'none',
                      background: '#ef4444',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Available Products */}
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#0f172a' }}>
            Available Products ({availableProducts.length})
          </h2>
          
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ marginBottom: '1rem' }}
          />
          
          <div style={{ 
            background: '#fff', 
            borderRadius: '0.75rem', 
            border: '1px solid #e2e8f0',
            maxHeight: '500px',
            overflowY: 'auto'
          }}>
            {availableProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <p>No products found</p>
              </div>
            ) : (
              availableProducts.map((product) => (
                <div
                  key={product._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid #f1f5f9'
                  }}
                >
                  {product.images?.[0] && (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        objectFit: 'cover', 
                        borderRadius: '0.375rem' 
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '500', color: '#0f172a', fontSize: '0.875rem' }}>
                      {product.name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {product.category} • Rs. {product.discountPrice?.toLocaleString() || product.price?.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleNewArrival(product._id)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      borderRadius: '0.375rem',
                      border: 'none',
                      background: '#22c55e',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewArrivals;

