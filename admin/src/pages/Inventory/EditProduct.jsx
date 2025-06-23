import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './EditProduct.css';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    stock: '',
    details: {},
    images: []
  });

  const [newImages, setNewImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProduct = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/products/${id}`);
      const product = response.data;
      setFormData(product);

      const previewList = product.images.map(img => {
        if (img.startsWith('http')) {
          return img;
        } else {
          return `http://localhost:5001/${img.replace(/^\//, '')}`;
        }
      });
      setPreviewUrls(previewList);
      setLoading(false);
    } catch (err) {
      setError('Failed to load product');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalCurrentImages = formData.images.length + newImages.length;
    const filesToAdd = Math.min(files.length, 5 - totalCurrentImages);

    if (filesToAdd < files.length) {
      alert(`You can only add ${5 - totalCurrentImages} more image(s).`);
    }

    const validFiles = files.slice(0, filesToAdd);

    setNewImages(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...validFiles.map(file => URL.createObjectURL(file))]);
  };

  const removeImage = (index) => {
    const totalExisting = formData.images.length;

    if (index < totalExisting) {
      // It's an existing image
      const updatedImages = [...formData.images];
      updatedImages.splice(index, 1);
      setFormData(prev => ({ ...prev, images: updatedImages }));
    } else {
      // It's a newly added image
      const newImageIndex = index - totalExisting;
      const updatedNewImages = [...newImages];
      updatedNewImages.splice(newImageIndex, 1);
      setNewImages(updatedNewImages);
    }

    // Remove from preview URLs regardless of whether it's existing or new
    const updatedPreviews = [...previewUrls];
    updatedPreviews.splice(index, 1);
    setPreviewUrls(updatedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('price', formData.price);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('stock', formData.stock);
    formDataToSend.append('details', JSON.stringify(formData.details));
    formDataToSend.append('existingImages', JSON.stringify(formData.images)); // Send existing image URLs

    newImages.forEach(file => {
      formDataToSend.append('images', file); // Append new image files
    });

    try {
      await axios.put(`http://localhost:5001/api/products/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Product updated successfully!');
      navigate('/Products');
    } catch (err) {
      console.error('Update failed:', err);
      alert('Error updating product');
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="edit-product-container">
      <h1 className="edit-product-title">Edit Product</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="edit-product-form-section">
          <h2 className="section-title">Basic Information</h2>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
          </div>
          <div className="form-field" style={{ marginTop: '1rem' }}>
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows="4"
              className="form-textarea"
            />
          </div>
        </div>

        <div className="edit-product-form-section">
          <h2 className="section-title">Product Images</h2>
          <div className="image-preview-grid">
            {previewUrls.map((url, index) => (
              <div key={index} className="image-preview-item group">
                <img src={url} alt={`Image ${index}`} className="image-preview-img" />
                <button type="button" onClick={() => removeImage(index)} className="remove-image-button">
                  &times;
                </button>
              </div>
            ))}
          </div>
          <div className="form-field">
            <label className="form-label">Add New Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="file-input"
            />
          </div>
        </div>

        <div className="submit-button-container">
          <button type="submit" className="submit-button">
            Update Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;