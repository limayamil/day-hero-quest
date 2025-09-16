export interface ConfettiOptions {
  emoji?: string[];
  count?: number;
  duration?: number;
  spread?: number;
  intensity?: 'light' | 'medium' | 'heavy';
}

const DEFAULT_EMOJIS = ['🎉', '✨', '🚀', '🎊', '🌟', '💫', '⭐', '🎈'];

const INTENSITY_CONFIG = {
  light: { count: 15, duration: 2000 },
  medium: { count: 25, duration: 3000 },
  heavy: { count: 40, duration: 4000 }
};

export const createEmojiConfetti = (options: ConfettiOptions = {}) => {
  const {
    emoji = DEFAULT_EMOJIS,
    count,
    duration,
    spread = 100,
    intensity = 'medium'
  } = options;

  const config = INTENSITY_CONFIG[intensity];
  const finalCount = count ?? config.count;
  const finalDuration = duration ?? config.duration;

  // Crear el contenedor
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9999';
  container.style.overflow = 'hidden';
  document.body.appendChild(container);

  // Crear las partículas de confetti
  for (let i = 0; i < finalCount; i++) {
    const particle = document.createElement('div');
    particle.textContent = emoji[Math.floor(Math.random() * emoji.length)];
    particle.style.position = 'absolute';
    particle.style.fontSize = `${Math.random() * 20 + 20}px`;
    particle.style.userSelect = 'none';
    particle.style.pointerEvents = 'none';

    // Posición inicial aleatoria en el ancho de la pantalla
    const startX = Math.random() * window.innerWidth;
    particle.style.left = `${startX}px`;
    particle.style.top = '-50px';

    // Animación CSS
    const animationName = `confetti-fall-${i}`;
    const keyframes = `
      @keyframes ${animationName} {
        0% {
          transform: translateY(0) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 360}deg);
          opacity: 0;
        }
      }
    `;

    // Agregar keyframes al documento
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);

    // Aplicar la animación
    particle.style.animation = `${animationName} ${finalDuration}ms ease-out forwards`;

    // Movimiento horizontal aleatorio
    const horizontalMovement = (Math.random() - 0.5) * spread;
    particle.style.transform = `translateX(${horizontalMovement}px)`;

    container.appendChild(particle);

    // Limpiar después de la animación
    setTimeout(() => {
      if (style.parentNode) {
        document.head.removeChild(style);
      }
    }, finalDuration);
  }

  // Limpiar el contenedor después de la animación
  setTimeout(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }, finalDuration + 100);
};

// Funciones específicas para diferentes tipos de eventos
export const celebrateActivity = () => {
  createEmojiConfetti({
    emoji: ['🎉', '✨', '🎊', '🌟'],
    intensity: 'medium'
  });
};

export const celebrateHabit = () => {
  createEmojiConfetti({
    emoji: ['💫', '⭐', '✨', '🚀'],
    intensity: 'light'
  });
};

export const celebratePerfectDay = () => {
  createEmojiConfetti({
    emoji: ['🎉', '🎊', '🌟', '✨', '🚀', '💫', '⭐', '🎈', '🏆', '🥳'],
    intensity: 'heavy'
  });
};