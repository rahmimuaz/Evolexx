import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import AddProduct from './pages/Inventory/AddProduct';
import EditProduct from './pages/Inventory/EditProduct';
import Products from './pages/Inventory/Products';
import OrderList from './pages/OrderManagement/OrderList';
import ToBeShippedList from './pages/OrderManagement/ToBeShippedList';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import LoginForm from './pages/AdminLogin/LoginForm';
import RegisterForm from './pages/AdminLogin/RegisterForm';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';
import './styles/admin-global.css';
import LowStockProducts from './pages/Inventory/LowStockProducts';
import OutOfStockProducts from './pages/Inventory/OutOfStockProducts';
import UserList from './pages/AdminDashboard/UserList';
import NewArrivals from './pages/Inventory/NewArrivals';
import ProductOrder from './pages/Inventory/ProductOrder';
import HeroVideoManager from './pages/Settings/HeroVideoManager';

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated ? (
        <Sidebar>
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/AddProduct" element={<AddProduct />} />
            <Route path="/EditProduct/:id" element={<EditProduct />} />
            <Route path="/Products" element={<Products />} />
            <Route path="/OrderList" element={<OrderList />} />
            <Route path="/ToBeShippedList" element={<ToBeShippedList />} />
            <Route path="/admin/low-stock" element={<LowStockProducts />} />
            <Route path="/admin/out-of-stock" element={<OutOfStockProducts />} />
            <Route path="/admin/users" element={<UserList />} />
            <Route path="/admin/new-arrivals" element={<NewArrivals />} />
            <Route path="/admin/product-order" element={<ProductOrder />} />
            <Route path="/admin/hero-video" element={<HeroVideoManager />} />
            <Route path="*" element={<AdminDashboard />} />
          </Routes>
        </Sidebar>
      ) : (
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginForm /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterForm /></PublicRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;