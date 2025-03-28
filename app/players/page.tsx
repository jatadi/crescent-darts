'use client';

import { useState, useEffect } from 'react';
import { Player } from '@/types/game';
import { getPlayers, deletePlayer } from '@/utils/db';
import Card from '@/components/ui/Card';
import PlayerCard from '@/components/players/PlayerCard';
import AddPlayerForm from '@/components/players/AddPlayerForm';

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    const playerList = await getPlayers();
    setPlayers(playerList);
    setIsLoading(false);
  }

  async function handleDeletePlayer(id: string) {
    if (window.confirm('Are you sure you want to delete this player?')) {
      const success = await deletePlayer(id);
      if (success) {
        setPlayers(players.filter(p => p.id !== id));
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Players</h1>

      <Card className="mb-6">
        <AddPlayerForm onPlayerAdded={loadPlayers} />
      </Card>

      {isLoading ? (
        <p>Loading players...</p>
      ) : (
        <div className="space-y-4">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onDelete={handleDeletePlayer}
            />
          ))}
          {players.length === 0 && (
            <p className="text-center text-gray-500">No players yet</p>
          )}
        </div>
      )}
    </div>
  );
} 