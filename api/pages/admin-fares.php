<?php
// Admin fare management: edit vehicle fares and passenger discounts, add or deactivate types.
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
    <title>Fare Management | Para Admin</title>

    <link rel="icon" type="image/png" href="../assets/img/favicon.png">
    <link rel="stylesheet" href="../style/global.css">
    <link rel="stylesheet" href="../style/admin.css">

    <script src="../scripts/early-theme.js"></script>
</head>

<body class="admin-body">

    <?php $activePage = 'fares'; require __DIR__ . '/partials/admin-nav.php'; ?>

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

                        <button type="button" class="row-btn" id="add-transport-btn">Add Vehicle</button>
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
                            Add Passenger Type
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
    <script src="https://unpkg.com/lucide@1.66.0/dist/umd/lucide.min.js"></script>
    <script src="../scripts/api.js"></script>
    <script src="../scripts/auth.js"></script>
    <script src="../scripts/data-manager.js"></script>
    <script src="../scripts/app.js"></script>
    <script src="../scripts/admin.js"></script>
    <script src="../scripts/ui.js"></script>

</body>
</html>