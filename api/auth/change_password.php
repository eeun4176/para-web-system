<?php
// POST api/auth/change_password.php  {currentPassword, recoveryCode, newPassword}
require_once __DIR__ . '/../helpers.php';
require_post();
$uid = require_login();

$in  = input();
$cur = (string)($in['currentPassword'] ?? '');
$code = strtoupper(trim((string)($in['recoveryCode'] ?? '')));
$new = (string)($in['newPassword'] ?? '');

$errors = [];
if ($cur === '') $errors['currentPassword'] = 'Enter your current password.';
if (!preg_match('/^[A-F0-9]{12}$/', $code)) $errors['recoveryCode'] = 'Enter your 12-character recovery code.';
if (strlen($new) < 8) $errors['newPassword'] = 'New password must be at least 8 characters.';
elseif (strlen($new) > 72) $errors['newPassword'] = 'New password is too long (max 72 characters).';
elseif ($new === $cur) $errors['newPassword'] = 'New password must be different from the current one.';
if ($errors) fail(422, 'Please fix the highlighted fields.', $errors);

$s = db()->prepare('SELECT email, password_hash FROM users WHERE id = ?');
$s->execute([$uid]);
$u = $s->fetch();
if (!$u) fail(401, 'Please log in first.');

// Wrong guesses count toward the same lock as logging in
if (login_locked($u['email'])) {
    fail(429, 'Too many failed attempts. Please try again in ' . LOGIN_LOCK_MINUTES . ' minutes.');
}
if (!$u['password_hash'] || !password_verify($cur, $u['password_hash'])) {
    record_failed_login($u['email']);
    fail(422, 'Please fix the highlighted fields.', ['currentPassword' => 'Current password is incorrect.']);
}

$token = db()->prepare(
    'SELECT id FROM password_reset_tokens
     WHERE user_id = ? AND token_hash = ? AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1'
);
$token->execute([$uid, hash('sha256', $code)]);
if (!$token->fetch()) {
    record_failed_login($u['email']);
    fail(422, 'Please fix the highlighted fields.', [
        'recoveryCode' => 'Recovery code is incorrect or expired.'
    ]);
}

clear_failed_logins($u['email']);
db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    ->execute([password_hash($new, PASSWORD_DEFAULT), $uid]);
session_regenerate_id(true);

ok();
