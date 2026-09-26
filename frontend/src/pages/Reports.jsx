import React, { useState, useEffect } from 'react';
import { farmerApi } from '../api/farmerApi';
import { cropApi } from '../api/cropApi';
import {
  FileBarChart,
  Users,
  Wheat,
  Clock,
  CheckCircle2,
  Filter,
  RefreshCw,
  Printer,
  Calendar,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

const Reports = () => {
  const [farmers, setFarmers] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pending filter inputs (before Apply is clicked)
  const [seasonInput, setSeasonInput] = useState('ALL');
  const [statusInput, setStatusInput] = useState('ALL');
  const [farmerInput, setFarmerInput] = useState('ALL');
  const [villageInput, setVillageInput] = useState('ALL');

  // Applied filter state
  const [appliedFilters, setAppliedFilters] = useState({
    season: 'ALL',
    status: 'ALL',
    farmer: 'ALL',
    village: 'ALL',
  });

  const [reportGeneratedAt, setReportGeneratedAt] = useState(null);

  // Fetch real data from existing backend APIs
  const fetchReportData = async () => {
    setLoading(true);
    setError('');
    try {
      const [farmersRes, cropsRes] = await Promise.all([
        farmerApi.getFarmers(),
        cropApi.getCrops(),
      ]);

      if (farmersRes.success) {
        setFarmers(farmersRes.data);
      }
      if (cropsRes.success) {
        setCrops(cropsRes.data);
      }
      setReportGeneratedAt(new Date().toLocaleString());
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Unable to load report datasets from backend. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Compute number of crops per farmer
  const getFarmerCropCount = (farmer) => {
    return crops.filter((crop) => {
      const fId = crop.farmerId?._id || crop.farmerId;
      const uId = crop.userId?._id || crop.userId;
      const targetFId = farmer._id;
      const targetUId = farmer.userId?._id || farmer.userId;
      return (fId && fId.toString() === targetFId.toString()) ||
             (uId && targetUId && uId.toString() === targetUId.toString());
    }).length;
  };

  // Get distinct village and farmer lists for filter dropdowns
  const uniqueVillages = Array.from(new Set(farmers.map((f) => f.village).filter(Boolean))).sort();
  const uniqueFarmers = Array.from(new Set(farmers.map((f) => f.farmerName).filter(Boolean))).sort();

  // Apply filters handler
  const handleApplyFilters = () => {
    setAppliedFilters({
      season: seasonInput,
      status: statusInput,
      farmer: farmerInput,
      village: villageInput,
    });
    setReportGeneratedAt(new Date().toLocaleString());
  };

  // Clear filters handler
  const handleClearFilters = () => {
    setSeasonInput('ALL');
    setStatusInput('ALL');
    setFarmerInput('ALL');
    setVillageInput('ALL');
    setAppliedFilters({
      season: 'ALL',
      status: 'ALL',
      farmer: 'ALL',
      village: 'ALL',
    });
    setReportGeneratedAt(new Date().toLocaleString());
  };

  // Filter crops based on applied filters
  const filteredCrops = crops.filter((crop) => {
    const cropFarmerName = crop.farmerId?.farmerName || crop.userId?.name || '';
    const cropVillage = crop.farmerId?.village || '';

    const matchesSeason =
      appliedFilters.season === 'ALL' || crop.season === appliedFilters.season;

    const matchesStatus =
      appliedFilters.status === 'ALL' || crop.cropStatus === appliedFilters.status;

    const matchesFarmer =
      appliedFilters.farmer === 'ALL' || cropFarmerName === appliedFilters.farmer;

    const matchesVillage =
      appliedFilters.village === 'ALL' || cropVillage === appliedFilters.village;

    return matchesSeason && matchesStatus && matchesFarmer && matchesVillage;
  });

  // Filter farmers based on applied filters
  const filteredFarmers = farmers.filter((farmer) => {
    const matchesFarmer =
      appliedFilters.farmer === 'ALL' || farmer.farmerName === appliedFilters.farmer;

    const matchesVillage =
      appliedFilters.village === 'ALL' || farmer.village === appliedFilters.village;

    return matchesFarmer && matchesVillage;
  });

  // Calculate Summary metrics
  const totalFarmers = farmers.length;
  const totalCrops = crops.length;
  const activeGrowingCrops = crops.filter((c) =>
    ['Planted', 'Growing'].includes(c.cropStatus)
  ).length;
  const harvestedCrops = crops.filter((c) =>
    ['Harvested', 'Completed'].includes(c.cropStatus)
  ).length;

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
    <div className="dashboard-page reports-page">
      <div className="dashboard-header">
        <div>
          <div className="welcome-tag admin-tag">👑 Administrative Intelligence</div>
          <h1>Crop & Farmer Analytical Reports</h1>
          <p className="header-subtitle">
            Comprehensive system analytics, crop distribution breakdowns, and regional farmer logs.
          </p>
        </div>
        <div className="header-actions">
          <button
            onClick={fetchReportData}
            className="btn btn-outline btn-sm"
            disabled={loading}
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh Data
          </button>
          <button
            onClick={() => window.print()}
            className="btn btn-secondary btn-sm"
            title="Print Report"
          >
            <Printer size={16} />
            Print Report
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrap metric-blue">
            <Users size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Registered Farmers</span>
            <h3 className="metric-value">{loading ? '...' : totalFarmers}</h3>
            <span className="metric-trend text-blue">Verified profiles</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap metric-emerald">
            <Wheat size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Crops</span>
            <h3 className="metric-value">{loading ? '...' : totalCrops}</h3>
            <span className="metric-trend text-emerald">Overall records</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap metric-amber">
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Active Growing Crops</span>
            <h3 className="metric-value">{loading ? '...' : activeGrowingCrops}</h3>
            <span className="metric-trend text-amber">Currently in fields</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap metric-purple">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Harvested / Completed Crops</span>
            <h3 className="metric-value">{loading ? '...' : harvestedCrops}</h3>
            <span className="metric-trend text-purple">Yield collected / sold</span>
          </div>
        </div>
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="content-card">
        <div className="card-header-flex">
          <div>
            <h3>Filter Parameters</h3>
            <p>Select criteria and generate customized crop & farmer summaries</p>
          </div>
          {reportGeneratedAt && (
            <div className="report-meta-timestamp">
              <Calendar size={14} /> Report Generated: <strong>{reportGeneratedAt}</strong>
            </div>
          )}
        </div>

        <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Season Filter */}
          <div className="form-group">
            <label htmlFor="seasonFilterSelect">Season</label>
            <select
              id="seasonFilterSelect"
              value={seasonInput}
              onChange={(e) => setSeasonInput(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Seasons</option>
              <option value="Summer">Summer</option>
              <option value="Rainy">Rainy</option>
              <option value="Winter">Winter</option>
            </select>
          </div>

          {/* Crop Status Filter */}
          <div className="form-group">
            <label htmlFor="statusFilterSelect">Crop Status</label>
            <select
              id="statusFilterSelect"
              value={statusInput}
              onChange={(e) => setStatusInput(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Status</option>
              <option value="Planted">Planted</option>
              <option value="Growing">Growing</option>
              <option value="Harvested">Harvested</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Farmer Filter */}
          <div className="form-group">
            <label htmlFor="farmerFilterSelect">Farmer</label>
            <select
              id="farmerFilterSelect"
              value={farmerInput}
              onChange={(e) => setFarmerInput(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Farmers</option>
              {uniqueFarmers.map((fName) => (
                <option key={fName} value={fName}>{fName}</option>
              ))}
            </select>
          </div>

          {/* Village Filter */}
          <div className="form-group">
            <label htmlFor="villageFilterSelect">Village</label>
            <select
              id="villageFilterSelect"
              value={villageInput}
              onChange={(e) => setVillageInput(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Villages</option>
              {uniqueVillages.map((vName) => (
                <option key={vName} value={vName}>{vName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleApplyFilters}
            className="btn btn-secondary btn-sm"
          >
            <Filter size={16} /> Apply Filters
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            className="btn btn-outline btn-sm"
          >
            <RotateCcw size={16} /> Clear Filters
          </button>
          <button
            type="button"
            onClick={handleApplyFilters}
            className="btn btn-primary btn-sm"
          >
            <FileBarChart size={16} /> Generate Report
          </button>
        </div>
      </div>

      {/* CROP REPORT TABLE */}
      <div className="content-card">
        <div className="card-header-flex">
          <div>
            <h3>Crop Report Table</h3>
            <p>Showing {filteredCrops.length} of {crops.length} crop records</p>
          </div>
        </div>

        {loading ? (
          <div className="table-loader">
            <div className="spinner"></div>
            <p>Generating crop report...</p>
          </div>
        ) : filteredCrops.length === 0 ? (
          <div className="empty-state-card">
            <Wheat size={48} className="empty-icon" />
            <h4>No Crops Matched Your Filter Criteria</h4>
            <p>Try resetting or broadening your filter parameters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Crop ID</th>
                  <th>Crop Name</th>
                  <th>Farmer Name</th>
                  <th>Season</th>
                  <th>Sowing Date</th>
                  <th>Expected Harvest Date</th>
                  <th>Crop Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCrops.map((crop) => (
                  <tr key={crop._id}>
                    <td>
                      <span className="mono-code">{crop.cropId || crop._id.substring(0, 8)}</span>
                    </td>
                    <td>
                      <strong>{crop.cropName}</strong>
                      {crop.estimatedYield && (
                        <div className="table-subtext">Yield: {crop.estimatedYield}</div>
                      )}
                    </td>
                    <td>
                      <span className="farmer-meta-name">
                        {crop.farmerId?.farmerName || crop.userId?.name || 'Unassigned'}
                      </span>
                      {crop.farmerId?.village && (
                        <div className="table-subtext">📍 {crop.farmerId.village}</div>
                      )}
                    </td>
                    <td>
                      <span className="season-pill">{crop.season}</span>
                    </td>
                    <td>{crop.sowingDate ? new Date(crop.sowingDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{crop.expectedHarvestDate ? new Date(crop.expectedHarvestDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(crop.cropStatus)}`}>
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

      {/* FARMER REPORT TABLE */}
      <div className="content-card">
        <div className="card-header-flex">
          <div>
            <h3>Farmer Report Table</h3>
            <p>Showing {filteredFarmers.length} of {farmers.length} registered farmers</p>
          </div>
        </div>

        {loading ? (
          <div className="table-loader">
            <div className="spinner"></div>
            <p>Generating farmer report...</p>
          </div>
        ) : filteredFarmers.length === 0 ? (
          <div className="empty-state-card">
            <Users size={48} className="empty-icon" />
            <h4>No Farmers Matched Your Filter Criteria</h4>
            <p>Try resetting your village or farmer filter options.</p>
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
                  <th>Irrigation Type</th>
                  <th>Number of Crops</th>
                </tr>
              </thead>
              <tbody>
                {filteredFarmers.map((farmer) => {
                  const cropCount = getFarmerCropCount(farmer);
                  return (
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
                      <td>
                        <strong style={{ color: cropCount > 0 ? 'var(--primary-700)' : 'var(--gray-500)' }}>
                          {cropCount} {cropCount === 1 ? 'Crop' : 'Crops'}
                        </strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
