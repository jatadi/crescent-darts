'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getPlayers } from '@/utils/db';
import { Player, GameType } from '@/types/game';
import { useGame } from '@/contexts/GameContext';

interface PlayerSelectionProps {
  players: Player[];
  selectedPlayers: Player[];
  onTogglePlayer: (player: Player) => void;
}

export default function NewGame() {
  const router = useRouter();
  const { dispatch } = useGame();
  const [gameType, setGameType] = useState<GameType>('x01');
  const [settings, setSettings] = useState({
    startingScore: 501,
    doubleOut: false,
    rounds: 15 as 15 | 20 | 25
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    const playerList = await getPlayers();
    setPlayers(playerList);
  }

  function togglePlayer(player: Player) {
    setSelectedPlayers(current => {
      if (current.includes(player)) {
        return current.filter(p => p.id !== player.id);
      }
      return [...current, player];
    });
  }

  function handleStartGame() {
    if (selectedPlayers.length < 2) {
      alert('Please select at least 2 players');
      return;
    }

    dispatch({
      type: 'START_GAME',
      players: selectedPlayers,
      gameType,
      settings: gameType === 'x01' ? {
        startingScore: settings.startingScore,
        doubleOut: settings.doubleOut
      } : {
        rounds: settings.rounds
      },
    });

    router.push('/game/play');
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">New Game</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Select Game Type</h2>
        <div className="flex gap-4">
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
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Game Settings</h2>
        {gameType === 'x01' ? (
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-lg font-medium text-gray-900 dark:text-white">Starting Score</label>
              <select
                value={settings.startingScore}
                onChange={(e) => setSettings({ ...settings, startingScore: Number(e.target.value) })}
                className="w-full p-3 text-xl bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg 
                text-blue-900 dark:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={301}>301</option>
                <option value={501}>501</option>
                <option value={701}>701</option>
              </select>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.doubleOut}
                  onChange={(e) => setSettings({ ...settings, doubleOut: e.target.checked })}
                  className="mr-2"
                />
                Double Out
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Number of Rounds
              </label>
              <div className="space-y-2">
                {[15, 20, 25].map((roundOption) => (
                  <label key={roundOption} className="flex items-center">
                    <input
                      type="radio"
                      checked={settings.rounds === roundOption}
                      onChange={() => setSettings({ ...settings, rounds: roundOption as 15 | 20 | 25 })}
                      className="mr-2"
                    />
                    {roundOption} Rounds
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Players</h2>
        <PlayerSelection
          players={players}
          selectedPlayers={selectedPlayers}
          onTogglePlayer={(player) => togglePlayer(player)}
        />
      </Card>

      <Button 
        size="lg" 
        className="w-full"
        onClick={handleStartGame}
        disabled={selectedPlayers.length < 2}
      >
        Start Game
      </Button>
    </div>
  );
}

function PlayerSelection({ players, selectedPlayers, onTogglePlayer }: PlayerSelectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {players.map((player) => (
        <button
          key={player.id}
          onClick={() => onTogglePlayer(player)}
          className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
            selectedPlayers.includes(player) 
              ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' 
              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
          }`}
        >
          {player.photo_url ? (
            <img 
              src={player.photo_url} 
              alt={player.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-lg font-medium">{player.name[0]}</span>
            </div>
          )}
          <span className="font-medium">{player.name}</span>
        </button>
      ))}
    </div>
  );
} 