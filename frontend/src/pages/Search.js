import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { videoService } from '../services/video.service';
import VideoCard from '../components/VideoCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!query) return;
    
    const searchVideos = async () => {
      setLoading(true);
      try {
        const response = await videoService.getVideos({ search: query, limit: 50 });
        setVideos(response.data?.videos || []);
        setTotal(response.data?.pagination?.total || 0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };
    searchVideos();
  }, [query]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="bg-dark min-h-screen pt-24 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-white text-2xl font-bold mb-2">
          Search Results for "{query}"
        </h1>
        <p className="text-gray-400 mb-6">{total} results found</p>
        
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No results found for "{query}"</p>
            <p className="text-gray-500 mt-2">Try different keywords</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;