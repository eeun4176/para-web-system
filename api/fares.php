<?php
// GET api/fares.php -> the fare matrix (active types only)
// GET api/fares.php?all=1 -> includes inactive types, not deleted ones (admins only; used by the admin page)
require_once __DIR__ . '/helpers.php';
require_method('GET');

$all   = (($_GET['all'] ?? '') === '1') && is_admin();
$where = $all ? ' WHERE is_deleted = 0' : ' WHERE is_active = 1';   // deleted types are inactive too

$types = [];
foreach (db()->query('SELECT code, label, base_fare, base_km, excess_per_km, avg_speed_kph, is_active FROM transport_types' . $where . ' ORDER BY label') as $r) {
    $types[$r['code']] = [
        'label'       => $r['label'],
        'baseFare'    => (float)$r['base_fare'],
        'baseKm'      => (float)$r['base_km'],
        'excessPerKm' => (float)$r['excess_per_km'],
        'avgSpeedKph' => (float)$r['avg_speed_kph'],
        'active'      => (bool)$r['is_active'],
    ];
}
$discounts = [];
foreach (db()->query('SELECT code, label, discount_rate, is_active FROM passenger_types' . $where . ' ORDER BY label') as $r) {
    $discounts[$r['code']] = ['label' => $r['label'], 'rate' => (float)$r['discount_rate'], 'active' => (bool)$r['is_active']];
}

ok(['types' => $types, 'discounts' => $discounts]);
