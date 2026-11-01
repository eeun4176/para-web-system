<?php
// POST api/auth/admin_login.php  {accountKey, password}
// Admin sign-in (client/admin-login.html). Only admin accounts, found by account key (not email).
// Same lock as the passenger login: 5 failed attempts from one address -> blocked for 15 minutes.
require_once __DIR__ . '/../helpers.php';
require_post();

$in       = input();
$key      = trim((string)($in['accountKey'] ?? ''));
$password = (string)($in['password'] ?? '');
if ($key === '' || $password === '') fail(422, 'Please fill in all fields.');

$lockId = 'key:' . strtolower(mb_substr($key, 0, 40));   // login_attempts stores this in its email column
if (login_locked($lockId)) {
    fail(429, 'Too many failed attempts. Please try again in ' . LOGIN_LOCK_MINUTES . ' minutes.');
}

$s = db()->prepare("SELECT id, name, account_key, role, profile_picture, password_hash
                    FROM users WHERE LOWER(account_key) = LOWER(?) AND role = 'admin'");
$s->execute([$key]);
$u = $s->fetch();

// Same message whether the key or the password is wrong (dummy hash keeps the timing similar)
$hash = ($u && $u['password_hash']) ? $u['password_hash'] : password_hash('dummy-password', PASSWORD_DEFAULT);
if (!password_verify($password, $hash) || !$u) {
    record_failed_login($lockId);
    fail(401, 'Invalid account key or password.');
}

clear_failed_logins($lockId);
if (password_needs_rehash($u['password_hash'], PASSWORD_DEFAULT)) {
    db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($password, PASSWORD_DEFAULT), $u['id']]);
}

session_regenerate_id(true);
$_SESSION['user_id'] = (int)$u['id'];

ok(['user' => [
    'id' => (int)$u['id'], 'name' => $u['name'], 'email' => null, 'accountKey' => $u['account_key'],
    'role' => $u['role'], 'profilePicture' => $u['profile_picture'],
], 'csrf' => csrf_token()]);
