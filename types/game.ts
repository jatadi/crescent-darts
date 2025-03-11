export type GameType = 'x01' | 'cricket';

export interface Player {
  id: string;
  name: string;
  photoUrl?: string;
  createdAt: Date;
}

export interface Game {
  id: string;
  gameType: GameType;
  settings: GameSettings;
  status: 'active' | 'completed';
  winnerId?: string;
  createdAt: Date;
}

export interface GameSettings {
  startingScore?: number;
  doubleOut?: boolean;
  rounds?: number;
}

export interface Turn {
  id: string;
  gameId: string;
  playerId: string;
  scores: number[];
  createdAt: Date;
}

export interface CricketScore {
  [key: string]: {
    marks: number;  // 0-3 marks to close
    closed: boolean;
  };
}

export interface CricketSettings {
  rounds: 15 | 20;
} 