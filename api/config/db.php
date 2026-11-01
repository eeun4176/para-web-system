<?php
// Database connection (PDO, PostgreSQL on Supabase).
// Vercel: set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS in Project Settings -> Environment Variables.
// Local (XAMPP): copy db.local.example.php to db.local.php and fill it in (db.local.php is git-ignored).

// Database settings: db.local.php on your computer, environment variables on Vercel.
function db_config(): array {
    static $cfg = null;
    if ($cfg === null) {
        $local = is_file(__DIR__ . '/db.local.php') ? require __DIR__ . '/db.local.php' : [];
        $cfg = [];
        foreach (['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASS', 'DB_SSLMODE'] as $key) {
            $env = getenv($key);
            $cfg[$key] = ($env !== false && $env !== '') ? $env : ($local[$key] ?? null);
        }
        $cfg['DB_PORT'] = $cfg['DB_PORT'] ?: '5432';
        $cfg['DB_NAME'] = $cfg['DB_NAME'] ?: 'postgres';
        $cfg['DB_SSLMODE'] = $cfg['DB_SSLMODE'] ?: 'require';   // Supabase needs SSL; 'disable' only for a local Postgres
        if (!$cfg['DB_HOST'] || !$cfg['DB_USER'] || $cfg['DB_PASS'] === null) {
            throw new RuntimeException('Database is not configured (set DB_* env vars or api/config/db.local.php).');
        }
    }
    return $cfg;
}

// The shared database connection (opened once per request).
function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $c = db_config();
        $pdo = new PDO(
            'pgsql:host=' . $c['DB_HOST'] . ';port=' . $c['DB_PORT'] . ';dbname=' . $c['DB_NAME'] . ';sslmode=' . $c['DB_SSLMODE'],
            $c['DB_USER'],
            $c['DB_PASS'],
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // throw on SQL errors
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,                  // real prepared statements (needs Supabase *session* pooler)
            ]
        );
        $pdo->exec("SET TIME ZONE 'Asia/Manila'");   // Supabase runs in UTC; show and group dates in PH time
    }
    return $pdo;
}
