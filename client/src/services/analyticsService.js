import api from './api';

export const eventService = {
  getEvents: (params = {}) => api.get('/events', { params }),
  getChannelEvents: (channelId, params = {}) =>
    api.get(`/events/channel/${channelId}`, { params }),
};

export const analyticsService = {
  getAnalytics: (channelId, params = {}) =>
    api.get(`/analytics/${channelId}`, { params }),
  getAISummary: (channelId, refresh = false) =>
    api.get(`/analytics/${channelId}/summary`, { params: { refresh } }),
};

export { eventService as default };
