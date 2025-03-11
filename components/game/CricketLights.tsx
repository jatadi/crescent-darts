import React from 'react';
import { CricketPlayerState } from '@/types/game';

interface Props {
  player: CricketPlayerState;
  position: 'left' | 'right';
}

export default function CricketLights({ player, position }: Props) {
  const numbers = ['20', '19', '18', '17', '16', '15', 'bull'] as const;

  return (
    <div className="text-white">
      <div className="text-xl font-bold mb-4 text-center">
        {player.name}
      </div>
      <div className={`flex flex-col gap-4 ${position === 'right' ? 'items-end' : 'items-start'}`}>
        {numbers.map(number => (
          <div key={number} className="flex items-center gap-3">
            <div className={`text-lg ${position === 'right' ? 'order-2' : ''}`}>
              {number}
            </div>
            <div className={`flex gap-1 ${position === 'right' ? 'order-1' : ''}`}>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full ${
                    player.cricketScores[number].marks > i
                      ? 'bg-yellow-400'
                      : 'bg-gray-800'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 