import { useState } from 'react';
import { HabitTracker } from '@/components/HabitTracker';
import { MotivationalMessage } from '@/components/MotivationalMessage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Target, TrendingUp } from 'lucide-react';
import { getDateString } from '@/types/activity';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Habits = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isToday = getDateString(selectedDate) === getDateString(new Date());

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setShowDatePicker(false);
    }
  };

  return (
    <div className="bg-background">
      <div className="container max-w-md mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Tracker de Hábitos
              </h1>
              <p className="text-sm text-muted-foreground">
                {isToday ? 'Completa tus hábitos diarios' : `Revisando ${format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}`}
              </p>
            </div>

            {/* Selector de fecha */}
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    !isToday && "border-primary text-primary"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {isToday ? 'Hoy' : format(selectedDate, 'dd/MM', { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Mensaje motivacional solo para el día actual */}
        {isToday && (
          <MotivationalMessage totalPoints={0} />
        )}

        {/* Tracker de hábitos principal */}
        <HabitTracker selectedDate={selectedDate} />

        {/* Información adicional */}
        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-5 h-5" />
                ¿Cómo funciona?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Completa una actividad de cada categoría todos los días</p>
              <p>• Al completar las 6 categorías ganas <strong>50 puntos bonus</strong></p>
              <p>• Los hábitos se <strong>auto-completan</strong> cuando registras actividades</p>
              <p>• También puedes marcarlos manualmente si no registraste una actividad</p>
              <p>• Revisa días anteriores para ver tu progreso</p>
            </CardContent>
          </Card>

          {isToday && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Consejos para el Éxito
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• <strong>Consistencia</strong>: Mejor poco todos los días que mucho de vez en cuando</p>
                <p>• <strong>Flexibilidad</strong>: Si no puedes completar una categoría, no te preocupes</p>
                <p>• <strong>Celebra</strong>: Reconoce cada pequeño logro</p>
                <p>• <strong>Planifica</strong>: Usa el calendario para ver patrones</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Habits;