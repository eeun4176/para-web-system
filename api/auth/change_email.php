
<?php
// POST api/auth/change_email.php {email, recoveryCode}
require_once __DIR__ . '/../helpers.php';
require_post();
$uid = require_login();

$in = input();
$email = strtolower(trim((string)($in['email'] ?? '')));
$code = strtoupper(trim((string)($in['recoveryCode'] ?? '')));

$errors = [];
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255) {
    $errors['email'] = 'Enter a valid email address (max 255 characters).';
}
if (!preg_match('/^[A-F0-9]{12}$/', $code)) {
    $errors['recoveryCode'] = 'Enter your 12-character recovery code.';
}
if ($errors) fail(422, 'Please fix the highlighted fields.', $errors);

$current = db()->prepare('SELECT email FROM users WHERE id = ?');
$current->execute([$uid]);
$currentUser = $current->fetch();
if (!$currentUser) fail(401, 'Please log in first.');
if (login_locked($currentUser['email'])) {
    fail(429, 'Too many failed attempts. Please try again in ' . LOGIN_LOCK_MINUTES . ' minutes.');
}

$token = db()->prepare(
    'SELECT id FROM password_reset_tokens
     WHERE user_id = ? AND token_hash = ? AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1'
);
$token->execute([$uid, hash('sha256', $code)]);
if (!$token->fetch()) {
    record_failed_login($currentUser['email']);
    fail(422, 'Please fix the highlighted fields.', [
        'recoveryCode' => 'Recovery code is incorrect or expired.'
    ]);
}
clear_failed_logins($currentUser['email']);

$check = db()->prepare('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1');
$check->execute([$email, $uid]);

if ($check->fetch()) {
    fail(409, 'This email address is already registered.', [
        'email' => 'This email address is already registered.'
    ]);
}

try {
    $update = db()->prepare('UPDATE users SET email = ? WHERE id = ?');
    $update->execute([$email, $uid]);
} catch (PDOException $e) {
    if (($e->errorInfo[1] ?? null) == 1062) {
        fail(409, 'This email address is already registered.', [
            'email' => 'This email address is already registered.'
        ]);
    }
    throw $e;
}

$u = db()->prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?');
$u->execute([$uid]);
$user = $u->fetch();

if (!$user) fail(401, 'Please log in first.');

ok([
    'user' => [
        'id' => (int)$user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'createdAt' => $user['created_at']
    ]
]);
