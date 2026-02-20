# Mobile Shop E-commerce Platform

A full-stack e-commerce platform for mobile devices and accessories built with the MERN stack.

## Project Structure

- `backend/` - Node.js/Express backend
- `admin/` - React admin dashboard
- `client/` - React client application

## Security Notice ⚠️

**IMPORTANT**: Never commit sensitive information like database credentials, API keys, or JWT secrets to version control. Always use environment variables for sensitive data.

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your actual values:
   ```
   MONGODB_URI=your_mongodb_connection_string_here
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_here
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

### Admin Dashboard Setup

1. Navigate to the admin directory:
   ```bash
   cd admin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the admin dashboard:
   ```bash
   npm run dev
   ```

### Client Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the client application:
   ```bash
   npm run dev
   ```

## Security Best Practices

1. **Environment Variables**: Always use environment variables for sensitive data
2. **JWT Secrets**: Use strong, random JWT secrets (at least 32 characters)
3. **Database Security**: Use connection strings with proper authentication
4. **Input Validation**: All user inputs are validated on both frontend and backend
5. **Error Handling**: Proper error handling without exposing sensitive information
6. **CORS**: Configure CORS properly for production environments

## Features

### Admin Dashboard

- **Dashboard & Analytics**
  - Overview stats: total products, orders, pending orders, low stock, revenue
  - Orders line chart (last 7 days) with Chart.js
  - Clickable stat cards for quick navigation
  - Real-time notification bell with unread count (low stock, out of stock, new orders)

- **Product Management (Inventory)**
  - Multi-step product creation form (info, specs, pricing, media, review)
  - Category-specific fields and specifications (Electronics, Mobile Accessories, Pre-owned, etc.)
  - Product variations system (storage, color, RAM) with per-variation pricing, stock, and images
  - Markdown long description editor (SimpleMDE)
  - Drag-and-drop image upload (1-5 images per product)
  - Edit and delete products with confirmation modals
  - Search by name/ID and filter by category
  - Low stock and out of stock product views with alert banners
  - New Arrivals management with drag-and-drop ordering
  - Product display order management with drag-and-drop
  - KOKO Pay (3-installment) toggle per product
  - Warranty period selection

- **Order Management**
  - View all orders with expandable details (items, shipping, payment)
  - Advanced filtering: search by order ID, customer, product, or address
  - Filter by order status, payment status, and payment method
  - Sort by date, total, or status
  - Accept/decline orders with status tracking
  - Shipments view for accepted orders ready to ship
  - PDF shipping label generation with customer and order details

- **Local Sales (POS)**
  - Create in-store sales with customer info and item selection
  - Variation-aware product selection with editable pricing
  - Auto-calculated totals with tax and discount fields
  - Payment method selection (cash, card, bank transfer, other)
  - PDF invoice generation and download
  - QR code generation for invoice URLs
  - Local sales history list

- **User Management**
  - View all registered customers and admins
  - Customer/admin count stats
  - Search users by name or email
  - Delete users with confirmation
  - Register new admin accounts

- **Settings**
  - Hero video manager (upload/delete desktop and mobile videos)
  - Enable/disable hero video toggle
  - Cloudinary integration for video storage

- **Authentication**
  - Admin login with JWT token-based auth
  - Admin registration
  - Auto-redirect and session management

### Client Application

- **Product Browsing**
  - Homepage with hero video section (configurable desktop/mobile videos)
  - Product grid with pagination (12 per page)
  - New Arrivals carousel with swipe/touch support
  - Category pages with dedicated product listings
  - Sorting: default, price (low/high), newest, oldest
  - Filters: price range slider, brand dropdown, in-stock toggle
  - Real-time search with debounced suggestions and product previews

- **Product Details**
  - Image gallery with thumbnail navigation and arrow controls
  - Product variation selector (color swatches, storage/RAM buttons)
  - Variation-specific pricing, stock, and images
  - KOKO Pay installment display (3x payment breakdown)
  - Star ratings and review count
  - Quantity selector with stock validation
  - Add to Cart and Buy Now buttons
  - Tabbed content: Description (markdown), Details (specs table), Comments (reviews)
  - Review submission (purchase-verified users only)
  - Related products section
  - Policy accordions (Security, Delivery, Return)
  - SEO structured data (JSON-LD)
  - Breadcrumb navigation

- **Shopping Cart**
  - Persistent cart synced with backend
  - Cart item display with variation details and images
  - Quantity update and item removal
  - Auto-calculated totals
  - Cart icon badge with item count

- **Checkout & Payments**
  - Shipping address form with Sri Lankan city autocomplete
  - Payment methods: Cash on Delivery, Bank Transfer (with proof upload), Card Payment
  - Bank transfer modal with account details and file upload (PDF/image, max 5MB)
  - Order summary with item images and variation details
  - Form validation and error handling

- **User Authentication**
  - Email/password registration with strength validation (8+ chars, number, special char)
  - Email/password login
  - Google OAuth integration
  - Modal and standalone page versions
  - Persistent sessions with token management
  - Session expiration handling

- **Order Tracking**
  - My Orders page with all order history
  - Order status tracking: Pending, Approved, Shipped, Delivered, Declined
  - Payment status display
  - Color-coded status badges with icons
  - Detailed order view (shipping info, payment info, all items)
  - Track shipment link for shipped orders

- **Invoice**
  - Invoice view with full customer and item details
  - PDF invoice download (generated with jsPDF)

- **UI/UX**
  - Fully responsive design (desktop and mobile)
  - Auto-hide/show navbar on scroll
  - Dynamic theme switching (dark on hero, light when scrolled)
  - Loading spinners and skeleton screens
  - Toast notifications for user feedback
  - Reusable modals (click outside or ESC to close)
  - Floating WhatsApp chat button
  - Lazy loading and code splitting

- **Information Pages**
  - Contact page with business info and contact form
  - Terms & Conditions
  - Privacy Policy
  - Refund Policy
  - Footer with newsletter subscription, social media links, and navigation

## Technologies Used

- Frontend: React.js, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB
- Authentication: JWT, Google OAuth
- File Upload: Multer, Cloudinary
- PDF Generation: jsPDF
- Charts: Chart.js
- Markdown Editor: SimpleMDE
- QR Codes: QR code generation for invoices

## Recent Security Fixes

- ✅ Removed hardcoded database credentials
- ✅ Fixed npm security vulnerabilities
- ✅ Removed debug console.log statements
- ✅ Improved authentication middleware
- ✅ Added proper error handling
- ✅ Created .env.example template
