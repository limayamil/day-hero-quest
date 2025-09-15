import { useState, useEffect, useMemo } from 'react';
import { Activity, CategoryType, CATEGORIES, DailyHabit, BONUS_POINTS, HABIT_MESSAGES, TOTAL_CATEGORIES, getDateString, isWeekend, getRequiredCategoriesForDate, getRequiredCategoryCount } from '@/types/activity';
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
  const [activities] = useLocalStorage<Activity[]>('daily-activities', []);
  const [dailyHabits, setDailyHabits] = useLocalStorage<DailyHabit[]>('daily-habits', []);
  const habitStats = useHabitStats();
  const { toast } = useToast();

  const dateString = getDateString(selectedDate);
  const isToday = dateString === getDateString(new Date());

  // Obtener actividades completadas del día
  const dayActivities = useMemo(() => {
    return activities.filter(activity => {
      const activityDate = activity.status === 'completed'
        ? getDateString(new Date(activity.timestamp))
        : getDateString(new Date(activity.plannedDate || activity.timestamp));
      return activityDate === dateString && activity.status === 'completed';
    });
  }, [activities, dateString]);

  // Obtener categorías que tienen al menos una actividad completada
  const categoriesWithActivities = useMemo(() => {
    const categoriesSet = new Set<CategoryType>();
    dayActivities.forEach(activity => {
      categoriesSet.add(activity.category);
    });
    return categoriesSet;
  }, [dayActivities]);

  // Obtener o crear el hábito del día con auto-completado basado en actividades
  const todayHabit = useMemo(() => {
    const existing = dailyHabits.find(h => h.date === dateString);
    const requiredCategories = getRequiredCategoriesForDate(selectedDate);
    const requiredCategoryCount = getRequiredCategoryCount(selectedDate);

    // Crear progreso inicial considerando las actividades completadas
    const initialProgress = Object.keys(CATEGORIES).reduce((acc, category) => {
      const categoryKey = category as CategoryType;
      // Marcar como completado si existe una actividad de esa categoría o si ya estaba marcado manualmente
      acc[categoryKey] = categoriesWithActivities.has(categoryKey) || (existing?.categoryProgress[categoryKey] || false);
      return acc;
    }, {} as Record<CategoryType, boolean>);

    // Contar solo las categorías requeridas para este día
    const completedRequiredCount = requiredCategories.filter(cat => initialProgress[cat]).length;
    const totalHabitPoints = Object.entries(initialProgress).reduce((sum, [category, completed]) => {
      return sum + (completed ? CATEGORIES[category as CategoryType].points : 0);
    }, 0);

    // Verificar si se merece el bonus (completar todas las categorías requeridas para el día)
    const bonusEarned = completedRequiredCount === requiredCategoryCount;
    const totalPoints = totalHabitPoints + (bonusEarned ? BONUS_POINTS.DAILY_COMPLETE : 0);

    const habit: DailyHabit = {
      date: dateString,
      categoryProgress: initialProgress,
      bonusEarned,
      totalPoints,
      completedCategories: completedRequiredCount,
    };

    return habit;
  }, [dailyHabits, dateString, categoriesWithActivities, selectedDate]);

  // Efecto para sincronizar automáticamente los hábitos con las actividades
  useEffect(() => {
    const existingHabit = dailyHabits.find(h => h.date === dateString);

    // Solo actualizar si hay cambios reales en el progreso
    if (!existingHabit ||
        JSON.stringify(existingHabit.categoryProgress) !== JSON.stringify(todayHabit.categoryProgress) ||
        existingHabit.bonusEarned !== todayHabit.bonusEarned ||
        existingHabit.totalPoints !== todayHabit.totalPoints) {

      setDailyHabits(prev => {
        const index = prev.findIndex(h => h.date === dateString);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = todayHabit;
          return updated;
        } else {
          return [...prev, todayHabit];
        }
      });
    }
  }, [todayHabit, dailyHabits, dateString, setDailyHabits]);

  // Calcular progreso
  const progress = useMemo(() => {
    const completed = todayHabit.completedCategories;
    const total = getRequiredCategoryCount(selectedDate);
    const percentage = (completed / total) * 100;

    return {
      completed,
      total,
      percentage,
      isComplete: completed === total,
    };
  }, [todayHabit.completedCategories, selectedDate]);

  // Manejar toggle de categoría
  const toggleCategory = (category: CategoryType) => {
    if (!isToday) return; // Solo permitir edición para el día actual

    // Si la categoría está auto-completada por una actividad, no se puede desmarcar
    if (categoriesWithActivities.has(category) && todayHabit.categoryProgress[category]) {
      toast({
        title: "No se puede desmarcar",
        description: `Ya tienes actividades registradas en ${CATEGORIES[category].label}`,
        variant: "destructive",
      });
      return;
    }

    const newProgress = { ...todayHabit.categoryProgress };
    const wasCompleted = newProgress[category];
    newProgress[category] = !wasCompleted;

    const requiredCategories = getRequiredCategoriesForDate(selectedDate);
    const requiredCategoryCount = getRequiredCategoryCount(selectedDate);
    const completedRequiredCount = requiredCategories.filter(cat => newProgress[cat]).length;

    const categoryPoints = wasCompleted ? -CATEGORIES[category].points : CATEGORIES[category].points;
    let newTotalPoints = todayHabit.totalPoints + categoryPoints;

    // Verificar si se ganó bonus por día completo (basado en categorías requeridas)
    const wasComplete = todayHabit.completedCategories === requiredCategoryCount;
    const isNowComplete = completedRequiredCount === requiredCategoryCount;
    const bonusChange = isNowComplete && !wasComplete ? BONUS_POINTS.DAILY_COMPLETE :
                       wasComplete && !isNowComplete ? -BONUS_POINTS.DAILY_COMPLETE : 0;

    newTotalPoints += bonusChange;

    const updatedHabit: DailyHabit = {
      ...todayHabit,
      categoryProgress: newProgress,
      completedCategories: completedRequiredCount,
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
      } else if (completedRequiredCount === 1) {
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
          const isAutoCompleted = categoriesWithActivities.has(category);
          const canToggle = isToday && (!isAutoCompleted || !isCompleted);
          const requiredCategories = getRequiredCategoriesForDate(selectedDate);
          const isRequired = requiredCategories.includes(category);
          const isWeekendDay = isWeekend(selectedDate);

          return (
            <div
              key={category}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200",
                isCompleted
                  ? isAutoCompleted
                    ? "border-green-500/50 bg-green-500/10 dark:border-green-400/50 dark:bg-green-400/10"
                    : "border-primary bg-primary/5"
                  : isRequired
                  ? "border-border hover:border-muted-foreground/30"
                  : "border-border/50 bg-muted/20",
                !isToday && "opacity-70",
                !isRequired && isWeekendDay && "opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "p-0 h-8 w-8",
                    !canToggle && "cursor-not-allowed opacity-60"
                  )}
                  onClick={() => toggleCategory(category)}
                  disabled={!canToggle}
                >
                  {isCompleted ? (
                    <CheckCircle2
                      className={cn(
                        "w-6 h-6",
                        isAutoCompleted
                          ? "text-green-600 dark:text-green-400"
                          : "text-primary"
                      )}
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
                    {!isRequired && isWeekendDay && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        • Opcional
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {config.points} puntos
                    {isAutoCompleted && isCompleted && (
                      <span className="ml-1 text-green-600 dark:text-green-400">
                        • Auto
                      </span>
                    )}
                    {!isRequired && isWeekendDay && (
                      <span className="ml-1 text-amber-600 dark:text-amber-400">
                        • Fin de semana
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {isCompleted && (
                <Badge
                  variant="secondary"
                  className={cn(
                    isAutoCompleted
                      ? "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {isAutoCompleted ? "📊 Actividad" : "✓ Manual"}
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
                    {isWeekend(selectedDate) && (
                      <span className="block mt-1 text-amber-600 dark:text-amber-400">
                        🎉 Fin de semana: Trabajo y Otros son opcionales
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    ¡Comienza tu día! ✨
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Marca tu primera actividad para empezar
                    {isWeekend(selectedDate) && (
                      <span className="block mt-1 text-amber-600 dark:text-amber-400">
                        🎉 Fin de semana: Solo necesitas 4 categorías
                      </span>
                    )}
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