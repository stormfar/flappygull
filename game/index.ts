import * as Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { PHASER_CONFIG } from './config';

export interface MatchConfig {
  matchId: string;
  seed: number;
  playerName: string;
  sessionId: string;
  duration?: number; // Match duration in seconds (default 60)
  hardMode?: boolean; // Hard mode: 20% speed increase instead of 10%
  onMatchEnd?: (matchId: string) => void;
}

export function initGame(containerId: string, matchConfig?: MatchConfig): Phaser.Game {
  // Create a custom scene class that will receive the matchConfig
  const GameSceneWithConfig = class extends GameScene {
    constructor() {
      super();
      if (matchConfig) {
        // Set config immediately in constructor before create() runs
        this.setMatchConfig(matchConfig);
      }
    }
  };

  const config: Phaser.Types.Core.GameConfig = {
    ...PHASER_CONFIG,
    parent: containerId,
    scene: [GameSceneWithConfig],
  };

  const game = new Phaser.Game(config);

  return game;
}

export function destroyGame(game: Phaser.Game | null): void {
  if (game) {
    game.destroy(true);
  }
}
