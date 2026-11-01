<?php
// GET api/admin/users_list.php -> every user with their activity counts
require_once __DIR__ . '/../helpers.php';
require_method('GET');
require_admin();

$rows = db()->query('SELECT u.id, u.name, u.email, u.role, u.created_at,
    (SELECT COUNT(*) FROM trips t WHERE t.user_id = u.id) AS trips,
    (SELECT COUNT(*) FROM landmarks l WHERE l.user_id = u.id) AS landmarks,
    (SELECT COUNT(*) FROM favorite_routes f WHERE f.user_id = u.id) AS favorites
    FROM users u ORDER BY u.created_at DESC, u.id DESC')->fetchAll();

ok(['users' => array_map(fn($r) => [
    'id' => (int)$r['id'], 'name' => $r['name'], 'email' => $r['email'], 'role' => $r['role'],
    'createdAt' => $r['created_at'], 'trips' => (int)$r['trips'],
    'landmarks' => (int)$r['landmarks'], 'favorites' => (int)$r['favorites'],
], $rows)]);
