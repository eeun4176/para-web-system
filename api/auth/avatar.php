<?php
// GET api/auth/avatar.php?v=... -> the logged-in user's own profile picture (bytes stored in users.avatar)
require_once __DIR__ . '/../helpers.php';
require_method('GET');
$uid = require_login();

$s = db()->prepare('SELECT avatar, avatar_mime FROM users WHERE id = ?');
$s->execute([$uid]);
$row = $s->fetch();
if (!$row || $row['avatar'] === null) fail(404, 'No profile picture.');

$bytes = is_resource($row['avatar']) ? stream_get_contents($row['avatar']) : $row['avatar'];   // pgsql returns BYTEA as a stream

header('Content-Type: ' . $row['avatar_mime']);
header('Content-Length: ' . strlen($bytes));
header('Cache-Control: private, max-age=31536000, immutable');   // safe: the URL's ?v= changes on every upload
echo $bytes;
