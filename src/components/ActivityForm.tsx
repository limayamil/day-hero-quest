import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryType, CATEGORIES } from '@/types/activity';
import { Plus, Sparkles, CalendarDays, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

interface ActivityFormProps {
  onAddActivity: (text: string, category: CategoryType, plannedDate?: Date) => void;
}

export function ActivityForm({ onAddActivity }: ActivityFormProps) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<CategoryType>('personal');
  const [plannedDate, setPlannedDate] = useState<Date>();
  const [isPlanning, setIsPlanning] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddActivity(text.trim(), category, plannedDate);
      setText('');
      setPlannedDate(undefined);
      setIsPlanning(false);
    }
  };

  const selectedCategory = CATEGORIES[category];
  const today = new Date();
  const isToday = plannedDate ? 
    plannedDate.toDateString() === today.toDateString() : true;

  return (
    <Card className="p-6 shadow-medium gradient-card">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="activity" className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-success" />
            {isPlanning ? '¿Qué planeas hacer?' : '¿Qué hiciste hoy?'}
          </Label>
          <Input
            id="activity"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isPlanning ? "Planifica tu actividad..." : "Describe tu actividad..."}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">
            Categoría
          </Label>
          <Select value={category} onValueChange={(value) => setCategory(value as CategoryType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <SelectItem 
                  key={key} 
                  value={key}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `hsl(var(--${cat.color}))` }}
                    />
                    {cat.label} (+{cat.points} pts)
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button 
            type="button"
            variant={!isPlanning ? "default" : "outline"}
            onClick={() => {setIsPlanning(false); setPlannedDate(undefined);}}
            className="flex-1"
          >
            <Clock className="h-4 w-4 mr-2" />
            Ahora
          </Button>
          <Button 
            type="button"
            variant={isPlanning ? "default" : "outline"}
            onClick={() => setIsPlanning(true)}
            className="flex-1"
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Planificar
          </Button>
        </div>

        {isPlanning && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fecha planificada</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !plannedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {plannedDate ? format(plannedDate, "PPP", { locale: es }) : "Selecciona fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={plannedDate}
                  onSelect={setPlannedDate}
                  disabled={(date) => date < today}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <Button 
          type="submit" 
          className={cn(
            'w-full font-medium gradient-primary hover:opacity-90 transition-all',
            !isToday && 'gradient-motivational'
          )}
          disabled={!text.trim() || (isPlanning && !plannedDate)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isToday ? `Agregar Actividad (+${selectedCategory.points} pts)` : 'Planificar Actividad'}
        </Button>
      </form>
    </Card>
  );
}