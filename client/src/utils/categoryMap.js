// src/utils/categoryMap.js
// Complete slug-based category mapping for SEO-friendly URLs

// Slug to database category name mapping
export const SLUG_TO_CATEGORY = {
  'electronics': 'Electronics',
  'mobile-accessories': 'Mobile Accessories',
  'pre-owned-devices': 'Pre-owned Devices',
  'other': 'Other',
  // Legacy subcategory mappings (for backward compatibility)
  'mobile-phones': 'Mobile Phone',
  'preowned-phones': 'Preowned Phones',
  'laptops': 'Laptops',
  'phone-covers': 'Phone Covers',
  'chargers': 'Chargers',
  'headphones': 'Headphones',
  'earbuds': 'Earbuds',
  'smartwatches': 'Smartwatches',
  'tablets': 'Tablets',
  'screen-protectors': 'Screen Protectors',
  'cables': 'Cables',
  'other-accessories': 'Other Accessories',
  'preowned-laptops': 'Preowned Laptops',
  'preowned-tablets': 'Preowned Tablets'
};

// Database category name to slug mapping (reverse lookup)
export const CATEGORY_TO_SLUG = Object.fromEntries(
  Object.entries(SLUG_TO_CATEGORY).map(([slug, category]) => [category, slug])
);

// Display labels for each slug (for page titles, breadcrumbs, etc.)
export const CATEGORY_LABELS = {
  'electronics': 'Electronics',
  'mobile-accessories': 'Mobile Accessories',
  'pre-owned-devices': 'Pre-Owned Devices',
  'other': 'Other Products',
  // Legacy subcategory labels (for backward compatibility)
  'mobile-phones': 'Brand New Phones',
  'preowned-phones': 'Pre-Owned Phones',
  'laptops': 'Laptops',
  'phone-covers': 'Phone Covers',
  'chargers': 'Chargers & Adapters',
  'headphones': 'Headphones',
  'earbuds': 'Earbuds & TWS',
  'smartwatches': 'Smart Watches',
  'tablets': 'Tablets',
  'screen-protectors': 'Screen Protectors',
  'cables': 'Cables & Connectors',
  'other-accessories': 'Other Accessories',
  'preowned-laptops': 'Pre-Owned Laptops',
  'preowned-tablets': 'Pre-Owned Tablets'
};

// Category groups for navigation menus
export const CATEGORY_GROUPS = {
  'phones': {
    label: 'Phones',
    categories: ['mobile-phones', 'preowned-phones']
  },
  'computers': {
    label: 'Computers',
    categories: ['laptops', 'tablets', 'preowned-laptops', 'preowned-tablets']
  },
  'accessories': {
    label: 'Accessories',
    categories: ['mobile-accessories', 'phone-covers', 'chargers', 'headphones', 'earbuds', 'smartwatches', 'screen-protectors', 'cables', 'other-accessories']
  }
};

// Helper function to get category name from slug
export const getCategoryFromSlug = (slug) => {
  return SLUG_TO_CATEGORY[slug] || null;
};

// Helper function to get slug from category name
export const getSlugFromCategory = (category) => {
  return CATEGORY_TO_SLUG[category] || null;
};

// Helper function to get display label from slug
export const getLabelFromSlug = (slug) => {
  return CATEGORY_LABELS[slug] || slug;
};

// Helper function to generate category URL
export const getCategoryUrl = (slug) => {
  return `/category/${slug}`;
};

// Validate if a slug is valid
export const isValidCategorySlug = (slug) => {
  return slug in SLUG_TO_CATEGORY;
  };
  