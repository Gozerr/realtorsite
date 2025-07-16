import React from 'react';
import { Switch, Tooltip } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import { useClientMode } from '../context/ClientModeContext';
import { useAuth } from '../context/AuthContext';

const ClientModeToggle: React.FC = () => {
  const { isClientMode, toggleClientMode, shouldHideSensitiveData } = useClientMode();
  const { user } = useAuth();

  // Проверяем, доступен ли режим клиента для текущего пользователя
  const isClientModeAvailable = () => {
    if (!user?.role) return false;
    
    const restrictedRoles = ['support', 'admin'];
    return !restrictedRoles.includes(user.role);
  };

  if (!isClientModeAvailable()) {
    return null;
  }

  return (
    <Tooltip 
      title={isClientMode ? "Переключиться в режим агента" : "Переключиться в режим клиента"}
      placement="bottom"
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: 'transparent',
        boxShadow: 'none',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontSize: 15,
        fontWeight: 600,
        color: isClientMode ? '#ff9800' : '#219653',
        userSelect: 'none',
        margin: 0,
        zIndex: 1,
        padding: 0,
      }}>
        <Switch
          checked={isClientMode}
          onChange={toggleClientMode}
          checkedChildren={<UserOutlined style={{ fontSize: 18, verticalAlign: 'middle', color: '#ff9800' }} />}
          unCheckedChildren={<TeamOutlined style={{ fontSize: 18, verticalAlign: 'middle', color: '#219653' }} />}
          size="small"
          style={{ background: isClientMode ? '#ffe0b2' : '#b7efc5', border: 'none', boxShadow: 'none', minWidth: 38, height: 22 }}
        />
      </div>
    </Tooltip>
  );
};

export default ClientModeToggle; 