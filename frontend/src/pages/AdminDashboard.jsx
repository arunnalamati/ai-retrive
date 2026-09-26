import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { farmerApi } from '../api/farmerApi';
import { cropApi } from '../api/cropApi';
import {
  Users,
  Wheat,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Server,
  Database,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [farmersCount, setFarmersCount] = useState(0);
  const [cropsData, setCropsData] = useState({
    totalCrops: 0,
    activeCrops: 0,
    harvestedCrops: 0,
  });
  const [recentFarmers, setRecentFarmers] = useState([]);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [farmersRes, cropsRes] = await Promise.all([
        farmerApi.getFarmers(),
        cropApi.getCrops(),
      ]);

      if (farmersRes.success) {
        setFarmersCount(farmersRes.data.length);
        setRecentFarmers(farmersRes.data.slice(0, 4));
      }

      if (cropsRes.success) {
        const crops = cropsRes.data;
        const totalCrops = crops.length;
        const activeCrops = crops.filter((c) =>
          ['Planted', 'Growing'].includes(c.cropStatus)
        ).length;
        const harvestedCrops = crops.filter((c) =>
          ['Harvested', 'Completed'].includes(c.cropStatus)
        ).length;

        setCropsData({ totalCrops, activeCrops, harvestedCrops });
      }
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
      setError('Unable to fetch administrative metrics from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <div className="welcome-tag admin-tag">👑 Admin Command Center</div>
          <h1>System Overview & Reports</h1>
          <p className="header-subtitle">
            Global management portal for agricultural users, crop inventories, and regional field statistics.
          </p>
        </div>
        <div className="header-actions">
          <button
            onClick={fetchAdminData}
            className="btn btn-outline btn-sm"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <Link to="/manage-admins" className="btn btn-secondary">
            <ShieldCheck size={18} />
            Manage Admins
          </Link>
          <Link to="/manage-farmers" className="btn btn-primary">
            <Users size={18} />
            Manage Farmers
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Admin Stat Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrap metric-blue">
            <Users size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Registered Farmers</span>
            <h3 className="metric-value">{loading ? '...' : farmersCount}</h3>
            <span className="metric-trend text-blue">Regional profiles</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap metric-emerald">
            <Wheat size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Crops Tracked</span>
            <h3 className="metric-value">{loading ? '...' : cropsData.totalCrops}</h3>
            <span className="metric-trend text-emerald">Across all farmers</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap metric-amber">
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Active Growing Crops</span>
            <h3 className="metric-value">{loading ? '...' : cropsData.activeCrops}</h3>
            <span className="metric-trend text-amber">Currently in fields</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap metric-purple">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Harvested / Yield Completed</span>
            <h3 className="metric-value">{loading ? '...' : cropsData.harvestedCrops}</h3>
            <span className="metric-trend text-purple">Historical logs</span>
          </div>
        </div>
      </div>

      {/* Quick Admin Actions */}
      <div className="quick-nav-cards">
        <Link to="/manage-admins" className="quick-action-card">
          <div className="quick-icon-bg bg-purple">
            <ShieldCheck size={22} />
          </div>
          <div className="quick-action-text">
            <h4>Manage Admins</h4>
            <p>Admin directory & create new administrators</p>
          </div>
          <ArrowRight size={18} className="quick-arrow" />
        </Link>

        <Link to="/manage-farmers" className="quick-action-card">
          <div className="quick-icon-bg bg-blue">
            <Users size={22} />
          </div>
          <div className="quick-action-text">
            <h4>Farmer Directory & Operations</h4>
            <p>Update contact information, land area, or remove accounts</p>
          </div>
          <ArrowRight size={18} className="quick-arrow" />
        </Link>

        <Link to="/my-crops" className="quick-action-card">
          <div className="quick-icon-bg bg-emerald">
            <Wheat size={22} />
          </div>
          <div className="quick-action-text">
            <h4>All Crop Records</h4>
            <p>Inspect crop varieties, stages, and harvest predictions</p>
          </div>
          <ArrowRight size={18} className="quick-arrow" />
        </Link>

        <div className="quick-action-card no-hover">
          <div className="quick-icon-bg bg-purple">
            <Server size={22} />
          </div>
          <div className="quick-action-text">
            <h4>API & System Status</h4>
            <p>Port 5000 | JWT Security: Active | Role-Based Access</p>
          </div>
          <ShieldCheck size={18} color="#16a34a" />
        </div>
      </div>

      {/* Recent Registered Farmers */}
      <div className="content-card">
        <div className="card-header-flex">
          <div>
            <h3>Recently Registered Farmers</h3>
            <p>Regional farmers actively logging agricultural details</p>
          </div>
          <Link to="/manage-farmers" className="link-with-icon">
            View All Farmers <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="table-loader">
            <div className="spinner"></div>
            <p>Loading farmers directory...</p>
          </div>
        ) : recentFarmers.length === 0 ? (
          <div className="empty-state-card">
            <Users size={48} className="empty-icon" />
            <h4>No Farmers Registered Yet</h4>
            <p>Registered farmers will automatically appear in this central directory.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Farmer ID</th>
                  <th>Farmer Name</th>
                  <th>Village</th>
                  <th>Mobile</th>
                  <th>Land Area</th>
                  <th>Soil Type</th>
                  <th>Irrigation</th>
                </tr>
              </thead>
              <tbody>
                {recentFarmers.map((farmer) => (
                  <tr key={farmer._id}>
                    <td>
                      <span className="mono-code">{farmer.farmerId || farmer._id.substring(0, 8)}</span>
                    </td>
                    <td>
                      <strong>{farmer.farmerName}</strong>
                    </td>
                    <td>{farmer.village}</td>
                    <td>{farmer.mobile}</td>
                    <td>{farmer.landArea} Acres</td>
                    <td>
                      <span className="season-pill">{farmer.soilType}</span>
                    </td>
                    <td>{farmer.irrigationType}</td>
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

export default AdminDashboard;
