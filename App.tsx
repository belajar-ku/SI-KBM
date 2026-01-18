import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PublicDashboard from './pages/PublicDashboard';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JurnalForm from './pages/JurnalForm';
import ImportData from './pages/ImportData';
import UsersData from './pages/UsersData';
import ProfilePage from './pages/ProfilePage';
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

          <Route path="/import-data" element={
             <AdminRoute>
                <ImportData />
             </AdminRoute>
          } />

           <Route path="/users" element={
             <AdminRoute>
                <UsersData />
             </AdminRoute>
          } />

          {/* Placeholders for other routes */}
          <Route path="/laporan" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/rekap-absensi" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/kedisiplinan" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/qr" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/jadwal" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;