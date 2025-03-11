'use client';

import { useGame } from '@/contexts/GameContext';
import ScoreInput from '@/components/game/ScoreInput';
import CricketLights from '@/components/game/CricketLights';
import VictoryScreen from '@/components/game/VictoryScreen';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CricketPlayerState, GameState } from '@/types/game';

const getPlayerAverage = (state: GameState, playerId: string) => {
  const stats = state.playerStats[playerId];
  if (!stats || stats.dartsThrown === 0) return 0;
  return (stats.totalScore / stats.dartsThrown).toFixed(1);
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
                `${state.settings.startingScore} Game` : 
                'Cricket'}
            </h1>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {state.players.map((player) => (
                <div 
                  key={player.id}
                  className={`text-center p-4 rounded ${
                    player.current ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-white'
                  }`}
                >
                  <div className="font-bold">{player.name}</div>
                  <div className="text-2xl">{player.score}</div>
                  {state.gameType === 'x01' && (
                    <div className="text-sm mt-1">
                      Avg: {getPlayerAverage(state, player.id)}
                    </div>
                  )}
                </div>
              ))}
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
                Round {state.currentRound} / {state.settings.rounds}
              </div>
            </div>
          )}

          <ScoreInput />
        </div>
      </div>
    </>
  );
} 