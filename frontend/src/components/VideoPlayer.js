import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';

const VideoPlayer = ({ url, title, onProgress, onEnded }) => {
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const playerRef = useRef(null);

  const handleProgress = (state) => {
    setProgress(state.played);
    if (onProgress) onProgress(state.played);
  };

  return (
    <div className="relative bg-black aspect-video">
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        controls
        width="100%"
        height="100%"
        onProgress={handleProgress}
        onEnded={onEnded}
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload',
            },
          },
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
        <div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
};

export default VideoPlayer;