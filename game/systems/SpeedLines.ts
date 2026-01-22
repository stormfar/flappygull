import * as Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

interface SpeedLine {
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
}

export class SpeedLinesSystem {
  private scene: Phaser.Scene;
  private lines: SpeedLine[] = [];
  private spawnTimer: number = 0;
  private isActive: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public update(delta: number, scrollSpeed: number): void {
    const baseSpeed = GAME_CONFIG.scrollSpeed;
    const speedRatio = scrollSpeed / baseSpeed;

    // Only show speed lines when moving significantly faster than base speed
    const shouldBeActive = speedRatio > 1.3;

    if (shouldBeActive && !this.isActive) {
      this.isActive = true;
    } else if (!shouldBeActive && this.isActive) {
      this.isActive = false;
      this.clearAllLines();
      return;
    }

    if (!this.isActive) return;

    // Spawn new lines more frequently at higher speeds
    const spawnRate = Math.min(50, 100 / speedRatio); // milliseconds between spawns
    this.spawnTimer += delta;

    if (this.spawnTimer >= spawnRate) {
      this.spawnTimer = 0;
      this.spawnSpeedLine(speedRatio);
    }

    // Update existing lines
    for (let i = this.lines.length - 1; i >= 0; i--) {
      const line = this.lines[i];

      // Move line left based on its speed
      line.x -= line.speed * (delta / 1000);
      line.alpha -= delta / 400; // Fade out

      // Redraw line at new position
      line.graphics.clear();
      line.graphics.lineStyle(2, 0xFFFFFF, Math.max(0, line.alpha));
      line.graphics.lineBetween(line.x, line.y, line.x - line.length, line.y);

      // Remove if off-screen or faded
      if (line.x < -line.length || line.alpha <= 0) {
        line.graphics.destroy();
        this.lines.splice(i, 1);
      }
    }
  }

  private spawnSpeedLine(speedRatio: number): void {
    // Spawn lines from right side of screen
    const x = GAME_CONFIG.width + 10;
    const y = Math.random() * GAME_CONFIG.height;

    // Line length increases with speed
    const length = 40 + speedRatio * 30;
    const speed = 300 + speedRatio * 200;

    const graphics = this.scene.add.graphics();
    graphics.setDepth(1); // Behind most elements but in front of background

    const line: SpeedLine = {
      graphics,
      x,
      y,
      length,
      speed,
      alpha: 0.6 + Math.random() * 0.2
    };

    this.lines.push(line);

    // Limit pool size to prevent memory issues
    if (this.lines.length > 50) {
      const removed = this.lines.shift();
      removed?.graphics.destroy();
    }
  }

  private clearAllLines(): void {
    this.lines.forEach(line => line.graphics.destroy());
    this.lines = [];
  }

  public reset(): void {
    this.clearAllLines();
    this.spawnTimer = 0;
    this.isActive = false;
  }
}
