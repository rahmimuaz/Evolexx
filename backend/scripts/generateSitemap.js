// Script to generate static sitemap.xml file
// Run this script to generate/update the sitemap.xml file in client/public/
// Usage: node backend/scripts/generateSitemap.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

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

const generateSitemap = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get base URL from environment or use default
    const baseUrl = process.env.CLIENT_BASE_URL || 'https://www.evolexx.lk';
    
    // Get all products that have slugs (active products)
    const products = await Product.find({ slug: { $exists: true, $ne: null, $ne: '' } })
      .select('slug updatedAt')
      .sort({ updatedAt: -1 })
      .limit(500);
    
    console.log(`Found ${products.length} products with slugs`);
    
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

    // Write to client/public/sitemap.xml
    const sitemapPath = path.join(__dirname, '../../client/public/sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap, 'utf8');
    
    console.log(`✅ Sitemap generated successfully at: ${sitemapPath}`);
    console.log(`   Total URLs: ${products.length + 1} (${products.length} products + 1 homepage)`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
};

generateSitemap();

