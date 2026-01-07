import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import './EditProduct.css';

// Hierarchical categories structure - moved outside component to prevent recreation
const categoryHierarchy = {
  'Electronics': ['Mobile Phone', 'Laptops', 'Tablets', 'Smartwatches'],
  'Mobile Accessories': ['Chargers', 'Phone Covers', 'Screen Protectors', 'Cables', 'Headphones', 'Earbuds', 'Other Accessories'],
  'Pre-owned Devices': ['Preowned Phones', 'Preowned Laptops', 'Preowned Tablets'],
  'Other': []
};

const categories = Object.keys(categoryHierarchy);

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    brand: '',
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

  const [customSpecs, setCustomSpecs] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [imageKeys, setImageKeys] = useState([]); // Track unique keys for each image
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [discountError, setDiscountError] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const categoryFields = {
    'Mobile Phone': [
      { name: 'model', label: 'Model', type: 'text' },
      { name: 'storage', label: 'Storage', type: 'select', options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
      { name: 'ram', label: 'RAM', type: 'select', options: ['4GB', '6GB', '8GB', '12GB', '16GB'] },
      { name: 'color', label: 'Color', type: 'text' },
      { name: 'screenSize', label: 'Screen Size', type: 'text', placeholder: 'e.g., 6.1 inches' },
      { name: 'batteryCapacity', label: 'Battery Capacity', type: 'text', placeholder: 'e.g., 4500mAh' },
      { name: 'processor', label: 'Processor', type: 'text' },
      { name: 'camera', label: 'Camera', type: 'text', placeholder: 'e.g., 48MP + 12MP' },
      { name: 'operatingSystem', label: 'Operating System', type: 'select', options: ['iOS', 'Android', 'HarmonyOS'] }
    ],
    'Smartwatches': [
      { name: 'model', label: 'Model', type: 'text' },
      { name: 'screenType', label: 'Screen Type', type: 'select', options: ['AMOLED', 'LCD', 'OLED', 'Retina'] },
      { name: 'caseMaterial', label: 'Case Material', type: 'select', options: ['Aluminum', 'Stainless Steel', 'Titanium', 'Plastic'] },
      { name: 'heartRateMonitor', label: 'Heart Rate Monitor', type: 'toggle' },
      { name: 'waterResistance', label: 'Water Resistance', type: 'text', placeholder: 'e.g., 50 meters' },
      { name: 'batteryLife', label: 'Battery Life', type: 'text', placeholder: 'e.g., 7 days' },
      { name: 'operatingSystem', label: 'Operating System', type: 'text', placeholder: 'e.g., WatchOS, Wear OS' }
    ],
    'Chargers': [
      { name: 'type', label: 'Charger Type', type: 'select', options: ['Wall Charger', 'Car Charger', 'Wireless Charger', 'Power Bank'] },
      { name: 'wattage', label: 'Wattage', type: 'text', placeholder: 'e.g., 20W' },
      { name: 'compatibility', label: 'Compatibility', type: 'text', placeholder: 'e.g., iPhone, Android' },
      { name: 'color', label: 'Color', type: 'text' },
      { name: 'cableLength', label: 'Cable Length', type: 'text', placeholder: 'e.g., 1 meter' },
      { name: 'material', label: 'Material', type: 'text' }
    ],
    'Phone Covers': [
      { name: 'type', label: 'Cover Type', type: 'select', options: ['Silicone Case', 'Hard Case', 'Leather Case', 'Flip Case'] },
      { name: 'compatibility', label: 'Compatibility', type: 'text', placeholder: 'e.g., iPhone 14 Pro' },
      { name: 'color', label: 'Color', type: 'text' },
      { name: 'material', label: 'Material', type: 'text' }
    ],
    'Preowned Phones': [
      { name: 'model', label: 'Model', type: 'text' },
      { name: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
      { name: 'storage', label: 'Storage', type: 'select', options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
      { name: 'ram', label: 'RAM', type: 'select', options: ['4GB', '6GB', '8GB', '12GB', '16GB'] },
      { name: 'color', label: 'Color', type: 'text' },
      { name: 'batteryHealth', label: 'Battery Health', type: 'text', placeholder: 'e.g., 85%' },
      { name: 'warranty', label: 'Warranty', type: 'text' }
    ],
    'Laptops': [
      { name: 'model', label: 'Model', type: 'text' },
      { name: 'processor', label: 'Processor', type: 'text', placeholder: 'e.g., Intel i7 13th Gen' },
      { name: 'ram', label: 'RAM', type: 'select', options: ['8GB', '16GB', '32GB', '64GB'] },
      { name: 'storage', label: 'Storage', type: 'text', placeholder: 'e.g., 512GB SSD' },
      { name: 'display', label: 'Display', type: 'text', placeholder: 'e.g., 15.6" FHD' },
      { name: 'graphics', label: 'Graphics', type: 'text', placeholder: 'e.g., NVIDIA RTX 3060' },
      { name: 'operatingSystem', label: 'Operating System', type: 'select', options: ['Windows 11', 'macOS', 'Linux', 'Chrome OS'] }
    ]
  };

  const brandOptions = {
    'Mobile Phone': ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo', 'Huawei', 'Nokia', 'Motorola', 'Other'],
    'Smartwatches': ['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Amazfit', 'Huawei', 'Fossil', 'TicWatch', 'Other'],
    'Laptops': ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Razer', 'Microsoft', 'Other'],
    'Chargers': ['Anker', 'Belkin', 'Samsung', 'Apple', 'RAVPower', 'Aukey', 'Other'],
    'Phone Covers': ['Spigen', 'OtterBox', 'Case-Mate', 'UAG', 'Ringke', 'Other'],
    'Preowned Phones': ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Other'],
    'Headphones': ['Sony', 'Bose', 'Apple', 'Samsung', 'JBL', 'Sennheiser', 'Audio-Technica', 'Beats', 'Skullcandy', 'Anker', 'Other'],
    'Earbuds': ['Apple', 'Samsung', 'Sony', 'JBL', 'Jabra', 'Beats', 'Anker', 'Xiaomi', 'OnePlus', 'Nothing', 'Other'],
    'Screen Protectors': ['Spigen', 'ESR', 'ZAGG', 'amFilm', 'JETech', 'Belkin', 'Other'],
    'Cables': ['Anker', 'Belkin', 'Apple', 'Samsung', 'Baseus', 'Ugreen', 'Native Union', 'Other'],
    'Other Accessories': ['Anker', 'Belkin', 'Spigen', 'PopSockets', 'Other'],
    'Tablets': ['Apple', 'Samsung', 'Microsoft', 'Lenovo', 'Amazon', 'Huawei', 'Other'],
    'Preowned Laptops': ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Other'],
    'Preowned Tablets': ['Apple', 'Samsung', 'Microsoft', 'Lenovo', 'Other']
  };

  // Extract custom specs from details when product is loaded
  const extractCustomSpecs = (details) => {
    if (!details) return [];
    
    const standardFields = new Set([
      'brand', 'model', 'storage', 'ram', 'color', 'screenSize', 'batteryCapacity',
      'processor', 'camera', 'operatingSystem', 'type', 'compatibility', 'material',
      'condition', 'batteryHealth', 'warranty', 'display', 'graphics', 'screenType',
      'caseMaterial', 'heartRateMonitor', 'waterResistance', 'batteryLife', 'wattage',
      'cableLength'
    ]);

    const customSpecsList = [];
    Object.entries(details).forEach(([key, value]) => {
      if (!standardFields.has(key) && key !== 'brand') {
        const parts = String(value).split(' ');
        const hasUnit = parts.length > 1;
        customSpecsList.push({
          id: Date.now() + Math.random(),
          name: key,
          value: hasUnit ? parts.slice(0, -1).join(' ') : value,
          unit: hasUnit ? parts[parts.length - 1] : ''
        });
      }
    });

    return customSpecsList;
  };

  const fetchProduct = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/${id}`);
      const product = response.data;
      
      // Determine main category and subcategory
      // Check if the product category is a main category first
      let mainCategory = '';
      let subCategory = '';
      
      // Check if product category is a main category
      const mainCategories = Object.keys(categoryHierarchy);
      if (mainCategories.includes(product.category)) {
        // Product was saved with a main category
        mainCategory = product.category;
        subCategory = ''; // No subcategory for main categories
      } else {
        // Product was saved with a subcategory, find the main category
        for (const [main, subs] of Object.entries(categoryHierarchy)) {
          if (subs.includes(product.category)) {
            mainCategory = main;
            subCategory = product.category;
            break;
          }
        }
        // If not found in hierarchy, it might be a legacy category
        if (!mainCategory) {
          mainCategory = product.category;
          subCategory = '';
        }
      }

      // Store original image URLs (as they are in the database)
      const originalImages = product.images || [];
      
      setFormData({
        ...product,
        category: mainCategory || product.category,
        subcategory: subCategory,
        brand: product.details?.brand || '',
        kokoPay: product.kokoPay || false,
        images: originalImages // Store original URLs exactly as they are in DB
      });

      // Extract custom specifications
      const customSpecsFromDetails = extractCustomSpecs(product.details);
      setCustomSpecs(customSpecsFromDetails);

      // Create preview URLs for display (add API_BASE_URL prefix if needed)
      const previewList = originalImages.map(img => {
        if (img.startsWith('http')) {
          return img; // Already a full URL (Cloudinary)
        } else {
          return `${API_BASE_URL}/${img.replace(/^\//, '')}`; // Add base URL for relative paths
        }
      });
      setPreviewUrls(previewList);
      
      // Create unique keys for each image (use image URL as key for existing, timestamp for new)
      const keys = originalImages.map((img, idx) => `existing-${idx}-${img}`);
      setImageKeys(keys);
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
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      };
      return updated;
    });

    if (name === 'discountPrice') {
      if (value && Number(value) > Number(formData.price)) {
        setDiscountError('Discount/Offer price cannot be greater than Price.');
      } else {
        setDiscountError('');
      }
    }
    if (name === 'price' && formData.discountPrice) {
      if (Number(formData.discountPrice) > Number(value)) {
        setDiscountError('Discount/Offer price cannot be greater than Price.');
      } else {
        setDiscountError('');
      }
    }

    // Reset subcategory when main category changes (only if category actually changed)
    if (name === 'category' && value !== formData.category) {
      setFormData(prev => ({ 
        ...prev, 
        subcategory: ''
        // Don't reset details - preserve all existing details when category changes
      }));
    }
  };

  const handleDetailChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  // Custom specifications handlers
  const addCustomSpec = () => {
    setCustomSpecs(prev => [...prev, { id: Date.now(), name: '', value: '', unit: '' }]);
  };

  const removeCustomSpec = (id) => {
    setCustomSpecs(prev => prev.filter(spec => spec.id !== id));
  };

  const updateCustomSpec = (id, field, value) => {
    setCustomSpecs(prev => prev.map(spec => 
      spec.id === id ? { ...spec, [field]: value } : spec
    ));
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

    const newFiles = [...validFiles];
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    const newKeys = newFiles.map((file, idx) => `new-${Date.now()}-${idx}-${file.name}`);
    
    setNewImages(prev => [...prev, ...newFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    setImageKeys(prev => [...prev, ...newKeys]);
  };

  const removeImage = (index) => {
    const totalExisting = formData.images.length;

    if (index < totalExisting) {
      // Remove existing image from database
      const updatedExistingImages = formData.images.filter((_, i) => i !== index);
      
      // Remove corresponding preview URL and key
      const updatedPreviews = previewUrls.filter((_, i) => i !== index);
      const updatedKeys = imageKeys.filter((_, i) => i !== index);
      
      // Update all states
      setFormData(prev => ({ ...prev, images: updatedExistingImages }));
      setPreviewUrls(updatedPreviews);
      setImageKeys(updatedKeys);
    } else {
      // Remove new image (not yet uploaded)
      const newImageIndex = index - totalExisting;
      const updatedNewImages = newImages.filter((_, i) => i !== newImageIndex);
      
      // Revoke blob URL before removing
      const urlToRevoke = previewUrls[index];
      if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
        URL.revokeObjectURL(urlToRevoke);
      }
      
      // Remove corresponding preview URL and key
      const updatedPreviews = previewUrls.filter((_, i) => i !== index);
      const updatedKeys = imageKeys.filter((_, i) => i !== index);
      
      // Update all states
      setNewImages(updatedNewImages);
      setPreviewUrls(updatedPreviews);
      setImageKeys(updatedKeys);
    }
  };

  const renderFieldByType = (field) => {
    const fieldValue = formData.details[field.name] || '';
    
    switch (field.type) {
      case 'select':
        return (
          <select
            name={field.name}
            value={fieldValue}
            onChange={handleDetailChange}
            className="modern-input"
          >
            <option value="">Select {field.label}</option>
            {field.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'toggle':
        return (
          <label className="toggle-switch">
            <input
              type="checkbox"
              name={field.name}
              checked={!!fieldValue}
              onChange={handleDetailChange}
              className="toggle-input"
            />
            <span className="toggle-slider"></span>
          </label>
        );
      
      default:
        return (
          <input
            type="text"
            name={field.name}
            value={fieldValue}
            onChange={handleDetailChange}
            className="modern-input"
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.discountPrice && Number(formData.discountPrice) > Number(formData.price)) {
      alert('Discount/Offer price cannot be greater than Price.');
      return;
    }

    // Validate that we have at least one image
    if (formData.images.length === 0 && newImages.length === 0) {
      alert('Product must have at least one image.');
      return;
    }

    // Validate total images count
    if (formData.images.length + newImages.length > 5) {
      alert('Product cannot have more than 5 images.');
      return;
    }

    try {
      // Merge custom specs into details
      const customSpecsObj = {};
      customSpecs.forEach(spec => {
        if (spec.name && spec.value) {
          customSpecsObj[spec.name] = spec.unit ? `${spec.value} ${spec.unit}` : spec.value;
        }
      });

      const combinedDetails = {
        ...formData.details,
        ...customSpecsObj
      };

      // Add brand to details
      if (formData.brand) {
        combinedDetails.brand = formData.brand;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      // Use main category for filtering (subcategory is not necessary for category filtering)
      formDataToSend.append('category', formData.category);
      formDataToSend.append('price', formData.price.toString());
      formDataToSend.append('description', formData.description);
      formDataToSend.append('longDescription', formData.longDescription || '');
      formDataToSend.append('warrantyPeriod', formData.warrantyPeriod);
      formDataToSend.append('discountPrice', formData.discountPrice || '');
      formDataToSend.append('stock', formData.stock.toString());
      formDataToSend.append('details', JSON.stringify(combinedDetails));
      formDataToSend.append('kokoPay', formData.kokoPay.toString());
      // Send existing images exactly as they are stored in formData.images
      // These are the original URLs from the database
      formDataToSend.append('existingImages', JSON.stringify(formData.images));
      
      console.log('Frontend - Sending existing images:', formData.images);
      console.log('Frontend - Sending new images count:', newImages.length);

      newImages.forEach(file => {
        formDataToSend.append('images', file);
      });

      const response = await axios.put(`${API_BASE_URL}/api/products/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data) {
        alert('Product updated successfully!');
        navigate('/Products');
      } else {
        throw new Error('No response data received');
      }
    } catch (err) {
      console.error('Update failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error updating product. Please try again.';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="loading-text">Loading product...</p>
      </div>
    );
  }
  
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="modern-edit-product-page">
      <div className="page-header">
        <h1 className="page-title">Edit Product</h1>
        <p className="page-subtitle">Update product information and specifications</p>
      </div>

      <div className="edit-content-wrapper">
        <form onSubmit={handleSubmit} className="edit-product-form">
          
          {/* Product Information Section */}
          <div className="form-section-card">
            <h2 className="form-section-title">Product Information</h2>
            <p className="form-section-subtitle">Update basic product details</p>

            <div className="form-section-content">
              <div className="form-field-group">
                <label className="modern-label">
                  Product Name <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="modern-input"
                  placeholder="Enter product name"
                />
              </div>

              <div className="form-row-2col">
                <div className="form-field-group">
                  <label className="modern-label">
                    Category <span className="required-star">*</span>
                  </label>
                  <div className="category-flow">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="modern-input category-select-first"
                    >
                      <option value="">Select main category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    
                    {formData.category && formData.category !== 'Other' && (
                      <>
                        <div className="category-arrow">→</div>
                        <select
                          name="subcategory"
                          value={formData.subcategory}
                          onChange={handleInputChange}
                          className="modern-input category-select-second"
                        >
                          <option value="">Select subcategory (optional)</option>
                          {categoryHierarchy[formData.category]?.map(subcat => (
                            <option key={subcat} value={subcat}>{subcat}</option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                  <small className="field-hint">
                    {formData.category === 'Other' 
                      ? 'No subcategory needed for "Other" category' 
                      : 'Subcategory is optional - main category is used for filtering'}
                  </small>
                </div>
              </div>

              {formData.category === 'Other' ? (
                <div className="form-field-group">
                  <label className="modern-label">
                    Brand <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    required
                    className="modern-input"
                    placeholder="Enter brand name"
                  />
                </div>
              ) : formData.subcategory && brandOptions[formData.subcategory] ? (
                <div className="form-field-group">
                  <label className="modern-label">
                    Brand <span className="required-star">*</span>
                  </label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    required
                    className="modern-input"
                  >
                    <option value="">Select brand</option>
                    {brandOptions[formData.subcategory]?.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="form-field-group">
                <label className="modern-label">
                  Short Description <span className="required-star">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="modern-textarea"
                  placeholder="Brief product description"
                />
              </div>

              <div className="form-field-group">
                <label className="modern-label">Long Description</label>
                <div className="rich-text-editor-wrapper">
                  <SimpleMDE
                    value={formData.longDescription || ''}
                    onChange={(value) => {
                      setFormData(prev => ({
                        ...prev,
                        longDescription: value
                      }));
                    }}
                    options={{
                      placeholder: 'Enter a detailed description of the product...',
                      spellChecker: false,
                      toolbar: [
                        'bold', 'italic', 'heading', '|',
                        'quote', 'unordered-list', 'ordered-list', '|',
                        'link', 'image', '|',
                        'preview', 'side-by-side', 'fullscreen', '|',
                        'guide'
                      ],
                      minHeight: '300px',
                      status: false,
                      autofocus: false
                    }}
                  />
                </div>
                <small style={{ display: 'block', marginTop: '0.5rem', color: '#64748b', fontSize: '0.8125rem' }}>
                  Use the toolbar above to format your text. Supports markdown formatting.
                </small>
              </div>
            </div>
          </div>

          {/* Specifications Section */}
          <div className="form-section-card">
            <h2 className="form-section-title">Specifications & Attributes</h2>
            <p className="form-section-subtitle">Update product-specific details</p>

            <div className="form-section-content">
              {formData.subcategory && categoryFields[formData.subcategory] ? (
                <>
                  <h3 className="subsection-title">
                    <span className="subsection-icon">⚙️</span>
                    Category-Specific Specifications
                  </h3>
                  <p className="subsection-hint">
                    These fields are automatically loaded based on your selected category: <strong>{formData.subcategory}</strong>
                  </p>

                  <div className="specs-grid">
                    {categoryFields[formData.subcategory].map(field => (
                      <div key={field.name} className="form-field-group">
                        <label className="modern-label">
                          {field.label}
                        </label>
                        {renderFieldByType(field)}
                      </div>
                    ))}
                  </div>
                </>
              ) : formData.category ? (
                <div className="empty-state">
                  <p>Subcategory-specific fields are optional. You can add custom specifications below or proceed without them.</p>
                  <p className="empty-state-hint">If you want category-specific fields, please select a subcategory above.</p>
                </div>
              ) : (
                <div className="empty-state">
                  <p>Please select a category to see category-specific fields</p>
                </div>
              )}

              {/* Custom Specifications */}
              <div className="custom-specs-section">
                <h3 className="subsection-title">
                  <span className="subsection-icon">➕</span>
                  Additional Specifications (Optional)
                </h3>
                <p className="subsection-hint">Add custom product specifications</p>

                <button
                  type="button"
                  onClick={addCustomSpec}
                  className="btn-add-spec"
                >
                  <span className="btn-icon">+</span> Add Custom Specification
                </button>

                {customSpecs.length > 0 && (
                  <div className="custom-specs-list">
                    {customSpecs.map(spec => (
                      <div key={spec.id} className="custom-spec-row">
                        <input
                          type="text"
                          value={spec.name}
                          onChange={(e) => updateCustomSpec(spec.id, 'name', e.target.value)}
                          placeholder="Specification Name"
                          className="spec-input spec-name"
                        />
                        <input
                          type="text"
                          value={spec.value}
                          onChange={(e) => updateCustomSpec(spec.id, 'value', e.target.value)}
                          placeholder="Value"
                          className="spec-input spec-value"
                        />
                        <input
                          type="text"
                          value={spec.unit}
                          onChange={(e) => updateCustomSpec(spec.id, 'unit', e.target.value)}
                          placeholder="Unit (optional)"
                          className="spec-input spec-unit"
                        />
                        <button
                          type="button"
                          onClick={() => removeCustomSpec(spec.id)}
                          className="btn-delete-spec"
                          title="Remove specification"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Stock Section */}
          <div className="form-section-card">
            <h2 className="form-section-title">Pricing & Stock</h2>
            <p className="form-section-subtitle">Update pricing and inventory</p>

            <div className="form-section-content">
              <div className="form-row-2col">
                <div className="form-field-group">
                  <label className="modern-label">
                    Regular Price <span className="required-star">*</span>
                  </label>
                  <div className="input-with-prefix">
                    <span className="input-prefix">LKR</span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      className="modern-input with-prefix"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="form-field-group">
                  <label className="modern-label">Discount/Sale Price</label>
                  <div className="input-with-prefix">
                    <span className="input-prefix">LKR</span>
                    <input
                      type="number"
                      name="discountPrice"
                      value={formData.discountPrice}
                      onChange={handleInputChange}
                      className="modern-input with-prefix"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {discountError && <span className="error-text">{discountError}</span>}
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-field-group">
                  <label className="modern-label">
                    Stock Quantity <span className="required-star">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    className="modern-input"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="form-field-group">
                  <label className="modern-label">Warranty Period</label>
                  <select
                    name="warrantyPeriod"
                    value={formData.warrantyPeriod}
                    onChange={handleInputChange}
                    className="modern-input"
                  >
                    <option value="No Warranty">No Warranty</option>
                    <option value="6 months">6 months</option>
                    <option value="1 year">1 year</option>
                    <option value="2 years">2 years</option>
                    <option value="3 years">3 years</option>
                  </select>
                </div>
              </div>

              <div className="form-field-group">
                <label className="modern-label checkbox-label">
                  <input
                    type="checkbox"
                    name="kokoPay"
                    checked={formData.kokoPay}
                    onChange={handleInputChange}
                    className="modern-checkbox"
                  />
                  <span className="checkbox-text">
                    Enable KOKO Pay (Allow customers to pay in 3 installments)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="form-section-card">
            <h2 className="form-section-title">Product Images</h2>
            <p className="form-section-subtitle">Manage product images (1-5 images)</p>

            <div className="form-section-content">
              {previewUrls.length > 0 && (
                <div className="images-grid">
                  {previewUrls.map((url, index) => (
                    <div key={imageKeys[index] || `img-${index}`} className="image-card">
                      <img src={url} alt={`Preview ${index + 1}`} className="preview-image" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="image-remove-btn"
                      >
                        ×
                      </button>
                      {index === 0 && <span className="primary-badge">Primary</span>}
                    </div>
                  ))}
                </div>
              )}

              <div className="image-upload-zone">
                <label className="upload-area">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="upload-input-hidden"
                    disabled={formData.images.length + newImages.length >= 5}
                  />
                  <div className="upload-content">
                    <div className="upload-icon">📷</div>
                    <p className="upload-text">
                      {formData.images.length + newImages.length >= 5 
                        ? 'Maximum 5 images reached'
                        : 'Click to add more images'
                      }
                    </p>
                    <p className="upload-hint">PNG, JPG, JPEG (Max 5 images total)</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-footer">
            <button
              type="button"
              onClick={() => navigate('/Products')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Update Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
