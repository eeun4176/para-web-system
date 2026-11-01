<?php
// POST api/admin/passenger_update.php  {code, discountRate}   (discountRate: 0.20 = 20%)
require_once __DIR__ . '/../helpers.php';
require_post();
require_admin();

$in = input();
$errors = [];
$code = (string)($in['code'] ?? '');
$rate = clean_number($in, 'discountRate', 0, 1, 'Discount rate', $errors);
if ($code === '' || strlen($code) > 20) $errors['code'] = 'Invalid passenger type.';
if ($errors) fail(422, 'Please fix the highlighted fields.', $errors);

$o = db()->prepare('SELECT label, discount_rate FROM passenger_types WHERE code = ?');
$o->execute([$code]);
$old = $o->fetch();
if (!$old) fail(404, 'Passenger type not found.');

$rate = round($rate, 2);
$s = db()->prepare('UPDATE passenger_types SET discount_rate = ? WHERE code = ?');
$s->execute([$rate, $code]);

if (abs((float)$old['discount_rate'] - $rate) > 0.00001) {
    audit('discount_update', $old['label'], 'Discount ' . round((float)$old['discount_rate'] * 100) . '% → ' . round($rate * 100) . '%');
}

ok(['passenger' => ['code' => $code, 'discountRate' => $rate]]);
