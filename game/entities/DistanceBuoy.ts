import * as Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

export class DistanceBuoy {
  private buoy: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private x: number;

  constructor(scene: Phaser.Scene, x: number, distance: number) {
    this.x = x;

    // Create buoy graphic (floating marker)
    this.buoy = scene.add.graphics();
    const buoyY = GAME_CONFIG.height - 120; // Just above water

    // Draw buoy: vertical pole with flag
    this.buoy.fillStyle(0xFF6B00, 1.0); // Orange pole
    this.buoy.fillRect(x - 3, buoyY - 40, 6, 40);

    // Triangle flag at top
    this.buoy.fillStyle(0xFFD700, 1.0); // Gold flag
    this.buoy.fillTriangle(
      x + 3, buoyY - 40,
      x + 3, buoyY - 25,
      x + 25, buoyY - 32.5
    );

    // Circular base (bobber)
    this.buoy.fillStyle(0xFF0000, 1.0); // Red bobber
    this.buoy.fillCircle(x, buoyY, 8);
    this.buoy.lineStyle(2, 0xFFFFFF, 1.0);
    this.buoy.strokeCircle(x, buoyY, 8);

    this.buoy.setDepth(5); // Behind seagull but in front of background

    // Create distance label
    this.label = scene.add.text(x, buoyY - 55, `${distance}m`, {
      fontSize: '20px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
      fontFamily: 'monospace',
      fontStyle: 'bold'
    });
    this.label.setOrigin(0.5, 1);
    this.label.setDepth(5);

    // Add gentle bobbing animation
    scene.tweens.add({
      targets: [this.buoy, this.label],
      y: '+=8',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
  }

  public update(scrollSpeed: number, delta: number): void {
    const movement = scrollSpeed * (delta / 1000);
    this.x -= movement;

    // Update positions (preserve bobbing animation by using +=)
    this.buoy.x -= movement;
    this.label.x -= movement;
  }

  public isOffScreen(): boolean {
    return this.x < -50;
  }

  public destroy(): void {
    this.buoy.destroy();
    this.label.destroy();
  }
}
