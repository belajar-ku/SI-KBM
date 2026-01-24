
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PublicDashboard from './pages/PublicDashboard';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AppsMenu from './pages/AppsMenu';
import JurnalForm from './pages/JurnalForm';
import ImportData from './pages/ImportData';
import InputJadwal from './pages/InputJadwal';
import UsersData from './pages/UsersData';
import StudentsData from './pages/StudentsData';
import ProfilePage from './pages/ProfilePage';
import MySchedule from './pages/MySchedule';
import SettingsPage from './pages/SettingsPage';
import RekapAbsensi from './pages/RekapAbsensi';
import LaporanJurnal from './pages/LaporanJurnal';
import Kedisiplinan from './pages/Kedisiplinan';
import AbsensiRapor from './pages/AbsensiRapor'; // New Import
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const { session, isLoading, isAdmin } = useAuth();
  
    if (isLoading) {
      return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }
  
    if (!session || !isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
  
    return children;
  };

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<PublicDashboard />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/apps" element={
            <ProtectedRoute>
              <AppsMenu />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          <Route path="/jurnal" element={
             <ProtectedRoute>
                <JurnalForm />
             </ProtectedRoute>
          } />
          
          <Route path="/jadwal" element={
             <ProtectedRoute>
                <MySchedule />
             </ProtectedRoute>
          } />

          <Route path="/rekap-absensi" element={
             <ProtectedRoute>
                <RekapAbsensi />
             </ProtectedRoute>
          } />

          <Route path="/absensi-rapor" element={
             <ProtectedRoute>
                <AbsensiRapor />
             </ProtectedRoute>
          } />

          <Route path="/laporan" element={
             <ProtectedRoute>
                <LaporanJurnal />
             </ProtectedRoute>
          } />

           <Route path="/kedisiplinan" element={
             <ProtectedRoute>
                <Kedisiplinan />
             </ProtectedRoute>
          } />

          <Route path="/import-data" element={
             <AdminRoute>
                <ImportData />
             </AdminRoute>
          } />

          <Route path="/input-jadwal" element={
             <AdminRoute>
                <InputJadwal />
             </AdminRoute>
          } />

           <Route path="/users" element={
             <AdminRoute>
                <UsersData />
             </AdminRoute>
          } />

          <Route path="/students" element={
             <AdminRoute>
                <StudentsData />
             </AdminRoute>
          } />

           <Route path="/settings" element={
             <AdminRoute>
                <SettingsPage />
             </AdminRoute>
          } />

          {/* Placeholders for other routes */}
          <Route path="/qr" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
