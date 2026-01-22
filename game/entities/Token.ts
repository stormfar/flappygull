import * as Phaser from 'phaser';
import { TOKEN } from '../config';

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

    // Create enhanced sparkle particle burst effect
    const particleCount = 16; // Doubled from 8
    const layers = 2; // Create two layers of particles

    for (let layer = 0; layer < layers; layer++) {
      const layerParticleCount = particleCount / layers;
      const layerSpeed = layer === 0 ? 150 : 80; // Outer layer faster
      const layerSize = layer === 0 ? 0.4 : 0.2; // Outer layer larger

      for (let i = 0; i < layerParticleCount; i++) {
        const angle = (Math.PI * 2 * i) / layerParticleCount;
        const speed = layerSpeed + Math.random() * 30;

        // Alternate between star and coin sprites for variety
        const spriteKey = Math.random() > 0.5 ? 'star' : 'coin';
        const sparkle = this.scene.add.sprite(this.x, this.y, spriteKey);
        sparkle.setScale(layerSize);
        sparkle.setAlpha(1);
        sparkle.setTint(layer === 0 ? 0xFFFFFF : 0xFFD700); // White and gold

        // Animate sparkle outward with rotation
        this.scene.tweens.add({
          targets: sparkle,
          x: this.x + Math.cos(angle) * speed,
          y: this.y + Math.sin(angle) * speed,
          angle: Math.random() * 360,
          alpha: 0,
          scale: 0.05,
          duration: 400 + Math.random() * 200,
          ease: 'Power2',
          onComplete: () => {
            sparkle.destroy();
          },
        });
      }
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
