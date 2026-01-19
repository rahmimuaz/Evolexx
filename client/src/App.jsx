import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import ResponsiveNavbar from './components/Navbar/ResponsiveNavbar';
import { UserProvider } from './context/UserContext';
import { CartProvider } from './context/CartContext';
import Homepage from './pages/Home/Homepage'; // Keep Homepage eager loaded (main entry)
import WhatsAppButton from './components/WhatsAppButton/WhatsAppButton';

// Lazy load heavy components for better performance
const ProductDetail = lazy(() => import('./pages/ProductDetails/ProductDetail'));
const Cart = lazy(() => import('./pages/CartPage/Cart'));
const Checkout = lazy(() => import('./pages/CheckOut/Checkout'));
const OrderDetails = lazy(() => import('./components/OrderDetails/OrderDetails'));
const Login = lazy(() => import('./pages/Login/Login'));
const Register = lazy(() => import('./pages/Login/Register'));
const CardPaymentPage = lazy(() => import('./pages/Payment/CardPaymentPage'));
const CategoryPage = lazy(() => import('./pages/Category/CategoryPage'));
const MyOrders = lazy(() => import('./pages/MyOrders/MyOrders'));
const ToBeShippedDetailScreen = lazy(() => import('./pages/ToBeShippedDetail/ToBeShippedDetailScreen'));
const Contact = lazy(() => import('./pages/Legal/Contact'));
const RefundPolicy = lazy(() => import('./pages/Legal/RefundPolicy'));
const PrivacyPolicy = lazy(() => import('./pages/Legal/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/Legal/TermsConditions'));
const InvoiceView = lazy(() => import('./pages/Invoice/InvoiceView'));

// Loading fallback component
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
    <div>Loading...</div>
  </div>
);

function App() {
  return (
    <Router>
      <UserProvider>
        <CartProvider>
          <div className="app">
            <ResponsiveNavbar />
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                {/* Legacy ID-based routes for backwards compatibility */}
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/card-payment" element={<CardPaymentPage />} />
                <Route path="/order/:id" element={<OrderDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/homepage" element={<Homepage />} />
                <Route path="/my-orders" element={<MyOrders />} />
                <Route path="/tobeshipped/order/:id" element={<ToBeShippedDetailScreen />} />
                {/* Legal/Policy Pages */}
                <Route path="/contact" element={<Contact />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsConditions />} />
                <Route path="/invoice/:id" element={<InvoiceView />} />
              </Routes>
            </Suspense>
            <WhatsAppButton />
          </div>
        </CartProvider>
      </UserProvider>
    </Router>
  );
}
export default App;