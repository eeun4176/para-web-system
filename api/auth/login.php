<?php
// POST api/auth/login.php  {email, password}  ("Log In with Password"; the other ways are an email code or Google)
// After 5 failed attempts (same email + same address) login is blocked for 15 minutes.
require_once __DIR__ . '/../helpers.php';
require_post();

$in       = input();
$email    = strtolower(trim((string)($in['email'] ?? '')));
$password = (string)($in['password'] ?? '');
if ($email === '' || $password === '') fail(422, 'Please fill in all fields.');

if (login_locked($email)) {
    fail(429, 'Too many failed attempts. Please try again in ' . LOGIN_LOCK_MINUTES . ' minutes.');
}

$s = db()->prepare('SELECT id, name, email, role, profile_picture, password_hash FROM users WHERE email = ?');
$s->execute([$email]);
$u = $s->fetch();

// Accounts made with Google or an email code may have no password yet (the email check on the log-in
// page already tells the user the email is registered, so this message gives nothing away)
if ($u && $u['password_hash'] === null) {
    fail(422, 'This account has no password yet. Log in with a code sent to your email, or with Google.');
}

// Same generic message whether the email or the password is wrong.
// (Dummy hash keeps response time similar when the email doesn't exist.)
$hash = ($u && $u['password_hash']) ? $u['password_hash'] : password_hash('dummy-password', PASSWORD_DEFAULT);
if (!password_verify($password, $hash) || !$u) {
    record_failed_login($email);
    fail(401, 'Invalid email or password.');
}

clear_failed_logins($email);

// Admins have their own sign-in page (account key + password)
if ($u['role'] === 'admin') fail(403, 'Administrators sign in on the admin sign-in page.');

if (password_needs_rehash($u['password_hash'], PASSWORD_DEFAULT)) {
    db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($password, PASSWORD_DEFAULT), $u['id']]);
}

sign_in((int)$u['id']);

ok(['user' => user_reply($u), 'csrf' => csrf_token()]);
