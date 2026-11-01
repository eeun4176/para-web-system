<?php
// Admin audit log: every change admins made to fares, landmarks and users, with search and filters.
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
    <title>Audit Log | Para Admin</title>

    <link rel="icon" type="image/png" href="../assets/img/favicon.png">
    <link rel="stylesheet" href="../style/global.css">
    <link rel="stylesheet" href="../style/admin.css">

    <script src="../scripts/early-theme.js"></script>
</head>

<body class="admin-body">

    <?php $activePage = 'audit'; require __DIR__ . '/partials/admin-nav.php'; ?>

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
                    <h2>Recent Administrator Actions</h2>

                    <p class="admin-hint">
                        Review the 50 most recent administrator actions recorded by the system.
                    </p>

                    <div class="table-toolbar">
                        <label class="table-search"><i data-lucide="search"></i><input type="search" id="audit-search" placeholder="Search actions" aria-label="Search actions" /></label>
                        <div class="filter-chips" id="audit-filter" role="group" aria-label="Filter"><button type="button" class="filter-chip is-active" data-filter="all">All</button><button type="button" class="filter-chip" data-filter="fares">Fares</button><button type="button" class="filter-chip" data-filter="landmarks">Landmarks</button><button type="button" class="filter-chip" data-filter="users">Users</button></div>
                    </div>

                    <div class="table-scroll">
                        <table class="admin-table" id="audit-table">
                            <thead>
                                <tr>
                                    <th>When</th>
                                    <th>Admin</th>
                                    <th>Action</th>
                                    <th>Target</th>
                                    <th>Details</th>
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