import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const navigate = useNavigate(); 
  useEffect(() => {
    setIsAuthenticated(!!token); 
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken'); 
    }
  }, [token]); 

  const login = (newToken) => {
    setToken(newToken); 
  };

  const logout = () => {
    setToken(null); 
    navigate('/login'); 
  };

  const contextValue = {
    token, 
    isAuthenticated, 
    login, 
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
