/**
 * Glass Morphism Card Component
 * Beautiful glass effect with light glow
 */

import React from 'react';

const GlassMorphismCard = ({ 
  children, 
  className = '', 
  glowColor = 'blue', 
  intensity = 'medium',
  hover = true,
  onClick,
  style = {} 
}) => {
  const glowColors = {
    blue: 'shadow-blue-400/20 hover:shadow-blue-400/40',
    purple: 'shadow-purple-400/20 hover:shadow-purple-400/40',
    green: 'shadow-green-400/20 hover:shadow-green-400/40',
    pink: 'shadow-pink-400/20 hover:shadow-pink-400/40',
    cyan: 'shadow-cyan-400/20 hover:shadow-cyan-400/40',
    orange: 'shadow-orange-400/20 hover:shadow-orange-400/40',
    red: 'shadow-red-400/20 hover:shadow-red-400/40'
  };

  const intensityClasses = {
    low: 'backdrop-blur-sm bg-white/5',
    medium: 'backdrop-blur-md bg-white/10',
    high: 'backdrop-blur-lg bg-white/15',
    ultra: 'backdrop-blur-xl bg-white/20'
  };

  return (
    <div
      className={`
        relative
        ${intensityClasses[intensity] || intensityClasses.medium}
        border border-white/20
        rounded-xl
        shadow-2xl
        ${glowColors[glowColor] || glowColors.blue}
        transition-all duration-300 ease-in-out
        ${hover ? 'hover:transform hover:scale-[1.02] hover:bg-white/15' : ''}
        ${onClick ? 'cursor-pointer select-none' : ''}
        ${className}
      `}
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, 
          rgba(255, 255, 255, 0.1) 0%, 
          rgba(255, 255, 255, 0.05) 100%)
        `,
        ...style
      }}
    >
      {/* Light Glow Border */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Inner Light Effect */}
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </div>
  );
};

export default GlassMorphismCard;