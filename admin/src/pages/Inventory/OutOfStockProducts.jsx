import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const OutOfStockProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5001/api/products/admin/out-of-stock')
      .then(res => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="products-container">
      <h1 className="products-title">Out of Stock Products</h1>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>Back</button>
      {loading ? <p>Loading...</p> : (
        <table className="products-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>{product.stock}</td>
                <td>
                  <button onClick={() => navigate(`/admin/products/edit/${product._id}`)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OutOfStockProducts; 