import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const VideoCard = ({ video, size = 'normal' }) => {
  const widthClass = size === 'large' ? 'w-72' : 'w-48';
  
  return (
    <Link to={`/watch/${video.id}`}>
      <motion.div 
        whileHover={{ scale: 1.05, y: -5 }}
        transition={{ duration: 0.2 }}
        className={`${widthClass} cursor-pointer rounded overflow-hidden bg-gray-900 hover:shadow-xl transition-shadow`}
      >
        <img 
          src={video.thumbnail_url || video.poster_url} 
          alt={video.title} 
          className="w-full h-40 object-cover"
        />
        <div className="p-2">
          <h3 className="text-sm font-semibold truncate">{video.title}</h3>
          <p className="text-xs text-gray-400">{video.release_year}</p>
          {video.rating && (
            <p className="text-xs text-yellow-500 mt-1">★ {video.rating}</p>
          )}
        </div>
      </motion.div>
    </Link>
  );
};

export default VideoCard;