import { supabase } from './supabase';
import { Player, GameState, X01Settings } from '@/types/game';
import { createClient } from '@supabase/supabase-js';

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface GamePlayerFromDB {
  player_id: string;
  final_score: number;
  total_score: number;
  darts_thrown: number;
  targets_hit?: number;
  cricket_scores?: any;
  player: {
    id: string;
    name: string;
    photo_url: string | null;
    created_at: string;
  };
}

interface GameFromDB {
  id: string;
  game_type: 'x01' | 'cricket';
  starting_score: number | null;
  winner_id: string | null;
  settings: any;
  created_at: string;
  game_players: {
    player_id: string;
    final_score: number;
    total_score: number;
    darts_thrown: number;
    targets_hit?: number;
    cricket_scores?: any;
    player: {
      id: string;
      name: string;
      photo_url: string | null;
      created_at: string;
    };
  }[];
}

interface GamePlayerDB {
  player_id: string;
  final_score: number;
  total_score: number;
  darts_thrown: number;
  targets_hit?: number;
  cricket_scores?: {
    [key: string]: {
      marks: number;
      closed: boolean;
    };
  };
  player: Player;
}

export async function addPlayer(name: string, photoBlob?: Blob | null): Promise<Player | null> {
  try {
    // First create the player
    const { data: player, error } = await supabase
      .from('players')
      .insert([{ name }])
      .select()
      .single();

    if (error || !player) {
      console.error('Error creating player:', error);
      return null;
    }

    // If we have a photo, upload it and update the player
    if (photoBlob) {
      const photoUrl = await uploadPlayerPhoto(player.id, photoBlob);
      if (photoUrl) {
        const { data: updatedPlayer, error: updateError } = await supabase
          .from('players')
          .update({ photo_url: photoUrl })
          .eq('id', player.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating player photo:', updateError);
          return player;
        }
        return updatedPlayer;
      }
    }

    return player;
  } catch (error) {
    console.error('Error in addPlayer:', error);
    return null;
  }
}

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('id, name, photo_url, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching players:', error);
    return [];
  }

  return data.map(player => ({
    ...player,
    photoUrl: player.photo_url,
    createdAt: new Date(player.created_at)
  })) as Player[];
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
    console.log('Saving game history for game type:', gameState.gameType);
    console.log('Game state:', JSON.stringify(gameState, null, 2));

    // First insert game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({
        game_type: gameState.gameType,
        starting_score: gameState.gameType === 'x01' ? 
          (gameState.settings as X01Settings).startingScore : 
          null,
        winner_id: gameState.winnerId,
        settings: gameState.settings,
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

    console.log('Game saved with ID:', game.id);

    // Save player stats
    const playerStats = gameState.players.map(player => {
      const stats = {
        game_id: game.id,
        player_id: player.id,
        final_score: player.score,
        darts_thrown: gameState.playerStats[player.id].dartsThrown,
        total_score: gameState.playerStats[player.id].totalScore,
        targets_hit: gameState.gameType === 'cricket' ? gameState.playerStats[player.id].targetsHit || 0 : null,
      };

      // For cricket games, also store the final cricket scores
      if (gameState.gameType === 'cricket' && 'cricketScores' in player) {
        return {
          ...stats,
          cricket_scores: player.cricketScores
        };
      }

      return stats;
    });

    console.log('Saving player stats:', JSON.stringify(playerStats, null, 2));

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

    console.log('Saving turns:', JSON.stringify(turns, null, 2));

    const { error: turnsError } = await supabase
      .from('turns')
      .insert(turns);

    if (turnsError) {
      console.error('Error saving turns:', turnsError.message, turnsError.details);
      return false;
    }

    console.log('Game history saved successfully');
    return true;
  } catch (error) {
    console.error('Unexpected error saving game:', error);
    return false;
  }
}

export async function getGameHistory() {
  console.log('Fetching game history...');
  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      winner:players!winner_id(*),
      game_players(
        player_id,
        final_score,
        total_score,
        darts_thrown,
        cricket_scores,
        player:players(
          id,
          name,
          photo_url,
          created_at
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching game history:', error);
    return [];
  }

  console.log('Raw data from Supabase:', JSON.stringify(data, null, 2));

  if (!data || data.length === 0) {
    console.log('No games found in database');
    return [];
  }

  // Check for potential duplicates
  const seenGames = new Set();
  const uniqueGames = data.filter(game => {
    // Create a unique key based on game properties
    const gameKey = `${game.created_at}_${game.game_type}_${game.winner_id}`;
    const isDuplicate = seenGames.has(gameKey);
    seenGames.add(gameKey);
    
    if (isDuplicate) {
      console.log('Found duplicate game:', gameKey);
    }
    return !isDuplicate;
  });

  console.log('Number of games before filtering:', data.length);
  console.log('Number of unique games:', uniqueGames.length);

  // Convert timestamps to EST and ensure proper data structure
  const formattedData = uniqueGames.map(game => {
    console.log('Processing game:', JSON.stringify(game, null, 2));
    
    if (!game.game_players || game.game_players.length === 0) {
      console.log('No game players found for game:', game.id);
    }

    const processed = {
      ...game,
      created_at: new Date(game.created_at).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      // Ensure game_players has the correct structure
      game_players: (game.game_players || []).map((gp: GamePlayerDB) => {
        console.log('Processing player:', JSON.stringify(gp, null, 2));
        
        // For cricket games, calculate total marks hit from cricket_scores
        let totalMarks = 0;
        if (game.game_type === 'cricket' && gp.cricket_scores) {
          totalMarks = Object.values(gp.cricket_scores).reduce((sum: number, score: any) => 
            sum + (score.marks || 0), 0);
        }

        return {
          player_id: gp.player_id,
          final_score: gp.final_score,
          total_score: game.game_type === 'cricket' ? totalMarks : gp.total_score,
          darts_thrown: gp.darts_thrown,
          cricket_scores: gp.cricket_scores,
          player: gp.player
        };
      })
    };

    console.log('Processed game:', JSON.stringify(processed, null, 2));
    return processed;
  });

  console.log('Final formatted data:', JSON.stringify(formattedData, null, 2));
  return formattedData;
}

export async function uploadPlayerPhoto(playerId: string, photoBlob: Blob): Promise<string | null> {
  try {
    // Create a unique filename
    const fileName = `${playerId}-${Date.now()}.jpg`;
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('player-photos')  // Make sure this bucket exists in Supabase
      .upload(fileName, photoBlob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      return null;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('player-photos')
      .getPublicUrl(fileName);

    // Update player record with photo URL
    const { error: updateError } = await supabase
      .from('players')
      .update({ photo_url: publicUrl })
      .eq('id', playerId);

    if (updateError) {
      console.error('Error updating player photo URL:', updateError);
      return null;
    }

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadPlayerPhoto:', error);
    return null;
  }
} 