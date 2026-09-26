import api from './api';

export const adminApi = {
  // Fetch all existing admins
  getAdmins: async () => {
    const response = await api.get('/admin/admins');
    return response.data;
  },

  // Create a new admin (backend strictly assigns role = 'admin')
  createAdmin: async (adminData) => {
    const response = await api.post('/admin/create-admin', adminData);
    return response.data;
  },

  // Delete an admin account
  deleteAdmin: async (adminId) => {
    const response = await api.delete(`/admin/admins/${adminId}`);
    return response.data;
  },
};
