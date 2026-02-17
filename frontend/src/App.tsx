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

type NavigateFunction = (path: string) => void;

const NavigationContext = createContext<NavigateFunction>(() => {});

export function useNavigate() {
  return useContext(NavigationContext);
}

function App() {
  const [route, setRoute] = useState<string>('');

  useEffect(() => {
    const path = window.location.pathname.slice(1);
    setRoute(path);

    const handlePopState = () => {
      setRoute(window.location.pathname.slice(1));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate: NavigateFunction = (path: string) => {
    const fullPath = path ? `/${path}` : '/';
    window.history.pushState({}, '', fullPath);
    setRoute(path);
  };

  if (route.startsWith('register/')) {
    const registrationCode = route.split('/')[1];
    return <RegisterForm registrationCode={registrationCode} />;
  }

  if (route.startsWith('attendance/')) {
    const attendanceCode = route.split('/')[1];
    return <AttendanceScanner attendanceCode={attendanceCode} />;
  }

  return (
    <NavigationContext.Provider value={navigate}>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <Sidebar currentRoute={route} />
        <div className="flex-1">
          {route === 'create' && <CreateEvent />}
          {route === 'categories' && <CategoryManager />}
          {route === 'program' && <ProgramBuilder />}
          {route.startsWith('program/') && <ProgramBuilder preselectedEventId={route.split('/')[1]} />}
          {route === 'leaderboard' && <Leaderboard />}
          {route.startsWith('event/') && <EventDetail eventId={route.split('/')[1]} />}
          {!route && <Dashboard />}
        </div>
      </div>
    </NavigationContext.Provider>
  );
}

export default App;
