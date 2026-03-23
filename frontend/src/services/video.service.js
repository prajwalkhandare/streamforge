import api from './api';

export const videoService = {
  // Get all videos with pagination and filters
  async getVideos(params = {}) {
    const response = await api.get('/videos', { params });
    return response.data;
  },

  // Get featured videos
  async getFeaturedVideos() {
    const response = await api.get('/videos/featured');
    return response.data;
  },

  // Get trending videos
  async getTrendingVideos() {
    const response = await api.get('/videos/trending');
    return response.data;
  },

  // Get video by ID
  async getVideoById(id) {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  },

  // Watch video (get stream URL)
  async watchVideo(id) {
    const response = await api.post(`/videos/${id}/watch`);
    return response.data;
  },

  // Like video
  async likeVideo(id) {
    const response = await api.post(`/videos/${id}/like`);
    return response.data;
  },

  // Unlike video
  async unlikeVideo(id) {
    const response = await api.post(`/videos/${id}/unlike`);
    return response.data;
  },

  // Get related videos
  async getRelatedVideos(id) {
    const response = await api.get(`/videos/${id}/related`);
    return response.data;
  },

  // Get videos by category
  async getVideosByCategory(category, params = {}) {
    const response = await api.get(`/videos/category/${category}`, { params });
    return response.data;
  },

  // Get user watch history
  async getWatchHistory(params = {}) {
    const response = await api.get('/videos/history', { params });
    return response.data;
  },

  // Rate video
  async rateVideo(id, rating) {
    const response = await api.post(`/videos/${id}/rate`, { rating });
    return response.data;
  },

  // Add comment
  async addComment(videoId, text) {
    const response = await api.post(`/videos/${videoId}/comments`, { text });
    return response.data;
  },

  // Get comments
  async getComments(videoId, params = {}) {
    const response = await api.get(`/videos/${videoId}/comments`, { params });
    return response.data;
  },

  // Admin: Create video
  async createVideo(formData) {
    const response = await api.post('/videos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Admin: Update video
  async updateVideo(id, data) {
    const response = await api.put(`/videos/${id}`, data);
    return response.data;
  },

  // Admin: Delete video
  async deleteVideo(id) {
    const response = await api.delete(`/videos/${id}`);
    return response.data;
  },
};