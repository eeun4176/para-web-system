<?php
// GET api/admin/charts.php -> data for the three dashboard charts
require_once __DIR__ . '/../helpers.php';
require_method('GET');
require_admin();

// 1) Trips per day, last 14 days (days with no trips count as 0)
$today = db()->query('SELECT CURRENT_DATE')->fetchColumn();
$counts = [];
foreach (db()->query('SELECT DATE(created_at) AS d, COUNT(*) AS c FROM trips
                      WHERE created_at >= (CURRENT_DATE - INTERVAL \'13 days\') GROUP BY DATE(created_at)') as $r) {
    $counts[$r['d']] = (int)$r['c'];
}
$perDay = [];
for ($i = 13; $i >= 0; $i--) {
    $d = (new DateTime($today))->modify("-$i days")->format('Y-m-d');
    $perDay[] = ['date' => $d, 'count' => $counts[$d] ?? 0];
}

// 2) Trips by vehicle type
$byVehicle = array_map(fn($r) => ['label' => $r['label'], 'count' => (int)$r['c']],
    db()->query('SELECT tt.label, COUNT(*) AS c FROM trips t
                 JOIN transport_types tt ON tt.code = t.transport_code
                 GROUP BY tt.code, tt.label ORDER BY c DESC')->fetchAll());

// 3) Most common destinations
$topDest = array_map(fn($r) => ['label' => $r['dest_name'], 'count' => (int)$r['c']],
    db()->query('SELECT dest_name, COUNT(*) AS c FROM trips
                 GROUP BY dest_name ORDER BY c DESC, dest_name LIMIT 5')->fetchAll());

ok(['charts' => ['tripsPerDay' => $perDay, 'byVehicle' => $byVehicle, 'topDestinations' => $topDest]]);
