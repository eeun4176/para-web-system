<?php
// POST api/auth/google.php  {credential}
// "Continue with Google":
//   1. The Google button in auth.html gives the browser an ID token ("credential").
//   2. The browser sends it here.
//   3. PHP asks Google if the token is real, then logs the user in.
//      First Google sign-in creates the account, or links it to an existing account with the same email.
require_once __DIR__ . '/../helpers.php';
require_post();

// Public ID of Para's Google OAuth client (the same ID is in scripts/auth.js).
const GOOGLE_CLIENT_ID = '996359971314-0okl6c7g9t504jm39rla9ob94q2rslre.apps.googleusercontent.com';

$credential = (string)(input()['credential'] ?? '');
if ($credential === '') fail(422, 'Missing Google sign-in token.');

// ---------- Step 1: ask Google to check the token ----------
function google_token_info(string $token): ?array {
    $ch = curl_init('https://oauth2.googleapis.com/tokeninfo');
    curl_setopt_array($ch, [
        CURLOPT_POSTFIELDS     => http_build_query(['id_token' => $token]),   // POST keeps the token out of URLs/logs
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
    ]);
    $body   = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($body === false || $status !== 200) return null;   // Google said the token is invalid (or Google is unreachable)
    return json_decode($body, true);
}

$google = google_token_info($credential);

// ---------- Step 2: make sure the token is for Para and the email is verified ----------
$isValid = is_array($google)
    && ($google['aud'] ?? '') === GOOGLE_CLIENT_ID                                       // made for our app
    && in_array($google['iss'] ?? '', ['accounts.google.com', 'https://accounts.google.com'], true)  // made by Google
    && ($google['email_verified'] ?? '') === 'true'                                      // Google confirmed the email
    && (int)($google['exp'] ?? 0) > time()                                               // not expired
    && !empty($google['sub']) && !empty($google['email']);
if (!$isValid) fail(401, 'Google sign-in failed. Please try again.');

$googleId = (string)$google['sub'];
$email    = strtolower((string)$google['email']);
$name     = trim((string)($google['name'] ?? '')) ?: strstr($email, '@', true);
$name     = mb_substr($name, 0, 100);

// ---------- Step 3: find, link or create the Para account ----------
function find_user(string $column, string $value): ?array {
    // $column is always one of our own literal column names below, never user input
    $s = db()->prepare("SELECT id, name, email, role, profile_picture, google_sub, email_verified FROM users WHERE $column = ?");
    $s->execute([$value]);
    return $s->fetch() ?: null;
}

$user = find_user('google_sub', $googleId);           // signed in with Google before

if (!$user) {
    $user = find_user('email', $email);               // has a Para account with the same email
    if ($user && $user['google_sub'] !== null) {
        fail(409, 'This email is already linked to a different Google account.');
    }
    if ($user && $user['role'] === 'admin') fail(403, 'Administrators sign in on the admin sign-in page.');
    if ($user) {
        // Google proves this person owns the email. If the account was never proven to be theirs (an old
        // sign-up without an email code), someone else may have made it and set the password: remove that
        // password and sign out its other sessions, so only the real owner keeps access.
        $unverified = !(int)$user['email_verified'];
        db()->prepare('UPDATE users SET google_sub = ?, email_verified = 1'
                      . ($unverified ? ', password_hash = NULL' : '') . ' WHERE id = ?')
            ->execute([$googleId, $user['id']]);
        if ($unverified) end_other_sessions((int)$user['id']);
    }
}

if (!$user) {                                         // brand-new user: create a passenger account (no password)
    $s = db()->prepare('INSERT INTO users (name, email, google_sub, email_verified) VALUES (?, ?, ?, 1)
                        RETURNING id, name, email, role, profile_picture');
    $s->execute([$name, $email, $googleId]);
    $user = $s->fetch();
}

// Admins have their own sign-in page; Google is for passengers only
if ($user['role'] === 'admin') fail(403, 'Administrators sign in on the admin sign-in page.');

// ---------- Step 4: log in (same as login.php) ----------
sign_in((int)$user['id']);

ok(['user' => user_reply($user), 'csrf' => csrf_token()]);
