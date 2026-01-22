import * as Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { PHASER_CONFIG } from './config';

export function initGame(containerId: string): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    ...PHASER_CONFIG,
    parent: containerId,
    scene: [GameScene],
  };

  return new Phaser.Game(config);
}

export function destroyGame(game: Phaser.Game | null): void {
  if (game) {
    game.destroy(true);
  }
}
