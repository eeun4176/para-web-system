<?php
// POST api/admin/change_password.php  {currentPassword, newPassword}
// The admin has no email or recovery code, so the current password is enough (Admin Settings page).
// Wrong guesses count toward the same 5-tries lock as signing in.
require_once __DIR__ . '/../helpers.php';
require_post();
$uid = require_admin();

$in  = input();
$cur = (string)($in['currentPassword'] ?? '');
$new = (string)($in['newPassword'] ?? '');

$errors = [];
if ($cur === '') $errors['currentPassword'] = 'Enter your current password.';
if (strlen($new) < 8) $errors['newPassword'] = 'New password must be at least 8 characters.';
elseif (strlen($new) > 72) $errors['newPassword'] = 'New password is too long (max 72 characters).';
elseif ($new === $cur) $errors['newPassword'] = 'New password must be different from the current one.';
if ($errors) fail(422, 'Please fix the highlighted fields.', $errors);

$s = db()->prepare('SELECT account_key, password_hash FROM users WHERE id = ?');
$s->execute([$uid]);
$u = $s->fetch();
$lockId = 'key:' . strtolower((string)$u['account_key']);

if (login_locked($lockId)) {
    fail(429, 'Too many failed attempts. Please try again in ' . LOGIN_LOCK_MINUTES . ' minutes.');
}
if (!$u['password_hash'] || !password_verify($cur, $u['password_hash'])) {
    record_failed_login($lockId);
    fail(422, 'Please fix the highlighted fields.', ['currentPassword' => 'Current password is incorrect.']);
}

clear_failed_logins($lockId);
db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    ->execute([password_hash($new, PASSWORD_DEFAULT), $uid]);
session_regenerate_id(true);
audit('change_password', 'Administrator account', 'Password changed');

ok(['csrf' => csrf_token()]);
