
<?php
// GET api/auth/profile.php -> the logged-in user's details + their totals
require_once __DIR__ . '/../helpers.php';
require_method('GET');

$uid = require_login();

$u = db()->prepare(
    'SELECT id, name, email, role, profile_picture, created_at,
            default_passenger, default_transport
     FROM users
     WHERE id = ?'
);
$u->execute([$uid]);

$user = $u->fetch();
if (!$user) fail(401, 'Please log in first.');

$q = db()->prepare('SELECT
    (SELECT COUNT(*) FROM trips WHERE user_id = ?) AS trips,
    (SELECT COALESCE(SUM(total_fare), 0) FROM trips WHERE user_id = ?) AS total_fare,
    (SELECT COUNT(*) FROM landmarks WHERE user_id = ?) AS landmarks,
    (SELECT COUNT(*) FROM favorite_routes WHERE user_id = ?) AS favorites'
);
$q->execute([$uid, $uid, $uid, $uid]);

$t = $q->fetch();

ok([
    'user' => [
        'id' => (int)$user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'profilePicture' => $user['profile_picture'],
        'createdAt' => $user['created_at'],
        'defaultPassenger' => $user['default_passenger'],
        'defaultTransport' => $user['default_transport']
    ],
    'stats' => [
        'trips' => (int)$t['trips'],
        'totalFare' => round((float)$t['total_fare'], 2),
        'landmarks' => (int)$t['landmarks'],
        'favorites' => (int)$t['favorites']
    ]
]);
