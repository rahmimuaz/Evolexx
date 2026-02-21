// CategoryPage.jsx - SEO-friendly slug-based category page
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaSlidersH } from 'react-icons/fa';
import './CategoryPage.css';
import Footer from '../../components/Footer/Footer';
import { 
  getCategoryFromSlug, 
  getLabelFromSlug, 
  isValidCategorySlug 
} from '../../utils/categoryMap';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const PRODUCTS_PER_PAGE = 12;

const sortOptions = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

const CategoryPage = () => {
  const { slug } = useParams(); // Changed from 'category' to 'slug'
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState('price-asc');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [brandFilter, setBrandFilter] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [animationDirection, setAnimationDirection] = useState('');
  const headingRef = useRef(null);

  // Get the actual database category name from the slug
  const categoryName = getCategoryFromSlug(slug);
  const displayLabel = getLabelFromSlug(slug);

  // Validate slug and redirect if invalid
  useEffect(() => {
    if (!isValidCategorySlug(slug)) {
      // Redirect to homepage or show 404
      navigate('/', { replace: true });
    }
  }, [slug, navigate]);

  useEffect(() => {
    if (!categoryName) return;
    
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Fetch using the actual category name from database
        const res = await fetch(`${API_BASE_URL}/api/products/category/${encodeURIComponent(categoryName)}`);
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data);
        if (data.length > 0) {
          // Use discountPrice if available, otherwise use regular price for price range
          const prices = data.map(p => p.discountPrice || p.price || 0);
          setPriceRange([Math.min(...prices), Math.max(...prices)]);
        }
        setError(null);
      } catch (err) {
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
    // Reset page when category changes
    setCurrentPage(1);
  }, [categoryName]);

  const generateImageUrl = (product) => {
    if (product.images && product.images.length > 0) {
      const image = product.images[0];
      if (image.startsWith('http')) return image;
      if (image.startsWith('/uploads/')) return `${API_BASE_URL}${image}`;
      if (image.startsWith('uploads/')) return `${API_BASE_URL}/${image}`;
      return `${API_BASE_URL}/uploads/${image.replace(/^\//, '')}`;
    }
    return '/logo192.png';
  };

  const getAverageRating = (reviews = []) => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return total / reviews.length;
  };

  const allBrands = Array.from(new Set(products.map(p => p.details?.brand).filter(Boolean)));

  const filteredProducts = products.filter(product => {
    // Use discountPrice for filtering if available, otherwise use regular price
    const price = product.discountPrice || product.price || 0;
    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
    const matchesBrand = !brandFilter || product.details?.brand === brandFilter;
    const matchesStock = !inStockOnly || (product.stock && product.stock > 0);
    return matchesPrice && matchesBrand && matchesStock;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sort === 'price-asc') return (a.price || 0) - (b.price || 0);
    if (sort === 'price-desc') return (b.price || 0) - (a.price || 0);
    if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    return 0;
  });

  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);
  const indexOfLastProduct = currentPage * PRODUCTS_PER_PAGE;
  const indexOfFirstProduct = indexOfLastProduct - PRODUCTS_PER_PAGE;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      const direction = pageNumber > currentPage ? 'slide-left' : 'slide-right';
      setAnimationDirection(direction);
      setTimeout(() => {
        setCurrentPage(pageNumber);
        setAnimationDirection('');
        // Scroll to top so products show at top (works on mobile and desktop)
        setTimeout(() => {
          headingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }, 400);
    }
  };

  const handleBrandChange = (e) => {
    setBrandFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePriceChange = (e, idx) => {
    const val = Number(e.target.value);
    setPriceRange(pr => idx === 0 ? [val, pr[1]] : [pr[0], val]);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
    setCurrentPage(1);
  };

  const handleStockChange = (e) => {
    setInStockOnly(e.target.checked);
    setCurrentPage(1);
  };

  if (error) return <div className="error">{error}</div>;
  if (!categoryName) return null; // Will redirect via useEffect

  return (
    <div className="product-section2">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{displayLabel}</span>
      </nav>

      <div className="heading-with-icon">
        <h2 ref={headingRef}>{displayLabel}</h2>
        <FaSlidersH
          className="filter-toggle-icon"
          onClick={() => setShowFilters(!showFilters)}
          title="Filter & Sort"
        />
      </div>

      {/* Product count */}
      <p className="product-count">
        {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'} found
      </p>

      {showFilters && (
        <div className="filter-sort-bar">
          <div className="filter-group">
            <label>Sort:</label>
            <select value={sort} onChange={handleSortChange}>
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group price-range-group">
            <label>Price:</label>
            <input type="number" value={priceRange[0]} onChange={e => handlePriceChange(e, 0)} className="price-input" />
            <span>-</span>
            <input type="number" value={priceRange[1]} onChange={e => handlePriceChange(e, 1)} className="price-input" />
          </div>

          {allBrands.length > 0 && (
            <div className="filter-group brand-filter-group">
              <label>Brand:</label>
              <select value={brandFilter} onChange={handleBrandChange} className="brand-select-dropdown">
                <option value="">All Brands</option>
                {allBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-group">
            <label className="stock-checkbox-label">
              <input type="checkbox" checked={inStockOnly} onChange={handleStockChange} /> In Stock Only
            </label>
          </div>

          <button onClick={() => setShowFilters(false)} className="nav-info-button filter-done-button">Done</button>
        </div>
      )}

      {loading ? (
        <div className="product-grid-container">
          <div className="product-grid">
            {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, i) => (
              <div className="skeleton-card" key={i}>
                <div className="skeleton skeleton-image" />
                <div className="skeleton-card-body">
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-text" />
                  <div className="skeleton skeleton-text-short" />
                  <div className="skeleton skeleton-stars" />
                  <div className="skeleton skeleton-price" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : currentProducts.length === 0 ? (
        <div className="no-products">
          <p>No products found in this category.</p>
          <Link to="/" className="back-home-link">← Back to Home</Link>
        </div>
      ) : (
        <>
      <div className={`product-grid-container ${animationDirection}`}>
        <div className="product-grid">
          {currentProducts.map(product => {
            const imageUrl = generateImageUrl(product);
            // Use discountPrice as main price if available, otherwise use regular price
            const fullPrice = product.discountPrice || product.price || 0;
            const originalPrice = product.discountPrice ? product.price : null;
            const kokoTotal = fullPrice * 1.12;
            const kokoInstallment = kokoTotal / 3;
                const avgRating = getAverageRating(product.reviews);
                
            return (
              <Link to={`/product/${product.slug || product._id}`} className="product-card" key={product._id}>
                <img src={imageUrl} alt={product.name} onError={e => (e.target.src = '/logo192.png')} />
                <div className="product-card-content">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star}>{avgRating >= star ? '★' : '☆'}</span>
                    ))}
                  </div>
                  <div className="card-footer">
                    {originalPrice ? (
                      <p className="price">
                        <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.875rem', marginRight: '0.5rem' }}>
                          Rs. {originalPrice.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                        </span>
                        <span>Rs. {fullPrice.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                      </p>
                    ) : (
                      <p className="price">
                        Rs. {fullPrice.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                    {product.kokoPay && fullPrice && (
                      <p className="koko-pay">
                        or pay in 3 × Rs. {kokoInstallment.toLocaleString('en-LK', { minimumFractionDigits: 2 })} with <img src="/koko.webp" alt="Koko" className="koko-logo" />
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

          {totalPages > 1 && (
      <div className="pagination-dots2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <div
            key={page}
            className={`dot ${page === currentPage ? 'active' : ''}`}
            onClick={() => handlePageChange(page)}
            title={`Page ${page}`}
          ></div>
        ))}
      </div>
          )}
        </>
      )}
      
      <Footer />
    </div>
  );
};

export default CategoryPage;
