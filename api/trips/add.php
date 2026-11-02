<?php
// POST api/trips/add.php
// Records a recent trip or updates an existing matching route.

require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../fare_logic.php';

require_post();
$uid = require_passenger();

$in = input();
$r = clean_route($in);
[$roadKm, $fromRoadM, $startFromRoadM] = road_input($in);

$fare = compute_fare(
    $r['origin']['lat'],
    $r['origin']['lng'],
    $r['dest']['lat'],
    $r['dest']['lng'],
    $r['transport'],
    $r['passenger'],
    $roadKm,
    $fromRoadM,
    $startFromRoadM
);

$db = db();
$db->beginTransaction();

try {
    $find = $db->prepare(
        'SELECT id FROM trips
         WHERE user_id = ?
           AND origin_lat = ROUND(?, 6)
           AND origin_lng = ROUND(?, 6)
           AND dest_lat = ROUND(?, 6)
           AND dest_lng = ROUND(?, 6)
           AND transport_code = ?
           AND passenger_code = ?
         ORDER BY id DESC
         LIMIT 1
         FOR UPDATE'
    );

    $find->execute([
        $uid,
        $r['origin']['lat'],
        $r['origin']['lng'],
        $r['dest']['lat'],
        $r['dest']['lng'],
        $r['transport'],
        $r['passenger']
    ]);

    $existingId = $find->fetchColumn();

    if ($existingId !== false) {
        $update = $db->prepare(
            'UPDATE trips
             SET origin_name = ?,
                 dest_name = ?,
                 distance_km = ?,
                 total_fare = ?,
                 duration_min = ?,
                 created_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?'
        );

        $update->execute([
            $r['origin']['name'],
            $r['dest']['name'],
            $fare['distanceKm'],
            $fare['total'],
            $fare['durationMin'],
            $existingId,
            $uid
        ]);

        $tripId = (int) $existingId;
        $updated = true;
    } else {
        $insert = $db->prepare(
            'INSERT INTO trips
             (user_id, origin_name, origin_lat, origin_lng,
              dest_name, dest_lat, dest_lng,
              transport_code, passenger_code,
              distance_km, total_fare, duration_min)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );

        $insert->execute([
            $uid,
            $r['origin']['name'],
            $r['origin']['lat'],
            $r['origin']['lng'],
            $r['dest']['name'],
            $r['dest']['lat'],
            $r['dest']['lng'],
            $r['transport'],
            $r['passenger'],
            $fare['distanceKm'],
            $fare['total'],
            $fare['durationMin']
        ]);

        $tripId = (int) $db->lastInsertId();
        $updated = false;
    }

    $db->commit();

    ok([
        'trip' => [
            'id' => $tripId,
            'updated' => $updated
        ],
        'fare' => $fare['fare']
    ], $updated ? 200 : 201);

} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    throw $e;
}