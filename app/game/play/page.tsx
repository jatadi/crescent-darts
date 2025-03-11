'use client';

import { useGame } from '@/contexts/GameContext';
import ScoreInput from '@/components/game/ScoreInput';
import Card from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import VictoryScreen from '@/components/game/VictoryScreen';

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

  const getPlayerAverage = (playerId: string) => {
    const stats = state.playerStats[playerId];
    if (!stats || stats.dartsThrown === 0) return 0;
    return (stats.totalScore / stats.dartsThrown).toFixed(1);
  };

  return (
    <>
      {state.gameOver && <VictoryScreen />}
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Game in Progress</h1>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {state.players.map((player) => (
              <Card 
                key={player.id}
                className={`${player.current ? 'border-2 border-blue-500' : ''}`}
              >
                <h3 className="font-semibold">{player.name}</h3>
                <p className="text-2xl font-bold">{player.score}</p>
                {state.gameType === 'x01' && (
                  <p className="text-sm text-gray-500">
                    Avg: {getPlayerAverage(player.id)} per dart
                  </p>
                )}
              </Card>
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

        <ScoreInput />
      </div>
    </>
  );
} 