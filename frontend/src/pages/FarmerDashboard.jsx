import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cropApi } from '../api/cropApi';
import {
  Wheat,
  Clock,
  CheckCircle2,
  Calendar,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const FarmerDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalCrops: 0,
    activeCrops: 0,
    harvestedCrops: 0,
    upcomingHarvests: 0,
  });

  const [recentCrops, setRecentCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch both stats and recent crops
      const [statsRes, cropsRes] = await Promise.all([
        cropApi.getCropStats(),
        cropApi.getCrops(),
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
      }

      if (cropsRes.success) {
        // Take the 4 most recent crops
        setRecentCrops(cropsRes.data.slice(0, 4));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Unable to fetch live dashboard metrics. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Planted':
        return 'status-planted';
      case 'Growing':
        return 'status-growing';
      case 'Harvested':
        return 'status-harvested';
      case 'Completed':
        return 'status-completed';
      default:
        return 'status-default';
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <div className="welcome-tag">🌾 Farmer Overview</div>
          <h1>Welcome back, {user?.name || 'Farmer'}</h1>
          <p className="header-subtitle">
            Track your seasonal crop progress, upcoming harvests, and field records.
          </p>
        </div>
        <div className="header-actions">
          <button
            onClick={fetchDashboardData}
            className="btn btn-outline btn-sm"
            title="Refresh Data"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <Link to="/add-crop" className="btn btn-primary">
            <PlusCircle size={18} />
            Add New Crop
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrap metric-blue">
            <Wheat size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Crops Logged</span>
            <h3 className="metric-value">{loading ? '...' : stats.totalCrops}</h3>
            <span className="metric-trend text-blue">Registered in portal</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap metric-green">
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Active / Growing Crops</span>
            <h3 className="metric-value">{loading ? '...' : stats.activeCrops}</h3>
            <span className="metric-trend text-green">In progress in fields</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap metric-emerald">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Harvested / Completed</span>
            <h3 className="metric-value">{loading ? '...' : stats.harvestedCrops}</h3>
            <span className="metric-trend text-emerald">Ready or stored</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap metric-amber">
            <Calendar size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Upcoming Harvests</span>
            <h3 className="metric-value">{loading ? '...' : stats.upcomingHarvests}</h3>
            <span className="metric-trend text-amber">Within next 30 days</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="quick-nav-cards">
        <Link to="/add-crop" className="quick-action-card">
          <div className="quick-icon-bg bg-emerald">
            <PlusCircle size={22} />
          </div>
          <div className="quick-action-text">
            <h4>Record New Sowing</h4>
            <p>Add sowing date, crop variety, and expected harvest</p>
          </div>
          <ArrowRight size={18} className="quick-arrow" />
        </Link>

        <Link to="/my-crops" className="quick-action-card">
          <div className="quick-icon-bg bg-blue">
            <Wheat size={22} />
          </div>
          <div className="quick-action-text">
            <h4>Manage My Crops</h4>
            <p>View, edit crop status, or update field details</p>
          </div>
          <ArrowRight size={18} className="quick-arrow" />
        </Link>

        <Link to="/harvest-history" className="quick-action-card">
          <div className="quick-icon-bg bg-purple">
            <CheckCircle2 size={22} />
          </div>
          <div className="quick-action-text">
            <h4>Harvest History</h4>
            <p>Review past crop yields and completed cycles</p>
          </div>
          <ArrowRight size={18} className="quick-arrow" />
        </Link>
      </div>

      {/* Recent Crops Table Preview */}
      <div className="content-card">
        <div className="card-header-flex">
          <div>
            <h3>Recent Crop Logs</h3>
            <p>Latest active and harvested crop updates</p>
          </div>
          <Link to="/my-crops" className="link-with-icon">
            View All Records <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="table-loader">
            <div className="spinner"></div>
            <p>Loading crop records...</p>
          </div>
        ) : recentCrops.length === 0 ? (
          <div className="empty-state-card">
            <Wheat size={48} className="empty-icon" />
            <h4>No Crops Logged Yet</h4>
            <p>Get started by recording your first crop sowing details.</p>
            <Link to="/add-crop" className="btn btn-primary btn-sm">
              <PlusCircle size={16} /> Add Your First Crop
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Crop ID</th>
                  <th>Crop Name</th>
                  <th>Season</th>
                  <th>Sowing Date</th>
                  <th>Expected Harvest</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentCrops.map((crop) => (
                  <tr key={crop._id}>
                    <td><span className="mono-code">{crop.cropId || crop._id.substring(0, 8)}</span></td>
                    <td><strong>{crop.cropName}</strong></td>
                    <td><span className="season-pill">{crop.season}</span></td>
                    <td>{new Date(crop.sowingDate).toLocaleDateString()}</td>
                    <td>{new Date(crop.expectedHarvestDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(crop.cropStatus)}`}>
                        {crop.cropStatus}
                      </span>
                    </td>
                    <td>
                      <Link to="/my-crops" className="btn btn-secondary btn-xs">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerDashboard;
