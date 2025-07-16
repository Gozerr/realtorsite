import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button, Input, List, Spin } from 'antd';
import { SmileOutlined, PaperClipOutlined, AudioOutlined, ArrowRightOutlined, SendOutlined } from '@ant-design/icons';
import { refreshToken } from '../services/auth.service';

interface Message {
  id: number;
  author?: { id: number; firstName?: string; lastName?: string; photo?: string; avatar?: string };
  authorId?: number;
  text: string;
  createdAt: string;
}

interface ChatWidgetProps {
  chatId?: number;
  userId: number;
  jwt: string;
  propertyId: number;
  sellerId?: number;
  buyerId?: number;
  onChatIdResolved?: (chatId: number) => void;
  hideInput?: boolean;
  onlyInput?: boolean;
}

// Always use backend on port 3001 for API and WebSocket, regardless of frontend port
const BACKEND_HOST = window.location.hostname;
const WS_URL = `http://${BACKEND_HOST}:3001`;
const API_URL = `http://${BACKEND_HOST}:3001/api`;

const EMOJI_LIST = ['👍', '😂', '🔥', '😍', '😮', '😢', '👏', '🎉', '💯', '🤔'];

export const ChatWidget: React.FC<ChatWidgetProps & { limitLastN?: number }> = ({ chatId: initialChatId, userId, jwt, propertyId, sellerId, buyerId, onChatIdResolved, hideInput, onlyInput, limitLastN }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [someoneTyping, setSomeoneTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [chatId, setChatId] = useState<number | null>(initialChatId || null);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [reactions, setReactions] = useState<{ [msgId: number]: string[] }>({});
  const scrollableRef = useRef<HTMLDivElement>(null);

  // --- Новый отказоустойчивый connectSocket ---
  const connectSocket = useCallback(() => {
    const token = localStorage.getItem('token');
    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      console.log('[ChatWidget] Socket connected', { initialChatId, chatId, userId, token, WS_URL });
    });
    socket.on('disconnect', async (reason) => {
      console.log('[ChatWidget] Socket disconnected:', reason);
      if (
        reason === 'io server disconnect' ||
        (typeof reason === 'string' && reason.includes('jwt expired'))
      ) {
        const newToken = await refreshToken();
        if (newToken) {
          localStorage.setItem('token', newToken);
          connectSocket();
        } else {
          window.location.href = '/login';
        }
      }
    });
    socket.on('connect_error', async (err) => {
      console.error('[ChatWidget] Socket connect_error:', err);
      if (err.message && err.message.includes('jwt expired')) {
        const newToken = await refreshToken();
        if (newToken) {
          localStorage.setItem('token', newToken);
          connectSocket();
        } else {
          window.location.href = '/login';
        }
      }
    });
    // Получаем chatId, если не передан
    if (!initialChatId && propertyId) {
      socket.emit('getOrCreateChat', { propertyId }, (response: { chatId: number }) => {
        if (response && response.chatId) {
          setChatId(response.chatId);
          socket.emit('joinChat', { chatId: response.chatId });
          if (onChatIdResolved) onChatIdResolved(response.chatId);
        }
      });
    } else if (initialChatId) {
      socket.emit('joinChat', { chatId: initialChatId });
    }
    socket.on('receiveMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    socket.on('typing', ({ userId: typingUserId }) => {
      if (typingUserId !== userId) {
        setSomeoneTyping(true);
        setTimeout(() => setSomeoneTyping(false), 2000);
      }
    });
    return socket;
  }, [initialChatId, chatId, userId, propertyId, onChatIdResolved]);

  // --- useEffect для сокета ---
  useEffect(() => {
    const socket = connectSocket();
    return () => {
      socket.disconnect();
    };
  }, [connectSocket]);

  // useEffect для загрузки истории — только когда chatId появился
  useEffect(() => {
    if (chatId) {
      setLoading(true);
      fetch(`${API_URL}/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${jwt}` },
      })
        .then(res => res.json())
        .then(data => {
          setMessages(Array.isArray(data) ? data : []);
        })
        .catch(() => setMessages([]))
        .finally(() => setLoading(false));
    }
  }, [chatId, jwt]);

  useEffect(() => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollTop = scrollableRef.current.scrollHeight;
    }
  }, [messages]);

  // Синхронизация chatId с пропсом initialChatId
  useEffect(() => {
    if (initialChatId && initialChatId !== chatId) {
      setChatId(initialChatId);
    }
  }, [initialChatId]);

  // Сброс сообщений при смене чата/пользователя/объекта
  useEffect(() => {
    setMessages([]);
  }, [chatId, userId, propertyId]);

  const getToUserId = () => {
    if (sellerId && userId !== sellerId) return sellerId;
    if (buyerId && userId !== buyerId) return buyerId;
    return undefined;
  };

  const handleSend = useCallback(() => {
    if (!input.trim() || !chatId) return;
    const toUserId = getToUserId();
    console.log('[ChatWidget] Sending message:', input, { chatId, userId, toUserId, jwt, propertyId });
    socketRef.current?.emit('sendMessage', {
      chatId,
      text: input,
      propertyId,
      toUserId,
      authorId: userId,
    });
    setInput('');
    setTyping(false);
    setTimeout(() => {
      console.log('[ChatWidget] Refetching history after send', { chatId, userId, jwt });
      fetch(`${API_URL}/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${jwt}` },
      })
        .then(res => {
          console.log('[ChatWidget] fetch history after send response status:', res.status);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) setMessages(data);
          else setMessages([]);
        })
        .catch((err) => {
          setMessages([]);
          console.error('[ChatWidget] Error fetching history after send:', err);
        });
    }, 200);
  }, [input, chatId, userId, jwt, propertyId, sellerId, buyerId]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!typing) {
      setTyping(true);
      socketRef.current?.emit('typing', { chatId, userId });
      setTimeout(() => setTyping(false), 1500);
    }
  };

  const handleAddReaction = (msgId: number, emoji: string) => {
    setReactions(prev => {
      const arr = prev[msgId] || [];
      if (arr.includes(emoji)) {
        return { ...prev, [msgId]: arr.filter(e => e !== emoji) };
      } else {
        return { ...prev, [msgId]: [...arr, emoji] };
      }
    });
  };

  const handleReply = (msg: Message) => {
    setReplyTo(msg);
  };

  const handleEmojiClick = (emoji: string) => {
    setInput(input + emoji);
    setShowEmojiPanel(false);
  };

  const visibleMessages = limitLastN && messages.length > limitLastN ? messages.slice(-limitLastN) : messages;

  if (onlyInput) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 0, background: '#fff', borderRadius: 0 }}>
        <input
          value={input}
          onChange={handleInput}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Введите сообщение..."
          disabled={loading}
          style={{ flex: 1, borderRadius: 16, background: '#fff', border: '1.5px solid #e6eaf1', fontSize: 16, padding: '12px 18px' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{ borderRadius: '50%', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 20, width: 44, height: 44, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none', transition: 'background 0.2s' }}
        >
          <SendOutlined />
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #e9f0fb 100%)',
      borderRadius: 18,
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
      padding: 0,
      minHeight: 440,
      maxHeight: 770,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      transition: 'none',
      flex: 1,
    }}>
      {/* Основной блок сообщений с нормальными стилями */}
      <div ref={scrollableRef} style={{ flex: '1 1 0%', overflowY: 'auto', minHeight: 0, height: '100%', position: 'relative', padding: '18px 0 8px', background: 'transparent' }}>
        {loading ? (
          <Spin style={{ margin: '40px auto', display: 'block' }} />
        ) : visibleMessages.length === 0 ? (
          <div style={{
            color: '#bbb',
            fontSize: 20,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 1,
          }}>Нет сообщений</div>
        ) : (
          visibleMessages.map(msg => {
            // Fallback: если нет author, но есть authorId
            const author = msg.author || (msg.authorId ? { id: msg.authorId } : undefined);
            const isMe = author?.id === userId;
            return (
              <div key={msg.id} style={{
                display: 'flex',
                flexDirection: isMe ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                margin: '14px 0',
                padding: '0 24px',
                animation: 'fadeInUp 0.4s',
              }}>
                {/* Аватар автора сообщения */}
                {(() => {
                  let authorAvatar = author?.photo || author?.avatar || undefined;
                  // Не подставлять /avatars/ и не заменять на /thumbnails/ — использовать путь как есть
                  return (
                    <div style={{ minWidth: 42, minHeight: 42, margin: isMe ? '0 0 0 14px' : '0 14px 0 0' }}>
                      <img
                        src={authorAvatar}
                        alt={author?.firstName || '?'}
                        style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', background: '#f2f3f5', display: authorAvatar ? 'block' : 'none', boxShadow: '0 2px 8px #e6eaf1' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      {!authorAvatar && (
                        <div style={{
                          width: 42,
                          height: 42,
                          borderRadius: '50%',
                          background: '#e6eaf1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: '#bbb',
                          fontSize: 18,
                          boxShadow: '0 2px 8px #e6eaf1',
                        }}>
                          {author?.firstName ? author.firstName[0] : '?'}
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div style={{
                  maxWidth: 480,
                  background: isMe ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' : 'linear-gradient(135deg, #fff 0%, #f2f3f5 100%)',
                  color: isMe ? '#fff' : '#222',
                  borderRadius: isMe ? '22px 22px 8px 22px' : '22px 22px 22px 8px',
                  padding: '16px 22px 12px 22px',
                  fontSize: 16,
                  fontWeight: 400,
                  wordBreak: 'break-word',
                  marginLeft: isMe ? 0 : 0,
                  marginRight: isMe ? 0 : 0,
                  boxShadow: '0 2px 16px #e6eaf1',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 52,
                  justifyContent: 'flex-end',
                  transition: 'background 0.2s',
                }}>
                  <span style={{ display: 'block', marginBottom: 6, whiteSpace: 'pre-line' }}>{msg.text}</span>
                  <span style={{ fontSize: 13, color: isMe ? '#dbeafe' : '#888', textAlign: 'right', alignSelf: 'flex-end', lineHeight: 1, marginTop: 2 }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
        {someoneTyping && <div style={{ color: '#1976d2', fontSize: 15, margin: '8px 0 0 28px' }}>Печатает...</div>}
      </div>
      {!onlyInput && !hideInput && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 18px 14px 10px',
          background: '#f7f9fc',
          borderRadius: 18,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2,
          boxShadow: '0 -2px 16px #e6eaf1',
          width: '100%',
        }}>
          <input
            value={input}
            onChange={handleInput}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            placeholder="Введите сообщение..."
            disabled={loading}
            style={{ flex: '1 1 0%', borderRadius: 16, background: '#fff', border: '1.5px solid #e6eaf1', fontSize: 17, padding: '14px 20px', boxShadow: '0 2px 8px #e6eaf1', outline: 'none', transition: 'border 0.2s' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{ borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', color: '#fff', fontWeight: 700, fontSize: 22, width: 48, height: 48, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px #e6eaf1', transition: 'background 0.2s' }}
          >
            <SendOutlined />
          </button>
        </div>
      )}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate3d(0, 40px, 0); }
          to { opacity: 1; transform: none; }
        }
        @media (max-width: 767px) {
          .ant-spin {
            margin: 24px auto !important;
          }
        }
      `}</style>
    </div>
  );
}; 