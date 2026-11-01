<?php
// POST api/landmarks/add.php  {name, category, description, lat, lng, public?}
// "public": true is accepted from admins only; the landmark then has no owner and everyone sees it.
require_once __DIR__ . '/../helpers.php';
require_post();
$uid = require_login();

$in = input();
$public = filter_var($in['public'] ?? false, FILTER_VALIDATE_BOOLEAN);
if ($public && !is_admin()) fail(403, 'Only admins can create public landmarks.');

$l = clean_landmark($in, true);

$s = db()->prepare('INSERT INTO landmarks (user_id, name, category, description, is_public, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id');
$s->execute([$public ? null : $uid, $l['name'], $l['category'], $l['description'], $public ? 1 : 0, $l['lat'], $l['lng']]);
$id = (int) $s->fetchColumn();   // read before audit(), which inserts its own row

if ($public) audit('landmark_public_add', $l['name'], 'Category: ' . $l['category']);

ok(['landmark' => ['id' => $id, 'isPublic' => $public] + $l], 201);
