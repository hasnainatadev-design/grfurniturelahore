import React from 'react';

interface GRLogoProps {
  className?: string;
  alt?: string;
  priority?: boolean;
}

/**
 * Official GR Furniture Lahore brand logo asset component.
 */
export const GRLogo: React.FC<GRLogoProps> = ({
  className = 'w-10 h-10',
  alt = 'GR Furniture Lahore - Wholesale Dealer & Custom Furniture Factory',
  priority = true,
}) => {
  return (
    <img
      src="/logo.png"
      alt={alt}
      width={1000}
      height={1000}
      className={`object-contain ${className}`}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
};
