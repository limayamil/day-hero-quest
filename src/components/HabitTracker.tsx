import { useState, useEffect, useMemo } from 'react';
import { Activity, CategoryType, CATEGORIES, DailyHabit, BONUS_POINTS, HABIT_MESSAGES, TOTAL_CATEGORIES, PREMIUM_HABITS, getDateString, getLocalDateString, isWeekend, getRequiredCategoriesForDate, getRequiredCategoryCount } from '@/types/activity';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useHabitStats } from '@/hooks/useHabitStats';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Star, Flame, Target, Crown, Edit3, CheckCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { celebrateHabit, celebratePerfectDay } from '@/lib/confetti';

interface HabitTrackerProps {
  selectedDate?: Date;
}

export const HabitTracker = ({ selectedDate = new Date() }: HabitTrackerProps) => {
  const [activities] = useLocalStorage<Activity[]>('daily-activities', []);
  const [dailyHabits, setDailyHabits] = useLocalStorage<DailyHabit[]>('daily-habits', []);
  const habitStats = useHabitStats();
  const { toast } = useToast();

  // Estado para modo de edición rápida
  const [quickEditMode, setQuickEditMode] = useState(false);
  const [tempCategoryProgress, setTempCategoryProgress] = useState<Record<CategoryType, boolean>>({} as Record<CategoryType, boolean>);
  const [tempPremiumHabits, setTempPremiumHabits] = useState<Record<string, boolean>>({});

  const dateString = getLocalDateString(selectedDate);
  const isToday = dateString === getLocalDateString(new Date());

  // Obtener actividades completadas del día
  const dayActivities = useMemo(() => {
    const filtered = activities.filter(activity => {
      const activityDate = activity.status === 'completed'
        ? getLocalDateString(new Date(activity.timestamp))
        : getLocalDateString(new Date(activity.plannedDate || activity.timestamp));
      return activityDate === dateString && activity.status === 'completed';
    });


    return filtered;
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

    // Inicializar premium habits con valores existentes o vacío
    const premiumHabits = existing?.premiumHabits || {};

    // Contar solo las categorías requeridas para este día
    const completedRequiredCount = requiredCategories.filter(cat => initialProgress[cat]).length;
    const totalHabitPoints = Object.entries(initialProgress).reduce((sum, [category, completed]) => {
      return sum + (completed ? CATEGORIES[category as CategoryType].points : 0);
    }, 0);

    // Sumar puntos de premium habits
    const premiumHabitPoints = Object.entries(premiumHabits).reduce((sum, [habitId, completed]) => {
      if (completed && PREMIUM_HABITS[habitId as keyof typeof PREMIUM_HABITS]) {
        return sum + PREMIUM_HABITS[habitId as keyof typeof PREMIUM_HABITS].points;
      }
      return sum;
    }, 0);

    // Verificar si se merece el bonus (completar todas las categorías requeridas para el día)
    const bonusEarned = completedRequiredCount === requiredCategoryCount;
    const totalPoints = totalHabitPoints + premiumHabitPoints + (bonusEarned ? BONUS_POINTS.DAILY_COMPLETE : 0);


    const habit: DailyHabit = {
      date: dateString,
      categoryProgress: initialProgress,
      bonusEarned,
      totalPoints,
      completedCategories: completedRequiredCount,
      premiumHabits,
    };

    return habit;
  }, [dailyHabits, dateString, categoriesWithActivities, selectedDate]);

  // Efecto para sincronizar automáticamente los hábitos con las actividades
  useEffect(() => {
    const existingHabit = dailyHabits.find(h => h.date === dateString);

    // Solo actualizar si hay cambios reales en el progreso
    const hasChanges = !existingHabit ||
        existingHabit.completedCategories !== todayHabit.completedCategories ||
        existingHabit.bonusEarned !== todayHabit.bonusEarned ||
        existingHabit.totalPoints !== todayHabit.totalPoints;

    if (hasChanges) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateString, todayHabit.completedCategories, todayHabit.bonusEarned, todayHabit.totalPoints]);

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

  // Inicializar el modo de edición rápida
  const enterQuickEditMode = () => {
    setTempCategoryProgress({ ...todayHabit.categoryProgress });
    setTempPremiumHabits({ ...todayHabit.premiumHabits });
    setQuickEditMode(true);
  };

  // Salir del modo de edición rápida sin guardar
  const cancelQuickEdit = () => {
    setQuickEditMode(false);
    setTempCategoryProgress({} as Record<CategoryType, boolean>);
    setTempPremiumHabits({});
  };

  // Marcar todas las categorías requeridas en modo edición
  const selectAllRequired = () => {
    const requiredCategories = getRequiredCategoriesForDate(selectedDate);
    const newProgress = { ...tempCategoryProgress };

    requiredCategories.forEach(cat => {
      newProgress[cat] = true;
    });

    setTempCategoryProgress(newProgress);
  };

  // Limpiar todas las selecciones en modo edición
  const clearAllSelections = () => {
    const newProgress = Object.keys(CATEGORIES).reduce((acc, category) => {
      const categoryKey = category as CategoryType;
      // Mantener solo las que están auto-completadas por actividades
      acc[categoryKey] = categoriesWithActivities.has(categoryKey);
      return acc;
    }, {} as Record<CategoryType, boolean>);

    setTempCategoryProgress(newProgress);
    setTempPremiumHabits({});
  };

  // Guardar todos los cambios del modo edición rápida
  const saveQuickEdit = () => {
    const requiredCategories = getRequiredCategoriesForDate(selectedDate);
    const requiredCategoryCount = getRequiredCategoryCount(selectedDate);
    const completedRequiredCount = requiredCategories.filter(cat => tempCategoryProgress[cat]).length;

    // Calcular puntos
    const categoryPoints = Object.entries(tempCategoryProgress).reduce((sum, [category, completed]) => {
      return sum + (completed ? CATEGORIES[category as CategoryType].points : 0);
    }, 0);

    const premiumHabitPoints = Object.entries(tempPremiumHabits).reduce((sum, [habitId, completed]) => {
      if (completed && PREMIUM_HABITS[habitId as keyof typeof PREMIUM_HABITS]) {
        return sum + PREMIUM_HABITS[habitId as keyof typeof PREMIUM_HABITS].points;
      }
      return sum;
    }, 0);

    const bonusEarned = completedRequiredCount === requiredCategoryCount;
    const totalPoints = categoryPoints + premiumHabitPoints + (bonusEarned ? BONUS_POINTS.DAILY_COMPLETE : 0);

    const updatedHabit: DailyHabit = {
      date: dateString,
      categoryProgress: tempCategoryProgress,
      bonusEarned,
      totalPoints,
      completedCategories: completedRequiredCount,
      premiumHabits: tempPremiumHabits,
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

    setQuickEditMode(false);

    toast({
      title: "Hábitos guardados",
      description: `${completedRequiredCount} de ${requiredCategoryCount} categorías completadas (${totalPoints} pts)`,
    });
  };

  // Toggle de categoría en modo edición rápida
  const toggleCategoryQuickEdit = (category: CategoryType) => {
    // Si está auto-completada, no se puede desmarcar
    if (categoriesWithActivities.has(category) && tempCategoryProgress[category]) {
      toast({
        title: "No se puede desmarcar",
        description: `Ya tienes actividades registradas en ${CATEGORIES[category].label}`,
        variant: "destructive",
      });
      return;
    }

    setTempCategoryProgress(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Toggle de premium habit en modo edición rápida
  const togglePremiumHabitQuickEdit = (habitId: string) => {
    setTempPremiumHabits(prev => ({
      ...prev,
      [habitId]: !prev[habitId]
    }));
  };

  // Manejar toggle de premium habit (modo normal)
  const togglePremiumHabit = (habitId: string) => {
    const habit = PREMIUM_HABITS[habitId as keyof typeof PREMIUM_HABITS];
    if (!habit) return;

    const newPremiumHabits = { ...todayHabit.premiumHabits };
    const wasCompleted = newPremiumHabits[habitId] || false;
    newPremiumHabits[habitId] = !wasCompleted;

    const pointsChange = wasCompleted ? -habit.points : habit.points;
    const newTotalPoints = Math.max(0, todayHabit.totalPoints + pointsChange);

    const updatedHabit: DailyHabit = {
      ...todayHabit,
      premiumHabits: newPremiumHabits,
      totalPoints: newTotalPoints,
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

    // Mostrar toast y confetti
    if (!wasCompleted) {
      celebratePerfectDay(); // Usar la celebración más grande para habits premium
      toast({
        title: `✨ ${habit.label} completado!`,
        description: `+${habit.points} puntos premium 💎`,
      });
    } else {
      toast({
        title: "Hábito premium desmarcado",
        description: `${habit.label} pendiente para hoy`,
        variant: "destructive",
      });
    }
  };

  // Manejar toggle de categoría
  const toggleCategory = (category: CategoryType) => {
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

    // Mostrar toast apropiado y confetti
    if (!wasCompleted) {
      if (isNowComplete) {
        celebratePerfectDay();
        toast({
          title: HABIT_MESSAGES.DAILY_COMPLETE,
          description: `¡Bonus de ${BONUS_POINTS.DAILY_COMPLETE} puntos ganado! 🎉`,
        });
      } else if (completedRequiredCount === 1) {
        celebrateHabit();
        toast({
          title: HABIT_MESSAGES.FIRST_HABIT,
          description: `+${CATEGORIES[category].points} puntos por ${CATEGORIES[category].label}`,
        });
      } else {
        celebrateHabit();
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {isToday ? 'Hábitos de Hoy' : `Hábitos del ${selectedDate.toLocaleDateString('es-ES')}`}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {quickEditMode
                ? `Editando: ${Object.values(tempCategoryProgress).filter(Boolean).length} de ${progress.total} categorías`
                : `${progress.completed} de ${progress.total} categorías completadas`
              }
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!quickEditMode && todayHabit.bonusEarned && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900">
                <Star className="w-4 h-4 mr-1" />
                Bonus
              </Badge>
            )}

            {!isToday && !quickEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={enterQuickEditMode}
                className="gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edición Rápida
              </Button>
            )}
          </div>
        </div>

        {/* Botones de acción rápida cuando está en modo edición */}
        {quickEditMode && (
          <div className="flex gap-2 mb-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={selectAllRequired}
              className="flex-1 gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllSelections}
              className="flex-1 gap-2"
            >
              <X className="w-4 h-4" />
              Limpiar
            </Button>
          </div>
        )}

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
        {/* Premium Habits Section */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-500" />
            HÁBITOS PREMIUM
          </div>
          {Object.entries(PREMIUM_HABITS).map(([habitId, habitConfig]) => {
            const isCompleted = quickEditMode
              ? tempPremiumHabits[habitId] || false
              : todayHabit.premiumHabits?.[habitId] || false;

            return (
              <div
                key={habitId}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all duration-300 overflow-hidden",
                  quickEditMode
                    ? "bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-yellow-500/5 dark:from-purple-500/10 dark:via-pink-500/10 dark:to-yellow-500/10"
                    : "bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-yellow-500/10 dark:from-purple-500/20 dark:via-pink-500/20 dark:to-yellow-500/20",
                  isCompleted
                    ? quickEditMode
                      ? "border-yellow-500/50 bg-yellow-500/5"
                      : "border-transparent shadow-lg shadow-yellow-500/20 animate-pulse-success"
                    : "border-yellow-500/30 hover:border-yellow-500/50 hover:shadow-md"
                )}
              >
                {/* Decorative gradient overlay */}
                {!quickEditMode && (
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/10 to-yellow-400/0",
                    "opacity-0 transition-opacity duration-300",
                    isCompleted && "opacity-100"
                  )} />
                )}

                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "p-0 h-8 w-8 rounded-full flex-shrink-0",
                        !quickEditMode && "hover:scale-110 transition-transform duration-200"
                      )}
                      onClick={() => quickEditMode ? togglePremiumHabitQuickEdit(habitId) : togglePremiumHabit(habitId)}
                    >
                      {isCompleted ? (
                        <div className="relative">
                          <CheckCircle2 className={cn(
                            "w-7 h-7 drop-shadow-lg",
                            quickEditMode ? "text-yellow-600" : "text-yellow-500"
                          )} />
                          {!quickEditMode && (
                            <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-md" />
                          )}
                        </div>
                      ) : (
                        <Circle className="w-7 h-7 text-yellow-500/50" />
                      )}
                    </Button>

                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-lg flex-shrink-0">{habitConfig.icon}</span>
                      <p className={cn(
                        "font-bold truncate",
                        isCompleted ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {habitConfig.label}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className={cn(
                      "text-xl font-bold",
                      isCompleted
                        ? quickEditMode
                          ? "text-yellow-600"
                          : "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600"
                        : "text-muted-foreground"
                    )}>
                      {habitConfig.points}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">pts</div>
                  </div>
                </div>

                {isCompleted && !quickEditMode && (
                  <div className="absolute top-2 right-2">
                    <Star className="w-5 h-5 text-yellow-400 animate-bounce-gentle" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Category Habits Section */}
        <div className="text-xs font-semibold text-muted-foreground mb-3">
          HÁBITOS DIARIOS
        </div>
        {(Object.entries(CATEGORIES) as Array<[CategoryType, typeof CATEGORIES[CategoryType]]>).map(([category, config]) => {
          const isCompleted = quickEditMode
            ? tempCategoryProgress[category] || false
            : todayHabit.categoryProgress[category];
          const isAutoCompleted = categoriesWithActivities.has(category);
          const canToggle = !isAutoCompleted || !isCompleted;
          const requiredCategories = getRequiredCategoriesForDate(selectedDate);
          const isRequired = requiredCategories.includes(category);
          const isWeekendDay = isWeekend(selectedDate);
          const isAlwaysOptional = category === 'otros';
          const isWeekendOptional = category === 'laburo' && isWeekendDay;

          return (
            <div
              key={category}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200",
                quickEditMode
                  ? isCompleted
                    ? "border-primary bg-primary/10"
                    : isRequired
                    ? "border-border hover:border-primary/50"
                    : "border-border/50 bg-muted/20"
                  : isCompleted
                  ? isAutoCompleted
                    ? "border-green-500/50 bg-green-500/10 dark:border-green-400/50 dark:bg-green-400/10"
                    : "border-primary bg-primary/5"
                  : isRequired
                  ? "border-border hover:border-muted-foreground/30"
                  : "border-border/50 bg-muted/20",
                !isRequired && "opacity-60"
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
                  onClick={() => quickEditMode ? toggleCategoryQuickEdit(category) : toggleCategory(category)}
                  disabled={!canToggle}
                >
                  {isCompleted ? (
                    <CheckCircle2
                      className={cn(
                        "w-6 h-6",
                        quickEditMode
                          ? "text-primary"
                          : isAutoCompleted
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
                    {!isRequired && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        • Opcional
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {config.points} puntos
                    {!quickEditMode && isAutoCompleted && isCompleted && (
                      <span className="ml-1 text-green-600 dark:text-green-400">
                        • Auto
                      </span>
                    )}
                    {isAlwaysOptional && (
                      <span className="ml-1 text-amber-600 dark:text-amber-400">
                        • Siempre opcional
                      </span>
                    )}
                    {isWeekendOptional && (
                      <span className="ml-1 text-amber-600 dark:text-amber-400">
                        • Fin de semana
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {isCompleted && !quickEditMode && (
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

        {/* Botones de acción cuando está en modo edición */}
        {quickEditMode && (
          <div className="flex gap-2 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              size="lg"
              onClick={cancelQuickEdit}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={saveQuickEdit}
              className="flex-1 gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Guardar Cambios
            </Button>
          </div>
        )}

        {/* Mensaje motivacional */}
        {isToday && !quickEditMode && (
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
                    {isWeekend(selectedDate) ? (
                      <span className="block mt-1 text-amber-600 dark:text-amber-400">
                        🎉 Fin de semana: Trabajo opcional
                      </span>
                    ) : (
                      <span className="block mt-1 text-amber-600 dark:text-amber-400">
                        💡 Otros siempre es opcional
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
                    {isWeekend(selectedDate) ? (
                      <span className="block mt-1 text-amber-600 dark:text-amber-400">
                        🎉 Fin de semana: Solo necesitas 4 categorías
                      </span>
                    ) : (
                      <span className="block mt-1 text-amber-600 dark:text-amber-400">
                        💡 Necesitas 5 categorías (Otros siempre opcional)
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