import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../Home/Homepage.css';

const PRODUCTS_PER_PAGE = 8;

const sortOptions = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

const CategoryPage = () => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState('price-asc');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [brandFilter, setBrandFilter] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/category/${encodeURIComponent(category)}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setCurrentPage(1);
        // Set price range based on products
        if (data.length > 0) {
          const prices = data.map(p => p.price || 0);
          setPriceRange([Math.min(...prices), Math.max(...prices)]);
        }
      })
      .finally(() => setLoading(false));
  }, [category]);

  // Helper for image fallback
  const generateImageUrl = (product) =>
    product.images && product.images.length > 0 ? product.images[0] : '/logo192.png';

  // Get all brands in this category
  const allBrands = Array.from(new Set(products.map(p => p.details?.brand).filter(Boolean)));

  // Filtering
  const filteredProducts = products.filter(product => {
    const price = product.price || 0;
    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
    const matchesBrand = brandFilter.length === 0 || brandFilter.includes(product.details?.brand);
    const matchesStock = !inStockOnly || (product.stock && product.stock > 0);
    return matchesPrice && matchesBrand && matchesStock;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sort === 'price-asc') return (a.price || 0) - (b.price || 0);
    if (sort === 'price-desc') return (b.price || 0) - (a.price || 0);
    if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);
  const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const currentProducts = sortedProducts.slice(startIdx, startIdx + PRODUCTS_PER_PAGE);

  // Handlers
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

  return (
    <div className="product-section">
      <h2>Category: {category}</h2>
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
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="product-grid">
            {currentProducts.map((product) => {
              const imageUrl = generateImageUrl(product);
              const fullPrice = product.price || 0;
              const kokoTotal = fullPrice * 1.12;
              const kokoInstallment = kokoTotal / 3;

              return (
                <Link to={`/products/${product._id}`} className="product-card" key={product._id}>
                  <img src={imageUrl} alt={product.name} onError={e => (e.target.src = '/logo192.png')} />
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
                        or pay in 3 × Rs.{' '}
                        {kokoInstallment.toLocaleString('en-LK', { minimumFractionDigits: 2 })}{' '}
                        with <img src="/koko.webp" alt="Koko" className="koko-logo" />
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="pagination-dots">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <div
                  key={page}
                  className={`dot ${page === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                  title={`Page ${page}`}
                ></div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CategoryPage; 