'use client';

import { useEffect, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

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
    
    // Add error handling for the play promise
    const playPromise = victorySound.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name === 'AbortError') {
          // Ignore abort errors - these are expected when navigating away
          console.log('Sound play aborted - this is normal when navigating');
        } else {
          console.error('Error playing victory sound:', error);
        }
      });
    }

    return () => {
      victorySound.pause();
      victorySound.src = ''; // Clear the source
    };
  }, []);

  if (!winner) return null;

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
        <motion.div
          className="mb-6"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {winner.photo_url ? (
            <Image 
              src={winner.photo_url}
              alt={winner.name}
              width={128}
              height={128}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-48 h-48 rounded-full bg-gray-700 mx-auto flex items-center justify-center">
              <span className="text-6xl">{winner.name[0]}</span>
            </div>
          )}
        </motion.div>
        <h1 className="text-6xl font-bold text-yellow-400 mb-4 animate-bounce">
          GAME OVER!
        </h1>
        <h2 className="text-4xl font-bold text-white mb-8">
          {winner.name} Wins!
        </h2>
        {state.gameType === 'x01' && (
          <div className="text-white mb-8">
            <p>Final Average: {stats ? (stats.totalScore / stats.dartsThrown).toFixed(1) : '0'} per dart</p>
            <p>Total Darts: {stats?.dartsThrown || 0}</p>
            
            {state.redemptionMode && (
              <div className="mt-4">
                <p className="inline-block bg-blue-500 px-3 py-1 rounded-full text-sm">
                  {state.overtime ? 'Overtime Victory' : 'Redemption Mode'} 
                </p>
                {state.firstFinishedPlayerId === winner.id && (
                  <p className="mt-2 text-yellow-300">Pole Position Winner</p>
                )}
                {state.firstFinishedPlayerId !== winner.id && (
                  <p className="mt-2 text-green-300">Redemption Winner</p>
                )}
              </div>
            )}
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