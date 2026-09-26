import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sprout,
  Wheat,
  Calendar,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Droplets,
  Layers,
  CheckCircle2,
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated, isFarmer, isAdmin } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-pill">
            <Sprout size={16} /> <span>Next-Gen Agricultural Intelligence</span>
          </div>
          <h1 className="hero-title">
            Farmer Crop <span className="text-highlight">Information Portal</span>
          </h1>
          <p className="hero-subtitle">
            A comprehensive MERN stack platform designed to empower farmers with digitized crop lifecycle tracking, sowing records, harvest forecasting, and centralized administrative management.
          </p>

          <div className="hero-actions">
            {isAuthenticated ? (
              <Link
                to={isFarmer ? '/farmer-dashboard' : '/admin-dashboard'}
                className="btn btn-primary btn-lg"
              >
                Go to Your Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started as Farmer <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  Portal Login
                </Link>
              </>
            )}
          </div>

          {/* Quick Demo Credentials helper card */}
          <div className="demo-credentials-banner">
            <div className="demo-title">
              <CheckCircle2 size={16} color="#16a34a" /> <strong>College Viva Demo Accounts:</strong>
            </div>
            <div className="demo-badges">
              <span className="demo-badge">
                👨‍🌾 <strong>Farmer:</strong> ramesh@farmerportal.com / <code>farmer123</code>
              </span>
              <span className="demo-badge">
                👑 <strong>Admin:</strong> admin@farmerportal.com / <code>admin123</code>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="features-section">
        <div className="section-header">
          <h2>Everything Farmers & Administrators Need</h2>
          <p>Built for clarity, speed, and real-world agricultural workflow management.</p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper green-bg">
              <Wheat size={28} />
            </div>
            <h3>Crop Lifecycle Tracking</h3>
            <p>Maintain accurate digital records from initial sowing to active growing and final harvesting stages.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper amber-bg">
              <Calendar size={28} />
            </div>
            <h3>Harvest Scheduling</h3>
            <p>Forecast harvest timelines based on seasonal cycles (Summer, Rainy, Winter) and field conditions.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper blue-bg">
              <Droplets size={28} />
            </div>
            <h3>Irrigation & Soil Profiling</h3>
            <p>Record land area, soil categorization (Black, Alluvial, Loamy), and modern drip or canal irrigation setups.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper purple-bg">
              <ShieldCheck size={28} />
            </div>
            <h3>Role-Based Security</h3>
            <p>Strict JWT-backed authentication ensuring farmer data privacy and secure administrative oversight.</p>
          </div>
        </div>
      </section>

      {/* Dual Portal Modules Comparison */}
      <section className="modules-comparison-section">
        <div className="comparison-card">
          <div className="module-header farmer-header">
            <Wheat size={32} />
            <div>
              <h3>Farmer Portal</h3>
              <p>Self-service crop logging & management</p>
            </div>
          </div>
          <ul className="module-features-list">
            <li><CheckCircle2 size={16} /> Register with village & farm acreage details</li>
            <li><CheckCircle2 size={16} /> Add, edit, and delete crop records</li>
            <li><CheckCircle2 size={16} /> Track active vs harvested crop history</li>
            <li><CheckCircle2 size={16} /> Real-time status cards & upcoming harvest alerts</li>
          </ul>
          <Link to="/login" className="btn btn-secondary w-full">Access Farmer Module</Link>
        </div>

        <div className="comparison-card">
          <div className="module-header admin-header">
            <ShieldCheck size={32} />
            <div>
              <h3>Admin Command Center</h3>
              <p>Regional directory & crop monitoring</p>
            </div>
          </div>
          <ul className="module-features-list">
            <li><CheckCircle2 size={16} /> View all registered regional farmers</li>
            <li><CheckCircle2 size={16} /> Update farmer profile & contact details</li>
            <li><CheckCircle2 size={16} /> View comprehensive crop distribution records</li>
            <li><CheckCircle2 size={16} /> Cascade record deletion and system analytics</li>
          </ul>
          <Link to="/login" className="btn btn-secondary w-full">Access Admin Module</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
