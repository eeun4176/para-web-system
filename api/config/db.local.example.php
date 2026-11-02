<?php
// Template for db.local.php: the Supabase connection details used when running Para on your own computer.
// Supabase -> Project -> Connect -> "Session pooler". db.local.php is git-ignored; never commit real passwords.
return [
    'DB_HOST' => 'aws-0-ap-southeast-1.pooler.supabase.com',
    'DB_PORT' => '5432',
    'DB_NAME' => 'postgres',
    'DB_USER' => 'postgres.your-project-ref',
    'DB_PASS' => 'your-database-password',

    // Optional: send real log-in codes through Brevo (brevo.com -> SMTP & API -> API keys).
    // Leave them out and the codes are written to api/logs/mail.log instead.
    // 'BREVO_API_KEY' => 'xkeysib-...',
    // 'MAIL_FROM'     => 'para.sjdm@gmail.com',   // a sender address verified in Brevo
];
