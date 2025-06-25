import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import Products from './pages/ProductList/Products';
import ProductDetail from './pages/ProductDetails/ProductDetail';
import Cart from './pages/CartPage/Cart';
import Checkout from './pages/CheckOut/Checkout';
import OrderDetails from './components/OrderDetails/OrderDetails';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Login/Register';
import Navbar from './components/Navbar/Navbar';
import CardPaymentPage from './pages/Payment/CardPaymentPage';
import { UserProvider } from './context/UserContext';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <Router>
      <UserProvider>
        <CartProvider>
          <div className="app">
            <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/card-payment" element={<CardPaymentPage />} />
                <Route path="/order/:id" element={<OrderDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Routes>
            <ToastContainer position="top-right" autoClose={3000} />
          </div>
        </CartProvider>
      </UserProvider>
    </Router>
  );
}

export default App;
