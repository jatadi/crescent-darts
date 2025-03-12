'use client';

import { useEffect, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function VictoryScreen() {
  const { state } = useGame();
  const router = useRouter();
  const [particles, setParticles] = useState<Array<{ id: number; left: string; color: string }>>([]);

  const winner = state.players.find(p => p.id === state.winnerId);
  const stats = state.playerStats[state.winnerId!];

  useEffect(() => {
    const colors = ['#FFD700', '#FFA500', '#FF4500'];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setParticles(newParticles);

    const victorySound = new Audio('/sounds/victory.mp3');
    victorySound.volume = 0.5;
    victorySound.play().catch(console.error);

    return () => {
      victorySound.pause();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute bottom-0 w-3 h-3 rounded-full animate-victory-particle"
          style={{
            left: particle.left,
            backgroundColor: particle.color,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}

      <div className="text-center z-10">
        <h1 className="text-6xl font-bold text-yellow-400 mb-4 animate-bounce">
          GAME OVER!
        </h1>
        <h2 className="text-4xl font-bold text-white mb-8">
          {winner?.name} Wins!
        </h2>
        {state.gameType === 'x01' && (
          <div className="text-white mb-8">
            <p>Final Average: {stats ? (stats.totalScore / stats.dartsThrown).toFixed(1) : '0'} per dart</p>
            <p>Total Darts: {stats?.dartsThrown || 0}</p>
          </div>
        )}
        <div className="space-x-4">
          <Button onClick={() => router.push('/game/new')}>
            New Game
          </Button>
          <Button variant="secondary" onClick={() => router.push('/')}>
            Home
          </Button>
        </div>
      </div>
    </div>
  );
} 