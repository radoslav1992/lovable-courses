-- Email signups for the free webinar.
CREATE TABLE IF NOT EXISTS signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  course TEXT NOT NULL DEFAULT 'vibe-coding-lovable',
  source TEXT,                -- which form on the page: 'hero' | 'final-cta'
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_signups_created_at ON signups (created_at);
