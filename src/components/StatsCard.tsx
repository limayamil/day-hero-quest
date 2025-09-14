import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DailyStats } from '@/types/activity';
import { Trophy, Target, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  stats: DailyStats;
  className?: string;
}

export function StatsCard({ stats, className }: StatsCardProps) {
  const getStreakMessage = (points: number) => {
    if (points >= 100) return '¡Eres increíble! 🌟';
    if (points >= 50) return '¡Vas muy bien! 💪';
    if (points >= 25) return '¡Buen progreso! ✨';
    return '¡Cada paso cuenta! 🚀';
  };

  const getPointsColor = (points: number) => {
    if (points >= 100) return 'text-green-800';
    if (points >= 50) return 'text-blue-800';
    if (points >= 25) return 'text-orange-800';
    return 'text-black/70';
  };

  return (
    <Card className={cn(
      'p-6 bg-success text-black shadow-strong',
      'hover:scale-[1.02] transition-transform duration-200',
      className
    )}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span className="font-medium">Hoy</span>
          </div>
          <Badge variant="secondary" className="bg-black/10 text-black border-black/20">
            {new Date(stats.date).toLocaleDateString('es-ES', { 
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            })}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
            <div className="text-xs text-black/80">Actividades</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Trophy className="h-4 w-4" />
            </div>
            <div className={cn('text-2xl font-bold', getPointsColor(stats.totalPoints))}>
              {stats.totalPoints}
            </div>
            <div className="text-xs text-black/80">Puntos</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold">{stats.categoriesUsed.length}</div>
            <div className="text-xs text-black/80">Categorías</div>
          </div>
        </div>

        <div className="text-center pt-2 border-t border-black/20">
          <p className="text-sm font-medium animate-bounce-gentle">
            {getStreakMessage(stats.totalPoints)}
          </p>
        </div>
      </div>
    </Card>
  );
}