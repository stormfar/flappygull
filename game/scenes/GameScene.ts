import * as Phaser from 'phaser';
import { Seagull } from '../entities/Seagull';
import { ObstacleGenerator } from '../systems/ObstacleGenerator';
import { MultiplayerManager } from '../systems/MultiplayerManager';
import { GhostSeagull } from '../entities/GhostSeagull';
import { MatchLeaderboard } from '../ui/MatchLeaderboard';
import { DistanceBuoy } from '../entities/DistanceBuoy';
import { SpeedLinesSystem } from '../systems/SpeedLines';
import { GAME_CONFIG, TOKEN, DIFFICULTY } from '../config';
import { SeededRandom } from '../utils/SeededRandom';
import type { MatchConfig } from '../index';

export class GameScene extends Phaser.Scene {
  private seagull!: Seagull;
  private ground!: Phaser.GameObjects.TileSprite;
  private obstacleGenerator!: ObstacleGenerator;
  // UI elements
  private matchTimerText!: Phaser.GameObjects.Text;
  private currentScoreText!: Phaser.GameObjects.Text;
  private totalScoreText!: Phaser.GameObjects.Text;
  private lastFlightText!: Phaser.GameObjects.Text;
  private bestFlightText!: Phaser.GameObjects.Text;
  private startText!: Phaser.GameObjects.Text;
  private finalScoreText!: Phaser.GameObjects.Text;

  // Background layers for parallax
  private bgSky!: Phaser.GameObjects.Image;
  private bgClouds: Phaser.GameObjects.Image[] = [];
  private bgWater!: Phaser.GameObjects.TileSprite;

  // Celestial body (sun/moon) system
  private celestialBody?: Phaser.GameObjects.Graphics;
  private celestialGlow?: Phaser.GameObjects.Graphics;
  private currentCelestialState: 'sun' | 'sunset' | 'moon' | 'sunrise' = 'sun';
  private skyOverlay?: Phaser.GameObjects.Rectangle;
  private celestialDelayDistance: number = 0; // Distance to delay before celestial transitions start (30 seconds worth)

  // Wave animation
  private waveTime: number = 0;

  // Distance buoys
  private distanceBuoys: DistanceBuoy[] = [];
  private lastBuoyDistance: number = 0;

  // Speed lines system
  private speedLinesSystem!: SpeedLinesSystem;

  // Match state
  private matchTimeRemaining: number = 60000; // Default 60 seconds in milliseconds
  private matchDuration: number = 60000; // Duration from match config (in milliseconds)
  private isMatchActive: boolean = false;
  private matchEnded: boolean = false;

  // Flight state (current attempt)
  private flightDistance: number = 0;
  private cumulativeMatchDistance: number = 0; // Total distance across all flights in the match
  private currentMultiplier: number = 1;

  // Match score
  private totalMatchScore: number = 0;
  private currentFlightScore: number = 0;
  private lastFlightScore: number = 0;
  private bestFlightScore: number = 0;

  // Legacy
  private currentScrollSpeed: number = GAME_CONFIG.scrollSpeed;
  private bestDistance: number = 0;
  private isGameOver: boolean = false;

  // Multiplayer
  private matchConfig?: MatchConfig;
  private seededRandom?: SeededRandom;
  private multiplayerManager?: MultiplayerManager;
  private ghostSeagulls: Map<string, GhostSeagull> = new Map();
  private matchStartTime?: number; // Server timestamp when match started
  private countdownValue: number = 0;
  private countdownText?: Phaser.GameObjects.Text;
  private isCountingDown: boolean = false;
  private totalScrollDistance: number = 0; // Total distance scrolled (persists across flights)
  private matchLeaderboard?: MatchLeaderboard; // Running leaderboard during match

  constructor() {
    super({ key: 'GameScene' });
  }

  public setMatchConfig(config: MatchConfig): void {
    this.matchConfig = config;
    this.seededRandom = new SeededRandom(config.seed);

    // Set match duration from config (default to 60 seconds)
    this.matchDuration = (config.duration || 60) * 1000; // Convert to milliseconds
    this.matchTimeRemaining = this.matchDuration;

    // Initialize multiplayer manager
    this.multiplayerManager = new MultiplayerManager(
      config.matchId,
      config.sessionId,
      config.playerName
    );

    // Connect to realtime channel
    this.multiplayerManager.connect();

    console.log('[Multiplayer] Manager initialized for match:', config.matchId, 'duration:', config.duration, 'hard mode:', config.hardMode);
  }

