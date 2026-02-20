import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';
import axios from 'axios';
import { FaSlidersH } from 'react-icons/fa';
import Footer from '../../components/Footer/Footer';
import WhatsAppButton from '../../components/WhatsAppButton/WhatsAppButton';


// Get API base URL - check environment variable first, then try to infer from current location
const getApiBaseUrl = () => {
  // First, try environment variable
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // For localhost development, use default backend URL if not set
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5001';
  }
  
  // If on Vercel or production, you should set REACT_APP_API_BASE_URL in environment variables
  // For example: https://your-backend.railway.app or https://your-backend.herokuapp.com
  
  // Fallback: return empty string (will not fetch video settings, video will be hidden)
      // REACT_APP_API_BASE_URL is not set - video settings will not be loaded
  return '';
};

const API_BASE_URL = getApiBaseUrl();

const Homepage = () => {
  const [products, setProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [animationDirection, setAnimationDirection] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [heroVideo, setHeroVideo] = useState({
    videoUrl: '',
    webmUrl: '',
    mobileVideoUrl: '',
    mobileWebmUrl: '',
    enabled: true
  });

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
    fetchHeroVideoSettings();
  }, []);

  const fetchHeroVideoSettings = async () => {
    if (!API_BASE_URL) return;

    // Check sessionStorage cache first (avoids API call on repeat visits)
    try {
      const cached = sessionStorage.getItem('heroVideoSettings');
      if (cached) {
        setHeroVideo(JSON.parse(cached));
        return;
      }
    } catch (e) { /* sessionStorage unavailable */ }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/settings/hero-video`, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.data) {
        let settings = null;
        if (response.data.value) {
          settings = response.data.value;
        } else if (response.data.videoUrl || response.data.mobileVideoUrl) {
          settings = response.data;
        }
        
        if (settings) {
          const newVideoSettings = {
            videoUrl: settings.videoUrl || '',
            mobileVideoUrl: settings.mobileVideoUrl || '',
            enabled: settings.enabled !== false
          };
          setHeroVideo(newVideoSettings);
          try { sessionStorage.setItem('heroVideoSettings', JSON.stringify(newVideoSettings)); } catch (e) { /* ignore */ }
        }
      }
    } catch (error) {
      // Use default values if API fails
    }
  };

  // Add structured data for homepage (Organization schema)
  useEffect(() => {
    const baseUrl = window.location.origin;
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Evolexx",
      "url": baseUrl,
      "logo": `${baseUrl}/logo192.png`,
      "description": "Premium Mobile Devices, Accessories, and Electronics in Sri Lanka. Shop the latest smartphones, laptops, headphones, and more with Koko Pay installment options.",
      "sameAs": [
        "https://www.instagram.com/exos_mauritius"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+94-75-603-1924",
        "contactType": "Customer Service",
        "email": "evolexxlk@gmail.com"
      }
    };

    // Remove existing structured data script if any
    const existingScript = document.getElementById('homepage-structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data script
    const script = document.createElement('script');
    script.id = 'homepage-structured-data';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById('homepage-structured-data');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
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
      const [productsRes, newArrivalsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/products`),
        axios.get(`${API_BASE_URL}/api/products/new-arrivals`).catch(() => null)
      ]);

      setProducts(productsRes.data);

      if (newArrivalsRes && newArrivalsRes.data && newArrivalsRes.data.length > 0) {
        setNewArrivals(newArrivalsRes.data);
      } else {
        // Fallback: use newest products if no admin-selected new arrivals
        const sortedByDate = [...productsRes.data].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setNewArrivals(sortedByDate.slice(0, 7));
      }

      setLoading(false);
    } catch (error) {
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


  // Don't block page rendering - show content immediately with loading states inline
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="home">
      {/* Hero Section with Video Background */}
      <section className="banner">
        {/* Video Background - Only show if enabled and at least one video URL exists */}
        {heroVideo.enabled && (heroVideo.videoUrl || heroVideo.mobileVideoUrl) && (
          <div className="hero-video-container">
            {/* Desktop Video - Hidden on mobile */}
            {heroVideo.videoUrl && (
              <video 
                className="hero-video hero-video-desktop" 
                autoPlay 
                muted 
                loop 
                playsInline
                preload="metadata"
              >
                <source src={heroVideo.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
            
            {/* Mobile Video - Hidden on desktop */}
            {heroVideo.mobileVideoUrl ? (
              <video 
                className="hero-video hero-video-mobile" 
                autoPlay 
                muted 
                loop 
                playsInline
                preload="metadata"
              >
                <source src={heroVideo.mobileVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : heroVideo.videoUrl ? (
              // Fallback: Use desktop video on mobile if no mobile video is set
              <video 
                className="hero-video hero-video-mobile" 
                autoPlay 
                muted 
                loop 
                playsInline
                preload="metadata"
              >
                <source src={heroVideo.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : null}
            
            <div className="hero-video-overlay"></div>
          </div>
        )}
        
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
                      {isCenter && (
                        <div className="carousel-card-details">
                        
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
          {loading && products.length === 0 ? (
            <div className="product-grid">
              {Array.from({ length: productsPerPage }).map((_, i) => (
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
          ) : (
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
          )}
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
      <WhatsAppButton />
    </div>
  );
};

export default Homepage;
