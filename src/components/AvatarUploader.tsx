import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useUserContext } from '../context/UserContext';
import { AuthContext } from '../context/AuthContext';

export default function AvatarUploader({ userId, currentAvatarUrl }: { userId: number, currentAvatarUrl?: string }) {
  const { refetchUserData } = useUserContext();
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const [loading, setLoading] = useState(false);
  if (!userId) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = (e.target as HTMLFormElement).avatar as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file || !token) return;
    const formData = new FormData();
    formData.append('avatar', file);
    setLoading(true);
    try {
      await axios.post('/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: progressEvent => {
          // Можно показывать прогресс
        }
      });
      await refetchUserData();
    } catch (err) {
      alert('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <input type="file" name="avatar" accept="image/*" />
      <button type="submit" disabled={loading}>Загрузить</button>
    </form>
  );
} 