import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';
import axios from 'axios';
import { FaSlidersH } from 'react-icons/fa';
import Footer from '../../components/Footer/Footer';


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Homepage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [animationDirection, setAnimationDirection] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const productsPerPage = 12;
  const productSectionRef = useRef(null);
  const headingRef = useRef(null);
  const categorySectionRef = useRef(null);
  const [categoryVisible, setCategoryVisible] = useState(true);

  const sortOptions = [
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
  ];
  const [sort, setSort] = useState('price-asc');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [brandFilter, setBrandFilter] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const prices = products.map(p => p.price || 0);
      setPriceRange([Math.min(...prices), Math.max(...prices)]);
    }
  }, [products]);

  // Intersection Observer for category section animation - triggers every time it enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Reset to trigger animation every time
            setCategoryVisible(false);
            // Use requestAnimationFrame for better timing
            requestAnimationFrame(() => {
              setTimeout(() => {
                setCategoryVisible(true);
              }, 50);
            });
          } else {
            // Reset when out of view
            setCategoryVisible(false);
          }
        });
      },
      { 
        threshold: 0.15,
        rootMargin: '50px'
      }
    );

    const currentRef = categorySectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);





  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products`);
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Error fetching products. Please try again later.');
      setLoading(false);
    }
  };

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

  const allBrands = Array.from(new Set(products.map(p => p.details?.brand).filter(Boolean)));

  const filteredProducts = products.filter(product => {
    const price = product.price || 0;
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

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      const direction = pageNumber > currentPage ? 'slide-left' : 'slide-right';
      setAnimationDirection(direction);

      setTimeout(() => {
        setCurrentPage(pageNumber);
        setAnimationDirection('');

        if (headingRef.current) {
          const topPos = headingRef.current.getBoundingClientRect().top + window.pageYOffset;
          const offset = 80;
          window.scrollTo({ top: topPos - offset, behavior: 'smooth' });
        }
      }, 400);
    }
  };

  const handleBrandChange = (event) => {
    const selectedBrand = event.target.value;
    setBrandFilter(selectedBrand);
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

  const getAverageRating = (reviews = []) => {
  if (!reviews.length) return 0;
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return total / reviews.length;
};


  if (loading) return <div className="loader">Loading products...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="home">
      {/* Hero Section with Video Background */}
      <section className="banner">
        {/* Video Background */}
        <div className="hero-video-container">
          <video 
            className="hero-video" 
            autoPlay 
            muted 
            loop 
            playsInline
            poster="/BrandNewPhone.jpg" // Fallback image while video loads
          >
            <source src="/hero-video.mp4" type="video/mp4" />
            <source src="/hero-video.webm" type="video/webm" />
            {/* Fallback for browsers that don't support video */}
            Your browser does not support the video tag.
          </video>
          <div className="hero-video-overlay"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-text">
            <div className="brand-logo-container">
              <svg className="hero-apple-logo" viewBox="0 0 24 24" fill="white">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            </div>
            <h1 className="hero-title-line1">The Future of Design.</h1>
            <h1 className="hero-title-line2">In Your Hands</h1>
            <p className="hero-subtitle">New iPhone Series - Sleeker. Smarter. Stronger.</p>
            <button className="hero-cta-button">
              <span className="cta-text">BUY NOW</span>
              <span className="cta-arrow">→</span>
            </button>
          </div>
          <div className="hero-product-display">
            <img src="/iPhone17ProMax.jpg" alt="iPhone 17 Pro" className="hero-product-image" />
          </div>
        </div>
      </section>

      <section className="category-section" ref={categorySectionRef}>
        <div className={`category-heading ${categoryVisible ? 'visible' : ''}`}>
          <h2>Categories</h2>
        </div>
        <div className={`category-grid-custom ${categoryVisible ? 'visible' : ''}`}>
          <Link to="/category/Mobile%20Phone" className="category-card tall">
            <img src="/BrandNewPhone.jpg" alt="Sound System" />
            <div className="overlay-blur-bg"></div>
            <div className="overlay-text bottom"><p>Brand New Phone</p></div>
          </Link>
          <Link to="/category/Preowned%20Phones" className="category-card square">
            <img src="/PreOwnedPhone.jpg" alt="Smart Watch" />
            <div className="overlay-blur-bg"></div>
            <div className="overlay-text bottom"><p>Pre Owned Phone</p></div>
          </Link>
          <Link to="/category/Laptops" className="category-card square">
            <img src="/Laptop.jpg" alt="Tablet" />
            <div className="overlay-blur-bg"></div>
            <div className="overlay-text bottom"><p>Laptop</p></div>
          </Link>
          <Link to="/category/Mobile%20Accessories" className="category-card wide">
            <img src="/MobileAccessories.jpg" alt="Game Controller" />
            <div className="overlay-blur-bg"></div>
            <div className="overlay-text bottom"><p>Accessories</p></div>
          </Link>
        </div>
      </section>

      <section className="product-section" ref={productSectionRef}>
        <div className="heading-with-icon">
          <h2 ref={headingRef}>All Products</h2>
          <FaSlidersH
            className="filter-toggle-icon"
            onClick={() => setShowFilters(!showFilters)}
            title="Filter & Sort"
          />
        </div>

        {showFilters && (
          <div className="filter-sort-bar">
            <div className="filter-group">
              <label htmlFor="sort-select">Sort:</label>
              <select id="sort-select" value={sort} onChange={handleSortChange}>
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group price-range-group">
              <label>Price:</label>
              <input type="number" min="0" value={priceRange[0]} onChange={e => handlePriceChange(e, 0)} className="price-input" />
              <span>-</span>
              <input type="number" min="0" value={priceRange[1]} onChange={e => handlePriceChange(e, 1)} className="price-input" />
            </div>

            {allBrands.length > 0 && (
              <div className="filter-group brand-filter-group">
                <label htmlFor="brand-select">Brand:</label>
                <div className="brand-dropdown-container">
                  <select
                    id="brand-select"
                    value={brandFilter}
                    onChange={handleBrandChange}
                    className="brand-select-dropdown"
                  >
                    <option value="">All</option>
                    {allBrands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
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

        <div className={`product-grid-container ${animationDirection}`}>
          <div className="product-grid">
            {currentProducts.map((product) => {
              const imageUrl = generateImageUrl(product);
              const fullPrice = product.price || 0;
              const kokoTotal = fullPrice * 1.12;
              const kokoInstallment = kokoTotal / 3;

              return (
                <Link to={`/products/${product._id}`} className="product-card" key={product._id}>
                  <img src={imageUrl} alt={product.name} onError={(e) => (e.target.src = '/logo192.png')} />
                  <div className="product-card-content">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                   <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star}>
                       {getAverageRating(product.reviews) >= star ? '★' : '☆'}
                      </span>
                      ))}
                    </div>
                    <div className="card-footer">
                      <p className="price">
                        Rs. {fullPrice.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </p>
                      {product.kokoPay && product.price && (
                        <p className="koko-pay">
                           pay in 3 × Rs.{" "}
                          {kokoInstallment.toLocaleString("en-LK", { minimumFractionDigits: 2 })}{" "}
                          with <img src="/koko.webp" alt="Koko" className="koko-logo" />
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="pagination-dots">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <div
              key={page}
              className={`dot ${page === currentPage ? 'active' : ''}`}
              onClick={() => handlePageChange(page)}
              title={`Page ${page}`}
            ></div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Homepage;
