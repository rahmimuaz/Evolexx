import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';
import './styles/admin-global.css';

// Lazy load admin pages for better performance
const AdminDashboard = lazy(() => import('./pages/AdminDashboard/AdminDashboard'));
const AddProduct = lazy(() => import('./pages/Inventory/AddProduct'));
const EditProduct = lazy(() => import('./pages/Inventory/EditProduct'));
const Products = lazy(() => import('./pages/Inventory/Products'));
const OrderList = lazy(() => import('./pages/OrderManagement/OrderList'));
const ToBeShippedList = lazy(() => import('./pages/OrderManagement/ToBeShippedList'));
const LoginForm = lazy(() => import('./pages/AdminLogin/LoginForm'));
const RegisterForm = lazy(() => import('./pages/AdminLogin/RegisterForm'));
const LowStockProducts = lazy(() => import('./pages/Inventory/LowStockProducts'));
const OutOfStockProducts = lazy(() => import('./pages/Inventory/OutOfStockProducts'));
const UserList = lazy(() => import('./pages/AdminDashboard/UserList'));
const NewArrivals = lazy(() => import('./pages/Inventory/NewArrivals'));
const ProductOrder = lazy(() => import('./pages/Inventory/ProductOrder'));
const HeroVideoManager = lazy(() => import('./pages/Settings/HeroVideoManager'));
const LocalSales = lazy(() => import('./pages/LocalSales/LocalSales'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="loading-spinner"></div>
    <p className="loading-text" style={{ marginLeft: '1rem' }}>Loading...</p>
  </div>
);

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
          <Suspense fallback={<LoadingFallback />}>
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
              <Route path="/admin/local-sales" element={<LocalSales />} />
              <Route path="*" element={<AdminDashboard />} />
            </Routes>
          </Suspense>
        </Sidebar>
      ) : (
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginForm /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterForm /></PublicRoute>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
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