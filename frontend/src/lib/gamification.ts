// Gamification constants and helpers (frontend)
// Business logic is in the backend

export const POINTS = {
  REGISTRATION: 10,
  ATTENDANCE: 50,
  EARLY_BIRD: 20,
  STREAK_BONUS: 30
};

export const LEVELS = [
  { level: 1, minPoints: 0, name: 'Débutant', icon: '🌱', color: 'slate' },
  { level: 2, minPoints: 50, name: 'Novice', icon: '⭐', color: 'blue' },
  { level: 3, minPoints: 150, name: 'Habitué', icon: '🎯', color: 'green' },
  { level: 4, minPoints: 300, name: 'Expert', icon: '💎', color: 'purple' },
  { level: 5, minPoints: 500, name: 'Maître', icon: '👑', color: 'yellow' },
  { level: 6, minPoints: 800, name: 'Légende', icon: '🏆', color: 'orange' }
];

export const BADGES = {
  FIRST_EVENT: { type: 'first_event', name: 'Premier Pas', icon: '🎉', description: 'Premier événement' },
  EARLY_BIRD: { type: 'early_bird', name: 'Lève-tôt', icon: '🌅', description: 'Inscription anticipée' },
  PERFECT_ATTENDANCE: { type: 'perfect_attendance', name: 'Présence Parfaite', icon: '✨', description: '5 présences consécutives' },
  SOCIAL_BUTTERFLY: { type: 'social_butterfly', name: 'Papillon Social', icon: '🦋', description: '10 événements assistés' },
  NETWORKING_PRO: { type: 'networking_pro', name: 'Pro du Réseau', icon: '🤝', description: '20 événements assistés' },
  POINT_COLLECTOR: { type: 'point_collector', name: 'Collectionneur', icon: '💰', description: '500 points' },
  LEVEL_5: { type: 'level_5', name: 'Niveau 5', icon: '👑', description: 'Atteindre le niveau 5' }
};

export function getLevelInfo(points: number) {
  let currentLevel = LEVELS[0];
  for (const level of LEVELS) {
    if (points >= level.minPoints) {
      currentLevel = level;
    } else {
      break;
    }
  }

  const nextLevelIndex = LEVELS.findIndex(l => l.level === currentLevel.level) + 1;
  const nextLevel = nextLevelIndex < LEVELS.length ? LEVELS[nextLevelIndex] : null;
  const progress = nextLevel
    ? ((points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;

  return {
    current: currentLevel,
    next: nextLevel,
    progress: Math.min(progress, 100)
  };
}
