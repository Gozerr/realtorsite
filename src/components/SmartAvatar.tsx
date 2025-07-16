import { useUserContext } from '../context/UserContext';
import React from 'react';

interface SmartAvatarProps {
  src?: string;
  size?: number;
  style?: React.CSSProperties;
}

export function SmartAvatar({ src, size = 48, style }: SmartAvatarProps) {
  const userContext = useUserContext();
  const userData = userContext?.userData;
  const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  let avatarPath = src || userData?.avatarPath || '/default-avatar.png';
  if (avatarPath && !avatarPath.startsWith('http') && avatarPath.startsWith('/uploads')) {
    avatarPath = backendUrl + avatarPath;
  }
  return (
    <picture>
      <img
        src={avatarPath}
        alt="Avatar"
        className="avatar"
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', ...style }}
        loading="lazy"
        width={size}
        height={size}
      />
    </picture>
  );
} 