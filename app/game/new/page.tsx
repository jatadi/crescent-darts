'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getPlayers } from '@/utils/db';
import { Player } from '@/types/game';
import { useGame } from '@/contexts/GameContext';

export default function NewGame() {
  const router = useRouter();
  const { dispatch } = useGame();
  const [gameType, setGameType] = useState<'x01' | 'cricket'>('x01');
  const [x01Score, setX01Score] = useState(501);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    const playerList = await getPlayers();
    setPlayers(playerList);
  }

  function togglePlayer(playerId: string) {
    setSelectedPlayerIds(current => {
      if (current.includes(playerId)) {
        return current.filter(id => id !== playerId);
      }
      return [...current, playerId];
    });
  }

  function handleStartGame() {
    if (selectedPlayerIds.length < 2) {
      alert('Please select at least 2 players');
      return;
    }

    const selectedPlayers = players.filter(p => selectedPlayerIds.includes(p.id));
    
    dispatch({
      type: 'START_GAME',
      players: selectedPlayers,
      gameType,
      settings: {
        startingScore: gameType === 'x01' ? x01Score : undefined,
      },
    });

    router.push('/game/play');
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">New Game</h1>
      
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Game Type</h2>
        <div className="flex gap-4 mb-6">
          <Button
            variant={gameType === 'x01' ? 'primary' : 'secondary'}
            onClick={() => setGameType('x01')}
          >
            X01
          </Button>
          <Button
            variant={gameType === 'cricket' ? 'primary' : 'secondary'}
            onClick={() => setGameType('cricket')}
          >
            Cricket
          </Button>
        </div>

        {gameType === 'x01' && (
          <div>
            <h3 className="font-semibold mb-2">Starting Score</h3>
            <select
              value={x01Score}
              onChange={(e) => setX01Score(Number(e.target.value))}
              className="border rounded p-2 dark:bg-gray-700"
            >
              <option value={301}>301</option>
              <option value={501}>501</option>
              <option value={701}>701</option>
            </select>
          </div>
        )}
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Players</h2>
        <div className="grid grid-cols-2 gap-4">
          {players.map((player) => (
            <Button
              key={player.id}
              variant={selectedPlayerIds.includes(player.id) ? 'primary' : 'secondary'}
              onClick={() => togglePlayer(player.id)}
            >
              {player.name}
            </Button>
          ))}
        </div>
      </Card>

      <Button 
        size="lg" 
        className="w-full"
        onClick={handleStartGame}
        disabled={selectedPlayerIds.length < 2}
      >
        Start Game
      </Button>
    </div>
  );
} 