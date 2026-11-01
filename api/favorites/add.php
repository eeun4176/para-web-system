<?php
// POST api/favorites/add.php
// {label, originName, originLat, originLng, destName, destLat, destLng, transport, passenger}

require_once __DIR__ . '/../helpers.php';

require_post();
$uid = require_login();

const MAX_FAVORITES = 20;

$in = input();
$label = trim((string)($in['label'] ?? ''));

if ($label === '' || mb_strlen($label) > 100) {
    fail(422, 'Please fix the highlighted fields.', [
        'label' => 'Label is required (max 100 characters).'
    ]);
}

$r = clean_route($in);

$db = db();

$duplicate = $db->prepare(
    'SELECT id
     FROM favorite_routes
     WHERE user_id = ?
       AND ROUND(origin_lat, 6) = ROUND(?, 6)
       AND ROUND(origin_lng, 6) = ROUND(?, 6)
       AND ROUND(dest_lat, 6) = ROUND(?, 6)
       AND ROUND(dest_lng, 6) = ROUND(?, 6)
       AND transport_code = ?
       AND passenger_code = ?
     LIMIT 1'
);

$duplicate->execute([
    $uid,
    $r['origin']['lat'],
    $r['origin']['lng'],
    $r['dest']['lat'],
    $r['dest']['lng'],
    $r['transport'],
    $r['passenger']
]);

$duplicateId = $duplicate->fetchColumn();

if ($duplicateId !== false) {
    fail(409, 'This route is already in your favorites.');
}

try {
    $insert = $db->prepare(
        'INSERT INTO favorite_routes
         (user_id, label, origin_name, origin_lat, origin_lng,
          dest_name, dest_lat, dest_lng, transport_code, passenger_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $insert->execute([
        $uid,
        $label,
        $r['origin']['name'],
        $r['origin']['lat'],
        $r['origin']['lng'],
        $r['dest']['name'],
        $r['dest']['lat'],
        $r['dest']['lng'],
        $r['transport'],
        $r['passenger']
    ]);

} catch (PDOException $e) {
    if (db_error($e) === 'fk') {
        fail(422, 'Invalid transport or passenger type.');
    }
    throw $e;
}

ok([
    'favorite' => [
        'id' => (int) $db->lastInsertId(),
        'label' => $label
    ]
], 201);