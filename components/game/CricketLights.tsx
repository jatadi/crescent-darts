import React from 'react';
import { CricketPlayerState } from '@/types/game';

interface Props {
  players: CricketPlayerState[];
}

export default function CricketLights({ players }: Props) {
  const numbers = ['20', '19', '18', '17', '16', '15', 'bull'] as const;

  // Split players into left and right sides
  const midPoint = Math.ceil(players.length / 2);
  const leftPlayers = players.slice(0, midPoint);
  const rightPlayers = players.slice(midPoint);

  // For more than 4 players, split each side into top and bottom
  const splitSide = (players: CricketPlayerState[]) => {
    const mid = Math.ceil(players.length / 2);
    return [players.slice(0, mid), players.slice(mid)];
  };

  const [leftTop, leftBottom] = players.length > 4 ? splitSide(leftPlayers) : [leftPlayers, []];
  const [rightTop, rightBottom] = players.length > 4 ? splitSide(rightPlayers) : [rightPlayers, []];

  const PlayerColumn = ({ player }: { player: CricketPlayerState }) => (
    <div className="text-white mb-4">
      <div className="text-xl font-bold mb-4 text-center">
        {player.name}
      </div>
      <div className="flex flex-col gap-4 items-start">
        {numbers.map(number => (
          <div key={number} className="flex items-center gap-3">
            <div className="text-lg">{number}</div>
            <div className="flex gap-1">
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

  return (
    <>
      {/* Left side */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2">
        <div className="space-x-8 flex">
          {leftTop.map(player => (
            <PlayerColumn key={player.id} player={player} />
          ))}
        </div>
        {leftBottom.length > 0 && (
          <div className="space-x-8 flex mt-8">
            {leftBottom.map(player => (
              <PlayerColumn key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2">
        <div className="space-x-8 flex">
          {rightTop.map(player => (
            <div key={player.id} className="text-white mb-4">
              <div className="text-xl font-bold mb-4 text-center">
                {player.name}
              </div>
              <div className="flex flex-col gap-4 items-end">
                {numbers.map(number => (
                  <div key={number} className="flex items-center gap-3">
                    <div className="flex gap-1">
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
                    <div className="text-lg">{number}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {rightBottom.length > 0 && (
          <div className="space-x-8 flex mt-8">
            {rightBottom.map(player => (
              <div key={player.id} className="text-white mb-4">
                <div className="text-xl font-bold mb-4 text-center">
                  {player.name}
                </div>
                <div className="flex flex-col gap-4 items-end">
                  {numbers.map(number => (
                    <div key={number} className="flex items-center gap-3">
                      <div className="flex gap-1">
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
                      <div className="text-lg">{number}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
} 