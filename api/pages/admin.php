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
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dashboard | Para Admin</title>

    <link rel="icon" type="image/png" href="../assets/img/favicon.png" />

    <link rel="stylesheet" href="../style/global.css" />
    <link rel="stylesheet" href="../style/admin.css" />
    <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css" />
    <script src="../scripts/early-theme.js"></script>
</head>

<body class="admin-body">

    <?php $activePage = 'dashboard'; require __DIR__ . '/partials/admin-nav.php'; ?>

    <div id="notification-container" role="status" aria-live="polite"></div>

    <main class="admin-main">
    <div class="admin-wrap">
        <div class="admin-card" id="admin-denied" style="display: none;">
            <h2>Admins Only</h2>
            <p class="admin-hint">You need an admin account to see this page.</p>
            <a href="index.html">Back to Home</a>
        </div>

        <div id="admin-content" style="display: none;">

            <!-- Numbers (filled by admin.js: loadStats) -->
            <div class="stat-grid" id="stat-grid"></div>

            <!-- Charts drawn with plain HTML bars (admin.js: loadCharts) -->
            <div class="dash-two">
                <section class="admin-card">
                    <div class="card-head"><h2>Trips per Day</h2><span class="admin-cap">Last 14 days</span></div>
                    <div class="day-bars" id="chart-trips"></div>
                    <p class="chart-readout" id="trips-readout"></p>
                </section>

                <section class="admin-card">
                    <div class="card-head"><h2>Trips by Vehicle</h2><span class="admin-cap">Share of trips</span></div>
                    <div class="bar-list" id="chart-vehicle"></div>
                </section>
            </div>

            <!-- Where people go (admin.js: loadHeatmap). The calendar is the icon in the header. -->
            <section class="admin-card">
                <div class="card-head"><h2>Where People Go</h2><span class="admin-cap">Trip destinations, last 90 days</span></div>
                <div class="heat-map" id="heat-map" role="img" aria-label="Heat map of trip destinations in SJDM"></div>
                <p class="heat-legend">Fewer trips <i></i> More trips</p>
            </section>

            <section class="admin-card">
                <div class="card-head"><h2>Most Common Destinations</h2><span class="admin-cap">Saved trips</span></div>
                <div class="bar-list" id="chart-dest"></div>
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
    <script src="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"></script>
    <script src="../scripts/admin.js"></script>
    <script src="../scripts/ui.js"></script>

</body>

</html>
