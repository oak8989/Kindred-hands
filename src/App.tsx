import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import { useEffect, useState } from 'react';
import SetupWizard from './pages/SetupWizard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SetNewPassword from './pages/SetNewPassword';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import CheckIn from './pages/CheckIn';
import Waivers from './pages/Waivers';
import Medals from './pages/Medals';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/login" />;
  if (roles && !roles.includes(currentUser.role)) return <Navigate to="/dashboard" />;
  if (currentUser.mustResetPassword) return <Navigate to="/set-password" />;
  return <>{children}</>;
}

function App() {
  const { settings, hasHydrated } = useStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for zustand to hydrate from localStorage
  useEffect(() => {
    const checkHydration = () => {
      if (hasHydrated) {
        setIsHydrated(true);
      } else {
        setTimeout(checkHydration, 50);
      }
    };
    checkHydration();
  }, [hasHydrated]);

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!settings.isSetupComplete) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<SetupWizard />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/set-password" element={<ProtectedRoute><SetNewPassword /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/checkin" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
        <Route path="/waivers" element={<ProtectedRoute><Waivers /></ProtectedRoute>} />
        <Route path="/medals" element={<ProtectedRoute><Medals /></ProtectedRoute>} />
        <Route path="/admin/*" element={<ProtectedRoute roles={['admin', 'assistant']}><AdminPanel /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
