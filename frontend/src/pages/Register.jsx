import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, User, Mail, Lock, Phone, MapPin, Layers, Droplets, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    village: '',
    mobile: '',
    landArea: '2.5',
    soilType: 'Loamy',
    irrigationType: 'Drip Irrigation',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all mandatory fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.mobile) {
      setError('Mobile number is required for farmer registration');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        village: formData.village || 'Greenfield',
        mobile: formData.mobile,
        landArea: Number(formData.landArea) || 1,
        soilType: formData.soilType,
        irrigationType: formData.irrigationType,
      };

      await register(payload);
      setSuccessMsg('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { state: { registeredEmail: formData.email } });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <Sprout size={32} color="#16a34a" />
          </div>
          <h2>Create Farmer Account</h2>
          <p>Join the Farmer Crop Information Portal</p>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-box alert-success">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <div className="input-with-icon">
                <User size={18} className="field-icon" />
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Patel"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <div className="input-with-icon">
                <Mail size={18} className="field-icon" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <div className="input-with-icon">
                <Lock size={18} className="field-icon" />
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <div className="input-with-icon">
                <Lock size={18} className="field-icon" />
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>
          </div>

          {/* Agricultural Fields */}
          <div className="farmer-extended-fields">
            <h3 className="section-subheading">Farm & Location Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="village">Village / Town *</label>
                <div className="input-with-icon">
                  <MapPin size={18} className="field-icon" />
                  <input
                    id="village"
                    type="text"
                    name="village"
                    value={formData.village}
                    onChange={handleChange}
                    placeholder="e.g. Green Valley"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="mobile">Mobile Number *</label>
                <div className="input-with-icon">
                  <Phone size={18} className="field-icon" />
                  <input
                    id="mobile"
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-row three-cols">
              <div className="form-group">
                <label htmlFor="landArea">Land Area (Acres) *</label>
                <input
                  id="landArea"
                  type="number"
                  step="0.1"
                  name="landArea"
                  value={formData.landArea}
                  onChange={handleChange}
                  placeholder="e.g. 3.5"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="soilType">Soil Type</label>
                <select
                  id="soilType"
                  name="soilType"
                  value={formData.soilType}
                  onChange={handleChange}
                >
                  <option value="Alluvial">Alluvial Soil</option>
                  <option value="Black">Black Soil (Regur)</option>
                  <option value="Red">Red Soil</option>
                  <option value="Clay">Clay Soil</option>
                  <option value="Sandy">Sandy Soil</option>
                  <option value="Loamy">Loamy Soil</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="irrigationType">Irrigation System</label>
                <select
                  id="irrigationType"
                  name="irrigationType"
                  value={formData.irrigationType}
                  onChange={handleChange}
                >
                  <option value="Drip Irrigation">Drip Irrigation</option>
                  <option value="Sprinkler">Sprinkler System</option>
                  <option value="Canal System">Canal System</option>
                  <option value="Tube Well">Tube Well</option>
                  <option value="Rainfed">Rainfed</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block submit-btn"
            disabled={loading}
          >
            {loading ? 'Registering Account...' : 'Complete Registration'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer-prompt">
          Already registered? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
