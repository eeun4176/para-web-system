<?php
require_once __DIR__ . '/../config/session.php';   // DB-backed session (shared with the API)

require_once __DIR__ . '/../config/db.php';

if (empty($_SESSION['user_id'])) {
    header('Location: admin-login.html');
    exit;
}

try {
    $stmt = db()->prepare('SELECT role FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $role = $stmt->fetchColumn();

    if ($role === false) {
        session_unset();
        session_destroy();

        header('Location: admin-login.html');
        exit;
    }

    if ($role !== 'admin') {
        header('Location: index.html');
        exit;
    }
} catch (Throwable $e) {
    http_response_code(500);
    exit('Unable to verify administrator access. Please try again later.');
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Settings - Para</title>

    <link rel="icon" type="image/png" href="../assets/img/favicon.png">
    <link rel="stylesheet" href="../style/global.css">
    <link rel="stylesheet" href="../style/admin.css">

    <script src="../scripts/early-theme.js"></script>
</head>

<body class="admin-body">

    <?php $activePage = 'settings'; require __DIR__ . '/partials/admin-nav.php'; ?>

    <div id="notification-container" role="status" aria-live="polite"></div>

    <main class="admin-main">
        <div class="admin-wrap">
            <div id="admin-content" class="admin-settings">

                <!-- Who is signed in -->
                <header class="admin-profile">
                    <span class="admin-avatar" aria-hidden="true"><i data-lucide="shield-check"></i></span>
                    <div>
                        <h2 id="admin-name"><span class="skeleton skeleton-line short"></span></h2>
                        <p class="admin-hint">Administrator · account key <b id="admin-key">…</b></p>
                    </div>
                </header>

                <!-- One section at a time (the highlight slides, see ui.js) -->
                <div class="seg settings-tabs" role="tablist" aria-label="Settings sections">
                    <button type="button" class="seg-btn is-active" role="tab" data-tab="account" aria-selected="true"><i data-lucide="user"></i> Account</button>
                    <button type="button" class="seg-btn" role="tab" data-tab="security" aria-selected="false"><i data-lucide="lock"></i> Security</button>
                </div>

                <!-- Account: the name shown in the audit log, and the account key used to sign in -->
                <section class="admin-card settings-panel" data-panel="account" role="tabpanel">
                    <h2>Account</h2>
                    <p class="admin-hint">The name appears in the audit log next to every change you make.</p>
                    <dl class="detail-rows" id="admin-account">
                        <div><dt>Account key</dt><dd id="admin-key-row">—</dd></div>
                        <div><dt>Role</dt><dd>Administrator</dd></div>
                    </dl>
                    <form class="admin-form" id="admin-name-form" novalidate>
                        <label class="admin-field">Display name
                            <input type="text" id="admin-name-input" maxlength="100" autocomplete="name" required />
                        </label>
                        <button type="submit" class="row-btn">Save name</button>
                    </form>
                </section>

                <!-- Security: change the password (the current one is required) -->
                <section class="admin-card settings-panel" data-panel="security" role="tabpanel" hidden>
                    <h2>Password</h2>
                    <p class="admin-hint">Use at least 8 characters. You stay signed in after changing it.</p>
                    <form class="admin-form" id="admin-password-form" novalidate>
                        <label class="admin-field">Current password
                            <input type="password" id="admin-current-pw" autocomplete="current-password" required />
                        </label>
                        <label class="admin-field">New password
                            <input type="password" id="admin-new-pw" autocomplete="new-password" minlength="8" required />
                        </label>
                        <label class="admin-field">Confirm new password
                            <input type="password" id="admin-confirm-pw" autocomplete="new-password" required />
                        </label>
                        <button type="submit" class="row-btn">Change password</button>
                    </form>
                </section>

            </div>
        </div>
    </main>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script src="https://unpkg.com/lucide@1.66.0/dist/umd/lucide.min.js"></script>
    <script src="../scripts/api.js"></script>
    <script src="../scripts/auth.js"></script>
    <script src="../scripts/data-manager.js"></script>
    <script src="../scripts/app.js"></script>
    <script src="../scripts/admin.js"></script>
    <script src="../scripts/ui.js"></script>

</body>
</html>