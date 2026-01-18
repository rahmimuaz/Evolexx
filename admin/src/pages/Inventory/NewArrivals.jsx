import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';

const NewArrivals = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [toggleAvailable, setToggleAvailable] = useState(true); // Whether the toggle endpoint is available on the server

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const productsUrl = API_BASE_URL ? `${API_BASE_URL}/api/products` : '/api/products';
      const newArrivalsUrl = API_BASE_URL ? `${API_BASE_URL}/api/products/new-arrivals` : '/api/products/new-arrivals';

      const [allResult, newArrivalsResult] = await Promise.allSettled([
        axios.get(productsUrl),
        axios.get(newArrivalsUrl)
      ]);

      // Handle all products response
      if (allResult.status === 'fulfilled') {
        setAllProducts(allResult.value.data);
      } else {
        setError('Error fetching products');
        setLoading(false);
        return;
      }

      // Handle new arrivals response; if the endpoint is missing (404) fall back to filtering
      if (newArrivalsResult.status === 'fulfilled') {
        setNewArrivals(newArrivalsResult.value.data);
      } else {
        if (newArrivalsResult.reason?.response?.status === 404) {
          // Fall back to deriving new arrivals from all products
          const fallback = Array.isArray(allResult.value?.data)
            ? allResult.value.data.filter(p => p.isNewArrival)
            : [];
          setNewArrivals(fallback);
        } else {
          setError('Error fetching new arrivals');
        }
      }

    } catch (err) {
      setError('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNewArrival = async (productId) => {
    try {
      const patchUrl = API_BASE_URL ? `${API_BASE_URL}/api/products/${productId}/toggle-new-arrival` : `/api/products/${productId}/toggle-new-arrival`;
      await axios.patch(patchUrl);
      fetchProducts(); // Refresh data
    } catch (err) {
      // If the endpoint does not exist on the server, surface a clear UI message and disable future toggles
      if (err?.response?.status === 404 && err?.response?.data?.message === 'Route not found') {
        setToggleAvailable(false);
        setError('Toggle endpoint unavailable on remote server. Actions are disabled until the backend is redeployed.');
        alert('Toggle endpoint unavailable on server. Please redeploy backend.');
        return;
      }

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
              {saving ? (
                <>
                  <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', marginRight: '8px', display: 'inline-block' }}></div>
                  Saving...
                </>
              ) : 'Save Order'}
            </button>
          )}
          {/* Show warning if toggle endpoint is not available on server */}
          {!toggleAvailable && (
            <div style={{ marginTop: '0.75rem', color: '#92400e', background: '#fff7ed', padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}>
              <strong>Notice:</strong> Toggle endpoint is not available on the deployed server. Toggle actions are disabled until the backend is redeployed.
            </div>
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
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}><FontAwesomeIcon icon={faStar} /></div>
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

