<?php
// Shared helpers: JSON responses, sessions, CSRF, validation, error handling.
// Every endpoint starts with: require_once __DIR__ . '/helpers.php';  (../helpers.php in subfolders)

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Never show PHP errors to users; log them instead (api/logs/error.log locally,
// stderr on Vercel where the disk is read-only -> shows in Vercel's Logs tab)
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', is_writable(__DIR__ . '/logs') ? __DIR__ . '/logs/error.log' : 'php://stderr');
error_reporting(E_ALL);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/session.php';   // DB-backed session + secure cookie settings

// ---------- JSON responses ----------
function respond(array $data, int $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
// Sends a success reply as JSON.
function ok(array $data = [], int $status = 200) {
    respond(['success' => true] + $data, $status);
}
// Sends an error reply as JSON (with field errors when given) and stops.
function fail(int $status, string $message, array $errors = []) {
    $out = ['success' => false, 'message' => $message];
    if ($errors) $out['errors'] = $errors;
    respond($out, $status);
}

// ---------- Global error handling ----------
set_exception_handler(function (Throwable $e) {
    error_log($e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    fail(500, 'Something went wrong on the server. Please try again.');
});
set_error_handler(function ($no, $str, $file, $line) {
    throw new ErrorException($str, 0, $no, $file, $line);
});

// ---------- Request helpers ----------
function require_method(string $method) {
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        header('Allow: ' . $method);
        fail(405, 'Method not allowed.');
    }
}

// Reads JSON bodies (fetch/$.ajax with JSON) or normal form posts ($.post)
function input(): array {
    static $data = null;
    if ($data !== null) return $data;
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($type, 'application/json') !== false) {
        $decoded = json_decode(file_get_contents('php://input'), true);
        if (!is_array($decoded)) fail(400, 'Invalid JSON body.');
        $data = $decoded;
    } else {
        $data = $_POST;
    }
    return $data;
}

// ---------- CSRF ----------
function csrf_token(): string {
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}
// Stops the request unless it carries this session's CSRF token (blocks forged requests).
function require_csrf() {
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($sent) || !hash_equals(csrf_token(), $sent)) {
        fail(403, 'Invalid or missing security token. Refresh the page and try again.');
    }
}
// Every request that changes data: POST + valid CSRF token
function require_post() {
    require_method('POST');
    require_csrf();
}

// ---------- Auth ----------
function require_login(): int {
    if (empty($_SESSION['user_id'])) fail(401, 'Please log in first.');
    return (int) $_SESSION['user_id'];
}

// ---------- Validation ----------
const SJDM_LAT = [14.68, 14.88];
const SJDM_LNG = [121.01, 121.17];
const CATEGORIES = ['school','hospital','terminal','market','church','park','food','other'];

// A positive whole number id, or a 422 error.
function valid_id($value): int {
    $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($id === false) fail(422, 'Invalid id.');
    return $id;
}

// Checks and tidies the fields of a landmark (name, category, description, location).
function clean_landmark(array $in, bool $needCoords): array {
    $errors   = [];
    $name     = trim((string)($in['name'] ?? ''));
    $category = (string)($in['category'] ?? 'other');
    $desc     = trim((string)($in['description'] ?? ''));

    if ($name === '' || mb_strlen($name) > 150) $errors['name'] = 'Name is required (max 150 characters).';
    if (!in_array($category, CATEGORIES, true))  $errors['category'] = 'Invalid category.';
    if (mb_strlen($desc) > 500)                  $errors['description'] = 'Description is too long (max 500 characters).';

    $lat = $lng = null;
    if ($needCoords) {
        $lat = $in['lat'] ?? null;
        $lng = $in['lng'] ?? null;
        if (!is_numeric($lat) || $lat < SJDM_LAT[0] || $lat > SJDM_LAT[1]) $errors['lat'] = 'Latitude is outside San Jose del Monte.';
        if (!is_numeric($lng) || $lng < SJDM_LNG[0] || $lng > SJDM_LNG[1]) $errors['lng'] = 'Longitude is outside San Jose del Monte.';
    }

    if ($errors) fail(422, 'Please fix the highlighted fields.', $errors);
    return [
        'name' => $name, 'category' => $category, 'description' => $desc,
        'lat' => $lat === null ? null : (float)$lat,
        'lng' => $lng === null ? null : (float)$lng,
    ];
}

