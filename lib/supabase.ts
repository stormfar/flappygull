import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 20, // Higher rate for snappy ghost updates
    },
  },
});

// Database types
export interface Match {
  id: string;
  match_code: string;
  seed: number;
  status: 'waiting' | 'active' | 'completed';
  max_players: number;
  duration: number; // Match duration in seconds (default 60)
  hard_mode: boolean; // Hard mode: 20% speed increase instead of 10%
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchPlayer {
  id: string;
  match_id: string;
  player_name: string;
  session_id: string;
  final_score: number;
  best_flight: number;
  joined_at: string;
  finished_at: string | null;
}

// Real-time broadcast types
export interface PlayerPosition {
  session_id: string;
  player_name: string;
  scroll_distance: number; // How far the player has traveled (for relative positioning)
  y: number;
  is_alive: boolean;
  current_score: number;
}

export interface PlayerScoreUpdate {
  session_id: string;
  player_name: string;
  total_score: number;
  best_flight: number;
  last_flight: number;
}

export interface LeaderboardEntry {
  id: string;
  match_id: string;
  session_id: string;
  player_name: string;
  total_score: number;
  best_flight: number;
  played_at: string;
}
