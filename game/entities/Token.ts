import * as Phaser from 'phaser';
import { TOKEN, GAME_CONFIG } from '../config';

export class Token extends Phaser.Physics.Arcade.Sprite {
  public collected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'coin');

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    // Scale the coin to appropriate size
    this.setScale(0.5);

    // Set physics body to match sprite size
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(this.width * 0.7, this.height * 0.7);
  }

  public update(scrollSpeed: number, delta: number): void {
    const movement = scrollSpeed * (delta / 1000);
    this.x -= movement;

    // Add a gentle floating animation (bob up and down)
    const baseY = this.getData('baseY') || this.y;
    if (!this.getData('baseY')) {
      this.setData('baseY', this.y);
    }
    this.y = baseY + Math.sin(Date.now() / 300) * 8;

    // Add gentle rotation
    this.angle = Math.sin(Date.now() / 500) * 10;

    // Update physics body to match new position
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.updateFromGameObject();
  }

  public collect(): void {
    if (this.collected) return;

    this.collected = true;

    // Create sparkle particle burst effect
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 100 + Math.random() * 50;
      const sparkle = this.scene.add.sprite(this.x, this.y, 'star');
      sparkle.setScale(0.3);
      sparkle.setAlpha(1);

      // Animate sparkle outward
      this.scene.tweens.add({
        targets: sparkle,
        x: this.x + Math.cos(angle) * speed,
        y: this.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.1,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          sparkle.destroy();
        },
      });
    }

    // Play collection animation on coin
    this.scene.tweens.add({
      targets: this,
      scale: 1.0,
      alpha: 0,
      y: this.y - 30,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      },
    });
  }

  public isOffScreen(): boolean {
    return this.x < -TOKEN.SIZE;
  }

  public getX(): number {
    return this.x;
  }
}
