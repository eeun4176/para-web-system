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
    <title>Public Landmarks - Para</title>

    <link rel="icon" type="image/png" href="../assets/img/favicon.png">
    <link rel="stylesheet" href="../style/global.css">
    <link rel="stylesheet" href="../style/admin.css">
    <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css">

    <script src="../scripts/early-theme.js"></script>
</head>

<body class="admin-body">

    <?php $activePage = 'landmarks'; require __DIR__ . '/partials/admin-nav.php'; ?>

    <div id="notification-container" role="status" aria-live="polite"></div>

    <main class="admin-main">
        <div class="admin-wrap">
            <div class="admin-card" id="admin-denied" style="display: none;">
                <h2>Admins Only</h2>
                <p class="admin-hint">You need an admin account to see this page.</p>
                <a href="index.html">Back to home</a>
            </div>

            <div id="admin-content" style="display: none;">

                <section class="admin-card">
                    <h2>Manage Public Landmarks</h2>

                    <p class="admin-hint">
                        These landmarks are visible to everyone, including guests.
                    </p>

                    <div class="table-toolbar">
                        <label class="table-search"><i data-lucide="search"></i><input type="search" id="public-search" placeholder="Search landmarks" aria-label="Search landmarks" /></label>
                    </div>

                    <div class="table-scroll">
                        <table class="admin-table" id="public-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Location</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>

                    <h3>Add Public Landmark</h3>
                    <p class="admin-hint">Click the map to choose the spot, then fill in the details.</p>

                    <div class="admin-map" id="admin-landmark-map"></div>

                    <div class="add-form" id="add-landmark-form">
                        <label>
                            Name
                            <input type="text" class="wide" id="new-lm-name" maxlength="150" placeholder="e.g. Tungko Terminal">
                        </label>

                        <label>
                            Category
                            <select id="new-lm-category">
                                <option value="terminal">Terminal</option>
                                <option value="school">School</option>
                                <option value="hospital">Hospital</option>
                                <option value="market">Market</option>
                                <option value="church">Church</option>
                                <option value="park">Park</option>
                                <option value="food">Food</option>
                                <option value="other">Other</option>
                            </select>
                        </label>

                        <label>
                            Description (optional)
                            <input type="text" class="wide" id="new-lm-desc" maxlength="500">
                        </label>

                        <label>
                            Location
                            <input type="text" class="wide" id="new-lm-location" placeholder="Click the map" readonly>
                        </label>

                        <button type="button" class="row-btn" id="add-landmark-btn">Add landmark</button>
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
    <script src="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"></script>
    <script src="../scripts/admin.js"></script>
    <script src="../scripts/ui.js"></script>

</body>
</html>