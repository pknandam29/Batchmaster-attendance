import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Batches } from './pages/Batches';
import { BatchDetail } from './pages/BatchDetail';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { StudentDetail } from './pages/StudentDetail';
import { UserManagement } from './pages/UserManagement';
import { AuditLog } from './pages/AuditLog';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center font-mono uppercase tracking-widest animate-pulse">Initializing...</div>;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="batches" element={<Batches />} />
            <Route path="batches/:id" element={<BatchDetail />} />
            <Route path="students/:id" element={<StudentDetail />} />
            <Route path="reports" element={<Reports />} />
            <Route path="admin/users" element={<UserManagement />} />
            <Route path="admin/audit" element={<AuditLog />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}
