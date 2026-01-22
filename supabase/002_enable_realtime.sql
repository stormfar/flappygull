-- Enable Realtime for matches and match_players tables
-- This allows Supabase Realtime to broadcast database changes

-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_players;

-- Set replica identity to FULL so all column values are included in updates
ALTER TABLE matches REPLICA IDENTITY FULL;
ALTER TABLE match_players REPLICA IDENTITY FULL;

-- Verify the tables are in the publication
SELECT
  schemaname,
  tablename
FROM
  pg_publication_tables
WHERE
  pubname = 'supabase_realtime'
  AND tablename IN ('matches', 'match_players');
