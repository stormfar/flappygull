import * as Phaser from 'phaser';
import { SEAGULL, GAME_CONFIG } from '../config';

export class Seagull extends Phaser.Physics.Arcade.Sprite {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private isDead: boolean = false;
  private hasHitGround: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Use seagull sprite from atlas
    super(scene, x, y, 'seagull', 'flap_2');

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Scale down the sprite (avg ~375px wide -> scale to ~75px)
    this.setScale(0.2); // 375 * 0.2 = 75px width (reasonable size)

    // Create animations if they don't exist
    if (!scene.anims.exists('seagull_flap')) {
      scene.anims.create({
        key: 'seagull_flap',
        frames: [
          { key: 'seagull', frame: 'flap_1' },
          { key: 'seagull', frame: 'flap_2' },
          { key: 'seagull', frame: 'flap_3' },
          { key: 'seagull', frame: 'flap_2' }, // Back to middle
        ],
        frameRate: 10,
        repeat: -1,
      });

      scene.anims.create({
        key: 'seagull_glide',
        frames: [{ key: 'seagull', frame: 'glide' }],
        frameRate: 1,
      });

      scene.anims.create({
        key: 'seagull_falling',
        frames: [{ key: 'seagull', frame: 'falling' }],
        frameRate: 1,
      });

      scene.anims.create({
        key: 'seagull_death',
        frames: [{ key: 'seagull', frame: 'death' }],
        frameRate: 1,
        repeat: 0,
      });
    }

    // Start flap animation
    this.play('seagull_flap');

    // Set up physics body - use simple direct values
    // Sprite is scaled to 0.2, so ~75px wide x ~48px tall on screen
    // Create a circular-ish hitbox around the bird's body
    const body = this.body as Phaser.Physics.Arcade.Body;

    // In Phaser, setSize works with the original texture dimensions (before scaling)
    // We want about 40px hitbox on screen, so divide by scale: 40 / 0.2 = 200
    const hitboxSizeInTexture = 200;
    body.setSize(hitboxSizeInTexture, hitboxSizeInTexture);

    // Centre the hitbox on the sprite (also in texture coordinates)
    // Frame is about 386x241, so center a 200x200 box
    body.setOffset(
      (this.frame.width - hitboxSizeInTexture) / 2,
      (this.frame.height - hitboxSizeInTexture) / 2
    );

    body.setMaxVelocity(0, SEAGULL.MAX_VELOCITY_Y);
    body.setCollideWorldBounds(false);

    // Set up controls
    this.cursors = scene.input.keyboard?.createCursorKeys();
    this.spaceKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Mouse/touch input
    scene.input.on('pointerdown', this.flap, this);
  }

  public flap(): void {
    if (this.isDead) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(GAME_CONFIG.flapPower);
  }

  public die(): void {
    if (this.isDead) return;

    this.isDead = true;

    // Show falling animation when hit obstacle
    this.stop();
    this.setFrame('falling'); // Falling frame
    this.setRotation(0);

    // Disable further control
    this.scene.input.off('pointerdown', this.flap, this);
  }

  public hitGround(): void {
    if (this.hasHitGround) return; // Already hit ground, don't change sprite

    this.hasHitGround = true;
    // Show death frame when hitting ground
    this.stop();
    this.setFrame('death'); // Death on floor frame
    this.setRotation(0);
  }

  public reset(x: number, y: number): void {
    this.isDead = false;
    this.hasHitGround = false;
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.setRotation(0);
    this.play('seagull_flap'); // Restart flap animation

    // Re-enable controls
    this.scene.input.on('pointerdown', this.flap, this);
  }

  public getIsDead(): boolean {
    return this.isDead;
  }

  update(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.isDead) {
      // Check if hit ground while dead to show death sprite
      // Ground is 64px tall at bottom, check if we're at ground level
      if (this.y >= GAME_CONFIG.height - 80) { // Near ground level (600 - 80 = 520)
        this.hitGround();
        // Stop falling
        body.setVelocity(0, 0);
      }
      return;
    }

    // Check for flap input
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey!) ||
        (this.cursors?.up && Phaser.Input.Keyboard.JustDown(this.cursors.up))) {
      this.flap();
    }

    // Dynamic animation based on velocity
    const velocityY = body.velocity.y;
    const currentAnim = this.anims.getName();

    if (velocityY < -100) {
      // Going up fast - show flapping
      if (currentAnim !== 'seagull_flap') {
        this.play('seagull_flap');
      }
    } else if (velocityY > 150) {
      // Falling fast - show falling sprite
      if (currentAnim !== 'seagull_falling') {
        this.play('seagull_falling');
      }
    } else if (velocityY >= -100 && velocityY <= 150) {
      // Gliding - show glide sprite
      if (currentAnim !== 'seagull_glide') {
        this.play('seagull_glide');
      }
    }

    // Check if hit ground or went off screen
    if (this.y > GAME_CONFIG.height || this.y < 0) {
      this.die();
    }
  }

  destroy(fromScene?: boolean): void {
    // Clean up input listeners (check if scene.input exists)
    if (this.scene && this.scene.input) {
      this.scene.input.off('pointerdown', this.flap, this);
    }
    super.destroy(fromScene);
  }
}
