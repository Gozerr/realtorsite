import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { PropertiesProvider } from './context/PropertiesContext';
import { ClientModeProvider } from './context/ClientModeContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import { YMaps, Map, Placemark } from 'react-yandex-maps';
import { AuthContext } from './context/AuthContext';
import { ConfigProvider } from 'antd';
import TelegramLinkModal from './components/TelegramLinkModal';
import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginWithTelegram from './pages/LoginWithTelegram';

// Lazy-loaded components
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const AppLayout = React.lazy(() => import('./components/AppLayout'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const PropertiesPage = React.lazy(() => import('./pages/PropertiesPage'));
const PropertyDetailsPageClean = React.lazy(() => import('./pages/PropertyDetailsPageClean'));
const ClientsPage = React.lazy(() => import('./pages/ClientsPage'));
const SelectionPage = React.lazy(() => import('./pages/SelectionPage'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const MyChatsPage = React.lazy(() => import('./pages/MyChatsPage'));
const MapSearchPage = React.lazy(() => import('./pages/MapSearchPage'));
const CalendarPage = React.lazy(() => import('./pages/CalendarPage'));
const ClientSelectionPage = React.lazy(() => import('./pages/ClientSelectionPage'));
const EducationPage = React.lazy(() => import('./pages/EducationPage'));
const AgencyPage = React.lazy(() => import('./pages/AgencyDashboardPage'));
const SupportDashboardPage = React.lazy(() => import('./pages/SupportDashboardPage'));

function TestYandexMap() {
  return (
    <div style={{ width: 400, height: 300, border: '2px solid green', margin: 24 }}>
      <YMaps query={{ apikey: 'bd94e42f-2bde-4e23-aba5-09290180c984' }}>
        <Map
          defaultState={{ center: [57.6248966, 39.8915407], zoom: 16 }}
          width={400}
          height={300}
        >
          <Placemark geometry={[57.6248966, 39.8915407]} />
        </Map>
      </YMaps>
    </div>
  );
}

function App() {
  const { token, user, setAuthData } = useAuth();
  const [showModal, setShowModal] = useState(!token);

  const handleSuccess = (token: string, user: any) => {
    setAuthData(token, user);
    setShowModal(false);
  };

  return (
    <ConfigProvider>
      <ErrorBoundary>
        <PropertiesProvider>
          <NotificationProvider>
            <ClientModeProvider>
              <AuthProvider>
                <ThemeProvider>
                  <Router>
                    <Suspense fallback={<div style={{padding: 40, textAlign: 'center', fontSize: 22}}>Загрузка...</div>}>
                      <Routes>
                        <Route path="/login" element={
                          <PublicRoute>
                            <LoginPage />
                          </PublicRoute>
                        } />
                        <Route path="/login/telegram" element={
                          <PublicRoute>
                            <LoginWithTelegram />
                          </PublicRoute>
                        } />
                        <Route path="/" element={
                          <ProtectedRoute>
                            <AppLayout />
                          </ProtectedRoute>
                        }>
                          <Route index element={<DashboardPage />} />
                          <Route path="properties" element={<PropertiesPage />} />
                          <Route path="properties/:id" element={<PropertyDetailsPageClean />} />
                          <Route path="clients" element={<ClientsPage />} />
                          <Route path="selection" element={<SelectionPage />} />
                          <Route path="notifications" element={<NotificationsPage />} />
                          <Route path="profile" element={<ProfilePage />} />
                          <Route path="settings" element={<SettingsPage />} />
                          <Route path="my-chats" element={<MyChatsPage />} />
                          <Route path="map" element={<MapSearchPage />} />
                          <Route path="calendar" element={<CalendarPage />} />
                          <Route path="client-selection/:token" element={<ClientSelectionPage />} />
                          <Route path="education" element={<EducationPage />} />
                          <Route path="agency" element={<AgencyPage />} />
                          <Route path="support" element={<SupportDashboardPage />} />
                        </Route>
                      </Routes>
                    </Suspense>
                  </Router>
                </ThemeProvider>
              </AuthProvider>
            </ClientModeProvider>
          </NotificationProvider>
        </PropertiesProvider>
      </ErrorBoundary>
    </ConfigProvider>
  );
}

export default App;
