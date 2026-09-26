import api from './api';

export const authApi = {
  login: async (credentials) => {
    const response = await api.post('/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/register', userData);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/me');
    return response.data;
  },
};
