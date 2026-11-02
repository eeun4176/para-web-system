<?php
// Admin fare management: edit vehicle fares and passenger discounts; add, deactivate or delete types.
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
                    <h2>Vehicle Fares <span class="info-tip" tabindex="0" role="img" aria-label="Changes apply to new fares only. Saved trips keep their old fare." data-tip="Changes apply to new fares only. Saved trips keep their old fare."><i data-lucide="info"></i></span></h2>

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

                    <h3>Add a Vehicle</h3>

                    <div class="add-form" id="add-transport-form">
                        <label>
                            Vehicle name
                            <input type="text" class="wide" id="new-t-label" placeholder="e.g. UV Express" maxlength="60">
                        </label>

                        <label>
                            Base fare (₱)
                            <input type="number" id="new-t-fare" step="0.01" min="0" placeholder="e.g. 13.00">
                        </label>

                        <label>
                            Base km
                            <input type="number" id="new-t-km" step="0.1" min="0" placeholder="e.g. 4">
                        </label>

                        <label>
                            Excess per km (₱)
                            <input type="number" id="new-t-excess" step="0.01" min="0" placeholder="e.g. 1.80">
                        </label>

                        <label>
                            Avg speed (km/h)
                            <input type="number" id="new-t-speed" step="1" min="0" placeholder="e.g. 20">
                        </label>

                        <button type="button" class="row-btn" id="add-transport-btn">Add Vehicle</button>
                    </div>
                </section>

                <section class="admin-card">
                    <h2>Passenger Discounts <span class="info-tip" tabindex="0" role="img" aria-label="Deactivate hides a type for now. Delete removes it for good." data-tip="Deactivate hides a type for now. Delete removes it for good."><i data-lucide="info"></i></span></h2>

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

                    <h3>Add a Passenger Type</h3>

                    <div class="add-form" id="add-passenger-form">
                        <label>
                            Passenger type
                            <input type="text" class="wide" id="new-p-label" placeholder="e.g. Veteran" maxlength="40">
                        </label>

                        <label>
                            Discount (%)
                            <input type="number" id="new-p-pct" step="1" min="0" max="100" placeholder="e.g. 20">
                        </label>

                        <button type="button" class="row-btn" id="add-passenger-btn">
                            Add Passenger Type
                        </button>
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