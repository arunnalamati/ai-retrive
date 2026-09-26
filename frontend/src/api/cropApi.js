import api from './api';

export const cropApi = {
  getCrops: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/crops', { params });
    return response.data;
  },

  getCropById: async (id) => {
    const response = await api.get(`/crops/${id}`);
    return response.data;
  },

  createCrop: async (data) => {
    const response = await api.post('/crops', data);
    return response.data;
  },

  updateCrop: async (id, data) => {
    const response = await api.put(`/crops/${id}`, data);
    return response.data;
  },

  deleteCrop: async (id) => {
    const response = await api.delete(`/crops/${id}`);
    return response.data;
  },

  getCropStats: async () => {
    const response = await api.get('/crops/stats/summary');
    return response.data;
  },
};
