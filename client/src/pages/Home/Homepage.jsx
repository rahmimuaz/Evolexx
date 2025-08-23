import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';
import axios from 'axios';
import { FaShippingFast, FaRedoAlt, FaSlidersH, FaArrowRight, FaPlay, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { HiShieldCheck } from 'react-icons/hi';
import Footer from '../../components/Footer/Footer';
import bannerImage from '../Home/banner1.jpg';


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Homepage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [animationDirection, setAnimationDirection] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  // Hero section data
  const heroSections = [
    {
      id: 1,
      title: "Discover Amazing",
      subtitle: "TECH PRODUCTS",
      description: "Experience the future of technology with our curated collection of premium devices, accessories, and innovative solutions.",
      background: bannerImage,
      category: "All Products",
      buttonText: "SHOP NOW"
    },
    {
      id: 2,
      title: "Premium Quality",
      subtitle: "MOBILE PHONES",
      description: "Get the latest smartphones with cutting-edge technology, stunning cameras, and powerful performance.",
      background: "/BrandNewPhone.jpg",
      category: "Mobile Phones",
      buttonText: "EXPLORE PHONES"
    },
    {
      id: 3,
      title: "Powerful Performance",
      subtitle: "LAPTOPS & COMPUTERS",
      description: "High-performance laptops and desktops for work, gaming, and creative professionals.",
      background: "/Laptop.jpg",
      category: "Laptops",
      buttonText: "VIEW LAPTOPS"
    },
    {
      id: 4,
      title: "Smart Accessories",
      subtitle: "MOBILE ACCESSORIES",
      description: "Enhance your mobile experience with premium accessories, cases, and smart gadgets.",
      background: "/MobileAccessories.jpg",
      category: "Accessories",
      buttonText: "BROWSE ACCESSORIES"
    }
  ];

  const productsPerPage = 12;
  const productSectionRef = useRef(null);
  const headingRef = useRef(null);

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

  const handleHeroCardClick = (index) => {
    if (index === activeHeroIndex) return; // Don't animate if same card
    
    // Add fade-out animation to both text and background
    const textContainer = document.querySelector('.hero-text-container');
    const backgroundImage = document.querySelector('.hero-bg-image');
    
    if (textContainer && backgroundImage) {
      // Fade out text and background
      textContainer.classList.add('fade-out');
      backgroundImage.classList.add('bg-fade-out');
      
      // Wait for fade-out to complete, then change content and fade-in
      setTimeout(() => {
        setActiveHeroIndex(index);
        
        // Add fade-in animation after content change
        setTimeout(() => {
          textContainer.classList.remove('fade-out');
          backgroundImage.classList.remove('bg-fade-out');
          textContainer.classList.add('fade-in');
          backgroundImage.classList.add('bg-fade-in');
          
          // Remove fade-in classes after animation completes
          setTimeout(() => {
            textContainer.classList.remove('fade-in');
            backgroundImage.classList.remove('bg-fade-in');
          }, 600);
        }, 100);
      }, 400);
    } else {
      // Fallback if DOM elements not found
      setActiveHeroIndex(index);
    }
  };

  const nextHero = () => {
    setActiveHeroIndex((prev) => (prev + 1) % heroSections.length);
  };

  const prevHero = () => {
    setActiveHeroIndex((prev) => (prev - 1 + heroSections.length) % heroSections.length);
  };


  if (loading) return <div className="loader">Loading products...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="home">
      {/* Interactive Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <img 
            src={heroSections[activeHeroIndex].background} 
            alt="Hero Background" 
            className="hero-bg-image"
          />
          <div className="hero-overlay"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-text-container">
            <div className="hero-line"></div>
            <span className="hero-category">{heroSections[activeHeroIndex].category}</span>
            <h1 className="hero-title">
              <span className="title-main">{heroSections[activeHeroIndex].title}</span>
              <span className="title-sub">{heroSections[activeHeroIndex].subtitle}</span>
            </h1>
            <p className="hero-description">
              {heroSections[activeHeroIndex].description}
            </p>
            <div className="hero-actions">
              <Link to={`/category/${encodeURIComponent(heroSections[activeHeroIndex].category)}`} className="discover-button">
                {heroSections[activeHeroIndex].buttonText}
              </Link>
            </div>
          </div>
          
          <div className="hero-cards-section">
            <div className="cards-container">
              {heroSections.map((section, index) => (
                <div 
                  key={section.id}
                  className={`hero-card ${index === activeHeroIndex ? 'active' : ''}`}
                  onClick={() => handleHeroCardClick(index)}
                >
                  <div className="card-image">
                    <img src={section.background} alt={section.category} />
                  </div>
                  <div className="card-text">
                    {section.subtitle}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="page-indicator">
              {String(activeHeroIndex + 1).padStart(2, '0')}
            </div>
          </div>
        </div>
      </section>

      {/* Static Banner Section - Keeping as fallback */}
      <section className="banner">
       <img src={bannerImage} className="banner-image" alt="Homepage Banner" />
      </section>

      <section className="features">
        <div className="feature"><FaShippingFast /><div className="feature-text"><h3>Fast & Free Shipping</h3><p>Every single order ships for free.</p></div></div>
        <div className="feature"><FaRedoAlt /><div className="feature-text"><h3>7 Days Returns</h3><p>Product returns accepted within 30 days.</p></div></div>
        <div className="feature"><HiShieldCheck /><div className="feature-text"><h3>Top Quality Products</h3><p>We always provide high quality products.</p></div></div>
      </section>

      <section className="category-section">
        <div className="category-grid-custom">
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
              <label htmlFor="sort-select">Sort</label>
              <select id="sort-select" value={sort} onChange={handleSortChange}>
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group price-range-group">
              <label>Price</label>
              <input type="number" min="0" value={priceRange[0]} onChange={e => handlePriceChange(e, 0)} className="price-input" />
              <span>-</span>
              <input type="number" min="0" value={priceRange[1]} onChange={e => handlePriceChange(e, 1)} className="price-input" />
            </div>

            {allBrands.length > 0 && (
              <div className="filter-group brand-filter-group">
                <label htmlFor="brand-select">Brand</label>
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
