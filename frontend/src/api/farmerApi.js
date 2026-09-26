import api from './api';

export const farmerApi = {
  getFarmers: async () => {
    const response = await api.get('/farmers');
    return response.data;
  },

  getFarmerById: async (id) => {
    const response = await api.get(`/farmers/${id}`);
    return response.data;
  },

  createFarmer: async (data) => {
    const response = await api.post('/farmers', data);
    return response.data;
  },

  updateFarmer: async (id, data) => {
    const response = await api.put(`/farmers/${id}`, data);
    return response.data;
  },

  deleteFarmer: async (id) => {
    const response = await api.delete(`/farmers/${id}`);
    return response.data;
  },
};
