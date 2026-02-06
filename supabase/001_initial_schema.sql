-- Flappy Gull Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_code VARCHAR(6) UNIQUE NOT NULL, -- 6-character join code
  seed INTEGER NOT NULL, -- RNG seed for deterministic obstacles
  status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, active, completed
  max_players INTEGER NOT NULL DEFAULT 20,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Match players table
CREATE TABLE IF NOT EXISTS match_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_name VARCHAR(50) NOT NULL,
  session_id UUID NOT NULL, -- Client-generated session ID
  final_score INTEGER DEFAULT 0,
  best_flight INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  UNIQUE(match_id, session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_code ON matches(match_code);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_session_id ON match_players(session_id);

-- Function to generate random 6-character match code
CREATE OR REPLACE FUNCTION generate_match_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excluding ambiguous chars
  result VARCHAR(6) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new match
CREATE OR REPLACE FUNCTION create_match()
RETURNS TABLE(match_id UUID, match_code VARCHAR, seed INTEGER) AS $$
DECLARE
  new_match_id UUID;
  new_code VARCHAR(6);
  new_seed INTEGER;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  -- Generate unique match code
  LOOP
    new_code := generate_match_code();
    attempt := attempt + 1;
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM matches WHERE matches.match_code = new_code) THEN
      EXIT;
    END IF;
    
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique match code';
    END IF;
  END LOOP;
  
  -- Generate random seed for obstacles
  new_seed := floor(random() * 2147483647)::INTEGER;
  
  -- Insert new match
  INSERT INTO matches (match_code, seed, status)
  VALUES (new_code, new_seed, 'waiting')
  RETURNING id INTO new_match_id;
  
  RETURN QUERY SELECT new_match_id, new_code, new_seed;
END;
$$ LANGUAGE plpgsql;

-- Function to update match timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS) - allow all for now since no auth
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read matches
CREATE POLICY "Anyone can read matches"
  ON matches FOR SELECT
  USING (true);

-- Allow everyone to create matches
CREATE POLICY "Anyone can create matches"
  ON matches FOR INSERT
  WITH CHECK (true);

-- Allow updates to matches (for status changes)
CREATE POLICY "Anyone can update matches"
  ON matches FOR UPDATE
  USING (true);

-- Allow everyone to read match players
CREATE POLICY "Anyone can read match_players"
  ON match_players FOR SELECT
  USING (true);

-- Allow everyone to create match players
CREATE POLICY "Anyone can join matches"
  ON match_players FOR INSERT
  WITH CHECK (true);

-- Allow players to update their own scores
CREATE POLICY "Anyone can update match_players"
  ON match_players FOR UPDATE
  USING (true);
