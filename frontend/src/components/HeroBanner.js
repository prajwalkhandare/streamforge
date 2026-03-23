import React from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

const HeroBanner = ({ video }) => {
  if (!video) return null;

  return (
    <div className="relative h-[80vh] w-full">
      <div className="absolute inset-0">
        <img
          src={video.background_url || video.thumbnail_url}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent" />
      </div>

      <div className="absolute bottom-1/3 left-12 max-w-lg z-10">
        <h1 className="text-white text-5xl font-bold mb-4">{video.title}</h1>
        <p className="text-white text-lg mb-6 line-clamp-3">{video.description}</p>
        
        <div className="flex space-x-4">
          <Link to={`/watch/${video.id}`}>
            <button className="bg-white text-black px-6 py-2 rounded flex items-center space-x-2 hover:bg-gray-200 transition">
              <PlayIcon className="h-5 w-5" />
              <span>Play</span>
            </button>
          </Link>
          
          <Link to={`/video/${video.id}`}>
            <button className="bg-gray-500/70 text-white px-6 py-2 rounded flex items-center space-x-2 hover:bg-gray-500/90 transition">
              <InformationCircleIcon className="h-5 w-5" />
              <span>More Info</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;