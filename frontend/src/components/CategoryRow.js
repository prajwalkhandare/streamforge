import React from 'react';
import Slider from 'react-slick';
import VideoCard from './VideoCard';

const CategoryRow = ({ title, videos }) => {
  const settings = {
    dots: false,
    infinite: videos?.length > 6,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 3,
    arrows: true,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 5 } },
      { breakpoint: 1024, settings: { slidesToShow: 4 } },
      { breakpoint: 768, settings: { slidesToShow: 3 } },
      { breakpoint: 640, settings: { slidesToShow: 2 } },
    ],
  };

  if (!videos?.length) return null;

  return (
    <div className="mb-8">
      <h2 className="text-white text-xl font-bold mb-4 px-1">{title}</h2>
      <Slider {...settings}>
        {videos.map((video) => (
          <div key={video.id} className="px-1">
            <VideoCard video={video} />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default CategoryRow;