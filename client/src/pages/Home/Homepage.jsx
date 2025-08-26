import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';
import axios from 'axios';
import { FaSlidersH } from 'react-icons/fa';
import Footer from '../../components/Footer/Footer';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const bannerData = [
  {
    id: 1,
    title: "iPhone 16 Pro Max",
    description: "iPhone 16 Pro takes performance and innovation to a whole new level. Built with aerospace-grade titanium, it's lighter yet stronger than ever before. Powered by the breakthrough A18 Pro chip, it delivers unmatched speed, console-level gaming, and advanced machine learning for smarter everyday experiences. The Pro camera system captures stunning detail in any light, while the larger Super Retina XDR display brings movies, photos, and apps to life in brilliant color. With all-day battery, enhanced durability, and the most advanced iOS features, iPhone 16 Pro isn't just the next iPhone — it's the future in your hands.",
    image: "/iPhone16ProMax.png",
    link: "/products/iphone-16-pro-max"
  },
  {
    id: 2,
    title: "Watch Series 10",
    description: "Apple Watch Series 10 is your ultimate companion for health, fitness, and connectivity. With a larger, brighter display, advanced heart and sleep tracking, and innovative safety features, it helps you stay active, motivated, and protected. Redesigned with powerful new sensors and the latest watchOS, it’s more than a watch — it’s a personal coach, a health monitor, and a life assistant, all on your wrist.",
    image: "/series10.png",
    link: "/category/Laptops"
  },
  {
    id: 3,
    title: "AirPods Max",
    description: "AirPods Max reimagine over-ear headphones. From the custom acoustic design to the powerful Apple-designed driver, every detail is engineered for an immersive, high-fidelity sound experience. Active Noise Cancellation and Transparency mode let you control what you hear, while spatial audio with dynamic head tracking places sound all around you. With a soft, breathable knit mesh canopy and memory foam ear cushions, comfort meets pure audio bliss for hours of listening.",
    image: "/airpodsMax.png",
    link: "/category/Laptops"
  }
];

const staticBrands = [
  { logo: '/brands/apple.png'},
  { logo: '/brands/samsung.png' },
  { logo: '/brands/google.png' },
  { logo: '/brands/Anker.png'},
  { logo: '/brands/xiaomi.png'},
  { logo: '/brands/ugreen.png'},
  { logo: '/brands/baseus.png'},
];

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
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [...bannerData, bannerData[0]]; // duplicate first slide for looping
  const sliderRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const prices = products.map(p => p.price || 0);
      setPriceRange([Math.min(...prices), Math.max(...prices)]);
    }
  }, [products]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => prevSlide + 1);
    }, 5000); // auto slide every 5s
    return () => clearInterval(interval);
  }, []);

  // Removed the handleTransitionEnd logic
  // The carousel will now transition from the last real slide to the duplicated slide.
  // We'll reset the state instantly after that transition to loop seamlessly.
  useEffect(() => {
    if (currentSlide === slides.length - 1) {
      setTimeout(() => {
        setCurrentSlide(0);
      }, 1000); // Wait for the transition to finish (1s) before resetting
    }
  }, [currentSlide, slides.length]);


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
    setBrandFilter(event.target.value);
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

      {/* BANNER SECTION WITH OLD TRANSITION */}
      <section className="banner-new">
        <div
          ref={sliderRef}
          className="banner-slider"
          style={{
            transform: `translateX(-${currentSlide * 100}vw)`,
            transition: currentSlide === 0 && slides.length > 1 ? 'none' : 'transform 1s ease-in-out'
          }}
        >
          {slides.map((slide, index) => (
            <div className="banner-slide" key={index}>
              <div className="banner-content">
                <h1>{slide.title}</h1>
                <p>{slide.description}</p>
                <Link to={slide.link} className="explore-button">Explore</Link>
              </div>
              <div className="banner-image-container">
                <img src={slide.image} alt={slide.title} />
              </div>
            </div>
          ))}
        </div>
        <div className="banner-controls">
          <div className="pagination-dots-banner">
            {bannerData.map((_, index) => (
              <span
                key={index}
                className={`dot ${currentSlide === index || (currentSlide === slides.length - 1 && index === 0) ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              ></span>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORY SECTION */}
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

      {/* PRODUCT SECTION */}
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
      {/* SCROLLING BRANDS */}
      <section className="scrolling-brands-container">
        <div className="scrolling-brands">
          {staticBrands.concat(staticBrands).map((brand) => (
              <img src={brand.logo} alt={`${brand.name} Logo`} className="brand-logo" />
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Homepage;