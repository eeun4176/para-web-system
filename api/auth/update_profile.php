
<?php
// POST api/auth/update_profile.php {name}
require_once __DIR__ . '/../helpers.php';
require_post();
$uid = require_login();

$in = input();
$name = trim((string)($in['name'] ?? ''));

if ($name === '' || mb_strlen($name) > 100) {
    fail(422, 'Please fix the highlighted fields.', [
        'name' => 'Name is required (max 100 characters).'
    ]);
}

$s = db()->prepare('UPDATE users SET name = ? WHERE id = ?');
$s->execute([$name, $uid]);

$u = db()->prepare('SELECT id, name, email, role, profile_picture, created_at FROM users WHERE id = ?');
$u->execute([$uid]);
$user = $u->fetch();

if (!$user) fail(401, 'Please log in first.');

ok([
    'user' => [
        'id' => (int)$user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'profilePicture' => $user['profile_picture'],
        'createdAt' => $user['created_at']
    ]
]);
