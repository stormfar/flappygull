import * as Phaser from 'phaser';

export class GhostSeagull extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private nameText: Phaser.GameObjects.Text;
  private sessionId: string;
  private lastUpdate: number = 0;
  private tintColor: number;
  private targetX: number;
  private targetY: number;
  private smoothingFactor: number = 0.3; // Higher = smoother but more lag, lower = snappier but jerkier
  private wasAlive: boolean = true; // Track previous alive state to detect death/respawn
  private isFadingOut: boolean = false; // Track if currently fading out

  constructor(
    scene: Phaser.Scene,
    sessionId: string,
    playerName: string,
    x: number,
    y: number
  ) {
    super(scene, x, y);

    this.sessionId = sessionId;
    this.targetX = x;
    this.targetY = y;

    // Generate unique color tint from session ID
    this.tintColor = this.generateColorFromId(sessionId);

    // Create semi-transparent seagull sprite
    this.sprite = scene.add.sprite(0, 0, 'seagull', 'glide');
    this.sprite.setScale(0.2);
    this.sprite.setAlpha(0.6); // Semi-transparent
    this.sprite.setTint(this.tintColor);

    // Create name label above the ghost
    this.nameText = scene.add.text(0, -40, playerName, {
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      fontFamily: 'monospace',
    });
    this.nameText.setOrigin(0.5, 1);
    this.nameText.setAlpha(0.9);

    // Fade in on creation
    this.sprite.setAlpha(0);
    this.nameText.setAlpha(0);
    scene.tweens.add({
      targets: [this.sprite, this.nameText],
      alpha: { from: 0, to: 0.6 },
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.nameText.setAlpha(0.9);
      }
    });

    // Add sprite and text to container
    this.add([this.sprite, this.nameText]);

    // Add to scene
    scene.add.existing(this);

    // Set depth to be behind the player but in front of background
    this.setDepth(5);
  }

  /**
   * Generate a unique pastel color from a session ID hash
   */
  private generateColorFromId(id: string): number {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate pastel colors (higher values for softer colors)
    const hue = Math.abs(hash % 360);

    // Convert HSL to RGB (pastel: high lightness, medium saturation)
    const h = hue / 360;
    const s = 0.6; // 60% saturation for vibrant but not harsh
    const l = 0.7; // 70% lightness for pastel effect

    const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
      let r, g, b;

      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }

      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    };

    const [r, g, b] = hslToRgb(h, s, l);
    return (r << 16) + (g << 8) + b;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public updatePosition(x: number, y: number, isAlive: boolean): void {
    this.lastUpdate = Date.now();

    // Detect death (transition from alive to dead)
    if (this.wasAlive && !isAlive) {
      // Just died - start fade out animation
      this.isFadingOut = true;
      this.sprite.setFrame('death');

      // Fade out over 500ms
      this.scene.tweens.add({
        targets: [this.sprite, this.nameText],
        alpha: 0,
        duration: 500,
        ease: 'Power2',
      });
    }

    // Detect respawn (transition from dead to alive)
    if (!this.wasAlive && isAlive) {
      // Just respawned - snap to new position and fade in
      this.isFadingOut = false;
      this.setPosition(x, y);
      this.targetX = x;
      this.targetY = y;
      this.sprite.setFrame('glide');
      this.sprite.setTint(this.tintColor);

      // Fade in over 300ms
      this.scene.tweens.add({
        targets: [this.sprite, this.nameText],
        alpha: { from: 0, to: 0.6 },
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          this.nameText.setAlpha(0.9);
        }
      });
    }

    // Update target position (for smooth interpolation)
    if (isAlive && !this.isFadingOut) {
      // Only update target position if alive and not fading out
      this.targetX = x;
      this.targetY = y;
    } else if (!isAlive && !this.isFadingOut) {
      // Dead but not fading - keep position frozen
      this.targetX = this.x;
      this.targetY = this.y;
    }

    // Update alive state tracker
    this.wasAlive = isAlive;
  }

  /**
   * Smooth interpolation towards target position (call from scene update)
   */
  public smoothUpdate(): void {
    // Don't interpolate while fading out or when dead
    if (this.isFadingOut || !this.wasAlive) {
      return;
    }

    // Lerp towards target position for smooth movement
    const currentX = this.x;
    const currentY = this.y;

    const newX = currentX + (this.targetX - currentX) * this.smoothingFactor;
    const newY = currentY + (this.targetY - currentY) * this.smoothingFactor;

    this.setPosition(newX, newY);
  }

  public getLastUpdateTime(): number {
    return this.lastUpdate;
  }

  public destroy(fromScene?: boolean): void {
    this.sprite.destroy();
    this.nameText.destroy();
    super.destroy(fromScene);
  }
}
