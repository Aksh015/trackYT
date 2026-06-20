import api from './api';

const getVideoHistory = (channelId, videoId) => {
  return api.get(`/channels/${channelId}/videos/${videoId}/history`);
};

export default {
  getVideoHistory,
};
