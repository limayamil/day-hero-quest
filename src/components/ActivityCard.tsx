import { Activity, CATEGORIES } from '@/types/activity';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
  activity: Activity;
  className?: string;
}

export function ActivityCard({ activity, className }: ActivityCardProps) {
  const category = CATEGORIES[activity.category];
  const timeStr = new Date(activity.timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className={cn(
      'p-4 shadow-soft hover:shadow-medium transition-all duration-200 animate-fade-in-up',
      'border-l-4 hover:scale-[1.02]',
      className
    )}
    style={{
      borderLeftColor: `hsl(var(--${category.color}))`,
    }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {activity.text}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{timeStr}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <Badge 
            variant="secondary"
            className={cn('text-xs font-medium')}
            style={{
              backgroundColor: `hsl(var(--${category.color}) / 0.1)`,
              color: `hsl(var(--${category.color}))`,
              borderColor: `hsl(var(--${category.color}) / 0.2)`,
            }}
          >
            {category.label}
          </Badge>
          
          <div className="flex items-center gap-1 text-success">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-xs font-bold">+{activity.points}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}