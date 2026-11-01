<?php
// POST api/auth/update_profile_picture.php {image: data URL|null}
require_once __DIR__ . '/../helpers.php';
require_post();

$uid = require_login();
$in = input();
$image = $in['image'] ?? null;

if ($image !== null && !is_string($image)) {
    fail(422, 'Invalid profile picture.');
}

$old = db()->prepare('SELECT profile_picture FROM users WHERE id = ?');
$old->execute([$uid]);
$oldPath = $old->fetchColumn();

if ($image === null || $image === '') {
    $save = db()->prepare('UPDATE users SET profile_picture = NULL WHERE id = ?');
    $save->execute([$uid]);
    remove_profile_picture($oldPath);
    ok(['profilePicture' => null]);
}

if (!preg_match('#^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=\r\n]+)$#', $image, $matches)) {
    fail(422, 'Use a JPG, PNG, or WebP image.');
}

$binary = base64_decode(preg_replace('/\s+/', '', $matches[2]), true);
if ($binary === false || strlen($binary) > 2 * 1024 * 1024) {
    fail(422, 'Profile pictures must be 2 MB or smaller.');
}

$mime = (new finfo(FILEINFO_MIME_TYPE))->buffer($binary);
$extensions = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp'
];
if (!isset($extensions[$mime])) {
    fail(422, 'The uploaded file is not a supported image.');
}
$dimensions = @getimagesizefromstring($binary);
if (!$dimensions || $dimensions[0] < 1 || $dimensions[1] < 1 || $dimensions[0] > 4000 || $dimensions[1] > 4000) {
    fail(422, 'Profile pictures must be valid images no larger than 4000 by 4000 pixels.');
}

$directory = dirname(__DIR__, 2) . '/uploads/profile';
if (!is_dir($directory) && !mkdir($directory, 0755, true)) {
    fail(500, 'Could not prepare profile picture storage.');
}

$filename = bin2hex(random_bytes(16)) . '.' . $extensions[$mime];
$absolutePath = $directory . '/' . $filename;
if (file_put_contents($absolutePath, $binary, LOCK_EX) === false) {
    fail(500, 'Could not save the profile picture.');
}

$relativePath = 'uploads/profile/' . $filename;
$save = db()->prepare('UPDATE users SET profile_picture = ? WHERE id = ?');
$save->execute([$relativePath, $uid]);
remove_profile_picture($oldPath);

ok(['profilePicture' => $relativePath]);

function remove_profile_picture($path): void
{
    if (!$path || !is_string($path) || !str_starts_with($path, 'uploads/profile/')) {
        return;
    }

    $file = dirname(__DIR__, 2) . '/' . $path;
    if (is_file($file)) {
        unlink($file);
    }
}
