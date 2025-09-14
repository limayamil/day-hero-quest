# Design System - Day Hero Quest

## 🎨 Filosofía de Diseño

Day Hero Quest utiliza un diseño gamificado y amigable específicamente diseñado para usuarios autistas, priorizando:
- **Claridad visual**: Elementos bien definidos con contrastes claros
- **Consistencia**: Patrones repetibles y predecibles
- **Feedback inmediato**: Respuestas visuales claras a las acciones
- **Mobile-first**: Optimizado para experiencia táctil en dispositivos móviles

## 🎯 Categorías y Colores

### Categorías Base
```css
Personal:   hsl(var(--category-personal))     /* Púrpura suave */
Laburo:     hsl(var(--category-laburo))       /* Azul corporativo */
Freelance:  hsl(var(--category-freelance))   /* Verde creativo */
Social:     hsl(var(--category-social))      /* Naranja social */
Salud:      hsl(var(--category-salud))       /* Verde salud */
Otros:      hsl(var(--category-otros))       /* Rosa neutro */
```

### Estados de Hábitos (Nuevos)
```css
--habit-incomplete: hsl(220, 13%, 69%)      /* Gris neutro */
--habit-partial: hsl(43, 89%, 70%)          /* Amarillo advertencia */
--habit-complete: hsl(120, 100%, 40%)       /* Verde éxito */
--habit-bonus: hsl(45, 100%, 51%)           /* Dorado premio */
--habit-streak: hsl(280, 100%, 70%)         /* Magenta especial */
```

### Estados de Calendario
```css
--calendar-empty: hsl(var(--muted))         /* Día sin actividad */
--calendar-partial: hsl(43, 89%, 85%)       /* Día parcial (fondo suave) */
--calendar-complete: hsl(120, 100%, 90%)    /* Día completo (fondo suave) */
--calendar-bonus: hsl(45, 100%, 85%)        /* Día con bonus (fondo dorado) */
--calendar-today: hsl(var(--primary))       /* Día actual */
--calendar-selected: hsl(var(--accent))     /* Día seleccionado */
```

## 📱 Layout Mobile-First

### Contenedor Principal
- **Max-width**: 428px (iPhone Pro Max)
- **Padding**: 16px lateral, 24px superior/inferior
- **Margin**: Centrado automáticamente

### Grid del Habit Tracker
```css
.habit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  padding: 16px 0;
}

.habit-category-card {
  border-radius: 12px;
  padding: 16px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.habit-category-card.completed {
  border-color: hsl(var(--habit-complete));
  box-shadow: 0 0 0 1px hsl(var(--habit-complete) / 0.2);
}
```

### Calendario
```css
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin: 16px 0;
}

.calendar-day {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-height: 44px; /* Área táctil mínima */
}
```

## 🎭 Componentes UI Especializados

### HabitCheckbox
```typescript
interface HabitCheckboxProps {
  category: CategoryType;
  isCompleted: boolean;
  onToggle: () => void;
  disabled?: boolean;
}
```

**Estados visuales:**
- **Unchecked**: Círculo gris con borde punteado
- **Checked**: Círculo lleno con color de categoría + checkmark blanco
- **Disabled**: Opacidad 0.5 + cursor not-allowed
- **Animation**: Scale + bounce al cambiar estado

### CalendarDay
```typescript
interface CalendarDayProps {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  status: 'empty' | 'partial' | 'complete' | 'bonus';
  onClick: (date: Date) => void;
  activities?: Activity[];
}
```

**Indicadores visuales:**
- **Dot indicator**: Pequeño círculo debajo del número para actividades
- **Ring indicator**: Borde coloreado según estado de completitud
- **Badge indicator**: Número pequeño para cantidad de actividades

### ProgressRing
```typescript
interface ProgressRingProps {
  progress: number; // 0-100
  size: 'sm' | 'md' | 'lg';
  showPercent?: boolean;
  color?: string;
}
```

**Implementación:**
- SVG circular con stroke-dasharray animado
- Gradiente desde color de categoría hasta éxito
- Texto centrado opcional

### BonusBadge
```typescript
interface BonusBadgeProps {
  type: 'daily' | 'weekly' | 'monthly';
  points: number;
  animate?: boolean;
}
```

**Estilos:**
- Fondo dorado con gradiente sutil
- Icono de estrella
- Animación de "pop" al aparecer
- Sombra dorada suave

