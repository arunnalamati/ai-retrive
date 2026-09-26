import React, { useState, useEffect } from 'react';
import { farmerApi } from '../api/farmerApi';
import {
  Users,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Phone,
  MapPin,
  RefreshCw,
  Eye,
} from 'lucide-react';

const ManageFarmers = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal State
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Confirmation Modal State
  const [deletingFarmer, setDeletingFarmer] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // View Details Modal State
  const [viewingFarmer, setViewingFarmer] = useState(null);

  const fetchFarmers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await farmerApi.getFarmers();
      if (res.success) {
        setFarmers(res.data);
      }
    } catch (err) {
      console.error('Error fetching farmers:', err);
      setError('Failed to load farmers list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  const filteredFarmers = farmers.filter((f) => {
    const term = searchTerm.toLowerCase();
    return (
      f.farmerName.toLowerCase().includes(term) ||
      f.village.toLowerCase().includes(term) ||
      f.mobile.toLowerCase().includes(term) ||
      (f.farmerId && f.farmerId.toLowerCase().includes(term))
    );
  });

  // Open Edit Modal
  const handleOpenEdit = (farmer) => {
    setEditingFarmer(farmer);
    setEditFormData({
      farmerName: farmer.farmerName,
      village: farmer.village,
      mobile: farmer.mobile,
      landArea: farmer.landArea,
      soilType: farmer.soilType,
      irrigationType: farmer.irrigationType,
    });
    setEditError('');
  };

  // Submit Edit
  const handleUpdateFarmer = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const res = await farmerApi.updateFarmer(editingFarmer._id, editFormData);
      if (res.success) {
        setSuccessMsg(`Farmer profile for '${editFormData.farmerName}' updated.`);
        setEditingFarmer(null);
        fetchFarmers();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update farmer record');
    } finally {
      setEditLoading(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deletingFarmer) return;
    setDeleteLoading(true);
    try {
      const res = await farmerApi.deleteFarmer(deletingFarmer._id);
      if (res.success) {
        setSuccessMsg(`Farmer '${deletingFarmer.farmerName}' and their records deleted.`);
        setDeletingFarmer(null);
        setFarmers((prev) => prev.filter((f) => f._id !== deletingFarmer._id));
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete farmer record');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="manage-farmers-page">
      <div className="dashboard-header">
        <div>
          <div className="welcome-tag admin-tag">👑 Farmer Administration</div>
          <h1>Manage Regional Farmers</h1>
          <p className="header-subtitle">
            View farmer directories, update land & irrigation specs, or remove accounts.
          </p>
        </div>
        <div className="header-actions">
          <button
            onClick={fetchFarmers}
            className="btn btn-outline btn-sm"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="alert-box alert-success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert-box alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="filter-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by farmer name, village, mobile, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Farmers Table */}
      <div className="content-card">
        {loading ? (
          <div className="table-loader">
            <div className="spinner"></div>
            <p>Fetching farmer directory from server...</p>
          </div>
        ) : filteredFarmers.length === 0 ? (
          <div className="empty-state-card">
            <Users size={48} className="empty-icon" />
            <h4>No Farmers Found</h4>
            <p>
              {searchTerm
                ? 'No farmers matched your search criteria.'
                : 'No registered farmers found.'}
            </p>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFarmers.map((farmer) => (
                  <tr key={farmer._id}>
                    <td>
                      <span className="mono-code">
                        {farmer.farmerId || farmer._id.substring(0, 8)}
                      </span>
                    </td>
                    <td>
                      <strong>{farmer.farmerName}</strong>
                    </td>
                    <td>
                      <span className="location-pill">
                        <MapPin size={12} /> {farmer.village}
                      </span>
                    </td>
                    <td>
                      <span className="phone-text">
                        <Phone size={12} /> {farmer.mobile}
                      </span>
                    </td>
                    <td>
                      <strong>{farmer.landArea}</strong> Acres
                    </td>
                    <td>
                      <span className="season-pill">{farmer.soilType}</span>
                    </td>
                    <td>{farmer.irrigationType}</td>
                    <td>
                      <div className="action-buttons-group">
                        <button
                          onClick={() => setViewingFarmer(farmer)}
                          className="btn-action btn-action-view"
                          title="View Profile"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(farmer)}
                          className="btn-action btn-action-edit"
                          title="Edit Details"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingFarmer(farmer)}
                          className="btn-action btn-action-delete"
                          title="Delete Farmer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Farmer Details Modal */}
      {viewingFarmer && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Farmer Profile: {viewingFarmer.farmerName}</h3>
              <button
                onClick={() => setViewingFarmer(null)}
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="farmer-detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Farmer ID:</span>
                  <span className="detail-val mono-code">{viewingFarmer.farmerId}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Full Name:</span>
                  <span className="detail-val">{viewingFarmer.farmerName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Village / Location:</span>
                  <span className="detail-val">{viewingFarmer.village}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Contact Mobile:</span>
                  <span className="detail-val">{viewingFarmer.mobile}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Land Area:</span>
                  <span className="detail-val">{viewingFarmer.landArea} Acres</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Soil Type:</span>
                  <span className="detail-val">{viewingFarmer.soilType}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Irrigation System:</span>
                  <span className="detail-val">{viewingFarmer.irrigationType}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Registered On:</span>
                  <span className="detail-val">
                    {new Date(viewingFarmer.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setViewingFarmer(null)}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Farmer Modal */}
      {editingFarmer && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Edit Farmer: {editingFarmer.farmerName}</h3>
              <button
                onClick={() => setEditingFarmer(null)}
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div className="alert-box alert-error">
                <AlertTriangle size={16} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateFarmer}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="editFarmerName">Farmer Name *</label>
                  <input
                    id="editFarmerName"
                    type="text"
                    value={editFormData.farmerName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, farmerName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="editVillage">Village *</label>
                    <input
                      id="editVillage"
                      type="text"
                      value={editFormData.village}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, village: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="editMobile">Mobile Number *</label>
                    <input
                      id="editMobile"
                      type="tel"
                      value={editFormData.mobile}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, mobile: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-row three-cols">
                  <div className="form-group">
                    <label htmlFor="editLandArea">Land (Acres) *</label>
                    <input
                      id="editLandArea"
                      type="number"
                      step="0.1"
                      value={editFormData.landArea}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, landArea: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="editSoil">Soil Type</label>
                    <select
                      id="editSoil"
                      value={editFormData.soilType}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, soilType: e.target.value })
                      }
                    >
                      <option value="Alluvial">Alluvial Soil</option>
                      <option value="Black">Black Soil</option>
                      <option value="Red">Red Soil</option>
                      <option value="Clay">Clay Soil</option>
                      <option value="Sandy">Sandy Soil</option>
                      <option value="Loamy">Loamy Soil</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="editIrrigation">Irrigation</label>
                    <select
                      id="editIrrigation"
                      value={editFormData.irrigationType}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          irrigationType: e.target.value,
                        })
                      }
                    >
                      <option value="Drip Irrigation">Drip Irrigation</option>
                      <option value="Sprinkler">Sprinkler</option>
                      <option value="Canal System">Canal System</option>
                      <option value="Tube Well">Tube Well</option>
                      <option value="Rainfed">Rainfed</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingFarmer(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Update Farmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingFarmer && (
        <div className="modal-overlay">
          <div className="modal-box modal-confirm">
            <div className="confirm-icon-wrap">
              <AlertTriangle size={36} color="#dc2626" />
            </div>
            <h3>Delete Farmer Profile?</h3>
            <p>
              Are you sure you want to permanently delete farmer{' '}
              <strong>"{deletingFarmer.farmerName}"</strong>? This will also remove their user account and all registered crop records.
            </p>
            <div className="modal-footer justify-center">
              <button
                type="button"
                onClick={() => setDeletingFarmer(null)}
                className="btn btn-outline"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="btn btn-danger"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete Farmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFarmers;
