import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cropApi } from '../api/cropApi';
import {
  Wheat,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  Clock,
  RefreshCw,
} from 'lucide-react';

const MyCrops = () => {
  const { user, isAdmin } = useAuth();

  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [seasonFilter, setSeasonFilter] = useState('ALL');

  // Edit Modal State
  const [editingCrop, setEditingCrop] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Confirmation Modal State
  const [deletingCrop, setDeletingCrop] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch crops from API
  const fetchCrops = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await cropApi.getCrops();
      if (res.success) {
        setCrops(res.data);
      }
    } catch (err) {
      console.error('Error fetching crops:', err);
      setError('Unable to fetch crop records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  // Filter crops
  const filteredCrops = crops.filter((crop) => {
    const matchesSearch =
      crop.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (crop.cropId && crop.cropId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (crop.farmerId?.farmerName && crop.farmerId.farmerName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || crop.cropStatus === statusFilter;

    const matchesSeason =
      seasonFilter === 'ALL' || crop.season === seasonFilter;

    return matchesSearch && matchesStatus && matchesSeason;
  });

  // Open Edit Modal
  const handleOpenEdit = (crop) => {
    setEditingCrop(crop);
    setEditFormData({
      cropName: crop.cropName,
      season: crop.season,
      sowingDate: crop.sowingDate ? new Date(crop.sowingDate).toISOString().split('T')[0] : '',
      expectedHarvestDate: crop.expectedHarvestDate ? new Date(crop.expectedHarvestDate).toISOString().split('T')[0] : '',
      cropStatus: crop.cropStatus,
      estimatedYield: crop.estimatedYield || '',
      notes: crop.notes || '',
    });
    setEditError('');
  };

  // Submit Edit
  const handleUpdateCrop = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const res = await cropApi.updateCrop(editingCrop._id, editFormData);
      if (res.success) {
        setSuccessMsg(`Crop '${editFormData.cropName}' updated successfully!`);
        setEditingCrop(null);
        // Refresh crop list without page reload
        fetchCrops();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update crop');
    } finally {
      setEditLoading(false);
    }
  };

  // Confirm and execute delete
  const handleDeleteConfirm = async () => {
    if (!deletingCrop) return;
    setDeleteLoading(true);
    try {
      const res = await cropApi.deleteCrop(deletingCrop._id);
      if (res.success) {
        setSuccessMsg(`Crop '${deletingCrop.cropName}' removed successfully.`);
        setDeletingCrop(null);
        // Update local state without full reload
        setCrops((prev) => prev.filter((c) => c._id !== deletingCrop._id));
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete crop record');
    } finally {
      setDeleteLoading(false);
    }
  };

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
    <div className="crops-page">
      <div className="dashboard-header">
        <div>
          <h1>{isAdmin ? 'All Agricultural Crop Records' : 'My Crop Records'}</h1>
          <p className="header-subtitle">
            {isAdmin
              ? 'Comprehensive view of all crops registered across all regional farmers'
              : 'Manage, update, and track status for your sown and growing crops'}
          </p>
        </div>
        <div className="header-actions">
          <button
            onClick={fetchCrops}
            className="btn btn-outline btn-sm"
            title="Refresh list"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          {!isAdmin && (
            <Link to="/add-crop" className="btn btn-primary">
              <PlusCircle size={18} /> Add Crop
            </Link>
          )}
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

      {/* Search & Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder={isAdmin ? "Search by crop, ID, or farmer name..." : "Search crops by name or ID..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={16} className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Statuses</option>
            <option value="Planted">Planted</option>
            <option value="Growing">Growing</option>
            <option value="Harvested">Harvested</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={seasonFilter}
            onChange={(e) => setSeasonFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Seasons</option>
            <option value="Summer">Summer</option>
            <option value="Rainy">Rainy</option>
            <option value="Winter">Winter</option>
          </select>
        </div>
      </div>

      {/* Main Table / Content Card */}
      <div className="content-card">
        {loading ? (
          <div className="table-loader">
            <div className="spinner"></div>
            <p>Fetching crop details from server...</p>
          </div>
        ) : filteredCrops.length === 0 ? (
          <div className="empty-state-card">
            <Wheat size={48} className="empty-icon" />
            <h4>No Crop Records Found</h4>
            <p>
              {searchTerm || statusFilter !== 'ALL' || seasonFilter !== 'ALL'
                ? 'Try adjusting your search query or filters.'
                : 'No crops have been added yet.'}
            </p>
            {!isAdmin && (
              <Link to="/add-crop" className="btn btn-primary btn-sm">
                <PlusCircle size={16} /> Add Your First Crop
              </Link>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Crop ID</th>
                  <th>Crop Name</th>
                  {isAdmin && <th>Farmer / Village</th>}
                  <th>Season</th>
                  <th>Sowing Date</th>
                  <th>Expected Harvest</th>
                  <th>Status</th>
                  <th>Actions</th>
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
                    {isAdmin && (
                      <td>
                        <span className="farmer-meta-name">
                          {crop.farmerId?.farmerName || crop.userId?.name || 'Farmer'}
                        </span>
                        <div className="table-subtext">
                          📍 {crop.farmerId?.village || 'Unknown Village'}
                        </div>
                      </td>
                    )}
                    <td>
                      <span className="season-pill">{crop.season}</span>
                    </td>
                    <td>{new Date(crop.sowingDate).toLocaleDateString()}</td>
                    <td>{new Date(crop.expectedHarvestDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(crop.cropStatus)}`}>
                        {crop.cropStatus}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-group">
                        <button
                          onClick={() => handleOpenEdit(crop)}
                          className="btn-action btn-action-edit"
                          title="Edit Crop"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingCrop(crop)}
                          className="btn-action btn-action-delete"
                          title="Delete Crop"
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

      {/* Edit Crop Modal */}
      {editingCrop && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Edit Crop: {editingCrop.cropName}</h3>
              <button
                onClick={() => setEditingCrop(null)}
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

            <form onSubmit={handleUpdateCrop}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="modalCropName">Crop Name *</label>
                  <input
                    id="modalCropName"
                    type="text"
                    value={editFormData.cropName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, cropName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="modalSeason">Season *</label>
                    <select
                      id="modalSeason"
                      value={editFormData.season}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, season: e.target.value })
                      }
                      required
                    >
                      <option value="" disabled>Select Season ▼</option>
                      <option value="Summer">Summer</option>
                      <option value="Rainy">Rainy</option>
                      <option value="Winter">Winter</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="modalStatus">Crop Status *</label>
                    <select
                      id="modalStatus"
                      value={editFormData.cropStatus}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, cropStatus: e.target.value })
                      }
                      required
                    >
                      <option value="Planted">Planted</option>
                      <option value="Growing">Growing</option>
                      <option value="Harvested">Harvested</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="modalSowingDate">Sowing Date</label>
                    <input
                      id="modalSowingDate"
                      type="date"
                      value={editFormData.sowingDate}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, sowingDate: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modalHarvestDate">Expected Harvest Date</label>
                    <input
                      id="modalHarvestDate"
                      type="date"
                      value={editFormData.expectedHarvestDate}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          expectedHarvestDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="modalYield">Estimated / Realized Yield</label>
                  <input
                    id="modalYield"
                    type="text"
                    value={editFormData.estimatedYield}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        estimatedYield: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modalNotes">Notes</label>
                  <textarea
                    id="modalNotes"
                    rows="2"
                    value={editFormData.notes}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, notes: e.target.value })
                    }
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingCrop(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Update Crop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCrop && (
        <div className="modal-overlay">
          <div className="modal-box modal-confirm">
            <div className="confirm-icon-wrap">
              <AlertTriangle size={36} color="#dc2626" />
            </div>
            <h3>Delete Crop Record?</h3>
            <p>
              Are you sure you want to permanently delete <strong>"{deletingCrop.cropName}"</strong>? This action cannot be undone.
            </p>
            <div className="modal-footer justify-center">
              <button
                type="button"
                onClick={() => setDeletingCrop(null)}
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
                {deleteLoading ? 'Deleting...' : 'Yes, Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCrops;
