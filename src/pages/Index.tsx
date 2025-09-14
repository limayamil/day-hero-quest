import { useState, useEffect, useMemo } from 'react';
import { Activity, CategoryType, DailyStats, CATEGORIES } from '@/types/activity';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ActivityForm } from '@/components/ActivityForm';
import { ActivityCard } from '@/components/ActivityCard';
import { StatsCard } from '@/components/StatsCard';
import { MotivationalMessage } from '@/components/MotivationalMessage';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const Index = () => {
  const [activities, setActivities] = useLocalStorage<Activity[]>('daily-activities', []);
  const { toast } = useToast();

  const addActivity = (text: string, category: CategoryType) => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      text,
      category,
      timestamp: new Date(),
      points: CATEGORIES[category].points,
    };

    setActivities((prev) => [newActivity, ...prev]);
    
    toast({
      title: "¡Actividad agregada! ✨",
      description: `+${newActivity.points} puntos por ${CATEGORIES[category].label}`,
    });
  };

  // Obtener actividades del día actual
  const todayActivities = useMemo(() => {
    const today = new Date().toDateString();
    return activities.filter(activity => 
      new Date(activity.timestamp).toDateString() === today
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
        {/* Header con stats */}
        <div className="pt-4">
          <h1 className="text-2xl font-bold text-center mb-6 text-foreground">
            Mi Día Productivo
          </h1>
          <StatsCard stats={todayStats} />
        </div>

        {/* Mensaje motivacional */}
        <MotivationalMessage />

        {/* Formulario para agregar actividades */}
        <ActivityForm onAddActivity={addActivity} />

        {/* Lista de actividades del día */}
        <div className="space-y-4">
          {todayActivities.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Actividades de hoy
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
              {todayActivities.length === 0 ? (
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