import { Activity, CATEGORIES } from '@/types/activity';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlannedActivityCardProps {
  activity: Activity;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  className?: string;
}

export function PlannedActivityCard({ activity, onComplete, onCancel, className }: PlannedActivityCardProps) {
  const category = CATEGORIES[activity.category];

  return (
    <Card className={cn(
      'p-4 shadow-soft hover:shadow-medium transition-all duration-200',
      'border-l-4 bg-gradient-to-r from-info/5 to-warning/5',
      className
    )}
    style={{
      borderLeftColor: `hsl(var(--${category.color}))`,
    }}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-relaxed">
              {activity.text}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Planeado para hoy</span>
            </div>
          </div>
          
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
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onComplete(activity.id)}
            className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
          >
            <Check className="h-3 w-3 mr-1" />
            Completar (+{activity.points})
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCancel(activity.id)}
            className="flex-1 hover:bg-destructive/10 hover:text-destructive border-destructive/20"
          >
            <X className="h-3 w-3 mr-1" />
            Cancelar
          </Button>
        </div>
      </div>
    </Card>
  );
}