import React from 'react';

interface TikTokIconProps {
  className?: string;
  size?: number | string;
  color?: string;
}

/**
 * Premium minimalist TikTok glyph designed to match Lucide's 2px stroke geometric aesthetic.
 */
export const TikTokIcon: React.FC<TikTokIconProps> = ({
  className = 'w-4 h-4',
  size,
  color = 'currentColor',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
};
