'use client';

import { useState, useEffect } from 'react';
import { addPlayer, getPlayers } from '@/utils/db';
import { Player } from '@/types/game';

export default function TestPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    const playerList = await getPlayers();
    setPlayers(playerList);
  }

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (newPlayerName.trim()) {
      await addPlayer(newPlayerName);
      setNewPlayerName('');
      loadPlayers();
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Test Database Connection</h1>
      
      <form onSubmit={handleAddPlayer} className="mb-8">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Enter player name"
          className="border p-2 rounded mr-2"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Player
        </button>
      </form>

      <div>
        <h2 className="text-xl font-bold mb-2">Players:</h2>
        <ul className="list-disc pl-4">
          {players.map((player) => (
            <li key={player.id}>{player.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
} 