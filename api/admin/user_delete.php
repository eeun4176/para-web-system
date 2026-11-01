<?php
// POST api/admin/user_delete.php  {id}
// Their trips, landmarks and favorites are deleted too (ON DELETE CASCADE).
require_once __DIR__ . '/../helpers.php';
require_post();
$me = require_admin();

$id = valid_id(input()['id'] ?? null);
if ($id === $me) fail(409, 'You cannot delete your own account.');

$u = db()->prepare('SELECT name, email FROM users WHERE id = ?');
$u->execute([$id]);
$user = $u->fetch();
if (!$user) fail(404, 'User not found.');

db()->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
audit('user_delete', $user['name'], $user['email']);

ok();
