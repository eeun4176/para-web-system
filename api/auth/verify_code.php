<?php
// POST api/auth/verify_code.php {email, code} -> logs in with the emailed code.
// A new email gets a passenger account right away (name = the part before the @, editable in
// Account Settings; no password needed). The code proves the user owns the email.
require_once __DIR__ . '/../helpers.php';
require_post();

$in    = input();
$email = clean_email($in['email'] ?? '');
$code  = trim((string)($in['code'] ?? ''));

check_code($email, 'login', $code);

$s = db()->prepare('SELECT id, name, email, role, profile_picture, email_verified FROM users WHERE email = ?');
$s->execute([$email]);
$user = $s->fetch();
$created = false;

if ($user && $user['role'] === 'admin') fail(403, 'Administrators sign in on the admin sign-in page.');

if (!$user) {
    // "juan.dc@gmail.com" -> "juan.dc"
    $name = mb_substr(strstr($email, '@', true), 0, 100) ?: 'Para user';
    $s = db()->prepare('INSERT INTO users (name, email, email_verified) VALUES (?, ?, 1)
                        RETURNING id, name, email, role, profile_picture');
    $s->execute([$name, $email]);
    $user = $s->fetch();
    $created = true;
} elseif (!(int)$user['email_verified']) {
    db()->prepare('UPDATE users SET email_verified = 1 WHERE id = ?')->execute([$user['id']]);
}

sign_in((int)$user['id']);

ok(['user' => user_reply($user), 'created' => $created, 'csrf' => csrf_token()], $created ? 201 : 200);
