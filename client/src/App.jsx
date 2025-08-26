import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import ProductDetail from './pages/ProductDetails/ProductDetail';
import Cart from './pages/CartPage/Cart';
import Checkout from './pages/CheckOut/Checkout';
import OrderDetails from './components/OrderDetails/OrderDetails';
import Login from './pages/Login/Login';
import Register from './pages/Login/Register';
import Navbar from './components/Navbar/Navbar';
import CardPaymentPage from './pages/Payment/CardPaymentPage';
import { UserProvider } from './context/UserContext';
import { CartProvider } from './context/CartContext';
import Homepage from './pages/Home/Homepage';
import Footer from './components/Footer/Footer';
import CategoryPage from './pages/Category/CategoryPage';
import MyOrders from './pages/MyOrders/MyOrders';
import ToBeShippedDetailScreen from './pages/MyOrders/ToBeShippedDetailScreen';

// ✅ Import SpeedInsights
import { SpeedInsights } from "@vercel/speed-insights/react";

function App() {
  return (
    <Router>
      <UserProvider>
        <CartProvider>
          <div className="app">
            <Navbar />
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/product/:id" element={<ProductDetail />} /> {/* Duplicate route */}
              <Route path="/category/:category" element={<CategoryPage />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/card-payment" element={<CardPaymentPage />} />
              <Route path="/order/:id" element={<OrderDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/homepage" element={<Homepage />} /> {/* Duplicate route */}
              <Route path="/footer" element={<Footer />} /> {/* Not usually a route */}
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/tobeshipped/order/:id" element={<ToBeShippedDetailScreen />} />
            </Routes>

            {/* ✅ Add SpeedInsights here */}
            <SpeedInsights />

            {/* Footer can be placed here if you want it across all pages */}
            {/* <Footer /> */}
          </div>
        </CartProvider>
      </UserProvider>
    </Router>
  );
}

export default App;
