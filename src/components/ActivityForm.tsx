import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryType, CATEGORIES } from '@/types/activity';
import { Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityFormProps {
  onAddActivity: (text: string, category: CategoryType) => void;
}

export function ActivityForm({ onAddActivity }: ActivityFormProps) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<CategoryType>('personal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddActivity(text.trim(), category);
      setText('');
    }
  };

  const selectedCategory = CATEGORIES[category];

  return (
    <Card className="p-6 shadow-medium gradient-card">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="activity" className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-success" />
            ¿Qué hiciste hoy?
          </Label>
          <Input
            id="activity"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe tu actividad..."
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

        <Button 
          type="submit" 
          className={cn(
            'w-full font-medium gradient-primary hover:opacity-90 transition-all',
            'animate-pulse-success'
          )}
          disabled={!text.trim()}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Actividad (+{selectedCategory.points} pts)
        </Button>
      </form>
    </Card>
  );
}