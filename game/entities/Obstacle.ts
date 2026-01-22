import * as Phaser from 'phaser';
import { OBSTACLE, GAME_CONFIG } from '../config';

export class Obstacle {
  public topPipe: Phaser.GameObjects.TileSprite;
  public bottomPipe: Phaser.GameObjects.TileSprite;
  public passed: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    gapY: number,
    gapSize: number
  ) {
    // Randomly choose villa style for variety
    const villaStyles = ['villa_tile', 'villa_tile_alt', 'villa_tile_alt2'];
    const topStyle = villaStyles[Math.floor(Math.random() * villaStyles.length)];
    const bottomStyle = villaStyles[Math.floor(Math.random() * villaStyles.length)];

    // Create top pipe using tiled villa sprite
    const topHeight = gapY - gapSize / 2;
    this.topPipe = scene.add.tileSprite(
      x,
      topHeight / 2,
      OBSTACLE.WIDTH,
      topHeight,
      topStyle
    );
    scene.physics.add.existing(this.topPipe, true);

    // Set physics body to match visual size
    const topBody = this.topPipe.body as Phaser.Physics.Arcade.StaticBody;
    topBody.setSize(OBSTACLE.WIDTH, topHeight);
    topBody.updateFromGameObject();

    // Create bottom pipe using tiled villa sprite
    const bottomY = gapY + gapSize / 2;
    const bottomHeight = GAME_CONFIG.height - bottomY - 64; // 64 for ground height
    this.bottomPipe = scene.add.tileSprite(
      x,
      bottomY + bottomHeight / 2,
      OBSTACLE.WIDTH,
      bottomHeight,
      bottomStyle
    );
    scene.physics.add.existing(this.bottomPipe, true);

    // Set physics body to match visual size
    const bottomBody = this.bottomPipe.body as Phaser.Physics.Arcade.StaticBody;
    bottomBody.setSize(OBSTACLE.WIDTH, bottomHeight);
    bottomBody.updateFromGameObject();
  }

  public update(scrollSpeed: number, delta: number): void {
    const movement = scrollSpeed * (delta / 1000);
    this.topPipe.x -= movement;
    this.bottomPipe.x -= movement;

    // Update physics bodies to match new positions
    const topBody = this.topPipe.body as Phaser.Physics.Arcade.StaticBody;
    const bottomBody = this.bottomPipe.body as Phaser.Physics.Arcade.StaticBody;
    topBody.updateFromGameObject();
    bottomBody.updateFromGameObject();
  }

  public isOffScreen(): boolean {
    return this.topPipe.x < -OBSTACLE.WIDTH;
  }

  public getX(): number {
    return this.topPipe.x;
  }

  public destroy(): void {
    this.topPipe.destroy();
    this.bottomPipe.destroy();
  }
}
