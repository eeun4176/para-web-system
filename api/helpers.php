<?php
// Shared helpers: JSON responses, sessions, CSRF, validation, error handling, login lockout, the audit log,
// and email sign-in (one-time codes, rate limits, sending email through Brevo).

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
// Admin accounts use the admin panel.
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

// ---------- Email sign-in: one-time codes, rate limits, sending email ----------
// Passengers sign in with Google, with a 6-digit code sent to their email, or with a password.
const CODE_MINUTES         = 10;   // a code works for 10 minutes
const CODE_MAX_TRIES       = 5;    // 5 wrong tries cancel the code
const CODE_RESEND_SECONDS  = 60;   // wait before asking for another code
const CODES_PER_HOUR       = 5;    // per email (and twice that per device/IP)
const RECENT_LOGIN_MINUTES = 10;   // just signed in: password / email changes skip the current password

// A lowercase email address, or a 422 error on $field.
function clean_email($raw, string $field = 'email'): string {
    $email = strtolower(trim((string)$raw));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255) {
        fail(422, 'Please fix the highlighted fields.', [$field => 'Enter a valid email address, like juan@gmail.com.']);
    }
    return $email;
}

// True when $ident (an email or IP) already did $action $max times in the last $minutes.
function rate_limited(string $action, string $ident, int $max, int $minutes): bool {
    $s = db()->prepare("SELECT COUNT(*) FROM rate_limits WHERE action = ? AND ident = ?
                        AND created_at > (NOW() - (? * INTERVAL '1 minute'))");
    $s->execute([$action, $ident, $minutes]);
    return (int)$s->fetchColumn() >= $max;
}
// Counts one $action by $ident (old counters are cleared after a day).
function rate_hit(string $action, string $ident): void {
    db()->prepare('INSERT INTO rate_limits (action, ident) VALUES (?, ?)')->execute([$action, $ident]);
    db()->exec("DELETE FROM rate_limits WHERE created_at < (NOW() - INTERVAL '1 day')");
}

// Only a hash of each code is stored (like a password), tied to its email.
function code_hash(string $email, string $code): string {
    return hash('sha256', $email . '|' . $code);
}

// Creates a new code for $email (cancelling its older unused ones) and returns it.
// Stops with 429 if a code was sent less than a minute ago or too many were sent this hour.
function issue_code(string $email, string $purpose, ?int $userId = null): string {
    $last = db()->prepare('SELECT EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) FROM login_codes WHERE email = ? AND purpose = ?');
    $last->execute([$email, $purpose]);
    $ago = $last->fetchColumn();
    if ($ago !== null && $ago < CODE_RESEND_SECONDS) {
        respond(['success' => false, 'message' => 'Please wait a moment before asking for another code.',
                 'resendIn' => max(1, min(CODE_RESEND_SECONDS, (int)ceil(CODE_RESEND_SECONDS - $ago)))], 429);
    }
    $count = db()->prepare("SELECT
        (SELECT COUNT(*) FROM login_codes WHERE email = ? AND created_at > NOW() - INTERVAL '1 hour'),
        (SELECT COUNT(*) FROM login_codes WHERE ip = ? AND created_at > NOW() - INTERVAL '1 hour')");
    $count->execute([$email, client_ip()]);
    [$byEmail, $byIp] = $count->fetch(PDO::FETCH_NUM);
    if ($byEmail >= CODES_PER_HOUR || $byIp >= CODES_PER_HOUR * 2) {
        fail(429, 'Too many codes were sent. Please try again in an hour, or use your password or Google.');
    }

    $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    db()->prepare('UPDATE login_codes SET used_at = NOW() WHERE email = ? AND purpose = ? AND used_at IS NULL')
        ->execute([$email, $purpose]);
    db()->prepare("INSERT INTO login_codes (email, user_id, purpose, code_hash, expires_at, ip)
                   VALUES (?, ?, ?, ?, NOW() + (? * INTERVAL '1 minute'), ?)")
        ->execute([$email, $userId, $purpose, code_hash($email, $code), CODE_MINUTES, client_ip()]);
    db()->exec("DELETE FROM login_codes WHERE created_at < (NOW() - INTERVAL '1 day')");
    return $code;
}

// Accepts the newest unused code for $email, or stops with 422 (a wrong try is counted; 5 cancel the code).
function check_code(string $email, string $purpose, string $code, ?int $userId = null): void {
    if (!preg_match('/^\d{6}$/', $code)) {
        fail(422, 'Enter the 6-digit code from your email.', ['code' => 'Enter the 6-digit code from your email.']);
    }
    $s = db()->prepare('SELECT id, code_hash, attempts FROM login_codes
                        WHERE email = ? AND purpose = ? AND used_at IS NULL AND expires_at > NOW()
                        AND (?::int IS NULL OR user_id = ?::int)
                        ORDER BY created_at DESC LIMIT 1');
    $s->execute([$email, $purpose, $userId, $userId]);
    $row = $s->fetch();
    if (!$row) fail(422, 'This code has expired. Send a new one.', ['code' => 'This code has expired. Send a new one.']);

    if (!hash_equals($row['code_hash'], code_hash($email, $code))) {
        $tries = (int)$row['attempts'] + 1;
        db()->prepare('UPDATE login_codes SET attempts = ?, used_at = CASE WHEN ? >= ? THEN NOW() END WHERE id = ?')
            ->execute([$tries, $tries, CODE_MAX_TRIES, $row['id']]);
        $msg = $tries >= CODE_MAX_TRIES ? 'Too many wrong tries. Send a new code.'
                                        : 'Incorrect code. ' . (CODE_MAX_TRIES - $tries) . ' tries left.';
        fail(422, $msg, ['code' => $msg]);
    }
    // Mark it used; if two requests raced with the same code, only one wins
    $use = db()->prepare('UPDATE login_codes SET used_at = NOW() WHERE id = ? AND used_at IS NULL');
    $use->execute([$row['id']]);
    if ($use->rowCount() !== 1) fail(422, 'This code was already used. Send a new one.', ['code' => 'This code was already used.']);
}

// A setting from the environment (Vercel), or from the git-ignored api/config/db.local.php on a local copy.
function app_setting(string $key): string {
    $env = getenv($key);
    if ($env !== false && $env !== '') return $env;
    static $local = null;
    if ($local === null) $local = is_file(__DIR__ . '/config/db.local.php') ? (require __DIR__ . '/config/db.local.php') : [];
    return (string)($local[$key] ?? '');
}

// Sends an email through Brevo's API (BREVO_API_KEY + MAIL_FROM, a sender address verified in Brevo).
// A local copy without them writes the email to api/logs/mail.log instead, so codes can be tested offline.
function send_mail(string $to, string $subject, string $text, string $html): void {
    $key  = app_setting('BREVO_API_KEY');
    $from = app_setting('MAIL_FROM');
    if ($key === '' || $from === '') {
        if (getenv('VERCEL')) {
            error_log('send_mail: BREVO_API_KEY / MAIL_FROM are not set');
            fail(503, 'Email codes are not available right now. Please log in with your password or Google.');
        }
        file_put_contents(__DIR__ . '/logs/mail.log', date('c') . " To: $to | $subject\n$text\n\n", FILE_APPEND | LOCK_EX);
        return;
    }
    $ch = curl_init('https://api.brevo.com/v3/smtp/email');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_HTTPHEADER     => ['api-key: ' . $key, 'Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_POSTFIELDS     => json_encode([
            'sender'      => ['name' => 'Para', 'email' => $from],
            'to'          => [['email' => $to]],
            'subject'     => $subject,
            'textContent' => $text,
            'htmlContent' => $html,
        ]),
    ]);
    $body   = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($status < 200 || $status >= 300) {
        error_log('send_mail: Brevo answered ' . $status . ' ' . substr((string)$body, 0, 300));
        fail(502, 'We could not send the email. Please try again in a moment.');
    }
}

// Emails a code: for signing in, or for confirming a new email address.
function send_code_email(string $to, string $code, string $purpose): void {
    $what = $purpose === 'change_email' ? 'confirm your new email' : 'log in to Para';
    $text = "Your Para code is $code\n\nUse it to $what. It expires in " . CODE_MINUTES . " minutes.\n"
          . "If you did not ask for this code, you can ignore this email.";
    $html = '<div style="font-family:Arial,sans-serif;max-width:460px;margin:auto;padding:24px;color:#1D1F1E">'
          . '<h2 style="margin:0 0 8px">Your Para code</h2>'
          . '<p style="margin:0 0 18px;color:#6B6F6D">Use it to ' . $what . '. It expires in ' . CODE_MINUTES . ' minutes.</p>'
          . '<p style="font-size:32px;font-weight:800;letter-spacing:8px;margin:0 0 18px">' . $code . '</p>'
          . '<p style="margin:0;color:#6B6F6D;font-size:13px">If you did not ask for this code, you can ignore this email.</p></div>';
    send_mail($to, "$code is your Para code", $text, $html);
}

// ---------- Signing in ----------
// Starts the signed-in session (new session ID, so an old one can't be reused) and notes when.
function sign_in(int $uid): void {
    session_regenerate_id(true);
    $_SESSION['user_id'] = $uid;
    $_SESSION['auth_at'] = time();
}
// True right after a sign-in (code, Google or password): sensitive changes skip the current password.
function recently_signed_in(): bool {
    return !empty($_SESSION['auth_at']) && time() - (int)$_SESSION['auth_at'] < RECENT_LOGIN_MINUTES * 60;
}
// Signs the user out on every other device (after a password change or an account link).
function end_other_sessions(int $uid): void {
    db()->prepare('DELETE FROM php_sessions WHERE id <> ? AND data LIKE ?')
        ->execute([session_id(), '%user_id|i:' . $uid . ';%']);
}
// The user fields sent to the browser after signing in.
function user_reply(array $u): array {
    return ['id' => (int)$u['id'], 'name' => $u['name'], 'email' => $u['email'], 'role' => $u['role'],
            'profilePicture' => $u['profile_picture'] ?? null];
}
