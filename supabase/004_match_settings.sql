-- Add duration and hard_mode settings to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS duration INTEGER NOT NULL DEFAULT 60,
ADD COLUMN IF NOT EXISTS hard_mode BOOLEAN NOT NULL DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN matches.duration IS 'Match duration in seconds (default 60)';
COMMENT ON COLUMN matches.hard_mode IS 'Hard mode: 20% speed increase per 50m instead of 10%';

-- Update create_match function to accept duration and hard_mode
CREATE OR REPLACE FUNCTION create_match(
  p_duration INTEGER DEFAULT 60,
  p_hard_mode BOOLEAN DEFAULT false
)
RETURNS TABLE(match_id UUID, match_code VARCHAR, seed INTEGER, duration INTEGER, hard_mode BOOLEAN) AS $$
DECLARE
  new_match_id UUID;
  new_code VARCHAR(6);
  new_seed INTEGER;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  -- Generate unique match code
  LOOP
    new_code := (
      SELECT string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::int, 1), '')
      FROM generate_series(1, 6)
    );
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

  -- Insert new match with duration and hard_mode
  INSERT INTO matches (match_code, seed, status, duration, hard_mode)
  VALUES (new_code, new_seed, 'waiting', p_duration, p_hard_mode)
  RETURNING id INTO new_match_id;

  RETURN QUERY SELECT new_match_id, new_code, new_seed, p_duration, p_hard_mode;
END;
$$ LANGUAGE plpgsql;
