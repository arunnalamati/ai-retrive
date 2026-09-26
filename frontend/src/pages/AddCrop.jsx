import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cropApi } from '../api/cropApi';
import {
  Wheat,
  Calendar,
  Layers,
  FileText,
  TrendingUp,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const AddCrop = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    cropName: '',
    season: 'Summer',
    sowingDate: new Date().toISOString().split('T')[0],
    expectedHarvestDate: '',
    cropStatus: 'Planted',
    estimatedYield: '',
    notes: '',
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

    if (!formData.cropName || !formData.season || !formData.sowingDate || !formData.expectedHarvestDate) {
      setError('Please fill in all mandatory crop information.');
      return;
    }

    if (new Date(formData.expectedHarvestDate) <= new Date(formData.sowingDate)) {
      setError('Expected harvest date must be after the sowing date.');
      return;
    }

    setLoading(true);
    try {
      const res = await cropApi.createCrop(formData);
      if (res.success) {
        setSuccessMsg('Crop record successfully saved! Redirecting to My Crops...');
        setTimeout(() => {
          navigate('/my-crops');
        }, 1200);
      }
    } catch (err) {
      console.error('Error creating crop:', err);
      setError(err.response?.data?.message || 'Failed to save crop details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page-container">
      <div className="form-header-bar">
        <Link to="/my-crops" className="back-link">
          <ArrowLeft size={16} /> Back to My Crops
        </Link>
        <h1>Add New Crop Information</h1>
        <p>Record your crop details, sowing schedule, and harvest projections.</p>
      </div>

      <div className="form-card-wrapper">
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

        <form onSubmit={handleSubmit} className="custom-form">
          <div className="form-section">
            <h3 className="section-title">
              <Wheat size={20} className="section-icon" /> Crop Specifications
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cropName">Crop Variety / Name *</label>
                <input
                  id="cropName"
                  type="text"
                  name="cropName"
                  value={formData.cropName}
                  onChange={handleChange}
                  placeholder="e.g. Wheat (PBW 550), Basmati Rice, Cotton"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="season">Season *</label>
                <select
                  id="season"
                  name="season"
                  value={formData.season}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select Season ▼</option>
                  <option value="Summer">Summer</option>
                  <option value="Rainy">Rainy</option>
                  <option value="Winter">Winter</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sowingDate">Sowing Date *</label>
                <input
                  id="sowingDate"
                  type="date"
                  name="sowingDate"
                  value={formData.sowingDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="expectedHarvestDate">Expected Harvest Date *</label>
                <input
                  id="expectedHarvestDate"
                  type="date"
                  name="expectedHarvestDate"
                  value={formData.expectedHarvestDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cropStatus">Initial Crop Status *</label>
                <select
                  id="cropStatus"
                  name="cropStatus"
                  value={formData.cropStatus}
                  onChange={handleChange}
                  required
                >
                  <option value="Planted">Planted (Seedling stage)</option>
                  <option value="Growing">Growing (Vegetative / Flowering)</option>
                  <option value="Harvested">Harvested (Yield collected)</option>
                  <option value="Completed">Completed (Storage / Sold)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="estimatedYield">Estimated Yield (Optional)</label>
                <input
                  id="estimatedYield"
                  type="text"
                  name="estimatedYield"
                  value={formData.estimatedYield}
                  onChange={handleChange}
                  placeholder="e.g. 20 Quintals / Acre, 40 Bags"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Field Notes & Observations (Optional)</label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Specify fertilizers applied, pest control measures, or soil moisture remarks..."
              ></textarea>
            </div>
          </div>

          <div className="form-actions-bar">
            <button
              type="button"
              onClick={() => navigate('/my-crops')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving Crop...' : 'Save Crop Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCrop;
