/**
 * Seeded Random Number Generator
 * Uses Mulberry32 algorithm for fast, deterministic random numbers
 * All players with the same seed will generate identical obstacle sequences
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /**
   * Returns a random number between 0 and 1 (exclusive)
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive)
   * Compatible with Phaser.Math.Between
   */
  public between(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a random number between min and max
   */
  public range(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Reset the generator with a new seed
   */
  public setSeed(seed: number): void {
    this.state = seed;
  }
}