// Validates the route fields shared by trips and favorite routes.
// Expected keys: originName, originLat, originLng, destName, destLat, destLng, transport, passenger
function clean_route(array $in): array {
    $errors = [];
    $r = [];
    foreach (['origin', 'dest'] as $p) {
        $name = trim((string)($in[$p . 'Name'] ?? ''));
        $lat  = $in[$p . 'Lat'] ?? null;
        $lng  = $in[$p . 'Lng'] ?? null;
        if ($name === '' || mb_strlen($name) > 200) $errors[$p . 'Name'] = 'Place name is required (max 200 characters).';
        if (!is_numeric($lat) || $lat < SJDM_LAT[0] || $lat > SJDM_LAT[1]) $errors[$p . 'Lat'] = 'Latitude is outside San Jose del Monte.';
        if (!is_numeric($lng) || $lng < SJDM_LNG[0] || $lng > SJDM_LNG[1]) $errors[$p . 'Lng'] = 'Longitude is outside San Jose del Monte.';
        $r[$p] = ['name' => $name, 'lat' => (float)$lat, 'lng' => (float)$lng];
    }
    $transport = (string)($in['transport'] ?? '');
    $passenger = (string)($in['passenger'] ?? '');
    if ($transport === '' || strlen($transport) > 30) $errors['transport'] = 'Transport type is required.';
    if ($passenger === '' || strlen($passenger) > 20) $errors['passenger'] = 'Passenger type is required.';

    if ($errors) fail(422, 'Please fix the highlighted fields.', $errors);
    return $r + ['transport' => $transport, 'passenger' => $passenger];
}

// ---------- Roles ----------
// The role is always read from the database, never trusted from the session or the browser.
function current_role(): ?string {
    if (empty($_SESSION['user_id'])) return null;
    $s = db()->prepare('SELECT role FROM users WHERE id = ?');
    $s->execute([$_SESSION['user_id']]);
    $role = $s->fetchColumn();
    return $role === false ? null : $role;
}
// True when the signed-in user is an admin.
function is_admin(): bool {
    return current_role() === 'admin';
}
// Stops the request unless the signed-in user is an admin.
function require_admin(): int {
    $uid = require_login();
    if (!is_admin()) fail(403, 'Admin access required.');
    return $uid;
}
// Passenger features (trips, favorites, personal landmarks) are for normal users only.
// Admin accounts use the admin panel; to test the passenger side, log in with a normal account.
function require_passenger(): int {
    $uid = require_login();
    if (is_admin()) fail(403, 'Admin accounts cannot use passenger features. Log in with a passenger account.');
    return $uid;
}

// Reads a number from $in and checks its range; records an error message if invalid
function clean_number(array $in, string $key, float $min, float $max, string $label, array &$errors) {
    $v = $in[$key] ?? null;
    if (!is_numeric($v) || $v < $min || $v > $max) {
        $errors[$key] = $label . ' must be a number between ' . $min . ' and ' . $max . '.';
        return null;
    }
    return (float) $v;
}

// ---------- Audit log (admin actions) ----------
// Names the kind of constraint a failed query broke (PostgreSQL SQLSTATE codes): 'unique', 'fk' or null
function db_error(PDOException $e): ?string {
    return ['23505' => 'unique', '23503' => 'fk'][$e->getCode()] ?? null;
}

// Writes one line to the audit log (who changed what).
function audit(string $action, string $target, string $details = ''): void {
    $uid = $_SESSION['user_id'] ?? null;
    $n = db()->prepare('SELECT name FROM users WHERE id = ?');
    $n->execute([$uid]);
    $name = (string)($n->fetchColumn() ?: 'Unknown');
    db()->prepare('INSERT INTO audit_log (admin_id, admin_name, action, target, details) VALUES (?, ?, ?, ?, ?)')
        ->execute([$uid, $name, $action, mb_substr($target, 0, 150), mb_substr($details, 0, 500)]);
}

// "Base fare 14.00 → 15.00; Avg speed 22.00 → 25.00" (only the fields that changed)
function diff_text(array $old, array $new, array $labels): string {
    $parts = [];
    foreach ($labels as $key => $label) {
        if (abs((float)$old[$key] - (float)$new[$key]) > 0.00001) {
            $parts[] = $label . ' ' . number_format((float)$old[$key], 2, '.', '')
                     . ' → ' . number_format((float)$new[$key], 2, '.', '');
        }
    }
    return implode('; ', $parts);
}

// ---------- Login attempt limiting ----------
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;

// The visitor's IP address (behind Vercel's proxy too).
function client_ip(): string {
    return substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
}
// True when this account had too many failed sign-ins in the last minutes.
function login_locked(string $email): bool {
    $s = db()->prepare('SELECT COUNT(*) FROM login_attempts WHERE email = ? AND ip = ?
                        AND attempted_at > (NOW() - INTERVAL \'' . LOGIN_LOCK_MINUTES . ' minutes\')');
    $s->execute([$email, client_ip()]);
    return (int)$s->fetchColumn() >= MAX_LOGIN_ATTEMPTS;
}
// Counts a failed sign-in.
function record_failed_login(string $email): void {
    db()->prepare('INSERT INTO login_attempts (email, ip) VALUES (?, ?)')->execute([$email, client_ip()]);
    db()->exec("DELETE FROM login_attempts WHERE attempted_at < (NOW() - INTERVAL '1 day')");
}
// Forgets the failed sign-ins after a successful one.
function clear_failed_logins(string $email): void {
    db()->prepare('DELETE FROM login_attempts WHERE email = ? AND ip = ?')->execute([$email, client_ip()]);
}
