<?php
// GET api/admin/stats.php -> totals for the admin dashboard
require_once __DIR__ . '/../helpers.php';
require_method('GET');
require_admin();

$r = db()->query("SELECT
    (SELECT COUNT(*) FROM users) AS users,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admins,
    (SELECT COUNT(*) FROM trips) AS trips,
    (SELECT COALESCE(SUM(total_fare), 0) FROM trips) AS total_fare,
    (SELECT COUNT(*) FROM landmarks WHERE is_public = 0) AS landmarks,
    (SELECT COUNT(*) FROM landmarks WHERE is_public = 1) AS public_landmarks,
    (SELECT COUNT(*) FROM favorite_routes) AS favorites")->fetch();

ok(['stats' => [
    'users' => (int)$r['users'], 'admins' => (int)$r['admins'],
    'trips' => (int)$r['trips'], 'totalFare' => round((float)$r['total_fare'], 2),
    'landmarks' => (int)$r['landmarks'], 'publicLandmarks' => (int)$r['public_landmarks'],
    'favorites' => (int)$r['favorites'],
]]);
