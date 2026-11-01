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
    <title>Audit Log - Para</title>

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
                <a href="index.html">
                    <img src="../assets/logo-2.png" id="navbar-logo" alt="Para logo">
                </a>
            </div>

            <ul class="nav-links" aria-label="Site navigation">
                <li><a href="index.html">Home</a></li>
                <li><a href="calculate.html">Calculate</a></li>
                <li><a href="aboutus.html">About Us</a></li>
            </ul>

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
        <a href="admin-landmarks.php">Public Landmarks</a>
        <a href="admin-users.php">Users</a>
        <a href="admin-audit.php" class="active" aria-current="page">Audit Log</a>
    </nav>

    <div class="sidebar-overlay" id="sidebar-overlay">
        <aside class="sidebar" role="dialog" aria-label="Mobile navigation">
            <button class="sidebar-close" id="sidebar-close" aria-label="Close menu">&times;</button>

            <ul class="sidebar-nav">
                <li><a href="index.html">Home</a></li>
                <li><a href="calculate.html">Calculate</a></li>
                <li><a href="aboutus.html">About Us</a></li>
            </ul>

            <div id="sidebar-auth-area">
                <a href="auth.html" class="sidebar-auth-btn">Log In</a>
            </div>
        </aside>
    </div>

    <div id="notification-container" role="status" aria-live="polite"></div>

    <main>
        <div class="admin-wrap">
            <h1 class="admin-title">Audit Log</h1>

            <div class="admin-card" id="admin-denied" style="display: none;">
                <h2>Admins only</h2>
                <p class="admin-hint">You need an admin account to see this page.</p>
                <a href="index.html">Back to home</a>
            </div>

            <div id="admin-content" style="display: none;">

                <section class="admin-card">
                    <h2>Recent Administrator Actions</h2>

                    <p class="admin-hint">
                        Review the 50 most recent administrator actions recorded by the system.
                    </p>

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
    <script src="../scripts/api.js"></script>
    <script src="../scripts/auth.js"></script>
    <script src="../scripts/data-manager.js"></script>
    <script src="../scripts/app.js"></script>
    <script src="../scripts/admin.js"></script>

</body>
</html>