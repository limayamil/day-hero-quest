import { useState, useEffect, useMemo } from 'react';
import { Activity, CategoryType, DailyStats, CATEGORIES } from '@/types/activity';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ActivityForm } from '@/components/ActivityForm';
import { ActivityCard } from '@/components/ActivityCard';
import { PlannedActivityCard } from '@/components/PlannedActivityCard';
import { StatsCard } from '@/components/StatsCard';
import { MotivationalMessage } from '@/components/MotivationalMessage';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const Index = () => {
  const [activities, setActivities] = useLocalStorage<Activity[]>('daily-activities', []);
  const { toast } = useToast();

  const addActivity = (text: string, category: CategoryType, plannedDate?: Date) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let status: 'completed' | 'planned' = 'completed';
    let timestamp = now;
    let actualPlannedDate = plannedDate || now;

    if (plannedDate) {
      const selectedDate = new Date(plannedDate);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        // Fecha futura - actividad planificada
        status = 'planned';
      } else if (selectedDate < today) {
        // Fecha pasada - actividad completada en el pasado
        status = 'completed';
        timestamp = plannedDate; // Usar la fecha pasada como timestamp
      } else {
        // Fecha de hoy - actividad completada hoy
        status = 'completed';
      }
    }

    const newActivity: Activity = {
      id: Date.now().toString(),
      text,
      category,
      timestamp,
      points: CATEGORIES[category].points,
      status,
      plannedDate: actualPlannedDate,
    };

    setActivities((prev) => [newActivity, ...prev]);

    if (status === 'completed') {
      const isFromPast = plannedDate && plannedDate < today;
      toast({
        title: isFromPast ? "¡Actividad del pasado registrada! 📝" : "¡Actividad completada! ✨",
        description: isFromPast
          ? `+${newActivity.points} puntos por ${CATEGORIES[category].label} del ${plannedDate?.toLocaleDateString('es-ES')}`
          : `+${newActivity.points} puntos por ${CATEGORIES[category].label}`,
      });
    } else {
      toast({
        title: "¡Actividad planificada! 📅",
        description: `${CATEGORIES[category].label} programada para ${plannedDate?.toLocaleDateString('es-ES')}`,
      });
    }
  };

  const completeActivity = (id: string) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === id
          ? { ...activity, status: 'completed' as const, timestamp: new Date() }
          : activity
      )
    );
    
    const activity = activities.find(a => a.id === id);
    if (activity) {
      toast({
        title: "¡Actividad completada! ✨",
        description: `+${activity.points} puntos por ${CATEGORIES[activity.category].label}`,
      });
    }
  };

  const cancelActivity = (id: string) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === id
          ? { ...activity, status: 'cancelled' as const }
          : activity
      )
    );
    
    toast({
      title: "Actividad cancelada",
      description: "No te preocupes, siempre puedes intentarlo otro día",
    });
  };

  // Obtener actividades del día actual
  const todayActivities = useMemo(() => {
    const today = new Date().toDateString();
    return activities.filter(activity => {
      const activityDate = activity.status === 'completed' 
        ? new Date(activity.timestamp).toDateString()
        : new Date(activity.plannedDate || activity.timestamp).toDateString();
      return activityDate === today && activity.status === 'completed';
    });
  }, [activities]);

  // Obtener actividades planeadas para hoy
  const todayPlannedActivities = useMemo(() => {
    const today = new Date().toDateString();
    return activities.filter(activity => 
      activity.status === 'planned' && 
      new Date(activity.plannedDate || activity.timestamp).toDateString() === today
    );
  }, [activities]);

  // Calcular estadísticas del día
  const todayStats: DailyStats = useMemo(() => {
    const totalActivities = todayActivities.length;
    const totalPoints = todayActivities.reduce((sum, activity) => sum + activity.points, 0);
    const categoriesUsed = Array.from(new Set(todayActivities.map(activity => activity.category)));
    
    return {
      totalActivities,
      totalPoints,
      categoriesUsed,
      date: new Date().toISOString().split('T')[0],
    };
  }, [todayActivities]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto p-4 space-y-6">
        {/* Header con stats y theme toggle */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              Mi Día Productivo
            </h1>
            <ThemeToggle />
          </div>
          <StatsCard stats={todayStats} />
        </div>

        {/* Mensaje motivacional */}
        <MotivationalMessage totalPoints={todayStats.totalPoints} />

        {/* Formulario para agregar actividades */}
        <ActivityForm onAddActivity={addActivity} />

        {/* Actividades planeadas para hoy */}
        {todayPlannedActivities.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">
                Actividades planeadas
              </h2>
              <span className="text-sm text-muted-foreground">
                ({todayPlannedActivities.length})
              </span>
            </div>
            <div className="space-y-3">
              {todayPlannedActivities.map((activity) => (
                <PlannedActivityCard 
                  key={activity.id} 
                  activity={activity}
                  onComplete={completeActivity}
                  onCancel={cancelActivity}
                />
              ))}
            </div>
            <Separator />
          </div>
        )}

        {/* Lista de actividades completadas del día */}
        <div className="space-y-4">
          {todayActivities.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Actividades completadas
                </h2>
                <span className="text-sm text-muted-foreground">
                  ({todayActivities.length})
                </span>
              </div>
              <Separator />
            </>
          )}
          
          <ScrollArea className="h-[400px] w-full">
            <div className="space-y-3 pr-4">
              {todayActivities.length === 0 && todayPlannedActivities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg mb-2">¡Empieza tu día! 🌟</p>
                  <p className="text-sm">
                    Agrega tu primera actividad para comenzar a ganar puntos
                  </p>
                </div>
              ) : (
                todayActivities.map((activity) => (
                  <ActivityCard 
                    key={activity.id} 
                    activity={activity}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default Index;