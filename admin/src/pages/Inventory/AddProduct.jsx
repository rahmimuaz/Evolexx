import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isDraft, setIsDraft] = useState(false);

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
    warrantyPeriod: 'No Warranty',
    discountPrice: '',
    kokoPay: false
  });

  const [customSpecs, setCustomSpecs] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');

  // Define the API base URL from environment variables
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // Hierarchical categories structure
  const categoryHierarchy = {
    'Electronics': ['Mobile Phone', 'Laptops', 'Tablets', 'Smartwatches'],
    'Mobile Accessories': ['Chargers', 'Phone Covers', 'Screen Protectors', 'Cables', 'Headphones', 'Earbuds', 'Other Accessories'],
    'Pre-owned Devices': ['Preowned Phones', 'Preowned Laptops', 'Preowned Tablets'],
    'Other': []
  };

  const categories = Object.keys(categoryHierarchy);

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
    ],
    'Headphones': [
      { name: 'model', label: 'Model', type: 'text' },
      { name: 'type', label: 'Type', type: 'select', options: ['Over-Ear', 'On-Ear', 'In-Ear', 'True Wireless'] },
      { name: 'connectivity', label: 'Connectivity', type: 'select', options: ['Wired', 'Wireless', 'Bluetooth', 'Hybrid'] },
      { name: 'noiseCancellation', label: 'Noise Cancellation', type: 'select', options: ['Active', 'Passive', 'None'] },
      { name: 'batteryLife', label: 'Battery Life', type: 'text', placeholder: 'e.g., 30 hours' },
      { name: 'color', label: 'Color', type: 'text' },
      { name: 'driverSize', label: 'Driver Size', type: 'text', placeholder: 'e.g., 40mm' },
      { name: 'microphone', label: 'Microphone', type: 'toggle' }
    ],
    'Earbuds': [
      { name: 'model', label: 'Model', type: 'text' },
      { name: 'type', label: 'Type', type: 'select', options: ['True Wireless', 'Wired', 'Neckband'] },
      { name: 'connectivity', label: 'Connectivity', type: 'select', options: ['Bluetooth', 'Wired', 'USB-C'] },
      { name: 'noiseCancellation', label: 'Noise Cancellation', type: 'select', options: ['Active', 'Passive', 'None'] },
      { name: 'batteryLife', label: 'Battery Life', type: 'text', placeholder: 'e.g., 6 hours (24 with case)' },
      { name: 'color', label: 'Color', type: 'text' },
      { name: 'waterResistance', label: 'Water Resistance', type: 'text', placeholder: 'e.g., IPX4' },
      { name: 'microphone', label: 'Microphone', type: 'toggle' }
    ],
    'Screen Protectors': [
      { name: 'type', label: 'Type', type: 'select', options: ['Tempered Glass', 'Hydrogel Film', 'Matte Film', 'Privacy Screen'] },
      { name: 'compatibility', label: 'Compatibility', type: 'text', placeholder: 'e.g., iPhone 15 Pro Max' },
      { name: 'features', label: 'Features', type: 'text', placeholder: 'e.g., 9H Hardness, Anti-Fingerprint' },
      { name: 'material', label: 'Material', type: 'text' }
    ],
    'Cables': [
      { name: 'type', label: 'Cable Type', type: 'select', options: ['Lightning', 'USB-C', 'Micro USB', 'USB-A to USB-C', 'USB-C to USB-C', 'Lightning to USB-C'] },
      { name: 'length', label: 'Cable Length', type: 'text', placeholder: 'e.g., 1 meter' },
      { name: 'compatibility', label: 'Compatibility', type: 'text', placeholder: 'e.g., iPhone, Android' },
      { name: 'color', label: 'Color', type: 'text' },
      { name: 'material', label: 'Material', type: 'select', options: ['Braided Nylon', 'PVC', 'Silicone', 'TPE'] },
      { name: 'fastCharging', label: 'Fast Charging Support', type: 'toggle' }
    ],
    'Other Accessories': [
      { name: 'type', label: 'Accessory Type', type: 'text', placeholder: 'e.g., Phone Stand, Pop Socket' },
      { name: 'compatibility', label: 'Compatibility', type: 'text', placeholder: 'e.g., Universal, iPhone only' },
      { name: 'color', label: 'Color', type: 'text' },
      { name: 'material', label: 'Material', type: 'text' }
    ]
  };

  // Brand options by category
  const brandOptions = {
    'Mobile Phone': ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo', 'Huawei', 'Nokia', 'Motorola'],
    'Smartwatches': ['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Amazfit', 'Huawei', 'Fossil', 'TicWatch'],
    'Laptops': ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Razer', 'Microsoft'],
    'Headphones': ['Sony', 'Bose', 'Apple', 'Samsung', 'JBL', 'Sennheiser', 'Audio-Technica', 'Beats', 'Skullcandy', 'Anker'],
    'Earbuds': ['Apple', 'Samsung', 'Sony', 'JBL', 'Jabra', 'Beats', 'Anker', 'Xiaomi', 'OnePlus', 'Nothing'],
    'Chargers': ['Anker', 'Belkin', 'Samsung', 'Apple', 'RAVPower', 'Aukey', 'Baseus', 'Ugreen'],
    'Phone Covers': ['Spigen', 'OtterBox', 'Case-Mate', 'UAG', 'Ringke', 'ESR', 'Caseology'],
    'Screen Protectors': ['Spigen', 'ESR', 'ZAGG', 'amFilm', 'JETech', 'Belkin', 'Other'],
    'Cables': ['Anker', 'Belkin', 'Apple', 'Samsung', 'Baseus', 'Ugreen', 'Native Union', 'Other'],
    'Other Accessories': ['Anker', 'Belkin', 'Spigen', 'PopSockets', 'Other'],
    'Preowned Phones': ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi']
  };

  const steps = [
    { id: 1, name: 'Product Information', icon: '📋' },
    { id: 2, name: 'Specifications', icon: '⚙️' },
    { id: 3, name: 'Pricing & Stock', icon: '💰' },
    { id: 4, name: 'Media & Images', icon: '🖼️' },
    { id: 5, name: 'Review & Publish', icon: '✓' }
  ];

  // Reset subcategory when category changes
  useEffect(() => {
    if (formData.category && !categoryHierarchy[formData.category]?.includes(formData.subcategory)) {
      setFormData(prev => ({ ...prev, subcategory: '', details: {} }));
    }
  }, [formData.category]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
    if (files.length + selectedFiles.length > 5) {
      alert('You can only upload up to 5 images.');
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);
    setPreviewUrls(prev => [...prev, ...files.map(file => URL.createObjectURL(file))]);
  };

  const handleSubmit = async (e, saveAsDraft = false) => {
    e.preventDefault();

    if (!saveAsDraft && selectedFiles.length === 0) {
      alert('Please upload at least one image.');
      return;
    }
    if (formData.discountPrice && Number(formData.discountPrice) > Number(formData.price)) {
      alert('Discount/Offer price cannot be greater than Price.');
      return;
    }

    setLoading(true);
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

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      
      // Use subcategory as the actual category for backend compatibility
      // For "Other" category, use "Other" as the category value
      const categoryValue = formData.category === 'Other' ? 'Other' : (formData.subcategory || formData.category);
      formDataToSend.append('category', categoryValue);
      
      formDataToSend.append('price', formData.price);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('longDescription', formData.longDescription || '');
      formDataToSend.append('warrantyPeriod', formData.warrantyPeriod);
      formDataToSend.append('discountPrice', formData.discountPrice || '');
      formDataToSend.append('stock', formData.stock);
      
      // Add brand to details
      if (formData.brand) {
        combinedDetails.brand = formData.brand;
      }
      
      formDataToSend.append('details', JSON.stringify(combinedDetails));
      formDataToSend.append('kokoPay', formData.kokoPay);

      selectedFiles.forEach(file => {
        formDataToSend.append('images', file);
      });

      // Log the data being sent for debugging
      console.log('Sending product data:', {
        name: formData.name,
        category: categoryValue,
        price: formData.price,
        stock: formData.stock,
        brand: formData.brand,
        details: combinedDetails,
        imagesCount: selectedFiles.length
      });

      // Use the API_BASE_URL here
      const response = await axios.post(`${API_BASE_URL}/api/products`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 201) {
        alert(saveAsDraft ? 'Product saved as draft!' : 'Product published successfully!');
        navigate('/Products');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error adding product. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
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
            required
            className="form-input"
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
            required
            className="form-input"
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className="modern-add-product-page">
      <div className="page-header">
        <h1 className="page-title">Add New Product</h1>
        <p className="page-subtitle">Create a new product listing with detailed specifications</p>
      </div>

      {/* Horizontal Step Progress Bar */}
      <div className="steps-progress-bar">
        <div className="steps-wrapper">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={`progress-step ${currentStep === step.id ? 'progress-active' : ''} ${currentStep > step.id ? 'progress-completed' : ''}`}
                onClick={() => setCurrentStep(step.id)}
              >
                <div className="progress-circle">
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                <div className="progress-label">
                  <span className="progress-step-name">{step.name}</span>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`progress-line ${currentStep > step.id ? 'progress-line-completed' : ''}`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="content-column">
          <form onSubmit={handleSubmit} className="product-form">
            
            {/* Step 1: Product Information */}
            {currentStep === 1 && (
              <div className="form-step">
                <h2 className="form-section-title">Product Information (Core)</h2>
                <p className="form-section-subtitle">Enter the basic details of your product</p>

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
                              required
                              className="modern-input category-select-second"
                            >
                              <option value="">Select subcategory</option>
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
                          : 'Select main category first, then choose subcategory'}
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
                  ) : formData.subcategory && brandOptions[formData.subcategory] && (
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
                  )}

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
                      placeholder="Brief product description (max 200 characters)"
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="modern-label">Long Description</label>
                    <textarea
                      name="longDescription"
                      value={formData.longDescription}
                      onChange={handleInputChange}
                      rows="8"
                      className="modern-textarea"
                      placeholder="Enter a detailed description of the product..."
                      style={{ 
                        resize: 'vertical',
                        minHeight: '150px',
                        fontFamily: 'inherit',
                        lineHeight: '1.5'
                      }}
                    />
                    <small style={{ display: 'block', marginTop: '0.5rem', color: '#64748b', fontSize: '0.8125rem' }}>
                      You can type or paste detailed product information here
                    </small>
                  </div>
                </div>

                <div className="step-navigation">
                  <button type="button" onClick={() => setCurrentStep(2)} className="btn-next">
                    Continue to Specifications →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Specifications */}
            {currentStep === 2 && (
              <div className="form-step">
                <h2 className="form-section-title">Specifications & Attributes</h2>
                <p className="form-section-subtitle">Define product-specific details and custom attributes</p>

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
                              {field.label} <span className="required-star">*</span>
                            </label>
                            {renderFieldByType(field)}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="empty-state">
                      <p>Please select a category in the previous step to see category-specific fields</p>
                    </div>
                  )}

                  {/* Custom Specifications */}
                  <div className="custom-specs-section">
                    <h3 className="subsection-title">
                      <span className="subsection-icon">➕</span>
                      Additional Specifications (Optional)
                    </h3>
                    <p className="subsection-hint">Add custom product specifications that aren't covered above</p>

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

                <div className="step-navigation">
                  <button type="button" onClick={() => setCurrentStep(1)} className="btn-back">
                    ← Back
                  </button>
                  <button type="button" onClick={() => setCurrentStep(3)} className="btn-next">
                    Continue to Pricing →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Pricing & Stock */}
            {currentStep === 3 && (
              <div className="form-step">
                <h2 className="form-section-title">Pricing & Stock Management</h2>
                <p className="form-section-subtitle">Set your product pricing and inventory</p>

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

                <div className="step-navigation">
                  <button type="button" onClick={() => setCurrentStep(2)} className="btn-back">
                    ← Back
                  </button>
                  <button type="button" onClick={() => setCurrentStep(4)} className="btn-next">
                    Continue to Media →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Media & Images */}
            {currentStep === 4 && (
              <div className="form-step">
                <h2 className="form-section-title">Media & Images</h2>
                <p className="form-section-subtitle">Upload high-quality product images (1-5 images)</p>

                <div className="form-section-content">
                  <div className="image-upload-zone">
                    <label className="upload-area">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="upload-input-hidden"
                      />
                      <div className="upload-content">
                        <div className="upload-icon">📷</div>
                        <p className="upload-text">Click to upload or drag and drop</p>
                        <p className="upload-hint">PNG, JPG, JPEG (Max 5 images, 5MB each)</p>
                      </div>
                    </label>
                  </div>

                  {previewUrls.length > 0 && (
                    <div className="images-grid">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="image-card">
                          <img src={url} alt={`Preview ${index + 1}`} className="preview-image" />
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewUrls(prev => prev.filter((_, i) => i !== index));
                              setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="image-remove-btn"
                          >
                            ×
                          </button>
                          {index === 0 && <span className="primary-badge">Primary</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="step-navigation">
                  <button type="button" onClick={() => setCurrentStep(3)} className="btn-back">
                    ← Back
                  </button>
                  <button type="button" onClick={() => setCurrentStep(5)} className="btn-next">
                    Review Product →
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Review & Publish */}
            {currentStep === 5 && (
              <div className="form-step">
                <h2 className="form-section-title">Review & Publish</h2>
                <p className="form-section-subtitle">Review your product details before publishing</p>

                <div className="form-section-content">
                  <div className="review-card">
                    <h3 className="review-title">Product Summary</h3>
                    <div className="review-grid">
                      <div className="review-item">
                        <span className="review-label">Product Name:</span>
                        <span className="review-value">{formData.name || 'Not set'}</span>
                      </div>
                      <div className="review-item">
                        <span className="review-label">Category:</span>
                        <span className="review-value">
                          {formData.category === 'Other' 
                            ? 'Other' 
                            : (formData.subcategory || formData.category || 'Not set')}
                        </span>
                      </div>
                      <div className="review-item">
                        <span className="review-label">Brand:</span>
                        <span className="review-value">{formData.brand || 'Not set'}</span>
                      </div>
                      <div className="review-item">
                        <span className="review-label">Price:</span>
                        <span className="review-value">LKR {formData.price || '0.00'}</span>
                      </div>
                      <div className="review-item">
                        <span className="review-label">Stock:</span>
                        <span className="review-value">{formData.stock || '0'} units</span>
                      </div>
                      <div className="review-item">
                        <span className="review-label">Images:</span>
                        <span className="review-value">{previewUrls.length} uploaded</span>
                      </div>
                    </div>
                  </div>

                  {!formData.name || (!formData.subcategory && formData.category !== 'Other') || !formData.price || !formData.stock ? (
                    <div className="warning-box">
                      ⚠️ Please complete all required fields before publishing
                    </div>
                  ) : null}
                </div>

                <div className="step-navigation">
                  <button type="button" onClick={() => setCurrentStep(4)} className="btn-back">
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* Footer Action Buttons */}
            <div className="form-footer">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="btn-secondary"
                disabled={loading}
              >
                Save as Draft
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !formData.name || (!formData.subcategory && formData.category !== 'Other') || !formData.price || !formData.stock}
              >
                {loading ? 'Publishing...' : 'Publish Product'}
              </button>
            </div>
          </form>
        </div>
    </div>
  );
};

export default AddProduct;