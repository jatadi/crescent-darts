// Common types
export type GameType = 'x01' | 'cricket';

export interface Player {
  id: string;
  name: string;
  photo_url?: string;
  createdAt: Date;
}

// X01 specific types
export interface X01Settings {
  startingScore: number;
  doubleOut: boolean;
}

export interface X01PlayerState {
  id: string;
  name: string;
  photo_url?: string;
  score: number;
  current: boolean;
  stats: {
    totalScore: number;
    dartsThrown: number;
  };
  finished: boolean;
  redemptionStatus: 'pole_position' | 'on_the_bubble' | 'redemption' | null;
}

// Cricket specific types
export interface CricketSettings {
  rounds: 15 | 20 | 25;
}

export interface CricketPlayerState {
  id: string;
  name: string;
  photo_url?: string;
  score: number;
  current: boolean;
  cricketScores: {
    [key: string]: {
      marks: number;
      closed: boolean;
    };
  };
}

// Game state types
export type GameState = {
  gameType: GameType;
  settings: GameSettings;
  players: (X01PlayerState | CricketPlayerState)[];
  currentTurn: {
    playerId: string;
    dartsThrown: number;
    scores: number[];
  };
  gameOver: boolean;
  turns: {
    playerId: string;
    scores: number[];
  }[];
  playerStats: {
    [playerId: string]: {
      totalScore: number;
      dartsThrown: number;
      targetsHit?: number;
    };
  };
  currentRound: number;
  maxRounds?: number;
  winnerId?: string;
  firstFinishedPlayerId?: string | null;
  redemptionMode: boolean;
  overtime: boolean;
};

// Add this to your existing types/game.ts
export type GameSettings = X01Settings | CricketSettings; 