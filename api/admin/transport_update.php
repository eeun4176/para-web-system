<?php
// POST api/admin/transport_update.php  {code, baseFare, baseKm, excessPerKm, avgSpeedKph}
require_once __DIR__ . '/../helpers.php';
require_post();
require_admin();

$in = input();
$errors = [];
$code   = (string)($in['code'] ?? '');
$fare   = clean_number($in, 'baseFare',    1, 500, 'Base fare', $errors);
$km     = clean_number($in, 'baseKm',      1, 100, 'Base km', $errors);
$excess = clean_number($in, 'excessPerKm', 0, 100, 'Excess per km', $errors);
$speed  = clean_number($in, 'avgSpeedKph', 5, 120, 'Average speed', $errors);
if ($code === '' || strlen($code) > 30) $errors['code'] = 'Invalid transport type.';
if ($errors) fail(422, 'Please fix the highlighted fields.', $errors);

$o = db()->prepare('SELECT label, base_fare, base_km, excess_per_km, avg_speed_kph FROM transport_types WHERE code = ?');
$o->execute([$code]);
$old = $o->fetch();
if (!$old) fail(404, 'Transport type not found.');

$new = ['base_fare' => round($fare, 2), 'base_km' => round($km, 1),
        'excess_per_km' => round($excess, 2), 'avg_speed_kph' => round($speed, 2)];

$s = db()->prepare('UPDATE transport_types SET base_fare = ?, base_km = ?, excess_per_km = ?, avg_speed_kph = ? WHERE code = ?');
$s->execute([$new['base_fare'], $new['base_km'], $new['excess_per_km'], $new['avg_speed_kph'], $code]);

$changes = diff_text($old, $new, ['base_fare' => 'Base fare', 'base_km' => 'Base km',
                                  'excess_per_km' => 'Excess per km', 'avg_speed_kph' => 'Avg speed']);
if ($changes !== '') audit('fare_update', $old['label'], $changes);

ok(['transport' => ['code' => $code, 'baseFare' => $new['base_fare'], 'baseKm' => $new['base_km'],
                    'excessPerKm' => $new['excess_per_km'], 'avgSpeedKph' => $new['avg_speed_kph']]]);
