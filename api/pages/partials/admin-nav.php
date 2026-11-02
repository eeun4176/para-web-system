<?php
// Admin navigation shared by the admin pages: a left sidebar that can be collapsed to icons
// (a slide-in drawer on phones) + the page header with the title, dark mode and profile menu.
// Each admin page includes it right after <body>; its $activePage ('dashboard', 'fares', 'landmarks',
// 'users', 'audit' or 'settings') marks the current link and picks the header title.
// Drawer open/close and the profile menu: scripts/app.js. Collapse button: scripts/admin.js.

if (!isset($activePage)) exit;   // opened directly in the browser: show nothing

$adminLinks = [
    'dashboard' => ['admin.php',           'layout-dashboard', 'Dashboard'],
    'fares'     => ['admin-fares.php',     'coins',            'Fare Management'],
    'landmarks' => ['admin-landmarks.php', 'map-pin',          'Public Landmarks'],
    'users'     => ['admin-users.php',     'users',            'Users'],
    'audit'     => ['admin-audit.php',     'scroll-text',      'Audit Log'],
];
$settingsLink = ['admin-settings.php', 'settings', 'Settings'];
$pageTitle = ($adminLinks[$activePage] ?? $settingsLink)[2];
$isDashboard = $activePage === 'dashboard';

// Dashboard greeting by the time in the Philippines: morning before 12, afternoon before 6 PM, evening after.
$manilaHour = (int) (new DateTime('now', new DateTimeZone('Asia/Manila')))->format('G');
$greeting = $manilaHour < 12 ? 'Good Morning' : ($manilaHour < 18 ? 'Good Afternoon' : 'Good Evening');
?>
<!-- Apply the saved collapsed/expanded state before the page is drawn (no jump) -->
<script>
    if (localStorage.getItem('para_admin_rail') === 'collapsed') document.documentElement.classList.add('rail-collapsed');
</script>

<!-- ADMIN SIDEBAR -->
<div class="sidebar-overlay admin-sidebar-wrap" id="sidebar-overlay">
    <aside class="sidebar admin-sidebar" aria-label="Admin navigation">
        <div class="admin-sidebar-head">
            <a href="admin.php" class="admin-logo" title="Para admin"><img src="../assets/logo-wordmark.png" alt="Para admin home" /></a>
            <!-- Desktop: collapse/expand the sidebar. Phones: close the drawer. -->
            <button class="rail-toggle" id="rail-toggle" type="button" aria-label="Collapse sidebar" title="Collapse sidebar">
                <i data-lucide="panel-left-close" class="when-open"></i><i data-lucide="panel-left-open" class="when-closed"></i>
            </button>
            <button class="sidebar-close" id="sidebar-close" type="button" aria-label="Close menu"><i data-lucide="x"></i></button>
        </div>

        <ul class="sidebar-nav admin-nav">
            <?php foreach ($adminLinks as $key => [$href, $icon, $label]): ?>
                <li>
                    <a href="<?= $href ?>" title="<?= $label ?>"<?= $key === $activePage ? ' class="active" aria-current="page"' : '' ?>>
                        <i data-lucide="<?= $icon ?>"></i><span><?= $label ?></span>
                    </a>
                </li>
            <?php endforeach; ?>
        </ul>

        <div class="admin-sidebar-foot">
            <ul class="sidebar-nav admin-nav">
                <li>
                    <a href="<?= $settingsLink[0] ?>" title="Settings"<?= $activePage === 'settings' ? ' class="active" aria-current="page"' : '' ?>>
                        <i data-lucide="settings"></i><span>Settings</span>
                    </a>
                </li>
            </ul>
            <div id="sidebar-auth-area"></div>
        </div>
    </aside>
</div>

<!-- PAGE HEADER (dashboard: today's date + greeting, like e-Vet; other pages: the page name) -->
<header class="admin-head">
    <button class="hamburger-btn" id="hamburger-btn" type="button" aria-label="Open menu"><i data-lucide="menu"></i></button>
    <div class="admin-head-title">
        <?php if ($isDashboard): ?>
            <p class="admin-cap"><time id="today-label"></time></p>
            <h1><?= $greeting ?>, Administrator!</h1>
        <?php else: ?>
            <p class="admin-cap">Para admin</p>
            <h1><?= $pageTitle ?></h1>
        <?php endif; ?>
    </div>
    <div class="nav-right">
        <!-- Calendar of saved trips: a small popover under the icon (admin.js: setupCalendarPopover) -->
        <div class="cal-pop-wrap">
            <button class="head-icon-btn" id="cal-open" type="button" aria-expanded="false" aria-controls="cal-pop" title="Calendar" aria-label="Open calendar">
                <i data-lucide="calendar-days"></i>
            </button>
            <div class="cal-pop" id="cal-pop" role="dialog" aria-labelledby="cal-month" hidden>
                <div class="cal-head">
                    <h2 id="cal-month">Calendar</h2>
                    <button type="button" class="cal-btn" id="cal-prev" aria-label="Previous month"><i data-lucide="chevron-left"></i></button>
                    <button type="button" class="cal-btn" id="cal-today">Today</button>
                    <button type="button" class="cal-btn" id="cal-next" aria-label="Next month"><i data-lucide="chevron-right"></i></button>
                </div>
                <div class="cal-grid" id="cal-grid" role="grid" aria-labelledby="cal-month"></div>
                <p class="chart-readout" id="cal-readout">Trips saved each day. Pick a day to see its count.</p>
            </div>
        </div>
        <button id="dark-toggle" class="dark-toggle" type="button" aria-label="Toggle dark mode" aria-pressed="false">
            <span class="toggle-knob"><i data-lucide="sun" class="icon-light"></i><i data-lucide="moon" class="icon-dark"></i></span>
        </button>
        <div id="nav-auth-area"></div>
    </div>
</header>
