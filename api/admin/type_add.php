<?php
// POST api/admin/type_add.php
//   {kind:'transport', label, baseFare, baseKm, excessPerKm, avgSpeedKph}
//   {kind:'passenger', label, discountRate}
// The type's code (its ID in the database) is made from the name: "UV Express" -> "uv_express".
require_once __DIR__ . '/../helpers.php';
require_post();
require_admin();

$in   = input();
$kind = (string)($in['kind'] ?? '');
if (!in_array($kind, ['transport', 'passenger'], true)) fail(422, 'Invalid type kind.');

$maxCode  = $kind === 'transport' ? 30 : 20;
$maxLabel = $kind === 'transport' ? 60 : 40;
$label = trim((string)($in['label'] ?? ''));
$code  = trim(preg_replace('/[^a-z0-9]+/', '_', strtolower($label)), '_');
if ($code !== '' && !ctype_alpha($code[0])) $code = $kind[0] . '_' . $code;   // must start with a letter
$code  = rtrim(substr($code, 0, $maxCode), '_');

$errors = [];
if ($label === '' || mb_strlen($label) > $maxLabel) {
    $errors['label'] = 'Name is required (max ' . $maxLabel . ' characters).';
} elseif (!preg_match('/^[a-z][a-z0-9_]{1,' . ($maxCode - 1) . '}$/', $code)) {
    $errors['label'] = 'Name must have at least 2 letters or numbers (English letters).';
}

if ($kind === 'transport') {
    $fare   = clean_number($in, 'baseFare',    1, 500, 'Base fare', $errors);
    $km     = clean_number($in, 'baseKm',      1, 100, 'Base km', $errors);
    $excess = clean_number($in, 'excessPerKm', 0, 100, 'Excess per km', $errors);
    $speed  = clean_number($in, 'avgSpeedKph', 5, 120, 'Average speed', $errors);
} else {
    $rate = clean_number($in, 'discountRate', 0, 1, 'Discount rate', $errors);
}
if ($errors) fail(422, 'Please fix the highlighted fields.', $errors);

// A code that belongs to a deleted type (kept for saved trips) is brought back with the new values;
// a code in use is refused (the conflict update matches no row).
if ($kind === 'transport') {
    $s = db()->prepare('INSERT INTO transport_types (code, label, base_fare, base_km, excess_per_km, avg_speed_kph) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, base_fare = EXCLUDED.base_fare, base_km = EXCLUDED.base_km,
            excess_per_km = EXCLUDED.excess_per_km, avg_speed_kph = EXCLUDED.avg_speed_kph, is_active = 1, is_deleted = 0
        WHERE transport_types.is_deleted = 1');
    $s->execute([$code, $label, round($fare, 2), round($km, 1), round($excess, 2), round($speed, 2)]);
} else {
    $s = db()->prepare('INSERT INTO passenger_types (code, label, discount_rate) VALUES (?, ?, ?)
        ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, discount_rate = EXCLUDED.discount_rate, is_active = 1, is_deleted = 0
        WHERE passenger_types.is_deleted = 1');
    $s->execute([$code, $label, round($rate, 2)]);
}
if ($s->rowCount() === 0) fail(409, 'A ' . ($kind === 'transport' ? 'vehicle' : 'passenger') . ' type with this name already exists.');
audit('type_add', $label, 'New ' . ($kind === 'transport' ? 'vehicle' : 'passenger') . ' type');

ok(['code' => $code], 201);
