import React, { useEffect, useRef } from 'react';
import axios from 'axios';

interface TelegramLoginButtonProps {
  onSuccess: (token: string, user: any) => void;
  onError?: (error?: any) => void;
}

const TELEGRAM_BOT = 'RelatorHub_bot'; // без @
const TELEGRAM_WIDGET_BOT_ID = process.env.REACT_APP_TELEGRAM_WIDGET_BOT_ID || '';

const TelegramLoginButton: React.FC<TelegramLoginButtonProps> = ({ onSuccess, onError }) => {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Проверяем, не был ли уже добавлен скрипт
    if (document.getElementById('telegram-login-script')) return;
    const script = document.createElement('script');
    script.id = 'telegram-login-script';
    script.src = `https://telegram.org/js/telegram-widget.js?7`;
    script.async = true;
    script.setAttribute('data-telegram-login', TELEGRAM_BOT.replace('@', ''));
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-userpic', 'true');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-lang', 'ru');
    script.setAttribute('data-onauth', 'window.handleTelegramAuth(user)');
    if (widgetRef.current) {
      widgetRef.current.innerHTML = '';
      widgetRef.current.appendChild(script);
    }
    // Глобальный обработчик
    (window as any).handleTelegramAuth = async (user: any) => {
      try {
        const res = await axios.post('/api/auth/telegram-widget-login', user);
        onSuccess(res.data.token, res.data.user);
      } catch (e) {
        if (onError) onError(e);
      }
    };
    // Очистка
    return () => {
      if ((window as any).handleTelegramAuth) delete (window as any).handleTelegramAuth;
    };
  }, [onSuccess, onError]);

  return (
    <div ref={widgetRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }} />
  );
};

export default TelegramLoginButton; 