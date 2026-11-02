-- Migration for databases created before November 2026: adds the admin account key.
-- The admin now signs in with an account key + password instead of an email (admin-login.html).
-- The admin account itself is not in this repository.

ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_key VARCHAR(40) UNIQUE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_or_key') THEN
    ALTER TABLE users ADD CONSTRAINT users_email_or_key CHECK (email IS NOT NULL OR account_key IS NOT NULL);
  END IF;
END $$;
