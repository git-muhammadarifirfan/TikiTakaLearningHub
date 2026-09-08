import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { RouteLoadingBar } from './components/common/RouteLoadingBar';
import { FullScreenLoader } from './components/common/FullScreenLoader';

// Lazy Loaded Pages for Instant Code-Splitting Performance
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const StudentListPage = lazy(() => import('./pages/students/StudentListPage'));
const StudentDetailPage = lazy(() => import('./pages/students/StudentDetailPage'));
const TeacherListPage = lazy(() => import('./pages/teachers/TeacherListPage'));
const SubjectListPage = lazy(() => import('./pages/subjects/SubjectListPage'));
const SchedulePage = lazy(() => import('./pages/schedule/SchedulePage'));
const AttendancePage = lazy(() => import('./pages/attendance/AttendancePage'));
const MakeupClassPage = lazy(() => import('./pages/makeup/MakeupClassPage'));
const ReportListPage = lazy(() => import('./pages/ReportListPage'));

// Public Route Guard (Redirect to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader message="Memeriksa sesi login..." />;
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <FullScreenLoader message="Memuat TikaTrack..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

export function App() {
  return (
    <AuthProvider>
      <Router>
        <RouteLoadingBar />
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Suspense fallback={<FullScreenLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
            <Route path="/reset-password/:token" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

            {/* Protected App Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><StudentListPage /></ProtectedRoute>} />
            <Route path="/students/:id" element={<ProtectedRoute><StudentDetailPage /></ProtectedRoute>} />
            <Route path="/teachers" element={<ProtectedRoute adminOnly><TeacherListPage /></ProtectedRoute>} />
            <Route path="/subjects" element={<ProtectedRoute><SubjectListPage /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
            <Route path="/makeup-classes" element={<ProtectedRoute><MakeupClassPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportListPage /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
