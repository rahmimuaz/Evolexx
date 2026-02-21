import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  // Set up axios interceptor to handle session expiration (401 Unauthorized)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // 401 = session expired, invalid token, or not authorized
        if (error.response?.status === 401) {
          const hadUser = !!localStorage.getItem('userInfo');
          // Clear user data
          localStorage.removeItem('userInfo');
          setUser(null);

          // Only show alert if user was logged in (avoids duplicate toasts on login failure)
          if (hadUser) {
            toast.error('Session expired. Please log in again.', {
              autoClose: 5000,
            });
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/users/login`,
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      toast.success('Login successful!');
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/users`,
        { name, email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      toast.success('Registration successful!');
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = (silent = false) => {
    localStorage.removeItem('userInfo');
    setUser(null);
    if (!silent) {
    toast.success('Logged out successfully');
    }
  };

  const getAuthToken = () => {
    return user?.token;
  };

  // New function to update user state and localStorage (used for Google login)
  const setUserState = (userData) => {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <UserContext.Provider value={{ user, loading, login, register, logout, getAuthToken, setUser: setUserState }}>
      {!loading && children}
    </UserContext.Provider>
  );
};
