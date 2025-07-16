import React, { useContext, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

interface PublicRouteProps {
  children: ReactNode;
}

function PublicRoute({ children }: PublicRouteProps) {
  const authContext = useContext(AuthContext);
  
  if (authContext?.token) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default PublicRoute; 