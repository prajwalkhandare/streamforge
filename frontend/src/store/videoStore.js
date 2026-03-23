import { create } from 'zustand';
import { videoService } from '../services/video.service';

export const useVideoStore = create((set, get) => ({
  // State
  videos: [],
  featuredVideos: [],
  trendingVideos: [],
  currentVideo: null,
  streamUrl: null,
  watchHistory: [],
  myList: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },

  // Fetch all videos
  fetchVideos: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await videoService.getVideos(params);
      set({
        videos: response.data?.videos || [],
        pagination: response.data?.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
        loading: false,
      });
      return response.data;
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.error?.message || 'Failed to load videos',
      });
      return null;
    }
  },

  // Fetch featured videos
  fetchFeaturedVideos: async () => {
    set({ loading: true, error: null });
    try {
      const response = await videoService.getFeaturedVideos();
      set({
        featuredVideos: response.data?.videos || [],
        loading: false,
      });
      return response.data?.videos;
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.error?.message || 'Failed to load featured videos',
      });
      return [];
    }
  },

  // Fetch trending videos
  fetchTrendingVideos: async () => {
    set({ loading: true, error: null });
    try {
      const response = await videoService.getTrendingVideos();
      set({
        trendingVideos: response.data?.videos || [],
        loading: false,
      });
      return response.data?.videos;
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.error?.message || 'Failed to load trending videos',
      });
      return [];
    }
  },

  // Get video by ID
  getVideoById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await videoService.getVideoById(id);
      set({
        currentVideo: response.data?.video,
        loading: false,
      });
      return response.data?.video;
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.error?.message || 'Failed to load video',
      });
      return null;
    }
  },

  // Watch video
  watchVideo: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await videoService.watchVideo(id);
      set({
        streamUrl: response.data?.streamUrl,
        loading: false,
      });
      return response.data?.streamUrl;
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.error?.message || 'Failed to load video stream',
      });
      return null;
    }
  },

  // Like video
  likeVideo: async (id) => {
    try {
      await videoService.likeVideo(id);
      // Update current video likes count if exists
      const { currentVideo } = get();
      if (currentVideo && currentVideo.id === id) {
        set({
          currentVideo: {
            ...currentVideo,
            likes: (currentVideo.likes || 0) + 1,
            liked: true,
          },
        });
      }
      return true;
    } catch (error) {
      set({ error: 'Failed to like video' });
      return false;
    }
  },

  // Unlike video
  unlikeVideo: async (id) => {
    try {
      await videoService.unlikeVideo(id);
      const { currentVideo } = get();
      if (currentVideo && currentVideo.id === id) {
        set({
          currentVideo: {
            ...currentVideo,
            likes: Math.max((currentVideo.likes || 0) - 1, 0),
            liked: false,
          },
        });
      }
      return true;
    } catch (error) {
      set({ error: 'Failed to unlike video' });
      return false;
    }
  },

  // Get related videos
  getRelatedVideos: async (id) => {
    try {
      const response = await videoService.getRelatedVideos(id);
      return response.data?.videos || [];
    } catch (error) {
      return [];
    }
  },

  // Fetch watch history
  fetchWatchHistory: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await videoService.getWatchHistory(params);
      set({
        watchHistory: response.data?.history || [],
        loading: false,
      });
      return response.data?.history;
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.error?.message || 'Failed to load watch history',
      });
      return [];
    }
  },

  // Fetch my list
  fetchMyList: async () => {
    set({ loading: true, error: null });
    try {
      const response = await videoService.getMyList();
      set({
        myList: response.data?.videos || [],
        loading: false,
      });
      return response.data?.videos;
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.error?.message || 'Failed to load my list',
      });
      return [];
    }
  },

  // Add to my list
  addToMyList: async (videoId, videoData) => {
    try {
      await videoService.addToMyList(videoId);
      set((state) => ({
        myList: [...state.myList, videoData],
      }));
      return true;
    } catch (error) {
      set({ error: 'Failed to add to my list' });
      return false;
    }
  },

  // Remove from my list
  removeFromMyList: async (videoId) => {
    try {
      await videoService.removeFromMyList(videoId);
      set((state) => ({
        myList: state.myList.filter((video) => video.id !== videoId),
      }));
      return true;
    } catch (error) {
      set({ error: 'Failed to remove from my list' });
      return false;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset state
  reset: () =>
    set({
      videos: [],
      featuredVideos: [],
      trendingVideos: [],
      currentVideo: null,
      streamUrl: null,
      watchHistory: [],
      myList: [],
      loading: false,
      error: null,
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    }),
}));