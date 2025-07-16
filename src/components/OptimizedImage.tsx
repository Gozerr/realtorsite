import React, { useState, useRef, useEffect } from 'react';
import { Image, Skeleton } from 'antd';
import { PictureOutlined } from '@ant-design/icons';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
  quality?: number;
  preview?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  style,
  fallback = '/placeholder-image.jpg',
  placeholder,
  onLoad,
  onError,
  lazy = true,
  quality = 80,
  preview = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setImageSrc(src);
    setError(false);
    setLoading(true);
  }, [src]);

  const handleLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    if (imageSrc !== fallback) {
      setImageSrc(fallback);
    }
    onError?.();
  };

  // Custom placeholder
  const customPlaceholder = placeholder || (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        color: '#999',
        fontSize: '14px',
        width: '100%',
        height: '100%',
      }}
    >
      <PictureOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
      Загрузка...
    </div>
  );

  // Убираем srcSet и webp-альтернативу, всегда используем только оригинал
  // const getSrcSet = () => undefined;

  if (error && imageSrc === fallback) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          color: '#999',
          width: width || '100%',
          height: height || '200px',
          ...style,
        }}
        className={className}
      >
        <PictureOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
        Изображение недоступно
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width, height, ...style }} className={className}>
      {loading && (
        <Skeleton.Image
          active
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
          }}
        />
      )}
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        style={{
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.3s ease',
          width: width || '100%',
          height: height || 'auto',
          ...style,
        }}
        onLoad={handleLoad}
        onError={handleError}
        loading={lazy ? 'lazy' : undefined}
      />
    </div>
  );
};

export default OptimizedImage; 