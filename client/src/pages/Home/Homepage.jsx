import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';
import axios from 'axios';
import { FaSlidersH } from 'react-icons/fa';
import Footer from '../../components/Footer/Footer';


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Homepage = () => {
  const [products, setProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [animationDirection, setAnimationDirection] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const productsPerPage = 12;
  const productSectionRef = useRef(null);
  const headingRef = useRef(null);
  const categorySectionRef = useRef(null);
  const newArrivalsSectionRef = useRef(null);
  const [categoryVisible, setCategoryVisible] = useState(true);
  const [newArrivalsVisible, setNewArrivalsVisible] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(2); // Start at center

  // Touch/swipe state for carousel
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  // Touch handlers for carousel swipe
  const onTouchStart = (e) => {
    setTouchEnd(null); // Reset touch end
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e) => {
    if (!touchStart || !touchEnd) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && carouselIndex < newArrivals.length - 1) {
      // Swipe left - go to next
      e.preventDefault(); // Prevent link click
      setCarouselIndex(prev => Math.min(newArrivals.length - 1, prev + 1));
    } else if (isRightSwipe && carouselIndex > 0) {
      // Swipe right - go to previous
      e.preventDefault(); // Prevent link click
      setCarouselIndex(prev => Math.max(0, prev - 1));
    }
    
    // Reset touch states
    setTouchStart(null);
    setTouchEnd(null);
  };

  const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
  ];
  const [sort, setSort] = useState('default');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [brandFilter, setBrandFilter] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      // Use discountPrice if available, otherwise use regular price for price range
      const prices = products.map(p => p.discountPrice || p.price || 0);
      setPriceRange([Math.min(...prices), Math.max(...prices)]);
    }
  }, [products]);

  // Intersection Observer for category section animation - triggers every time it enters viewport
  useEffect(() => {
    let isMounted = true;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!isMounted) return;
          if (entry.isIntersecting) {
            setCategoryVisible(false);
            requestAnimationFrame(() => {
              if (isMounted) {
                setTimeout(() => {
                  if (isMounted) {
                    setCategoryVisible(true);
                  }
                }, 50);
              }
            });
          } else {
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
      isMounted = false;
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);





  const fetchProducts = async () => {
    try {
      // Fetch products first (required)
      const productsRes = await axios.get(`${API_BASE_URL}/api/products`);
      setProducts(productsRes.data);
      
      // Use newest products as new arrivals (sorted by creation date)
      const sortedByDate = [...productsRes.data].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setNewArrivals(sortedByDate.slice(0, 7));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Error fetching products. Please try again later.');
      setLoading(false);
    }
  };

  // Intersection Observer for new arrivals section animation
  useEffect(() => {
    let isMounted = true;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!isMounted) return;
          if (entry.isIntersecting) {
            setNewArrivalsVisible(false);
            requestAnimationFrame(() => {
              if (isMounted) {
                setTimeout(() => {
                  if (isMounted) {
                    setNewArrivalsVisible(true);
                  }
                }, 50);
              }
            });
          } else {
            setNewArrivalsVisible(false);
          }
        });
      },
      { threshold: 0.15, rootMargin: '50px' }
    );

    const currentRef = newArrivalsSectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      isMounted = false;
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

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
    // Use discountPrice for filtering if available, otherwise use regular price
    const price = product.discountPrice || product.price || 0;
    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
    const matchesBrand = !brandFilter || product.details?.brand === brandFilter;
    const matchesStock = !inStockOnly || (product.stock && product.stock > 0);
    return matchesPrice && matchesBrand && matchesStock;
  });

  const sortedProducts = sort === 'default' 
    ? filteredProducts // Keep server order (sorted by displayOrder)
    : [...filteredProducts].sort((a, b) => {
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


  if (loading) return (
    <div className="loader">
      <div className="loader-container">
        <div className="loader-logo">EVOLEXX</div>
        <div className="spinner-container">
          <div className="spinner-circle"></div>
        </div>
        <p className="loading-text">Loading products...</p>
      </div>
    </div>
  );
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
            preload="auto"
  
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
          <Link to="/category/mobile-phones" className="category-card tall">
            <img src="/BrandNewPhone.jpg" alt="Brand New Phones" />
            <div className="overlay-blur-bg"></div>
            <div className="overlay-text bottom"><p>Brand New Phone</p></div>
          </Link>
          <Link to="/category/preowned-phones" className="category-card square">
            <img src="/PreOwnedPhone.jpg" alt="Pre-Owned Phones" />
            <div className="overlay-blur-bg"></div>
            <div className="overlay-text bottom"><p>Pre Owned Phone</p></div>
          </Link>
          <Link to="/category/laptops" className="category-card square">
            <img src="/Laptop.jpg" alt="Laptops" />
            <div className="overlay-blur-bg"></div>
            <div className="overlay-text bottom"><p>Laptop</p></div>
          </Link>
          <Link to="/category/mobile-accessories" className="category-card wide">
            <img src="/MobileAccessories.jpg" alt="Mobile Accessories" />
            <div className="overlay-blur-bg"></div>
            <div className="overlay-text bottom"><p>Accessories</p></div>
          </Link>
        </div>
      </section>

      {/* New Arrivals Section - 3D Carousel */}
      {newArrivals.length > 0 && (
        <section className="new-arrivals-section" ref={newArrivalsSectionRef}>
          {/* WhatsApp Chat Button */}
          <div className="whatsapp-chat-button">
            <a 
              href={`https://wa.me/${process.env.REACT_APP_WHATSAPP_NUMBER || '94771234567'}?text=${encodeURIComponent('Hi Xclusive.lk, I need help with your products.')}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="whatsapp-link"
              aria-label="Chat with us on WhatsApp"
            >
              <div className="whatsapp-icon-wrapper">
                <svg className="whatsapp-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <div className="whatsapp-text">
                <p className="whatsapp-help-text">Need Help? Chat with us</p>
              </div>
            </a>
          </div>
          
          <div className={`new-arrivals-heading ${newArrivalsVisible ? 'visible' : ''}`}>
            <h2>New Arrivals</h2>
            <p className="new-arrivals-subtitle desktop-subtitle">Check out our latest products, where style meets quality and innovation to bring you exclusive <br /> new arrivals that elevate your shopping experience</p>
            <p className="new-arrivals-subtitle mobile-subtitle">Check out our latest products, combining style, quality, and innovation to deliver exclusive new arrivals.</p>
          </div>
          
          <div className={`carousel-container ${newArrivalsVisible ? 'visible' : ''}`}>
            <div 
              className="carousel-track"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {newArrivals.slice(0, 7).map((product, index) => {
                const imageUrl = generateImageUrl(product);
                const fullPrice = product.discountPrice || product.price || 0;
                const position = index - carouselIndex;
                
                // Calculate card visibility and positioning
                const isCenter = position === 0;
                const isCardVisible = Math.abs(position) <= 2;
                
                if (!isCardVisible) return null;
                
                // Stagger animation delay based on position
                const animDelay = Math.abs(position) * 0.15 + 0.4;
                
                return (
                  <div
                    key={product._id}
                    className={`carousel-card ${isCenter ? 'center' : ''} pos-${position}`}
                    style={{
                      '--position': position,
                      '--anim-delay': `${animDelay}s`,
                      zIndex: 10 - Math.abs(position)
                    }}
                  >
                    <Link to={`/product/${product.slug || product._id}`} className="carousel-card-inner">
                      <div className="carousel-card-image">
                        <img src={imageUrl} alt={product.name} onError={(e) => (e.target.src = '/logo192.png')} />
                      </div>
                      <div className="carousel-card-label">{product.name}</div>
                      {isCenter && (
                        <div className="carousel-card-details">
                          <h3>{product.name}</h3>
                          <div className="carousel-price-row">
                            <span className="carousel-price">Rs. {fullPrice.toLocaleString()}</span>
                            {product.discountPrice && (
                              <span className="carousel-old-price">Rs. {product.price?.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
            
            {/* Navigation Arrows */}
            <div className="carousel-nav">
              <button 
                className="carousel-nav-btn prev" 
                onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                disabled={carouselIndex === 0}
              >
                ←
              </button>
              <button 
                className="carousel-nav-btn next" 
                onClick={() => setCarouselIndex(prev => Math.min(newArrivals.length - 1, prev + 1))}
                disabled={carouselIndex === newArrivals.length - 1}
              >
                →
              </button>
            </div>
          </div>
        </section>
      )}

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
              // Use discountPrice as main price if available, otherwise use regular price
              const fullPrice = product.discountPrice || product.price || 0;
              const originalPrice = product.discountPrice ? product.price : null;
              const kokoTotal = fullPrice * 1.12;
              const kokoInstallment = kokoTotal / 3;

              return (
                <Link to={`/product/${product.slug || product._id}`} className="product-card" key={product._id}>
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
                      {originalPrice ? (
                        <>
                          <p className="price">
                            <span className="price-current">Rs. {fullPrice.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                            <span className="price-old">
                              Rs. {originalPrice.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </span>
                          </p>
                        </>
                      ) : (
                        <p className="price">
                          Rs. {fullPrice.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                      {product.kokoPay && fullPrice && (
                        <p className="koko-pay">
                           pay in 3 × Rs.{" "}
                          {kokoInstallment.toLocaleString("en-LK", { minimumFractionDigits: 2 })}{" "}
                           <img src="/koko.webp" alt="Koko" className="koko-logo" />
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

      <Footer showBrands={true} />
    </div>
  );
};

export default Homepage;
