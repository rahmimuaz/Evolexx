import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './EditProduct.css';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    longDescription: '',
    stock: '',
    details: {},
    images: [],
    warrantyPeriod: 'No Warranty',
    discountPrice: '',
    kokoPay: false
  });

  const [newImages, setNewImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [discountError, setDiscountError] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const categories = [
    'Mobile Phone',
    'Mobile Accessories',
    'Preowned Phones',
    'Laptops',
    'Phone Covers',
    'Chargers'
  ];

  const categoryFields = {
    'Mobile Phone': [
      { name: 'brand', label: 'Brand' },
      { name: 'model', label: 'Model' },
      { name: 'storage', label: 'Storage' },
      { name: 'ram', label: 'RAM' },
      { name: 'color', label: 'Color' },
      { name: 'screenSize', label: 'Screen Size' },
      { name: 'batteryCapacity', label: 'Battery Capacity' },
      { name: 'processor', label: 'Processor' },
      { name: 'camera', label: 'Camera' },
      { name: 'operatingSystem', label: 'Operating System' }
    ],
    'Mobile Accessories': [
      { name: 'brand', label: 'Brand' },
      { name: 'type', label: 'Type' },
      { name: 'compatibility', label: 'Compatibility' },
      { name: 'color', label: 'Color' },
      { name: 'material', label: 'Material' }
    ],
    'Preowned Phones': [
      { name: 'brand', label: 'Brand' },
      { name: 'model', label: 'Model' },
      { name: 'condition', label: 'Condition' },
      { name: 'storage', label: 'Storage' },
      { name: 'ram', label: 'RAM' },
      { name: 'color', label: 'Color' },
      { name: 'batteryHealth', label: 'Battery Health' },
      { name: 'warranty', label: 'Warranty' }
    ],
    'Laptops': [
      { name: 'brand', label: 'Brand' },
      { name: 'model', label: 'Model' },
      { name: 'processor', label: 'Processor' },
      { name: 'ram', label: 'RAM' },
      { name: 'storage', label: 'Storage' },
      { name: 'display', label: 'Display' },
      { name: 'graphics', label: 'Graphics' },
      { name: 'operatingSystem', label: 'Operating System' }
    ]
  };

  const fetchProduct = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/${id}`);
      const product = response.data;
      setFormData(product);

      const previewList = product.images.map(img => {
        return img.startsWith('http') ? img : `${API_BASE_URL}/${img.replace(/^\//, '')}`;
      });
      setPreviewUrls(previewList);
      setLoading(false);
    } catch (err) {
      setError('Failed to load product');
      setLoading(false);
      console.error("Error fetching product:", err);
    }
  }, [id, API_BASE_URL]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => {
      let newState = { ...prev };

      if (name === 'category') {
        newState.details = {};
      }

      newState[name] = type === 'checkbox' ? checked : value;

      if (name === 'discountPrice' && value && Number(value) > Number(newState.price)) {
        setDiscountError('Discount/Offer price cannot be greater than Price.');
      } else if (name === 'price' && newState.discountPrice && Number(newState.discountPrice) > Number(value)) {
        setDiscountError('Discount/Offer price cannot be greater than Price.');
      } else {
        setDiscountError('');
      }

      return newState;
    });
  };

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [name]: value
      }
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalCurrentImages = formData.images.length + newImages.length;
    const maxImages = 5;

    if (totalCurrentImages >= maxImages) {
      alert(`You have reached the maximum of ${maxImages} images.`);
      return;
    }

    const filesToAdd = Math.min(files.length, maxImages - totalCurrentImages);
    if (filesToAdd < files.length) {
      alert(`Only ${maxImages - totalCurrentImages} more image(s) can be added.`);
    }

    const validFiles = files.slice(0, filesToAdd);
    setNewImages(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...validFiles.map(file => URL.createObjectURL(file))]);
  };

  const removeImage = (index) => {
    const totalExisting = formData.images.length;
    const updatedPreviewUrls = [...previewUrls];

    if (index < totalExisting) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    } else {
      const newImageIndex = index - totalExisting;
      setNewImages(prev => prev.filter((_, i) => i !== newImageIndex));
      URL.revokeObjectURL(updatedPreviewUrls[index]);
    }
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.discountPrice && Number(formData.discountPrice) > Number(formData.price)) {
      alert('Discount/Offer price cannot be greater than Price.');
      return;
    }

    const formDataToSend = new FormData();

    formDataToSend.append('name', formData.name);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('price', formData.price);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('longDescription', formData.longDescription);
    formDataToSend.append('stock', formData.stock);
    formDataToSend.append('warrantyPeriod', formData.warrantyPeriod);
    formDataToSend.append('discountPrice', formData.discountPrice);
    formDataToSend.append('kokoPay', formData.kokoPay);

    formDataToSend.append('details', JSON.stringify(formData.details));

    formDataToSend.append('existingImages', JSON.stringify(formData.images));

    newImages.forEach(file => {
      formDataToSend.append('images', file);
    });

    try {
      await axios.put(`${API_BASE_URL}/api/products/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Product updated successfully!');
      navigate('/admin/products');
    } catch (err) {
      console.error('Update failed:', err.response?.data || err.message);
      alert('Error updating product. Please try again.');
    }
  };

  // Memoize the SimpleMDE options to prevent re-renders
  const mdeOptions = useMemo(() => ({
    placeholder: 'Enter a more detailed description (supports Markdown formatting)'
  }), []);

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
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="form-select"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
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
          <div className="form-field" style={{ marginTop: '1rem' }}>
            <label className="form-label">Long Description</label>
            <SimpleMDE
              value={formData.longDescription}
              onChange={value => setFormData(prev => ({ ...prev, longDescription: value }))}
              options={mdeOptions}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Warranty Period</label>
            <select
              name="warrantyPeriod"
              value={formData.warrantyPeriod}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="No Warranty">No Warranty</option>
              <option value="6 months">6 months</option>
              <option value="1 year">1 year</option>
              <option value="2 years">2 years</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Discount/Offer Price</label>
            <input
              type="number"
              name="discountPrice"
              value={formData.discountPrice}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter offer price (optional)"
              min="0"
            />
            {discountError && <div className="error-message" style={{ color: 'red', fontSize: '0.9em' }}>{discountError}</div>}
          </div>
          <div className="form-field">
            <label className="form-label">
              <input
                type="checkbox"
                name="kokoPay"
                checked={formData.kokoPay}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              Enable KOKO Pay (3 installments)
            </label>
          </div>
        </div>

        {formData.category && (
          <div className="edit-product-form-section">
            <h2 className="section-title">Product Details</h2>
            <div className="form-grid">
              {categoryFields[formData.category]?.map(field => (
                <div key={field.name} className="form-field">
                  <label className="form-label">{field.label}</label>
                  {field.name === 'color' ? (
                    <>
                      <input
                        type="text"
                        name="color"
                        value={Array.isArray(formData.details.color) ? formData.details.color.join(', ') : (formData.details.color || '')}
                        onChange={e => {
                          const value = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            details: {
                              ...prev.details,
                              color: value.split(',').map(c => c.trim()).filter(Boolean)
                            }
                          }));
                        }}
                        required
                        className="form-input"
                        placeholder="e.g. Red, Black, Gray"
                      />
                      <small>Enter multiple colors separated by commas</small>
                    </>
                  ) : (
                    <input
                      type="text"
                      name={field.name}
                      value={formData.details[field.name] || ''}
                      onChange={handleDetailChange}
                      required
                      className="form-input"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
            <label className="form-label">Add New Images (Max 5 total)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="file-input"
              disabled={formData.images.length + newImages.length >= 5}
            />
             {formData.images.length + newImages.length >= 5 && (
                <p className="text-red-500 text-sm mt-1">Maximum 5 images allowed.</p>
              )}
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