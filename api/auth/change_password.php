<?php
// POST api/auth/change_password.php  {currentPassword?, newPassword}
// Sets or changes the password (Account Settings > Security). The current password is needed only when
// the account has one and the user did not just sign in (code, Google or password in the last 10 minutes),
// so someone who forgot it can log in with an email code and set a new one right away.
require_once __DIR__ . '/../helpers.php';
require_post();
$uid = require_passenger();

$in  = input();
$cur = (string)($in['currentPassword'] ?? '');
$new = (string)($in['newPassword'] ?? '');

$errors = [];
if (strlen($new) < 8) $errors['newPassword'] = 'New password must be at least 8 characters.';
elseif (strlen($new) > 72) $errors['newPassword'] = 'New password is too long (max 72 characters).';
if ($errors) fail(422, 'Please fix the highlighted fields.', $errors);

$s = db()->prepare('SELECT email, password_hash FROM users WHERE id = ?');
$s->execute([$uid]);
$u = $s->fetch();
if (!$u) fail(401, 'Please log in first.');

if ($u['password_hash'] !== null && !recently_signed_in()) {
    // Wrong guesses count toward the same lock as logging in
    if (login_locked($u['email'])) {
        fail(429, 'Too many failed attempts. Please try again in ' . LOGIN_LOCK_MINUTES . ' minutes.');
    }
    if ($cur === '' || !password_verify($cur, $u['password_hash'])) {
        record_failed_login($u['email']);
        fail(422, 'Please fix the highlighted fields.', ['currentPassword' => 'Current password is incorrect.']);
    }
    clear_failed_logins($u['email']);
}

db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    ->execute([password_hash($new, PASSWORD_DEFAULT), $uid]);
end_other_sessions($uid);   // other devices must sign in again with the new password
session_regenerate_id(true);

ok(['hasPassword' => true]);
