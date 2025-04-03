'use client';

import { createContext, useContext, useReducer } from 'react';
import { 
  Player, 
  GameType, 
  GameSettings,
  X01Settings, 
  CricketSettings,
  X01PlayerState,
  CricketPlayerState,
  GameState
} from '@/types/game';
import { saveGameHistory } from '@/utils/db';

type GameAction =
  | { type: 'ADD_SCORE'; score: number; baseScore: number }
  | { type: 'UNDO_SCORE' }
  | { type: 'NEXT_PLAYER' }
  | { type: 'START_GAME'; players: Player[]; gameType: GameType; settings: GameSettings }
  | { type: 'ADJUST_SCORE'; playerId: string; newScore: number };

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
          stats: { totalScore: 0, dartsThrown: 0 },
          finished: false,
          redemptionStatus: null,
          eliminated: false
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
          }), {}),
          firstFinishedPlayerId: null,
          redemptionMode: false,
          overtime: false,
          overtimeRound: 0
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
      if (newScore < 0 || 
          (state.gameType === 'x01' && (state.settings as X01Settings).doubleOut && 
           newScore === 0 && action.baseScore * 2 !== action.score)) {
        const currentPlayerIndex = state.players.findIndex(p => p.current);
        const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;

        // If in redemption mode, eliminate the player who busted
        if (state.redemptionMode) {
          const firstFinisherIndex = state.players.findIndex(p => p.id === state.firstFinishedPlayerId);
          const isRedemptionRoundComplete = nextPlayerIndex <= firstFinisherIndex;

          // Mark current player as eliminated and check if redemption round is complete
          const updatedPlayers = state.players.map((player, index) => ({
            ...player,
            current: index === nextPlayerIndex,
            eliminated: player.id === currentTurn.playerId ? true : (player as X01PlayerState).eliminated,
            score: player.id === currentTurn.playerId ? turnStartScore : player.score
          })) as X01PlayerState[];

          if (isRedemptionRoundComplete) {
            // Check if anyone hit their redemption shot
            const hasRedemptionFinishers = updatedPlayers.some(p => 
              p.id !== state.firstFinishedPlayerId && p.finished
            );

            if (hasRedemptionFinishers) {
              // At least one player hit their redemption shot - enter overtime
              // Include both pole position player and redemption finishers
              return {
                ...state,
                players: updatedPlayers.map((player, index) => ({
                  ...player,
                  current: player.id === state.firstFinishedPlayerId, // Start with pole position player
                  score: player.finished ? 101 : player.score, // Reset all finishers to 101
                  finished: false // Reset finished state for overtime
                })),
                overtime: true,
                redemptionMode: false,
                currentTurn: {
                  playerId: state.firstFinishedPlayerId!, // Start with pole position player
                  dartsThrown: 0,
                  scores: []
                },
                turns: [...state.turns, { playerId: currentTurn.playerId, scores: newScores }],
                playerStats: updatedStats
              } as GameState;
            } else {
              // No one hit their redemption shot - pole position player wins
              const finalState = {
                ...state,
                players: updatedPlayers.map(p => ({
                  ...p,
                  current: false
                })),
                gameOver: true,
                winnerId: state.firstFinishedPlayerId,
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
          }

          return {
            ...state,
            players: updatedPlayers,
            currentTurn: {
              playerId: state.players[nextPlayerIndex].id,
              dartsThrown: 0,
              scores: []
            },
            turns: [...state.turns, { playerId: currentTurn.playerId, scores: newScores }],
            playerStats: updatedStats
          } as GameState;
        }

        // Regular bust handling (not in redemption mode)
        return {
          ...state,
          players: (state.players as X01PlayerState[]).map((player, index) => ({
            ...player,
            current: index === nextPlayerIndex,
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

      // Check for finish (score reaches 0)
      if (newScore === 0) {
        const currentPlayerIndex = state.players.findIndex(p => p.current);
        const isLastPlayer = currentPlayerIndex === state.players.length - 1;

        // First player to finish in the game
        if (!state.firstFinishedPlayerId) {
          // If last player finishes first, they win immediately
          if (isLastPlayer) {
            const finalState = {
              ...state,
              players: state.players.map(p => ({
                ...p,
                current: false,
                finished: p.id === currentTurn.playerId
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

          // Not last player - enter redemption mode for players after current player
          return {
            ...state,
            players: state.players.map((player, index) => ({
              ...player,
              current: index === currentPlayerIndex + 1,
              finished: player.id === currentTurn.playerId,
              eliminated: index < currentPlayerIndex // Only eliminate players before the first finisher
            })),
            redemptionMode: true,
            firstFinishedPlayerId: currentTurn.playerId,
            currentTurn: {
              playerId: state.players[currentPlayerIndex + 1].id,
              dartsThrown: 0,
              scores: []
            },
            turns: [...state.turns, { playerId: currentTurn.playerId, scores: newScores }],
            playerStats: updatedStats
          } as GameState;
        }
        
        // Player finishes during redemption mode
        if (state.redemptionMode) {
          // Save current turn state
          const currentTurnState = {
            ...currentTurn,
            dartsThrown,
            scores: newScores
          };

          const firstFinisherIndex = state.players.findIndex(p => p.id === state.firstFinishedPlayerId);
          const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
          const isRedemptionRoundComplete = isLastPlayer || nextPlayerIndex <= firstFinisherIndex;

          // Mark current player as finished
          const updatedPlayers = state.players.map((player, index) => ({
            ...player,
            finished: player.id === currentTurn.playerId ? true : (player as X01PlayerState).finished
          })) as X01PlayerState[];

          // Count finished players
          const finishedPlayers = (updatedPlayers as X01PlayerState[]).filter(p => p.finished).length;

          if (isRedemptionRoundComplete) {
            if (finishedPlayers > 1) {
              // Multiple players finished - enter overtime
              return {
                ...state,
                players: updatedPlayers.map((player, index) => ({
                  ...player,
                  current: player.finished && index === firstFinisherIndex,
                  eliminated: !player.finished,
                  score: player.finished ? 101 : player.score // Reset finished players to 101
                })),
                overtime: true,
                redemptionMode: false,
                currentTurn: {
                  playerId: state.firstFinishedPlayerId!,
                  dartsThrown: 0,
                  scores: []
                },
                turns: [...state.turns, { playerId: currentTurn.playerId, scores: currentTurnState.scores }],
                playerStats: updatedStats
              } as GameState;
            } else {
              // Only first finisher succeeded - they win
              const finalState = {
                ...state,
                players: updatedPlayers.map(p => ({
                  ...p,
                  current: false,
                  eliminated: !p.finished
                })),
                gameOver: true,
                winnerId: state.firstFinishedPlayerId,
                currentTurn: currentTurnState,
                turns: [...state.turns, { playerId: currentTurn.playerId, scores: currentTurnState.scores }],
                playerStats: updatedStats
              } as GameState;

              saveGameHistory(finalState).catch(console.error);
              return finalState;
            }
          }

          // Continue redemption round - next player's turn
          return {
            ...state,
            players: updatedPlayers.map((player, index) => ({
              ...player,
              current: index === nextPlayerIndex
            })),
            currentTurn: {
              playerId: state.players[nextPlayerIndex].id,
              dartsThrown: 0,
              scores: []
            },
            turns: [...state.turns, { playerId: currentTurn.playerId, scores: currentTurnState.scores }],
            playerStats: updatedStats
          } as GameState;
        }
        
        // Player finishes during overtime - they win immediately
        if (state.overtime) {
          const finalState = {
            ...state,
            players: state.players.map(p => ({
              ...p,
              current: false
            })) as X01PlayerState[],
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

        // Update player states
        const updatedPlayers = (state.players as X01PlayerState[]).map((player, index) => {
          const isCurrentPlayer = player.id === currentTurn.playerId;
          const firstFinisherIndex = state.firstFinishedPlayerId ? 
            state.players.findIndex(p => p.id === state.firstFinishedPlayerId) : 
            currentPlayerIndex;
          
          // Determine next player - skip eliminated players
          let isCurrent = false;
          if (!state.gameOver) {
            let nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
            // Skip eliminated players
            while (nextPlayerIndex !== currentPlayerIndex && 
                   (index < firstFinisherIndex || player.eliminated)) {
              nextPlayerIndex = (nextPlayerIndex + 1) % state.players.length;
            }
            isCurrent = index === nextPlayerIndex;
          }

          return {
            ...player,
            score: isCurrentPlayer ? newScore : player.score,
            current: isCurrent,
            finished: isCurrentPlayer ? true : player.finished,
            eliminated: index < firstFinisherIndex || player.eliminated,
            redemptionStatus: isCurrentPlayer ? 
              (!state.firstFinishedPlayerId ? 'pole_position' : 'redemption') : 
              (state.redemptionMode && !player.finished && !player.eliminated ? 'on_the_bubble' : player.redemptionStatus)
          } as X01PlayerState;
        });

        // If game is over, save the history
        if (state.gameOver) {
          const finalState = {
            ...state,
            players: updatedPlayers,
            gameOver: true,
            winnerId: state.winnerId,
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

        // Continue game
        const nextPlayer = updatedPlayers.find(p => p.current);
        return {
          ...state,
          players: updatedPlayers,
          gameOver: false,
          redemptionMode: true,
          overtime: false,
          firstFinishedPlayerId: currentTurn.playerId,
          currentTurn: {
            playerId: nextPlayer?.id || state.players[0].id,
            dartsThrown: 0,
            scores: []
          },
          turns: [...state.turns, { playerId: currentTurn.playerId, scores: newScores }],
          playerStats: updatedStats
        } as GameState;
      }

      // Auto switch after 3 darts
      if (dartsThrown === 3) {
        const currentPlayerIndex = state.players.findIndex(p => p.current);
        const isLastPlayer = currentPlayerIndex === state.players.length - 1;
        
        // Save the current turn before switching players
        const currentTurnState = {
          ...currentTurn,
          dartsThrown,
          scores: newScores
        };

        // Check if we need to end redemption mode
        if (state.redemptionMode) {
          const firstFinisherIndex = state.players.findIndex(p => p.id === state.firstFinishedPlayerId);
          const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
          const isRedemptionRoundComplete = isLastPlayer || nextPlayerIndex <= firstFinisherIndex;

          // If player used all 3 darts without finishing, they're eliminated
          const updatedPlayers = state.players.map((player, index) => ({
            ...player,
            current: index === nextPlayerIndex,
            eliminated: player.id === currentTurn.playerId ? true : (player as X01PlayerState).eliminated,
            score: player.id === currentTurn.playerId ? newScore : player.score
          })) as X01PlayerState[];

          if (isRedemptionRoundComplete) {
            // Check if anyone hit their redemption shot
            const hasRedemptionFinishers = updatedPlayers.some(p => 
              p.id !== state.firstFinishedPlayerId && p.finished
            );

            if (hasRedemptionFinishers) {
              // At least one player hit their redemption shot - enter overtime
              // Include both pole position player and redemption finishers
              return {
                ...state,
                players: updatedPlayers.map((player, index) => ({
                  ...player,
                  current: player.id === state.firstFinishedPlayerId, // Start with pole position player
                  score: player.finished ? 101 : player.score, // Reset all finishers to 101
                  finished: false // Reset finished state for overtime
                })),
                overtime: true,
                redemptionMode: false,
                currentTurn: {
                  playerId: state.firstFinishedPlayerId!, // Start with pole position player
                  dartsThrown: 0,
                  scores: []
                },
                turns: [...state.turns, { playerId: currentTurn.playerId, scores: currentTurnState.scores }],
                playerStats: updatedStats
              } as GameState;
            } else {
              // No one hit their redemption shot - pole position player wins
              const finalState = {
                ...state,
                players: updatedPlayers.map(p => ({
                  ...p,
                  current: false,
                  eliminated: !p.finished
                })),
                gameOver: true,
                winnerId: state.firstFinishedPlayerId,
                currentTurn: currentTurnState,
                turns: [...state.turns, { playerId: currentTurn.playerId, scores: currentTurnState.scores }],
                playerStats: updatedStats
              } as GameState;

              saveGameHistory(finalState).catch(console.error);
              return finalState;
            }
          }

          return {
            ...state,
            players: updatedPlayers,
            currentTurn: {
              playerId: state.players[nextPlayerIndex].id,
              dartsThrown: 0,
              scores: []
            },
            turns: [...state.turns, { playerId: currentTurn.playerId, scores: currentTurnState.scores }],
            playerStats: updatedStats
          } as GameState;
        }

        // Handle overtime mode
        if (state.overtime) {
          // Find the next player who is in overtime (score of 101 or less)
          let nextPlayerIndex = currentPlayerIndex;
          let nextPlayerFound = false;
          
          // Loop through the players starting from the current player
          for (let i = 1; i <= state.players.length; i++) {
            const candidateIndex = (currentPlayerIndex + i) % state.players.length;
            const candidatePlayer = state.players[candidateIndex];
            
            // In overtime, players are active if they started at 101 (were finishers)
            if (candidatePlayer.score <= 101) {
              nextPlayerIndex = candidateIndex;
              nextPlayerFound = true;
              break;
            }
          }

          // If no next player found, game should be over (shouldn't happen)
          if (!nextPlayerFound) {
            const finalState = {
              ...state,
              players: state.players.map(p => ({
                ...p,
                current: false
              })),
              gameOver: true,
              winnerId: currentTurn.playerId,
              currentTurn: currentTurnState,
              turns: [...state.turns, { playerId: currentTurn.playerId, scores: currentTurnState.scores }],
              playerStats: updatedStats
            } as GameState;

            saveGameHistory(finalState).catch(console.error);
            return finalState;
          }

          // Continue overtime - next player's turn
          return {
            ...state,
            players: state.players.map((player, index) => ({
              ...player,
              current: index === nextPlayerIndex,
              score: player.id === currentTurn.playerId ? newScore : player.score
            })),
            currentTurn: {
              playerId: state.players[nextPlayerIndex].id,
              dartsThrown: 0,
              scores: []
            },
            turns: [...state.turns, { playerId: currentTurn.playerId, scores: currentTurnState.scores }],
            playerStats: updatedStats
          } as GameState;
        }

        // Normal play (not overtime or end of redemption)
        const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
        
        // Increment round when we've gone through all players
        const nextRound = nextPlayerIndex === 0 ? 
          state.currentRound + 1 : 
          state.currentRound;

        // Check if game should end (in cricket)
        const maxRounds = (state.gameType as GameType) === 'cricket' ? 
          ((state.settings as CricketSettings).rounds || 20) : undefined;
        const gameOver = maxRounds !== undefined && nextRound > maxRounds;

        return {
          ...state,
          currentRound: nextRound,
          gameOver,
          players: state.players.map((player, index) => ({
            ...player,
            current: gameOver ? false : index === nextPlayerIndex,
            score: player.id === currentTurn.playerId ? newScore : player.score
          })),
          currentTurn: {
            playerId: state.players[nextPlayerIndex].id,
            dartsThrown: 0,
            scores: []
          },
          turns: [...state.turns, { playerId: currentTurn.playerId, scores: currentTurnState.scores }],
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
      
      // Handle overtime mode differently
      if (state.overtime) {
        // Find the next qualified player (who finished during redemption)
        let nextPlayerIndex = currentPlayerIndex;
        let nextPlayerFound = false;
        
        // Loop through the players starting from the current player
        for (let i = 1; i <= state.players.length; i++) {
          const candidateIndex = (currentPlayerIndex + i) % state.players.length;
          const candidatePlayer = state.players[candidateIndex];
          
          // Check if this player is qualified (they finished during redemption)
          if ('finished' in candidatePlayer && candidatePlayer.finished) {
            nextPlayerIndex = candidateIndex;
            nextPlayerFound = true;
            break;
          }
        }
        
        // If no next player was found (shouldn't happen), just use the first player
        if (!nextPlayerFound) {
          nextPlayerIndex = state.players.findIndex(p => 'finished' in p && p.finished);
          if (nextPlayerIndex === -1) nextPlayerIndex = 0;
        }
        
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
        } as GameState;
      }

      // Regular play (not overtime)
      const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
      
      // Increment round when we've gone through all players
      const nextRound = nextPlayerIndex === 0 ? 
        state.currentRound + 1 : 
        state.currentRound;

      // Check if game should end (in cricket)
      const maxRounds = (state.gameType as GameType) === 'cricket' ? 
        ((state.settings as CricketSettings).rounds || 20) : undefined;
      const gameOver = maxRounds !== undefined && nextRound > maxRounds;

      return {
        ...state,
        currentRound: nextRound,
        gameOver,
        players: state.players.map((player, index) => ({
          ...player,
          current: gameOver ? false : index === nextPlayerIndex,
        })),
        currentTurn: {
          playerId: state.players[nextPlayerIndex].id,
          dartsThrown: 0,
          scores: [],
        },
      } as GameState;
    }

    case 'UNDO_SCORE': {
      if (state.currentTurn.scores.length === 0) return state;

      if (state.gameType === 'cricket') {
        const lastScore = state.currentTurn.scores[state.currentTurn.scores.length - 1];
        const marksHit = lastScore === 50 ? 2 : Math.ceil(lastScore / 25);
        const lastBaseScore = lastScore / marksHit;
        const key = lastBaseScore === 25 ? 'bull' : lastBaseScore.toString();
        
        const currentPlayer = state.players.find(p => p.id === state.currentTurn.playerId) as CricketPlayerState;
        const previousMarks = currentPlayer.cricketScores[key].marks;
        const newMarks = previousMarks - marksHit;
        
        // Calculate if this shot caused overflow points
        const hadOverflowBefore = previousMarks > 3;
        const causedOverflow = previousMarks <= 3 && newMarks + marksHit > 3;
        const overflowPoints = causedOverflow ? lastBaseScore : 0;

        // Update players
        const updatedPlayers = state.players.map(player => {
          if (player.id === state.currentTurn.playerId) {
            return {
              ...player,
              cricketScores: {
                ...(player as CricketPlayerState).cricketScores,
                [key]: {
                  marks: newMarks,
                  closed: newMarks >= 3
                }
              }
            } as CricketPlayerState;
          } else if (causedOverflow && 'cricketScores' in player && !player.cricketScores[key].closed) {
            // Only revert points if this shot caused the overflow
            return {
              ...player,
              score: player.score - overflowPoints
            } as CricketPlayerState;
          }
          return player;
        }) as CricketPlayerState[];

        return {
          ...state,
          players: updatedPlayers,
          currentTurn: {
            ...state.currentTurn,
            dartsThrown: state.currentTurn.dartsThrown - 1,
            scores: state.currentTurn.scores.slice(0, -1),
          },
        };
      }

      // Handle X01 undo as before
      const lastScore = state.currentTurn.scores[state.currentTurn.scores.length - 1];
      return {
        ...state,
        players: (state.players as X01PlayerState[]).map(player => ({
          ...player,
          score: player.id === state.currentTurn.playerId ? player.score + lastScore : player.score
        })),
        currentTurn: {
          ...state.currentTurn,
          dartsThrown: state.currentTurn.dartsThrown - 1,
          scores: state.currentTurn.scores.slice(0, -1),
        },
      };
    }

    case 'ADJUST_SCORE': {
      return {
        ...state,
        players: state.players.map(player => 
          player.id === action.playerId 
            ? { ...player, score: action.newScore }
            : player
        ),
      };
    }

    default:
      return state;
  }
}

// Helper function for cricket scoring
function handleCricketScore(state: GameState, action: { type: 'ADD_SCORE'; score: number; baseScore: number }): GameState {
  if (state.gameType !== 'cricket') return state;

  const currentTurn = state.currentTurn;
  const dartsThrown = currentTurn.dartsThrown + 1;
  const newScores = [...currentTurn.scores, action.score];

  // Calculate targets hit for this throw
  let targetsHit = 0;
  if (['15', '16', '17', '18', '19', '20', 'bull'].includes(
    action.baseScore === 25 || action.baseScore === 50 ? 'bull' : action.baseScore.toString()
  )) {
    targetsHit = action.baseScore === 25 || action.baseScore === 50 ? 
      (action.score / 25) : // For bulls (25 or 50)
      (action.score / action.baseScore); // For regular numbers (e.g., T20 = 3 targets)
  }

  // Update player stats with targets hit
  const updatedStats = {
    ...state.playerStats,
    [currentTurn.playerId]: {
      totalScore: state.playerStats[currentTurn.playerId].totalScore + action.score,
      dartsThrown: state.playerStats[currentTurn.playerId].dartsThrown + 1,
      targetsHit: (state.playerStats[currentTurn.playerId].targetsHit || 0) + targetsHit
    }
  };

  // Update players with new scores
  let updatedPlayers = state.players;
  if (['15', '16', '17', '18', '19', '20', 'bull'].includes(
    action.baseScore === 25 || action.baseScore === 50 ? 'bull' : action.baseScore.toString()
  )) {
    const currentPlayer = state.players.find(p => p.id === currentTurn.playerId) as CricketPlayerState;
    const key = action.baseScore === 25 || action.baseScore === 50 ? 'bull' : action.baseScore.toString();
    
    const marksToAdd = action.baseScore === 50 ? 2 : action.score / action.baseScore;

    // Update players with new scores
    updatedPlayers = state.players.map(player => {
      if (player.id === currentTurn.playerId) {
        const cricketPlayer = player as CricketPlayerState;
        const currentMarks = cricketPlayer.cricketScores[key].marks;
        const newMarks = Math.min(currentMarks + marksToAdd, 3);
        const overflowMarks = Math.max(0, currentMarks + marksToAdd - 3);

        return {
          ...cricketPlayer,
          cricketScores: {
            ...cricketPlayer.cricketScores,
            [key]: {
              marks: newMarks,
              closed: newMarks >= 3
            }
          }
        };
      }
      return player as CricketPlayerState;
    }) as CricketPlayerState[];

    // Calculate and apply points for overflow marks
    if (marksToAdd > 0) {
      const currentMarks = (currentPlayer as CricketPlayerState).cricketScores[key].marks;
      const newMarks = currentMarks + marksToAdd;
      
      // Calculate how many marks exceed 3 (overflow)
      const overflowMarks = Math.max(0, newMarks - 3);
      
      // Only add points if there are overflow marks (marks beyond 3)
      if (overflowMarks > 0) {
        const pointsToAdd = action.baseScore * overflowMarks;
        // Add points to players who haven't closed the number
        updatedPlayers = updatedPlayers.map(p => ({
          ...p,
          score: p.id !== currentTurn.playerId && 'cricketScores' in p && !p.cricketScores[key].closed ? 
            p.score + pointsToAdd : p.score
        }));
      }
    }
  }

  // Check if current player has won
  const currentPlayer = updatedPlayers.find(p => p.id === currentTurn.playerId) as CricketPlayerState;
  const hasClosedAll = Object.values(currentPlayer.cricketScores).every(score => score.closed);
  const hasLowestScore = updatedPlayers.every(p => p.id === currentTurn.playerId || p.score >= currentPlayer.score);
  
  if (hasClosedAll && hasLowestScore) {
    const finalState = {
      ...state,
      players: updatedPlayers.map(p => ({
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
    
    // Increment round when we've gone through all players
    const nextRound = nextPlayerIndex === 0 ? 
      state.currentRound + 1 : 
      state.currentRound;

    // Check if game should end (max rounds reached)
    const gameOver = nextRound > (state.settings as CricketSettings).rounds;

    return {
      ...state,
      currentRound: nextRound,
      gameOver,
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
      playerStats: updatedStats
    };
  }

  // Continue current player's turn
  return {
    ...state,
    players: updatedPlayers,
    currentTurn: {
      ...currentTurn,
      dartsThrown,
      scores: newScores,
    },
    playerStats: updatedStats
  };
}

// Helper function to get all players after a specific index in circular order
function getAllPlayersAfterIndex(startIndex: number, players: (X01PlayerState | CricketPlayerState)[]): (X01PlayerState | CricketPlayerState)[] {
  if (startIndex === -1 || players.length === 0) return [];
  
  const result: (X01PlayerState | CricketPlayerState)[] = [];
  for (let i = startIndex + 1; i < players.length; i++) {
    result.push(players[i]);
  }
  return result;
}

// Helper function to check if a number is closed by other players
function isNumberClosedByOthers(
  number: string, 
  players: CricketPlayerState[], 
  currentPlayerId: string
): boolean {
  return players.every(player => 
    player.id === currentPlayerId || player.cricketScores[number].closed
  );
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
    winnerId: undefined,
    firstFinishedPlayerId: null,
    redemptionMode: false,
    overtime: false,
    overtimeRound: 0
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