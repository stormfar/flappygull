import * as Phaser from 'phaser';
import type { PlayerPosition } from '@/lib/supabase';

interface LeaderboardPlayer {
  sessionId: string;
  playerName: string;
  score: number;
  isMe: boolean;
}

export class MatchLeaderboard {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private titleText: Phaser.GameObjects.Text;
  private playerRows: Map<string, PlayerRow> = new Map();
  private x: number;
  private y: number;
  private width: number = 280;
  private rowHeight: number = 32;
  private mySessionId: string;

  constructor(scene: Phaser.Scene, x: number, y: number, mySessionId: string) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.mySessionId = mySessionId;

    // Create container
    this.container = this.scene.add.container(x, y);
    this.container.setDepth(900); // Below main UI but above game

    // Create background
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x000000, 0.7);
    this.background.lineStyle(4, 0xffffff, 1);
    this.background.fillRoundedRect(0, 0, this.width, 100, 8);
    this.background.strokeRoundedRect(0, 0, this.width, 100, 8);
    this.container.add(this.background);

    // Create title
    this.titleText = this.scene.add.text(this.width / 2, 12, 'LEADERBOARD', {
      fontSize: '16px',
      color: '#FFD700',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    this.titleText.setOrigin(0.5, 0);
    this.container.add(this.titleText);
  }

  /**
   * Update leaderboard with current player data
   */
  public update(
    otherPlayers: Map<string, PlayerPosition>,
    myScore: number,
    myName: string
  ): void {
    // Collect all players
    const players: LeaderboardPlayer[] = [];

    // Add current player
    players.push({
      sessionId: this.mySessionId,
      playerName: myName,
      score: myScore,
      isMe: true,
    });

    // Add other players
    otherPlayers.forEach((position, sessionId) => {
      players.push({
        sessionId,
        playerName: position.player_name,
        score: position.current_score,
        isMe: false,
      });
    });

    // Sort by score (descending)
    players.sort((a, b) => b.score - a.score);

    // Update or create rows
    const activeSessionIds = new Set<string>();
    players.forEach((player, index) => {
      activeSessionIds.add(player.sessionId);

      let row = this.playerRows.get(player.sessionId);
      if (!row) {
        // Create new row
        row = new PlayerRow(
          this.scene,
          0,
          40 + index * this.rowHeight,
          this.width,
          player.playerName,
          player.isMe
        );
        this.playerRows.set(player.sessionId, row);
        this.container.add(row.getContainer());
      }

      // Update row
      row.updateScore(player.score, index + 1);

      // Animate to new position
      const targetY = 40 + index * this.rowHeight;
      this.scene.tweens.add({
        targets: row.getContainer(),
        y: targetY,
        duration: 300,
        ease: 'Power2',
      });
    });

    // Remove rows for disconnected players
    this.playerRows.forEach((row, sessionId) => {
      if (!activeSessionIds.has(sessionId)) {
        row.destroy();
        this.playerRows.delete(sessionId);
      }
    });

    // Update background height
    const contentHeight = 40 + players.length * this.rowHeight + 8;
    this.background.clear();
    this.background.fillStyle(0x000000, 0.7);
    this.background.lineStyle(4, 0xffffff, 1);
    this.background.fillRoundedRect(0, 0, this.width, contentHeight, 8);
    this.background.strokeRoundedRect(0, 0, this.width, contentHeight, 8);
  }

  public destroy(): void {
    this.playerRows.forEach((row) => row.destroy());
    this.playerRows.clear();
    this.container.destroy();
  }
}

/**
 * Single row in the leaderboard showing rank, name, and score
 */
class PlayerRow {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private rankText: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private highlight: Phaser.GameObjects.Graphics;
  private isMe: boolean;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    playerName: string,
    isMe: boolean
  ) {
    this.scene = scene;
    this.isMe = isMe;

    this.container = this.scene.add.container(x, y);

    // Highlight for current player
    this.highlight = this.scene.add.graphics();
    if (isMe) {
      this.highlight.fillStyle(0xffd700, 0.2);
      this.highlight.fillRoundedRect(4, 0, width - 8, 28, 4);
    }
    this.container.add(this.highlight);

    // Rank (left side)
    this.rankText = this.scene.add.text(12, 14, '1', {
      fontSize: '18px',
      color: isMe ? '#FFD700' : '#FFFFFF',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    this.rankText.setOrigin(0, 0.5);
    this.container.add(this.rankText);

    // Player name (center-left)
    this.nameText = this.scene.add.text(40, 14, playerName, {
      fontSize: '14px',
      color: isMe ? '#FFD700' : '#FFFFFF',
      fontFamily: 'monospace',
    });
    this.nameText.setOrigin(0, 0.5);
    this.container.add(this.nameText);

    // Score (right side)
    this.scoreText = this.scene.add.text(width - 12, 14, '0', {
      fontSize: '16px',
      color: isMe ? '#FFD700' : '#FFFFFF',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    this.scoreText.setOrigin(1, 0.5);
    this.container.add(this.scoreText);
  }

  public updateScore(score: number, rank: number): void {
    // Update rank
    const rankEmoji = this.getRankEmoji(rank);
    this.rankText.setText(rankEmoji);

    // Update score with animation on change
    const oldScore = parseInt(this.scoreText.text, 10) || 0;
    if (score !== oldScore) {
      this.scoreText.setText(score.toString());

      // Pulse animation when score changes
      this.scene.tweens.add({
        targets: this.scoreText,
        scale: { from: 1.3, to: 1.0 },
        duration: 200,
        ease: 'Back.Out',
      });
    }
  }

  private getRankEmoji(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  }

  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  public destroy(): void {
    this.container.destroy();
  }
}
