import { Calendar, Tag, FileText, Trophy, Plus, LayoutDashboard, LogOut } from 'lucide-react';
import { useNavigate, useAuth } from '../App';

interface SidebarProps {
  currentRoute: string;
}

export function Sidebar({ currentRoute }: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navItems = [
    {
      icon: LayoutDashboard,
      label: 'Événements',
      path: '',
      onClick: () => navigate(''),
      checkActive: (route: string) => !route || route.startsWith('event/'),
    },
    {
      icon: Tag,
      label: 'Catégories',
      path: 'categories',
      onClick: () => navigate('categories'),
      checkActive: (route: string) => route.startsWith('categories'),
    },
    {
      icon: FileText,
      label: 'Programmes',
      path: 'program',
      onClick: () => navigate('program'),
      checkActive: (route: string) => route.startsWith('program'),
    },
    {
      icon: Trophy,
      label: 'Statistiques',
      path: 'leaderboard',
      onClick: () => navigate('leaderboard'),
      checkActive: (route: string) => route.startsWith('leaderboard'),
    },
  ];

  return (
    <div className="w-72 flex-shrink-0 bg-white border-r border-slate-200 min-h-screen">
      <div className="sticky top-0 h-screen flex flex-col p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 w-10 h-10 rounded-xl flex items-center justify-center">
              <Calendar size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              UP-EVENTS
            </h1>
          </div>
          <p className="text-sm text-slate-600 ml-13">Gestion d'événements</p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.checkActive(currentRoute);

            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  active
                    ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 shadow-sm'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon size={20} className={active ? 'text-blue-600' : 'text-slate-500'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-2">
          <button
            onClick={() => navigate('create')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl font-semibold"
          >
            <Plus size={20} />
            Nouvel Événement
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 border border-slate-300 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-50 transition-all font-medium"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
