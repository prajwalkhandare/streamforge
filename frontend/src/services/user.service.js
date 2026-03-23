import api from './api';

export const userService = {
  // Profile
  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.put('/users/profile', data);
    if (response.data.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  async updateAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/users/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (response.data.data?.avatarUrl) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.avatar_url = response.data.data.avatarUrl;
      localStorage.setItem('user', JSON.stringify(user));
    }
    return response.data;
  },

  // Watch History
  async getWatchHistory(params = {}) {
    const response = await api.get('/users/history', { params });
    return response.data;
  },

  async removeFromHistory(videoId) {
    const response = await api.delete(`/users/history/${videoId}`);
    return response.data;
  },

  async clearHistory() {
    const response = await api.delete('/users/history');
    return response.data;
  },

  // My List (Watch Later)
  async getMyList() {
    const response = await api.get('/users/my-list');
    return response.data;
  },

  async addToMyList(videoId) {
    const response = await api.post(`/users/my-list/${videoId}`);
    return response.data;
  },

  async removeFromMyList(videoId) {
    const response = await api.delete(`/users/my-list/${videoId}`);
    return response.data;
  },

  // Preferences
  async getPreferences() {
    const response = await api.get('/users/preferences');
    return response.data;
  },

  async updatePreferences(preferences) {
    const response = await api.put('/users/preferences', preferences);
    return response.data;
  },

  // Ratings
  async getUserRatings() {
    const response = await api.get('/users/ratings');
    return response.data;
  },

  // Admin: Get all users
  async getAllUsers(params = {}) {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Admin: Get user by ID
  async getUserById(id) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Admin: Update user role
  async updateUserRole(id, role) {
    const response = await api.put(`/users/${id}/role`, { role });
    return response.data;
  },

  // Admin: Delete user
  async deleteUser(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};