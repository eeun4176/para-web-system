<?php
// POST api/auth/reset_password.php {email, recoveryCode, newPassword}
require_once __DIR__ . '/../helpers.php';
require_post();

$in = input();
$email = strtolower(trim((string)($in['email'] ?? '')));
$code = strtoupper(trim((string)($in['recoveryCode'] ?? '')));
$new = (string)($in['newPassword'] ?? '');

$errors = [];
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255) {
    $errors['email'] = 'Enter a valid email address.';
}
if (!preg_match('/^[A-F0-9]{12}$/', $code)) {
    $errors['recoveryCode'] = 'Enter your 12-character recovery code.';
}
if (strlen($new) < 8) {
    $errors['newPassword'] = 'New password must be at least 8 characters.';
} elseif (strlen($new) > 72) {
    $errors['newPassword'] = 'New password is too long (max 72 characters).';
}
if ($errors) fail(422, 'Please fix the highlighted fields.', $errors);

$userQuery = db()->prepare('SELECT id FROM users WHERE email = ?');
$userQuery->execute([$email]);
$user = $userQuery->fetch();

if (!$user || login_locked($email)) {
    fail(422, 'The recovery details are incorrect or unavailable.');
}

$tokenQuery = db()->prepare(
    'SELECT id FROM password_reset_tokens
     WHERE user_id = ? AND token_hash = ? AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1'
);
$tokenQuery->execute([(int)$user['id'], hash('sha256', $code)]);

if (!$tokenQuery->fetch()) {
    record_failed_login($email);
    fail(422, 'The recovery details are incorrect or unavailable.');
}

$pdo = db();
$pdo->beginTransaction();
try {
    $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($new, PASSWORD_DEFAULT), (int)$user['id']]);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
}

clear_failed_logins($email);
session_regenerate_id(true);
unset($_SESSION['user_id']);
ok();
