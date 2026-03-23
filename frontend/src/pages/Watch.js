import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { videoService } from '../services/video.service';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedVideos, setRelatedVideos] = useState([]);

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);
      try {
        const videoData = await videoService.getVideoById(id);
        setVideo(videoData.data.video);
        
        const streamData = await videoService.watchVideo(id);
        setStreamUrl(streamData.data.streamUrl);
        
        const related = await videoService.getRelatedVideos(id);
        setRelatedVideos(related.data?.videos || []);
      } catch (error) {
        toast.error('Failed to load video');
        navigate('/browse');
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [id, navigate]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="bg-dark min-h-screen">
      <div className="aspect-video bg-black">
        {streamUrl && (
          <ReactPlayer
            url={streamUrl}
            controls
            playing
            width="100%"
            height="100%"
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload',
                },
              },
            }}
          />
        )}
      </div>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-white text-3xl font-bold">{video?.title}</h1>
        <div className="flex items-center gap-4 mt-2 text-gray-400">
          <span>{video?.release_year}</span>
          <span>{video?.duration ? `${Math.floor(video.duration / 60)} min` : ''}</span>
          <span className="text-yellow-500">★ {video?.rating || 'N/A'}</span>
        </div>
        <p className="text-gray-300 mt-4 leading-relaxed">{video?.description}</p>
        
        {relatedVideos.length > 0 && (
          <div className="mt-8">
            <h2 className="text-white text-xl font-bold mb-4">More Like This</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedVideos.slice(0, 5).map((related) => (
                <div 
                  key={related.id} 
                  onClick={() => navigate(`/watch/${related.id}`)}
                  className="cursor-pointer group"
                >
                  <img 
                    src={related.thumbnail_url} 
                    alt={related.title} 
                    className="w-full rounded group-hover:scale-105 transition duration-300"
                  />
                  <p className="text-sm mt-1 truncate">{related.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watch;