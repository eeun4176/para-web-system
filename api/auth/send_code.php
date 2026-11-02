<?php
// POST api/auth/send_code.php {email} -> emails a 6-digit code for logging in (or creating an account).
// One code per minute, a few per hour (see issue_code in helpers.php). The code itself is never sent back.
require_once __DIR__ . '/../helpers.php';
require_post();

$email = clean_email(input()['email'] ?? '');

$s = db()->prepare('SELECT role FROM users WHERE email = ?');
$s->execute([$email]);
if ($s->fetchColumn() === 'admin') fail(403, 'Administrators sign in on the admin sign-in page.');

$code = issue_code($email, 'login');
send_code_email($email, $code, 'login');

ok(['sent' => true, 'expiresIn' => CODE_MINUTES * 60, 'resendIn' => CODE_RESEND_SECONDS]);
