// Common types
export type GameType = 'x01' | 'cricket';

export interface Player {
  id: string;
  name: string;
  photoUrl?: string;
  createdAt: Date;
}

// X01 specific types
export interface X01Settings {
  startingScore: number;
  doubleOut?: boolean;
}

export interface X01PlayerState {
  id: string;
  name: string;
  score: number;
  current: boolean;
  stats: {
    totalScore: number;
    dartsThrown: number;
  };
}

// Cricket specific types
export interface CricketSettings {
  rounds: 15 | 20;
}

export interface CricketPlayerState {
  id: string;
  name: string;
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
  gameOver: boolean;
  winnerId?: string;
  currentTurn: {
    playerId: string;
    dartsThrown: number;
    scores: number[];
  };
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
} & (
  | {
      gameType: 'x01';
      settings: X01Settings;
      players: X01PlayerState[];
    }
  | {
      gameType: 'cricket';
      settings: CricketSettings;
      players: CricketPlayerState[];
      currentRound: number;
    }
); 