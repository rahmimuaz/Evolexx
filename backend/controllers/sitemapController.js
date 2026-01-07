// backend/controllers/sitemapController.js
import Product from '../models/Product.js';
import asyncHandler from 'express-async-handler';

// Helper function to escape XML special characters
const escapeXml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

// Generate sitemap.xml with current products
export const generateSitemap = asyncHandler(async (req, res) => {
  try {
    // Get base URL from environment or use default
    const baseUrl = process.env.CLIENT_BASE_URL || 'https://www.evolexx.lk';
    
    // Get all products that have slugs (active products)
    const products = await Product.find({ slug: { $exists: true, $ne: null, $ne: '' } })
      .select('slug updatedAt')
      .sort({ updatedAt: -1 })
      .limit(500); // Increased limit for more products
    
    // Get current date for lastmod
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Homepage
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${escapeXml(baseUrl)}</loc>\n`;
    sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
    sitemap += `    <changefreq>daily</changefreq>\n`;
    sitemap += `    <priority>1.0</priority>\n`;
    sitemap += `  </url>\n`;

    // Add product URLs
    products.forEach(product => {
      if (product.slug) {
        const lastmod = product.updatedAt 
          ? new Date(product.updatedAt).toISOString().split('T')[0]
          : currentDate;
        const productUrl = `${baseUrl}/product/${escapeXml(product.slug)}`;
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${productUrl}</loc>\n`;
        sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
        sitemap += `    <changefreq>weekly</changefreq>\n`;
        sitemap += `    <priority>0.7</priority>\n`;
        sitemap += `  </url>\n`;
      }
    });

    sitemap += `</urlset>`;

    // Set proper headers for XML
    res.set({
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    });
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).set('Content-Type', 'text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<error>Error generating sitemap</error>`);
  }
});

