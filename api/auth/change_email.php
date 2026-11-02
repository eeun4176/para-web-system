<?php
// POST api/auth/change_email.php  (Account Settings > Profile > Email > Change), in two steps:
//   1. {email, currentPassword?}  -> sends a 6-digit code to the NEW email
//   2. {email, code}              -> checks the code and saves the new email (now verified)
// Step 1 needs the current password when the account has one and the user did not just sign in.
require_once __DIR__ . '/../helpers.php';
require_post();
$uid = require_passenger();

$in    = input();
$email = clean_email($in['email'] ?? '');
$code  = trim((string)($in['code'] ?? ''));

$s = db()->prepare('SELECT email, password_hash FROM users WHERE id = ?');
$s->execute([$uid]);
$me = $s->fetch();
if (!$me) fail(401, 'Please log in first.');
if ($email === $me['email']) fail(422, 'Please fix the highlighted fields.', ['email' => 'This is already your email.']);

$taken = db()->prepare('SELECT 1 FROM users WHERE email = ? AND id <> ?');
$taken->execute([$email, $uid]);
if ($taken->fetch()) {
    fail(409, 'This email is already registered to Para.', ['email' => 'This email is already registered to Para.']);
}

// ---------- Step 1: send the code ----------
if ($code === '') {
    if ($me['password_hash'] !== null && !recently_signed_in()) {
        if (login_locked($me['email'])) {
            fail(429, 'Too many failed attempts. Please try again in ' . LOGIN_LOCK_MINUTES . ' minutes.');
        }
        if (!password_verify((string)($in['currentPassword'] ?? ''), $me['password_hash'])) {
            record_failed_login($me['email']);
            fail(422, 'Please fix the highlighted fields.', ['currentPassword' => 'Current password is incorrect.']);
        }
        clear_failed_logins($me['email']);
    } elseif ($me['password_hash'] === null && !recently_signed_in()) {
        fail(403, 'For your safety, log out and log in again before changing your email.');
    }
    send_code_email($email, issue_code($email, 'change_email', $uid), 'change_email');
    ok(['sent' => true, 'expiresIn' => CODE_MINUTES * 60, 'resendIn' => CODE_RESEND_SECONDS]);
}

// ---------- Step 2: check the code and save ----------
check_code($email, 'change_email', $code, $uid);
try {
    db()->prepare('UPDATE users SET email = ?, email_verified = 1 WHERE id = ?')->execute([$email, $uid]);
} catch (PDOException $e) {
    if (db_error($e) === 'unique') {
        fail(409, 'This email is already registered to Para.', ['email' => 'This email is already registered to Para.']);
    }
    throw $e;
}

$u = db()->prepare('SELECT id, name, email, role, profile_picture, created_at FROM users WHERE id = ?');
$u->execute([$uid]);
$user = $u->fetch();

ok(['user' => user_reply($user) + ['createdAt' => $user['created_at']]]);
