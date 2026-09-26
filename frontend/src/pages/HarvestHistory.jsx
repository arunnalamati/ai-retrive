import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cropApi } from '../api/cropApi';
import {
  History,
  Wheat,
  Calendar,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Award,
} from 'lucide-react';

const HarvestHistory = () => {
  const { isAdmin } = useAuth();
  const [harvestedCrops, setHarvestedCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHarvestHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await cropApi.getCrops('Harvested');
      if (res.success) {
        setHarvestedCrops(res.data);
      }
    } catch (err) {
      console.error('Error fetching harvest history:', err);
      setError('Unable to fetch harvest records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHarvestHistory();
  }, []);

  // Calculate days between sowing and harvest
  const calculateDurationDays = (sowing, harvest) => {
    if (!sowing || !harvest) return 'N/A';
    const start = new Date(sowing);
    const end = new Date(harvest);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  return (
    <div className="harvest-history-page">
      <div className="dashboard-header">
        <div>
          <div className="welcome-tag">🌾 Harvest Archive</div>
          <h1>Harvest History & Yield Records</h1>
          <p className="header-subtitle">
            Historical log of all successfully harvested and completed agricultural cycles.
          </p>
        </div>
        <div className="header-actions">
          <button
            onClick={fetchHarvestHistory}
            className="btn btn-outline btn-sm"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Banner */}
      <div className="metrics-grid mb-6">
        <div className="metric-card">
          <div className="metric-icon-wrap metric-emerald">
            <Award size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Completed Cycles</span>
            <h3 className="metric-value">{loading ? '...' : harvestedCrops.length}</h3>
            <span className="metric-trend text-emerald">Harvested records</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap metric-blue">
            <Wheat size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Crop Varieties</span>
            <h3 className="metric-value">
              {loading
                ? '...'
                : new Set(harvestedCrops.map((c) => c.cropName)).size}
            </h3>
            <span className="metric-trend text-blue">Unique crops harvested</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap metric-amber">
            <Calendar size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Dominant Season</span>
            <h3 className="metric-value">
              {loading || harvestedCrops.length === 0 ? 'N/A' : (harvestedCrops[0]?.season || 'Summer')}
            </h3>
            <span className="metric-trend text-amber">Active seasons</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="content-card">
        {loading ? (
          <div className="table-loader">
            <div className="spinner"></div>
            <p>Loading completed harvests...</p>
          </div>
        ) : harvestedCrops.length === 0 ? (
          <div className="empty-state-card">
            <History size={48} className="empty-icon" />
            <h4>No Harvested Crops Yet</h4>
            <p>
              Once your crops are harvested and their status is updated to "Harvested" or "Completed", they will appear here.
            </p>
            <Link to="/my-crops" className="btn btn-secondary btn-sm">
              Check My Crops
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Crop ID</th>
                  <th>Crop Name</th>
                  {isAdmin && <th>Farmer</th>}
                  <th>Season</th>
                  <th>Sowing Date</th>
                  <th>Harvest Date</th>
                  <th>Duration</th>
                  <th>Recorded Yield</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {harvestedCrops.map((crop) => (
                  <tr key={crop._id}>
                    <td>
                      <span className="mono-code">{crop.cropId || crop._id.substring(0, 8)}</span>
                    </td>
                    <td>
                      <strong>{crop.cropName}</strong>
                      {crop.notes && <div className="table-subtext">📝 {crop.notes}</div>}
                    </td>
                    {isAdmin && (
                      <td>
                        <span className="farmer-meta-name">
                          {crop.farmerId?.farmerName || crop.userId?.name || 'Farmer'}
                        </span>
                      </td>
                    )}
                    <td>
                      <span className="season-pill">{crop.season}</span>
                    </td>
                    <td>{new Date(crop.sowingDate).toLocaleDateString()}</td>
                    <td>{new Date(crop.expectedHarvestDate).toLocaleDateString()}</td>
                    <td>
                      <span className="duration-tag">
                        {calculateDurationDays(crop.sowingDate, crop.expectedHarvestDate)}
                      </span>
                    </td>
                    <td>
                      <strong className="yield-text">
                        {crop.estimatedYield || 'Standard Yield'}
                      </strong>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          crop.cropStatus === 'Completed'
                            ? 'status-completed'
                            : 'status-harvested'
                        }`}
                      >
                        <CheckCircle2 size={12} />
                        {crop.cropStatus}
                      </span>
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

export default HarvestHistory;
