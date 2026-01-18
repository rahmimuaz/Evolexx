// ProductDetail.jsx - Redesigned modern product page
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './ProductDetail.css';
import Footer from '../../components/Footer/Footer';
import { useUser } from '../../context/UserContext';
import Modal from '../../components/Modal/Modal';
import Login from '../../pages/Login/Login';
import Register from '../../pages/Login/Register';
import ReactMarkdown from 'react-markdown';
import { FaShieldAlt, FaTruck, FaUndo, FaHeart, FaRegHeart, FaCheck, FaStar, FaRegStar, FaPlus, FaMinus, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ProductDetail = () => {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [productId, setProductId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const { addToCart } = useCart();
  const { user } = useUser();
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [activeTab, setActiveTab] = useState('DESCRIPTION');
  const [wishlist, setWishlist] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [openAccordion, setOpenAccordion] = useState(null); // Track which accordion is open
  const [hasPurchasedProduct, setHasPurchasedProduct] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState(null); // Selected variation object
  const [selectedVariationAttributes, setSelectedVariationAttributes] = useState({}); // Selected attributes for variation
  const [thumbnailWarning, setThumbnailWarning] = useState(false); // Warning when clicking thumbnail without selecting variations
  const [buttonWarning, setButtonWarning] = useState(''); // Warning message for button actions

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        let response;
        const identifier = slug || id;
        
        if (identifier) {
          // Try slug endpoint first, fallback to ID endpoint
          try {
            response = await axios.get(`${API_BASE_URL}/api/products/p/${identifier}`);
          } catch {
            // Fallback to direct ID lookup
            response = await axios.get(`${API_BASE_URL}/api/products/${identifier}`);
          }
        }
        
        if (response?.data) {
          setProduct(response.data);
          setProductId(response.data._id);
          if (response.data.images && response.data.images.length > 0) {
            setMainImage(response.data.images[0]);
          }
          // Fetch related products from same category
          if (response.data.category) {
            try {
              const relatedRes = await axios.get(`${API_BASE_URL}/api/products/category/${response.data.category}`);
              setRelatedProducts(relatedRes.data.filter(p => p._id !== response.data._id).slice(0, 5));
            } catch {
              setRelatedProducts([]);
            }
          }
        }
        setLoading(false);
      } catch (err) {
        setError('Error fetching product details.');
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug, id, API_BASE_URL]);

  // Scroll to top when product changes (when navigating to a new product)
  useEffect(() => {
    if (product) {
      // Small delay to ensure page has rendered
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [slug, id, product]);

  useEffect(() => {
    if (product && product.images && product.images.length > 0 && !mainImage) {
      setMainImage(product.images[0]);
    }
  }, [product, mainImage]);

  useEffect(() => {
    if (product && productId) {
      axios
        .get(`${API_BASE_URL}/api/products/${productId}/reviews`)
        .then((res) => setReviews(res.data))
        .catch(() => setReviews([]));
    }
  }, [product, productId, API_BASE_URL]);

  // Check if user has purchased this product
  useEffect(() => {
    const checkUserPurchase = async () => {
      if (!user || !productId) {
        setHasPurchasedProduct(false);
        return;
      }

      setCheckingPurchase(true);
      try {
        // Fetch user's orders from both Order and ToBeShipped collections
        const [ordersRes, shippedOrdersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/orders/myorders`, {
            headers: { Authorization: `Bearer ${user.token}` }
          }).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/api/tobeshipped/myorders`, {
            headers: { Authorization: `Bearer ${user.token}` }
          }).catch(() => ({ data: [] }))
        ]);

        const allOrders = [...ordersRes.data, ...shippedOrdersRes.data];
        
        // Check if any order contains this product
        const hasPurchased = allOrders.some(order => {
          if (order.orderItems && Array.isArray(order.orderItems)) {
            return order.orderItems.some(item => {
              // Handle both populated and non-populated product references
              const itemProductId = item.product?._id || item.product;
              return itemProductId && itemProductId.toString() === productId.toString();
            });
          }
          return false;
        });

        setHasPurchasedProduct(hasPurchased);
      } catch (error) {
        console.error('Error checking purchase status:', error);
        setHasPurchasedProduct(false);
      } finally {
        setCheckingPurchase(false);
      }
    };

    checkUserPurchase();
  }, [user, productId, API_BASE_URL]);

  // Helper function to validate if a value is appropriate for an attribute type
  // This helps filter out obviously incorrect values (e.g., color names in storage field)
  const isValidAttributeValue = (attributeName, value) => {
    if (!value || typeof value !== 'string' || value.trim() === '') return false;
    const attrLower = attributeName.toLowerCase().trim();
    const valueLower = value.toLowerCase().trim();
    
    // Only validate storage/memory attributes to reject pure color names
    if (attrLower === 'storage' || attrLower === 'memory' || attrLower.includes('storage') || attrLower.includes('memory')) {
      // Common pure color names (without numbers/units) that shouldn't be in storage
      const pureColorNames = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 'orange', 'gray', 'grey', 'brown', 'gold', 'silver', 'rose'];
      
      // If the value is EXACTLY a color name (and doesn't contain GB/TB/MB), it's likely wrong
      if (pureColorNames.includes(valueLower) && !valueLower.match(/\d+.*(gb|tb|mb)/i)) {
        return false; // Pure color name in storage field is invalid
      }
      
      // Accept values that contain storage units or numbers
      if (valueLower.match(/\d+.*(gb|tb|mb)/i) || valueLower.match(/\d+/)) {
        return true;
      }
    }
    
    // For all other attributes (including color), accept all non-empty values
    return true;
  };

  // Helper function to check if an attribute should be excluded based on product category
  const isAttributeExcluded = (attributeName, productCategory) => {
    const attrLower = attributeName.toLowerCase();
    const category = (productCategory || '').toLowerCase();
    
    // Categories that should NOT have storage attribute
    const noStorageCategories = [
      'mobile accessories', 'chargers', 'phone covers', 'screen protectors',
      'cables', 'headphones', 'earbuds', 'other accessories',
      'smartwatches'
    ];
    
    // If attribute is "storage" or "memory", check if it's appropriate for this category
    if (attrLower === 'storage' || attrLower === 'memory') {
      // Check if category is in the list of categories that shouldn't have storage
      const shouldHideStorage = noStorageCategories.some(cat => 
        category.includes(cat) || cat.includes(category)
      );
      
      if (shouldHideStorage) {
        return true; // Hide storage for mobile accessories, earbuds, etc.
      }
    }
    
    return false; // Keep all other attributes
  };

  useEffect(() => {
    if (product && Array.isArray(product.details?.color) && product.details.color.length > 0) {
      setSelectedColor(product.details.color[0]);
    }
    
    // Initialize variation selection if product has variations
    if (product?.hasVariations && product?.variations && product.variations.length > 0) {
      // Try to find a variation that matches the primary product image
      const primaryImage = product.images && product.images.length > 0 ? product.images[0] : null;
      let matchingVariation = null;
      
      if (primaryImage) {
        // Check if primary image belongs to any variation
        matchingVariation = product.variations.find(v => 
          v.images && v.images.length > 0 && v.images.includes(primaryImage)
        );
      }
      
      // If no match found, use first variation
      const variationToSelect = matchingVariation || product.variations[0];
      setSelectedVariation(variationToSelect);
      
      // Initialize selected attributes from selected variation (with validation and filtering)
      const attrs = {};
      if (variationToSelect.attributes) {
        Object.keys(variationToSelect.attributes).forEach(key => {
          const value = variationToSelect.attributes[key];
          // Only set valid attribute values that are not excluded for this category
          if (isValidAttributeValue(key, value) && !isAttributeExcluded(key, product?.category)) {
            attrs[key] = value;
          }
        });
      }
      setSelectedVariationAttributes(attrs);
      
      // Set main image based on selected variation
      // If the selected variation has images, use the first one
      // Otherwise, if primary image matches this variation, use primary image
      // Otherwise, use primary product image
      if (variationToSelect.images && variationToSelect.images.length > 0) {
        setMainImage(variationToSelect.images[0]);
      } else if (primaryImage && matchingVariation) {
        // Primary image matches this variation, use it
        setMainImage(primaryImage);
      } else if (product.images && product.images.length > 0) {
        // Fallback to primary product image
        setMainImage(product.images[0]);
      }
    } else if (product) {
      // Regular product without variations - initialize basic product details
      // Always set primary product image first
      if (product.images && product.images.length > 0) {
        setMainImage(product.images[0]);
      }
      
      const basicAttrs = {};
      
      // Extract basic product details that might be used as attributes
      if (product.details) {
        // Common attributes that might be in product details
        const attributeFields = ['storage', 'color', 'ram', 'size', 'model'];
        attributeFields.forEach(field => {
          if (product.details[field] && !isAttributeExcluded(field, product?.category)) {
            // Handle both string and array values
            if (Array.isArray(product.details[field])) {
              basicAttrs[field] = product.details[field][0]; // Use first value if array
            } else {
              basicAttrs[field] = product.details[field];
            }
          }
        });
      }
      
      // Set basic attributes if any found
      if (Object.keys(basicAttrs).length > 0) {
        setSelectedVariationAttributes(basicAttrs);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // Get current images (show all images: product images + all variation images)
  const getCurrentImages = () => {
    const allImages = [];
    const imageSet = new Set(); // Use Set to avoid duplicates
    
    // Add product images first
    if (product?.images && product.images.length > 0) {
      product.images.forEach(img => {
        if (!imageSet.has(img)) {
          allImages.push(img);
          imageSet.add(img);
        }
      });
    }
    
    // Add all variation images (from all variations, not just selected)
    if (product?.variations && product.variations.length > 0) {
      product.variations.forEach(variation => {
        if (variation.images && variation.images.length > 0) {
          variation.images.forEach(img => {
            if (!imageSet.has(img)) {
              allImages.push(img);
              imageSet.add(img);
            }
          });
        }
      });
    }
    
    return allImages.length > 0 ? allImages : [];
  };

  const handleQuantityChange = (type) => {
    setQuantity((prev) => {
      const maxStock = selectedVariation?.stock || product?.stock || 99;
      if (type === 'increment' && prev < maxStock) return prev + 1;
      if (type === 'decrement' && prev > 1) return prev - 1;
      return prev;
    });
  };

  // Handle variation attribute selection
  const handleVariationAttributeChange = (attributeName, value) => {
    // Validate the value is appropriate for this attribute before setting
    if (!isValidAttributeValue(attributeName, value)) {
      console.warn(`Invalid value "${value}" for attribute "${attributeName}"`);
      return; // Don't set invalid values
    }

    // Clear warnings when variations are being selected
    setThumbnailWarning(false);
    setButtonWarning('');

    // Create new attributes with the updated value
    const newAttributes = {
      ...selectedVariationAttributes,
      [attributeName]: value
    };
    
    // If another attribute is already selected, check if it's still valid with the new value
    // If not, clear the conflicting attribute (only check non-excluded attributes)
    if (product?.variations) {
      const otherAttrKeys = Object.keys(selectedVariationAttributes).filter(key => 
        key !== attributeName && 
        selectedVariationAttributes[key] && 
        selectedVariationAttributes[key].trim() !== '' &&
        !isAttributeExcluded(key, product?.category) // Only check non-excluded attributes
      );
      
      // Check each other selected attribute to see if it's compatible with the new value
      // Only check combinations with non-excluded attributes
      otherAttrKeys.forEach(otherAttr => {
        const otherValue = selectedVariationAttributes[otherAttr];
        // Check if this combination (new value + other selected value) exists
        // Note: otherAttrKeys is already filtered to exclude storage for mobile accessories
        const combinationExists = product.variations.some(v => {
          if (!v.attributes) return false;
          return v.attributes[attributeName] === value && 
                 v.attributes[otherAttr] === otherValue;
        });
        
        // If combination doesn't exist, clear the incompatible attribute
        if (!combinationExists) {
          delete newAttributes[otherAttr];
        }
      });
    }
    
    setSelectedVariationAttributes(newAttributes);

    // Filter attributes to only include non-excluded ones for matching
    const validAttributesForMatching = {};
    Object.keys(newAttributes).forEach(key => {
      if (newAttributes[key] && newAttributes[key].trim() !== '' && !isAttributeExcluded(key, product?.category)) {
        validAttributesForMatching[key] = newAttributes[key];
      }
    });

    // Find matching variation (only check non-excluded attributes)
    const matchingVariation = product.variations.find(v => {
      if (!v.attributes) return false;
      // Only match on non-excluded attributes
      return Object.keys(validAttributesForMatching).every(key => 
        v.attributes[key] === validAttributesForMatching[key]
      );
    });

    if (matchingVariation) {
      setSelectedVariation(matchingVariation);
      // Update main image to first image of selected variation
      if (matchingVariation.images && matchingVariation.images.length > 0) {
        setMainImage(matchingVariation.images[0]);
      } else if (product.images && product.images.length > 0) {
        // Fallback to product images if variation doesn't have specific images
        setMainImage(product.images[0]);
      }
    } else {
      setSelectedVariation(null);
      // Reset to product images if no matching variation
      if (product.images && product.images.length > 0) {
        setMainImage(product.images[0]);
      }
    }
  };

  // Get available values for an attribute (dynamically filtered based on other selected attributes)
  const getAvailableValues = (attributeName) => {
    const values = new Set();
    const isColor = attributeName.toLowerCase() === 'color';
    
    // Get all other selected attributes (to filter available options dynamically)
    // This works for ANY attribute combination, not just storage -> color
    const otherSelectedAttrs = {};
    Object.keys(selectedVariationAttributes).forEach(key => {
      if (key !== attributeName && selectedVariationAttributes[key] && selectedVariationAttributes[key].trim() !== '') {
        otherSelectedAttrs[key] = selectedVariationAttributes[key];
      }
    });
    
    // Add values from variations (with dynamic filtering based on other selected attributes)
    if (product?.variations) {
      product.variations.forEach(v => {
        if (v.attributes && v.attributes[attributeName]) {
          let shouldInclude = true;
          
          // If other attributes are selected, filter to show only compatible values
          // This works for any attribute combination dynamically
          if (Object.keys(otherSelectedAttrs).length > 0) {
            // Check if this variation matches all other selected attributes
            const matchesOtherAttrs = Object.keys(otherSelectedAttrs).every(key => 
              v.attributes[key] === otherSelectedAttrs[key]
            );
            shouldInclude = matchesOtherAttrs;
          }
          // If no other attributes selected, show all available values for this attribute
          
          if (shouldInclude) {
            const value = v.attributes[attributeName];
            // Only add valid values
            if (isValidAttributeValue(attributeName, value)) {
              values.add(value);
            }
          }
        }
      });
    }
    
    // For color attribute specifically, also include basic product color if it exists (only if no other attributes selected)
    // This helps products without variations but with basic color selection
    if (isColor && product?.details?.color && Object.keys(otherSelectedAttrs).length === 0) {
      if (Array.isArray(product.details.color)) {
        product.details.color.forEach(color => {
          if (isValidAttributeValue(attributeName, color)) {
            values.add(color);
          }
        });
      } else if (typeof product.details.color === 'string') {
        if (isValidAttributeValue(attributeName, product.details.color)) {
          values.add(product.details.color);
        }
      }
    }
    
    return Array.from(values).filter(v => v && v.trim() !== ''); // Filter out empty values
  };

  // Get variation image for a specific attribute value (e.g., get image for "Black" color)
  const getVariationImage = (attributeName, attributeValue) => {
    if (!product?.variations) return null;
    
    // Find variation with this specific attribute value
    const matchingVariation = product.variations.find(v => {
      return v.attributes && v.attributes[attributeName] === attributeValue;
    });
    
    // Return first image from matching variation, or fallback to product image
    if (matchingVariation?.images && matchingVariation.images.length > 0) {
      return matchingVariation.images[0];
    }
    
    // Fallback to main product images
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    
    return null;
  };

  // Get variation object for a specific attribute value
  // eslint-disable-next-line no-unused-vars
  const getVariationForValue = (attributeName, attributeValue) => {
    if (!product?.variations) return null;
    return product.variations.find(v => {
      return v.attributes && v.attributes[attributeName] === attributeValue;
    });
  };

  // Get current stock (from selected variation or product)
  const getCurrentStock = () => {
    // If product has variations, check if the selected combination exists
    if (product?.hasVariations && product?.variations && product.variations.length > 0) {
      if (!doesVariationExist()) {
        return 0; // Variation doesn't exist, no stock
      }
    }
    
    if (selectedVariation) {
      return selectedVariation.stock || 0;
    }
    return product?.stock || 0;
  };

  // Check if all required attributes are selected (only check attributes that should be displayed)
  const areAllAttributesSelected = () => {
    if (!product?.hasVariations || !product?.variations || product.variations.length === 0) {
      return true; // No variations required
    }
    
    // Get all attribute names that exist in variations, but filter out excluded ones
    const requiredAttributes = new Set();
    product.variations.forEach(v => {
      if (v.attributes) {
        Object.keys(v.attributes).forEach(key => {
          // Only include attributes that should be displayed for this product category
          if (!isAttributeExcluded(key, product?.category)) {
            requiredAttributes.add(key);
          }
        });
      }
    });
    
    // Check if all required (non-excluded) attributes have been selected
    return Array.from(requiredAttributes).every(attr => 
      selectedVariationAttributes[attr] && selectedVariationAttributes[attr].trim() !== ''
    );
  };

  // Check if the selected variation combination exists
  const doesVariationExist = () => {
    if (!product?.hasVariations || !product?.variations || product.variations.length === 0) {
      return true; // No variations, so always valid
    }
    
    if (!areAllAttributesSelected()) {
      return true; // Not all attributes selected yet, don't show error
    }
    
    // Filter selected attributes to only include non-excluded ones (for matching)
    const validSelectedAttributes = {};
    Object.keys(selectedVariationAttributes).forEach(key => {
      if (selectedVariationAttributes[key] && selectedVariationAttributes[key].trim() !== '' && !isAttributeExcluded(key, product?.category)) {
        validSelectedAttributes[key] = selectedVariationAttributes[key];
      }
    });
    
    // Check if there's a matching variation with the selected (valid) attributes
    const matchingVariation = product.variations.find(v => {
      if (!v.attributes) return false;
      // Only check non-excluded attributes for matching
      return Object.keys(validSelectedAttributes).every(key => 
        v.attributes[key] === validSelectedAttributes[key]
      );
    });
    
    return !!matchingVariation;
  };

  // Get error message if variation doesn't exist
  const getVariationErrorMessage = () => {
    if (!product?.hasVariations || !product?.variations || product.variations.length === 0) {
      return null;
    }
    
    if (!areAllAttributesSelected()) {
      return null; // Not all attributes selected yet
    }
    
    if (doesVariationExist()) {
      return null; // Variation exists, no error
    }
    
    // Build error message with selected attributes
    const selectedAttrs = Object.entries(selectedVariationAttributes)
      .filter(([_, value]) => value && value.trim() !== '')
      .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
      .join(', ');
    
    return `This combination (${selectedAttrs}) is not available. Please select a different combination.`;
  };

  const handleAddToCart = () => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    if (product) {
      // Check stock first
      if (getCurrentStock() <= 0) {
        setButtonWarning('This product is currently out of stock.');
        setTimeout(() => setButtonWarning(''), 5000);
        return;
      }
      
      // Check if all required attributes are selected (for products with variations)
      if (product.hasVariations && product.variations && product.variations.length > 0) {
        if (!areAllAttributesSelected()) {
          // Get attribute names dynamically for the warning message (only non-excluded attributes)
          const requiredAttrs = new Set();
          product.variations.forEach(v => {
            if (v.attributes) {
              Object.keys(v.attributes).forEach(key => {
                // Only include attributes that should be displayed for this product category
                if (!isAttributeExcluded(key, product?.category)) {
                  requiredAttrs.add(key);
                }
              });
            }
          });
          const attrNames = Array.from(requiredAttrs).map(attr => attr.charAt(0).toUpperCase() + attr.slice(1)).join(', ');
          if (attrNames) {
            setButtonWarning(`Please select all required attributes (${attrNames}) before adding to cart.`);
            setTimeout(() => setButtonWarning(''), 5000);
            return;
          }
        }
        
        // Check if the selected variation combination exists
        if (!doesVariationExist()) {
          setButtonWarning(getVariationErrorMessage() || 'This combination is not available. Please select a different combination.');
          setTimeout(() => setButtonWarning(''), 5000);
          return;
        }
      }
      
      // Clear any warnings before proceeding
      setButtonWarning('');
      
      // Use the exact matching variation
      let variationToAdd = selectedVariation;
      if (product.hasVariations && !variationToAdd && Object.keys(selectedVariationAttributes).length > 0) {
        // Filter selected attributes to only include non-excluded ones (for matching)
        const validSelectedAttributes = {};
        Object.keys(selectedVariationAttributes).forEach(key => {
          if (selectedVariationAttributes[key] && selectedVariationAttributes[key].trim() !== '' && !isAttributeExcluded(key, product?.category)) {
            validSelectedAttributes[key] = selectedVariationAttributes[key];
          }
        });
        
        // Find the matching variation (only check non-excluded attributes)
        const matchingVariation = product.variations.find(v => {
          if (!v.attributes) return false;
          return Object.keys(validSelectedAttributes).every(key => 
            v.attributes[key] === validSelectedAttributes[key]
          );
        });
        variationToAdd = matchingVariation || null;
      }
      
      // Prepare variation with images and all details for cart
      const variationForCart = variationToAdd ? {
        ...variationToAdd,
        selectedAttributes: selectedVariationAttributes,
        // Ensure images are included
        images: variationToAdd.images && variationToAdd.images.length > 0 
          ? variationToAdd.images 
          : (product.images && product.images.length > 0 ? [product.images[0]] : [])
      } : null;
      
      const productToAdd = {
        ...product,
        selectedColor,
        selectedVariation: variationForCart
      };
      addToCart(productToAdd, quantity);
      navigate('/cart');
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    if (product) {
      // Check stock first
      if (getCurrentStock() <= 0) {
        setButtonWarning('This product is currently out of stock.');
        setTimeout(() => setButtonWarning(''), 5000);
        return;
      }
      
      // Check if all required attributes are selected (for products with variations)
      if (product.hasVariations && product.variations && product.variations.length > 0) {
        if (!areAllAttributesSelected()) {
          // Get attribute names dynamically for the warning message (only non-excluded attributes)
          const requiredAttrs = new Set();
          product.variations.forEach(v => {
            if (v.attributes) {
              Object.keys(v.attributes).forEach(key => {
                // Only include attributes that should be displayed for this product category
                if (!isAttributeExcluded(key, product?.category)) {
                  requiredAttrs.add(key);
                }
              });
            }
          });
          const attrNames = Array.from(requiredAttrs).map(attr => attr.charAt(0).toUpperCase() + attr.slice(1)).join(', ');
          if (attrNames) {
            setButtonWarning(`Please select all required attributes (${attrNames}) before buying.`);
            setTimeout(() => setButtonWarning(''), 5000);
            return;
          }
        }
        
        // Check if the selected variation combination exists
        if (!doesVariationExist()) {
          setButtonWarning(getVariationErrorMessage() || 'This combination is not available. Please select a different combination.');
          setTimeout(() => setButtonWarning(''), 5000);
          return;
        }
      }
      
      // Clear any warnings before proceeding
      setButtonWarning('');
      
      // Use the exact matching variation
      let variationToAdd = selectedVariation;
      if (product.hasVariations && !variationToAdd && Object.keys(selectedVariationAttributes).length > 0) {
        // Filter selected attributes to only include non-excluded ones (for matching)
        const validSelectedAttributes = {};
        Object.keys(selectedVariationAttributes).forEach(key => {
          if (selectedVariationAttributes[key] && selectedVariationAttributes[key].trim() !== '' && !isAttributeExcluded(key, product?.category)) {
            validSelectedAttributes[key] = selectedVariationAttributes[key];
          }
        });
        
        // Find the matching variation (only check non-excluded attributes)
        const matchingVariation = product.variations.find(v => {
          if (!v.attributes) return false;
          return Object.keys(validSelectedAttributes).every(key => 
            v.attributes[key] === validSelectedAttributes[key]
          );
        });
        variationToAdd = matchingVariation || null;
      }
      
      // Prepare variation with images and all details for cart
      const variationForCart = variationToAdd ? {
        ...variationToAdd,
        selectedAttributes: selectedVariationAttributes,
        // Ensure images are included
        images: variationToAdd.images && variationToAdd.images.length > 0 
          ? variationToAdd.images 
          : (product.images && product.images.length > 0 ? [product.images[0]] : [])
      } : null;
      
      const productToAdd = {
        ...product,
        selectedColor,
        selectedVariation: variationForCart
      };
      addToCart(productToAdd, quantity);
      navigate('/checkout');
    }
  };

  const handleThumbnailClick = (imagePath) => {
    // Check if variations need to be selected first - show warning but allow click
    if (product?.hasVariations && product?.variations && product.variations.length > 0) {
      // Check if all required attributes are selected
      if (!areAllAttributesSelected()) {
        // Show warning if variations not selected
        setThumbnailWarning(true);
        // Clear warning after 5 seconds
        setTimeout(() => setThumbnailWarning(false), 5000);
      } else {
        // Clear warning if variations are selected
        setThumbnailWarning(false);
      }
    } else {
      // No variations required, clear any warning
      setThumbnailWarning(false);
    }
    
    // Always allow navigation - show warning but don't block
    setMainImage(imagePath);
    
    // If product has variations, try to find which variation this image belongs to
    if (product?.hasVariations && product?.variations) {
      const matchingVariation = product.variations.find(v => {
        return v.images && v.images.includes(imagePath);
      });
      
      if (matchingVariation) {
        // Auto-select this variation and update all details
        setSelectedVariation(matchingVariation);
        
        // Update selected attributes
        const attrs = {};
        if (matchingVariation.attributes) {
          Object.keys(matchingVariation.attributes).forEach(key => {
            attrs[key] = matchingVariation.attributes[key];
          });
        }
        setSelectedVariationAttributes(attrs);
        
        // Clear warnings if variation is auto-selected
        setThumbnailWarning(false);
        setButtonWarning('');
      } else {
        // If image is from main product images, don't clear selection if variations were manually selected
        if (product.images && product.images.includes(imagePath)) {
          // Only clear if no variations were manually selected
          if (!areAllAttributesSelected()) {
            setSelectedVariation(null);
            setSelectedVariationAttributes({});
          }
        }
      }
    }
  };

  // Handle image navigation (left/right arrows)
  const navigateImage = (direction) => {
    const allImages = getCurrentImages();
    if (allImages.length === 0) return;
    
    // Check if variations need to be selected first - show warning but allow navigation
    if (product?.hasVariations && product?.variations && product.variations.length > 0) {
      if (!areAllAttributesSelected()) {
        setThumbnailWarning(true);
        setTimeout(() => setThumbnailWarning(false), 5000);
      } else {
        // Clear warning if all variations are selected
        setThumbnailWarning(false);
      }
    } else {
      // No variations required, clear any warning
      setThumbnailWarning(false);
    }
    
    // Always allow navigation - show warning but don't block
    const currentIndex = allImages.findIndex(img => mainImage === img);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : allImages.length - 1;
    } else {
      newIndex = currentIndex < allImages.length - 1 ? currentIndex + 1 : 0;
    }
    
    const newImage = allImages[newIndex];
    setMainImage(newImage);
    
    // If product has variations, try to find which variation this image belongs to
    if (product?.hasVariations && product?.variations) {
      const matchingVariation = product.variations.find(v => {
        return v.images && v.images.includes(newImage);
      });
      
      if (matchingVariation) {
        // Auto-select this variation and update all details
        setSelectedVariation(matchingVariation);
        
        // Update selected attributes
        const attrs = {};
        if (matchingVariation.attributes) {
          Object.keys(matchingVariation.attributes).forEach(key => {
            attrs[key] = matchingVariation.attributes[key];
          });
        }
        setSelectedVariationAttributes(attrs);
        
        // Clear warnings if variation is auto-selected
        setThumbnailWarning(false);
        setButtonWarning('');
      } else {
        // If image is from main product images, don't clear selection if variations were manually selected
        if (product.images && product.images.includes(newImage)) {
          // Only clear if no variations were manually selected
          if (!areAllAttributesSelected()) {
            setSelectedVariation(null);
            setSelectedVariationAttributes({});
          }
        }
      }
    }
  };

  const cleanImagePath = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('uploads/')) return `${API_BASE_URL}/${imagePath}`;
    if (imagePath.startsWith('/uploads/')) return `${API_BASE_URL}${imagePath}`;
    return `${API_BASE_URL}/uploads/${imagePath}`;
  };

  const currentMainImageUrl = cleanImagePath(mainImage);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    
    // Check if user has purchased the product
    if (!hasPurchasedProduct) {
      setReviewError('You can only review products you have purchased.');
      return;
    }
    
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/products/${productId}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setReviewComment('');
      setReviewRating(5);
      setReviews(prev => [...prev, response.data.review]);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
    : '0';

  // Color mapping for swatches - handles both color names and hex codes
  const getColorHex = (colorValue) => {
    if (!colorValue) return '#cccccc';
    
    // If it's already a hex color code, use it directly
    if (colorValue.startsWith('#')) {
      return colorValue;
    }
    
    // Otherwise, try to match color names
    const colors = {
      'white': '#ffffff', 'black': '#000000', 'red': '#e53935', 'blue': '#1976d2',
      'green': '#388e3c', 'yellow': '#fbc02d', 'gray': '#9e9e9e', 'grey': '#9e9e9e',
      'pink': '#e91e63', 'purple': '#9c27b0', 'orange': '#ff9800', 'brown': '#795548',
      'gold': '#ffd700', 'silver': '#c0c0c0', 'navy': '#001f3f', 'beige': '#f5f5dc',
      'cream': '#fffdd0', 'midnight': '#191970', 'space gray': '#4a4a4a', 'rose gold': '#b76e79'
    };
    return colors[colorValue?.toLowerCase()] || '#cccccc';
  };

  // Convert hex color code to color name (for display in details)
  const hexToColorName = (hexCode) => {
    if (!hexCode || !hexCode.startsWith('#')) return null;
    
    // Normalize hex code (convert to lowercase, remove spaces)
    const normalizedHex = hexCode.toLowerCase().trim();
    
    // Common hex to color name mapping
    const hexToName = {
      '#ffffff': 'White', '#000000': 'Black', '#e53935': 'Red', '#1976d2': 'Blue',
      '#388e3c': 'Green', '#fbc02d': 'Yellow', '#9e9e9e': 'Gray', '#e91e63': 'Pink',
      '#9c27b0': 'Purple', '#ff9800': 'Orange', '#795548': 'Brown', '#ffd700': 'Gold',
      '#c0c0c0': 'Silver', '#001f3f': 'Navy', '#f5f5dc': 'Beige', '#fffdd0': 'Cream',
      '#191970': 'Midnight Blue', '#4a4a4a': 'Space Gray', '#b76e79': 'Rose Gold',
      '#ff0000': 'Red', '#00ff00': 'Green', '#0000ff': 'Blue', '#ffff00': 'Yellow',
      '#ff00ff': 'Magenta', '#00ffff': 'Cyan', '#808080': 'Gray', '#800000': 'Maroon',
      '#008000': 'Green', '#000080': 'Navy', '#800080': 'Purple', '#ffc0cb': 'Pink'
    };
    
    return hexToName[normalizedHex] || null;
  };

  // Check if a value is a hex color code
  const isHexColorCode = (value) => {
    if (!value || typeof value !== 'string') return false;
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value.trim());
  };

  // Add structured data (JSON-LD) for SEO
  useEffect(() => {
    if (!product) return;

    const baseUrl = window.location.origin;
    const productUrl = `${baseUrl}/product/${product.slug || product._id}`;
    const productImage = product.images && product.images[0] 
      ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}/${product.images[0]}`)
      : `${baseUrl}/logo192.png`;
    
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": product.description,
      "image": product.images?.map(img => img.startsWith('http') ? img : `${API_BASE_URL}/${img}`) || [productImage],
      "brand": {
        "@type": "Brand",
        "name": product.details?.brand || "Evolexx"
      },
      "offers": {
        "@type": "Offer",
        "url": productUrl,
        "priceCurrency": "LKR",
        "price": product.discountPrice || product.price,
        "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "Evolexx"
        }
      },
      "category": product.category
    };

    // Add aggregate rating if reviews exist
    if (reviews.length > 0) {
      structuredData.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": averageRating,
        "reviewCount": reviews.length
      };
    }

    // Remove existing structured data script if any
    const existingScript = document.getElementById('product-structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data script
    const script = document.createElement('script');
    script.id = 'product-structured-data';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById('product-structured-data');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [product, reviews, API_BASE_URL]);

  if (loading) return <div className="pd-loading"><div className="pd-spinner"></div></div>;
  if (error) return <div className="pd-error">{error}</div>;
  if (!product) return <div className="pd-not-found">Product not found.</div>;

  return (
    <div className="pd-page">
      {/* Breadcrumb */}
      <div className="pd-breadcrumb">
        <Link to="/">Home</Link>
        <span className="pd-breadcrumb-sep">→</span>
        <Link to={`/category/${product.category?.toLowerCase().replace(/\s+/g, '-')}`}>{product.category}</Link>
        <span className="pd-breadcrumb-sep">→</span>
        <span className="pd-breadcrumb-current">{product.name}</span>
      </div>

      {/* Main Product Section */}
      <div className="pd-main">
        {/* Thumbnails - Vertical */}
        <div className="pd-thumbnails">
          {getCurrentImages().map((img, i) => (
            <div
              key={i}
              className={`pd-thumb ${mainImage === img ? 'active' : ''}`}
              onClick={() => handleThumbnailClick(img)}
            >
              <img src={cleanImagePath(img)} alt={`${product.name} ${i + 1}`} onError={(e) => (e.target.src = '/logo192.png')} />
            </div>
              ))}
            </div>

        {/* Main Image */}
        <div className="pd-main-image">
          {getCurrentImages().length > 1 && (
            <>
              <button 
                className="pd-image-nav pd-image-nav-left" 
                onClick={() => navigateImage('prev')}
                aria-label="Previous image"
                type="button"
              >
                <FaChevronLeft />
              </button>
              <button 
                className="pd-image-nav pd-image-nav-right" 
                onClick={() => navigateImage('next')}
                aria-label="Next image"
                type="button"
              >
                <FaChevronRight />
              </button>
            </>
          )}
          {currentMainImageUrl ? (
            <img 
              src={currentMainImageUrl} 
              alt={product.name} 
              onError={(e) => (e.target.src = '/logo192.png')}
            />
          ) : (
            <div className="pd-no-image">No Image Available</div>
          )}
        </div>

        {/* Product Info */}
        <div className="pd-info">
          {product.details?.brand && <p className="pd-brand">{product.details.brand}</p>}
          <h1 className="pd-title">{product.name}</h1>
          
          <div className="pd-price-row">
            {(() => {
              // Get price from selected variation if available, otherwise use product price
              const currentPrice = selectedVariation?.price || selectedVariation?.discountPrice || product.price;
              const currentDiscountPrice = selectedVariation?.discountPrice || product.discountPrice;
              const basePrice = selectedVariation?.price || product.price;
              
              if (currentDiscountPrice && currentDiscountPrice < basePrice) {
                return (
              <>
                    <span className="pd-current-price">Rs. {currentDiscountPrice?.toLocaleString()}</span>
                    <span className="pd-old-price">Rs. {basePrice?.toLocaleString()}</span>
                    
              </>
                );
              } else {
                return (
                  <span className="pd-current-price">Rs. {currentPrice?.toLocaleString()}</span>
                );
              }
            })()}
          </div>
             {/* Koko Payment Option - Only show if enabled */}
          {product.kokoPay && (
            <div className="pd-koko-payment">
              <span className="pd-koko-text">
              3 x <strong>Rs. {Math.ceil(((() => {
                const currentDiscountPrice = selectedVariation?.discountPrice || product.discountPrice;
                const currentPrice = selectedVariation?.price || product.price;
                return currentDiscountPrice || currentPrice;
              })()) / 3).toLocaleString()}</strong> with <img src="/koko.webp" alt="Koko" className="pd-koko-logo" />
              </span>
            </div>
          )}
          <div className="pd-rating-row">
            <div className="pd-stars">
              {[...Array(5)].map((_, i) => (
                i < Math.floor(averageRating) ? <FaStar key={i} /> : <FaRegStar key={i} />
              ))}
            </div>
            <span className="pd-rating-text">{reviews.length > 0 ? `${averageRating} (${reviews.length} reviews)` : 'No reviews yet'}</span>
            </div>
          <p className="pd-description">{product.description}</p>

          {/* Variations Selection */}
          {product.hasVariations && product.variations && product.variations.length > 0 ? (
            <div className="pd-variations-section">
              {(() => {
                // Get all unique attribute names from variations
                const attributeNames = new Set();
                product.variations.forEach(v => {
                  if (v.attributes) {
                    Object.keys(v.attributes).forEach(key => attributeNames.add(key));
                  }
                });
                
                // Filter out inappropriate attributes based on category
                // This prevents showing "storage" for mobile accessories, etc.
                const validAttributes = Array.from(attributeNames).filter(attrName => {
                  // Use the same isAttributeExcluded function for consistency
                  return !isAttributeExcluded(attrName, product?.category);
                });
                
                return validAttributes;
              })().map((attrName, index, array) => {
                // Get all available values for this attribute (unfiltered) - for storage and first attribute, show all
                const isColor = attrName.toLowerCase() === 'color';
                const isStorage = attrName.toLowerCase() === 'storage';
                
                // For storage: always show all options (no filtering)
                // For color: filter based on selected storage
                // For other attributes: show all options
                const availableValues = getAvailableValues(attrName);
                
                // Get ALL values for this attribute (for display purposes - to show what's available in product)
                const allValuesForAttribute = (() => {
                  const values = new Set();
                  if (product?.variations) {
                    product.variations.forEach(v => {
                      if (v.attributes && v.attributes[attrName]) {
                        const value = v.attributes[attrName];
                        if (isValidAttributeValue(attrName, value) && value && value.trim() !== '') {
                          values.add(value);
                        }
                      }
                    });
                  }
                  return Array.from(values).sort();
                })();
                
                // For storage: always use all values (no filtering)
                // For color: use filtered values when storage is selected
                // For other attributes: use filtered values when other attributes are selected
                const displayValues = isStorage ? allValuesForAttribute : availableValues;
                
                return (
                  <div key={attrName} className="pd-option-section">
                    <p className="pd-option-label">
                      {selectedVariationAttributes[attrName] 
                        ? `${attrName.charAt(0).toUpperCase() + attrName.slice(1)}: ${selectedVariationAttributes[attrName]}`
                        : `Select ${attrName.charAt(0).toUpperCase() + attrName.slice(1)}`
                      }
                      {!selectedVariation && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
                    </p>
                        {isColor ? (
                          <div className="pd-variant-thumbnails">
                            {displayValues.map((value, idx) => {
                              const variantImage = getVariationImage(attrName, value);
                              const isSelected = selectedVariationAttributes[attrName] === value;
                              return (
                                <button
                                  key={idx}
                                  className={`pd-variant-thumbnail ${isSelected ? 'active' : ''}`}
                                  onClick={() => handleVariationAttributeChange(attrName, value)}
                                  title={value}
                                  style={{
                                    position: 'relative',
                                    width: '60px',
                                    height: '60px',
                                    padding: '2px',
                                    border: `1px solid ${isSelected ? '#000000' : '#e5e7eb'}`,
                                    borderRadius: '4px',
                                    background: 'white',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {variantImage ? (
                                    <>
                                      <img 
                                        src={cleanImagePath(variantImage)} 
                                        alt={value}
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover',
                                          borderRadius: '2px',
                                          display: 'block'
                                        }}
                                        onError={(e) => {
                                          // Fallback to color swatch if image fails to load
                                          const imgElement = e.target;
                                          const fallbackDiv = imgElement.nextElementSibling;
                                          imgElement.style.display = 'none';
                                          if (fallbackDiv) {
                                            fallbackDiv.style.display = 'block';
                                          }
                                        }}
                                      />
                                      <div
                                        style={{
                                          display: 'none',
                                          width: '100%',
                                          height: '100%',
                                          backgroundColor: getColorHex(value),
                                          borderRadius: '2px',
                                          position: 'absolute',
                                          top: 0,
                                          left: 0
                                        }}
                                      />
                                    </>
                                  ) : (
                                    <div
                                      style={{
                                        display: 'block',
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: getColorHex(value),
                                        borderRadius: '2px'
                                      }}
                                    />
                                  )}
                                  {isSelected && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        bottom: '4px',
                                        right: '4px',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        background: '#000000',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid white',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                      }}
                                    >
                                      <FaCheck style={{ color: 'white', fontSize: '0.65rem' }} />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="pd-variation-options" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {displayValues.map((value, idx) => {
                              const isSelected = selectedVariationAttributes[attrName] === value;
                              // For storage: all options are always available and clickable (always show all variations)
                              // For color: only show compatible colors (hide incompatible ones, don't just disable them)
                              const isAvailable = isStorage ? true : availableValues.includes(value);
                              
                              // Hide unavailable colors (don't show grayed out buttons), but always show all storage options
                              if (!isStorage && !isAvailable) {
                                return null;
                              }
                              
                              return (
                                <button
                                  key={idx}
                                  className={`pd-variation-option ${isSelected ? 'active' : ''}`}
                                  onClick={() => handleVariationAttributeChange(attrName, value)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    border: `2px solid ${isSelected ? '#000000' : '#d1d5db'}`,
                                    borderRadius: '4px',
                                    background: isSelected ? '#000000' : '#fff',
                                    color: isSelected ? '#fff' : '#333',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: isSelected ? 600 : 400,
                                    transition: 'all 0.2s'
                                  }}
                                  title={value}
                                >
                                  {value}
                                </button>
                              );
                            })}
                          </div>
                        )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Legacy Color Selection */
            Array.isArray(product.details?.color) && product.details.color.length > 0 && (
            <div className="pd-option-section">
              <p className="pd-option-label">Select color</p>
              <div className="pd-color-swatches">
                {product.details.color.map((color, idx) => (
                  <button
                    key={idx}
                    className={`pd-color-swatch ${selectedColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: getColorHex(color) }}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                          >
                    {selectedColor === color && <FaCheck className="pd-swatch-check" />}
                  </button>
                ))}
              </div>
            </div>
            )
          )}

          {/* Quantity & Wishlist */}
          <div className="pd-quantity-row">
            <div className="pd-quantity">
              <button onClick={() => handleQuantityChange('decrement')}>−</button>
              <span>{quantity}</span>
              <button onClick={() => handleQuantityChange('increment')}>+</button>
            </div>
            <button className="pd-wishlist-btn" onClick={() => setWishlist(!wishlist)}>
              {wishlist ? <FaHeart /> : <FaRegHeart />}
            </button>
            {/* Stock Status */}
          <div className="pd-stock-status">
            {getCurrentStock() > 0 ? (
              <span className="pd-in-stock">
                <FaCheck /> In stock ({getCurrentStock()} available)
              </span>
            ) : (
              <span className="pd-out-stock">
                {product.hasVariations && !selectedVariation 
                  ? 'Please select a variation to check availability' 
                  : 'Out of stock'}
              </span>
            )}
          </div>
          </div>

          {/* Variation Error/Warning Messages */}
          {product.hasVariations && product.variations && product.variations.length > 0 && (
            <>
              {/* Variation combination error */}
              {getVariationErrorMessage() && (
                <div className="pd-variation-error">
                  <span className="pd-error-icon">⚠</span>
                  <span className="pd-error-text">{getVariationErrorMessage()}</span>
                </div>
              )}
              {/* Thumbnail navigation warning */}
              {thumbnailWarning && !getVariationErrorMessage() && (
                <div className="pd-variation-error pd-variation-warning">
                  <span className="pd-error-icon">⚠</span>
                  <span className="pd-error-text">
                    {(() => {
                      // Get attribute names dynamically for the warning message
                      const requiredAttrs = new Set();
                      if (product?.variations) {
                        product.variations.forEach(v => {
                          if (v.attributes) {
                            Object.keys(v.attributes).forEach(key => requiredAttrs.add(key));
                          }
                        });
                      }
                      const attrNames = Array.from(requiredAttrs).map(attr => attr.charAt(0).toUpperCase() + attr.slice(1)).join(', ');
                      return `Please select variations (${attrNames}) before viewing other images.`;
                    })()}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Add to Cart & Buy Now */}
          <div className="pd-actions">
            <button 
              className="pd-add-cart-btn" 
              onClick={handleAddToCart}
            >
              ADD TO CART
            </button>
            <button 
              className="pd-buy-now-btn" 
              onClick={handleBuyNow}
            >
              BUY NOW
            </button>
          </div>
          
          {/* Button Action Warning Message */}
          {buttonWarning && (
            <div className="pd-variation-error pd-button-warning">
              <span className="pd-error-icon">⚠</span>
              <span className="pd-error-text">{buttonWarning}</span>
            </div>
          )}

          

          {/* Policy Accordion */}
          <div className="pd-policy-accordion">
            <div className="pd-accordion-item">
              <button 
                className="pd-accordion-header"
                onClick={() => setOpenAccordion(openAccordion === 'security' ? null : 'security')}
              >
                <div className="pd-accordion-title-wrapper">
                  <FaShieldAlt className="pd-accordion-icon" />
                  <span className="pd-accordion-title">Security Policy</span>
                </div>
                {openAccordion === 'security' ? <FaMinus /> : <FaPlus />}
              </button>
              {openAccordion === 'security' && (
                <div className="pd-accordion-content">
                  <p>Safe & Secure Checkout</p>
                  <p>Your payment information is encrypted and secure. We use industry-standard SSL encryption to protect your data during checkout.</p>
                </div>
              )}
            </div>

            <div className="pd-accordion-item">
              <button 
                className="pd-accordion-header"
                onClick={() => setOpenAccordion(openAccordion === 'delivery' ? null : 'delivery')}
              >
                <div className="pd-accordion-title-wrapper">
                  <FaTruck className="pd-accordion-icon" />
                  <span className="pd-accordion-title">Delivery Policy</span>
                </div>
                {openAccordion === 'delivery' ? <FaMinus /> : <FaPlus />}
              </button>
              {openAccordion === 'delivery' && (
                <div className="pd-accordion-content">
                  <p>Island-wide delivery within 3-7 days</p>
                  <p>We deliver to all locations across Sri Lanka. Standard delivery takes 3-7 business days. Express delivery options are available for major cities.</p>
                </div>
              )}
            </div>

            <div className="pd-accordion-item">
              <button 
                className="pd-accordion-header"
                onClick={() => setOpenAccordion(openAccordion === 'return' ? null : 'return')}
              >
                <div className="pd-accordion-title-wrapper">
                  <FaUndo className="pd-accordion-icon" />
                  <span className="pd-accordion-title">Return Policy</span>
                </div>
                {openAccordion === 'return' ? <FaMinus /> : <FaPlus />}
              </button>
              {openAccordion === 'return' && (
                <div className="pd-accordion-content">
                  <p>7-day hassle-free returns</p>
                  <p>Not satisfied with your purchase? Return it within 7 days of delivery for a full refund. Items must be in original condition with all packaging intact.</p>
                </div>
              )}
            </div>
          </div>
        </div>
          </div>

      {/* Tabs */}
      <div className="pd-tabs">
        {['DESCRIPTION', 'DETAILS', 'COMMENTS'].map(tab => (
          <button
            key={tab}
            className={`pd-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
        </div>

      {/* Tab Content */}
      <div className="pd-tab-content">
        {activeTab === 'DESCRIPTION' && (
          <div className="pd-description-content">
            {product.longDescription ? (() => {
              // Process markdown to remove excessive blank lines
              const processedMarkdown = product.longDescription
                .split('\n')
                .reduce((acc, line, index, array) => {
                  const prevLine = array[index - 1];
                  const nextLine = array[index + 1];
                  
                  // Match list items: - * + or numbered lists
                  const prevIsListItem = prevLine && (/^[\s]*[-*+]\s/.test(prevLine.trim()) || /^[\s]*\d+\.\s/.test(prevLine.trim()));
                  const nextIsListItem = nextLine && (/^[\s]*[-*+]\s/.test(nextLine.trim()) || /^[\s]*\d+\.\s/.test(nextLine.trim()));
                  
                  // If current line is blank and it's between list items, skip it
                  if (line.trim() === '' && (prevIsListItem && nextIsListItem)) {
                    return acc;
                  }
                  
                  // If current line is blank and previous is a list item, skip it
                  if (line.trim() === '' && prevIsListItem) {
                    return acc;
                  }
                  
                  // Remove multiple consecutive blank lines (keep only one)
                  if (line.trim() === '' && acc[acc.length - 1] === '') {
                    return acc;
                  }
                  
                  acc.push(line);
                  return acc;
                }, [])
                .join('\n');
              
              return (
                <ReactMarkdown 
                  components={{
                    p: ({node, ...props}) => {
                      // Check if paragraph is inside a list item
                      const isInList = node?.parent?.tagName === 'li';
                      if (isInList) {
                        // For paragraphs inside list items, render as span to avoid any block-level spacing
                        return <span style={{display: 'inline'}} {...props} />;
                      }
                      // Reduce paragraph spacing significantly
                      return <p style={{
                        marginBottom: '0.75em', 
                        marginTop: '0',
                        lineHeight: '1.6'
                      }} {...props} />;
                    },
                    h1: ({node, children, ...props}) => <h1 style={{marginTop: '1.2em', marginBottom: '0.4em'}} {...props}>{children}</h1>,
                    h2: ({node, children, ...props}) => <h2 style={{marginTop: '1.2em', marginBottom: '0.4em'}} {...props}>{children}</h2>,
                    h3: ({node, children, ...props}) => <h3 style={{marginTop: '1.2em', marginBottom: '0.4em'}} {...props}>{children}</h3>,
                    ul: ({node, ...props}) => {
                      // Check if this list follows a heading or paragraph
                      const prevSibling = node?.previousSibling;
                      const isAfterHeading = prevSibling && (prevSibling.tagName === 'h1' || prevSibling.tagName === 'h2' || prevSibling.tagName === 'h3' || prevSibling.tagName === 'p');
                      return <ul style={{
                        marginTop: isAfterHeading ? '4px' : '0.3em', 
                        marginBottom: '0.3em', 
                        paddingLeft: '1.5em'
                      }} {...props} />;
                    },
                    ol: ({node, ...props}) => {
                      // Check if this list follows a heading or paragraph
                      const prevSibling = node?.previousSibling;
                      const isAfterHeading = prevSibling && (prevSibling.tagName === 'h1' || prevSibling.tagName === 'h2' || prevSibling.tagName === 'h3' || prevSibling.tagName === 'p');
                      return <ol style={{
                        marginTop: isAfterHeading ? '4px' : '0.3em', 
                        marginBottom: '0.3em', 
                        paddingLeft: '1.5em'
                      }} {...props} />;
                    },
                    li: ({node, ...props}) => <li style={{
                      margin: '0',
                      padding: '0',
                      marginTop: '0', 
                      marginBottom: '0',
                      paddingTop: '2px',
                      paddingBottom: '2px',
                      lineHeight: '1.5'
                    }} {...props} />,
                    strong: ({node, ...props}) => <strong style={{fontWeight: '600'}} {...props} />,
                    em: ({node, ...props}) => <em style={{fontStyle: 'italic'}} {...props} />,
                  }}
                >
                  {processedMarkdown}
                </ReactMarkdown>
              );
            })() : (
              <p>{product.description}</p>
            )}
          </div>
        )}

        {activeTab === 'DETAILS' && (
          <div className="pd-details-content">
            {product.details ? (
              <table className="pd-specs-table">
                <tbody>
                {Object.entries(product.details).map(([key, value]) => {
                  // Skip color field if it's a hex code (user-friendly display handled in variations)
                  if (key.toLowerCase() === 'color' && isHexColorCode(value)) {
                    // Try to convert hex to color name
                    const colorName = hexToColorName(value);
                    // If we can't convert it, hide this field from details table
                    if (!colorName) {
                      return null;
                    }
                    // If we can convert it, use the color name instead
                    value = colorName;
                  }
                  
                  // Format the value for display
                  let displayValue = value;
                  
                  // Handle boolean values (toggle fields) - show "Yes" or "No"
                  if (typeof value === 'boolean') {
                    displayValue = value ? 'Yes' : 'No';
                  }
                  // Handle arrays
                  else if (Array.isArray(value)) {
                    // Check if array contains hex codes for color field
                    if (key.toLowerCase() === 'color') {
                      displayValue = value.map(v => {
                        if (isHexColorCode(v)) {
                          const colorName = hexToColorName(v);
                          return colorName || v; // Use color name if available, otherwise keep original
                        }
                        return v;
                      }).join(', ');
                    } else {
                      displayValue = value.join(', ');
                    }
                  }
                  // Handle string values - check if it's a hex code
                  else if (typeof value === 'string' && key.toLowerCase() === 'color' && isHexColorCode(value)) {
                    const colorName = hexToColorName(value);
                    displayValue = colorName || value;
                  }
                  else {
                    displayValue = value;
                  }
                  
                  return (
                    <tr key={key}>
                      <td className="pd-spec-key">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}</td>
                      <td className="pd-spec-value">{displayValue}</td>
                    </tr>
                  );
                }).filter(Boolean)}
                  <tr>
                    <td className="pd-spec-key">Warranty</td>
                    <td className="pd-spec-value">{product.warrantyPeriod || 'No Warranty'}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p>No specifications available.</p>
            )}
          </div>
        )}

        {activeTab === 'COMMENTS' && (
          <div className="pd-comments-content">
            <div className="pd-comments-grid">
              {/* Reviews List */}
              <div className="pd-reviews-list">
                <h3>{reviews.length} REVIEW{reviews.length !== 1 ? 'S' : ''}</h3>
                <div className="pd-reviews-avg">
                  <div className="pd-stars">
                    {[...Array(5)].map((_, i) => (
                      i < Math.floor(averageRating) ? <FaStar key={i} /> : <FaRegStar key={i} />
                    ))}
                  </div>
                  <span>{averageRating}/5</span>
                </div>

                {reviews.length === 0 ? (
                  <p className="pd-no-reviews">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map((review, idx) => (
                    <div key={idx} className="pd-review-item">
                      <div className="pd-review-avatar">
                        {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="pd-review-content">
                        <div className="pd-review-header">
                          <span className="pd-review-name">{review.user?.name || 'Anonymous'}</span>
                          <div className="pd-review-stars">
                            {[...Array(5)].map((_, i) => (
                              i < review.rating ? <FaStar key={i} /> : <FaRegStar key={i} />
                            ))}
                            <span>({review.rating}/5)</span>
                          </div>
                        </div>
                        <p className="pd-review-text">{review.comment}</p>
                        <span className="pd-review-date">
                          {review.date ? new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>
                  </div>
                  ))
                )}
              </div>

              {/* Write Review Form */}
              <div className="pd-write-review">
                <h3>WRITE YOUR REVIEW</h3>
                {!user ? (
                  <p className="pd-login-notice">Please log in to submit a review.</p>
                ) : checkingPurchase ? (
                  <p className="pd-checking-purchase">Checking purchase status...</p>
                ) : !hasPurchasedProduct ? (
                  <div className="pd-purchase-required">
                    <p className="pd-purchase-message">
                      You must purchase this product before you can write a review.
                    </p>
                    <p className="pd-purchase-hint">
                      Only customers who have purchased this product can submit reviews.
                    </p>
                  </div>
                ) : (
                <form onSubmit={handleReviewSubmit}>
                  <div className="pd-form-group">
                    <label>Your Rating*</label>
                    <div className="pd-rating-select">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          className={reviewRating >= star ? 'active' : ''}
                          onClick={() => setReviewRating(star)}
                        >
                          {reviewRating >= star ? <FaStar /> : <FaRegStar />}
                        </button>
                    ))}
                    </div>
                </div>
                  <div className="pd-form-group">
                    <label>Write your review*</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                  required
                      rows={4}
                />
                  </div>
                  <button type="submit" className="pd-submit-review" disabled={reviewSubmitting}>
                    {reviewSubmitting ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
                </button>
                  {reviewError && <p className="pd-review-error">{reviewError}</p>}
              </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="pd-related">
          <h2 className="pd-related-title">RELATED PRODUCTS</h2>
          <div className="pd-related-grid">
            {relatedProducts.map(rp => (
              <Link 
                to={`/product/${rp.slug || rp._id}`} 
                key={rp._id} 
                className="pd-related-card"
                onClick={() => {
                  // Scroll to top immediately when clicking related product
                  window.scrollTo({ top: 0, behavior: 'auto' });
                }}
              >
                <div className="pd-related-img">
                  <img src={cleanImagePath(rp.images?.[0])} alt={rp.name} onError={(e) => (e.target.src = '/logo192.png')} />
          </div>
                <div className="pd-related-info">
                  <p className="pd-related-brand">{rp.details?.brand || rp.category}</p>
                  <p className="pd-related-name">{rp.name}</p>
                  <div className="pd-related-price">
                    {rp.discountPrice ? (
                      <>
                        <span className="pd-related-current">Rs. {rp.discountPrice?.toLocaleString()}</span>
                        <span className="pd-related-old">Rs. {rp.price?.toLocaleString()}</span>
                        
                      </>
                    ) : (
                      <span className="pd-related-current">Rs. {rp.price?.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          </div>
        )}

      <Footer />

      {/* Modals */}
      <Modal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} title="Login">
        <Login
          asModal
          sourcePage="productDetail"
          onSuccess={() => setLoginModalOpen(false)}
          onSwitchRegister={() => { setLoginModalOpen(false); setRegisterModalOpen(true); }}
        />
      </Modal>
      <Modal isOpen={registerModalOpen} onClose={() => setRegisterModalOpen(false)} title="Register">
        <Register
          asModal
          onSuccess={() => setRegisterModalOpen(false)}
          onSwitchLogin={() => { setRegisterModalOpen(false); setLoginModalOpen(true); }}
        />
      </Modal>
    </div>
  );
};

export default ProductDetail;
