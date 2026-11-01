<?php
// GET api/admin/calendar.php?month=YYYY-MM -> saved trips per day for the dashboard calendar
// { month: "2026-11", days: { "2026-11-01": 4, ... } }  (days with no trips are left out)
require_once __DIR__ . '/../helpers.php';
require_method('GET');
require_admin();

$month = (string)($_GET['month'] ?? '');
if (!preg_match('/^(\d{4})-(0[1-9]|1[0-2])$/', $month, $m) || $m[1] < 2000 || $m[1] > 2100) {
    fail(422, 'Invalid request.', ['month' => 'Use the format YYYY-MM.']);
}

$from = $month . '-01';
$s = db()->prepare("SELECT TO_CHAR(DATE(created_at), 'YYYY-MM-DD') AS day, COUNT(*) AS c
                    FROM trips
                    WHERE created_at >= CAST(? AS DATE) AND created_at < CAST(? AS DATE) + INTERVAL '1 month'
                    GROUP BY DATE(created_at)");
$s->execute([$from, $from]);

$days = [];
foreach ($s->fetchAll() as $r) $days[$r['day']] = (int)$r['c'];
ok(['month' => $month, 'days' => (object)$days]);
