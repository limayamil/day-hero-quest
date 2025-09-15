import { useState } from 'react';
import { CalendarView } from '@/components/CalendarView';
import { HabitTracker } from '@/components/HabitTracker';
import { ActivityForm } from '@/components/ActivityForm';
import { Activity, CategoryType, CATEGORIES } from '@/types/activity';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Plus, TrendingUp, Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getDateString, getLocalDateString } from '@/types/activity';

const CalendarPage = () => {
  const [activities, setActivities] = useLocalStorage<Activity[]>('daily-activities', []);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddActivity, setShowAddActivity] = useState(false);
  const { toast } = useToast();

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowAddActivity(false);
  };

  const handleAddActivity = (text: string, category: CategoryType, plannedDate?: Date) => {
    const now = new Date();
    const targetDate = plannedDate || selectedDate;

    const newActivity: Activity = {
      id: Date.now().toString(),
      text,
      category,
      timestamp: targetDate < now ? targetDate : now,
      points: CATEGORIES[category].points,
      status: getLocalDateString(targetDate) === getLocalDateString(now) ? 'completed' :
              targetDate > now ? 'planned' : 'completed',
      plannedDate: targetDate,
    };

    setActivities((prev) => [newActivity, ...prev]);

    toast({
      title: targetDate > now ? "¡Actividad planificada! 📅" : "¡Actividad agregada! ✨",
      description: `${CATEGORIES[category].label} para ${format(targetDate, 'dd/MM/yyyy', { locale: es })}`,
    });

    setShowAddActivity(false);
  };

  const isToday = getLocalDateString(selectedDate) === getLocalDateString(new Date());
  const selectedDateString = getLocalDateString(selectedDate);

  // Actividades del día seleccionado
  const selectedDayActivities = activities.filter(activity => {
    const activityDate = activity.status === 'completed'
      ? getLocalDateString(new Date(activity.timestamp))
      : getLocalDateString(new Date(activity.plannedDate || activity.timestamp));
    return activityDate === selectedDateString && activity.status === 'completed';
  });

  return (
    <div className="bg-background">
      <div className="container max-w-md mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <CalendarDays className="w-6 h-6" />
                Calendario
              </h1>
              <p className="text-sm text-muted-foreground">
                Revisa tu progreso y planifica actividades
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setShowAddActivity(!showAddActivity)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isToday ? 'Agregar' : 'Planificar'}
            </Button>
          </div>
        </div>

        {/* Vista de calendario */}
        <CalendarView
          onDateSelect={handleDateSelect}
          selectedDate={selectedDate}
        />

        {/* Formulario para agregar actividad */}
        {showAddActivity && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isToday ? 'Agregar Actividad' : `Planificar para ${format(selectedDate, 'EEEE, d MMMM', { locale: es })}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityForm
                onAddActivity={handleAddActivity}
                defaultDate={selectedDate}
                compact
              />
            </CardContent>
          </Card>
        )}

        {/* Detalles del día seleccionado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>
                {isToday ? 'Hoy' : format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}
              </span>
              <Badge variant={isToday ? "default" : "secondary"}>
                {selectedDayActivities.length} actividades
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tracker de hábitos para el día seleccionado */}
            <div>
              <h3 className="font-medium mb-3">Hábitos del Día</h3>
              <HabitTracker selectedDate={selectedDate} />
            </div>

            <Separator />

            {/* Actividades del día */}
            <div>
              <h3 className="font-medium mb-3 flex items-center justify-between">
                <span>Actividades Registradas</span>
                {selectedDayActivities.length > 0 && (
                  <Badge variant="outline">
                    {selectedDayActivities.reduce((sum, a) => sum + a.points, 0)} pts
                  </Badge>
                )}
              </h3>

              {selectedDayActivities.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedDayActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className={`text-${CATEGORIES[activity.category].color}`}
                          >
                            {CATEGORIES[activity.category].label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-primary/10 text-primary">
                          +{activity.points}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No hay actividades registradas</p>
                  {isToday ? (
                    <p className="text-xs">¡Agrega tu primera actividad del día!</p>
                  ) : (
                    <p className="text-xs">
                      {selectedDate > new Date() ? 'Planifica actividades para este día' : 'Este día no tuvo actividades'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tips de navegación */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-200 border border-yellow-400 rounded"></div>
                <span>Toca un día para ver detalles y planificar</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-3 h-3 text-yellow-500" />
                <span>Días perfectos (todas las categorías completas)</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-blue-500" />
                <span>Ve a Estadísticas para análisis detallados</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarPage;