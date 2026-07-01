-- Marketing attribution: know which channel each signup came from.
ALTER TABLE signups ADD COLUMN utm_source TEXT;
ALTER TABLE signups ADD COLUMN utm_medium TEXT;
ALTER TABLE signups ADD COLUMN utm_campaign TEXT;
ALTER TABLE signups ADD COLUMN referrer TEXT;
