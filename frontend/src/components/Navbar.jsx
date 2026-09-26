import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sprout,
  LayoutDashboard,
  PlusCircle,
  Wheat,
  History,
  Users,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  UserCheck,
  BarChart3,
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isFarmer, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
          <div className="logo-icon-wrap">
            <Sprout size={24} className="brand-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-title">KisanVikas</span>
            <span className="brand-subtitle">Crop Information Portal</span>
          </div>
        </Link>

        {/* Mobile menu toggle */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Navigation links */}
        <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>

          {/* Farmer Specific Links */}
          {isAuthenticated && isFarmer && (
            <>
              <Link
                to="/farmer-dashboard"
                className={`nav-link ${isActive('/farmer-dashboard') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <Link
                to="/add-crop"
                className={`nav-link ${isActive('/add-crop') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <PlusCircle size={16} />
                Add Crop
              </Link>
              <Link
                to="/my-crops"
                className={`nav-link ${isActive('/my-crops') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Wheat size={16} />
                My Crops
              </Link>
              <Link
                to="/harvest-history"
                className={`nav-link ${isActive('/harvest-history') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <History size={16} />
                Harvest History
              </Link>
            </>
          )}

          {/* Admin Specific Links */}
          {isAuthenticated && isAdmin && (
            <>
              <Link
                to="/admin-dashboard"
                className={`nav-link ${isActive('/admin-dashboard') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard size={16} />
                Admin Dashboard
              </Link>
              <Link
                to="/manage-admins"
                className={`nav-link ${isActive('/manage-admins') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShieldCheck size={16} />
                Manage Admins
              </Link>
              <Link
                to="/manage-farmers"
                className={`nav-link ${isActive('/manage-farmers') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users size={16} />
                Manage Farmers
              </Link>
              <Link
                to="/my-crops"
                className={`nav-link ${isActive('/my-crops') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Wheat size={16} />
                All Crop Records
              </Link>
              <Link
                to="/reports"
                className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <BarChart3 size={16} />
                Reports
              </Link>
            </>
          )}

          {/* Auth Action Buttons */}
          <div className="nav-auth-actions">
            {isAuthenticated ? (
              <div className="user-profile-widget">
                <span className={`role-badge ${isAdmin ? 'badge-admin' : 'badge-farmer'}`}>
                  {isAdmin ? <ShieldCheck size={14} /> : <UserCheck size={14} />}
                  {user?.name}
                </span>
                <button onClick={handleLogout} className="btn-logout" title="Sign Out">
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-secondary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
