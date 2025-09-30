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
import { Plus, Sparkles, CalendarDays, Clock, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

interface ActivityFormProps {
  onAddActivity: (text: string, category: CategoryType, plannedDate?: Date) => void;
  defaultDate?: Date;
  compact?: boolean;
}

type DateMode = 'today' | 'future' | 'past';

export function ActivityForm({ onAddActivity, defaultDate, compact = false }: ActivityFormProps) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<CategoryType>('personal');
  const [plannedDate, setPlannedDate] = useState<Date>(defaultDate);
  const [dateMode, setDateMode] = useState<DateMode>(
    defaultDate && defaultDate.toDateString() !== new Date().toDateString()
      ? (defaultDate > new Date() ? 'future' : 'past')
      : 'today'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddActivity(text.trim(), category, plannedDate || defaultDate);
      setText('');
      if (!defaultDate) {
        setPlannedDate(undefined);
        setDateMode('today');
      }
    }
  };

  const selectedCategory = CATEGORIES[category];
  const today = new Date();

  const getPromptText = () => {
    switch (dateMode) {
      case 'today':
        return '¿Qué hiciste hoy?';
      case 'future':
        return '¿Qué planeas hacer?';
      case 'past':
        return '¿Qué hiciste en el pasado?';
    }
  };

  const getPlaceholder = () => {
    switch (dateMode) {
      case 'today':
        return 'Describe tu actividad de hoy...';
      case 'future':
        return 'Planifica tu actividad...';
      case 'past':
        return 'Describe lo que hiciste...';
    }
  };

  const getButtonText = () => {
    if (dateMode === 'today') {
      return `Agregar Actividad (+${selectedCategory.points} pts)`;
    } else if (dateMode === 'future') {
      return 'Planificar Actividad';
    } else {
      return `Registrar Actividad Pasada (+${selectedCategory.points} pts)`;
    }
  };

  return (
    <Card className="p-6 shadow-medium gradient-card">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="activity" className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-success" />
            {getPromptText()}
          </Label>
          <Input
            id="activity"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={getPlaceholder()}
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

        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={dateMode === 'today' ? "default" : "outline"}
            onClick={() => {setDateMode('today'); setPlannedDate(undefined);}}
            className="flex-1"
          >
            <Clock className="h-4 w-4 mr-2" />
            Hoy
          </Button>
          <Button
            type="button"
            variant={dateMode === 'future' ? "default" : "outline"}
            onClick={() => setDateMode('future')}
            className="flex-1"
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Planificar
          </Button>
          <Button
            type="button"
            variant={dateMode === 'past' ? "default" : "outline"}
            onClick={() => setDateMode('past')}
            className="flex-1"
          >
            <History className="h-4 w-4 mr-2" />
            Pasado
          </Button>
        </div>

        {(dateMode === 'future' || dateMode === 'past') && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {dateMode === 'future' ? 'Fecha planificada' : 'Fecha de la actividad'}
            </Label>
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
                  disabled={(date) => {
                    const dateOnly = new Date(date);
                    dateOnly.setHours(0, 0, 0, 0);
                    const todayOnly = new Date(today);
                    todayOnly.setHours(0, 0, 0, 0);
                    return dateMode === 'future' ? dateOnly <= todayOnly : dateOnly >= todayOnly;
                  }}
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
            dateMode === 'future' && 'gradient-motivational'
          )}
          disabled={!text.trim() || ((dateMode === 'future' || dateMode === 'past') && !plannedDate)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {getButtonText()}
        </Button>
      </form>
    </Card>
  );
}