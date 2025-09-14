import { useState, useMemo } from 'react';
import { Activity, DailyHabit, CATEGORIES, TOTAL_CATEGORIES, getDateString } from '@/types/activity';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Star, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

interface DayData {
  date: Date;
  activities: Activity[];
  habits: DailyHabit | null;
  isToday: boolean;
  isSelected: boolean;
  totalPoints: number;
  hasBonus: boolean;
  completionLevel: 'empty' | 'partial' | 'complete' | 'bonus';
}

export const CalendarView = ({ onDateSelect, selectedDate }: CalendarViewProps) => {
  const [activities] = useLocalStorage<Activity[]>('daily-activities', []);
  const [dailyHabits] = useLocalStorage<DailyHabit[]>('daily-habits', []);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDayDetail, setSelectedDayDetail] = useState<DayData | null>(null);

  const today = new Date();
  const todayString = getDateString(today);

  // Obtener días del mes actual
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Primer día del mes y último día del mes
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Días del mes anterior para completar la primera semana
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    // Ajustar para que lunes sea 0
    const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - adjustedDayOfWeek);

    // Generar array de días
    const days: DayData[] = [];
    const currentDate = new Date(startDate);

    // Generar 42 días (6 semanas)
    for (let i = 0; i < 42; i++) {
      const dateString = getDateString(currentDate);

      // Filtrar actividades del día
      const dayActivities = activities.filter(activity => {
        const activityDate = activity.status === 'completed'
          ? new Date(activity.timestamp).toDateString()
          : new Date(activity.plannedDate || activity.timestamp).toDateString();
        return activityDate === currentDate.toDateString() && activity.status === 'completed';
      });

      // Obtener hábitos del día
      const dayHabits = dailyHabits.find(h => h.date === dateString) || null;

      // Calcular puntos totales
      const activityPoints = dayActivities.reduce((sum, activity) => sum + activity.points, 0);
      const habitPoints = dayHabits?.totalPoints || 0;
      const totalPoints = activityPoints + habitPoints;

      // Determinar nivel de completitud
      let completionLevel: DayData['completionLevel'] = 'empty';
      const hasActivities = dayActivities.length > 0;
      const hasHabits = dayHabits && dayHabits.completedCategories > 0;
      const hasBonus = dayHabits?.bonusEarned || false;

      if (hasBonus) {
        completionLevel = 'bonus';
      } else if (hasActivities || (hasHabits && dayHabits.completedCategories === TOTAL_CATEGORIES)) {
        completionLevel = 'complete';
      } else if (hasActivities || hasHabits) {
        completionLevel = 'partial';
      }

      days.push({
        date: new Date(currentDate),
        activities: dayActivities,
        habits: dayHabits,
        isToday: dateString === todayString,
        isSelected: selectedDate ? getDateString(selectedDate) === dateString : false,
        totalPoints,
        hasBonus,
        completionLevel,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [currentMonth, activities, dailyHabits, todayString, selectedDate]);

  // Navegación de meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newMonth;
    });
  };

  // Seleccionar día
  const selectDay = (dayData: DayData) => {
    if (onDateSelect) {
      onDateSelect(dayData.date);
    }
    setSelectedDayDetail(dayData);
  };

  // Estilo para cada día
  const getDayStyles = (dayData: DayData) => {
    const isCurrentMonth = dayData.date.getMonth() === currentMonth.getMonth();

    let baseClasses = "aspect-square flex flex-col items-center justify-center p-2 rounded-lg text-sm font-medium transition-all cursor-pointer ";

    // Opacidad para días de otros meses
    if (!isCurrentMonth) {
      baseClasses += "opacity-30 ";
    }

    // Estilo según completitud
    switch (dayData.completionLevel) {
      case 'bonus':
        baseClasses += "bg-gradient-to-br from-yellow-500/20 to-yellow-400/30 dark:from-yellow-500/30 dark:to-yellow-400/40 border-2 border-yellow-500/50 dark:border-yellow-400/60 text-yellow-700 dark:text-yellow-300 ";
        break;
      case 'complete':
        baseClasses += "bg-green-500/20 dark:bg-green-500/30 border-2 border-green-500/50 dark:border-green-400/60 text-green-700 dark:text-green-300 ";
        break;
      case 'partial':
        baseClasses += "bg-blue-500/20 dark:bg-blue-500/30 border-2 border-blue-500/40 dark:border-blue-400/50 text-blue-700 dark:text-blue-300 ";
        break;
      default:
        baseClasses += "hover:bg-muted/50 border-2 border-transparent ";
    }

    // Día actual
    if (dayData.isToday) {
      baseClasses += "ring-2 ring-primary ring-offset-2 ";
    }

    // Día seleccionado
    if (dayData.isSelected) {
      baseClasses += "ring-2 ring-accent ring-offset-2 ";
    }

    return baseClasses;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Encabezados de días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
              <div key={index} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Grid del calendario */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dayData, index) => (
              <div
                key={index}
                className={getDayStyles(dayData)}
                onClick={() => selectDay(dayData)}
              >
                <span className="text-base font-semibold">
                  {dayData.date.getDate()}
                </span>

                {/* Indicadores */}
                <div className="flex items-center justify-center gap-1 mt-1">
                  {dayData.hasBonus && (
                    <Star className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                  )}
                  {dayData.habits && dayData.habits.completedCategories === TOTAL_CATEGORIES && !dayData.hasBonus && (
                    <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                  )}
                  {dayData.activities.length > 0 && (
                    <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full" />
                  )}
                </div>

                {/* Puntos totales */}
                {dayData.totalPoints > 0 && (
                  <span className="text-xs mt-1 opacity-75">
                    {dayData.totalPoints}pts
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leyenda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500/20 dark:bg-yellow-500/30 border-2 border-yellow-500/50 dark:border-yellow-400/60 rounded"></div>
              <span>Día perfecto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500/20 dark:bg-green-500/30 border-2 border-green-500/50 dark:border-green-400/60 rounded"></div>
              <span>Completo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500/20 dark:bg-blue-500/30 border-2 border-blue-500/40 dark:border-blue-400/50 rounded"></div>
              <span>Parcial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-muted-foreground/30 rounded"></div>
              <span>Sin actividad</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalle del día */}
      <Dialog open={!!selectedDayDetail} onOpenChange={() => setSelectedDayDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDayDetail?.date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </DialogTitle>
          </DialogHeader>

          {selectedDayDetail && (
            <div className="space-y-4">
              {/* Resumen del día */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Puntos totales</p>
                  <p className="text-xl font-bold">{selectedDayDetail.totalPoints}</p>
                </div>
                {selectedDayDetail.hasBonus && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900">
                    <Star className="w-4 h-4 mr-1" />
                    Día Perfecto
                  </Badge>
                )}
              </div>

              {/* Actividades */}
              {selectedDayDetail.activities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Actividades ({selectedDayDetail.activities.length})</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedDayDetail.activities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between text-sm">
                        <span className="truncate">{activity.text}</span>
                        <Badge variant="secondary" className={`text-${CATEGORIES[activity.category].color}`}>
                          +{activity.points}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hábitos */}
              {selectedDayDetail.habits && (
                <div className="space-y-2">
                  <h4 className="font-semibold">
                    Hábitos ({selectedDayDetail.habits.completedCategories}/5)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {(Object.entries(CATEGORIES) as Array<[keyof typeof CATEGORIES, typeof CATEGORIES[keyof typeof CATEGORIES]]>).map(([category, config]) => (
                      <div key={category} className="flex items-center gap-2">
                        {selectedDayDetail.habits!.categoryProgress[category] ? (
                          <CheckCircle2 className={`w-4 h-4 text-${config.color}`} />
                        ) : (
                          <div className="w-4 h-4 border border-muted-foreground rounded-full" />
                        )}
                        <span className={selectedDayDetail.habits!.categoryProgress[category] ? 'text-foreground' : 'text-muted-foreground'}>
                          {config.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensaje si no hay datos */}
              {selectedDayDetail.activities.length === 0 && !selectedDayDetail.habits && (
                <p className="text-center text-muted-foreground py-4">
                  No hay actividades registradas para este día
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};