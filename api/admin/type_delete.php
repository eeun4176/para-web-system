<?php
// POST api/admin/type_delete.php  {kind, code}
// Only works for types nobody has used. Used ones are protected by foreign keys: deactivate them instead.
require_once __DIR__ . '/../helpers.php';
require_post();
require_admin();

$tables = ['transport' => 'transport_types', 'passenger' => 'passenger_types'];
$in     = input();
$kind   = (string)($in['kind'] ?? '');
$code   = (string)($in['code'] ?? '');
if (!isset($tables[$kind]) || $code === '' || strlen($code) > 30) fail(422, 'Invalid request.');
$table = $tables[$kind];

$r = db()->prepare("SELECT label, is_active FROM $table WHERE code = ?");
$r->execute([$code]);
$row = $r->fetch();
if (!$row) fail(404, 'Type not found.');

if ((int)$row['is_active'] === 1) {
    $c = db()->prepare("SELECT COUNT(*) FROM $table WHERE is_active = 1 AND code <> ?");
    $c->execute([$code]);
    if ((int)$c->fetchColumn() < 1) fail(409, 'At least one type must stay active.');
}

try {
    db()->prepare("DELETE FROM $table WHERE code = ?")->execute([$code]);
} catch (PDOException $e) {
    if (db_error($e) === 'fk') {   // foreign key: saved trips or favorites use it
        fail(409, 'This type is used by saved trips or favorites. Deactivate it instead.');
    }
    throw $e;
}
audit('type_delete', $row['label'], ucfirst($kind) . ' type "' . $code . '"');

ok();