  preload(): void {
    // Load seagull texture atlas (sprites are not uniformly sized/positioned)
    this.load.atlas(
      'seagull',
      '/assets/sprites/seagull_sprite_sheet.png',
      '/assets/sprites/seagull_atlas.json'
    );

    // Load background assets
    this.load.image('bg_sky', '/assets/backgrounds/sky.png');
    this.load.image('cloud1', '/assets/backgrounds/cloud1.png');
    this.load.image('cloud2', '/assets/backgrounds/cloud2.png');
    this.load.image('cloud3', '/assets/backgrounds/cloud3.png');
    this.load.image('water', '/assets/backgrounds/water.png');

    // Load obstacle sprites (multiple variants for variety)
    this.load.image('villa_tile', '/assets/sprites/tiles/houseBeige.png');
    this.load.image('villa_tile_alt', '/assets/sprites/tiles/houseBeigeAlt.png');
    this.load.image('villa_tile_alt2', '/assets/sprites/tiles/houseBeigeAlt2.png');

    // Load ground tile
    this.load.image('sand', '/assets/sprites/tiles/sand.png');

    // Load token sprites
    this.load.image('coin', '/assets/sprites/items/coin.png');
    this.load.image('star', '/assets/sprites/items/star.png');
  }

  create(): void {
    // Load best distance from localStorage
    const stored = localStorage.getItem('flappygull_best_distance');
    if (stored) {
      this.bestDistance = parseInt(stored, 10);
    }

    // Create sky background
    this.bgSky = this.add.image(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2, 'bg_sky');
    this.bgSky.setDisplaySize(GAME_CONFIG.width, GAME_CONFIG.height);
    this.bgSky.setScrollFactor(0); // Static background

    // Create clouds (slow parallax)
    const cloudCount = 5;
    for (let i = 0; i < cloudCount; i++) {
      const cloudType = ['cloud1', 'cloud2', 'cloud3'][Math.floor(Math.random() * 3)];
      const cloud = this.add.image(
        i * 300 + Math.random() * 100,
        50 + Math.random() * 150,
        cloudType
      );
      cloud.setScale(0.8 + Math.random() * 0.4);
      cloud.setAlpha(0.7);
      this.bgClouds.push(cloud);
    }

    // Create water layer peeking behind sand
    const waterHeight = 60;
    this.bgWater = this.add.tileSprite(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height - 64 - waterHeight / 2 + 10, // Position just above ground
      GAME_CONFIG.width * 2,
      waterHeight,
      'water'
    );
    this.bgWater.setAlpha(1.0); // Full opacity

    // Create celestial body (sun/moon)
    this.createCelestialBody();

    // Create tiling ground sprite (scrolls with game)
    const groundHeight = 64;
    this.ground = this.add.tileSprite(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height - groundHeight / 2,
      GAME_CONFIG.width,
      groundHeight,
      'sand'
    );
    this.physics.add.existing(this.ground, true);

    // Create seagull
    this.seagull = new Seagull(
      this,
      GAME_CONFIG.width * 0.2,
      GAME_CONFIG.height / 2
    );

    // Set up collisions
    this.physics.add.collider(
      this.seagull,
      this.ground,
      this.handleFlightEnd,
      undefined,
      this
    );

    // Create obstacle generator with seeded RNG if in multiplayer mode
    this.obstacleGenerator = new ObstacleGenerator(this, this.seededRandom);

    // Create speed lines system
    this.speedLinesSystem = new SpeedLinesSystem(this);

    // Create UI with high depth to always be on top
    const uiDepth = 1000;

    // Match timer (top center)
    this.matchTimerText = this.add.text(
      GAME_CONFIG.width / 2,
      20,
      '1:00',
      {
        fontSize: '48px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
        fontFamily: 'monospace',
      }
    );
    this.matchTimerText.setOrigin(0.5, 0);
    this.matchTimerText.setDepth(uiDepth);

    // Total score (top left)
    this.totalScoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '28px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 5,
      fontFamily: 'monospace',
    });
    this.totalScoreText.setDepth(uiDepth);

    // Current flight score with multiplier (top left, below total score)
    this.currentScoreText = this.add.text(16, 52, '+0 x1', {
      fontSize: '22px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
      fontFamily: 'monospace',
    });
    this.currentScoreText.setDepth(uiDepth);

    // Last flight score (top left, below current score)
    this.lastFlightText = this.add.text(16, 80, 'Last: -', {
      fontSize: '16px',
      color: '#CCCCCC',
      stroke: '#000000',
      strokeThickness: 3,
      fontFamily: 'monospace',
    });
    this.lastFlightText.setDepth(uiDepth);

    // Best flight score (top left, below last flight)
    this.bestFlightText = this.add.text(16, 100, 'Best: -', {
      fontSize: '16px',
      color: '#00FFFF',
      stroke: '#000000',
      strokeThickness: 3,
      fontFamily: 'monospace',
    });
    this.bestFlightText.setDepth(uiDepth);

    // Start text
    this.startText = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      'Press SPACE to Start Match',
      {
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      }
    );
    this.startText.setOrigin(0.5);
    this.startText.setDepth(uiDepth);

    // Final score text (shown at match end)
    this.finalScoreText = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      '',
      {
        fontSize: '48px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 8,
        fontFamily: 'monospace',
      }
    );
    this.finalScoreText.setOrigin(0.5);
    this.finalScoreText.setVisible(false);
    this.finalScoreText.setDepth(uiDepth);

    // Countdown text (shown during multiplayer countdown)
    this.countdownText = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      '',
      {
        fontSize: '120px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 12,
        fontFamily: 'monospace',
      }
    );
    this.countdownText.setOrigin(0.5);
    this.countdownText.setVisible(false);
    this.countdownText.setDepth(uiDepth + 1);

    // Set up input
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (!this.isMatchActive && !this.matchEnded) {
        this.startMatch();
      } else if (this.matchEnded) {
        this.resetMatch();
      } else if (this.isGameOver) {
        this.restartFlight();
      }
    });

    // Update timer text with correct duration if match config is set
    if (this.matchConfig) {
      const seconds = Math.ceil(this.matchDuration / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      this.matchTimerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
    }

    // Auto-start countdown if in multiplayer mode
    if (this.matchConfig) {
      console.log('[Multiplayer] Auto-starting match countdown');
      this.startMatch();
    }
  }

  private createCelestialBody(): void {
    // Create sky colour overlay (transitions with sun/moon)
    this.skyOverlay = this.add.rectangle(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      GAME_CONFIG.width,
      GAME_CONFIG.height,
      0x87CEEB, // Sky blue
      0 // Start transparent
    );
    this.skyOverlay.setDepth(0.5); // Just above sky background, below clouds

    // Create graphics objects for celestial body and glow
    this.celestialGlow = this.add.graphics();
    this.celestialBody = this.add.graphics();

    // Position in top-right area
    const x = GAME_CONFIG.width - 150;
    const y = 120;

    // Initial sun state
    this.updateCelestialBody('sun', x, y);
  }

  private updateCelestialBody(state: 'sun' | 'sunset' | 'moon', x: number, y: number): void {
    if (!this.celestialBody || !this.celestialGlow || !this.skyOverlay) return;

    this.celestialBody.clear();
    this.celestialGlow.clear();

    const radius = 40;

    if (state === 'sun') {
      // Sun: bright yellow with warm glow
      this.celestialGlow.fillStyle(0xFFD700, 0.3);
      this.celestialGlow.fillCircle(x, y, radius + 20);

      this.celestialBody.fillStyle(0xFFFF00, 1.0);
      this.celestialBody.fillCircle(x, y, radius);

      // Sky: clear day (no overlay)
      this.skyOverlay.setAlpha(0);
    } else if (state === 'sunset') {
      // Sunset: orange-red gradient effect (multiple overlapping circles)
      this.celestialGlow.fillStyle(0xFF6B00, 0.4);
      this.celestialGlow.fillCircle(x, y, radius + 20);

      this.celestialBody.fillStyle(0xFF4500, 1.0);
      this.celestialBody.fillCircle(x, y, radius);

      // Inner orange core
      this.celestialBody.fillStyle(0xFFA500, 0.7);
      this.celestialBody.fillCircle(x, y, radius * 0.6);

      // Sky: orange/pink sunset tint
      this.skyOverlay.setFillStyle(0xFF9966, 1.0);
      this.skyOverlay.setAlpha(0.25);
    } else {
      // Moon: pale white-blue with subtle glow
      this.celestialGlow.fillStyle(0xE0F2FF, 0.2);
      this.celestialGlow.fillCircle(x, y, radius + 15);

      this.celestialBody.fillStyle(0xF0F8FF, 1.0);
      this.celestialBody.fillCircle(x, y, radius);

      // Moon craters (small grey circles)
      this.celestialBody.fillStyle(0xCCCCDD, 0.5);
      this.celestialBody.fillCircle(x - 10, y - 8, 6);
      this.celestialBody.fillCircle(x + 12, y + 5, 8);
      this.celestialBody.fillCircle(x - 5, y + 12, 5);

      // Sky: dark blue night tint
      this.skyOverlay.setFillStyle(0x1a1a3e, 1.0);
      this.skyOverlay.setAlpha(0.4);
    }
  }

  /**
   * Linearly interpolates between two hex colors
   * @param color1 First color as hex (e.g., 0xFF9966)
   * @param color2 Second color as hex (e.g., 0x1a1a3e)
   * @param t Progress from 0 to 1
   * @returns Interpolated color as hex
   */
  private lerpColor(color1: number, color2: number, t: number): number {
    // Extract RGB components
    const r1 = (color1 >> 16) & 0xFF;
    const g1 = (color1 >> 8) & 0xFF;
    const b1 = color1 & 0xFF;

    const r2 = (color2 >> 16) & 0xFF;
    const g2 = (color2 >> 8) & 0xFF;
    const b2 = color2 & 0xFF;

    // Interpolate each component
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    // Combine back into hex
    return (r << 16) | (g << 8) | b;
  }

  private createCollisionParticles(x: number, y: number, type: 'obstacle' | 'ground'): void {
    const particleCount = type === 'obstacle' ? 12 : 8;
    const colors = [0xFFFFFF, 0xEEEEEE, 0xCCCCCC]; // Grey/white for feathers

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
      const speed = 80 + Math.random() * 60;

      // Create feather particle using rectangle
      const feather = this.add.graphics();
      const color = colors[Math.floor(Math.random() * colors.length)];
      feather.fillStyle(color, 1.0);
      feather.fillRect(-3, -8, 6, 16); // Small elongated rectangle
      feather.setPosition(x, y);
      feather.setDepth(999);

      // Random initial rotation for variety
      const initialRotation = Math.random() * Math.PI * 2;
      feather.setRotation(initialRotation);

      // Animate outward with gravity and rotation
      this.tweens.add({
        targets: feather,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed + 100, // Gravity effect
        rotation: initialRotation + (Math.random() - 0.5) * Math.PI * 4,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.3 },
        duration: 800,
        ease: 'Quad.Out',
        onComplete: () => {
          feather.destroy();
        }
      });
    }
  }

  update(_time: number, delta: number): void {
    // Always update seagull (even when game over) so death animation completes
    this.seagull.update();

    // Update ghost seagulls from multiplayer data
    if (this.multiplayerManager) {
      this.updateGhostSeagulls();

      // Smooth interpolate all ghost positions
      this.ghostSeagulls.forEach((ghost) => {
        ghost.smoothUpdate();
      });

      // Update running leaderboard during active match
      if (this.matchLeaderboard && this.isMatchActive && !this.matchEnded) {
        const myScore = this.totalMatchScore + this.currentFlightScore;
        this.matchLeaderboard.update(
          this.multiplayerManager.getOtherPlayers(),
          myScore,
          this.matchConfig!.playerName
        );
      }
    }

    // Handle countdown if active
    if (this.isCountingDown && this.matchStartTime) {
      const timeUntilStart = this.matchStartTime - Date.now();
      const newCountdownValue = Math.ceil(timeUntilStart / 1000);

      if (newCountdownValue !== this.countdownValue) {
        this.countdownValue = newCountdownValue;

        if (this.countdownValue > 0 && this.countdownValue <= 3) {
          // Show countdown number
          this.countdownText!.setText(this.countdownValue.toString());
          this.countdownText!.setVisible(true);

          // Pulse animation
          this.tweens.add({
            targets: this.countdownText,
            scale: { from: 0.5, to: 1.2 },
            duration: 500,
            ease: 'Back.Out',
          });
        } else if (this.countdownValue <= 0) {
          // Countdown finished - actually start the match
          this.countdownText!.setVisible(false);
          this.isCountingDown = false;
          this.actuallyStartMatch();
        }
      }
    }

    // Update match timer if active (use server time for synchronization)
    if (this.isMatchActive) {
      if (this.matchStartTime) {
        // Multiplayer: calculate time from server timestamp
        const elapsed = Date.now() - this.matchStartTime;
        this.matchTimeRemaining = Math.max(0, this.matchDuration - elapsed);
      } else {
        // Single player: use delta accumulation
        this.matchTimeRemaining -= delta;
      }

      if (this.matchTimeRemaining <= 0) {
        this.endMatch();
        return;
      }

      // Update timer display
      const seconds = Math.ceil(this.matchTimeRemaining / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      this.matchTimerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
    }

    // Scroll parallax layers
    if (this.isMatchActive && !this.isGameOver) {
      // Increase speed every 50 metres (20% normal, 40% hard mode)
      const speedIncreaseRate = this.matchConfig?.hardMode ? 0.4 : 0.2;
      const speedMultiplier = 1 + Math.floor(this.flightDistance / 50) * speedIncreaseRate;
      this.currentScrollSpeed = Math.min(
        GAME_CONFIG.scrollSpeed * speedMultiplier,
        DIFFICULTY.MAX_SPEED
      );

      const scrollAmount = this.currentScrollSpeed * (delta / 1000);

      // Scroll clouds (0.2x speed - very slow)
      this.bgClouds.forEach(cloud => {
        cloud.x -= scrollAmount * 0.2;
        if (cloud.x < -cloud.width) {
          cloud.x = GAME_CONFIG.width + cloud.width;
        }
      });

      // Scroll water layer (0.5x speed)
      this.bgWater.tilePositionX += scrollAmount * 0.5;

      // Animate waves (sine wave on Y position)
      this.waveTime += delta / 1000;
      const waveAmplitude = 0.5; // pixels (minimal to prevent border showing)
      const waveFrequency = 1.2; // Hz
      this.bgWater.tilePositionY = Math.sin(this.waveTime * waveFrequency * Math.PI * 2) * waveAmplitude;

      // Scroll ground (1.0x speed)
      this.ground.tilePositionX += scrollAmount;

      // Update speed lines
      this.speedLinesSystem.update(delta, this.currentScrollSpeed);
    }

    // Skip game logic if not in active flight
    if (!this.isMatchActive || this.isGameOver) return;

    // Check if seagull died
    if (this.seagull.getIsDead()) {
      this.handleFlightEnd();
      return;
    }

    // Update obstacles with current scroll speed
    this.obstacleGenerator.update(delta, this.currentScrollSpeed);

    // Check collisions with obstacles
    const obstacles = this.obstacleGenerator.getObstacles();
    for (const obstacle of obstacles) {
      if (
        this.physics.overlap(this.seagull, obstacle.topPipe) ||
        this.physics.overlap(this.seagull, obstacle.bottomPipe)
      ) {
        // Create collision particles before ending flight
        this.createCollisionParticles(this.seagull.x, this.seagull.y, 'obstacle');
        this.handleFlightEnd();
        return;
      }

      // Mark obstacle as passed
      if (!obstacle.passed && this.seagull.x > obstacle.getX()) {
        obstacle.passed = true;
      }
    }

    // Check token collection
    const tokens = this.obstacleGenerator.getTokens();
    for (const token of tokens) {
      if (!token.collected && this.physics.overlap(this.seagull, token)) {
        token.collect();
        // Tokens give bonus points
        const tokenPoints = TOKEN.POINTS * this.currentMultiplier;
        this.currentFlightScore += tokenPoints;
        this.showTokenCollected(token.x, token.y, tokenPoints);
        this.updateScoreDisplay();
      }
    }

    // Update flight distance (based on time alive)
    const distanceGained = (delta / 1000) * (GAME_CONFIG.scrollSpeed / 10);
    this.flightDistance += distanceGained;
    this.cumulativeMatchDistance += distanceGained; // Track cumulative distance across all flights

    // Calculate multiplier based on distance milestones (every 100m)
    const newMultiplier = 1 + Math.floor(this.flightDistance / 100);
    if (newMultiplier > this.currentMultiplier) {
      this.currentMultiplier = newMultiplier;
      this.showMultiplierBoost();
    }

    // Update celestial body and sky with gradual transitions
    // Day/night cycle: 0-150m day, 150-600m sunset (450m transition), 600-750m night, 750-1200m sunrise (450m transition), then repeat
    // Apply delay so celestial states don't start changing until after initial delay distance (using cumulative distance across all flights)
    const effectiveDistance = Math.max(0, this.cumulativeMatchDistance - this.celestialDelayDistance);
    const cycleLength = 1200; // Full day/night cycle in meters (doubled to accommodate longer transitions)
    const distanceInCycle = effectiveDistance % cycleLength;

    const x = GAME_CONFIG.width - 150;
    const y = 120;

    // Determine current phase and transition progress
    let skyColor = 0x87CEEB; // Default sky blue
    let skyAlpha = 0;
    let celestialState: 'sun' | 'sunset' | 'moon' | 'sunrise' = 'sun';

    if (distanceInCycle < 150) {
      // Day phase (0-150m)
      celestialState = 'sun';
      skyColor = 0x87CEEB;
      skyAlpha = 0; // Clear sky
    } else if (distanceInCycle < 600) {
      // Sunset transition (150-600m) - 3x longer (450m instead of 150m)
      celestialState = 'sunset';
      const transitionProgress = (distanceInCycle - 150) / 450; // 0 to 1 over 450m

      if (transitionProgress < 0.5) {
        // First half: transition from clear to orange/pink
        const firstHalfProgress = transitionProgress * 2; // 0 to 1
        skyColor = 0xFF9966;
        skyAlpha = firstHalfProgress * 0.3; // 0 to 0.3
      } else {
        // Second half: transition from orange to dark blue
        const secondHalfProgress = (transitionProgress - 0.5) * 2; // 0 to 1
        skyColor = this.lerpColor(0xFF9966, 0x1a1a3e, secondHalfProgress);
        skyAlpha = 0.3 + (secondHalfProgress * 0.15); // 0.3 to 0.45
      }
    } else if (distanceInCycle < 750) {
      // Night phase (600-750m) - fully dark
      celestialState = 'moon';
      skyColor = 0x1a1a3e;
      skyAlpha = 0.45; // Fully dark
    } else {
      // Sunrise transition (750-1200m) - 3x longer (450m instead of 150m)
      celestialState = 'sunrise';
      const transitionProgress = (distanceInCycle - 750) / 450; // 0 to 1 over 450m

      if (transitionProgress < 0.5) {
        // First half: transition from dark blue to orange
        const firstHalfProgress = transitionProgress * 2; // 0 to 1
        skyColor = this.lerpColor(0x1a1a3e, 0xFF9966, firstHalfProgress);
        skyAlpha = 0.45 - (firstHalfProgress * 0.15); // 0.45 to 0.3
      } else {
        // Second half: transition from orange back to clear
        const secondHalfProgress = (transitionProgress - 0.5) * 2; // 0 to 1
        skyColor = 0xFF9966;
        skyAlpha = 0.3 - (secondHalfProgress * 0.3); // 0.3 to 0
      }
    }

    // Update sky overlay with smooth transitions
    if (this.skyOverlay) {
      this.skyOverlay.setFillStyle(skyColor, 1.0);
      this.skyOverlay.setAlpha(skyAlpha);
    }

    // Update celestial body only when crossing major state boundaries
    if (celestialState !== this.currentCelestialState) {
      this.currentCelestialState = celestialState;
      // Map sunrise to sun and sunset/sunrise to appropriate visuals
      const visualState = celestialState === 'sunrise' ? 'sunset' : celestialState;
      this.updateCelestialBody(visualState, x, y);
    }

    // Spawn distance buoys every 100 metres
    const currentMilestone = Math.floor(this.flightDistance / 100) * 100;
    if (currentMilestone > this.lastBuoyDistance && currentMilestone > 0) {
      this.lastBuoyDistance = currentMilestone;
      const buoy = new DistanceBuoy(
        this,
        GAME_CONFIG.width + 50,
        currentMilestone
      );
      this.distanceBuoys.push(buoy);
    }

    // Update and clean up buoys
    for (let i = this.distanceBuoys.length - 1; i >= 0; i--) {
      const buoy = this.distanceBuoys[i];
      buoy.update(this.currentScrollSpeed, delta);

      if (buoy.isOffScreen()) {
        buoy.destroy();
        this.distanceBuoys.splice(i, 1);
      }
    }

    // Update current flight score (distance * multiplier)
    this.currentFlightScore = Math.floor(this.flightDistance * this.currentMultiplier);

    // Update UI
    this.updateScoreDisplay();
  }

  private async startMatch(): Promise<void> {
    // Hide start text
    this.startText.setVisible(false);

    // In multiplayer mode, fetch the server start time and show countdown
    if (this.matchConfig) {
      console.log('[Multiplayer] Fetching match start time...');

      // Dynamically import supabase to avoid SSR issues
      const { supabase } = await import('@/lib/supabase');

      const { data, error } = await supabase
        .from('matches')
        .select('started_at')
        .eq('id', this.matchConfig.matchId)
        .single();

      if (error || !data?.started_at) {
        console.error('[Multiplayer] Failed to fetch match start time:', error);
        return;
      }

      // Calculate match start time (3 second countdown from server started_at)
      const serverStartTime = new Date(data.started_at).getTime();
      this.matchStartTime = serverStartTime + 3000; // 3 second countdown

      console.log('[Multiplayer] Match will start at:', new Date(this.matchStartTime));

      // Start countdown
      this.isCountingDown = true;
      this.countdownValue = 3;
    } else {
      // Single player - start immediately
      this.actuallyStartMatch();
    }
  }

  private actuallyStartMatch(): void {
    console.log('[Game] Match starting now!');

    this.isMatchActive = true;
    this.matchEnded = false;
    this.matchTimeRemaining = this.matchDuration; // Use duration from config
    this.totalMatchScore = 0;
    this.lastFlightScore = 0;
    this.bestFlightScore = 0;
    this.totalScrollDistance = 0; // Reset scroll distance for multiplayer positioning
    this.cumulativeMatchDistance = 0; // Reset cumulative distance for celestial cycle
    
    // Initialize celestial delay: equivalent to ~30 seconds of distance at base scroll speed
    // Distance per second = GAME_CONFIG.scrollSpeed / 10
    const distancePerSecond = GAME_CONFIG.scrollSpeed / 10;
    this.celestialDelayDistance = distancePerSecond * 30; // ~30 seconds worth of distance

    // Create running leaderboard in top-right if in multiplayer
    if (this.multiplayerManager && this.matchConfig) {
      console.log('[Multiplayer] Creating running leaderboard');
      this.matchLeaderboard = new MatchLeaderboard(
        this,
        GAME_CONFIG.width - 300,
        20,
        this.matchConfig.sessionId
      );
    }

    // Start broadcasting position if in multiplayer
    if (this.multiplayerManager) {
      console.log('[Multiplayer] Starting position broadcast');
      this.multiplayerManager.startBroadcasting(() => ({
        scrollDistance: this.flightDistance, // Broadcast current position only (not cumulative)
        y: this.seagull.y,
        isAlive: !this.seagull.getIsDead(),
        currentScore: this.totalMatchScore + this.currentFlightScore, // Send total score for leaderboard
      }));
    }

    // Start first flight
    this.restartFlight();
  }

  private async endMatch(): Promise<void> {
    this.isMatchActive = false;
    this.matchEnded = true;
    this.isGameOver = true;

    // Stop the seagull
    this.seagull.die();

    // Destroy running leaderboard
    if (this.matchLeaderboard) {
      this.matchLeaderboard.destroy();
      this.matchLeaderboard = undefined;
    }

    // Stop broadcasting and disconnect from multiplayer
    if (this.multiplayerManager) {
      this.multiplayerManager.stopBroadcasting();
      this.multiplayerManager.disconnect();
    }

    // Submit score to leaderboard if in multiplayer (don't wait for it)
    if (this.matchConfig) {
      // Submit score in background (don't block results from showing)
      this.submitScoreToLeaderboard().catch(err => {
        console.error('[Game] Failed to submit score:', err);
      });

      // Call onMatchEnd callback to show results overlay immediately
      if (this.matchConfig.onMatchEnd) {
        // Small delay to ensure score submission starts first
        setTimeout(() => {
          if (this.matchConfig?.onMatchEnd) {
            this.matchConfig.onMatchEnd(this.matchConfig.matchId);
          }
        }, 100);
      }
    }

    // Show final score
    this.finalScoreText.setText(`Final Score: ${this.totalMatchScore}\n\nBest Flight: ${this.bestFlightScore}m\n\nPress ESC for Results`);
    this.finalScoreText.setVisible(true);

    // Hide match timer
    this.matchTimerText.setVisible(false);
  }

  private async submitScoreToLeaderboard(): Promise<void> {
    if (!this.matchConfig) return;

    try {
      console.log('[Game] Submitting score to leaderboard...');
      const { supabase } = await import('@/lib/supabase');

      const { error } = await supabase
        .from('leaderboard')
        .insert({
          match_id: this.matchConfig.matchId,
          session_id: this.matchConfig.sessionId,
          player_name: this.matchConfig.playerName,
          total_score: this.totalMatchScore,
          best_flight: this.bestFlightScore,
        });

      if (error) {
        console.error('[Game] Error submitting score:', error);
      } else {
        console.log('[Game] Score submitted successfully');
      }
    } catch (err) {
      console.error('[Game] Error submitting score:', err);
    }
  }

  private resetMatch(): void {
    // Reset all match state
    this.matchTimeRemaining = this.matchDuration;
    this.totalMatchScore = 0;
    this.lastFlightScore = 0;
    this.bestFlightScore = 0;
    this.cumulativeMatchDistance = 0; // Reset cumulative distance
    this.isMatchActive = false;
    this.matchEnded = false;

    // Reset obstacles
    this.obstacleGenerator.reset();

    // Hide final score, show start text
    this.finalScoreText.setVisible(false);
    this.startText.setVisible(true);

    // Show match timer again
    this.matchTimerText.setVisible(true);
    const seconds = Math.ceil(this.matchDuration / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    this.matchTimerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);

    // Reset seagull to initial position
    this.seagull.reset(
      GAME_CONFIG.width * 0.2,
      GAME_CONFIG.height / 2
    );

    // Update UI
    this.updateScoreDisplay();
  }

  private restartFlight(): void {
    // Reset flight-specific state (but keep match timer running)
    this.isGameOver = false;
    this.flightDistance = 0;
    this.currentMultiplier = 1;
    this.currentFlightScore = 0;
    this.currentScrollSpeed = GAME_CONFIG.scrollSpeed;

    // Reset celestial body to sun
    this.currentCelestialState = 'sun';
    const x = GAME_CONFIG.width - 150;
    const y = 120;
    this.updateCelestialBody('sun', x, y);

    // Reset wave animation
    this.waveTime = 0;
    this.bgWater.tilePositionY = 0;

    // Clear distance buoys
    this.distanceBuoys.forEach(buoy => buoy.destroy());
    this.distanceBuoys = [];
    this.lastBuoyDistance = 0;

    // Reset speed lines
    this.speedLinesSystem.reset();

    // Reset seagull
    this.seagull.reset(
      GAME_CONFIG.width * 0.2,
      GAME_CONFIG.height / 2
    );

    // Clear obstacles to give player a fresh start
    this.obstacleGenerator.reset();

    // Update UI
    this.updateScoreDisplay();
  }

  private handleFlightEnd(): void {
    if (this.isGameOver) return;

    this.isGameOver = true;
    this.seagull.die();

    // Create collision particles at seagull position
    this.createCollisionParticles(this.seagull.x, this.seagull.y, 'ground');

    // Add current flight distance to total scroll distance (for multiplayer positioning)
    this.totalScrollDistance += this.flightDistance;

    // Add current flight score to total match score
    this.totalMatchScore += this.currentFlightScore;

    // Update last flight score
    this.lastFlightScore = this.currentFlightScore;

    // Update best flight score if this was better
    if (this.currentFlightScore > this.bestFlightScore) {
      this.bestFlightScore = this.currentFlightScore;
    }

    // Update best distance if needed
    if (this.flightDistance > this.bestDistance) {
      this.bestDistance = Math.floor(this.flightDistance);
      localStorage.setItem('flappygull_best_distance', this.bestDistance.toString());
    }

    // IMPORTANT: Reset flightDistance immediately to prevent double-counting in broadcasts
    this.flightDistance = 0;

    // Update UI
    this.updateScoreDisplay();

    // Auto-restart after a brief delay (0.8 seconds) if match is still active
    if (this.isMatchActive) {
      this.time.delayedCall(800, () => {
        if (this.isMatchActive) {
          this.restartFlight();
        }
      });
    }
  }

  private updateScoreDisplay(): void {
    // Update current flight score with multiplier
    let scoreColor = '#FFFFFF'; // White for x1
    if (this.currentMultiplier >= 5) {
      scoreColor = '#FF4444'; // Red for high multipliers
    } else if (this.currentMultiplier >= 3) {
      scoreColor = '#FFA500'; // Orange for medium
    } else if (this.currentMultiplier >= 2) {
      scoreColor = '#FFFF00'; // Yellow for x2+
    }

    this.currentScoreText.setText(`+${this.currentFlightScore} x${this.currentMultiplier}`);
    this.currentScoreText.setColor(scoreColor);

    // Update total match score
    this.totalScoreText.setText(`Score: ${this.totalMatchScore}`);

    // Update last flight score
    if (this.lastFlightScore > 0) {
      this.lastFlightText.setText(`Last: ${this.lastFlightScore}`);
    } else {
      this.lastFlightText.setText('Last: -');
    }

    // Update best flight score
    if (this.bestFlightScore > 0) {
      this.bestFlightText.setText(`Best: ${this.bestFlightScore}`);
    } else {
      this.bestFlightText.setText('Best: -');
    }
  }

  private showMultiplierBoost(): void {
    // Create temporary text to show multiplier increase
    const boostText = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2 - 50,
      `x${this.currentMultiplier}`,
      {
        fontSize: '72px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 8,
        fontFamily: 'monospace',
      }
    );
    boostText.setOrigin(0.5);
    boostText.setDepth(1001); // Above other UI elements

    // Animate: bounce in with elastic effect, then fade out
    this.tweens.add({
      targets: boostText,
      scale: { from: 0, to: 1.5 },
      duration: 400,
      ease: 'Elastic.Out',
    });

    // Fade out after showing
    this.tweens.add({
      targets: boostText,
      alpha: { from: 1, to: 0 },
      scale: { from: 1.5, to: 2.0 },
      delay: 400,
      duration: 400,
      ease: 'Power2.In',
      onComplete: () => {
        boostText.destroy();
      }
    });
  }

  private showTokenCollected(x: number, y: number, points: number): void {
    // Create floating text to show points gained
    const pointsText = this.add.text(
      x,
      y,
      `+${points}`,
      {
        fontSize: '24px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 4,
        fontFamily: 'monospace',
      }
    );
    pointsText.setOrigin(0.5);
    pointsText.setDepth(1001);

    // Animate: float up and fade out
    this.tweens.add({
      targets: pointsText,
      y: y - 50,
      alpha: { from: 1, to: 0 },
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        pointsText.destroy();
      }
    });
  }

  private updateGhostSeagulls(): void {
    if (!this.multiplayerManager) return;

    const otherPlayers = this.multiplayerManager.getOtherPlayers();

    // Debug: Log player count occasionally
    if (this.time.now % 2000 < 50) {
      console.log('[Multiplayer] Other players:', otherPlayers.size, 'Ghost seagulls:', this.ghostSeagulls.size);
    }

    // Calculate current player's position (current flight distance only)
    const myCurrentDistance = this.flightDistance;

    // Update existing ghosts and create new ones
    otherPlayers.forEach((position, sessionId) => {
      let ghost = this.ghostSeagulls.get(sessionId);

      // Calculate screen X position relative to current player's position
      // scroll_distance now represents current position (not cumulative), so this is simpler
      const relativeDistance = position.scroll_distance - myCurrentDistance;
      const screenX = this.seagull.x + relativeDistance * 10; // 1 meter = 10 pixels (matches scrollSpeed/10)

      if (!ghost) {
        // Create new ghost seagull with unique color
        console.log('[Multiplayer] Creating ghost for player:', position.player_name, 'at distance:', position.scroll_distance);
        ghost = new GhostSeagull(
          this,
          sessionId,
          position.player_name,
          screenX,
          position.y
        );
        this.ghostSeagulls.set(sessionId, ghost);
      } else {
        // Update existing ghost
        ghost.updatePosition(screenX, position.y, position.is_alive);
      }
    });

    // Remove ghosts for players who disconnected
    this.ghostSeagulls.forEach((ghost, sessionId) => {
      if (!otherPlayers.has(sessionId)) {
        console.log('[Multiplayer] Removing ghost for disconnected player:', sessionId);
        ghost.destroy();
        this.ghostSeagulls.delete(sessionId);
      }
    });
  }
}

