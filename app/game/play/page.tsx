'use client';

import { useGame } from '@/contexts/GameContext';
import ScoreInput from '@/components/game/ScoreInput';
import CricketLights from '@/components/game/CricketLights';
import VictoryScreen from '@/components/game/VictoryScreen';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CricketPlayerState } from '@/types/game';

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
          <>
            {/* Left player lights */}
            <div className="fixed left-8 top-1/2 -translate-y-1/2">
              <CricketLights player={state.players[0] as CricketPlayerState} position="left" />
            </div>

            {/* Right player lights */}
            <div className="fixed right-8 top-1/2 -translate-y-1/2">
              <CricketLights player={state.players[state.players.length - 1] as CricketPlayerState} position="right" />
            </div>
          </>
        )}

        {/* Main game area */}
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-4">Cricket</h1>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {state.players.map((player) => (
                <div 
                  key={player.id}
                  className={`text-center p-4 rounded ${player.current ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-white'}`}
                >
                  <div className="font-bold">{player.name}</div>
                  <div className="text-2xl">{player.score}</div>
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