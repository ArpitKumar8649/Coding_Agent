import React, { useState, useEffect } from 'react';

const StreamingText = ({ content, speed = 20 }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timer);
    }
  }, [content, currentIndex, speed]);

  useEffect(() => {
    setDisplayedContent('');
    setCurrentIndex(0);
  }, [content]);

  return (
    <div className="streaming-text">
      <span className="whitespace-pre-wrap break-words">{displayedContent}</span>
      {currentIndex < content.length && (
        <span className="inline-block w-0.5 h-5 bg-blue-400 ml-0.5 animate-pulse"></span>
      )}
    </div>
  );
};

export default StreamingText;