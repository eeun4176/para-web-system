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

if ($image === null || $image === '') {
    $save = db()->prepare('UPDATE users SET profile_picture = NULL, avatar = NULL, avatar_mime = NULL WHERE id = ?');
    $save->execute([$uid]);
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

// Stored in the database (Vercel has no persistent disk). The ?v= value changes on every upload
// so browsers fetch the new picture instead of a cached one.
$url = 'api/auth/avatar.php?v=' . bin2hex(random_bytes(8));
$save = db()->prepare('UPDATE users SET avatar = ?, avatar_mime = ?, profile_picture = ? WHERE id = ?');
$save->bindValue(1, $binary, PDO::PARAM_LOB);
$save->bindValue(2, $mime);
$save->bindValue(3, $url);
$save->bindValue(4, $uid, PDO::PARAM_INT);
$save->execute();

ok(['profilePicture' => $url]);
