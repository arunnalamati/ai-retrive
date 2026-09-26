import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Lock,
  Mail,
  User,
  X,
  KeyRound,
  Shield,
} from 'lucide-react';

const ManageAdmins = () => {
  const { user: currentUser } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Create Admin Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Delete Confirmation Modal State
  const [deletingAdmin, setDeletingAdmin] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch admin list
  const fetchAdmins = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getAdmins();
      if (res.success) {
        setAdmins(res.data);
      }
    } catch (err) {
      console.error('Error fetching admins:', err);
      setError('Unable to fetch administrators list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Filter admins
  const filteredAdmins = admins.filter((admin) => {
    const term = searchTerm.toLowerCase();
    return (
      admin.name?.toLowerCase().includes(term) ||
      admin.email?.toLowerCase().includes(term)
    );
  });

  // Handle Form Change
  const handleCreateChange = (e) => {
    setCreateFormData({
      ...createFormData,
      [e.target.name]: e.target.value,
    });
    if (createError) setCreateError('');
  };

  // Submit Create New Admin
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    // Validations
    if (!createFormData.name || !createFormData.email || !createFormData.password) {
      setCreateError('Please fill in all mandatory fields');
      return;
    }

    if (createFormData.password.length < 6) {
      setCreateError('Password must be at least 6 characters long');
      return;
    }

    if (createFormData.password !== createFormData.confirmPassword) {
      setCreateError('Passwords do not match');
      return;
    }

    setCreateLoading(true);
    try {
      // Backend automatically assigns role = "admin" and verifies logged-in JWT
      const res = await adminApi.createAdmin({
        name: createFormData.name,
        email: createFormData.email,
        password: createFormData.password,
        confirmPassword: createFormData.confirmPassword,
      });

      if (res.success) {
        setSuccessMsg(`Administrator '${res.admin.name}' created successfully!`);
        setShowCreateModal(false);
        setCreateFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
        });
        fetchAdmins();
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      console.error('Admin creation error:', err);
      setCreateError(
        err.response?.data?.message ||
          err.message ||
          'Failed to create admin account. Duplicate email or invalid details.'
      );
    } finally {
      setCreateLoading(false);
    }
  };

  // Confirm Delete Admin
  const handleDeleteConfirm = async () => {
    if (!deletingAdmin) return;

    // Client-side guard for self-deletion
    if (
      deletingAdmin._id === currentUser?.id ||
      deletingAdmin._id === currentUser?._id
    ) {
      setError('You cannot delete your own admin account.');
      setDeletingAdmin(null);
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await adminApi.deleteAdmin(deletingAdmin._id);
      if (res.success) {
        setSuccessMsg(res.message || 'Admin account deleted successfully.');
        setDeletingAdmin(null);
        fetchAdmins();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Delete admin error:', err);
      setError(
        err.response?.data?.message ||
          'Unable to delete administrator account. Please try again.'
      );
      setDeletingAdmin(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const isCurrentAdmin = (admin) => {
    return (
      admin._id === currentUser?.id ||
      admin._id === currentUser?._id ||
      admin.email === currentUser?.email
    );
  };

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="dashboard-header">
        <div>
          <div className="welcome-tag admin-tag">👑 Admin Access Control</div>
          <h1>Manage Admins</h1>
          <p className="header-subtitle">
            Secure administrative roster. Create new administrators and manage system privileges.
          </p>
        </div>
        <div className="header-actions">
          <button
            onClick={fetchAdmins}
            className="btn btn-outline btn-sm"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => {
              setCreateError('');
              setShowCreateModal(true);
            }}
            className="btn btn-primary"
          >
            <UserPlus size={18} />
            + Create New Admin
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="alert-box alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert-box alert-success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Security Info Card */}
      <div className="info-banner-card">
        <div className="banner-icon-circle">
          <Shield size={24} color="#059669" />
        </div>
        <div className="banner-text">
          <h4>Privileged Access Policy</h4>
          <p>
            Admin accounts are protected by role-based authorization. New admins must be provisioned here by an authenticated administrator. Public user registration cannot create admin accounts.
          </p>
        </div>
        <div className="banner-stat">
          <span className="banner-stat-number">{admins.length}</span>
          <span className="banner-stat-label">Active Admins</span>
        </div>
      </div>

      {/* Search Bar & Table Card */}
      <div className="content-card">
        <div className="card-header-flex">
          <div>
            <h3>System Administrators ({filteredAdmins.length})</h3>
            <p>Users authorized with full administrative privileges</p>
          </div>
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="clear-search-btn">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="table-loader">
            <div className="spinner"></div>
            <p>Loading administrative directory...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="empty-state-card">
            <ShieldCheck size={48} className="empty-icon" />
            <h4>No Administrators Found</h4>
            <p>
              {searchTerm
                ? 'No admin accounts match your search filter.'
                : 'No administrator accounts registered in system.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => {
                  const isCurrent = isCurrentAdmin(admin);
                  return (
                    <tr key={admin._id} className={isCurrent ? 'highlight-row' : ''}>
                      <td>
                        <div className="user-table-cell">
                          <div className="user-avatar-circle">
                            <ShieldCheck size={18} color="#059669" />
                          </div>
                          <div>
                            <strong>{admin.name}</strong>
                            {isCurrent && (
                              <span className="badge badge-sm badge-current-user">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-secondary">{admin.email}</span>
                      </td>
                      <td>
                        <span className="role-badge badge-admin">
                          <ShieldCheck size={13} />
                          Admin
                        </span>
                      </td>
                      <td>
                        <span className="text-secondary">
                          {admin.createdAt
                            ? new Date(admin.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'N/A'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isCurrent ? (
                          <span
                            className="status-pill status-active"
                            title="You cannot delete your own logged-in admin account"
                          >
                            Current Session
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeletingAdmin(admin)}
                            className="action-btn delete-btn"
                            title={`Delete ${admin.name}`}
                          >
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create New Admin Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge">
                  <UserPlus size={20} color="#059669" />
                </div>
                <div>
                  <h3>Create New Admin</h3>
                  <p>Provision a new system administrator with full access</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="modal-close-btn"
                disabled={createLoading}
              >
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div className="alert-box alert-error modal-alert">
                <AlertTriangle size={18} />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="modal-body-form">
              <div className="form-group">
                <label htmlFor="adminName">Full Name *</label>
                <div className="input-with-icon">
                  <User size={18} className="field-icon" />
                  <input
                    id="adminName"
                    type="text"
                    name="name"
                    value={createFormData.name}
                    onChange={handleCreateChange}
                    placeholder="e.g. John Doe"
                    required
                    disabled={createLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="adminEmail">Email Address *</label>
                <div className="input-with-icon">
                  <Mail size={18} className="field-icon" />
                  <input
                    id="adminEmail"
                    type="email"
                    name="email"
                    value={createFormData.email}
                    onChange={handleCreateChange}
                    placeholder="admin@farmerportal.com"
                    required
                    disabled={createLoading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="adminPassword">Password *</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="field-icon" />
                    <input
                      id="adminPassword"
                      type="password"
                      name="password"
                      value={createFormData.password}
                      onChange={handleCreateChange}
                      placeholder="Min 6 characters"
                      required
                      disabled={createLoading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="adminConfirmPassword">Confirm Password *</label>
                  <div className="input-with-icon">
                    <KeyRound size={18} className="field-icon" />
                    <input
                      id="adminConfirmPassword"
                      type="password"
                      name="confirmPassword"
                      value={createFormData.confirmPassword}
                      onChange={handleCreateChange}
                      placeholder="Repeat password"
                      required
                      disabled={createLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="security-notice-box">
                <ShieldCheck size={16} color="#059669" />
                <span>
                  Backend automatically enforces <strong>role = "admin"</strong>. The new administrator will be able to log in with these credentials.
                </span>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline"
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createLoading}
                >
                  {createLoading ? 'Creating Admin...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAdmin && (
        <div className="modal-overlay">
          <div className="modal-box modal-confirm">
            <div className="confirm-icon-wrap">
              <AlertTriangle size={36} color="#dc2626" />
            </div>
            <h3>Delete Administrator Account?</h3>
            <p>
              Are you sure you want to permanently remove admin account for{' '}
              <strong>"{deletingAdmin.name}"</strong> ({deletingAdmin.email})?
            </p>
            <p className="confirm-subtext">
              They will immediately lose administrative access to this system.
            </p>
            <div className="modal-footer justify-center">
              <button
                type="button"
                onClick={() => setDeletingAdmin(null)}
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
                {deleteLoading ? 'Deleting...' : 'Yes, Delete Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAdmins;
