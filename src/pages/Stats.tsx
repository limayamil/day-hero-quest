import { useMemo } from 'react';
import { StatsOverview } from '@/components/StatsOverview';
import { Activity, DailyHabit, CATEGORIES, BONUS_POINTS, PREMIUM_HABITS, getDateString, getLocalDateString, getRequiredCategoryCount } from '@/types/activity';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Trophy, Target, Flame, Star, TrendingUp, Crown } from 'lucide-react';

const Stats = () => {
  const [activities] = useLocalStorage<Activity[]>('daily-activities', []);
  const [dailyHabits] = useLocalStorage<DailyHabit[]>('daily-habits', []);

  // Estadísticas generales
  const overallStats = useMemo(() => {
    const completedActivities = activities.filter(a => a.status === 'completed');
    const totalActivityPoints = completedActivities.reduce((sum, a) => sum + a.points, 0);
    const totalHabitPoints = dailyHabits.reduce((sum, h) => sum + h.totalPoints, 0);
    const totalPoints = totalActivityPoints + totalHabitPoints;

    const totalBonusDays = dailyHabits.filter(h => h.bonusEarned).length;
    const totalActiveDays = new Set([
      ...completedActivities.map(a => getLocalDateString(new Date(a.timestamp))),
      ...dailyHabits.filter(h => h.completedCategories > 0).map(h => h.date)
    ]).size;

    // Calcular estadísticas de premium habits
    const totalPremiumHabitsCompleted = dailyHabits.reduce((sum, h) => {
      return sum + Object.values(h.premiumHabits || {}).filter(Boolean).length;
    }, 0);

    const premiumHabitsPoints = dailyHabits.reduce((sum, h) => {
      return sum + Object.entries(h.premiumHabits || {}).reduce((habitSum, [habitId, completed]) => {
        if (completed && PREMIUM_HABITS[habitId as keyof typeof PREMIUM_HABITS]) {
          return habitSum + PREMIUM_HABITS[habitId as keyof typeof PREMIUM_HABITS].points;
        }
        return habitSum;
      }, 0);
    }, 0);

    // Calcular rachas actuales y más largas
    const sortedHabitDates = dailyHabits
      .filter(h => h.completedCategories > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    const checkDate = new Date(today);

    // Calcular racha actual (usando categorías requeridas)
    for (let i = 0; i < 30; i++) { // Revisar últimos 30 días
      const dateString = getLocalDateString(checkDate);
      const dayHabit = dailyHabits.find(h => h.date === dateString);
      const requiredCount = getRequiredCategoryCount(checkDate);
      const hasCompleteDay = dayHabit && dayHabit.completedCategories >= requiredCount;

      if (hasCompleteDay) {
        if (i === 0 || currentStreak > 0) currentStreak++;
      } else if (i > 0) {
        break;
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calcular racha más larga
    for (let i = 0; i < sortedHabitDates.length; i++) {
      tempStreak = 1;
      const currentDate = new Date(sortedHabitDates[i].date);

      for (let j = i + 1; j < sortedHabitDates.length; j++) {
        const nextDate = new Date(sortedHabitDates[j].date);
        const diffDays = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === tempStreak) {
          tempStreak++;
        } else {
          break;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);
    }

    // Distribución por categorías
    const categoryStats = Object.entries(CATEGORIES).map(([key, config]) => {
      const categoryActivities = completedActivities.filter(a => a.category === key);
      const categoryHabits = dailyHabits.filter(h => h.categoryProgress[key as keyof typeof h.categoryProgress]);

      const activityPoints = categoryActivities.reduce((sum, a) => sum + a.points, 0);
      const habitPoints = categoryHabits.length * config.points;

      return {
        category: config.label,
        color: config.color,
        activities: categoryActivities.length,
        habits: categoryHabits.length,
        totalPoints: activityPoints + habitPoints,
        percentage: totalPoints > 0 ? ((activityPoints + habitPoints) / totalPoints) * 100 : 0,
      };
    });

    return {
      totalPoints,
      totalActivities: completedActivities.length,
      totalHabits: dailyHabits.reduce((sum, h) => sum + h.completedCategories, 0),
      totalBonusDays,
      totalActiveDays,
      currentStreak,
      longestStreak,
      categoryStats,
      averagePointsPerDay: totalActiveDays > 0 ? totalPoints / totalActiveDays : 0,
      totalPremiumHabitsCompleted,
      premiumHabitsPoints,
    };
  }, [activities, dailyHabits]);

  // Estadísticas de logros
  const achievements = useMemo(() => {
    const achievements = [];

    // Logros de rachas
    if (overallStats.currentStreak >= 3) {
      achievements.push({
        icon: Flame,
        title: `Racha de ${overallStats.currentStreak} días`,
        description: 'Mantén la consistencia',
        color: 'text-orange-500 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950/30',
        borderColor: 'border-orange-200 dark:border-orange-900/50',
      });
    }

    if (overallStats.longestStreak >= 7) {
      achievements.push({
        icon: Trophy,
        title: `Récord: ${overallStats.longestStreak} días seguidos`,
        description: '¡Increíble consistencia!',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
        borderColor: 'border-yellow-200 dark:border-yellow-900/50',
      });
    }

    // Logros de puntos
    if (overallStats.totalPoints >= 1000) {
      achievements.push({
        icon: Star,
        title: `${overallStats.totalPoints} puntos totales`,
        description: 'Milestone de productividad',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-950/30',
        borderColor: 'border-purple-200 dark:border-purple-900/50',
      });
    }

    // Logros de días bonus
    if (overallStats.totalBonusDays >= 5) {
      achievements.push({
        icon: Target,
        title: `${overallStats.totalBonusDays} días perfectos`,
        description: 'Maestro de hábitos',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-950/30',
        borderColor: 'border-green-200 dark:border-green-900/50',
      });
    }

    // Logros de premium habits
    if (overallStats.totalPremiumHabitsCompleted >= 3) {
      achievements.push({
        icon: Crown,
        title: `${overallStats.totalPremiumHabitsCompleted} hábitos premium`,
        description: `${overallStats.premiumHabitsPoints} puntos premium ganados`,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30',
        borderColor: 'border-yellow-300 dark:border-yellow-800/50',
      });
    }

    return achievements;
  }, [overallStats]);

  return (
    <div className="bg-background">
      <div className="container max-w-md mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Estadísticas
              </h1>
              <p className="text-sm text-muted-foreground">
                Analiza tu progreso y tendencias
              </p>
            </div>
          </div>
        </div>

        {/* Resumen general */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Puntos Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalPoints}</div>
              <div className="text-xs text-muted-foreground">
                ~{overallStats.averagePointsPerDay.toFixed(1)}/día
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Días Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalActiveDays}</div>
              <div className="text-xs text-muted-foreground">
                {overallStats.totalBonusDays} perfectos
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Racha Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {overallStats.currentStreak}
                {overallStats.currentStreak >= 3 && <Flame className="w-5 h-5 text-orange-500 dark:text-orange-400" />}
              </div>
              <div className="text-xs text-muted-foreground">
                Récord: {overallStats.longestStreak}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Actividades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalActivities}</div>
              <div className="text-xs text-muted-foreground">
                {overallStats.totalHabits} hábitos
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Premium Habits Summary */}
        {overallStats.totalPremiumHabitsCompleted > 0 && (
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-900/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                Hábitos Premium
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
                    {overallStats.totalPremiumHabitsCompleted}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Completados en total
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/30 dark:text-yellow-300 text-lg px-3 py-1">
                    +{overallStats.premiumHabitsPoints}pts
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    Puntos premium
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logros */}
        {achievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Logros Desbloqueados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${achievement.bgColor} ${achievement.borderColor}`}
                  >
                    <achievement.icon className={`w-5 h-5 ${achievement.color}`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{achievement.title}</p>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Distribución por categorías */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overallStats.categoryStats
                .sort((a, b) => b.totalPoints - a.totalPoints)
                .map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: `hsl(var(--${category.color}))` }}
                        />
                        <span className="text-sm font-medium">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{category.totalPoints}pts</div>
                        <div className="text-xs text-muted-foreground">
                          {category.activities}a + {category.habits}h
                        </div>
                      </div>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                    <div className="text-xs text-muted-foreground text-right">
                      {category.percentage.toFixed(1)}% del total
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Gráficos detallados por período */}
        <StatsOverview />

        {/* Información sobre el sistema de puntos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Sistema de Puntos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-2">Puntos por Categoría:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(CATEGORIES).map(([key, config]) => (
                    <div key={key} className="flex justify-between">
                      <span>{config.label}:</span>
                      <span className="font-medium">{config.points}pts</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-medium mb-2">Bonus Especiales:</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Día perfecto (todas las categorías):</span>
                    <Badge variant="outline">+{BONUS_POINTS.DAILY_COMPLETE}pts</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Racha de 3 días:</span>
                    <Badge variant="outline">+{BONUS_POINTS.STREAK_3_DAYS}pts</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Racha de 7 días:</span>
                    <Badge variant="outline">+{BONUS_POINTS.STREAK_7_DAYS}pts</Badge>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-medium mb-2 flex items-center gap-1">
                  <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  Hábitos Premium:
                </p>
                <div className="space-y-1 text-xs">
                  {Object.entries(PREMIUM_HABITS).map(([key, habit]) => (
                    <div key={key} className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <span>{habit.icon}</span>
                        <span>{habit.label}:</span>
                      </span>
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-300">
                        +{habit.points}pts
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Stats;