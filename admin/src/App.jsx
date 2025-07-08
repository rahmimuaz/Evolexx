import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
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
import LowStockProducts from './pages/Inventory/LowStockProducts';
import OutOfStockProducts from './pages/Inventory/OutOfStockProducts';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated ? children : null;
};

function AppContent() {
  return (
    <>
      <Navbar>
        <main className="main-content">
          <div className="max-width-container">
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/AddProduct"
                element={
                  <PrivateRoute>
                    <AddProduct />
                  </PrivateRoute>
                }
              />
              <Route
                path="/EditProduct/:id"
                element={
                  <PrivateRoute>
                    <EditProduct />
                  </PrivateRoute>
                }
              />
              <Route
                path="/Products"
                element={
                  <PrivateRoute>
                    <Products />
                  </PrivateRoute>
                }
              />
              <Route
                path="/OrderList"
                element={
                  <PrivateRoute>
                    <OrderList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/ToBeShippedList"
                element={
                  <PrivateRoute>
                    <ToBeShippedList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/low-stock"
                element={
                  <PrivateRoute>
                    <LowStockProducts />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/out-of-stock"
                element={
                  <PrivateRoute>
                    <OutOfStockProducts />
                  </PrivateRoute>
                }
              />
              <Route
                path="*"
                element={
                  <PrivateRoute>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </main>
      </Navbar>
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