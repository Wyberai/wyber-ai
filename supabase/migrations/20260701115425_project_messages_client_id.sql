-- Needed for edit-and-regenerate: to correctly discard everything after an
-- edited message, the server needs to correlate a specific client-side
-- ChatMessage (client-generated id) to its DB row. Without this, the only
-- option is guessing by created_at timestamp, which drifts against client
-- Date.now() and isn't reliable enough to safely delete rows on.
ALTER TABLE project_messages ADD COLUMN IF NOT EXISTS client_id text;
