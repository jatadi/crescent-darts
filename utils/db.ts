import { supabase } from './supabase';
import { Player, GameState, X01Settings } from '@/types/game';
import { createClient } from '@supabase/supabase-js';

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function addPlayer(name: string, photoBlob?: Blob | null): Promise<Player | null> {
  let photoUrl;
  if (photoBlob) {
    // First create player to get ID
    const { data: player, error } = await supabase
      .from('players')
      .insert([{ name }])
      .select()
      .single();

    if (error || !player) {
      console.error('Error creating player:', error);
      return null;
    }

    // Then upload photo and update player
    photoUrl = await uploadPlayerPhoto(player.id, photoBlob);
  }

  // Create player without photo or update existing player with photo
  const { data, error } = await supabase
    .from('players')
    .upsert([
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
    // First insert game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({
        game_type: gameState.gameType,
        starting_score: gameState.gameType === 'x01' ? 
          (gameState.settings as X01Settings).startingScore : null,
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