-- Double opt-in + unsubscribe.
-- `token` authenticates both the confirmation and the unsubscribe links.
ALTER TABLE signups ADD COLUMN confirmed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE signups ADD COLUMN token TEXT;
ALTER TABLE signups ADD COLUMN unsubscribed_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_signups_token ON signups (token);
