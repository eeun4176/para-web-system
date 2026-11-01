<?php
// GET api/admin/audit_list.php -> the 50 most recent admin actions
require_once __DIR__ . '/../helpers.php';
require_method('GET');
require_admin();

$rows = db()->query('SELECT id, admin_name, action, target, details, created_at FROM audit_log ORDER BY id DESC LIMIT 50')->fetchAll();

ok(['entries' => array_map(fn($r) => [
    'id' => (int)$r['id'], 'adminName' => $r['admin_name'], 'action' => $r['action'],
    'target' => $r['target'], 'details' => $r['details'] ?? '', 'createdAt' => $r['created_at'],
], $rows)]);
