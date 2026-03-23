import React, { useState, useEffect } from 'react';
import { videoService } from '../services/video.service';
import HeroBanner from '../components/HeroBanner';
import CategoryRow from '../components/CategoryRow';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Browse = () => {
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const featured = await videoService.getFeaturedVideos();
        const trending = await videoService.getTrendingVideos();
        const allVideos = await videoService.getVideos({ limit: 20 });
        
        setFeaturedVideos(featured.data?.videos || []);
        setTrendingVideos(trending.data?.videos || []);
        setRecommendedVideos(allVideos.data?.videos || []);
      } catch (error) {
        console.error('Error fetching videos:', error);
        toast.error('Failed to load videos');
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="bg-dark min-h-screen">
      {featuredVideos.length > 0 && <HeroBanner video={featuredVideos[0]} />}
      <div className="px-6 -mt-32 relative z-10 pb-12">
        <CategoryRow title="Trending Now" videos={trendingVideos} />
        <CategoryRow title="Recommended for You" videos={recommendedVideos} />
        <CategoryRow title="Featured" videos={featuredVideos.slice(1, 7)} />
      </div>
    </div>
  );
};

export default Browse;