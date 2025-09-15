export type CategoryType = 'personal' | 'laburo' | 'freelance' | 'social' | 'salud' | 'otros';

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

// Sistema de Hábitos
export interface DailyHabit {
  date: string; // YYYY-MM-DD
  categoryProgress: Record<CategoryType, boolean>;
  bonusEarned: boolean;
  totalPoints: number;
  completedCategories: number;
}

export interface HabitStreak {
  category: CategoryType;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
}

// Estadísticas Extendidas
export interface WeeklyStats {
  startDate: string; // YYYY-MM-DD (Monday)
  endDate: string; // YYYY-MM-DD (Sunday)
  totalPoints: number;
  totalActivities: number;
  completeDays: number; // días con al menos 1 actividad
  bonusDays: number; // días con todas las categorías completas
  categoryBreakdown: Record<CategoryType, number>; // puntos por categoría
  averageActivitiesPerDay: number;
  bestDay: {
    date: string;
    points: number;
    activities: number;
  };
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  totalPoints: number;
  totalActivities: number;
  completeDays: number;
  bonusDays: number;
  totalBonusPoints: number;
  categoryDistribution: Record<CategoryType, number>;
  weeklyBreakdown: WeeklyStats[];
  bestWeek: WeeklyStats;
  averagePointsPerDay: number;
  streakData: HabitStreak[];
  completionRate: number; // porcentaje de días con al menos 1 actividad
}

export const CATEGORIES = {
  personal: { label: 'Personal', color: 'category-personal', points: 10 },
  laburo: { label: 'Trabajo', color: 'category-laburo', points: 15 },
  freelance: { label: 'Freelance', color: 'category-freelance', points: 12 },
  social: { label: 'Social', color: 'category-social', points: 20 },
  salud: { label: 'Salud', color: 'category-salud', points: 20 },
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

// Sistema de Puntos Bonus
export const BONUS_POINTS = {
  DAILY_COMPLETE: 50,    // Por completar todas las 6 categorías en un día
  WEEKLY_COMPLETE: 100,  // Por tener 5+ días completos en la semana
  MONTHLY_COMPLETE: 500, // Por tener 20+ días completos en el mes
  STREAK_3_DAYS: 25,     // Bonus por racha de 3 días
  STREAK_7_DAYS: 75,     // Bonus por racha de 7 días
  STREAK_30_DAYS: 300,   // Bonus por racha de 30 días
} as const;

// Número total de categorías para el cálculo de bonus
export const TOTAL_CATEGORIES = 6;

// Mensajes específicos para hábitos
export const HABIT_MESSAGES = {
  DAILY_COMPLETE: "🎉 ¡Día perfecto! Completaste todas las categorías",
  BONUS_EARNED: "⭐ ¡Bonus ganado! +{points} puntos extra",
  STREAK_MILESTONE: "🔥 ¡{days} días seguidos! Estás imparable",
  FIRST_HABIT: "✨ ¡Primer hábito del día! Buen comienzo",
  CATEGORY_COMPLETE: "✅ {category} completada por hoy",
} as const;

// Utilidades para fechas
export const getDateString = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunes como primer día
  return new Date(d.setDate(diff));
};

export const getMonthString = (date: Date = new Date()): string => {
  return date.toISOString().slice(0, 7); // YYYY-MM
};

// Weekend detection utilities
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday (0) or Saturday (6)
};

// Get required categories for a specific date (accounting for weekend wildcards)
export const getRequiredCategoriesForDate = (date: Date): CategoryType[] => {
  const allCategories = Object.keys(CATEGORIES) as CategoryType[];

  if (isWeekend(date)) {
    // On weekends, exclude 'laburo' and 'otros' from required categories
    return allCategories.filter(cat => cat !== 'laburo' && cat !== 'otros');
  }

  return allCategories; // All categories required on weekdays
};

// Get total required categories count for a date
export const getRequiredCategoryCount = (date: Date): number => {
  return getRequiredCategoriesForDate(date).length;
};