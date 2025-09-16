import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CheckSquare, Calendar, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    path: '/',
    icon: Home,
    label: 'Hoy',
  },
  {
    path: '/habits',
    icon: CheckSquare,
    label: 'Hábitos',
  },
  {
    path: '/calendar',
    icon: Calendar,
    label: 'Calendario',
  },
  {
    path: '/stats',
    icon: BarChart3,
    label: 'Estadísticas',
  },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-0 flex-1",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className="relative flex items-center justify-center w-6 h-6">
                <Icon className="w-5 h-5 flex-shrink-0" />

                {/* Badge para notificaciones (futuro) */}
                {item.badge && item.badge > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </div>
                )}
              </div>

              <span className={cn(
                "text-xs font-medium truncate max-w-full text-center leading-tight",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>

            </button>
          );
        })}
      </div>
    </nav>
  );
};