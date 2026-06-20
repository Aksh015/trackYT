import api from './api';

export const channelService = {
  addChannel: (url) => api.post('/channels', { url }),
  getChannels: () => api.get('/channels'),
  getChannel: (id) => api.get(`/channels/${id}`),
  removeChannel: (id) => api.delete(`/channels/${id}`),
};

export default channelService;
