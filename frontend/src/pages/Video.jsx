import React, { useRef, useEffect } from 'react';

const Video = ({ stream }) => {
  const videoRef = useRef();

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && stream) {
      videoEl.srcObject = stream;
    }
    // Detach stream on unmount or when stream changes to prevent memory leaks
    return () => {
      if (videoEl) {
        videoEl.srcObject = null;
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