import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';
import axios from 'axios';
import { FaShippingFast, FaRedoAlt } from 'react-icons/fa';
import { HiShieldCheck } from 'react-icons/hi';

const Homepage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Original banner images
  const originalBannerImages = [
    '/banner1.jpg',
    '/banner2.jpg',
    '/banner3.jpg',
  ];

  // Modified bannerImages array for infinite loop effect
  // We append the first image to the end
  const bannerImages = [...originalBannerImages, originalBannerImages[0]];

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true); // New state to control transition

  useEffect(() => {
    fetchProducts();

    const bannerInterval = setInterval(() => {
      // Allow transition for normal slides
      setIsTransitioning(true);

      setCurrentBannerIndex((prevIndex) => {
        // If we are at the last (duplicated) image
        if (prevIndex === bannerImages.length - 1) {
          // Immediately jump back to the true first image without transition
          setIsTransitioning(false); // Disable transition
          return 0; // Go to the very first image
        } else {
          return prevIndex + 1; // Normal slide to the next image
        }
      });
    }, 4000); // Change image every 4 seconds

    // A separate effect to handle the instant jump back from duplicated image
    // This effect runs whenever currentBannerIndex or isTransitioning changes
    const transitionEndHandler = () => {
        if (!isTransitioning && currentBannerIndex === 0) {
            // After the instant jump, re-enable transition for the next slide
            setTimeout(() => {
                setIsTransitioning(true);
            }, 50); // Small delay to ensure CSS re-applies
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
  }, [bannerImages.length, isTransitioning, currentBannerIndex]); // Add dependencies for useEffect

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

  const handleContactClick = () => alert('Contact Clicked');
  const handleAddressClick = () => alert('Address Clicked');
  const handleFaqClick = () => alert('FAQ Clicked');
  const handleTermsClick = () => alert('Terms Clicked');
  const handleHelpClick = () => alert('Help Clicked');
  const handleReturnsClick = () => alert('Returns Clicked');
  const handleShippingClick = () => alert('Shipping Clicked');
  const handleWarrantyClick = () => alert('Warranty Clicked');

  if (loading) {
    return <div className="loader">Loading products...</div>;
  }
  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="home">
      {/* ============ BANNER SECTION ============ */}
      <section className="banner">
        <div
          className="banner-slider"
          // Conditionally apply transition based on isTransitioning state
          style={{
            transform: `translateX(-${currentBannerIndex * 100}%)`,
            transition: isTransitioning ? 'transform 1s ease-in-out' : 'none',
          }}
        >
          {bannerImages.map((image, index) => (
            <img
              key={index} // Using index as key is acceptable here since items are static
              src={image}
              alt={`Hero Banner ${index + 1}`}
              className="banner-image"
            />
          ))}
        </div>
      </section>

      {/* Rest of your existing JSX for features, explore-section, product-section, and footer */}
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
      {/* ============ CATEGORY SECTION ============ */}

<section className="category-section">
  <h2>Shop by Category</h2>
  <div className="category-grid-custom">
    <Link to="/category/sound" className="category-card tall">
      <img src="/category-accessories.jpg" alt="Sound System" />
      <div className="overlay-text bottom">
        <p>Sound System</p>

      </div>
    </Link>

    <Link to="/category/watch" className="category-card square">
      <img src="/category-accessories.jpg" alt="Smart Watch" />
      <div className="overlay-text bottom">
        <p>Smart Watch</p>
      </div>
    </Link>

    <Link to="/category/tablet" className="category-card square">
      <img src="/category-accessories.jpg" alt="Tablet" />
      <div className="overlay-text bottom">
        <p>Tablet Computer</p>
      </div>
    </Link>

    <Link to="/category/game" className="category-card wide">
      <img src="/category-accessories.jpg" alt="Game Controller" />
      <div className="overlay-text bottom">
        <p>Game Controller</p>
      </div>
    </Link>
  </div>
</section>



      <section className="product-section">
        <h2>All Products</h2>
        <div className="product-grid">
          {products.map((product) => {
            const imageUrl = generateImageUrl(product);
            return (
              <Link to={`/products/${product._id}`} className="product-card" key={product._id}>
                <img
                  src={imageUrl}
                  alt={product.name}
                  onError={(e) => (e.target.src = '/logo192.png')}
                />
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="card-footer">
                  <p className="price">Rs. {product.price?.toFixed(2) || 'N/A'}</p>
                  <button className="view-more-btn">View More</button>
                </div>
              </Link>
            );
          })}
        </div>
        <hr />
      </section>

      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="logo">
              <span className="logo-icon">⚡</span>
              <span className="logo-text">EVOLEXX</span>
            </div>
            <p>Experience the future with our top-notch gadgets and devices.</p>
            <div className="social-icons">
              <button aria-label="Instagram" className="footer-link-btn">
                Instagram
              </button>
              <button aria-label="Facebook" className="footer-link-btn">
                Facebook
              </button>
              <button aria-label="WhatsApp" className="footer-link-btn">
                WhatsApp
              </button>
            </div>
          </div>

          <div className="footer-links">
            <h4>About Us</h4>
            <ul>
              <li>
                <button onClick={handleContactClick} className="footer-link-btn">
                  Contact
                </button>
              </li>
              <li>
                <button onClick={handleAddressClick} className="footer-link-btn">
                  Address
                </button>
              </li>
              <li>
                <button onClick={handleFaqClick} className="footer-link-btn">
                  FAQ’s
                </button>
              </li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Customer Service</h4>
            <ul>
              <li>
                <button onClick={handleTermsClick} className="footer-link-btn">
                  Terms and Conditions
                </button>
              </li>
              <li>
                <button onClick={handleHelpClick} className="footer-link-btn">
                  Help Center
                </button>
              </li>
              <li>
                <button onClick={handleReturnsClick} className="footer-link-btn">
                  Returns & Refunds
                </button>
              </li>
              <li>
                <button onClick={handleShippingClick} className="footer-link-btn">
                  Shipping & Delivery
                </button>
              </li>
              <li>
                <button onClick={handleWarrantyClick} className="footer-link-btn">
                  Warranty Information
                </button>
              </li>
            </ul>
          </div>
        </div>
      </footer>
      <hr className="footer-divider" />
      <div className="footer-bottom">
        <p>© 2025 Evolexx. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Homepage;