import { supabase } from './supabase';
import { Player } from '@/types/game';
import { GameState } from '@/contexts/GameContext';

export async function createPlayer(name: string, photoUrl?: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from('players')
    .insert([
      { name, photo_url: photoUrl }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating player:', error);
    return null;
  }

  return data as Player;
}

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching players:', error);
    return [];
  }

  return data as Player[];
}

export async function deletePlayer(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting player:', error);
    return false;
  }

  return true;
}

export async function saveGameHistory(gameState: GameState): Promise<boolean> {
  try {
    // First insert game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({
        game_type: gameState.gameType,
        starting_score: gameState.settings.startingScore,
        winner_id: gameState.winnerId,
        settings: gameState.settings
      })
      .select()
      .single();

    if (gameError) {
      console.error('Error saving game:', gameError.message, gameError.details);
      return false;
    }

    if (!game) {
      console.error('No game data returned after insert');
      return false;
    }

    // Save player stats
    const playerStats = gameState.players.map(player => ({
      game_id: game.id,
      player_id: player.id,
      final_score: player.score,
      darts_thrown: gameState.playerStats[player.id].dartsThrown,
      total_score: gameState.playerStats[player.id].totalScore
    }));

    const { error: statsError } = await supabase
      .from('game_players')
      .insert(playerStats);

    if (statsError) {
      console.error('Error saving player stats:', statsError.message, statsError.details);
      return false;
    }

    // Save turns history
    const turns = gameState.turns.map((turn, index) => ({
      game_id: game.id,
      player_id: turn.playerId,
      scores: turn.scores,
      turn_order: index
    }));

    const { error: turnsError } = await supabase
      .from('turns')
      .insert(turns);

    if (turnsError) {
      console.error('Error saving turns:', turnsError.message, turnsError.details);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error saving game:', error);
    return false;
  }
}

export async function getGameHistory() {
  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      winner:players!winner_id(*),
      game_players(
        *,
        player:players(*)
      ),
      turns(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching game history:', error);
    return [];
  }

  return data;
} 