'use client';

import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface UniversalImageProps {
  src?: string | null;
  alt?: string;
  fallbackText?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'banner' | 'auto';
  priority?: boolean;
}

export function UniversalImage({
  src,
  alt = 'Gambar',
  fallbackText = 'Foto Produk',
  className = '',
  aspectRatio = 'square',
}: UniversalImageProps) {
  const [hasError, setHasError] = useState(false);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    banner: 'aspect-[16/9] sm:aspect-[21/9]',
    auto: '',
  }[aspectRatio];

  if (!src || hasError) {
    return (
      <div
        className={`w-full ${aspectClasses} bg-neutral-100/90 text-neutral-400 flex flex-col items-center justify-center p-3 select-none border border-neutral-200/50 ${className}`}
      >
        <div className="w-10 h-10 rounded-full bg-white/80 shadow-2xs flex items-center justify-center text-neutral-400 mb-1.5">
          <ImageIcon className="w-5 h-5 stroke-[1.5]" />
        </div>
        <span className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase text-center line-clamp-1">
          {fallbackText}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      loading="lazy"
      className={`w-full h-full object-cover object-center ${className}`}
    />
  );
}