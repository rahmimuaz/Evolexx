import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';
import axios from 'axios';
import { FaShippingFast, FaRedoAlt } from 'react-icons/fa';
import { HiShieldCheck } from 'react-icons/hi';
import Footer from '../../components/Footer/Footer';

const Homepage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [animationDirection, setAnimationDirection] = useState('');
  const productsPerPage = 12;

  const productSectionRef = useRef(null);
  const headingRef = useRef(null);

  const originalBannerImages = ['/banner1.jpg', '/banner2.jpg', '/banner3.jpg'];
  const bannerImages = [...originalBannerImages, originalBannerImages[0]];
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const sortOptions = [
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
  ];
  const [sort, setSort] = useState('price-asc');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [brandFilter, setBrandFilter] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    fetchProducts();

    const bannerInterval = setInterval(() => {
      setIsTransitioning(true);
      setCurrentBannerIndex((prevIndex) =>
        prevIndex === bannerImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    const transitionEndHandler = () => {
      if (!isTransitioning && currentBannerIndex === 0) {
        setTimeout(() => setIsTransitioning(true), 50);
      }
    };

    const bannerSlider = document.querySelector('.banner-slider');
    if (bannerSlider) {
      bannerSlider.addEventListener('transitionend', transitionEndHandler);
    }

    return () => {
      clearInterval(bannerInterval);
      if (bannerSlider) {
        bannerSlider.removeEventListener('transitionend', transitionEndHandler);
      }
    };
  }, [bannerImages.length, isTransitioning, currentBannerIndex]);

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
      const response = await axios.get('http://localhost:5001/api/products');
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
      return product.images[0].startsWith('http')
        ? product.images[0]
        : `http://localhost:5001/${product.images[0].replace(/^\//, '')}`;
    }
    return '/logo192.png';
  };

  const allBrands = Array.from(new Set(products.map(p => p.details?.brand).filter(Boolean)));
  const filteredProducts = products.filter(product => {
    const price = product.price || 0;
    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
    const matchesBrand = brandFilter.length === 0 || brandFilter.includes(product.details?.brand);
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
          const offset = 80; // Adjust this value to your fixed header height
          window.scrollTo({ top: topPos - offset, behavior: 'smooth' });
        }
      }, 400);
    }
  };

  const handleBrandChange = (brand) => {
    setBrandFilter(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
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

  if (loading) return <div className="loader">Loading products...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="home">
      {/* BANNER */}
      <section className="banner">
        <div
          className="banner-slider"
          style={{
            transform: `translateX(-${currentBannerIndex * 100}%)`,
            transition: isTransitioning ? 'transform 1s ease-in-out' : 'none',
          }}
        >
          {bannerImages.map((image, index) => (
            <img key={index} src={image} alt={`Hero Banner ${index + 1}`} className="banner-image" />
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="feature">
          <FaShippingFast />
          <div className="feature-text">
            <h3>Fast & Free Shipping</h3>
            <p>Every single order ships for free.</p>
          </div>
        </div>
        <div className="feature">
          <FaRedoAlt />
          <div className="feature-text">
            <h3>30 Days Returns</h3>
            <p>Product returns accepted within 30 days.</p>
          </div>
        </div>
        <div className="feature">
          <HiShieldCheck />
          <div className="feature-text">
            <h3>Top Quality Products</h3>
            <p>We always provide high quality products.</p>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="category-section">
        <div className="category-grid-custom">
          <Link to="/category/Mobile%20Phone" className="category-card tall">
            <img src="/category-accessories.jpg" alt="Sound System" />
            <div className="overlay-text bottom"><p>Brand New Phone</p></div>
          </Link>
          <Link to="/category/Preowned%20Phones" className="category-card square">
            <img src="/category-accessories.jpg" alt="Smart Watch" />
            <div className="overlay-text bottom"><p>Pre Owned Phone</p></div>
          </Link>
          <Link to="/category/Laptops" className="category-card square">
            <img src="/category-accessories.jpg" alt="Tablet" />
            <div className="overlay-text bottom"><p>laptop</p></div>
          </Link>
          <Link to="/category/Mobile%20Accessories" className="category-card wide">
            <img src="/category-accessories.jpg" alt="Game Controller" />
            <div className="overlay-text bottom"><p>mobileAccessories </p></div>
          </Link>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="product-section" ref={productSectionRef}>
        <h2 ref={headingRef}>All Products</h2>
        {/* FILTER & SORT BAR */}
        <div className="filter-sort-bar">
          {/* Sort */}
          <div>
            <label>Sort:&nbsp;</label>
            <select value={sort} onChange={handleSortChange}>
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {/* Price Range */}
          <div>
            <label>Price:&nbsp;</label>
            <input type="number" min="0" value={priceRange[0]} onChange={e => handlePriceChange(e, 0)} style={{ width: 70 }} />
            &nbsp;-&nbsp;
            <input type="number" min="0" value={priceRange[1]} onChange={e => handlePriceChange(e, 1)} style={{ width: 70 }} />
          </div>
          {/* Brand Filter */}
          {allBrands.length > 0 && (
            <div>
              <label>Brand:&nbsp;</label>
              {allBrands.map(brand => (
                <label key={brand} className="brand-checkbox-label">
                  <input
                    type="checkbox"
                    checked={brandFilter.includes(brand)}
                    onChange={() => handleBrandChange(brand)}
                  />
                  &nbsp;{brand}
                </label>
              ))}
            </div>
          )}
          {/* In Stock Only */}
          <div>
            <label>
              <input type="checkbox" checked={inStockOnly} onChange={handleStockChange} /> In Stock Only
            </label>
          </div>
        </div>
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
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star}>{product.rating >= star ? '★' : '☆'}</span>
                    ))}
                  </div>
                  <div className="card-footer">
                    <p className="price">
                      Rs. {fullPrice.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </p>
                    {product.price && (
                      <p className="koko-pay">
                        or pay in 3 × Rs.{" "}
                        {kokoInstallment.toLocaleString("en-LK", { minimumFractionDigits: 2 })}{" "}
                        with <img src="/koko.webp" alt="Koko" className="koko-logo" />
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* PAGINATION */}
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

      {/* FOOTER */}
      <Footer />
    </div>
  );
};

export default Homepage;
