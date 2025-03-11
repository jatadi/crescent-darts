'use client';

import { createContext, useContext, useReducer } from 'react';
import { Player, GameType, GameSettings } from '@/types/game';
import { saveGameHistory } from '@/utils/db';

export interface GameState {
  gameType: GameType;
  settings: GameSettings;
  players: {
    id: string;
    name: string;
    score: number;
    current: boolean;
    cricketScores?: {
      [key: string]: {
        marks: number;  // 0-3 marks
        closed: boolean;
      }
    };
  }[];
  currentTurn: {
    playerId: string;
    dartsThrown: number;
    scores: number[];
  };
  gameOver: boolean;
  winnerId?: string;
  currentRound: number;
  maxRounds?: number;
  turns: {
    playerId: string;
    scores: number[];
  }[];
  playerStats: {
    [playerId: string]: {
      totalScore: number;
      dartsThrown: number;
    };
  };
}

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
        (action.settings.startingScore || 501) : 0;

      return {
        ...state,
        gameType: action.gameType,
        settings: action.settings,
        currentRound: 1,
        maxRounds: action.gameType === 'cricket' ? action.settings.rounds : undefined,
        players: action.players.map((player, index) => ({
          id: player.id,
          name: player.name,
          score: startingScore,
          current: index === 0,
          cricketScores: action.gameType === 'cricket' ? {
            '15': { marks: 0, closed: false },
            '16': { marks: 0, closed: false },
            '17': { marks: 0, closed: false },
            '18': { marks: 0, closed: false },
            '19': { marks: 0, closed: false },
            '20': { marks: 0, closed: false },
            'bull': { marks: 0, closed: false }
          } : undefined
        })),
        currentTurn: {
          playerId: action.players[0].id,
          dartsThrown: 0,
          scores: [],
        },
        gameOver: false,
        turns: [],
        playerStats: action.players.reduce((acc, player) => ({
          ...acc,
          [player.id]: { totalScore: 0, dartsThrown: 0 }
        }), {}),
      };
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
      const newScore = currentPlayer.score - action.score;

      // Always update stats for every throw
      const updatedStats = {
        ...state.playerStats,
        [currentTurn.playerId]: {
          totalScore: state.playerStats[currentTurn.playerId].totalScore + (action.score || 0),
          dartsThrown: state.playerStats[currentTurn.playerId].dartsThrown + 1
        }
      };

      // Handle bust conditions
      if (newScore < 0 || newScore === 1 || 
          (state.settings.doubleOut && newScore === 0 && action.baseScore * 2 !== action.score)) {
        // On bust, switch to next player immediately
        const currentPlayerIndex = state.players.findIndex(p => p.current);
        const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;

        return {
          ...state,
          players: state.players.map((player, index) => ({
            ...player,
            current: index === nextPlayerIndex
          })),
          currentTurn: {
            playerId: state.players[nextPlayerIndex].id,
            dartsThrown: 0,
            scores: []
          },
          turns: [...state.turns, { playerId: currentTurn.playerId, scores: newScores }],
          playerStats: updatedStats
        };
      }

      // Update players with new score
      const players = state.players.map(player => {
        if (player.id === currentTurn.playerId) {
          return { ...player, score: newScore };
        }
        return player;
      });

      // Check for win
      if (newScore === 0) {
        const finalState = {
          ...state,
          players: players.map(p => ({
            ...p,
            current: false
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
        };

        saveGameHistory(finalState).catch(console.error);
        return finalState;
      }

      // Auto switch after 3 darts
      if (dartsThrown === 3) {
        const currentPlayerIndex = state.players.findIndex(p => p.current);
        const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;

        return {
          ...state,
          players: players.map((player, index) => ({
            ...player,
            current: index === nextPlayerIndex
          })),
          currentTurn: {
            playerId: state.players[nextPlayerIndex].id,
            dartsThrown: 0,
            scores: []
          },
          turns: [...state.turns, { playerId: currentTurn.playerId, scores: newScores }],
          playerStats: updatedStats
        };
      }

      return {
        ...state,
        players,
        currentTurn: {
          ...currentTurn,
          dartsThrown,
          scores: newScores
        },
        playerStats: updatedStats
      };
    }

    case 'NEXT_PLAYER': {
      const currentPlayerIndex = state.players.findIndex(p => p.current);
      const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;

      return {
        ...state,
        players: state.players.map((player, index) => ({
          ...player,
          current: index === nextPlayerIndex,
        })),
        currentTurn: {
          playerId: state.players[nextPlayerIndex].id,
          dartsThrown: 0,
          scores: [],
        },
      };
    }

    case 'UNDO_SCORE': {
      if (state.currentTurn.scores.length === 0) return state;

      const lastScore = state.currentTurn.scores[state.currentTurn.scores.length - 1];
      const players = state.players.map(player => {
        if (player.id === state.currentTurn.playerId) {
          return { ...player, score: player.score + lastScore };
        }
        return player;
      });

      return {
        ...state,
        players,
        currentTurn: {
          ...state.currentTurn,
          dartsThrown: state.currentTurn.dartsThrown - 1,
          scores: state.currentTurn.scores.slice(0, -1),
        },
      };
    }

    default:
      return state;
  }
}

// Helper function for cricket scoring
function handleCricketScore(state: GameState, action: { score: number; baseScore: number }) {
  const currentTurn = state.currentTurn;
  const dartsThrown = currentTurn.dartsThrown + 1;
  const currentPlayer = state.players.find(p => p.id === currentTurn.playerId)!;
  const newScores = [...currentTurn.scores, action.score];

  // Cricket scoring logic here...
  const updatedPlayers = state.players.map(player => {
    if (player.id === currentTurn.playerId) {
      const scores = { ...player.cricketScores };
      const key = action.baseScore === 25 || action.baseScore === 50 ? 'bull' : action.baseScore.toString();
      const marksToAdd = action.baseScore === 50 ? 2 : action.score / action.baseScore;

      if (scores[key]) {
        scores[key].marks = Math.min(3, scores[key].marks + marksToAdd);
        scores[key].closed = scores[key].marks >= 3;
      }

      return {
        ...player,
        cricketScores: scores
      };
    }

    if (currentPlayer.cricketScores?.[action.baseScore.toString()]?.closed &&
        !player.cricketScores?.[action.baseScore.toString()]?.closed) {
      return {
        ...player,
        score: player.score + action.score
      };
    }

    return player;
  });

  // Auto switch after 3 darts
  if (dartsThrown === 3) {
    const currentPlayerIndex = state.players.findIndex(p => p.current);
    const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
    const nextRound = currentPlayerIndex === state.players.length - 1 ? 
      state.currentRound + 1 : state.currentRound;

    return {
      ...state,
      currentRound: nextRound,
      players: updatedPlayers.map((player, index) => ({
        ...player,
        current: index === nextPlayerIndex,
      })),
      currentTurn: {
        playerId: state.players[nextPlayerIndex].id,
        dartsThrown: 0,
        scores: [],
      },
      turns: [...state.turns, { playerId: currentTurn.playerId, scores: newScores }],
    };
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
    settings: {},
    players: [],
    currentTurn: {
      playerId: '',
      dartsThrown: 0,
      scores: [],
    },
    gameOver: false,
    turns: [],
    playerStats: {},
    currentRound: 1
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