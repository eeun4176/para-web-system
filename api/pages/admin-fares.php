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
    <title>Fare Management - Para</title>

    <link rel="icon" type="image/png" href="../assets/logo-1.png">
    <link rel="stylesheet" href="../style/global.css">
    <link rel="stylesheet" href="../style/admin.css">

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
        <a href="admin-fares.php" class="active" aria-current="page">Fare Management</a>
        <a href="admin-landmarks.php">Public Landmarks</a>
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
            <h1 class="admin-title">Fare Management</h1>

            <div class="admin-card" id="admin-denied" style="display: none;">
                <h2>Admins only</h2>
                <p class="admin-hint">You need an admin account to see this page.</p>
                <a href="index.html">Back to home</a>
            </div>

            <div id="admin-content" style="display: none;">

                <section class="admin-card">
                    <h2>Vehicle Types</h2>

                    <p class="admin-hint">
                        Changes apply to future fare calculations. Saved trips retain the fare
                        they had when they were saved.
                    </p>

                    <div class="table-scroll">
                        <table class="admin-table type-table" id="transport-table" data-kind="transport">
                            <thead>
                                <tr>
                                    <th>Vehicle</th>
                                    <th>Base fare (₱)</th>
                                    <th>Base km</th>
                                    <th>Excess per km (₱)</th>
                                    <th>Avg speed (km/h)</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>

                    <h3>Add Vehicle Type</h3>

                    <div class="add-form" id="add-transport-form">
                        <label>
                            Code
                            <input type="text" id="new-t-code" placeholder="e.g. uv_express" maxlength="30">
                        </label>

                        <label>
                            Label
                            <input type="text" class="wide" id="new-t-label" placeholder="e.g. UV Express" maxlength="60">
                        </label>

                        <label>
                            Base fare (₱)
                            <input type="number" id="new-t-fare" step="0.01" min="0">
                        </label>

                        <label>
                            Base km
                            <input type="number" id="new-t-km" step="0.1" min="0">
                        </label>

                        <label>
                            Excess/km (₱)
                            <input type="number" id="new-t-excess" step="0.01" min="0">
                        </label>

                        <label>
                            Avg speed
                            <input type="number" id="new-t-speed" step="1" min="0">
                        </label>

                        <button type="button" class="row-btn" id="add-transport-btn">Add vehicle</button>
                    </div>
                </section>

                <section class="admin-card">
                    <h2>Passenger Discounts</h2>

                    <div class="table-scroll">
                        <table class="admin-table type-table" id="passenger-table" data-kind="passenger">
                            <thead>
                                <tr>
                                    <th>Passenger type</th>
                                    <th>Discount (%)</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>

                    <h3>Add Passenger Type</h3>

                    <div class="add-form" id="add-passenger-form">
                        <label>
                            Code
                            <input type="text" id="new-p-code" placeholder="e.g. veteran" maxlength="20">
                        </label>

                        <label>
                            Label
                            <input type="text" class="wide" id="new-p-label" placeholder="e.g. Veteran" maxlength="40">
                        </label>

                        <label>
                            Discount (%)
                            <input type="number" id="new-p-pct" step="1" min="0" max="100">
                        </label>

                        <button type="button" class="row-btn" id="add-passenger-btn">
                            Add passenger type
                        </button>
                    </div>

                    <p class="admin-hint" style="margin-top: 10px;">
                        Deactivating a type hides it from the calculator while keeping saved trips
                        working. Deleting only works for types nobody has used.
                    </p>
                </section>

            </div>
        </div>
    </main>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script src="../scripts/api.js"></script>
    <script src="../scripts/auth.js"></script>
    <script src="../scripts/data-manager.js"></script>
    <script src="../scripts/app.js"></script>
    <script src="../scripts/admin.js"></script>

</body>
</html>