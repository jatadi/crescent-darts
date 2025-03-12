'use client';

import { useEffect, useState } from 'react';
import { useGame } from '@/contexts/GameContext';

export default function MissAnimation() {
  const { state } = useGame();
  const [particles, setParticles] = useState<Array<{ id: number; left: string; animationDelay: string }>>([]);

  // Just check if there are any previous misses
  const hasAnyPreviousMisses = state.turns.some(turn => turn.scores.includes(0)) || 
                              state.currentTurn.scores.includes(0);

  const getMessage = () => {
    if (hasAnyPreviousMisses) {
      return "YOU'RE SHIT"
    } else {
      return "AGAIN!?"
    }
  };

  useEffect(() => {
    // Create particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 0.5}s`
    }));
    setParticles(newParticles);

    // Play miss sound
    const missSound = new Audio('/sounds/miss.mp3');
    missSound.volume = 0.6;
    missSound.play().catch(console.error);

    // Clean up particles and sounds after animation
    const timer = setTimeout(() => setParticles([]), 2000);
    return () => {
      clearTimeout(timer);
      missSound.pause();
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Big red flash */}
      <div className="absolute inset-0 bg-red-500/50 animate-flash" />
      
      {/* Explosion text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl text-red-500 font-bold animate-bounce">
        {getMessage()}
      </div>

      {/* Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute bottom-0 w-4 h-4 bg-red-500 rounded-full animate-firework"
          style={{
            left: particle.left,
            animationDelay: particle.animationDelay
          }}
        />
      ))}
    </div>
  );
} 