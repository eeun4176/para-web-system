<?php
// Vercel entry point: the only PHP function deployed (Hobby allows 12 per deployment; this API has ~40 scripts).
// vercel.json rewrites /api/<path>.php to /api/index.php?__route=<path>, and this file runs that script.
// On XAMPP it is never used: Apache runs each api/*.php file directly.

$route = $_GET['__route'] ?? '';
unset($_GET['__route']);

// Only endpoint folders, plain names: blocks ../, config/, helpers.php, fare_logic.php and this file.
$ok = preg_match('#^(?:(?:admin|auth|favorites|landmarks|trips|pages)/)?[a-z_-]+$#', $route)
    && !in_array($route, ['index', 'helpers', 'fare_logic'], true)
    && is_file(__DIR__ . "/$route.php");

if (!$ok) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Not found.']);
    exit;
}

$_SERVER['SCRIPT_NAME'] = "/api/$route.php";
require __DIR__ . "/$route.php";
