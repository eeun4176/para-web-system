<?php
// POST api/landmarks/delete.php  {id}
// Users can delete their own landmarks. Admins can also delete public ones.
require_once __DIR__ . '/../helpers.php';
require_post();
$uid = require_login();

$id = valid_id(input()['id'] ?? null);
$admin = is_admin() ? 1 : 0;

$p = db()->prepare('SELECT name, is_public FROM landmarks WHERE id = ?');
$p->execute([$id]);
$before = $p->fetch();

$s = db()->prepare(
    'DELETE FROM landmarks
     WHERE id = ?
       AND (
           (user_id = ? AND is_public = 0)
           OR (is_public = 1 AND ? = 1)
       )'
);
$s->execute([$id, $uid, $admin]);
if ($s->rowCount() === 0) fail(404, 'Landmark not found.');
if ($before && $before['is_public']) audit('landmark_public_delete', $before['name']);

ok();
