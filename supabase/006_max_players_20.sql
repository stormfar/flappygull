-- Increase multiplayer max players from 8 to 20
ALTER TABLE matches
  ALTER COLUMN max_players SET DEFAULT 20;

-- Optionally update any existing waiting matches to allow 20 players
UPDATE matches
  SET max_players = 20
  WHERE status = 'waiting' AND max_players = 8;
