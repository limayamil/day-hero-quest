import { useState, useMemo } from 'react';
import { Activity, DailyHabit, WeeklyStats, MonthlyStats, CATEGORIES, CategoryType, TOTAL_CATEGORIES, getLocalDateString, getWeekStart, getLocalMonthString, getRequiredCategoryCount } from '@/types/activity';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CalendarDays, TrendingUp, Star, Target, Award, Flame } from 'lucide-react';
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

    const monthActivities = activities.filter(activity => {
      const activityDate = new Date(activity.status === 'completed' ? activity.timestamp : activity.plannedDate || activity.timestamp);
      return activityDate >= monthStart && activityDate <= monthEnd && activity.status === 'completed';
    });

    const monthHabits = dailyHabits.filter(h => h.date.startsWith(currentMonth));

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

    // Datos para el gráfico semanal del mes
    const weeksInMonth: { week: string; points: number; }[] = [];
    const currentDate = new Date(monthStart);
    let weekNumber = 1;

    while (currentDate <= monthEnd) {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekPoints = activities
        .filter(a => {
          const activityDate = new Date(a.timestamp);
          return activityDate >= weekStart && activityDate <= weekEnd && a.status === 'completed';
        })
        .reduce((sum, a) => sum + a.points, 0) +
        dailyHabits
          .filter(h => {
            const habitDate = new Date(h.date);
            return habitDate >= weekStart && habitDate <= weekEnd;
          })
          .reduce((sum, h) => sum + h.totalPoints, 0);

      weeksInMonth.push({
        week: `Sem ${weekNumber}`,
        points: weekPoints,
      });

      currentDate.setDate(currentDate.getDate() + 7);
      weekNumber++;
    }

    return {
      totalPoints,
      totalActivities: monthActivities.length,
      completeDays,
      activeDays: Math.min(activeDays, monthEnd.getDate()),
      averagePointsPerDay: totalPoints / monthEnd.getDate(),
      categoryDistribution,
      weeksInMonth,
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
            <CardHeader>
              <CardTitle>Progreso Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyStats.weekData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Bar dataKey="totalPoints" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Progreso Semanal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyStats.weeksInMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Bar dataKey="points" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={monthlyStats.categoryDistribution}
                      dataKey="points"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label={({ category, points }) => `${category}: ${points}`}
                    >
                      {monthlyStats.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{monthlyStats.completeDays}</div>
                  <div className="text-sm text-muted-foreground">Días Perfectos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{monthlyStats.totalActivities}</div>
                  <div className="text-sm text-muted-foreground">Actividades</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{monthlyStats.activeDays}</div>
                  <div className="text-sm text-muted-foreground">Días Activos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};