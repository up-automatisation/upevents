import { useState, useEffect, createContext, useContext } from 'react';
import { Dashboard } from './components/Dashboard';
import { CreateEvent } from './components/CreateEvent';
import { EventDetail } from './components/EventDetail';
import { RegisterForm } from './components/RegisterForm';
import { AttendanceScanner } from './components/AttendanceScanner';
import { Leaderboard } from './components/Leaderboard';
import { ProgramBuilder } from './components/ProgramBuilder';
import { CategoryManager } from './components/CategoryManager';
import { Sidebar } from './components/Sidebar';
import Login from './components/Login';
import { auth } from './lib/api';
import { Loader2 } from 'lucide-react';

type NavigateFunction = (path: string) => void;

const NavigationContext = createContext<NavigateFunction>(() => {});

export function useNavigate() {
  return useContext(NavigationContext);
}

// Auth Context
interface AuthContextType {
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function App() {
  const [route, setRoute] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Initialize route from URL
  useEffect(() => {
    const path = window.location.pathname.slice(1);
    setRoute(path);

    const handlePopState = () => {
      setRoute(window.location.pathname.slice(1));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await auth.check();
        setIsAuthenticated(response.authenticated);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  const navigate: NavigateFunction = (path: string) => {
    const fullPath = path ? `/${path}` : '/';
    window.history.pushState({}, '', fullPath);
    setRoute(path);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Public routes - always accessible without authentication
  if (route.startsWith('register/')) {
    const registrationCode = route.split('/')[1];
    return <RegisterForm registrationCode={registrationCode} />;
  }

  if (route.startsWith('attendance/')) {
    const attendanceCode = route.split('/')[1];
    return <AttendanceScanner attendanceCode={attendanceCode} />;
  }

  // Loading state - checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login page
  if (isAuthenticated === false) {
    return <Login onLogin={handleLogin} />;
  }

  // Authenticated - show admin app
  return (
    <AuthContext.Provider value={{ logout: handleLogout }}>
      <NavigationContext.Provider value={navigate}>
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
          <Sidebar currentRoute={route} />
          <div className="flex-1">
            {route === 'create' && <CreateEvent />}
            {route === 'categories' && <CategoryManager />}
            {route === 'program' && <ProgramBuilder />}
            {route.startsWith('program/') && <ProgramBuilder preselectedEventId={Number(route.split('/')[1])} />}
            {route === 'leaderboard' && <Leaderboard />}
            {route.startsWith('event/') && <EventDetail eventId={Number(route.split('/')[1])} />}
            {!route && <Dashboard />}
          </div>
        </div>
      </NavigationContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
