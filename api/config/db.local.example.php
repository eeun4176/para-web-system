<?php
// Copy this file to db.local.php (same folder) and fill in your Supabase values.
// Supabase -> Project -> Connect -> "Session pooler". db.local.php is git-ignored; never commit real passwords.
return [
    'DB_HOST' => 'aws-0-ap-southeast-1.pooler.supabase.com',
    'DB_PORT' => '5432',
    'DB_NAME' => 'postgres',
    'DB_USER' => 'postgres.your-project-ref',
    'DB_PASS' => 'your-database-password',
];
