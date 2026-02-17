import { useEffect, useState } from 'react';

interface ConfettiProps {
  onComplete?: () => void;
}

export function Confetti({ onComplete }: ConfettiProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; duration: number; color: string }>>([]);

  useEffect(() => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 1,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    setConfetti(pieces);

    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 animate-fall"
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: 'rotate(45deg)'
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}</style>
    </div>
  );
}

interface CelebrationProps {
  title: string;
  points: number;
  level?: { level: number; name: string; icon: string };
  badges?: Array<{ name: string; icon: string }>;
  onClose: () => void;
}

export function Celebration({ title, points, level, badges, onClose }: CelebrationProps) {
  return (
    <>
      <Confetti onComplete={onClose} />
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center animate-bounce-in">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{title}</h2>
          <div className="text-5xl font-bold text-yellow-500 mb-4">+{points} points</div>

          {level && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
              <div className="text-3xl mb-2">{level.icon}</div>
              <p className="text-lg font-semibold text-slate-700">
                Niveau {level.level}: {level.name}
              </p>
            </div>
          )}

          {badges && badges.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-yellow-800 mb-2">Nouveau badge !</p>
              <div className="flex justify-center gap-2">
                {badges.map((badge, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="text-3xl">{badge.icon}</div>
                    <p className="text-xs text-slate-600">{badge.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
          >
            Continuer
          </button>
        </div>
      </div>
      <style>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </>
  );
}
