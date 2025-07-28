// src/components/Auth/Login.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import './Login.css';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Login = ({ asModal = false, onSuccess, onSwitchRegister, sourcePage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // State to hold error messages
  const navigate = useNavigate();
  const { login, setUser } = useUser();

  const submitHandler = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Clear previous errors
    try {
      await login(email, password);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/');
      }
    } catch (error) {
      // Check if the error has a response and data property
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message); // Set specific error message from backend
      } else {
        setErrorMessage('Login failed. Please try again.'); // Generic fallback
      }
      console.error('Login error:', error); // Log the full error for debugging
    }
  };

  const clientId = '235074436580-tqrft13a5lddfr16sq1qth0quficpu5k.apps.googleusercontent.com'; // Ensure this is correct

  const handleGoogleSuccess = async (credentialResponse) => {
    setErrorMessage(''); // Clear previous errors
    try {
      const res = await axios.post(`${API_BASE_URL}/api/users/google-login`, {
        token: credentialResponse.credential,
      });

      // Use context method to update user state & localStorage
      setUser(res.data);

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMessage(err.response.data.message); // Set specific error message from backend
      } else {
        setErrorMessage('Google login failed. Please try again.'); // Generic fallback
      }
      console.error('Google login error:', err); // Log the full error for debugging
    }
  };

  const LoginForm = () => (
    <>
      <h2 className="login-title">Login</h2>
      {/* Conditionally show the message ONLY if asModal is true AND sourcePage is 'productDetail' */}
      {asModal && sourcePage === 'productDetail' && (
        <p className="login-prompt-message">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
           <span className="message-text">
            Please log in to add items to your cart
            <br />
            or proceed with your purchase.
          </span>
        </p>
      )}

      {/* Display error message here */}
      {errorMessage && (
        <div className="error-message-login"> {/* Removed inline style, added class */}
          {errorMessage}
        </div>
      )}

      <form onSubmit={submitHandler}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email Address</label>
          <input
            type="email"
            id="email"
            className="form-input"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group password">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            id="password"
            className="form-input password-input"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-button">Login</button>
      </form>

      <div className="google-login-wrapper">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setErrorMessage('Google Login Failed. Please try again.')} // Set error message for Google login
          render={(renderProps) => (
            <button
              onClick={renderProps.onClick}
              disabled={renderProps.disabled}
              className="custom-google-button"
              type="button"
            >
              <span className="google-icon" />
              Sign in with Google
            </button>
          )}
        />
      </div>
    </>
  );

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {asModal ? (
        <div>
          {LoginForm()}
          <p className="register-text">
            New Customer?{' '}
            <button
              type="button"
              className="register-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={onSwitchRegister}
            >
              Register
            </button>
          </p>
        </div>
      ) : (
        <div className="login-page-container">
          <div className="login-card">
            {LoginForm()}
            <p className="register-text">
              New Customer? <Link to="/register" className="register-link">Register</Link>
            </p>
          </div>
        </div>
      )}
    </GoogleOAuthProvider>
  );
};

export default Login;
