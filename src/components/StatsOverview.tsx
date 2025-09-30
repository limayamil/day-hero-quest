import { useState, useMemo } from 'react';
import { Activity, DailyHabit, WeeklyStats, MonthlyStats, CATEGORIES, CategoryType, TOTAL_CATEGORIES, PREMIUM_HABITS, getLocalDateString, getWeekStart, getLocalMonthString, getRequiredCategoryCount } from '@/types/activity';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Area, AreaChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CalendarDays, TrendingUp, Star, Target, Award, Flame, Crown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsOverviewProps {
  selectedPeriod?: 'day' | 'week' | 'month';
}

export const StatsOverview = ({ selectedPeriod = 'day' }: StatsOverviewProps) => {
  const [activities] = useLocalStorage<Activity[]>('daily-activities', []);
  const [dailyHabits] = useLocalStorage<DailyHabit[]>('daily-habits', []);
  const [activeTab, setActiveTab] = useState(selectedPeriod);

  const today = useMemo(() => new Date(), []);
  const currentWeekStart = useMemo(() => getWeekStart(today), [today]);
  const currentMonth = useMemo(() => getLocalMonthString(today), [today]);

  // Estadísticas diarias
  const dailyStats = useMemo(() => {
    const todayString = getLocalDateString(today);
    const todayActivities = activities.filter(activity => {
      const activityDate = activity.status === 'completed'
        ? getLocalDateString(new Date(activity.timestamp))
        : getLocalDateString(new Date(activity.plannedDate || activity.timestamp));
      return activityDate === todayString && activity.status === 'completed';
    });

    const todayHabits = dailyHabits.find(h => h.date === todayString);

    const activityPoints = todayActivities.reduce((sum, activity) => sum + activity.points, 0);
    const habitPoints = todayHabits?.totalPoints || 0;
    const totalPoints = activityPoints + habitPoints;

    const categoryBreakdown = Object.keys(CATEGORIES).map(category => {
      const categoryActivities = todayActivities.filter(a => a.category === category as CategoryType);
      const categoryActivityPoints = categoryActivities.reduce((sum, a) => sum + a.points, 0);
      const hasHabit = todayHabits?.categoryProgress[category as CategoryType] || false;
      const habitCategoryPoints = hasHabit ? CATEGORIES[category as CategoryType].points : 0;

      return {
        category: CATEGORIES[category as CategoryType].label,
        color: CATEGORIES[category as CategoryType].color,
        points: categoryActivityPoints + habitCategoryPoints,
        activities: categoryActivities.length,
        habitCompleted: hasHabit,
      };
    });

    return {
      totalPoints,
      totalActivities: todayActivities.length,
      habitCompletion: todayHabits?.completedCategories || 0,
      hasBonus: todayHabits?.bonusEarned || false,
      categoryBreakdown,
      completionPercentage: todayHabits ? (todayHabits.completedCategories / getRequiredCategoryCount(today)) * 100 : 0,
    };
  }, [activities, dailyHabits, today]);

  // Estadísticas semanales
  const weeklyStats = useMemo(() => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekDays: string[] = [];
    const currentDate = new Date(currentWeekStart);

    // Generar array de días de la semana
    for (let i = 0; i < 7; i++) {
      weekDays.push(getLocalDateString(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const weekData = weekDays.map(dateString => {
      const dayDate = new Date(dateString + 'T00:00:00'); // Convertir a fecha local
      const dayActivities = activities.filter(activity => {
        const activityDate = activity.status === 'completed'
          ? getLocalDateString(new Date(activity.timestamp))
          : getLocalDateString(new Date(activity.plannedDate || activity.timestamp));
        return activityDate === dateString && activity.status === 'completed';
      });

      const dayHabits = dailyHabits.find(h => h.date === dateString);
      const activityPoints = dayActivities.reduce((sum, activity) => sum + activity.points, 0);
      const habitPoints = dayHabits?.totalPoints || 0;
      const requiredCategories = getRequiredCategoryCount(dayDate);

      return {
        date: dateString,
        day: dayDate.toLocaleDateString('es-ES', { weekday: 'short' }),
        totalPoints: activityPoints + habitPoints,
        activities: dayActivities.length,
        habitCompletion: dayHabits?.completedCategories || 0,
        hasBonus: dayHabits?.bonusEarned || false,
        isComplete: (dayHabits?.completedCategories || 0) === requiredCategories,
      };
    });

    const totalPoints = weekData.reduce((sum, day) => sum + day.totalPoints, 0);
    const totalActivities = weekData.reduce((sum, day) => sum + day.activities, 0);
    const completeDays = weekData.filter(day => day.isComplete).length;
    const activeDays = weekData.filter(day => day.activities > 0 || day.habitCompletion > 0).length;

    return {
      totalPoints,
      totalActivities,
      completeDays,
      activeDays,
      averagePointsPerDay: totalPoints / 7,
      weekData,
      completionRate: (activeDays / 7) * 100,
    };
  }, [activities, dailyHabits, currentWeekStart]);

  // Estadísticas mensuales
  const monthlyStats = useMemo(() => {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const monthActivities = activities.filter(activity => {
      if (activity.status !== 'completed') return false;
      const activityDateString = getLocalDateString(new Date(activity.timestamp));
      const activityDate = new Date(activityDateString + 'T00:00:00');
      return activityDate >= monthStart && activityDate <= monthEnd;
    });

    const monthHabits = dailyHabits.filter(h => {
      const habitDate = new Date(h.date + 'T00:00:00');
      return habitDate >= monthStart && habitDate <= monthEnd;
    });

    const totalActivityPoints = monthActivities.reduce((sum, activity) => sum + activity.points, 0);
    const totalHabitPoints = monthHabits.reduce((sum, habit) => sum + habit.totalPoints, 0);
    const totalPoints = totalActivityPoints + totalHabitPoints;

    const completeDays = monthHabits.filter(h => {
      const habitDate = new Date(h.date + 'T00:00:00');
      const requiredCount = getRequiredCategoryCount(habitDate);
      return h.completedCategories === requiredCount;
    }).length;
    const activeDays = monthHabits.filter(h => h.completedCategories > 0).length +
      new Set(monthActivities.map(a => getLocalDateString(new Date(a.timestamp)))).size;

    const categoryDistribution = Object.keys(CATEGORIES).map(category => {
      const categoryActivities = monthActivities.filter(a => a.category === category as CategoryType);
      const categoryHabits = monthHabits.filter(h => h.categoryProgress[category as CategoryType]);

      const categoryActivityPoints = categoryActivities.reduce((sum, a) => sum + a.points, 0);
      const categoryHabitPoints = categoryHabits.length * CATEGORIES[category as CategoryType].points;

      return {
        category: CATEGORIES[category as CategoryType].label,
        points: categoryActivityPoints + categoryHabitPoints,
        count: categoryActivities.length + categoryHabits.length,
      };
    });

    // Datos para el gráfico diario del mes (línea)
    const daysInMonth: { day: number; date: string; points: number; activities: number; habits: number; premium: number; hasBonus: boolean }[] = [];
    const daysCount = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    for (let day = 1; day <= daysCount; day++) {
      const dayDate = new Date(today.getFullYear(), today.getMonth(), day);
      const dayString = getLocalDateString(dayDate);

      // Buscar directamente en todas las actividades con filtro explícito
      const dayActivities = activities.filter(a => {
        if (a.status !== 'completed') return false;
        const activityDateString = getLocalDateString(new Date(a.timestamp));
        return activityDateString === dayString;
      });

      const dayHabit = dailyHabits.find(h => h.date === dayString);

      const activityPoints = dayActivities.reduce((sum, a) => sum + a.points, 0);
      const habitPoints = dayHabit?.totalPoints || 0;

      // Calcular puntos premium del día
      const premiumPoints = dayHabit ? Object.entries(dayHabit.premiumHabits || {}).reduce((sum, [habitId, completed]) => {
        if (completed && PREMIUM_HABITS[habitId as keyof typeof PREMIUM_HABITS]) {
          return sum + PREMIUM_HABITS[habitId as keyof typeof PREMIUM_HABITS].points;
        }
        return sum;
      }, 0) : 0;

      daysInMonth.push({
        day,
        date: dayString,
        points: activityPoints + habitPoints,
        activities: activityPoints,
        habits: habitPoints - premiumPoints,
        premium: premiumPoints,
        hasBonus: dayHabit?.bonusEarned || false,
      });
    }

    // Datos para el gráfico semanal del mes (comparativa)
    const weeksInMonth: { week: string; weekNum: number; points: number; activeDays: number; perfectDays: number; premiumHabits: number; startDate: string; endDate: string; }[] = [];

    // Encontrar la primera semana que contiene días del mes
    const firstDayOfMonth = new Date(monthStart);
    let weekStart = getWeekStart(firstDayOfMonth);
    let weekNumber = 1;

    // Iterar por semanas hasta que pasemos el último día del mes
    while (weekStart <= monthEnd) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Solo procesar semanas que tengan al menos un día dentro del mes
      const weekStartInMonth = weekStart >= monthStart ? weekStart : monthStart;
      const weekEndInMonth = weekEnd <= monthEnd ? weekEnd : monthEnd;

      if (weekStartInMonth <= weekEndInMonth) {
        const weekActivities = activities.filter(a => {
          if (a.status !== 'completed') return false;
          const activityDateString = getLocalDateString(new Date(a.timestamp));
          const activityDate = new Date(activityDateString + 'T00:00:00');
          return activityDate >= weekStartInMonth && activityDate <= weekEndInMonth;
        });

        const weekHabits = dailyHabits.filter(h => {
          const habitDate = new Date(h.date + 'T00:00:00');
          return habitDate >= weekStartInMonth && habitDate <= weekEndInMonth;
        });

        const weekPoints = weekActivities.reduce((sum, a) => sum + a.points, 0) +
          weekHabits.reduce((sum, h) => sum + h.totalPoints, 0);

        const activeDays = new Set([
          ...weekActivities.map(a => getLocalDateString(new Date(a.timestamp))),
          ...weekHabits.filter(h => h.completedCategories > 0).map(h => h.date)
        ]).size;

        const perfectDays = weekHabits.filter(h => {
          const habitDate = new Date(h.date + 'T00:00:00');
          const requiredCount = getRequiredCategoryCount(habitDate);
          return h.completedCategories >= requiredCount;
        }).length;

        const premiumHabitsCount = weekHabits.reduce((sum, h) => {
          return sum + Object.values(h.premiumHabits || {}).filter(Boolean).length;
        }, 0);

        weeksInMonth.push({
          week: `Sem ${weekNumber}`,
          weekNum: weekNumber,
          points: weekPoints,
          activeDays,
          perfectDays,
          premiumHabits: premiumHabitsCount,
          startDate: getLocalDateString(weekStartInMonth),
          endDate: getLocalDateString(weekEndInMonth),
        });

        weekNumber++;
      }

      // Avanzar a la siguiente semana
      weekStart = new Date(weekStart);
      weekStart.setDate(weekStart.getDate() + 7);
    }

    // Encontrar la mejor semana
    const bestWeek = weeksInMonth.reduce((best, current) =>
      current.points > best.points ? current : best
    , weeksInMonth[0] || { week: '', weekNum: 0, points: 0, activeDays: 0, perfectDays: 0, premiumHabits: 0 });

    return {
      totalPoints,
      totalActivities: monthActivities.length,
      completeDays,
      activeDays: Math.min(activeDays, monthEnd.getDate()),
      averagePointsPerDay: totalPoints / monthEnd.getDate(),
      categoryDistribution,
      weeksInMonth,
      daysInMonth,
      bestWeek,
      completionRate: (activeDays / monthEnd.getDate()) * 100,
    };
  }, [activities, dailyHabits, currentMonth, today]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="day" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Hoy
          </TabsTrigger>
          <TabsTrigger value="week" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Semana
          </TabsTrigger>
          <TabsTrigger value="month" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Mes
          </TabsTrigger>
        </TabsList>

        {/* Estadísticas Diarias */}
        <TabsContent value="day" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Puntos Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyStats.totalPoints}</div>
                <div className="flex items-center gap-2 mt-1">
                  {dailyStats.hasBonus && (
                    <Badge className="bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/30 dark:text-yellow-300">
                      <Star className="w-3 h-3 mr-1" />
                      Bonus
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Hábitos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyStats.habitCompletion}/5</div>
                <Progress
                  value={dailyStats.completionPercentage}
                  className="mt-2 h-2"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribución por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dailyStats.categoryBreakdown.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3 h-3 rounded-full", `bg-${category.color}`)} />
                      <span className="text-sm">{category.category}</span>
                      {category.habitCompleted && (
                        <Badge variant="secondary" size="sm">✓</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{category.points}pts</span>
                      {category.activities > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {category.activities} actividades
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estadísticas Semanales */}
        <TabsContent value="week" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Puntos de la Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyStats.totalPoints}</div>
                <div className="text-sm text-muted-foreground">
                  Promedio: {weeklyStats.averagePointsPerDay.toFixed(1)}/día
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Días Completos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyStats.completeDays}/7</div>
                <Progress
                  value={(weeklyStats.completeDays / 7) * 100}
                  className="mt-2 h-2"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Progreso Semanal</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ChartContainer
                config={{
                  totalPoints: { label: "Puntos", color: "hsl(var(--chart-1))" },
                }}
                className="h-[180px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyStats.weekData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      tickMargin={8}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      tickMargin={8}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={35}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="totalPoints"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-7 gap-2">
            {weeklyStats.weekData.map((day, index) => (
              <Card key={index} className={cn(
                "text-center p-2",
                day.hasBonus ? "bg-yellow-500/10 border-yellow-500/20 dark:bg-yellow-500/20 dark:border-yellow-500/30" :
                day.isComplete ? "bg-green-500/10 border-green-500/20 dark:bg-green-500/20 dark:border-green-500/30" :
                day.activities > 0 || day.habitCompletion > 0 ? "bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/20 dark:border-blue-500/30" : ""
              )}>
                <div className="text-xs font-medium">{day.day}</div>
                <div className="text-lg font-bold">{day.totalPoints}</div>
                <div className="flex justify-center">
                  {day.hasBonus && <Star className="w-3 h-3 text-yellow-500 dark:text-yellow-400" />}
                  {day.isComplete && !day.hasBonus && <Target className="w-3 h-3 text-green-500 dark:text-green-400" />}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Estadísticas Mensuales */}
        <TabsContent value="month" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Puntos del Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyStats.totalPoints}</div>
                <div className="text-sm text-muted-foreground">
                  Promedio: {monthlyStats.averagePointsPerDay.toFixed(1)}/día
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Actividad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyStats.completionRate.toFixed(1)}%</div>
                <Progress
                  value={monthlyStats.completionRate}
                  className="mt-2 h-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {monthlyStats.activeDays} días activos
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de línea de evolución diaria */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5" />
                Evolución Diaria del Mes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ChartContainer
                config={{
                  points: { label: "Puntos Totales", color: "hsl(var(--chart-1))" },
                  activities: { label: "Actividades", color: "hsl(var(--chart-2))" },
                  habits: { label: "Hábitos", color: "hsl(var(--chart-3))" },
                  premium: { label: "Premium", color: "hsl(var(--chart-4))" },
                }}
                className="h-[220px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyStats.daysInMonth} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                    <XAxis
                      dataKey="day"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      tickMargin={8}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      tickMargin={8}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={35}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="points"
                      stroke="hsl(var(--chart-1))"
                      fill="url(#colorPoints)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="premium"
                      stroke="hsl(var(--chart-4))"
                      fill="url(#colorPremium)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Comparativa de semanas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Comparativa Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthlyStats.weeksInMonth.map((week, index) => {
                  const isBestWeek = week.weekNum === monthlyStats.bestWeek.weekNum;
                  const prevWeek = index > 0 ? monthlyStats.weeksInMonth[index - 1] : null;
                  const trend = prevWeek ? (week.points > prevWeek.points ? 'up' : week.points < prevWeek.points ? 'down' : 'stable') : 'stable';

                  return (
                    <div
                      key={week.week}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all",
                        isBestWeek
                          ? "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-300 dark:border-yellow-800/50"
                          : "bg-muted/30 border-border"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{week.week}</h4>
                            {isBestWeek && (
                              <Badge className="bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/30 dark:text-yellow-300">
                                <Flame className="w-3 h-3 mr-1" />
                                Mejor
                              </Badge>
                            )}
                            {trend === 'up' && !isBestWeek && (
                              <ArrowUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                            )}
                            {trend === 'down' && (
                              <ArrowDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(week.startDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {new Date(week.endDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{week.points}</div>
                          <div className="text-xs text-muted-foreground">puntos</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center text-sm">
                        <div>
                          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">{week.activeDays}</div>
                          <div className="text-xs text-muted-foreground">Días activos</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-green-600 dark:text-green-400">{week.perfectDays}</div>
                          <div className="text-xs text-muted-foreground">Días perfectos</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 flex items-center justify-center gap-1">
                            {week.premiumHabits > 0 && <Crown className="w-4 h-4" />}
                            {week.premiumHabits}
                          </div>
                          <div className="text-xs text-muted-foreground">Premium</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Distribución por Categoría</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-2">
                <ChartContainer
                  config={{
                    points: { label: "Puntos", color: "hsl(var(--chart-1))" },
                  }}
                  className="h-[200px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={monthlyStats.categoryDistribution}
                        dataKey="points"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        fill="hsl(var(--chart-1))"
                        label={({ category, points }) => `${category}: ${points}`}
                        labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                      >
                        {monthlyStats.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumen Mensual</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{monthlyStats.completeDays}</div>
                    <div className="text-sm text-muted-foreground">Días Perfectos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{monthlyStats.totalActivities}</div>
                    <div className="text-sm text-muted-foreground">Actividades</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{monthlyStats.activeDays}</div>
                    <div className="text-sm text-muted-foreground">Días Activos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};