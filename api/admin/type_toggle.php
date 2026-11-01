<?php
// POST api/admin/type_toggle.php  {kind, code, active}
// "Removing" a type = deactivating it: it disappears from new calculations, old trips keep working.
require_once __DIR__ . '/../helpers.php';
require_post();
require_admin();

$tables = ['transport' => 'transport_types', 'passenger' => 'passenger_types'];
$in     = input();
$kind   = (string)($in['kind'] ?? '');
$code   = (string)($in['code'] ?? '');
$active = filter_var($in['active'] ?? null, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
if (!isset($tables[$kind]) || $code === '' || strlen($code) > 30 || $active === null) fail(422, 'Invalid request.');
$table = $tables[$kind];   // from the whitelist above, never from user input directly

$r = db()->prepare("SELECT label FROM $table WHERE code = ?");
$r->execute([$code]);
$label = $r->fetchColumn();
if ($label === false) fail(404, 'Type not found.');

if (!$active) {   // never leave the calculator with nothing to choose from
    $c = db()->prepare("SELECT COUNT(*) FROM $table WHERE is_active = 1 AND code <> ?");
    $c->execute([$code]);
    if ((int)$c->fetchColumn() < 1) fail(409, 'At least one type must stay active.');
}

db()->prepare("UPDATE $table SET is_active = ? WHERE code = ?")->execute([$active ? 1 : 0, $code]);
audit($active ? 'type_activate' : 'type_deactivate', $label, ucfirst($kind) . ' type "' . $code . '"');

ok();
