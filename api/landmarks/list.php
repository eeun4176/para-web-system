<?php
// GET api/landmarks/list.php
//   logged in: the user's own landmarks + all public landmarks
//   guest:     public landmarks only
//   ?public=1: public landmarks only (used by the admin page)
require_once __DIR__ . '/../helpers.php';
require_method('GET');

$uid = $_SESSION['user_id'] ?? null;
$cols = 'id, name, category, description, is_public, lat, lng, created_at';

if ($uid && ($_GET['public'] ?? '') !== '1') {
    $s = db()->prepare("SELECT $cols FROM landmarks WHERE user_id = ? OR is_public = 1 ORDER BY is_public DESC, created_at DESC");
    $s->execute([$uid]);
} else {
    $s = db()->prepare("SELECT $cols FROM landmarks WHERE is_public = 1 ORDER BY name");
    $s->execute();
}

$rows = array_map(fn($r) => [
    'id' => (int)$r['id'], 'name' => $r['name'], 'category' => $r['category'],
    'description' => $r['description'] ?? '', 'isPublic' => (bool)$r['is_public'],
    'lat' => (float)$r['lat'], 'lng' => (float)$r['lng'],
    'createdAt' => $r['created_at'],
], $s->fetchAll());

ok(['landmarks' => $rows]);
