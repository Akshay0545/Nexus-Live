import React, { useRef, useEffect } from 'react';

const Video = ({ stream }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    // Detach stream on unmount or when stream changes to prevent memory leaks
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <video
      className="w-full h-full object-contain bg-gray-900"
      ref={videoRef}
      autoPlay
      playsInline
    ></video>
  );
};

export default Video;