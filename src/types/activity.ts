export type CategoryType = 'personal' | 'laburo' | 'freelance' | 'social' | 'otros';

export type ActivityStatus = 'completed' | 'planned' | 'cancelled';

export interface Activity {
  id: string;
  text: string;
  category: CategoryType;
  timestamp: Date;
  points: number;
  status: ActivityStatus;
  plannedDate?: Date;
}

export interface DailyStats {
  totalActivities: number;
  totalPoints: number;
  categoriesUsed: CategoryType[];
  date: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: Date;
}

export const CATEGORIES = {
  personal: { label: 'Personal', color: 'category-personal', points: 10 },
  laburo: { label: 'Trabajo', color: 'category-laburo', points: 15 },
  freelance: { label: 'Freelance', color: 'category-freelance', points: 20 },
  social: { label: 'Social', color: 'category-social', points: 12 },
  otros: { label: 'Otros', color: 'category-otros', points: 8 },
} as const;

export const getContextualMessage = (): string => {
  const hour = new Date().getHours();
  const dayName = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
  
  // Mensajes según la hora del día
  if (hour >= 5 && hour < 12) {
    return `¡Buenos días! Es ${dayName}, perfecto para empezar con energía 🌅`;
  } else if (hour >= 12 && hour < 18) {
    return `¡Buenas tardes! ¿Cómo va tu ${dayName}? Sigue registrando tus logros 🌞`;
  } else if (hour >= 18 && hour < 22) {
    return `¡Buenas noches! Reflexiona sobre tu ${dayName}, cada paso cuenta 🌙`;
  } else {
    return `Es tarde, pero nunca es mal momento para reconocer tus logros de hoy 🌌`;
  }
};

export const ACHIEVEMENT_MESSAGES = [
  "¡Increíble! Estás en racha 🔥",
  "Tus hábitos están mejorando 📈",
  "¡Qué consistencia tan admirable! ⭐",
  "Cada actividad te acerca a tus metas 🎯",
  "Tu dedicación es inspiradora 💪",
  "¡Sigue así, vas por buen camino! 🚀",
];