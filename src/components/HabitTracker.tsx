import { useState, useEffect, useMemo } from 'react';
import { CategoryType, CATEGORIES, DailyHabit, BONUS_POINTS, HABIT_MESSAGES, TOTAL_CATEGORIES, getDateString } from '@/types/activity';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useHabitStats } from '@/hooks/useHabitStats';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Star, Flame, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HabitTrackerProps {
  selectedDate?: Date;
}

export const HabitTracker = ({ selectedDate = new Date() }: HabitTrackerProps) => {
  const [dailyHabits, setDailyHabits] = useLocalStorage<DailyHabit[]>('daily-habits', []);
  const habitStats = useHabitStats();
  const { toast } = useToast();

  const dateString = getDateString(selectedDate);
  const isToday = dateString === getDateString(new Date());

  // Obtener o crear el hábito del día
  const todayHabit = useMemo(() => {
    const existing = dailyHabits.find(h => h.date === dateString);
    if (existing) return existing;

    // Crear nuevo hábito para el día
    const initialProgress = Object.keys(CATEGORIES).reduce((acc, category) => {
      acc[category as CategoryType] = false;
      return acc;
    }, {} as Record<CategoryType, boolean>);

    return {
      date: dateString,
      categoryProgress: initialProgress,
      bonusEarned: false,
      totalPoints: 0,
      completedCategories: 0,
    } as DailyHabit;
  }, [dailyHabits, dateString]);

  // Calcular progreso
  const progress = useMemo(() => {
    const completed = todayHabit.completedCategories;
    const total = TOTAL_CATEGORIES;
    const percentage = (completed / total) * 100;

    return {
      completed,
      total,
      percentage,
      isComplete: completed === total,
    };
  }, [todayHabit.completedCategories]);

  // Manejar toggle de categoría
  const toggleCategory = (category: CategoryType) => {
    if (!isToday) return; // Solo permitir edición para el día actual

    const newProgress = { ...todayHabit.categoryProgress };
    const wasCompleted = newProgress[category];
    newProgress[category] = !wasCompleted;

    const completedCount = Object.values(newProgress).filter(Boolean).length;
    const categoryPoints = wasCompleted ? -CATEGORIES[category].points : CATEGORIES[category].points;
    let newTotalPoints = todayHabit.totalPoints + categoryPoints;

    // Verificar si se ganó bonus por día completo
    const wasComplete = todayHabit.completedCategories === TOTAL_CATEGORIES;
    const isNowComplete = completedCount === TOTAL_CATEGORIES;
    const bonusChange = isNowComplete && !wasComplete ? BONUS_POINTS.DAILY_COMPLETE :
                       wasComplete && !isNowComplete ? -BONUS_POINTS.DAILY_COMPLETE : 0;

    newTotalPoints += bonusChange;

    const updatedHabit: DailyHabit = {
      ...todayHabit,
      categoryProgress: newProgress,
      completedCategories: completedCount,
      totalPoints: Math.max(0, newTotalPoints),
      bonusEarned: isNowComplete,
    };

    // Actualizar en el estado
    setDailyHabits(prev => {
      const existing = prev.findIndex(h => h.date === dateString);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = updatedHabit;
        return updated;
      } else {
        return [...prev, updatedHabit];
      }
    });

    // Mostrar toast apropiado
    if (!wasCompleted) {
      if (isNowComplete) {
        toast({
          title: HABIT_MESSAGES.DAILY_COMPLETE,
          description: `¡Bonus de ${BONUS_POINTS.DAILY_COMPLETE} puntos ganado! 🎉`,
        });
      } else if (completedCount === 1) {
        toast({
          title: HABIT_MESSAGES.FIRST_HABIT,
          description: `+${CATEGORIES[category].points} puntos por ${CATEGORIES[category].label}`,
        });
      } else {
        toast({
          title: HABIT_MESSAGES.CATEGORY_COMPLETE.replace('{category}', CATEGORIES[category].label),
          description: `+${CATEGORIES[category].points} puntos`,
        });
      }
    } else {
      toast({
        title: "Hábito desmarcado",
        description: `${CATEGORIES[category].label} pendiente para hoy`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {isToday ? 'Hábitos de Hoy' : `Hábitos del ${selectedDate.toLocaleDateString('es-ES')}`}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {progress.completed} de {progress.total} categorías completadas
            </p>
          </div>

          {todayHabit.bonusEarned && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900">
              <Star className="w-4 h-4 mr-1" />
              Bonus
            </Badge>
          )}
        </div>

        {/* Barra de progreso */}
        <div className="space-y-2">
          <Progress value={progress.percentage} className="h-3" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {progress.percentage.toFixed(0)}% completado
            </span>
            <span className="font-medium">
              {todayHabit.totalPoints} puntos
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {(Object.entries(CATEGORIES) as Array<[CategoryType, typeof CATEGORIES[CategoryType]]>).map(([category, config]) => {
          const isCompleted = todayHabit.categoryProgress[category];

          return (
            <div
              key={category}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200",
                isCompleted
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30",
                !isToday && "opacity-70"
              )}
            >
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-0 h-8 w-8"
                  onClick={() => toggleCategory(category)}
                  disabled={!isToday}
                >
                  {isCompleted ? (
                    <CheckCircle2
                      className="w-6 h-6 text-primary"
                    />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground" />
                  )}
                </Button>

                <div>
                  <p className={cn(
                    "font-medium",
                    isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {config.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {config.points} puntos
                  </p>
                </div>
              </div>

              {isCompleted && (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary"
                >
                  ✓ Completo
                </Badge>
              )}
            </div>
          );
        })}

        {/* Mensaje motivacional */}
        {isToday && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              {progress.isComplete ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold text-foreground">
                      ¡Día Perfecto Completado!
                    </span>
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Has completado todas las categorías. ¡Excelente trabajo!
                  </p>
                </div>
              ) : progress.completed > 0 ? (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    ¡Buen progreso! 🚀
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Te faltan {progress.total - progress.completed} categorías para el día perfecto
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    ¡Comienza tu día! ✨
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Marca tu primera actividad para empezar
                  </p>
                </div>
              )}
            </div>

            {/* Información de rachas y próximos milestones */}
            <div className="grid grid-cols-1 gap-3">
              {/* Racha actual */}
              {habitStats.currentStreak > 0 && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 dark:from-orange-500/20 dark:to-yellow-500/20 rounded-lg border border-orange-500/20 dark:border-orange-500/30">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                    <span className="text-sm font-medium text-foreground">Racha actual</span>
                  </div>
                  <Badge className="bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                    {habitStats.currentStreak} días
                  </Badge>
                </div>
              )}

              {/* Próximo milestone */}
              {habitStats.nextMilestone && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-lg border border-blue-500/20 dark:border-blue-500/30">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    <div>
                      <span className="text-sm font-medium block text-foreground">
                        {habitStats.nextMilestone.type === 'streak'
                          ? `${habitStats.nextMilestone.target} días seguidos`
                          : habitStats.nextMilestone.type === 'weekly'
                          ? 'Semana perfecta'
                          : 'Mes épico'
                        }
                      </span>
                      <span className="text-xs text-muted-foreground">
                        +{habitStats.nextMilestone.bonus} puntos bonus
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-foreground">
                      {habitStats.nextMilestone.current}/{habitStats.nextMilestone.target}
                    </div>
                    <Progress
                      value={(habitStats.nextMilestone.current / habitStats.nextMilestone.target) * 100}
                      className="w-16 h-1 mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};