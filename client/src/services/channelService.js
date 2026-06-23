import api from './api';

export const channelService = {
  addChannel: (url) => api.post('/channels', { url }),
  getChannels: () => api.get('/channels'),
  getChannel: (id) => api.get(`/channels/${id}`),
  removeChannel: (id) => api.delete(`/channels/${id}`),
  // Trigger a manual scan of all channels for new changes
  refreshChannels: () => api.post('/channels/refresh', {}, { timeout: 60000 }),
};

export default channelService;
