<?php
// POST api/admin/type_add.php
//   {kind:'transport', code, label, baseFare, baseKm, excessPerKm, avgSpeedKph}
//   {kind:'passenger', code, label, discountRate}
require_once __DIR__ . '/../helpers.php';
require_post();
require_admin();

$in   = input();
$kind = (string)($in['kind'] ?? '');
if (!in_array($kind, ['transport', 'passenger'], true)) fail(422, 'Invalid type kind.');

$maxCode  = $kind === 'transport' ? 30 : 20;
$maxLabel = $kind === 'transport' ? 60 : 40;
$code  = strtolower(trim((string)($in['code'] ?? '')));
$label = trim((string)($in['label'] ?? ''));

$errors = [];
if (!preg_match('/^[a-z][a-z0-9_]{1,' . ($maxCode - 1) . '}$/', $code)) {
    $errors['code'] = 'Code: Lowercase letters, numbers and underscores, starting with a letter (2 to ' . $maxCode . ' characters).';
}
if ($label === '' || mb_strlen($label) > $maxLabel) $errors['label'] = 'Label is required (max ' . $maxLabel . ' characters).';

if ($kind === 'transport') {
    $fare   = clean_number($in, 'baseFare',    1, 500, 'Base fare', $errors);
    $km     = clean_number($in, 'baseKm',      1, 100, 'Base km', $errors);
    $excess = clean_number($in, 'excessPerKm', 0, 100, 'Excess per km', $errors);
    $speed  = clean_number($in, 'avgSpeedKph', 5, 120, 'Average speed', $errors);
} else {
    $rate = clean_number($in, 'discountRate', 0, 1, 'Discount rate', $errors);
}
if ($errors) fail(422, 'Please fix the highlighted fields.', $errors);

try {
    if ($kind === 'transport') {
        db()->prepare('INSERT INTO transport_types (code, label, base_fare, base_km, excess_per_km, avg_speed_kph) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$code, $label, round($fare, 2), round($km, 1), round($excess, 2), round($speed, 2)]);
        audit('type_add', $label, 'New vehicle type "' . $code . '"');
    } else {
        db()->prepare('INSERT INTO passenger_types (code, label, discount_rate) VALUES (?, ?, ?)')
            ->execute([$code, $label, round($rate, 2)]);
        audit('type_add', $label, 'New passenger type "' . $code . '"');
    }
} catch (PDOException $e) {
    if (db_error($e) === 'unique') fail(409, 'That code already exists.');
    throw $e;
}

ok(['code' => $code], 201);
