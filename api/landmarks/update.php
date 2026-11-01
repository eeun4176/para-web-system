<?php
// POST api/landmarks/update.php  {id, name, category, description}
// Users can edit their own landmarks. Admins can also edit public ones.
require_once __DIR__ . '/../helpers.php';
require_post();
$uid = require_login();

$in = input();
$id = valid_id($in['id'] ?? null);
$l  = clean_landmark($in, false);
$admin = is_admin() ? 1 : 0;

$p = db()->prepare('SELECT name, is_public FROM landmarks WHERE id = ?');
$p->execute([$id]);
$before = $p->fetch();

$s = db()->prepare(
    'UPDATE landmarks
     SET name = ?, category = ?, description = ?
     WHERE id = ?
       AND (
           (user_id = ? AND is_public = 0)
           OR (is_public = 1 AND ? = 1)
       )'
);
$s->execute([$l['name'], $l['category'], $l['description'], $id, $uid, $admin]);
if ($s->rowCount() === 0) fail(404, 'Landmark not found.');
if ($before && $before['is_public']) audit('landmark_public_update', $before['name'], 'Now: "' . $l['name'] . '"');

ok(['landmark' => ['id' => $id, 'name' => $l['name'], 'category' => $l['category'], 'description' => $l['description']]]);
