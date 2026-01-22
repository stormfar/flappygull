-- Cleanup function for old matches
-- This removes completed matches and their players, but preserves leaderboard entries

CREATE OR REPLACE FUNCTION cleanup_old_matches(days_old INTEGER DEFAULT 7)
RETURNS TABLE(deleted_matches INTEGER, deleted_players INTEGER) AS $$
DECLARE
  match_count INTEGER;
  player_count INTEGER;
BEGIN
  -- Count matches to be deleted
  SELECT COUNT(*) INTO match_count
  FROM matches
  WHERE status = 'completed'
    AND (ended_at IS NOT NULL AND ended_at < NOW() - (days_old || ' days')::INTERVAL)
    OR (status = 'waiting' AND created_at < NOW() - (days_old || ' days')::INTERVAL);

  -- Count players to be deleted (via CASCADE)
  SELECT COUNT(*) INTO player_count
  FROM match_players mp
  JOIN matches m ON mp.match_id = m.id
  WHERE m.status = 'completed'
    AND (m.ended_at IS NOT NULL AND m.ended_at < NOW() - (days_old || ' days')::INTERVAL)
    OR (m.status = 'waiting' AND m.created_at < NOW() - (days_old || ' days')::INTERVAL);

  -- Delete old completed matches (players will be deleted via CASCADE)
  DELETE FROM matches
  WHERE status = 'completed'
    AND (ended_at IS NOT NULL AND ended_at < NOW() - (days_old || ' days')::INTERVAL)
    OR (status = 'waiting' AND created_at < NOW() - (days_old || ' days')::INTERVAL);

  RETURN QUERY SELECT match_count, player_count;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM cleanup_old_matches(7);  -- Clean up matches older than 7 days
-- SELECT * FROM cleanup_old_matches(1);  -- Clean up matches older than 1 day
