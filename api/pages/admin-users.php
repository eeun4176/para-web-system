<?php
// Admin users: every account with its role and saved data, with search, filters and delete.
// Only signed-in admins get the page; anyone else is sent to the right sign-in page.
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
    <title>Users | Para Admin</title>

    <link rel="icon" type="image/png" href="../assets/img/favicon.png">
    <link rel="stylesheet" href="../style/global.css">
    <link rel="stylesheet" href="../style/admin.css">

    <script src="../scripts/early-theme.js"></script>
</head>

<body class="admin-body">

    <?php $activePage = 'users'; require __DIR__ . '/partials/admin-nav.php'; ?>

    <div id="notification-container" role="status" aria-live="polite"></div>

    <main class="admin-main">
        <div class="admin-wrap">
            <div class="admin-card" id="admin-denied" style="display: none;">
                <h2>Admins Only</h2>
                <p class="admin-hint">You need an admin account to see this page.</p>
                <a href="index.html">Back to Home</a>
            </div>

            <div id="admin-content" style="display: none;">

                <section class="admin-card">
                    <h2>Registered Users <span class="info-tip" tabindex="0" role="img" aria-label="Deleting a user also deletes their trips, favorites and landmarks." data-tip="Deleting a user also deletes their trips, favorites and landmarks."><i data-lucide="info"></i></span></h2>

                    <div class="table-toolbar">
                        <label class="table-search"><i data-lucide="search"></i><input type="search" id="users-search" placeholder="Search name or email" aria-label="Search name or email" /></label>
                        <div class="filter-chips" id="users-filter" role="group" aria-label="Filter"><button type="button" class="filter-chip is-active" data-filter="all">All</button><button type="button" class="filter-chip" data-filter="user">Passengers</button><button type="button" class="filter-chip" data-filter="admin">Admins</button></div>
                    </div>

                    <div class="table-scroll">
                        <table class="admin-table" id="users-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                    <th>Trips</th>
                                    <th>Landmarks</th>
                                    <th>Favorites</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
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