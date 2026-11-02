<?php
// POST api/auth/start.php {email} -> is this email registered to Para, and how can it sign in?
// Used while typing (the note under the email box) and by "Continue" on the log-in page.
// Rate limited per device so it can't be used to check thousands of emails.
require_once __DIR__ . '/../helpers.php';
require_post();

$email = clean_email(input()['email'] ?? '');

if (rate_limited('email_check', client_ip(), 40, 10)) {
    fail(429, 'Too many tries. Please wait a few minutes and try again.');
}
rate_hit('email_check', client_ip());

$s = db()->prepare('SELECT role, password_hash, google_sub FROM users WHERE email = ?');
$s->execute([$email]);
$u = $s->fetch();

// Admin accounts sign in on the admin page, never here
if ($u && $u['role'] === 'admin') fail(403, 'Administrators sign in on the admin sign-in page.');

ok([
    'email'       => $email,
    'registered'  => (bool)$u,
    'hasPassword' => $u && $u['password_hash'] !== null,
    'hasGoogle'   => $u && $u['google_sub'] !== null,
]);
