import { useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { DailyHabit, BONUS_POINTS, getDateString, getRequiredCategoryCount } from '@/types/activity';

interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalBonusDays: number;
  weeklyBonusEarned: boolean;
  monthlyBonusEarned: boolean;
  nextMilestone: {
    type: 'streak' | 'weekly' | 'monthly';
    target: number;
    current: number;
    bonus: number;
  } | null;
}

export const useHabitStats = (): HabitStats => {
  const [dailyHabits] = useLocalStorage<DailyHabit[]>('daily-habits', []);

  return useMemo(() => {
    const today = new Date();
    const sortedHabits = dailyHabits
      .filter(h => h.completedCategories > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calcular racha actual
    let currentStreak = 0;
    const todayString = getDateString(today);
    let checkDate = new Date(today);

    // Verificar si hoy cuenta para la racha (completó las categorías requeridas para hoy)
    const todayHabit = dailyHabits.find(h => h.date === todayString);
    const todayRequiredCount = getRequiredCategoryCount(today);
    if (todayHabit && todayHabit.completedCategories >= todayRequiredCount) {
      currentStreak = 1;
      const newCheckDate = new Date(checkDate);
      newCheckDate.setDate(newCheckDate.getDate() - 1);
      checkDate = newCheckDate;
    }

    // Contar días consecutivos hacia atrás
    for (let i = 0; i < 100; i++) { // Máximo 100 días hacia atrás
      const dateString = getDateString(checkDate);
      const habit = dailyHabits.find(h => h.date === dateString);
      const dayRequiredCount = getRequiredCategoryCount(checkDate);

      if (habit && habit.completedCategories >= dayRequiredCount) {
        if (currentStreak > 0 || i === 0) currentStreak++;
      } else if (i > 0 || currentStreak === 0) {
        break;
      }

      const newDate = new Date(checkDate);
      newDate.setDate(newDate.getDate() - 1);
      checkDate = newDate;
    }

    // Calcular racha más larga (considerando requisitos de fin de semana)
    let longestStreak = 0;
    let tempStreak = 0;
    const validHabits = dailyHabits.filter(h => {
      const habitDate = new Date(h.date);
      const requiredCount = getRequiredCategoryCount(habitDate);
      return h.completedCategories >= requiredCount;
    });
    const allDates = validHabits.map(h => h.date).sort();

    for (let i = 0; i < allDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(allDates[i - 1]);
        const currDate = new Date(allDates[i]);
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Contar días bonus totales
    const totalBonusDays = dailyHabits.filter(h => h.bonusEarned).length;

    // Verificar bonus semanal (5+ días completos esta semana)
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekBonusDays = dailyHabits.filter(h => {
      const habitDate = new Date(h.date);
      return habitDate >= startOfWeek && habitDate <= today && h.bonusEarned;
    }).length;

    const weeklyBonusEarned = thisWeekBonusDays >= 5;

    // Verificar bonus mensual (20+ días completos este mes)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthBonusDays = dailyHabits.filter(h => {
      const habitDate = new Date(h.date);
      return habitDate >= startOfMonth && habitDate <= today && h.bonusEarned;
    }).length;

    const monthlyBonusEarned = thisMonthBonusDays >= 20;

    // Determinar próximo milestone
    let nextMilestone: HabitStats['nextMilestone'] = null;

    if (currentStreak < 3) {
      nextMilestone = {
        type: 'streak',
        target: 3,
        current: currentStreak,
        bonus: BONUS_POINTS.STREAK_3_DAYS,
      };
    } else if (currentStreak < 7) {
      nextMilestone = {
        type: 'streak',
        target: 7,
        current: currentStreak,
        bonus: BONUS_POINTS.STREAK_7_DAYS,
      };
    } else if (currentStreak < 30) {
      nextMilestone = {
        type: 'streak',
        target: 30,
        current: currentStreak,
        bonus: BONUS_POINTS.STREAK_30_DAYS,
      };
    } else if (!weeklyBonusEarned) {
      nextMilestone = {
        type: 'weekly',
        target: 5,
        current: thisWeekBonusDays,
        bonus: BONUS_POINTS.WEEKLY_COMPLETE,
      };
    } else if (!monthlyBonusEarned) {
      nextMilestone = {
        type: 'monthly',
        target: 20,
        current: thisMonthBonusDays,
        bonus: BONUS_POINTS.MONTHLY_COMPLETE,
      };
    }

    return {
      currentStreak,
      longestStreak,
      totalBonusDays,
      weeklyBonusEarned,
      monthlyBonusEarned,
      nextMilestone,
    };
  }, [dailyHabits]);
};