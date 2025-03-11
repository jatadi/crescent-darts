import React from 'react';
import { CricketPlayerState } from '@/types/game';

interface Props {
  players: CricketPlayerState[];
}

export default function CricketScoreboard({ players }: Props) {
  const numbers = ['20', '19', '18', '17', '16', '15', 'bull'] as const;

  return (
    <div className="bg-black text-white p-6 rounded-lg">
      {/* Player scores at top */}
      <div className="grid grid-cols-[repeat(3,1fr)] gap-8 mb-8 text-center">
        {players.map(player => (
          <div key={player.id} className={`text-2xl ${player.current ? 'text-yellow-400' : ''}`}>
            {player.score}
          </div>
        ))}
      </div>

      {/* Cricket board */}
      <div className="grid grid-cols-[auto,repeat(3,1fr)] gap-x-8 gap-y-4">
        {/* Numbers column */}
        <div className="space-y-4">
          {numbers.map(number => (
            <div key={number} className="text-2xl font-bold text-center">
              {number === 'bull' ? 'BULL' : number}
            </div>
          ))}
        </div>

        {/* Player marks columns */}
        {players.map(player => (
          <div key={player.id} className="space-y-4">
            {numbers.map(number => (
              <div key={number} className="flex justify-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-6 ${
                      player.cricketScores[number].marks > i
                        ? 'bg-yellow-400'
                        : 'bg-gray-800'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
} 