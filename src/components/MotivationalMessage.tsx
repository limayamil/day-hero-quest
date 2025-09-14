import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { MOTIVATIONAL_PHRASES } from '@/types/activity';
import { Heart, Sparkles } from 'lucide-react';

export function MotivationalMessage() {
  const [currentPhrase, setCurrentPhrase] = useState('');

  useEffect(() => {
    const getRandomPhrase = () => {
      const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length);
      return MOTIVATIONAL_PHRASES[randomIndex];
    };

    setCurrentPhrase(getRandomPhrase());

    // Cambiar frase cada 10 segundos
    const interval = setInterval(() => {
      setCurrentPhrase(getRandomPhrase());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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