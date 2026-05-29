import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import OverviewScreen from './screens/OverviewScreen';
import StoresScreen from './screens/StoresScreen';
import StoreEditScreen from './screens/StoreEditScreen';
import EventsScreen from './screens/EventsScreen';
import BathroomsScreen from './screens/BathroomsScreen';
import { useAuth } from '../hooks/useAuth';

export default function AdminApp() {
  const { role, storeId } = useAuth();
  const isMallAdmin = role === 'mall_admin';

  return (
    <AdminLayout>
      <Routes>
        <Route path="" element={<OverviewScreen />} />

        {isMallAdmin && (
          <>
            <Route path="stores"       element={<StoresScreen />} />
            <Route path="stores/:id"   element={<StoreEditScreen />} />
            <Route path="events"       element={<EventsScreen />} />
            <Route path="bathrooms"    element={<BathroomsScreen />} />
          </>
        )}

        {role === 'store_manager' && storeId && (
          <Route path="store" element={<StoreEditScreen storeId={storeId} />} />
        )}

        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </AdminLayout>
  );
}
