<?php
// POST api/admin/type_delete.php  {kind, code}
// Deletes a vehicle or passenger type. A type nobody used is removed from the database. A type that saved
// trips or favorites use (foreign keys) is hidden instead (is_deleted = 1): it disappears from the admin
// tables, the calculator and the preferences, while those trips keep their vehicle and fare.
require_once __DIR__ . '/../helpers.php';
require_post();
require_admin();

$tables = ['transport' => 'transport_types', 'passenger' => 'passenger_types'];
$in     = input();
$kind   = (string)($in['kind'] ?? '');
$code   = (string)($in['code'] ?? '');
if (!isset($tables[$kind]) || $code === '' || strlen($code) > 30) fail(422, 'Invalid request.');
$table = $tables[$kind];   // from the whitelist above, never from user input directly

$r = db()->prepare("SELECT label, is_active FROM $table WHERE code = ? AND is_deleted = 0");
$r->execute([$code]);
$row = $r->fetch();
if (!$row) fail(404, 'Type not found.');

if ((int)$row['is_active'] === 1) {
    $c = db()->prepare("SELECT COUNT(*) FROM $table WHERE is_active = 1 AND code <> ?");
    $c->execute([$code]);
    if ((int)$c->fetchColumn() < 1) fail(409, 'At least one type must stay active.');
}

$kept = false;
try {
    db()->prepare("DELETE FROM $table WHERE code = ?")->execute([$code]);
} catch (PDOException $e) {
    if (db_error($e) !== 'fk') throw $e;
    // Saved trips or favorites use it: hide it instead of removing it
    db()->prepare("UPDATE $table SET is_active = 0, is_deleted = 1 WHERE code = ?")->execute([$code]);
    $kept = true;
}
audit('type_delete', $row['label'], ucfirst($kind) . ' type "' . $code . '"' . ($kept ? ' (kept for saved trips)' : ''));

ok(['keptForTrips' => $kept]);
