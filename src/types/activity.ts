export type CategoryType = 'personal' | 'laburo' | 'freelance' | 'social' | 'otros';

export interface Activity {
  id: string;
  text: string;
  category: CategoryType;
  timestamp: Date;
  points: number;
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

export const MOTIVATIONAL_PHRASES = [
  "¡Cada pequeño paso cuenta! 🌟",
  "Estás construyendo buenos hábitos ✨",
  "¡Qué genial que registres tus actividades! 💪",
  "Tu progreso es inspirador 🚀",
  "¡Sigue así, lo estás haciendo increíble! 🎉",
  "Cada día es una nueva oportunidad 🌅",
  "Tu dedicación es admirable 💎",
  "¡Celebra cada logro, por pequeño que sea! 🎊",
];