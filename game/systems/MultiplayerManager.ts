import { supabase, type PlayerPosition } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export class MultiplayerManager {
  private channel: RealtimeChannel | null = null;
  private matchId: string;
  private sessionId: string;
  private playerName: string;
  private otherPlayers: Map<string, PlayerPosition> = new Map();
  private broadcastInterval: NodeJS.Timeout | null = null;

  constructor(matchId: string, sessionId: string, playerName: string) {
    this.matchId = matchId;
    this.sessionId = sessionId;
    this.playerName = playerName;
  }

  /**
   * Connect to the match's realtime channel
   */
  public connect(): void {
    console.log('[MultiplayerManager] Connecting to channel for match:', this.matchId);
    this.channel = supabase.channel(`match:${this.matchId}:positions`);

    // Subscribe to position broadcasts from other players
    this.channel.on('broadcast', { event: 'position' }, (payload) => {
      const position = payload.payload as PlayerPosition;

      console.log('[MultiplayerManager] Received position from:', position.player_name, position.session_id);

      // Ignore own broadcasts
      if (position.session_id === this.sessionId) {
        console.log('[MultiplayerManager] Ignoring own broadcast');
        return;
      }

      // Update other player's position
      this.otherPlayers.set(position.session_id, position);
      console.log('[MultiplayerManager] Now tracking', this.otherPlayers.size, 'other players');
    });

    this.channel.subscribe((status) => {
      console.log('[MultiplayerManager] Channel subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('[MultiplayerManager] Successfully connected to multiplayer channel');
      }
    });
  }

  /**
   * Disconnect from the realtime channel
   */
  public disconnect(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }

    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }

    this.otherPlayers.clear();
  }

  /**
   * Start broadcasting position at regular intervals (50ms = 20 updates/second)
   */
  public startBroadcasting(getPosition: () => { scrollDistance: number; y: number; isAlive: boolean; currentScore: number }): void {
    if (this.broadcastInterval) return;

    console.log('[MultiplayerManager] Starting position broadcast (20x/sec)');

    let broadcastCount = 0;
    this.broadcastInterval = setInterval(() => {
      const position = getPosition();
      this.broadcastPosition(
        position.scrollDistance,
        position.y,
        position.isAlive,
        position.currentScore
      );

      // Log every 40th broadcast (every 2 seconds)
      broadcastCount++;
      if (broadcastCount % 40 === 0) {
        console.log('[MultiplayerManager] Broadcasting position:', position);
      }
    }, 50); // 20 times per second
  }

  /**
   * Stop broadcasting position
   */
  public stopBroadcasting(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
  }

  /**
   * Broadcast current position to all players in the match
   */
  private broadcastPosition(scrollDistance: number, y: number, isAlive: boolean, currentScore: number): void {
    if (!this.channel) return;

    const position: PlayerPosition = {
      session_id: this.sessionId,
      player_name: this.playerName,
      scroll_distance: scrollDistance,
      y,
      is_alive: isAlive,
      current_score: currentScore,
    };

    this.channel.send({
      type: 'broadcast',
      event: 'position',
      payload: position,
    });
  }

  /**
   * Get all other players' positions
   */
  public getOtherPlayers(): Map<string, PlayerPosition> {
    return this.otherPlayers;
  }

  /**
   * Remove a player (e.g., when they disconnect)
   */
  public removePlayer(sessionId: string): void {
    this.otherPlayers.delete(sessionId);
  }

  /**
   * Clean up old positions (players that haven't updated in 5 seconds)
   */
  public cleanupStalePositions(): void {
    // In a production environment, you'd track timestamps and remove stale entries
    // For now, we rely on players disconnecting properly
  }
}
