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

  // Crear las partículas de confetti con efecto cortina
  for (let i = 0; i < finalCount; i++) {
    // Retraso escalonado para efecto cortina (0-800ms)
    const delay = Math.random() * 800;

    setTimeout(() => {
      const particle = document.createElement('div');
      particle.textContent = emoji[Math.floor(Math.random() * emoji.length)];
      particle.style.position = 'absolute';
      particle.style.fontSize = `${Math.random() * 25 + 15}px`;
      particle.style.userSelect = 'none';
      particle.style.pointerEvents = 'none';
      particle.style.opacity = '0';

      // Posición inicial aleatoria en el ancho de la pantalla
      const startX = Math.random() * window.innerWidth;
      particle.style.left = `${startX}px`;
      particle.style.top = '-50px';

      // Velocidad variable para cada partícula (1500-4000ms)
      const particleDuration = Math.random() * 2500 + 1500;

      // Movimiento horizontal más variado
      const horizontalMovement = (Math.random() - 0.5) * spread * 1.5;
      const rotationAmount = Math.random() * 720 + 360; // 360-1080 grados
      const swayAmount = (Math.random() - 0.5) * 50; // Balanceo lateral

      // Escala variable durante la caída
      const initialScale = Math.random() * 0.5 + 0.8; // 0.8-1.3
      const finalScale = Math.random() * 0.3 + 0.1; // 0.1-0.4

      // Animación CSS con trayectoria curva y balanceo
      const animationName = `confetti-fall-${i}-${Date.now()}`;
      const keyframes = `
        @keyframes ${animationName} {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg) scale(${initialScale});
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          25% {
            transform: translateY(${(window.innerHeight + 100) * 0.25}px) translateX(${horizontalMovement * 0.3}px) rotate(${rotationAmount * 0.25}deg) scale(${initialScale * 1.1});
          }
          50% {
            transform: translateY(${(window.innerHeight + 100) * 0.5}px) translateX(${horizontalMovement * 0.7 + swayAmount}px) rotate(${rotationAmount * 0.5}deg) scale(${(initialScale + finalScale) * 0.5});
          }
          75% {
            transform: translateY(${(window.innerHeight + 100) * 0.75}px) translateX(${horizontalMovement * 0.9 - swayAmount * 0.5}px) rotate(${rotationAmount * 0.75}deg) scale(${finalScale * 1.2});
          }
          95% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(${window.innerHeight + 100}px) translateX(${horizontalMovement}px) rotate(${rotationAmount}deg) scale(${finalScale});
            opacity: 0;
          }
        }
      `;

      // Agregar keyframes al documento
      const style = document.createElement('style');
      style.textContent = keyframes;
      document.head.appendChild(style);

      // Aplicar la animación con curva de aceleración más realista
      particle.style.animation = `${animationName} ${particleDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;

      container.appendChild(particle);

      // Limpiar después de la animación
      setTimeout(() => {
        if (style.parentNode) {
          document.head.removeChild(style);
        }
      }, particleDuration);
    }, delay);
  }

  // Limpiar el contenedor después de la animación (considerando retrasos + duración máxima)
  const maxCleanupTime = 800 + 4000 + 200; // delay máximo + duración máxima + margen
  setTimeout(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }, maxCleanupTime);
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