## ✨ Animaciones y Micro-interacciones

### Transiciones Base
```css
/* Transición estándar */
.transition-standard {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Transición suave */
.transition-smooth {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Transición elástica */
.transition-bounce {
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Animaciones Específicas
```css
/* Completar hábito */
@keyframes habit-complete {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Efecto confetti (día bonus) */
@keyframes confetti-pop {
  0% { transform: scale(0) rotate(0deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
  100% { transform: scale(1) rotate(360deg); opacity: 1; }
}

/* Pulsación de notificación */
@keyframes notification-pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 hsl(var(--primary) / 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px hsl(var(--primary) / 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 hsl(var(--primary) / 0); }
}
```

## 📊 Iconografía Consistente

### Iconos de Estado
- **Complete**: ✅ (CheckCircle)
- **Partial**: ⚡ (Zap)
- **Bonus**: ⭐ (Star)
- **Streak**: 🔥 (Flame)
- **Calendar**: 📅 (Calendar)
- **Stats**: 📊 (BarChart)

### Iconos de Navegación
- **Hoy**: 🏠 (Home)
- **Hábitos**: ✅ (CheckSquare)
- **Calendario**: 📅 (Calendar)
- **Estadísticas**: 📊 (TrendingUp)

### Iconos de Categorías
- **Personal**: 🧘‍♀️ (User)
- **Laburo**: 💼 (Briefcase)
- **Freelance**: 💻 (Laptop)
- **Social**: 👥 (Users)
- **Salud**: 🏥 (Heart/Health)
- **Otros**: 📋 (Clipboard)

## 🎯 Estados de Feedback

### Toast Notifications
```css
.toast-success {
  background: hsl(var(--success));
  border-left: 4px solid hsl(var(--success));
}

.toast-bonus {
  background: linear-gradient(135deg, hsl(var(--habit-bonus)), hsl(var(--habit-streak)));
  border-left: 4px solid hsl(var(--habit-bonus));
}

.toast-streak {
  background: hsl(var(--habit-streak));
  border-left: 4px solid hsl(var(--habit-streak));
  animation: notification-pulse 2s infinite;
}
```

### Loading States
- **Skeleton**: Animación shimmer para carga de calendario
- **Spinner**: Spinner pequeño para acciones (completar hábitos)
- **Progress**: Barras de progreso para estadísticas

## 📱 Navegación Bottom-Tab

### Estructura
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: hsl(var(--background));
  border-top: 1px solid hsl(var(--border));
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 50;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  min-width: 64px;
}

.nav-item.active {
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
}
```

### Badge Indicators
- **Notificación**: Punto rojo pequeño en la esquina del icono
- **Contador**: Badge numerado para elementos pendientes
- **Estado**: Indicador de progreso en tab de hábitos

## 🎨 Temas (Light/Dark)

### Variables CSS Adicionales
```css
:root {
  /* Estados de hábitos - Light */
  --habit-incomplete: 220 13% 69%;
  --habit-partial: 43 89% 70%;
  --habit-complete: 120 100% 40%;
  --habit-bonus: 45 100% 51%;
  --habit-streak: 280 100% 70%;
}

[data-theme="dark"] {
  /* Estados de hábitos - Dark */
  --habit-incomplete: 220 13% 35%;
  --habit-partial: 43 89% 60%;
  --habit-complete: 120 100% 35%;
  --habit-bonus: 45 100% 45%;
  --habit-streak: 280 100% 60%;
}
```

## 💫 Principios de Accesibilidad

### Contraste y Legibilidad
- **Texto principal**: Mínimo 4.5:1 ratio
- **Texto secundario**: Mínimo 3:1 ratio
- **Elementos interactivos**: Mínimo 3:1 ratio

### Área Táctil
- **Mínimo**: 44x44px para todos los elementos tocables
- **Óptimo**: 48x48px para elementos principales
- **Separación**: Mínimo 8px entre elementos tocables

### Focus States
```css
.focusable:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Screen Reader Support
- **ARIA labels** en todos los componentes interactivos
- **Role attributes** apropiados para componentes customizados
- **Alt text** descriptivo para iconos y elementos visuales

---

Este sistema de diseño debe ser seguido consistentemente en todos los componentes nuevos y actualizaciones para mantener la coherencia visual y funcional de Day Hero Quest.