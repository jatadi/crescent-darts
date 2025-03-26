'use client';

import { useGame } from '@/contexts/GameContext';
import ScoreInput from '@/components/game/ScoreInput';
import CricketLights from '@/components/game/CricketLights';
import VictoryScreen from '@/components/game/VictoryScreen';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CricketPlayerState, GameState, X01Settings, CricketSettings } from '@/types/game';
import Image from 'next/image';

const getPlayerAverage = (state: GameState, playerId: string) => {
  const stats = state.playerStats[playerId];
  if (!stats || stats.dartsThrown === 0) return 0;
  return state.gameType === 'cricket' ?
    ((stats.targetsHit || 0) / stats.dartsThrown).toFixed(2) :
    (stats.totalScore / stats.dartsThrown).toFixed(1);
};

export default function GamePlay() {
  const { state } = useGame();
  const router = useRouter();

  useEffect(() => {
    // Redirect if no game is in progress
    if (state.players.length === 0) {
      router.push('/game/new');
    }
  }, [state.players.length, router]);

  if (state.players.length === 0) {
    return null;
  }

  const currentPlayer = state.players.find(p => p.current);

  return (
    <>
      {state.gameOver && <VictoryScreen />}
      <div className="relative min-h-screen">
        {state.gameType === 'cricket' && (
          <CricketLights players={state.players as CricketPlayerState[]} />
        )}

        {/* Main game area */}
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-4">
              {state.gameType === 'x01' ? 
                `${(state.settings as X01Settings).startingScore} Game` : 
                'Cricket'}
              {state.overtime && 
                <span className="ml-2 text-lg text-purple-400">
                  Overtime{state.overtimeRound > 1 ? ` Round ${state.overtimeRound}` : ''}
                </span>
              }
            </h1>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {state.players.map((player) => {
                // In overtime, we should only show active players prominently
                const isActive = state.overtime ? 
                  'finished' in player && player.finished : 
                  true;
                
                return (
                  <div 
                    key={player.id}
                    className={`flex flex-col items-center p-4 rounded ${
                      player.current ? 'bg-yellow-400 text-black' : 
                      state.overtime && !isActive ? 'bg-gray-900 text-gray-500' : 'bg-gray-800 text-white'
                    } ${state.overtime && !isActive ? 'opacity-50' : 'opacity-100'}`}
                  >
                    <div className="relative">
                      {player.photo_url ? (
                        <Image 
                          src={player.photo_url} 
                          alt={player.name}
                          width={48}
                          height={48}
                          className={`rounded-full object-cover ${state.overtime && !isActive ? 'grayscale' : ''}`}
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mb-2 ${state.overtime && !isActive ? 'bg-gray-900' : ''}`}>
                          <span className="text-xl">{player.name[0]}</span>
                        </div>
                      )}
                      
                      {/* Redemption status indicators */}
                      {state.gameType === 'x01' && (player as any).redemptionStatus && (
                        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                          ${(player as any).redemptionStatus === 'pole_position' ? 'bg-blue-500' : 
                            (player as any).redemptionStatus === 'on_the_bubble' ? 'bg-orange-500' : 
                            'bg-green-500'}`}
                        >
                          {(player as any).redemptionStatus === 'pole_position' ? '1' : 
                           (player as any).redemptionStatus === 'on_the_bubble' ? '?' : 'R'}
                        </div>
                      )}
                      
                      {/* Overtime indicator */}
                      {state.overtime && (
                        <div className="absolute -top-2 -left-2 bg-purple-600 text-white text-xs px-1 rounded-full">
                          OT
                        </div>
                      )}
                    </div>
                    
                    <div className="font-bold">{player.name}</div>
                    <div className="text-2xl">{player.score}</div>
                    <div className="text-sm mt-1">
                      {state.gameType === 'cricket' ? 
                        `Targets/Dart: ${getPlayerAverage(state, player.id)}` :
                        `Avg: ${getPlayerAverage(state, player.id)}`}
                    </div>
                    
                    {/* Show finished status */}
                    {state.gameType === 'x01' && (player as any).finished && (
                      <div className="text-xs mt-1 px-2 py-1 bg-green-600 text-white rounded-full">
                        {state.overtime ? 'Active' : 'Finished'}
                      </div>
                    )}
                    
                    {/* Show elimination status in overtime */}
                    {state.gameType === 'x01' && state.overtime && !(player as any).finished && (
                      <div className="text-xs mt-1 px-2 py-1 bg-red-600 text-white rounded-full">
                        Eliminated
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {currentPlayer && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">
                Current Turn: {currentPlayer.name}
              </h2>
              <p className="mb-4">
                Darts thrown: {state.currentTurn.dartsThrown} | 
                Scores: {state.currentTurn.scores.join(', ') || 'None'}
              </p>
            </div>
          )}

          {state.gameType === 'cricket' && (
            <div className="text-center mb-4">
              <div className="text-xl font-bold">
                Round {state.currentRound} / {(state.settings as CricketSettings).rounds}
              </div>
            </div>
          )}

          <ScoreInput />
        </div>
      </div>
    </>
  );
} 