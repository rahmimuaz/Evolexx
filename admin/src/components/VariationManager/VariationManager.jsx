import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faEdit, faTrash, faImage } from '@fortawesome/free-solid-svg-icons';
import './VariationManager.css';

/**
 * VariationManager Component
 * 
 * A production-ready component for managing product variations with:
 * - Dynamic attribute and value management
 * - Automatic combination generation
 * - Per-variation pricing, stock, SKU, and images
 * - Duplicate prevention
 * - Full validation
 * 
 * @param {Object} props
 * @param {boolean} props.hasVariations - Whether variations are enabled
 * @param {Function} props.onChange - Callback with (hasVariations, attributes, variations)
 * @param {Array} props.initialAttributes - Initial variation attributes [{name: "Color", values: ["Black", "White"]}]
 * @param {Array} props.initialVariations - Initial variations array
 */
const VariationManager = ({ 
  hasVariations, 
  onChange, 
  initialAttributes = [], 
  initialVariations = [],
  basePrice = 0,
  baseDiscountPrice = null
}) => {
  // State for variation attributes (e.g., [{name: "Color", values: ["Black", "White"]}])
  const [attributes, setAttributes] = useState(initialAttributes);
  
  // State for generated variations
  const [variations, setVariations] = useState(initialVariations);
  
  // State for variation images (Map: variationId -> File[])
  const [variationImages, setVariationImages] = useState(new Map());
  
  // Track which variation row is being edited for images
  const [editingImagesFor, setEditingImagesFor] = useState(null);

  // Generate all possible combinations from attributes
  // Memoize to avoid recreating on every render
  const generateCombinations = useCallback((attrs, existingVars = []) => {
    if (!attrs || attrs.length === 0) return [];
    
    // Filter out attributes with no values or empty values
    const validAttrs = attrs.filter(attr => 
      attr.name && 
      attr.name.trim() && 
      attr.values && 
      attr.values.length > 0 &&
      attr.values.some(v => v && v.trim())
    );
    
    if (validAttrs.length === 0) return [];

    // Filter values to only include non-empty ones
    const filteredAttrs = validAttrs.map(attr => ({
      ...attr,
      values: attr.values.filter(v => v && v.trim())
    })).filter(attr => attr.values.length > 0);

    if (filteredAttrs.length === 0) return [];

    // Recursive function to generate cartesian product
    const cartesian = (arrays, attrNames) => {
      if (arrays.length === 0) return [{}];
      if (arrays.length === 1) {
        return arrays[0].map(value => ({ [attrNames[0]]: value }));
      }
      
      const [first, ...rest] = arrays;
      const [firstName, ...restNames] = attrNames;
      const restCombinations = cartesian(rest, restNames);
      const combinations = [];
      
      first.forEach(value => {
        restCombinations.forEach(combo => {
          combinations.push({ [firstName]: value, ...combo });
        });
      });
      
      return combinations;
    };

    // Get all attribute value arrays and names
    const valueArrays = filteredAttrs.map(attr => attr.values);
    const attrNames = filteredAttrs.map(attr => attr.name);
    
    // Generate all combinations
    const combinations = cartesian(valueArrays, attrNames);
    
    // Convert to variation format with unique IDs, preserving existing data
    return combinations.map((combo, index) => {
      // Check if variation already exists (by matching attributes exactly)
      const existingVariation = existingVars.find(v => {
        const vAttrs = v.attributes || {};
        const comboKeys = Object.keys(combo);
        const vKeys = Object.keys(vAttrs);
        
        if (comboKeys.length !== vKeys.length) return false;
        
        return comboKeys.every(key => vAttrs[key] === combo[key]);
      });
      
      if (existingVariation) {
        // Preserve existing variation data but update attributes
        return {
          ...existingVariation,
          attributes: combo
        };
      }
      
      // Generate SKU automatically
      const skuParts = Object.entries(combo)
        .map(([key, value]) => {
          const shortKey = key.substring(0, 3).toUpperCase().replace(/\s+/g, '');
          const shortValue = String(value).substring(0, 3).toUpperCase().replace(/\s+/g, '');
          return `${shortKey}-${shortValue}`;
        })
        .join('-');
      
      return {
        variationId: `VAR-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        attributes: combo,
        price: basePrice || undefined,
        discountPrice: baseDiscountPrice || undefined,
        stock: 0,
        sku: skuParts,
        images: [],
        isActive: true
      };
    });
  }, [basePrice, baseDiscountPrice]);

  // Notify parent of changes
  const notifyChange = useCallback((attrs, vars, validationInfo) => {
    if (onChange) {
      onChange(hasVariations, attrs, vars, validationInfo);
    }
  }, [hasVariations, onChange]);

  // Auto-generate combinations when attributes change
  useEffect(() => {
    if (hasVariations && attributes.length > 0) {
      // Check if attributes have valid data before generating
      const validAttrs = attributes.filter(attr => attr.name && attr.values && attr.values.some(v => v && v.trim()));
      if (validAttrs.length > 0) {
        const newVariations = generateCombinations(validAttrs, variations);
        setVariations(prev => {
          // Only update if combinations actually changed
          const prevKeys = prev.map(v => JSON.stringify(v.attributes)).sort().join('|');
          const newKeys = newVariations.map(v => JSON.stringify(v.attributes)).sort().join('|');
          if (prevKeys !== newKeys) {
            return newVariations;
          }
          return prev;
        });
      } else {
        setVariations([]);
      }
    } else if (!hasVariations) {
      setVariations([]);
      setAttributes([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributes, hasVariations]); // generateCombinations is stable, variations intentionally excluded to prevent loops

  // Add a new attribute
  const handleAddAttribute = () => {
    const newAttribute = {
      id: `attr-${Date.now()}`,
      name: '',
      values: ['']
    };
    setAttributes(prev => [...prev, newAttribute]);
  };

  // Remove an attribute
  const handleRemoveAttribute = (attrId) => {
    setAttributes(prev => prev.filter(attr => attr.id !== attrId));
  };

  // Update attribute name
  const handleAttributeNameChange = (attrId, newName) => {
    setAttributes(prev => prev.map(attr => 
      attr.id === attrId ? { ...attr, name: newName.trim() } : attr
    ));
  };

  // Add a value to an attribute
  const handleAddValue = (attrId) => {
    setAttributes(prev => prev.map(attr => 
      attr.id === attrId 
        ? { ...attr, values: [...attr.values, ''] }
        : attr
    ));
  };

  // Remove a value from an attribute
  const handleRemoveValue = (attrId, valueIndex) => {
    setAttributes(prev => prev.map(attr => {
      if (attr.id === attrId) {
        const newValues = attr.values.filter((_, idx) => idx !== valueIndex);
        return { ...attr, values: newValues.length > 0 ? newValues : [''] };
      }
      return attr;
    }));
  };

  // Update an attribute value
  const handleValueChange = (attrId, valueIndex, newValue) => {
    setAttributes(prev => prev.map(attr => {
      if (attr.id === attrId) {
        const newValues = [...attr.values];
        newValues[valueIndex] = newValue.trim();
        return { ...attr, values: newValues };
      }
      return attr;
    }));
  };

  // Update variation field (price, stock, SKU, etc.)
  const handleVariationFieldChange = (variationId, field, value) => {
    setVariations(prev => prev.map(variation => {
      if (variation.variationId === variationId) {
        return {
          ...variation,
          [field]: field === 'stock' || field === 'price' || field === 'discountPrice' 
            ? (value === '' ? undefined : parseFloat(value))
            : field === 'isActive'
            ? !variation.isActive
            : value
        };
      }
      return variation;
    }));
  };

  // Handle variation image upload
  const handleVariationImageChange = (variationId, files) => {
    const fileArray = Array.from(files);
    setVariationImages(prev => {
      const newMap = new Map(prev);
      newMap.set(variationId, fileArray);
      return newMap;
    });
    
    // Update variation with image previews
    setVariations(prev => prev.map(variation => {
      if (variation.variationId === variationId) {
        return {
          ...variation,
          images: fileArray.map(file => URL.createObjectURL(file))
        };
      }
      return variation;
    }));
  };

  // Remove variation image
  const handleRemoveVariationImage = (variationId, imageIndex) => {
    setVariations(prev => prev.map(variation => {
      if (variation.variationId === variationId) {
        const newImages = [...variation.images];
        newImages.splice(imageIndex, 1);
        return { ...variation, images: newImages };
      }
      return variation;
    }));
    
    // Update files map
    setVariationImages(prev => {
      const newMap = new Map(prev);
      const files = newMap.get(variationId) || [];
      files.splice(imageIndex, 1);
      if (files.length === 0) {
        newMap.delete(variationId);
      } else {
        newMap.set(variationId, files);
      }
      return newMap;
    });
  };

  // Get variation files for form submission
  const getVariationImageFiles = useCallback(() => {
    const files = [];
    variationImages.forEach((fileArray, variationId) => {
      fileArray.forEach((file, index) => {
        files.push({
          fieldname: `variationImages[${variationId}][${index}]`,
          file: file
        });
      });
    });
    return files;
  }, [variationImages]);

  // Validation: Check for duplicate attribute names
  const hasDuplicateAttributeNames = useMemo(() => {
    const names = attributes.map(attr => attr.name.toLowerCase().trim()).filter(Boolean);
    return new Set(names).size !== names.length;
  }, [attributes]);

  // Validation: Check for empty attributes
  const hasEmptyAttributes = useMemo(() => {
    return attributes.some(attr => !attr.name.trim() || attr.values.some(val => !val.trim()));
  }, [attributes]);

  // Validation: Check variations for missing required fields
  const validationErrors = useMemo(() => {
    const errors = [];
    
    if (hasVariations) {
      if (hasDuplicateAttributeNames) {
        errors.push('Duplicate attribute names are not allowed.');
      }
      
      if (hasEmptyAttributes) {
        errors.push('All attributes and values must be filled.');
      }
      
      if (variations.length === 0 && attributes.length > 0) {
        errors.push('No valid combinations generated. Check your attributes.');
      }
      
      variations.forEach((variant, index) => {
        if (variant.stock === undefined || variant.stock === null || variant.stock < 0) {
          errors.push(`Variation ${index + 1}: Stock is required and must be >= 0.`);
        }
        if (!variant.sku || !variant.sku.trim()) {
          errors.push(`Variation ${index + 1}: SKU is required.`);
        }
      });
    }
    
    return errors;
  }, [hasVariations, hasDuplicateAttributeNames, hasEmptyAttributes, variations]);

  // Update parent when variations or validation change
  useEffect(() => {
    if (onChange) {
      const validationInfo = {
        isValid: validationErrors.length === 0,
        errors: validationErrors,
        getImageFiles: getVariationImageFiles
      };
      notifyChange(attributes, variations, validationInfo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVariations, attributes, variations, validationErrors, notifyChange, getVariationImageFiles]);

  if (!hasVariations) {
    return null;
  }

  return (
    <div className="variation-manager">
      <div className="variation-manager-header">
        <h3>Product Variations</h3>
        <p className="variation-manager-subtitle">
          Define attributes (e.g., Color, Size) and their values. All combinations will be generated automatically.
        </p>
      </div>

      {validationErrors.length > 0 && (
        <div className="variation-validation-errors">
          <strong>Validation Errors:</strong>
          <ul>
            {validationErrors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Attributes Management */}
      <div className="variation-attributes-section">
        <div className="section-header">
          <h4>Variation Attributes</h4>
          <button 
            type="button"
            onClick={handleAddAttribute}
            className="btn-add-attribute"
          >
            <FontAwesomeIcon icon={faPlus} /> Add Attribute
          </button>
        </div>

        {attributes.map((attribute, attrIndex) => (
          <div key={attribute.id} className="attribute-card">
            <div className="attribute-header">
              <input
                type="text"
                placeholder="Attribute name (e.g., Color, Size, Storage)"
                value={attribute.name}
                onChange={(e) => handleAttributeNameChange(attribute.id, e.target.value)}
                className="attribute-name-input"
                maxLength={50}
              />
              {attributes.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveAttribute(attribute.id)}
                  className="btn-remove-attribute"
                  title="Remove attribute"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              )}
            </div>

            <div className="attribute-values">
              <label>Values:</label>
              <div className="values-list">
                {attribute.values.map((value, valueIndex) => (
                  <div key={valueIndex} className="value-input-row">
                    <input
                      type="text"
                      placeholder="Value (e.g., Black, White, Red)"
                      value={value}
                      onChange={(e) => handleValueChange(attribute.id, valueIndex, e.target.value)}
                      className="value-input"
                      maxLength={50}
                    />
                    {attribute.values.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveValue(attribute.id, valueIndex)}
                        className="btn-remove-value"
                        title="Remove value"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddValue(attribute.id)}
                  className="btn-add-value"
                  title="Add value"
                >
                  <FontAwesomeIcon icon={faPlus} /> Add Value
                </button>
              </div>
            </div>
          </div>
        ))}

        {attributes.length === 0 && (
          <div className="empty-state">
            <p>No attributes defined. Click "Add Attribute" to get started.</p>
          </div>
        )}
      </div>

      {/* Generated Variations Table */}
      {variations.length > 0 && (
        <div className="variations-table-section">
          <div className="section-header">
            <h4>Generated Variations ({variations.length} combinations)</h4>
          </div>
          
          <div className="variations-table-wrapper">
            <table className="variations-table">
              <thead>
                <tr>
                  <th>Attributes</th>
                  <th>Price</th>
                  <th>Discount Price</th>
                  <th>Stock</th>
                  <th>SKU</th>
                  <th>Images</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {variations.map((variation, index) => (
                  <tr key={variation.variationId} className={!variation.isActive ? 'variation-inactive' : ''}>
                    <td className="variation-attributes-cell">
                      <div className="variation-attributes-display">
                        {Object.entries(variation.attributes || {}).map(([key, value]) => (
                          <span key={key} className="attribute-badge">
                            <strong>{key}:</strong> {value}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={variation.price ?? ''}
                        onChange={(e) => handleVariationFieldChange(variation.variationId, 'price', e.target.value)}
                        placeholder={basePrice ? basePrice.toString() : '0.00'}
                        min="0"
                        step="0.01"
                        className="variation-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={variation.discountPrice ?? ''}
                        onChange={(e) => handleVariationFieldChange(variation.variationId, 'discountPrice', e.target.value)}
                        placeholder="Optional"
                        min="0"
                        step="0.01"
                        className="variation-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={variation.stock ?? ''}
                        onChange={(e) => handleVariationFieldChange(variation.variationId, 'stock', e.target.value)}
                        placeholder="0"
                        min="0"
                        required
                        className="variation-input stock-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={variation.sku || ''}
                        onChange={(e) => handleVariationFieldChange(variation.variationId, 'sku', e.target.value)}
                        placeholder="Auto-generated"
                        maxLength={50}
                        className="variation-input sku-input"
                      />
                    </td>
                    <td className="variation-images-cell">
                      <div className="variation-images-container">
                        {variation.images && variation.images.length > 0 && (
                          <div className="variation-image-previews">
                            {variation.images.map((img, imgIndex) => (
                              <div key={imgIndex} className="variation-image-preview">
                                <img src={img} alt={`Variation ${index + 1}`} />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariationImage(variation.variationId, imgIndex)}
                                  className="btn-remove-image"
                                  title="Remove image"
                                >
                                  <FontAwesomeIcon icon={faTimes} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <label className="btn-upload-variation-images">
                          <FontAwesomeIcon icon={faImage} />
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleVariationImageChange(variation.variationId, e.target.files)}
                            style={{ display: 'none' }}
                          />
                          Add Images
                        </label>
                      </div>
                    </td>
                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={variation.isActive}
                          onChange={() => handleVariationFieldChange(variation.variationId, 'isActive', true)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariationManager;
