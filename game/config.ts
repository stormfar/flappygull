import * as Phaser from 'phaser';
import type { GameConfig } from '@/types/game';

// Phaser game configuration
export const PHASER_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  },
};

// Game constants
export const GAME_CONFIG: GameConfig = {
  width: 800,
  height: 600,
  gravity: 800,
  flapPower: -350,
  scrollSpeed: 200,
  obstacleSpacing: 300,
  obstacleGapSize: 180,
};

// Physics constants
export const SEAGULL = {
  WIDTH: 48,
  HEIGHT: 32,
  HITBOX_SCALE: 0.85, // Larger hitbox for better collision detection
  MAX_VELOCITY_Y: 600,
  ROTATION_SPEED: 0.1,
};

export const OBSTACLE = {
  WIDTH: 80,
  MIN_GAP_Y: 150,
  MAX_GAP_Y: 400,
  SPAWN_INTERVAL: 1800, // milliseconds
};

export const TOKEN = {
  SIZE: 24,
  SPAWN_CHANCE: 0.3, // 30% chance per obstacle
  POINTS: 10,
};

export const DIFFICULTY = {
  GAP_DECREASE_RATE: 2, // pixels per obstacle
  MIN_GAP: 120,
  SPEED_INCREASE_RATE: 5, // pixels per 20 obstacles
  MAX_SPEED: 300,
};
