import * as Phaser from 'phaser';
import { Obstacle } from '../entities/Obstacle';
import { Token } from '../entities/Token';
import { OBSTACLE, GAME_CONFIG, DIFFICULTY, TOKEN } from '../config';
import { SeededRandom } from '../utils/SeededRandom';

export class ObstacleGenerator {
  private obstacles: Obstacle[] = [];
  private tokens: Token[] = [];
  private scene: Phaser.Scene;
  private timeSinceLastSpawn: number = 0;
  private obstacleCount: number = 0;
  private currentGapSize: number;
  private rng?: SeededRandom;

  constructor(scene: Phaser.Scene, rng?: SeededRandom) {
    this.scene = scene;
    this.currentGapSize = GAME_CONFIG.obstacleGapSize;
    this.rng = rng;
  }

  public update(delta: number, scrollSpeed: number = GAME_CONFIG.scrollSpeed): void {
    this.timeSinceLastSpawn += delta;

    // Calculate dynamic spawn interval with partial spacing increase
    // Allow gap to increase with speed, but only at 50% the natural rate
    const speedFactor = scrollSpeed / GAME_CONFIG.scrollSpeed;
    const targetSpacing = GAME_CONFIG.obstacleSpacing * (1 + (speedFactor - 1) * 0.5);
    const dynamicSpawnInterval = (targetSpacing / scrollSpeed) * 1000;

    // Spawn new obstacle if enough time has passed
    if (this.timeSinceLastSpawn >= dynamicSpawnInterval) {
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
    const actualGapSize = this.rng
      ? this.currentGapSize + this.rng.between(Math.floor(minVariation), Math.floor(maxVariation))
      : this.currentGapSize + Phaser.Math.Between(minVariation, maxVariation);

    // Calculate gap position
    const minGapY = OBSTACLE.MIN_GAP_Y + actualGapSize / 2;
    const maxGapY = OBSTACLE.MAX_GAP_Y;
    const gapY = this.rng
      ? this.rng.between(Math.floor(minGapY), Math.floor(maxGapY))
      : Phaser.Math.Between(minGapY, maxGapY);

    // Create obstacle at right edge of screen
    const obstacle = new Obstacle(
      this.scene,
      GAME_CONFIG.width + OBSTACLE.WIDTH,
      gapY,
      actualGapSize,
      this.rng
    );

    this.obstacles.push(obstacle);
    this.obstacleCount++;

    // Spawn token with some probability
    const shouldSpawnToken = this.rng
      ? this.rng.next() < TOKEN.SPAWN_CHANCE
      : Math.random() < TOKEN.SPAWN_CHANCE;

    if (shouldSpawnToken) {
      const tokenVariation = this.currentGapSize / 3;
      const tokenY = this.rng
        ? gapY + this.rng.between(Math.floor(-tokenVariation), Math.floor(tokenVariation))
        : gapY + Phaser.Math.Between(-tokenVariation, tokenVariation);
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
