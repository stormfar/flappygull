import * as Phaser from 'phaser';
import { Obstacle } from '../entities/Obstacle';
import { Token } from '../entities/Token';
import { OBSTACLE, GAME_CONFIG, DIFFICULTY, TOKEN } from '../config';

export class ObstacleGenerator {
  private obstacles: Obstacle[] = [];
  private tokens: Token[] = [];
  private scene: Phaser.Scene;
  private timeSinceLastSpawn: number = 0;
  private obstacleCount: number = 0;
  private currentGapSize: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.currentGapSize = GAME_CONFIG.obstacleGapSize;
  }

  public update(delta: number, scrollSpeed: number = GAME_CONFIG.scrollSpeed): void {
    this.timeSinceLastSpawn += delta;

    // Spawn new obstacle if enough time has passed
    if (this.timeSinceLastSpawn >= OBSTACLE.SPAWN_INTERVAL) {
      this.spawnObstacle();
      this.timeSinceLastSpawn = 0;
    }

    // Update existing obstacles with dynamic scroll speed
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.update(scrollSpeed, delta);

      // Remove off-screen obstacles
      if (obstacle.isOffScreen()) {
        obstacle.destroy();
        this.obstacles.splice(i, 1);
      }
    }

    // Update existing tokens with dynamic scroll speed
    for (let i = this.tokens.length - 1; i >= 0; i--) {
      const token = this.tokens[i];
      if (!token.collected) {
        token.update(scrollSpeed, delta);
      }

      // Remove off-screen or collected tokens
      if (token.isOffScreen() || token.collected) {
        if (!token.collected) {
          token.destroy();
        }
        this.tokens.splice(i, 1);
      }
    }
  }

  private spawnObstacle(): void {
    // Vary gap size for each obstacle (asymmetric: -40% to +25% variation)
    // This creates some very narrow gaps and some comfortably wide gaps
    const minVariation = -this.currentGapSize * 0.4; // Can be 40% narrower
    const maxVariation = this.currentGapSize * 0.25;  // Can be 25% wider
    const actualGapSize = this.currentGapSize + Phaser.Math.Between(minVariation, maxVariation);

    // Calculate gap position
    const minGapY = OBSTACLE.MIN_GAP_Y + actualGapSize / 2;
    const maxGapY = OBSTACLE.MAX_GAP_Y;
    const gapY = Phaser.Math.Between(minGapY, maxGapY);

    // Create obstacle at right edge of screen
    const obstacle = new Obstacle(
      this.scene,
      GAME_CONFIG.width + OBSTACLE.WIDTH,
      gapY,
      actualGapSize
    );

    this.obstacles.push(obstacle);
    this.obstacleCount++;

    // Spawn token with some probability
    if (Math.random() < TOKEN.SPAWN_CHANCE) {
      const tokenY = gapY + Phaser.Math.Between(-this.currentGapSize / 3, this.currentGapSize / 3);
      const token = new Token(
        this.scene,
        GAME_CONFIG.width + OBSTACLE.WIDTH,
        tokenY
      );
      this.tokens.push(token);
    }

    // Increase difficulty gradually
    if (this.obstacleCount % 10 === 0) {
      this.currentGapSize = Math.max(
        DIFFICULTY.MIN_GAP,
        this.currentGapSize - DIFFICULTY.GAP_DECREASE_RATE
      );
    }
  }

  public getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  public getTokens(): Token[] {
    return this.tokens;
  }

  public reset(): void {
    // Destroy all obstacles
    this.obstacles.forEach(obstacle => obstacle.destroy());
    this.obstacles = [];

    // Destroy all tokens
    this.tokens.forEach(token => {
      if (!token.collected) {
        token.destroy();
      }
    });
    this.tokens = [];

    this.timeSinceLastSpawn = 0;
    this.obstacleCount = 0;
    this.currentGapSize = GAME_CONFIG.obstacleGapSize;
  }

  public getObstacleCount(): number {
    return this.obstacleCount;
  }
}
