import React, { useState, useEffect } from 'react';
import { userService } from '../services/user.service';
import VideoCard from '../components/VideoCard';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const MyList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyList = async () => {
      setLoading(true);
      try {
        const data = await userService.getMyList();
        setVideos(data.data?.videos || []);
      } catch (error) {
        toast.error('Failed to load My List');
      } finally {
        setLoading(false);
      }
    };
    fetchMyList();
  }, []);

  const handleRemove = async (videoId) => {
    try {
      await userService.removeFromMyList(videoId);
      setVideos(videos.filter(v => v.id !== videoId));
      toast.success('Removed from My List');
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="bg-dark min-h-screen pt-24 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-2">My List</h1>
        <p className="text-gray-400 mb-6">{videos.length} titles in your list</p>
        
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Your list is empty</p>
            <p className="text-gray-500 mt-2">Add movies and shows you want to watch later</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="relative group">
                <VideoCard video={video} />
                <button
                  onClick={() => handleRemove(video.id)}
                  className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyList;