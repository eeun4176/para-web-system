<?php
require_once __DIR__ . '/../config/session.php';   // DB-backed session (shared with the API)

require_once __DIR__ . '/../config/db.php';

if (empty($_SESSION['user_id'])) {
    header('Location: auth.html');
    exit;
}

try {
    $stmt = db()->prepare('SELECT role FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $role = $stmt->fetchColumn();

    if ($role === false) {
        session_unset();
        session_destroy();

        header('Location: auth.html');
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

    <link rel="icon" type="image/png" href="../assets/logo-1.png">
    <link rel="stylesheet" href="../style/global.css">
    <link rel="stylesheet" href="../style/admin.css">
    <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css">

    <link rel="stylesheet"
        href="https://cdn-uicons.flaticon.com/uicons-regular-rounded/css/uicons-regular-rounded.css">

    <script src="../scripts/early-theme.js"></script>
</head>

<body>

    <nav class="navbar" role="navigation" aria-label="Main navigation">
        <div class="navbar-inner">
            <div class="nav-logo-container">
                <a href="admin.php">
                    <img src="../assets/logo-2.png" id="navbar-logo" alt="Para logo">
                </a>
            </div>

            <div class="nav-right">
                <button id="dark-toggle" class="dark-toggle"
                    aria-label="Toggle dark mode" aria-pressed="false">
                    <div class="toggle-knob">
                        <img src="../assets/light-icon.png" alt="Mode icon">
                    </div>
                </button>

                <div id="nav-auth-area">
                    <a href="auth.html" class="nav-auth-btn">Log In</a>
                </div>

                <button class="hamburger-btn" id="hamburger-btn" aria-label="Open menu">
                    <img src="../assets/menu.png" alt="Menu">
                </button>
            </div>
        </div>
    </nav>

    <nav class="admin-subnav" aria-label="Admin navigation">
        <a href="admin.php">Dashboard</a>
        <a href="admin-fares.php">Fare Management</a>
        <a href="admin-landmarks.php" class="active" aria-current="page">Public Landmarks</a>
        <a href="admin-users.php">Users</a>
        <a href="admin-audit.php">Audit Log</a>
    </nav>

    <div class="sidebar-overlay" id="sidebar-overlay">
        <aside class="sidebar" role="dialog" aria-label="Mobile navigation">
            <button class="sidebar-close" id="sidebar-close" aria-label="Close menu">&times;</button>

            <div id="sidebar-auth-area">
                <a href="auth.html" class="sidebar-auth-btn">Log In</a>
            </div>
        </aside>
    </div>

    <div id="notification-container" role="status" aria-live="polite"></div>

    <main>
        <div class="admin-wrap">
            <h1 class="admin-title">Public Landmarks</h1>

            <div class="admin-card" id="admin-denied" style="display: none;">
                <h2>Admins only</h2>
                <p class="admin-hint">You need an admin account to see this page.</p>
                <a href="index.html">Back to home</a>
            </div>

            <div id="admin-content" style="display: none;">

                <section class="admin-card">
                    <h2>Manage Public Landmarks</h2>

                    <p class="admin-hint">
                        These landmarks are visible to everyone, including guests.
                    </p>

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
                            <input type="text" id="new-lm-location" placeholder="Click the map" readonly>
                        </label>

                        <button type="button" class="row-btn" id="add-landmark-btn">Add landmark</button>
                    </div>
                </section>

            </div>
        </div>
    </main>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script src="../scripts/api.js"></script>
    <script src="../scripts/auth.js"></script>
    <script src="../scripts/data-manager.js"></script>
    <script src="../scripts/app.js"></script>
    <script src="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"></script>
    <script src="../scripts/admin.js"></script>

</body>
</html>