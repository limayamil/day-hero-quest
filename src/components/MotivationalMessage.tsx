import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { getContextualMessage, ACHIEVEMENT_MESSAGES } from '@/types/activity';
import { Heart, Sparkles } from 'lucide-react';

interface MotivationalMessageProps {
  totalPoints?: number;
}

export function MotivationalMessage({ totalPoints = 0 }: MotivationalMessageProps) {
  const [currentPhrase, setCurrentPhrase] = useState('');

  useEffect(() => {
    const getPhrase = () => {
      // Si hay puntos, mostrar mensajes de logro ocasionalmente
      if (totalPoints > 0 && Math.random() > 0.7) {
        const randomIndex = Math.floor(Math.random() * ACHIEVEMENT_MESSAGES.length);
        return ACHIEVEMENT_MESSAGES[randomIndex];
      }
      // Sino, mensaje contextual del día
      return getContextualMessage();
    };

    setCurrentPhrase(getPhrase());

    // Cambiar frase cada 15 segundos
    const interval = setInterval(() => {
      setCurrentPhrase(getPhrase());
    }, 15000);

    return () => clearInterval(interval);
  }, [totalPoints]);

  return (
    <Card className="p-4 bg-gradient-to-r from-success/10 to-info/10 border-success/20 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="relative">
            <Heart className="h-6 w-6 text-success fill-current animate-pulse" />
            <Sparkles className="h-3 w-3 text-warning absolute -top-1 -right-1 animate-bounce-gentle" />
          </div>
        </div>
        <p className="text-sm font-medium text-success leading-relaxed">
          {currentPhrase}
        </p>
      </div>
    </Card>
  );
}