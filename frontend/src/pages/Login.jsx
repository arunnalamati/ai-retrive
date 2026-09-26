import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, Mail, Lock, LogIn, AlertCircle, Sparkles } from 'lucide-react';

const Login = () => {
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    // Check if redirected from registration or session expiration
    if (location.state?.registeredEmail) {
      setFormData((prev) => ({ ...prev, email: location.state.registeredEmail }));
      setInfoMessage('Account created! Please enter your password to login.');
    }
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setError('Your session has expired. Please log in again.');
    }
  }, [location]);

  // If already authenticated, redirect to appropriate dashboard
  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(role === 'admin' ? '/admin-dashboard' : '/farmer-dashboard', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!formData.email || !formData.password) {
      setError('Please provide both email and password');
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login(formData.email, formData.password);
      // Successful login - AuthContext updates state and redirects
      if (loggedInUser.role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else {
        navigate('/farmer-dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Login submit error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Unable to connect to server. Please ensure backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick autofill buttons for viva demonstration
  const handleQuickFill = (type) => {
    if (type === 'farmer') {
      setFormData({
        email: 'ramesh@farmerportal.com',
        password: 'farmer123',
      });
      setError('');
    } else {
      setFormData({
        email: 'admin@farmerportal.com',
        password: 'admin123',
      });
      setError('');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card login-card">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <Sprout size={32} color="#16a34a" />
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to access your agricultural records</p>
        </div>

        {/* Quick Demo Accounts Helper */}
        <div className="quick-fill-bar">
          <span className="quick-fill-label">
            <Sparkles size={14} /> Quick Demo Fill:
          </span>
          <button
            type="button"
            className="btn-pill"
            onClick={() => handleQuickFill('farmer')}
          >
            🌾 Farmer
          </button>
          <button
            type="button"
            className="btn-pill"
            onClick={() => handleQuickFill('admin')}
          >
            👑 Admin
          </button>
        </div>

        {infoMessage && (
          <div className="alert-box alert-info">
            <span>{infoMessage}</span>
          </div>
        )}

        {error && (
          <div className="alert-box alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="field-icon" />
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ramesh@farmerportal.com"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="field-icon" />
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block submit-btn"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            {!loading && <LogIn size={18} />}
          </button>
        </form>

        <div className="auth-footer-prompt">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
