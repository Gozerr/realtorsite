import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BOT_USERNAME = 'RelatorHub_bot'; // username вашего бота
const API_URL = '/api/auth/telegram-login-session';

export default function LoginWithTelegram() {
  const { setAuthData } = useAuth();
  const [loginId, setLoginId] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'expired' | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    axios.post(API_URL).then(res => {
      setLoginId(res.data.loginId);
      setStatus('pending');
      setPolling(true);
    });
  }, []);

  useEffect(() => {
    if (!loginId || !polling) return;
    const interval = setInterval(() => {
      axios.get(`${API_URL}/${loginId}/status`).then(async res => {
        if (res.data.status === 'confirmed') {
          setStatus('confirmed');
          setPolling(false);
          const tokenRes = await axios.post(`${API_URL}/token`, { id: loginId });
          setAuthData(tokenRes.data.token, tokenRes.data.user);
          window.location.href = '/';
        }
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [loginId, polling, setAuthData]);

  if (!loginId) return <div style={{textAlign:'center',marginTop:80,fontSize:20}}>Загрузка...</div>;

  const tgLink = `https://t.me/${BOT_USERNAME}?start=login_${loginId}`;

  return (
    <div style={{
      maxWidth: 340,
      margin: '80px auto',
      background: '#fff',
      borderRadius: 14,
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      padding: '32px 20px 24px 20px',
      textAlign: 'center',
      fontFamily: 'inherit'
    }}>
      <h2 style={{margin:'0 0 18px 0', fontWeight:700, fontSize:22}}>Вход через Telegram</h2>
      <a href={tgLink} target="_blank" rel="noopener noreferrer">
        <button style={{
          fontSize: 15,
          padding: '8px 18px',
          background: '#229ED9',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontWeight: 600,
          marginBottom: 10
        }}>
          Войти через Telegram
        </button>
      </a>
      <div style={{marginTop:10}}>
        {status === 'pending' && <p style={{color:'#888',fontSize:14,margin:0}}>Ожидаем подтверждения в Telegram...</p>}
        {status === 'confirmed' && <p style={{ color: 'green', fontSize:15, fontWeight:600, margin:0 }}>Успешно! Вы авторизованы через Telegram.</p>}
      </div>
    </div>
  );
} 