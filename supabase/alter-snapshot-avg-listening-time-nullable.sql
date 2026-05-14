-- Allow avg_listening_time to be NULL instead of defaulting to 0
-- This distinguishes "no data available" from "zero listening time"
-- Prevents zero-pollution in average calculations

ALTER TABLE radio_listener_snapshots ALTER COLUMN avg_listening_time DROP DEFAULT;
ALTER TABLE radio_listener_snapshots ALTER COLUMN avg_listening_time DROP NOT NULL;
