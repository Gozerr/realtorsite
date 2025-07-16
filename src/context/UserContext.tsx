import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';

export const UserContext = createContext<any>(null);
export function useUserContext() { return useContext(UserContext); }

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<any>(null);
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const refetchUserData = async () => {
    if (!token) return setUserData(null);
    const res = await fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) return setUserData(null);
    const data = await res.json();
    setUserData(data);
  };
  // Автоматически подгружать userData при появлении токена
  useEffect(() => {
    if (token) {
      refetchUserData();
    } else {
      setUserData(null);
    }
  }, [token]);

  // Гарантируем загрузку userData при монтировании, если токен уже есть
  useEffect(() => {
    if (token && !userData) {
      refetchUserData();
    }
  }, []);

  return (
    <UserContext.Provider value={{ userData, setUserData, refetchUserData }}>
      {children}
    </UserContext.Provider>
  );
}

export {}; 