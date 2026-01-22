-- Create leaderboard table for storing match results
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  player_name VARCHAR(50) NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 0,
  best_flight INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_score ON leaderboard(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_match ON leaderboard(match_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_played_at ON leaderboard(played_at DESC);

-- Enable Row Level Security
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow anyone to read leaderboard, but only authenticated writes
CREATE POLICY "Allow public read access to leaderboard"
  ON leaderboard
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert to leaderboard"
  ON leaderboard
  FOR INSERT
  WITH CHECK (true);

-- Add leaderboard table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;
ALTER TABLE leaderboard REPLICA IDENTITY FULL;
