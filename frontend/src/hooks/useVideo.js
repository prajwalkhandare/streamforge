import { useState, useEffect } from 'react';
import { videoService } from '../services/video.service';
import toast from 'react-hot-toast';

export const useVideo = (videoId = null) => {
  const [video, setVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);

  // Fetch single video
  useEffect(() => {
    if (!videoId) return;

    const fetchVideo = async () => {
      setLoading(true);
      try {
        const data = await videoService.getVideoById(videoId);
        setVideo(data.data.video);
        
        const streamData = await videoService.watchVideo(videoId);
        setStreamUrl(streamData.data.streamUrl);
      } catch (err) {
        setError(err.message);
        toast.error('Failed to load video');
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [videoId]);

  // Fetch all videos with filters
  const fetchVideos = async (filters = {}) => {
    setLoading(true);
    try {
      const data = await videoService.getVideos(filters);
      setVideos(data.data?.videos || []);
      return data.data;
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load videos');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatured = async () => {
    setLoading(true);
    try {
      const data = await videoService.getFeaturedVideos();
      return data.data?.videos || [];
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const data = await videoService.getTrendingVideos();
      return data.data?.videos || [];
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const likeVideo = async (id) => {
    try {
      await videoService.likeVideo(id);
      if (video && video.id === id) {
        setVideo({ ...video, likes: (video.likes || 0) + 1 });
      }
      toast.success('Liked!');
      return true;
    } catch (err) {
      toast.error('Failed to like');
      return false;
    }
  };

  const unlikeVideo = async (id) => {
    try {
      await videoService.unlikeVideo(id);
      if (video && video.id === id) {
        setVideo({ ...video, likes: Math.max((video.likes || 0) - 1, 0) });
      }
      toast.success('Unliked');
      return true;
    } catch (err) {
      toast.error('Failed to unlike');
      return false;
    }
  };

  const getRelated = async (id) => {
    try {
      const data = await videoService.getRelatedVideos(id);
      return data.data?.videos || [];
    } catch (err) {
      return [];
    }
  };

  return {
    video,
    videos,
    loading,
    error,
    streamUrl,
    fetchVideos,
    fetchFeatured,
    fetchTrending,
    likeVideo,
    unlikeVideo,
    getRelated,
  };
};