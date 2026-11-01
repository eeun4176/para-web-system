-- Migration (run once in the Supabase SQL Editor on a database created before November 2026).
-- The admin now signs in with an account key + password instead of an email (admin-login.html).
-- This file only changes the table. The admin account itself is NOT in this repository (the repo is
-- public): create it with the separate one-time script that was shared privately with the team.

ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_key VARCHAR(40) UNIQUE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_or_key') THEN
    ALTER TABLE users ADD CONSTRAINT users_email_or_key CHECK (email IS NOT NULL OR account_key IS NOT NULL);
  END IF;
END $$;
