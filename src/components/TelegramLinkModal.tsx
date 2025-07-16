import React, { useState } from 'react';
import axios from 'axios';

interface TelegramLinkModalProps {
  onSuccess: (token: string, user: any) => void;
  onCancel?: () => void;
}

const TelegramLinkModal: React.FC<TelegramLinkModalProps> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState<'login' | 'code'>('login');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInit = async () => {
    setLoading(true);
    setError('');
    let username = telegramUsername.trim();
    if (username && !username.startsWith('@')) {
      username = '@' + username;
    }
    try {
      await axios.post('/api/auth/telegram-init', { telegramUsername: username });
      setStep('code');
    } catch (e: any) {
      if (e.response?.data?.message?.includes('Привяжите')) {
        setError('Привяжите свой Telegram username в Моем профиле');
      } else {
        setError(e.response?.data?.message || 'Ошибка отправки запроса');
      }
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    let username = telegramUsername.trim();
    if (username && !username.startsWith('@')) {
      username = '@' + username;
    }
    try {
      const res = await axios.post('/api/auth/telegram-verify', { telegramUsername: username, code });
      onSuccess(res.data.token, res.data.user);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Ошибка проверки кода');
    }
    setLoading(false);
  };

  return (
    <>
      <h2>Привязка Telegram</h2>
      {step === 'login' && (
        <>
          <p>Введите ваш Telegram username (например, @username). Мы отправим код в ваш Telegram-бот.</p>
          <input
            type="text"
            value={telegramUsername}
            onChange={e => setTelegramUsername(e.target.value)}
            placeholder="@username"
            disabled={loading}
            style={{ width: '100%', padding: 8, marginBottom: 12 }}
          />
          <button onClick={handleInit} disabled={loading || !telegramUsername} style={{ width: '100%', padding: 10 }}>
            Получить код
          </button>
        </>
      )}
      {step === 'code' && (
        <>
          <p>Введите код, который пришёл вам в Telegram:</p>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Код из Telegram"
            disabled={loading}
            style={{ width: '100%', padding: 8, marginBottom: 12 }}
          />
          <button onClick={handleVerify} disabled={loading || !code} style={{ width: '100%', padding: 10 }}>
            Подтвердить
          </button>
        </>
      )}
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {onCancel && (
        <button onClick={onCancel} style={{ width: '100%', marginTop: 16, padding: 8, background: '#f5f5f5', border: 'none', borderRadius: 6, color: '#333', cursor: 'pointer' }}>
          Отмена
        </button>
      )}
    </>
  );
};

export default TelegramLinkModal; 