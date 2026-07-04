import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyOtp: async (data) => {
    const response = await api.post('/auth/verify-otp', data);
    if (response.data.data?.token) {
      localStorage.setItem('trackyt_token', response.data.data.token);
      localStorage.setItem('trackyt_user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },
  resendOtp: async (data) => {
    const response = await api.post('/auth/resend-otp', data);
    return response.data;
  },
  getProfile: () => api.get('/auth/profile'),
  updateProfile: async (formData) => {
    const response = await api.put('/auth/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data.data?.user) {
      localStorage.setItem('trackyt_user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  logout: async () => {
    // Tell the server to blacklist this token in Redis
    await api.post('/auth/logout');
  },
};

export default authService;
