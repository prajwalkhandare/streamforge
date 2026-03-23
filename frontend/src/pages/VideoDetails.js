import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videoService } from '../services/video.service';
import { userService } from '../services/user.service';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import toast from 'react-hot-toast';

const VideoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inMyList, setInMyList] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);
      try {
        const data = await videoService.getVideoById(id);
        setVideo(data.data.video);
        
        // Check if in my list
        const myList = await userService.getMyList();
        setInMyList(myList.data?.videos?.some(v => v.id === id) || false);
      } catch (error) {
        toast.error('Failed to load video details');
        navigate('/browse');
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [id, navigate]);

  const handleAddToMyList = async () => {
    try {
      if (inMyList) {
        await userService.removeFromMyList(id);
        setInMyList(false);
        toast.success('Removed from My List');
      } else {
        await userService.addToMyList(id);
        setInMyList(true);
        toast.success('Added to My List');
      }
    } catch (error) {
      toast.error('Failed to update My List');
    }
  };

  const handleLike = async () => {
    try {
      if (liked) {
        await videoService.unlikeVideo(id);
        setLiked(false);
        toast.success('Removed like');
      } else {
        await videoService.likeVideo(id);
        setLiked(true);
        toast.success('Liked!');
      }
    } catch (error) {
      toast.error('Failed to like video');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="bg-dark min-h-screen pt-16">
      <div className="relative h-[60vh]">
        <img 
          src={video?.thumbnail_url} 
          alt={video?.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">{video?.title}</h1>
          <div className="flex flex-wrap gap-4 mb-4">
            <Button onClick={() => navigate(`/watch/${id}`)} size="lg">
              ▶ Play
            </Button>
            <Button onClick={handleAddToMyList} variant="secondary" size="lg">
              {inMyList ? '✓ In My List' : '+ My List'}
            </Button>
            <Button onClick={handleLike} variant="ghost" size="lg">
              {liked ? '❤️ Liked' : '♡ Like'}
            </Button>
          </div>
          <div className="flex gap-4 text-gray-300 text-sm">
            <span>{video?.release_year}</span>
            <span>{video?.duration ? `${Math.floor(video.duration / 60)} min` : ''}</span>
            <span className="text-yellow-500">★ {video?.rating || 'N/A'}</span>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-white text-xl font-bold mb-2">About</h2>
        <p className="text-gray-300 leading-relaxed">{video?.description}</p>
        
        {video?.cast && (
          <div className="mt-6">
            <h2 className="text-white text-xl font-bold mb-2">Cast</h2>
            <p className="text-gray-300">{video.cast}</p>
          </div>
        )}
        
        {video?.director && (
          <div className="mt-4">
            <h2 className="text-white text-xl font-bold mb-2">Director</h2>
            <p className="text-gray-300">{video.director}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoDetails;