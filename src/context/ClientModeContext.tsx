import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';

interface ClientModeContextType {
  isClientMode: boolean;
  toggleClientMode: () => void;
  setClientMode: (mode: boolean) => void;
  shouldHideSensitiveData: (userRole?: string) => boolean;
}

const ClientModeContext = createContext<ClientModeContextType | null>(null);

export const ClientModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const [isClientMode, setIsClientMode] = useState(false);

  // Определяем, доступен ли режим клиента для текущего пользователя
  const isClientModeAvailable = () => {
    if (!authContext?.user?.role) return false;
    
    const restrictedRoles = ['support', 'admin'];
    return !restrictedRoles.includes(authContext.user.role);
  };

  // Определяем, нужно ли скрывать конфиденциальные данные
  const shouldHideSensitiveData = (userRole?: string) => {
    if (!isClientMode) return false;
    
    // В режиме клиента скрываем данные для всех ролей
    return true;
  };

  const toggleClientMode = () => {
    if (isClientModeAvailable()) {
      setIsClientMode(prev => !prev);
    }
  };

  const setClientMode = (mode: boolean) => {
    if (isClientModeAvailable()) {
      setIsClientMode(mode);
    }
  };

  // Сбрасываем режим клиента при смене пользователя
  useEffect(() => {
    setIsClientMode(false);
  }, [authContext?.user?.id]);

  return (
    <ClientModeContext.Provider value={{
      isClientMode,
      toggleClientMode,
      setClientMode,
      shouldHideSensitiveData,
    }}>
      {children}
    </ClientModeContext.Provider>
  );
};

export const useClientMode = () => {
  const context = useContext(ClientModeContext);
  if (!context) {
    throw new Error('useClientMode must be used within a ClientModeProvider');
  }
  return context;
}; 