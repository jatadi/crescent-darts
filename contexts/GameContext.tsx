'use client';

import { createContext, useContext, useReducer } from 'react';
import { 
  Player, 
  GameType, 
  GameSettings, 
  GameState, 
  X01Settings, 
  CricketSettings,
  X01PlayerState,
  CricketPlayerState 
} from '@/types/game';
import { saveGameHistory } from '@/utils/db';

type GameAction =
  | { type: 'ADD_SCORE'; score: number; baseScore: number }
  | { type: 'UNDO_SCORE' }
  | { type: 'NEXT_PLAYER' }
  | { type: 'START_GAME'; players: Player[]; gameType: GameType; settings: GameSettings };

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const startingScore = action.gameType === 'x01' ? 
        ((action.settings as X01Settings).startingScore || 501) : 0;

      if (action.gameType === 'x01') {
        const players = action.players.map((player, index) => ({
          ...player,
          score: startingScore,
          current: index === 0,
          stats: { totalScore: 0, dartsThrown: 0 }
        })) as X01PlayerState[];

        return {
          ...state,
          gameType: 'x01' as const,
          settings: action.settings,
          currentRound: 1,
          maxRounds: undefined,
          players,
          currentTurn: {
            playerId: players[0].id,
            dartsThrown: 0,
            scores: [],
          },
          gameOver: false,
          turns: [],
          playerStats: players.reduce((acc, player) => ({
            ...acc,
            [player.id]: { totalScore: 0, dartsThrown: 0 }
          }), {})
        } as GameState;
      } else {
        const players = action.players.map((player, index) => ({
          ...player,
          score: startingScore,
          current: index === 0,
          cricketScores: {
            '15': { marks: 0, closed: false },
            '16': { marks: 0, closed: false },
            '17': { marks: 0, closed: false },
            '18': { marks: 0, closed: false },
            '19': { marks: 0, closed: false },
            '20': { marks: 0, closed: false },
            'bull': { marks: 0, closed: false }
          }
        })) as CricketPlayerState[];

        return {
          ...state,
          gameType: 'cricket' as const,
          settings: action.settings,
          currentRound: 1,
          maxRounds: (action.settings as CricketSettings).rounds,
          players,
          currentTurn: {
            playerId: players[0].id,
            dartsThrown: 0,
            scores: [],
          },
          gameOver: false,
          turns: [],
          playerStats: players.reduce((acc, player) => ({
            ...acc,
            [player.id]: { totalScore: 0, dartsThrown: 0 }
          }), {})
        } as GameState;
      }
    }

    case 'ADD_SCORE': {
      if (state.gameType === 'cricket') {
        return handleCricketScore(state, action);
      }

      if (state.gameOver) return state;

      const currentTurn = state.currentTurn;
      const newScores = [...currentTurn.scores, action.score];
      const dartsThrown = currentTurn.dartsThrown + 1;
      const currentPlayer = state.players.find(p => p.id === currentTurn.playerId)!;
      
      // Get starting score for the turn
      const turnStartScore = currentTurn.dartsThrown === 0 ? 
        currentPlayer.score : 
        currentPlayer.score + currentTurn.scores.reduce((sum, score) => sum + score, 0);
      
      const newScore = currentPlayer.score - action.score;

      // Update stats before any return conditions
      const updatedStats = {
        ...state.playerStats,
        [currentTurn.playerId]: {
          totalScore: state.playerStats[currentTurn.playerId].totalScore + action.score,
          dartsThrown: state.playerStats[currentTurn.playerId].dartsThrown + 1
        }
      };

      // Handle bust conditions
      if (newScore < 0 || newScore === 1 || 
          (state.settings.doubleOut && newScore === 0 && action.baseScore * 2 !== action.score)) {
        const currentPlayerIndex = state.players.findIndex(p => p.current);
        const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;

        return {
          ...state,
          players: (state.players as X01PlayerState[]).map((player, index) => ({
            ...player,
            current: index === nextPlayerIndex,
            // Reset score to start of turn if current player
            score: player.id === currentTurn.playerId ? turnStartScore : player.score
          })),
          currentTurn: {
            playerId: state.players[nextPlayerIndex].id,
            dartsThrown: 0,
            scores: []
          },
          turns: [...state.turns, { playerId: currentTurn.playerId, scores: newScores }],
          playerStats: updatedStats
        } as GameState;
      }

      // Check for win
      if (newScore === 0) {
        const finalState = {
          ...state,
          players: (state.players as X01PlayerState[]).map(p => ({
            ...p,
            current: false,
            score: p.id === currentTurn.playerId ? newScore : p.score
          })),
          gameOver: true,
          winnerId: currentTurn.playerId,
          currentTurn: {
            ...currentTurn,
            dartsThrown,
            scores: newScores
          },
          turns: [...state.turns, { playerId: currentTurn.playerId, scores: newScores }],
          playerStats: updatedStats
        } as GameState;

        saveGameHistory(finalState).catch(console.error);
        return finalState;
      }

      // Auto switch after 3 darts
      if (dartsThrown === 3) {
        const currentPlayerIndex = state.players.findIndex(p => p.current);
        const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;

        return {
          ...state,
          players: (state.players as X01PlayerState[]).map((player, index) => ({
            ...player,
            current: index === nextPlayerIndex,
            score: player.id === currentTurn.playerId ? newScore : player.score
          })),
          currentTurn: {
            playerId: state.players[nextPlayerIndex].id,
            dartsThrown: 0,
            scores: []
          },
          turns: [...state.turns, { playerId: currentTurn.playerId, scores: newScores }],
          playerStats: updatedStats
        } as GameState;
      }

      // Regular score update
      return {
        ...state,
        players: (state.players as X01PlayerState[]).map(player => ({
          ...player,
          score: player.id === currentTurn.playerId ? newScore : player.score
        })),
        currentTurn: {
          ...currentTurn,
          dartsThrown,
          scores: newScores
        },
        playerStats: updatedStats
      } as GameState;
    }

    case 'NEXT_PLAYER': {
      const currentPlayerIndex = state.players.findIndex(p => p.current);
      const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;

      if (state.gameType === 'x01') {
        return {
          ...state,
          players: (state.players as X01PlayerState[]).map((player, index) => ({
            ...player,
            current: index === nextPlayerIndex,
          })),
          currentTurn: {
            playerId: state.players[nextPlayerIndex].id,
            dartsThrown: 0,
            scores: [],
          },
        } as GameState;
      } else {
        return {
          ...state,
          players: (state.players as CricketPlayerState[]).map((player, index) => ({
            ...player,
            current: index === nextPlayerIndex,
          })),
          currentTurn: {
            playerId: state.players[nextPlayerIndex].id,
            dartsThrown: 0,
            scores: [],
          },
        } as GameState;
      }
    }

    case 'UNDO_SCORE': {
      if (state.currentTurn.scores.length === 0) return state;

      const lastScore = state.currentTurn.scores[state.currentTurn.scores.length - 1];
      const players = state.gameType === 'x01' ?
        (state.players as X01PlayerState[]).map(player => ({
          ...player,
          score: player.id === state.currentTurn.playerId ? player.score + lastScore : player.score
        })) :
        (state.players as CricketPlayerState[]).map(player => ({
          ...player,
          score: player.id === state.currentTurn.playerId ? player.score + lastScore : player.score
        }));

      return {
        ...state,
        players,
        currentTurn: {
          ...state.currentTurn,
          dartsThrown: state.currentTurn.dartsThrown - 1,
          scores: state.currentTurn.scores.slice(0, -1),
        },
      } as GameState;
    }

    default:
      return state;
  }
}

