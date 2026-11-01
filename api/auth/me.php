<?php
// GET api/auth/me.php -> who is logged in + a CSRF token.
// Call this on every page load; send the token as header X-CSRF-Token on all POSTs.
require_once __DIR__ . '/../helpers.php';
require_method('GET');

$user = null;
if (!empty($_SESSION['user_id'])) {
    $s = db()->prepare('SELECT id, name, email, account_key, role, profile_picture FROM users WHERE id = ?');
    $s->execute([$_SESSION['user_id']]);
    $user = $s->fetch() ?: null;
    if (!$user) unset($_SESSION['user_id']);
}
if ($user) {
    $user['id'] = (int)$user['id'];
    $user['profilePicture'] = $user['profile_picture'];
    $user['accountKey'] = $user['account_key'];
    unset($user['profile_picture'], $user['account_key']);
}
ok(['loggedIn' => $user !== null, 'user' => $user, 'csrf' => csrf_token()]);
