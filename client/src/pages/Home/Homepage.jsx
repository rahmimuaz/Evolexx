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

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

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
          <Link to="/category/sound" className="category-card tall">
            <img src="/category-accessories.jpg" alt="Sound System" />
            <div className="overlay-text bottom"><p>Sound System</p></div>
          </Link>
          <Link to="/category/watch" className="category-card square">
            <img src="/category-accessories.jpg" alt="Smart Watch" />
            <div className="overlay-text bottom"><p>Smart Watch</p></div>
          </Link>
          <Link to="/category/tablet" className="category-card square">
            <img src="/category-accessories.jpg" alt="Tablet" />
            <div className="overlay-text bottom"><p>Tablet Computer</p></div>
          </Link>
          <Link to="/category/game" className="category-card wide">
            <img src="/category-accessories.jpg" alt="Game Controller" />
            <div className="overlay-text bottom"><p>Game Controller</p></div>
          </Link>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="product-section" ref={productSectionRef}>
        <h2 ref={headingRef}>All Products</h2>
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