// Helper function for cricket scoring
function handleCricketScore(state: GameState, action: { score: number; baseScore: number }) {
  if (state.gameType !== 'cricket') return state;

  const currentTurn = state.currentTurn;
  const dartsThrown = currentTurn.dartsThrown + 1;
  const currentPlayer = state.players.find(p => p.id === currentTurn.playerId)!;
  const newScores = [...currentTurn.scores, action.score];

  // Determine which number was hit
  const key = action.baseScore === 25 || action.baseScore === 50 ? 'bull' : action.baseScore.toString();
  const marksToAdd = action.baseScore === 50 ? 2 : action.score / action.baseScore;

  // Update players
  const updatedPlayers = state.players.map(player => {
    if (player.id === currentTurn.playerId) {
      const marks = { ...player.cricketScores };
      
      // Update marks for current player
      if (marks[key]) {
        const newMarks = Math.min(3, marks[key].marks + marksToAdd);
        marks[key] = {
          marks: newMarks,
          closed: newMarks >= 3
        };
      }

      return {
        ...player,
        cricketScores: marks
      };
    }

    // Add points to opponents if:
    // 1. Current player has closed the number
    // 2. This opponent hasn't closed it
    // 3. Current player hit the number after closing it
    if (currentPlayer.cricketScores?.[key]?.closed && 
        !player.cricketScores?.[key]?.closed && 
        currentPlayer.cricketScores?.[key]?.marks >= 3) {
      return {
        ...player,
        score: player.score + action.score
      };
    }

    return player;
  });

  // Check for game end conditions
  const isGameOver = () => {
    // End if max rounds reached
    if (state.currentRound >= state.settings.rounds) return true;

    // End if a player has closed all numbers and has lowest score
    const allNumbersClosed = (player: CricketPlayerState) => 
      Object.values(player.cricketScores).every(score => score.closed);

    const lowestScore = Math.min(...updatedPlayers.map(p => p.score));
    const winner = updatedPlayers.find(p => 
      allNumbersClosed(p as CricketPlayerState) && p.score === lowestScore
    );

    return !!winner;
  };

  // Auto switch after 3 darts
  if (dartsThrown === 3) {
    const currentPlayerIndex = state.players.findIndex(p => p.current);
    const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
    const nextRound = currentPlayerIndex === state.players.length - 1 ? 
      state.currentRound + 1 : state.currentRound;

    const gameOver = isGameOver();
    const winnerId = gameOver ? 
      updatedPlayers.reduce((lowest, p) => 
        p.score < lowest.score ? p : lowest
      ).id : undefined;

    const finalState = {
      ...state,
      currentRound: nextRound,
      gameOver,
      winnerId,
      players: updatedPlayers.map((player, index) => ({
        ...player,
        current: gameOver ? false : index === nextPlayerIndex,
      })),
      currentTurn: {
        playerId: state.players[nextPlayerIndex].id,
        dartsThrown: 0,
        scores: [],
      },
      turns: [...state.turns, { playerId: currentTurn.playerId, scores: newScores }],
    };

    if (gameOver) {
      saveGameHistory(finalState).catch(console.error);
    }

    return finalState;
  }

  return {
    ...state,
    players: updatedPlayers,
    currentTurn: {
      ...currentTurn,
      dartsThrown,
      scores: newScores,
    },
  };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, {
    gameType: 'x01',
    settings: {
      startingScore: 501,
      doubleOut: false
    },
    players: [],
    currentTurn: {
      playerId: '',
      dartsThrown: 0,
      scores: [],
    },
    gameOver: false,
    turns: [],
    playerStats: {},
    currentRound: 1,
    winnerId: undefined
  });

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
} 