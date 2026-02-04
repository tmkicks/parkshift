import { useState } from 'react';
import { useTheme } from '../lib/contexts/ThemeContext';

export default function Logo({ size = 'md', variant = 'main', className = '' }) {
  const [imageError, setImageError] = useState(false);
  const { isDark } = useTheme();

  const sizes = {
    sm: 'h-6 w-6 text-lg',
    md: 'h-8 w-8 text-xl', 
    lg: 'h-12 w-12 text-2xl',
    xl: 'h-16 w-16 text-3xl'
  };

  const logoSrc = variant === 'white' || isDark ? '/logos/logo_dark.png' : '/logos/logo_dark.png';

  if (imageError) {
    // Fallback to CSS logo
    return (
      <div className={`bg-green-600 rounded flex items-center justify-center ${sizes[size]} ${className}`}>
        <span className="text-white font-bold">P</span>
      </div>
    );
  }

  return (
    <img
      src={logoSrc}
      alt="ParkShift"
      className={`${sizes[size]} ${className}`}
      onError={() => setImageError(true)}
      onLoad={() => setImageError(false)}
    />
  );
}
