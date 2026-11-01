<?php
// GET api/admin/heatmap.php -> where people go: trip destinations of the last 90 days as GeoJSON points,
// grouped by place (about 100 m) with a "trips" count, for the dashboard heat map (MapLibre heatmap layer).
require_once __DIR__ . '/../helpers.php';
require_method('GET');
require_admin();

$rows = db()->query("SELECT ROUND(dest_lat, 3) AS lat, ROUND(dest_lng, 3) AS lng,
                            MIN(dest_name) AS name, COUNT(*) AS c
                     FROM trips
                     WHERE created_at > NOW() - INTERVAL '90 days'
                     GROUP BY ROUND(dest_lat, 3), ROUND(dest_lng, 3)
                     ORDER BY c DESC
                     LIMIT 2000")->fetchAll();

ok(['geojson' => [
    'type' => 'FeatureCollection',
    'features' => array_map(fn($r) => [
        'type' => 'Feature',
        'properties' => ['name' => $r['name'], 'trips' => (int)$r['c']],
        'geometry' => ['type' => 'Point', 'coordinates' => [(float)$r['lng'], (float)$r['lat']]],
    ], $rows),
]]);
