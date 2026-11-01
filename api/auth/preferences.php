<?php
// POST api/auth/preferences.php {defaultPassenger, defaultTransport}
require_once __DIR__ . '/../helpers.php';
require_post();

$uid = require_login();
$in = input();

$passenger = trim((string)($in['defaultPassenger'] ?? ''));
$transport = trim((string)($in['defaultTransport'] ?? ''));

// Check if both preferences were provided.
if ($passenger === '' || $transport === '') {
    fail(422, 'Please select both commute preferences.');
}

// Check if the passenger type exists and is active.
$p = db()->prepare(
    'SELECT code FROM passenger_types
     WHERE code = ? AND is_active = 1'
);
$p->execute([$passenger]);

if (!$p->fetch()) {
    fail(422, 'The selected passenger type is invalid or inactive.');
}

// Check if the transportation type exists and is active.
$t = db()->prepare(
    'SELECT code FROM transport_types
     WHERE code = ? AND is_active = 1'
);
$t->execute([$transport]);

if (!$t->fetch()) {
    fail(422, 'The selected transportation type is invalid or inactive.');
}

// Save the preferences to the logged-in user's account.
$save = db()->prepare(
    'UPDATE users
     SET default_passenger = ?, default_transport = ?
     WHERE id = ?'
);
$save->execute([$passenger, $transport, $uid]);

ok([
    'preferences' => [
        'defaultPassenger' => $passenger,
        'defaultTransport' => $transport
    ]
]);
