import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import CategoriesScreen from './screens/CategoriesScreen';
import StoresScreen from './screens/StoresScreen';
import BrandsScreen from './screens/BrandsScreen';
import BrandStoresScreen from './screens/BrandStoresScreen';
import ResultsScreen from './screens/ResultsScreen';
import StoreDetailScreen from './screens/StoreDetailScreen';
import ChatScreen from './screens/ChatScreen';
import BaratilloScreen from './screens/BaratilloScreen';
import ComerScreen from './screens/ComerScreen';
import BanosScreen from './screens/BanosScreen';
import EventosScreen from './screens/EventosScreen';
import SideNav from './components/SideNav';
import StandbyScreen from './screens/StandbyScreen';
import LoginScreen from './screens/LoginScreen';
import AdminApp from './admin/AdminApp';
import { loadStoresFromSupabase } from './lib/search';
import { useAuth } from './hooks/useAuth';

const IDLE_MS = 120_000;

function KioskApp() {
  const [standby, setStandby] = useState(true);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setStandby(true), IDLE_MS);
  };

  useEffect(() => {
    loadStoresFromSupabase();
    resetIdleTimer();
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current); };
  }, []);

  const handleDismiss = () => { setStandby(false); resetIdleTimer(); };
  const handleInteraction = () => { if (!standby) resetIdleTimer(); };

  return (
    <>
      <div className="kiosk-frame" onPointerDown={handleInteraction}>
        <SideNav />
        <div className="screen-area">
          <Routes>
            <Route path="/"              element={<StoresScreen />} />
            <Route path="/categories"    element={<CategoriesScreen />} />
            <Route path="/stores"        element={<StoresScreen />} />
            <Route path="/brands"        element={<BrandsScreen />} />
            <Route path="/chat"          element={<ChatScreen />} />
            <Route path="/results"       element={<ResultsScreen />} />
            <Route path="/store/:id"     element={<StoreDetailScreen />} />
            <Route path="/brands/:brand" element={<BrandStoresScreen />} />
            <Route path="/baratillo"     element={<BaratilloScreen />} />
            <Route path="/comer"         element={<ComerScreen />} />
            <Route path="/banos"         element={<BanosScreen />} />
            <Route path="/eventos"       element={<EventosScreen />} />
          </Routes>
        </div>
      </div>
      <StandbyScreen visible={standby} onDismiss={handleDismiss} />
    </>
  );
}

function App() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontWeight: 700 }}>Cargando…</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login/*"
        element={
          role && role !== 'kiosk' ? <Navigate to="/admin" replace /> : <LoginScreen />
        }
      />
      <Route
        path="/admin/*"
        element={
          role && role !== 'kiosk' ? <AdminApp /> : <LoginScreen />
        }
      />
      <Route path="*" element={<KioskApp />} />
    </Routes>
  );
}

export default function Root() {
  return (
    <Router>
      <App />
    </Router>
  );
}
