import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import './AddProduct.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faCog, faDollarSign, faImage, faCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const AddProduct = () => {
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);

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
  const [hasVariations, setHasVariations] = useState(false);
  const [variations, setVariations] = useState([]);
  const [variationAttributes, setVariationAttributes] = useState(['storage', 'color']); // Dynamic attributes based on category
  const [variationImages, setVariationImages] = useState({}); // { variationId: { files: [], previews: [] } }
  const [variantName, setVariantName] = useState(''); // Variant attribute name (e.g., "Color Family") - deprecated, kept for compatibility
  const [variantAttributeValues, setVariantAttributeValues] = useState([]); // Array of variant values (e.g., ["Black", "Blue"]) - deprecated
  const [newVariantValue, setNewVariantValue] = useState(''); // Input for adding new variant values - deprecated

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

  // Category-based suggested variation attributes
  const categoryVariationAttributes = {
    'Mobile Phone': ['storage', 'color', 'ram'],
    'Laptops': ['storage', 'ram', 'color'],
    'Tablets': ['storage', 'color', 'ram'],
    'Smartwatches': ['size', 'color', 'bandMaterial'],
    'Preowned Phones': ['storage', 'color', 'condition'],
    'Preowned Laptops': ['storage', 'ram', 'condition'],
    'Preowned Tablets': ['storage', 'color', 'condition'],
    'Chargers': ['type', 'wattage', 'color'],
    'Phone Covers': ['compatibility', 'color', 'material'],
    'Screen Protectors': ['compatibility', 'type', 'material'],
    'Cables': ['type', 'length', 'color'],
    'Headphones': ['color', 'type', 'connectivity'],
    'Earbuds': ['color', 'type', 'connectivity'],
    'Other Accessories': ['color', 'type', 'compatibility']
  };

  const categoryFields = {
    'Mobile Phone': [
      { name: 'model', label: 'Model', type: 'text' },
      { name: 'ram', label: 'RAM', type: 'select', options: ['4GB', '6GB', '8GB', '12GB', '16GB'] },
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
      { name: 'cableLength', label: 'Cable Length', type: 'text', placeholder: 'e.g., 1 meter' },
      { name: 'material', label: 'Material', type: 'text' }
    ],
    'Phone Covers': [
      { name: 'type', label: 'Cover Type', type: 'select', options: ['Silicone Case', 'Hard Case', 'Leather Case', 'Flip Case'] },
      { name: 'compatibility', label: 'Compatibility', type: 'text', placeholder: 'e.g., iPhone 14 Pro' },
      { name: 'material', label: 'Material', type: 'text' }
    ],
    'Preowned Phones': [
      { name: 'model', label: 'Model', type: 'text' },
      { name: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
      { name: 'ram', label: 'RAM', type: 'select', options: ['4GB', '6GB', '8GB', '12GB', '16GB'] },
      { name: 'batteryHealth', label: 'Battery Health', type: 'text', placeholder: 'e.g., 85%' },
      { name: 'warranty', label: 'Warranty', type: 'text' }
    ],
    'Laptops': [
      { name: 'model', label: 'Model', type: 'text' },
      { name: 'processor', label: 'Processor', type: 'text', placeholder: 'e.g., Intel i7 13th Gen' },
      { name: 'ram', label: 'RAM', type: 'select', options: ['8GB', '16GB', '32GB', '64GB'] },
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
      { name: 'driverSize', label: 'Driver Size', type: 'text', placeholder: 'e.g., 40mm' },
      { name: 'microphone', label: 'Microphone', type: 'toggle' }
    ],
    'Earbuds': [
      { name: 'model', label: 'Model', type: 'text' },
      { name: 'type', label: 'Type', type: 'select', options: ['True Wireless', 'Wired', 'Neckband'] },
      { name: 'connectivity', label: 'Connectivity', type: 'select', options: ['Bluetooth', 'Wired', 'USB-C'] },
      { name: 'noiseCancellation', label: 'Noise Cancellation', type: 'select', options: ['Active', 'Passive', 'None'] },
      { name: 'batteryLife', label: 'Battery Life', type: 'text', placeholder: 'e.g., 6 hours (24 with case)' },
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
      { name: 'material', label: 'Material', type: 'select', options: ['Braided Nylon', 'PVC', 'Silicone', 'TPE'] },
      { name: 'fastCharging', label: 'Fast Charging Support', type: 'toggle' }
    ],
    'Other Accessories': [
      { name: 'type', label: 'Accessory Type', type: 'text', placeholder: 'e.g., Phone Stand, Pop Socket' },
      { name: 'compatibility', label: 'Compatibility', type: 'text', placeholder: 'e.g., Universal, iPhone only' },
      { name: 'material', label: 'Material', type: 'text' }
    ]
  };

  // Brand options by category
  const brandOptions = {
    'Mobile Phone': ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo', 'Huawei', 'Nokia', 'Motorola', 'Other'],
    'Smartwatches': ['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Amazfit', 'Huawei', 'Fossil', 'TicWatch', 'Other'],
    'Laptops': ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Razer', 'Microsoft', 'Other'],
    'Headphones': ['Sony', 'Bose', 'Apple', 'Samsung', 'JBL', 'Sennheiser', 'Audio-Technica', 'Beats', 'Skullcandy', 'Anker', 'Other'],
    'Earbuds': ['Apple', 'Samsung', 'Sony', 'JBL', 'Jabra', 'Beats', 'Anker', 'Xiaomi', 'OnePlus', 'Nothing', 'Other'],
    'Chargers': ['Anker', 'Belkin', 'Samsung', 'Apple', 'RAVPower', 'Aukey', 'Baseus', 'Ugreen', 'Other'],
    'Phone Covers': ['Spigen', 'OtterBox', 'Case-Mate', 'UAG', 'Ringke', 'ESR', 'Caseology', 'Other'],
    'Screen Protectors': ['Spigen', 'ESR', 'ZAGG', 'amFilm', 'JETech', 'Belkin', 'Other'],
    'Cables': ['Anker', 'Belkin', 'Apple', 'Samsung', 'Baseus', 'Ugreen', 'Native Union', 'Other'],
    'Other Accessories': ['Anker', 'Belkin', 'Spigen', 'PopSockets', 'Other'],
    'Preowned Phones': ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Other'],
    'Tablets': ['Apple', 'Samsung', 'Microsoft', 'Lenovo', 'Amazon', 'Huawei', 'Other'],
    'Preowned Laptops': ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Other'],
    'Preowned Tablets': ['Apple', 'Samsung', 'Microsoft', 'Lenovo', 'Other']
  };

  const steps = [
    { id: 1, name: 'Product Information', icon: faClipboardList },
    { id: 2, name: 'Specifications', icon: faCog },
    { id: 3, name: 'Pricing & Stock', icon: faDollarSign },
    { id: 4, name: 'Media & Images', icon: faImage },
    { id: 5, name: 'Review & Publish', icon: faCheck }
  ];

  // Reset subcategory when category changes
  useEffect(() => {
    if (formData.category && !categoryHierarchy[formData.category]?.includes(formData.subcategory)) {
      setFormData(prev => ({ ...prev, subcategory: '', details: {} }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.category]);

  // Update variation attributes based on category/subcategory
  useEffect(() => {
    if (hasVariations && formData.subcategory) {
      const suggestedAttrs = categoryVariationAttributes[formData.subcategory] || ['color'];
      // Only update if current attributes don't match suggested (to preserve custom attributes)
      const currentAttrsSet = new Set(variationAttributes);
      const isDifferent = suggestedAttrs.length !== variationAttributes.length || 
                         !suggestedAttrs.every(attr => currentAttrsSet.has(attr));
      
      if (isDifferent && variations.length === 0) {
        // Only auto-update if no variations exist yet
        setVariationAttributes(suggestedAttrs);
      }
    } else if (hasVariations && !formData.subcategory && variationAttributes.length === 0) {
      // Default attributes if no subcategory selected
      setVariationAttributes(['color']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.subcategory, hasVariations]);

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

  // Variation attributes management functions
  const addVariationAttribute = () => {
    const newAttr = prompt('Enter attribute name (e.g., size, material, type):');
    if (newAttr && newAttr.trim() && !variationAttributes.includes(newAttr.trim().toLowerCase())) {
      const attrName = newAttr.trim().toLowerCase();
      setVariationAttributes(prev => [...prev, attrName]);
      // Update existing variations to include new attribute
      setVariations(prev => prev.map(v => ({
        ...v,
        attributes: { ...v.attributes, [attrName]: '' }
      })));
    } else if (newAttr && variationAttributes.includes(newAttr.trim().toLowerCase())) {
      alert('This attribute already exists.');
    }
  };

  const removeVariationAttribute = (attrToRemove) => {
    if (variationAttributes.length <= 1) {
      alert('You must have at least one variation attribute.');
      return;
    }
    if (window.confirm(`Remove "${attrToRemove}" attribute? This will remove this attribute from all variations.`)) {
      setVariationAttributes(prev => prev.filter(attr => attr !== attrToRemove));
      // Remove attribute from existing variations
      setVariations(prev => prev.map(v => {
        const newAttrs = { ...v.attributes };
        delete newAttrs[attrToRemove];
        return { ...v, attributes: newAttrs };
      }));
    }
  };

  // Helper function to normalize variant name to standard attribute key
  const normalizeAttributeKey = (variantName) => {
    if (!variantName) return '';
    const normalized = variantName.toLowerCase().trim();
    // Map common variant names to standard attribute keys
    if (normalized.includes('color') || normalized.includes('colour')) return 'color';
    if (normalized.includes('storage') || normalized.includes('memory')) return 'storage';
    if (normalized.includes('size')) return 'size';
    if (normalized.includes('ram')) return 'ram';
    if (normalized.includes('material')) return 'material';
    if (normalized.includes('type')) return 'type';
    // Remove spaces and special characters for other attributes
    return normalized.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  };

  // Variations management functions
  const addVariation = (variantValue = '') => {
    const newVariation = {
      id: Date.now() + Math.random(),
      attributes: {},
      stock: 0,
      price: '',
      discountPrice: '',
      sku: '',
      wearingType: '',
      availability: true,
      images: []
    };
    
    // Initialize attributes based on variantName or variationAttributes
    if (variantName && variantValue) {
      // Use normalized attribute key (e.g., "Color Family" -> "color")
      const attrKey = normalizeAttributeKey(variantName);
      if (attrKey) {
        newVariation.attributes[attrKey] = variantValue;
      }
      // Also initialize other attributes from variationAttributes if they exist
      if (variationAttributes.length > 0) {
        variationAttributes.forEach(attr => {
          if (attr !== attrKey && !newVariation.attributes[attr]) {
            newVariation.attributes[attr] = '';
          }
        });
      }
    } else if (variationAttributes.length > 0) {
      // If variationAttributes exist, initialize all of them
      variationAttributes.forEach((attr, index) => {
        // If variantValue provided and this is the first attribute, use it
        if (variantValue && index === 0) {
          newVariation.attributes[attr] = variantValue;
        } else {
          newVariation.attributes[attr] = '';
        }
      });
    } else {
      // Fallback: use "color" as default
      newVariation.attributes['color'] = variantValue || '';
    }
    
    setVariations(prev => [...prev, newVariation]);
  };




  const updateVariation = (id, field, value) => {
    setVariations(prev => prev.map(v => {
      if (v.id === id) {
        if (field.startsWith('attr.')) {
          const attrName = field.replace('attr.', '');
          return {
            ...v,
            attributes: {
              ...v.attributes,
              [attrName]: value
            }
          };
        }
        // Handle boolean fields
        if (field === 'availability') {
          return { ...v, [field]: value === true || value === 'true' || value === 'on' };
        }
        return { ...v, [field]: value };
      }
      return v;
    }));
  };

  // Auto-generate SKU based on product name and variant attributes
  const generateSKU = (variation) => {
    if (!formData.name || !variation.attributes) return '';
    const baseName = formData.name.replace(/\s+/g, '').substring(0, 6).toUpperCase();
    const attrs = Object.values(variation.attributes).filter(v => v).join('-').replace(/\s+/g, '').substring(0, 10).toUpperCase();
    return `${baseName}-${attrs || 'VAR'}-${Date.now().toString().slice(-4)}`;
  };

  // Handle variation image upload (single image only)
  const handleVariationImageChange = (variationId, e) => {
    const files = Array.from(e.target.files);
    if (files.length > 1) {
      alert('You can only upload 1 image per variation.');
      return;
    }

    if (files.length === 0) return;

    // Replace existing image with new one (single image only)
    const file = files[0];
    const preview = URL.createObjectURL(file);

    // Clean up old preview URL if exists
    const currentImages = variationImages[variationId];
    if (currentImages && currentImages.previews.length > 0) {
      URL.revokeObjectURL(currentImages.previews[0]);
    }

    setVariationImages(prev => ({
      ...prev,
      [variationId]: {
        files: [file],
        previews: [preview]
      }
    }));
  };

  // Remove variation image
  const removeVariationImage = (variationId, index) => {
    const currentImages = variationImages[variationId] || { files: [], previews: [] };
    const newFiles = currentImages.files.filter((_, i) => i !== index);
    const newPreviews = currentImages.previews.filter((_, i) => i !== index);

    // Revoke object URL to free memory
    URL.revokeObjectURL(currentImages.previews[index]);

    setVariationImages(prev => ({
      ...prev,
      [variationId]: {
        files: newFiles,
        previews: newPreviews
      }
    }));
  };

  // Clean up variation images when variation is removed
  const removeVariation = (id) => {
    // Clean up image URLs
    if (variationImages[id]) {
      variationImages[id].previews.forEach(url => URL.revokeObjectURL(url));
      setVariationImages(prev => {
        const newImages = { ...prev };
        delete newImages[id];
        return newImages;
      });
    }
    setVariations(prev => prev.filter(v => v.id !== id));
  };

  const generateVariationCombinations = () => {
    // Get all unique values for each attribute from existing variations
    const attributeValues = {};
    variationAttributes.forEach(attr => {
      attributeValues[attr] = [...new Set(variations.map(v => v.attributes[attr]).filter(Boolean))];
    });

    // Generate all combinations
    const combinations = [];
    const generate = (current, remainingAttrs) => {
      if (remainingAttrs.length === 0) {
        combinations.push(current);
        return;
      }
      const [attr, ...rest] = remainingAttrs;
      const values = attributeValues[attr] || [];
      if (values.length === 0) {
        generate({ ...current, [attr]: '' }, rest);
      } else {
        values.forEach(value => {
          generate({ ...current, [attr]: value }, rest);
        });
      }
    };

    generate({}, variationAttributes);

    // Create variations for each combination that doesn't already exist
    combinations.forEach(combo => {
      const exists = variations.some(v => 
        variationAttributes.every(attr => v.attributes[attr] === combo[attr])
      );
      if (!exists) {
        const newVariation = {
          id: Date.now() + Math.random(),
          attributes: combo,
          stock: 0,
          price: '',
          discountPrice: '',
          images: []
        };
        setVariations(prev => [...prev, newVariation]);
      }
    });
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

    // Validate stock for products without variations
    if (!hasVariations) {
      if (!formData.stock || Number(formData.stock) <= 0) {
        alert('Please enter a valid stock quantity (must be greater than 0).');
        setLoading(false);
        return;
      }
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
      
      // Use main category for filtering (subcategory is not necessary for category filtering)
      // Save the main category as the category value
      const categoryValue = formData.category;
      formDataToSend.append('category', categoryValue);
      
      formDataToSend.append('price', formData.price);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('longDescription', formData.longDescription || '');
      formDataToSend.append('warrantyPeriod', formData.warrantyPeriod);
      formDataToSend.append('discountPrice', formData.discountPrice || '');
      
      // Add brand to details
      if (formData.brand) {
        combinedDetails.brand = formData.brand;
      }
      
      formDataToSend.append('details', JSON.stringify(combinedDetails));
      formDataToSend.append('kokoPay', formData.kokoPay);

      // Handle variations
      if (hasVariations && variations.length > 0) {
        // Validate variations
        const validVariations = variations.filter(v => {
          // Check if at least one attribute has a value
          return Object.values(v.attributes).some(val => val && val.trim() !== '');
        });

        if (validVariations.length === 0) {
          alert('Please add at least one valid variation with attributes.');
          setLoading(false);
          return;
        }

        // Calculate total stock from variations (allow 0 stock - stock is optional)
        const totalStock = validVariations.reduce((sum, v) => {
          return sum + (parseInt(v.stock) || 0);
        }, 0);
        
        // Set stock to calculated total from variations (can be 0 if no stock set)
        formDataToSend.append('stock', totalStock.toString());

        // Upload variation images and get URLs
        // For now, we'll upload variation images with a special naming convention
        // The backend will need to handle these
        validVariations.forEach((v, index) => {
          const varImages = variationImages[v.id];
          if (varImages && varImages.files.length > 0) {
            varImages.files.forEach((file, fileIndex) => {
              formDataToSend.append(`variation-${v.id}-images`, file);
            });
          }
        });

        // Include variation image file references in variation data
        // The backend will process these files and return URLs
        const variationsWithImageRefs = validVariations.map(v => ({
          attributes: v.attributes,
          stock: parseInt(v.stock) || 0,
          price: v.price ? parseFloat(v.price) : undefined,
          discountPrice: v.discountPrice ? parseFloat(v.discountPrice) : undefined,
          sku: v.sku || generateSKU(v),
          wearingType: v.wearingType || '',
          availability: v.availability !== false,
          images: [], // Will be populated by backend after upload
          _hasImages: variationImages[v.id]?.files.length > 0,
          _variationId: v.id // Temporary ID for backend to match files
        }));

        formDataToSend.append('hasVariations', 'true');
        formDataToSend.append('variations', JSON.stringify(variationsWithImageRefs));
      } else {
        // No variations - use the stock from formData
        formDataToSend.append('stock', formData.stock || '0');
      }
        
      // Upload main product images
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
    
    // Check if this is a color field (by name, not type)
    if (field.name.toLowerCase() === 'color') {
      return (
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              name={field.name}
              value={fieldValue}
              onChange={handleDetailChange}
              className="form-input"
              placeholder={field.placeholder || "e.g., White, Black (preferred) or #ffffff"}
              style={{ flex: 1 }}
            />
            <input
              type="color"
              value={fieldValue && fieldValue.startsWith('#') ? fieldValue : '#000000'}
              onChange={(e) => {
                const hexValue = e.target.value;
                // Convert common hex codes to color names for better customer display
                const hexToName = {
                  '#ffffff': 'White', '#000000': 'Black', '#e53935': 'Red', '#1976d2': 'Blue',
                  '#388e3c': 'Green', '#fbc02d': 'Yellow', '#9e9e9e': 'Gray', '#e91e63': 'Pink',
                  '#9c27b0': 'Purple', '#ff9800': 'Orange', '#795548': 'Brown', '#ffd700': 'Gold',
                  '#c0c0c0': 'Silver', '#001f3f': 'Navy', '#f5f5dc': 'Beige', '#fffdd0': 'Cream',
                  '#191970': 'Midnight Blue', '#4a4a4a': 'Space Gray', '#b76e79': 'Rose Gold',
                  '#ff0000': 'Red', '#00ff00': 'Green', '#0000ff': 'Blue', '#ffff00': 'Yellow',
                  '#ff00ff': 'Magenta', '#00ffff': 'Cyan', '#808080': 'Gray', '#ffc0cb': 'Pink'
                };
                const colorName = hexToName[hexValue.toLowerCase()];
                // Use color name if available, otherwise use hex code
                handleDetailChange({ target: { name: field.name, value: colorName || hexValue } });
              }}
              style={{
                width: '50px',
                height: '40px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                padding: '2px'
              }}
              title="Pick a color - will auto-convert to color name if possible"
            />
          </div>
        </div>
      );
    }
    
    switch (field.type) {
      case 'select':
        return (
          <select
            name={field.name}
            value={fieldValue}
            onChange={handleDetailChange}
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
                  {currentStep > step.id ? <FontAwesomeIcon icon={faCheck} /> : step.id}
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
                      <p className="empty-state-hint">If you want category-specific fields, please select a subcategory in the previous step.</p>
                    </div>
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
                        Stock Quantity {!hasVariations && <span className="required-star">*</span>}
                      </label>
                      <input
                        type="number"
                        name="stock"
                        value={hasVariations ? '' : (formData.stock || '')}
                        onChange={handleInputChange}
                        required={!hasVariations}
                        disabled={hasVariations}
                        className="modern-input"
                        placeholder={hasVariations ? "Calculated from variations" : "0"}
                        min="0"
                        style={hasVariations ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}}
                      />
                      {hasVariations && (
                        <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280', fontSize: '0.75rem' }}>
                          Stock will be calculated automatically from your variations
                        </small>
                      )}
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

                  {/* Price, Stock & Variants Section - Daraz Style */}
                  <div className="variations-section" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>
                      Price, Stock & Variants
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                      You can add variants to a product that has more than one option, such as size or color.
                    </p>

                    <div className="form-field-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="modern-label checkbox-label">
                        <input
                          type="checkbox"
                          checked={hasVariations}
                          onChange={(e) => {
                            setHasVariations(e.target.checked);
                            if (!e.target.checked) {
                              setVariations([]);
                              setVariantName('');
                            } else {
                              // Initialize with default variant name if available
                              if (!variantName) {
                                if (variationAttributes.length > 0) {
                                  const defaultName = variationAttributes[0].charAt(0).toUpperCase() + variationAttributes[0].slice(1) + ' Family';
                                  setVariantName(defaultName);
                                } else {
                                  setVariantName('Color Family');
                                }
                              }
                              // Add first empty variation if none exist
                              if (variations.length === 0) {
                                addVariation('');
                              }
                            }
                          }}
                          className="modern-checkbox"
                        />
                        <span className="checkbox-text" style={{ fontWeight: 600, fontSize: '1rem' }}>
                          This product has variations
                        </span>
                      </label>
                    </div>

                    {hasVariations && (
                      <div style={{ marginTop: '1.5rem' }}>
                        {/* Simplified Variations Section */}
                        <div style={{ marginBottom: '2rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                              <span style={{ color: '#ef4444' }}>*</span> Product Variations
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const newVariation = {
                                  id: Date.now() + Math.random(),
                                  attributes: {},
                                  stock: 0,
                                  price: '',
                                  discountPrice: '',
                                  sku: '',
                                  wearingType: '',
                                  availability: true,
                                  images: []
                                };
                                variationAttributes.forEach(attr => {
                                  newVariation.attributes[attr] = '';
                                });
                                setVariations(prev => [...prev, newVariation]);
                              }}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#f97316',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 500
                              }}
                            >
                              + Add Variation
                            </button>
                          </div>
                          
                          {variations.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db', color: '#6b7280' }}>
                              <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>No variations added yet.</p>
                              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                Click "Add Variation" above to create your first variation. You can then edit Storage, Color, Price, and Stock for each variation in the table.
                              </p>
                            </div>
                          ) : (
                            <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', minWidth: '280px' }}>
                                      {variationAttributes.length > 0 
                                        ? variationAttributes.map(attr => attr.charAt(0).toUpperCase() + attr.slice(1)).join(' / ')
                                        : 'Attributes'}
                                    </th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', minWidth: '130px' }}>
                                      <span style={{ color: '#ef4444' }}>*</span> Price
                                    </th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', minWidth: '130px' }}>
                                      Special Price
                                    </th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', minWidth: '110px' }}>
                                      Stock
                                    </th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', minWidth: '120px' }}>
                                      Image
                                    </th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', minWidth: '80px' }}>
                                      Delete
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {variations.map((variation, idx) => {
                                    const variantImage = variationImages[variation.id]?.previews?.[0];
                                    // Get all attribute values to display
                                    const attributeValues = variationAttributes.length > 0 
                                      ? variationAttributes.map(attr => variation.attributes[attr] || '').filter(Boolean).join(' / ') || 'Variant ' + (idx + 1)
                                      : Object.values(variation.attributes).filter(Boolean).join(' / ') || 'Variant ' + (idx + 1);
                                    return (
                                      <tr key={variation.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                          {/* Editable attributes (Storage, Color, etc.) */}
                                          {variationAttributes.length > 0 ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                                              {variationAttributes.map(attr => (
                                                <div key={attr}>
                                                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500 }}>
                                                    {attr.charAt(0).toUpperCase() + attr.slice(1)}
                                                  </label>
                                                  {attr.toLowerCase() === 'color' ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                      <input
                                                        type="text"
                                                        value={variation.attributes[attr] || ''}
                                                        onChange={(e) => updateVariation(variation.id, `attr.${attr}`, e.target.value)}
                                                        placeholder="e.g., Blue"
                                                        style={{
                                                          flex: 1,
                                                          padding: '0.5rem',
                                                          border: '1px solid #d1d5db',
                                                          borderRadius: '4px',
                                                          fontSize: '0.875rem'
                                                        }}
                                                      />
                                                      <input
                                                        type="color"
                                                        value={variation.attributes[attr] && variation.attributes[attr].startsWith('#') 
                                                          ? variation.attributes[attr] 
                                                          : '#000000'}
                                                        onChange={(e) => {
                                                          const hexValue = e.target.value;
                                                          const hexToName = {
                                                            '#ffffff': 'White', '#000000': 'Black', '#e53935': 'Red', '#1976d2': 'Blue',
                                                            '#388e3c': 'Green', '#fbc02d': 'Yellow', '#9e9e9e': 'Gray', '#e91e63': 'Pink',
                                                            '#9c27b0': 'Purple', '#ff9800': 'Orange', '#795548': 'Brown', '#ffd700': 'Gold',
                                                            '#c0c0c0': 'Silver', '#001f3f': 'Midnight', '#191970': 'Midnight Blue', '#b76e79': 'Rose Gold'
                                                          };
                                                          const colorName = hexToName[hexValue.toLowerCase()];
                                                          updateVariation(variation.id, `attr.${attr}`, colorName || hexValue);
                                                        }}
                                                        style={{
                                                          width: '40px',
                                                          height: '40px',
                                                          border: '1px solid #d1d5db',
                                                          borderRadius: '4px',
                                                          cursor: 'pointer',
                                                          padding: '2px',
                                                          flexShrink: 0
                                                        }}
                                                        title="Pick color"
                                                      />
                                                    </div>
                                                  ) : (
                                                    <input
                                                      type="text"
                                                      value={variation.attributes[attr] || ''}
                                                      onChange={(e) => updateVariation(variation.id, `attr.${attr}`, e.target.value)}
                                                      placeholder={attr === 'storage' ? 'e.g., 128GB' : attr === 'ram' ? 'e.g., 8GB' : 'Value'}
                                                      style={{
                                                        width: '100%',
                                                        padding: '0.5rem',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '4px',
                                                        fontSize: '0.875rem'
                                                      }}
                                                    />
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>{attributeValues}</div>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Rs.</span>
                                            <input
                                              type="number"
                                              value={variation.price || ''}
                                              onChange={(e) => updateVariation(variation.id, 'price', e.target.value)}
                                              placeholder="0"
                                              step="0.01"
                                              style={{ width: '100px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.875rem' }}
                                            />
                                          </div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                          {variation.discountPrice ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Rs.</span>
                                              <input
                                                type="number"
                                                value={variation.discountPrice}
                                                onChange={(e) => updateVariation(variation.id, 'discountPrice', e.target.value)}
                                                placeholder="0"
                                                step="0.01"
                                                style={{ width: '100px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.875rem' }}
                                              />
                                            </div>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => updateVariation(variation.id, 'discountPrice', '0')}
                                              style={{
                                                padding: '0.375rem 0.75rem',
                                                background: 'transparent',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.8125rem',
                                                color: '#374151'
                                              }}
                                            >
                                              Add
                                            </button>
                                          )}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                          <input
                                            type="number"
                                            value={variation.stock || ''}
                                            onChange={(e) => updateVariation(variation.id, 'stock', e.target.value)}
                                            placeholder="0"
                                            min="0"
                                            style={{ width: '100px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.875rem' }}
                                          />
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                          <div style={{ position: 'relative', width: '60px', height: '60px', border: '1px dashed #d1d5db', borderRadius: '4px', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                            {variantImage ? (
                                              <>
                                                <img src={variantImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                                <button
                                                  type="button"
                                                  onClick={() => removeVariationImage(variation.id, 0)}
                                                  style={{
                                                    position: 'absolute',
                                                    top: '-8px',
                                                    right: '-8px',
                                                    background: '#ef4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '20px',
                                                    height: '20px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                  }}
                                                >
                                                  ×
                                                </button>
                                              </>
                                            ) : (
                                              <>
                                                <span style={{ fontSize: '1.5rem', color: '#9ca3af' }}>+</span>
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={(e) => handleVariationImageChange(variation.id, e)}
                                                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                                                />
                                              </>
                                            )}
                                          </div>
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                          <button
                                            type="button"
                                            onClick={() => removeVariation(variation.id)}
                                            style={{
                                              padding: '0.5rem',
                                              background: '#ef4444',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '4px',
                                              cursor: 'pointer',
                                              fontSize: '0.875rem',
                                              fontWeight: 500
                                            }}
                                            title="Delete variation"
                                          >
                                            Delete
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
                          {formData.category || 'Not set'}
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
                        <span className="review-value">
                          {hasVariations && variations.length > 0
                            ? (() => {
                                const validVariations = variations.filter(v => 
                                  Object.values(v.attributes).some(val => val && val.trim() !== '')
                                );
                                const totalStock = validVariations.reduce((sum, v) => 
                                  sum + (parseInt(v.stock) || 0), 0
                                );
                                return `${totalStock} units (from ${validVariations.length} variation${validVariations.length !== 1 ? 's' : ''})`;
                              })()
                            : `${formData.stock || '0'} units`}
                        </span>
                      </div>
                      <div className="review-item">
                        <span className="review-label">Images:</span>
                        <span className="review-value">{previewUrls.length} uploaded</span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    // Check if all required fields are filled
                    const hasName = formData.name && formData.name.trim() !== '';
                    const hasCategory = formData.category && formData.category.trim() !== '';
                    const hasPrice = formData.price && Number(formData.price) > 0;
                    
                    // Stock is optional - no need to check for stock
                    // Return false if any required field is missing (stock is not required)
                    
                    return !hasName || !hasCategory || !hasPrice;
                  })() ? (
                    <div className="warning-box">
                      <FontAwesomeIcon icon={faExclamationTriangle} /> Please complete all required fields before publishing
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
                {loading ? (
                  <>
                    <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', marginRight: '8px', display: 'inline-block' }}></div>
                    Saving...
                  </>
                ) : 'Save as Draft'}
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !formData.name || !formData.category || !formData.price}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', marginRight: '8px', display: 'inline-block' }}></div>
                    Publishing...
                  </>
                ) : 'Publish Product'}
              </button>
            </div>
          </form>
        </div>
    </div>
  );
};

export default AddProduct;