import React, { useRef, useEffect } from 'react';

const Video = ({ stream }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      className="w-full h-full object-cover"
      ref={videoRef}
      autoPlay
      playsInline
    ></video>
  );
};

export default Video;