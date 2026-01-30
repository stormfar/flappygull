import * as Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { SeededRandom } from '../utils/SeededRandom';

interface SpecialSprite {
  sprite: Phaser.GameObjects.Sprite;
  type: 'group' | 'andrii';
  baseY?: number; // For Andrii bobbing animation
  bobTime?: number; // For Andrii bobbing animation
}

export class SpecialSpritesSystem {
  private scene: Phaser.Scene;
  private sprites: SpecialSprite[] = [];
  private timeSinceLastGroupCheck: number = 0;
  private timeSinceObstacle: number = 0; // Track time since last obstacle spawn
  private andriiSpawnedThisCycle: boolean = false; // Track if Andrii spawned in current obstacle cycle
  private rng?: SeededRandom;
  private readonly SPAWN_CHECK_INTERVAL = 1800; // Check every 1.8 seconds (same as obstacles)
  private readonly GROUP_SPAWN_CHANCE = 0.05; // 5% chance
  private readonly ANDRII_SPAWN_CHANCE = 0.05; // 5% chance
  private readonly GROUND_HEIGHT = 64; // Height of the sand ground
  private readonly BOB_AMPLITUDE = 15; // Pixels to bob up and down
  private readonly BOB_SPEED = 0.8; // Speed of bobbing (Hz)

  constructor(scene: Phaser.Scene, rng?: SeededRandom) {
    this.scene = scene;
    this.rng = rng;
  }

  public update(delta: number, scrollSpeed: number = GAME_CONFIG.scrollSpeed): void {
    this.timeSinceLastGroupCheck += delta;
    this.timeSinceObstacle += delta;

    // Calculate dynamic spawn interval (same as ObstacleGenerator)
    const speedFactor = scrollSpeed / GAME_CONFIG.scrollSpeed;
    const targetSpacing = GAME_CONFIG.obstacleSpacing * (1 + (speedFactor - 1) * 0.5);
    const dynamicObstacleInterval = (targetSpacing / scrollSpeed) * 1000;
    const halfInterval = dynamicObstacleInterval / 2;

    // Check for spawning group sprites (same interval as obstacles)
    if (this.timeSinceLastGroupCheck >= dynamicObstacleInterval) {
      this.checkGroupSpawn();
      this.timeSinceLastGroupCheck = 0;
    }

    // Spawn Andrii at the midpoint of each obstacle cycle (halfway between obstacles)
    if (!this.andriiSpawnedThisCycle && this.timeSinceObstacle >= halfInterval) {
      this.checkAndriiSpawn();
      this.andriiSpawnedThisCycle = true;
    }

    // Reset cycle when we've passed a full obstacle interval
    if (this.timeSinceObstacle >= dynamicObstacleInterval) {
      this.timeSinceObstacle -= dynamicObstacleInterval; // Subtract to maintain precision
      this.andriiSpawnedThisCycle = false;
    }

    // Update existing sprites
    for (let i = this.sprites.length - 1; i >= 0; i--) {
      const specialSprite = this.sprites[i];
      const sprite = specialSprite.sprite;

      // Scroll sprite left
      const scrollAmount = scrollSpeed * (delta / 1000);
      sprite.x -= scrollAmount;

      // Update Andrii's bobbing animation
      if (specialSprite.type === 'andrii' && specialSprite.baseY !== undefined && specialSprite.bobTime !== undefined) {
        specialSprite.bobTime += delta / 1000;
        const bobOffset = Math.sin(specialSprite.bobTime * this.BOB_SPEED * Math.PI * 2) * this.BOB_AMPLITUDE;
        sprite.y = specialSprite.baseY + bobOffset;
      }

      // Remove off-screen sprites
      if (sprite.x < -sprite.width) {
        sprite.destroy();
        this.sprites.splice(i, 1);
      }
    }
  }

  private checkGroupSpawn(): void {
    // Roll for group sprite spawn
    const groupRoll = this.rng ? this.rng.next() : Math.random();
    if (groupRoll < this.GROUP_SPAWN_CHANCE) {
      this.spawnGroupSprite();
    }
  }

  private checkAndriiSpawn(): void {
    // Roll for Andrii sprite spawn (timing offset ensures spawn between obstacles)
    const andriiRoll = this.rng ? this.rng.next() : Math.random();
    if (andriiRoll < this.ANDRII_SPAWN_CHANCE) {
      this.spawnAndriiSprite();
    }
  }

  private spawnGroupSprite(): void {
    // Position on the ground (sand) - bottom of sprite should sit on top of sand
    const y = GAME_CONFIG.height - this.GROUND_HEIGHT;
    // Spawn with random offset to avoid collision with obstacles
    const xOffset = this.rng
      ? this.rng.between(150, 300)
      : Phaser.Math.Between(150, 300);
    const x = GAME_CONFIG.width + xOffset;

    const sprite = this.scene.add.sprite(x, y, 'group');
    sprite.setScale(0.4); // Make group slightly bigger than 1/3 size
    sprite.setOrigin(0.5, 1); // Set origin to bottom-center so it sits on the ground
    sprite.setDepth(2); // Above ground but below UI

    this.sprites.push({
      sprite,
      type: 'group',
    });
  }

  private spawnAndriiSprite(): void {
    // Position randomly in the middle area of the screen vertically
    const minY = 200; // Not too high
    const maxY = GAME_CONFIG.height - 200; // Not too low
    const baseY = this.rng
      ? this.rng.between(minY, maxY)
      : Phaser.Math.Between(minY, maxY);

    const x = GAME_CONFIG.width + 50;

    const sprite = this.scene.add.sprite(x, baseY, 'andrii');
    sprite.setScale(0.5); // Make Andrii half size
    sprite.setDepth(5); // Same depth as obstacles

    // Enable physics for collision detection
    this.scene.physics.add.existing(sprite);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);

    // Set hitbox to be tight (90% of sprite size)
    body.setSize(sprite.width * 0.9, sprite.height * 0.9);

    this.sprites.push({
      sprite,
      type: 'andrii',
      baseY,
      bobTime: 0,
    });
  }

  public getAndriiSprites(): Phaser.GameObjects.Sprite[] {
    return this.sprites
      .filter(s => s.type === 'andrii')
      .map(s => s.sprite);
  }

  public reset(): void {
    // Destroy all sprites
    this.sprites.forEach(specialSprite => specialSprite.sprite.destroy());
    this.sprites = [];
    this.timeSinceLastGroupCheck = 0;
    this.timeSinceObstacle = 0; // Start synchronized with obstacles
    this.andriiSpawnedThisCycle = false;
  }
}
