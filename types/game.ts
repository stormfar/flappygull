// Game-related type definitions

export interface GameConfig {
  width: number;
  height: number;
  gravity: number;
  flapPower: number;
  scrollSpeed: number;
  obstacleSpacing: number;
  obstacleGapSize: number;
}

export interface PlayerState {
  id: string;
  name: string;
  x: number;
  y: number;
  velocityY: number;
  distance: number;
  isAlive: boolean;
  animation: 'flap_up' | 'flap_mid' | 'flap_down' | 'death';
}

export interface GameState {
  matchId: string;
  roundNumber: number;
  matchTimeRemaining: number;
  players: PlayerState[];
  localPlayerId: string;
}

export interface ScoreData {
  distance: number;
  tokensCollected: number;
  bestRound: number;
  totalDistance: number;
  deaths: number;
}
