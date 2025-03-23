'use client';

import { useEffect, useState } from 'react';
import { getGameHistory } from '@/utils/db';
import Card from '@/components/ui/Card';
import { format } from 'date-fns';
import { Player } from '@/types/game';

interface GameHistory {
  id: string;
  game_type: 'x01' | 'cricket';
  winner: Player | null;
  created_at: string;
  starting_score: number | null;
  settings: any;
  game_players: {
    player: Player;
    player_id: string;
    final_score: number;
    total_score: number;
    darts_thrown: number;
    targets_hit?: number;
    cricket_scores?: any;
  }[];
}

export default function GameHistory() {
  const [games, setGames] = useState<GameHistory[]>([]);

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    const history = await getGameHistory();
    console.log('History data received:', history);
    setGames(history);
  }

  const renderPlayerStats = (game: GameHistory, gp: GameHistory['game_players'][0]) => {
    if (game.game_type === 'cricket') {
      // Calculate targets per dart using total_score for now since targets_hit isn't available
      const targetsPerDart = gp.darts_thrown > 0 ? 
        ((gp.total_score || 0) / gp.darts_thrown).toFixed(2) : 
        '0.00';
      return (
        <>
          <p className="text-sm">Final Score: {gp.final_score}</p>
          <p className="text-sm">
            Targets/Dart: {targetsPerDart}
          </p>
        </>
      );
    } else {
      return (
        <>
          <p className="text-sm">Final Score: {gp.final_score}</p>
          <p className="text-sm">
            Avg: {(gp.total_score / gp.darts_thrown).toFixed(1)}
          </p>
        </>
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Game History</h1>
      <div className="space-y-4">
        {games.map(game => (
          <Card key={game.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">
                  {game.game_type}{game.starting_score ? ` - ${game.starting_score}` : ''}
                </h2>
                <p className="text-gray-500">
                  {format(new Date(game.created_at), 'PPp')}
                </p>
                <div className="mt-2">
                  <h3 className="font-medium">Players:</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {game.game_players.map((gp) => (
                      <div 
                        key={gp.player_id}
                        className={`p-2 rounded ${gp.player_id === game.winner?.id ? 'bg-green-100 dark:bg-green-900' : ''}`}
                      >
                        <p className="font-medium">{gp.player.name}</p>
                        {renderPlayerStats(game, gp)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 