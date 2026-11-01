// ADMIN DASHBOARD (talks to api/admin/*.php; the server checks the admin role on every request)
const money = n => '₱' + Number(n).toFixed(2);

// A table cell with a number box (fare tables).
function numCell(name, value, step) {
    return $('<td>').append($('<input type="number">').attr({ name: name, step: step, min: 0 }).val(value));
}

// The small Active / Inactive label.
function pill(active) {
    return $('<span class="role-pill">').addClass(active ? 'admin' : 'inactive').text(active ? 'Active' : 'Inactive');
}

// One full-width row with a message, for empty tables.
function emptyRow($tbody, cols, text) {
    $tbody.empty().append($('<tr>').append($('<td class="empty">').attr('colspan', cols).text(text)));
}

// Row buttons. "Save" stays disabled until a number in the row is changed (see setupFareControls).
function typeButtons(active) {
    return $('<td class="actions">').append(
        $('<button type="button" class="row-btn save-row" disabled>').append('<i data-lucide="check"></i> Save'),
        $('<button type="button" class="row-btn neutral toggle-type">').attr('data-next', active ? 'false' : 'true').text(active ? 'Deactivate' : 'Activate'),
        $('<button type="button" class="row-btn icon danger delete-type" title="Delete" aria-label="Delete">').append('<i data-lucide="trash-2"></i>')
    );
}

// ---- Overview numbers ----
// Counts a number up from 0 (skipped for people who turned on "reduce motion")
function countUp($el, value, format) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { $el.text(format(value)); return; }
    const start = performance.now();
    (function step(now) {
        const k = Math.min(1, (now - start) / 700);
        $el.text(format(value * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step);
    })(start);
}

// Fills the dashboard number cards from api/admin/stats.php.
async function loadStats() {
    skeletonCards($('#stat-grid'), 6, 'stat-card');
    const res = await API.get('admin/stats.php');
    const s = res.stats;
    const whole = n => Math.round(n).toLocaleString('en-US');
    const card = (icon, value, label, format, id) => {
        const $value = $('<strong>');
        countUp($value, Number(value), format);
        return $('<div class="stat-card">').append(
            $('<span class="stat-label">').append($('<i>').attr('data-lucide', icon), $('<span>').text(label)),
            $value,
            id ? $('<span class="delta" hidden>').attr('id', id) : null
        );
    };
    $('#stat-grid').empty().append(
        card('users', s.users, 'Users', whole),
        card('route', s.trips, 'Saved trips', whole, 'trips-delta'),
        card('wallet', s.totalFare, 'Total fare of saved trips', money),
        card('landmark', s.publicLandmarks, 'Public landmarks', whole),
        card('map-pin', s.landmarks, 'User landmarks', whole),
        card('heart', s.favorites, 'Favorite routes', whole)
    );
    revealBlocks($('#stat-grid'));
    showTripsDelta();
}

// "Saved trips" card pill. Stats and charts load at the same time, so whichever finishes last shows it.
let tripsDelta = null;
// Shows the "+N vs last week" label once both the stats and the charts have loaded.
function showTripsDelta() {
    if (tripsDelta) $('#trips-delta').prop('hidden', false).toggleClass('down', tripsDelta.down).text(tripsDelta.text);
}

// ---- Charts (plain HTML bars, styled in admin.css) ----
function shortDate(isoDate) {
    return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Message in place of a chart that has no data yet.
function emptyChart($box, text) {
    $box.empty().append($('<p class="chart-empty">').text(text));
}

// Horizontal bars: label + count on the left, the bar, and the share of the total on the right
function drawBarList($box, rows) {
    if (!rows.length) { emptyChart($box, 'No trips yet.'); return; }
    const max = Math.max(...rows.map(r => r.count));
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    $box.empty();
    rows.forEach((r, i) => {
        $('<div class="bar-row">').append(
            $('<div class="bar-name">').append($('<b>').text(r.label), $('<small>').text(r.count + (r.count === 1 ? ' trip' : ' trips'))),
            $('<div class="bar-track">').append($('<i>').css({ '--s': r.count / max, '--i': i })),
            $('<span class="bar-share">').text(Math.round(r.count / total * 100) + '%')
        ).appendTo($box);
    });
}

// Draws the dashboard charts (trips per day, by vehicle, top destinations) from api/admin/charts.php.
async function loadCharts() {
    const $dayBox = $('#chart-trips').empty();
    for (let i = 0; i < 14; i++) {
        $dayBox.append($('<span class="day-col">').append($('<span class="day-bar skeleton">'), $('<span class="day-label">').html('&nbsp;')));
    }
    $('#chart-vehicle, #chart-dest').each(function () { skeletonRows($(this), 4); });
    const res = await API.get('admin/charts.php');
    const c = res.charts;

    // Trips per day: one column per day; pointing at a column shows its numbers below the chart
    const $days = $('#chart-trips');
    const $readout = $('#trips-readout');
    const max = Math.max(1, ...c.tripsPerDay.map(d => d.count));
    const total = c.tripsPerDay.reduce((sum, d) => sum + d.count, 0);
    const showTotal = () => $readout.html('').append($('<b>').text(total + ' trips'), ' saved in the last 14 days');
    if (!total) {
        emptyChart($days, 'No trips in the last 14 days.');
    } else {
        $days.empty();
        c.tripsPerDay.forEach((d, i) => {
            $('<button type="button" class="day-col">')
                .attr('aria-label', shortDate(d.date) + ': ' + d.count + ' trips')
                .append($('<span class="day-bar">').append($('<i>').css({ '--s': d.count / max, '--i': i })),
                        $('<span class="day-label">').text(d.date.slice(8)))
                .on('mouseenter focus', () => $readout.html('').append($('<b>').text(shortDate(d.date) + ':'), ' ' + d.count + (d.count === 1 ? ' trip' : ' trips')))
                .on('mouseleave blur', showTotal)
                .appendTo($days);
        });
        showTotal();
    }

    // "Saved trips" card: this week compared with the week before
    const thisWeek = c.tripsPerDay.slice(-7).reduce((sum, d) => sum + d.count, 0);
    const lastWeek = c.tripsPerDay.slice(-14, -7).reduce((sum, d) => sum + d.count, 0);
    const diff = thisWeek - lastWeek;
    tripsDelta = { down: diff < 0, text: diff === 0 ? 'Same as last week' : (diff > 0 ? '+' : '−') + Math.abs(diff) + ' vs last week' };
    showTripsDelta();

    drawBarList($('#chart-vehicle'), c.byVehicle);
    drawBarList($('#chart-dest'), c.topDestinations);
}

// ---- Collapsible sidebar (the button at the bottom of the sidebar) ----
function setupRailToggle() {
    const $btn = $('#rail-toggle');
    const sync = collapsed => $btn.attr({
        'aria-label': collapsed ? 'Expand sidebar' : 'Collapse sidebar',
        title: collapsed ? 'Expand sidebar' : 'Collapse sidebar',
        'aria-expanded': String(!collapsed)
    });
    sync(document.documentElement.classList.contains('rail-collapsed'));
    const toggle = () => {
        const collapsed = document.documentElement.classList.toggle('rail-collapsed');
        localStorage.setItem('para_admin_rail', collapsed ? 'collapsed' : 'open');
        sync(collapsed);
        $('.admin-logo').attr('title', collapsed ? 'Expand sidebar' : 'Para admin');
    };
    $btn.on('click', toggle);
    // Collapsed: the logo is the expand button (the drawer on phones never collapses)
    $('.admin-logo').attr('title', document.documentElement.classList.contains('rail-collapsed') ? 'Expand sidebar' : 'Para admin')
        .on('click', e => {
            if (!document.documentElement.classList.contains('rail-collapsed') || window.innerWidth <= 900) return;
            e.preventDefault();
            toggle();
        });
}

// ---- Table search + filter chips (Users, Audit Log, Public Landmarks) ----
// Rows carry data-group (e.g. "admin", "fares"); the chips pick a group, the box filters by text.
function setupTableFilter(prefix, tableId) {
    const $table = $('#' + tableId);
    const apply = () => {
        const text = ($('#' + prefix + '-search').val() || '').trim().toLowerCase();
        const group = $('#' + prefix + '-filter .filter-chip.is-active').data('filter') || 'all';
        let shown = 0;
        $table.find('tbody tr').not('.no-match').each(function () {
            if ($(this).find('td.empty').length || $(this).hasClass('skeleton-tr')) return;
            const ok = (group === 'all' || $(this).data('group') === group) &&
                       (!text || $(this).text().toLowerCase().includes(text));
            $(this).toggle(ok);
            if (ok) shown++;
        });
        $table.find('tr.no-match').remove();
        const cols = $table.find('thead th').length;
        if (!shown && $table.find('tbody tr').not('.no-match').filter((i, tr) => !$(tr).find('td.empty').length).length) {
            $table.find('tbody').append($('<tr class="no-match">').append($('<td class="empty">').attr('colspan', cols).text('No matches.')));
        }
    };
    $('#' + prefix + '-search').on('input', apply);
    $('#' + prefix + '-filter').on('click', '.filter-chip', function () {
        $(this).addClass('is-active').siblings().removeClass('is-active');
        apply();
    });
    $table.data('applyFilter', apply);
}

// Re-applies the current search/filter after a table was reloaded
function refilter(tableId) {
    const apply = $('#' + tableId).data('applyFilter');
    if (apply) apply();
}

// ---- Dashboard header: today's date in Manila, e-Vet style ("Sunday, Nov 1 2026", uppercase via CSS) ----
function todayLabel(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })
        .formatToParts(date);
    const part = type => (parts.find(p => p.type === type) || {}).value || '';
    return `${part('weekday')}, ${part('month')} ${part('day')} ${part('year')}`;
}

// ---- Dashboard calendar: trips saved per day (api/admin/calendar.php) ----
let calMonth = null;   // first day of the month on screen

// Today's date in the Philippines, as YYYY-MM-DD.
function manilaToday() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });   // "2026-11-01"
}

// Draws one month of the calendar with the number of trips saved each day.
async function loadCalendar(month) {
    calMonth = month;
    const year = month.getFullYear();
    const m = month.getMonth();
    const key = year + '-' + String(m + 1).padStart(2, '0');
    const $grid = $('#cal-grid');
    $('#cal-month').text(month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    $('#cal-readout').text('Trips saved each day. Pick a day to see its count.');

    // Same grid as e-Vet: blank cells before the 1st, then the days, filled up to whole weeks
    const offset = new Date(year, m, 1).getDay();
    const dayCount = new Date(year, m + 1, 0).getDate();
    const cells = Math.ceil((offset + dayCount) / 7) * 7;
    const today = manilaToday();
    const draw = counts => {
        $grid.empty();
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => $grid.append($('<span class="cal-dow">').text(d)));
        for (let i = 0; i < cells; i++) {
            const day = i - offset + 1;
            const date = key + '-' + String(day).padStart(2, '0');
            const inMonth = day >= 1 && day <= dayCount;
            const count = counts ? counts[date] || 0 : 0;
            const $cell = $('<button type="button" class="cal-day">')
                .toggleClass('is-out', !inMonth).toggleClass('is-today', date === today)
                .attr({ 'data-date': date, 'data-count': count, tabindex: inMonth ? 0 : -1, 'aria-label': inMonth ? date + ': ' + count + ' trips' : '' })
                .append($('<span class="cal-num">').text(inMonth ? day : ''));
            if (!counts && inMonth) $cell.append('<span class="skeleton skeleton-line" style="width:18px;height:8px;margin:0"></span>');
            if (count) $cell.append($('<span class="cal-dot">').text(count));
            $grid.append($cell);
        }
    };

    draw(null);   // skeleton first, same layout
    try {
        const res = await API.get('admin/calendar.php', { month: key });
        if (calMonth !== month) return;   // the user already moved to another month
        draw(res.days);
        revealBlocks($grid, '.cal-day');
    } catch (err) {
        draw({});
        showNotification(API.describe(err), 'error');
    }
}

// Wires the calendar buttons (previous, today, next, pick a day) and shows this month.
function setupCalendar() {
    const start = new Date(manilaToday() + 'T00:00:00');
    const go = step => loadCalendar(new Date(calMonth.getFullYear(), calMonth.getMonth() + step, 1));
    $('#cal-prev').on('click', () => go(-1));
    $('#cal-next').on('click', () => go(1));
    $('#cal-today').on('click', () => loadCalendar(new Date(start.getFullYear(), start.getMonth(), 1)));
    $('#cal-grid').on('click', '.cal-day:not(.is-out)', function () {
        $(this).addClass('is-picked').siblings().removeClass('is-picked');
        const n = Number($(this).data('count'));
        const label = new Date($(this).data('date') + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        $('#cal-readout').html('').append($('<b>').text(label + ':'), ' ' + n + (n === 1 ? ' trip saved' : ' trips saved'));
    });
    return loadCalendar(new Date(start.getFullYear(), start.getMonth(), 1));
}

// The calendar lives in a popover under the header icon; its data loads the first time it opens
function setupCalendarPopover() {
    const $btn = $('#cal-open');
    const $pop = $('#cal-pop');
    let loaded = false;
    const close = () => {
        if ($pop.prop('hidden')) return;
        $btn.attr('aria-expanded', 'false');
        $pop.removeClass('is-open');
        setTimeout(() => { if (!$pop.hasClass('is-open')) $pop.prop('hidden', true); }, 180);
    };
    $btn.on('click', e => {
        e.stopPropagation();
        if (!$pop.prop('hidden') && $pop.hasClass('is-open')) return close();
        $pop.prop('hidden', false);
        requestAnimationFrame(() => $pop.addClass('is-open'));
        $btn.attr('aria-expanded', 'true');
        if (!loaded) { loaded = true; setupCalendar(); }
    });
    $(document).on('click', e => { if (!$(e.target).closest('.cal-pop-wrap').length) close(); });
    $(document).on('keydown', e => { if (e.key === 'Escape') close(); });
}

// ---- Admin maps: the same look as the passenger map (scripts/map-logic.js) ----
// Light "positron" / "dark" style that follows the dark mode toggle, the dashed SJDM outline,
// and no panning away from SJDM. addLayers() runs again after every style change (a new style drops our layers).
const ADMIN_MAP_STYLES = {
    light: 'https://tiles.openfreemap.org/styles/positron',
    dark: 'https://tiles.openfreemap.org/styles/dark'
};
let sjdmOutline = null;   // the boundary GeoJSON, fetched once for every map on the page

// Creates an admin map with the same look and limits as the passenger map.
function createAdminMap(container, addLayers) {
    const themeNow = () => document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    let theme = themeNow();
    const map = new maplibregl.Map({
        container: container,
        style: ADMIN_MAP_STYLES[theme],
        center: [121.0520, 14.8183],    // SJDM, as [longitude, latitude]
        zoom: 11.6,
        minZoom: 11,
        maxBounds: [[120.99, 14.745], [121.19, 14.89]],   // SJDM boundary box plus a small margin
        attributionControl: { compact: true }
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    if (!sjdmOutline) sjdmOutline = fetch('../assets/sjdm-boundary.geojson').then(r => r.json()).catch(() => null);

    map.on('style.load', async () => {
        const outline = await sjdmOutline;
        if (outline && !map.getSource('sjdm')) {
            map.addSource('sjdm', { type: 'geojson', data: outline });
            map.addLayer({
                id: 'sjdm-outline', type: 'line', source: 'sjdm',
                paint: { 'line-color': theme === 'dark' ? '#ffffff' : '#1D1F1E', 'line-width': 1.5, 'line-opacity': 0.25, 'line-dasharray': [3, 2] }
            });
        }
        if (addLayers) addLayers(map);
    });

    // Dark mode toggle: switch the map style too (only when the theme really changed)
    new MutationObserver(() => {
        if (themeNow() === theme) return;
        theme = themeNow();
        map.setStyle(ADMIN_MAP_STYLES[theme], { diff: false });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return map;
}

// ---- Destination heat map (api/admin/heatmap.php returns GeoJSON) ----
async function loadHeatmap() {
    if (typeof maplibregl === 'undefined') return;
    const res = await API.get('admin/heatmap.php');
    const map = createAdminMap('heat-map', map => {
        if (map.getSource('trips')) return;
        map.addSource('trips', { type: 'geojson', data: res.geojson });
        map.addLayer({
            id: 'trips-heat', type: 'heatmap', source: 'trips',
            paint: {
                'heatmap-weight': ['interpolate', ['linear'], ['get', 'trips'], 1, 0.6, 10, 1],
                'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 1, 15, 3],
                'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 26, 15, 48],
                'heatmap-opacity': 0.85,
                'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
                    0, 'rgba(46,204,113,0)', 0.2, 'rgba(46,204,113,0.45)', 0.45, '#2ECC71',
                    0.65, '#F1C40F', 0.85, '#E67E22', 1, '#e5484d']
            }
        });
        // Up close, each place shows as a dot you can hover for its name
        map.addLayer({
            id: 'trips-dots', type: 'circle', source: 'trips', minzoom: 14,
            paint: { 'circle-radius': 6, 'circle-color': '#2ECC71', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 }
        });
    });
    const popup = new maplibregl.Popup({ closeButton: false, offset: 10 });
    map.on('mousemove', 'trips-dots', e => {
        const p = e.features[0].properties;
        popup.setLngLat(e.lngLat).setText(p.name + ': ' + p.trips + (p.trips == 1 ? ' trip' : ' trips')).addTo(map);
    });
    map.on('mouseleave', 'trips-dots', () => popup.remove());
}

// ---- Settings page (api/auth/update_profile.php, api/admin/change_password.php) ----
function formErrors($form, errors) {
    $form.find('.field-error').remove();
    Object.entries(errors || {}).forEach(([field, msg]) => {
        const id = { name: 'admin-name-input', currentPassword: 'admin-current-pw', newPassword: 'admin-new-pw', confirmPassword: 'admin-confirm-pw' }[field];
        if (id) $('<span class="field-error">').text(msg).insertAfter($('#' + id).closest('.admin-field'));
    });
}

// Fills the admin settings page and saves name / password changes.
function setupSettings(user) {
    const fill = u => {
        $('#admin-name').text(u.name);
        $('#admin-key, #admin-key-row').text(u.accountKey || '—');
        $('#admin-name-input').val(u.name);
        revealBlocks($('#admin-account'), '> div');
    };
    fill(user);

    $('.settings-tabs').on('click', '.seg-btn', function () {
        const tab = $(this).data('tab');
        $(this).addClass('is-active').attr('aria-selected', 'true').siblings().removeClass('is-active').attr('aria-selected', 'false');
        $('.settings-panel').each(function () { $(this).prop('hidden', $(this).data('panel') !== tab); });
    });

    $('#admin-name-form').on('submit', async function (e) {
        e.preventDefault();
        const name = $('#admin-name-input').val().trim();
        if (!name) { formErrors($(this), { name: 'Name is required.' }); return; }
        const $btn = $(this).find('button').prop('disabled', true);
        try {
            const res = await API.post('auth/update_profile.php', { name });
            Auth.user = Object.assign({}, Auth.user, { name: res.user.name });
            formErrors($(this), {});
            fill(Auth.user);
            updateNavAuth();
            showNotification('Your display name was updated.', 'success');
        } catch (err) {
            formErrors($(this), err.errors);
            showNotification(API.describe(err), 'error');
        } finally {
            $btn.prop('disabled', false);
        }
    });

    $('#admin-password-form').on('submit', async function (e) {
        e.preventDefault();
        const data = { currentPassword: $('#admin-current-pw').val(), newPassword: $('#admin-new-pw').val() };
        const errors = {};
        if (!data.currentPassword) errors.currentPassword = 'Enter your current password.';
        if (data.newPassword.length < 8) errors.newPassword = 'New password must be at least 8 characters.';
        else if (data.newPassword !== $('#admin-confirm-pw').val()) errors.confirmPassword = 'Passwords do not match.';
        formErrors($(this), errors);
        if (Object.keys(errors).length) return;

        const $btn = $(this).find('button').prop('disabled', true);
        try {
            const res = await API.post('admin/change_password.php', data);
            if (res.csrf) API.csrf = res.csrf;
            this.reset();
            showNotification('Your password was changed.', 'success');
        } catch (err) {
            formErrors($(this), err.errors);
            showNotification(API.describe(err), 'error');
        } finally {
            $btn.prop('disabled', false);
        }
    });
}

// ---- Fare management ----
async function loadFares() {
    skeletonTable($('#transport-table tbody'), 6, 4);
    skeletonTable($('#passenger-table tbody'), 3, 4);
    const res = await API.get('fares.php', { all: 1 });

    const $t = $('#transport-table tbody').empty();
    Object.entries(res.types).forEach(([code, t]) => {
        $('<tr>').attr({ 'data-code': code, 'data-label': t.label }).append(
            $('<td>').text(t.label + ' ').append(pill(t.active)),
            numCell('baseFare', t.baseFare, '0.01'),
            numCell('baseKm', t.baseKm, '0.1'),
            numCell('excessPerKm', t.excessPerKm, '0.01'),
            numCell('avgSpeedKph', t.avgSpeedKph, '1'),
            typeButtons(t.active)
        ).appendTo($t);
    });

    const $p = $('#passenger-table tbody').empty();
    Object.entries(res.discounts).forEach(([code, d]) => {
        $('<tr>').attr({ 'data-code': code, 'data-label': d.label }).append(
            $('<td>').text(d.label + ' ').append(pill(d.active)),
            numCell('discountPct', Math.round(d.rate * 100), '1'),
            typeButtons(d.active)
        ).appendTo($p);
    });
    revealBlocks($('#transport-table tbody, #passenger-table tbody'));
}

// Save, activate / deactivate, delete and add buttons of the fare tables.
function setupFareControls() {
    // Typing in a row marks it as changed and turns its Save button on
    $('.type-table').on('input', 'input', function () {
        $(this).closest('tr').addClass('is-dirty').find('.save-row').prop('disabled', false);
    });

    // Save a row
    $('#transport-table').on('click', '.save-row', async function () {
        const $tr = $(this).closest('tr');
        const val = n => $tr.find('[name=' + n + ']').val();
        const $btn = $(this).prop('disabled', true);
        try {
            await API.post('admin/transport_update.php', {
                code: $tr.data('code'), baseFare: val('baseFare'), baseKm: val('baseKm'),
                excessPerKm: val('excessPerKm'), avgSpeedKph: val('avgSpeedKph')
            });
            showNotification($tr.data('label') + ' fares updated.', 'success');
            $tr.removeClass('is-dirty');
            loadAudit();
        } catch (err) {
            showNotification(API.describe(err), 'error');
        } finally {
            $btn.prop('disabled', !$tr.hasClass('is-dirty'));   // stays on only if the save failed
        }
    });

    $('#passenger-table').on('click', '.save-row', async function () {
        const $tr = $(this).closest('tr');
        const pct = parseFloat($tr.find('[name=discountPct]').val());
        if (isNaN(pct) || pct < 0 || pct > 100) {
            showNotification('Discount must be between 0 and 100%.', 'warning');
            return;
        }
        const $btn = $(this).prop('disabled', true);
        try {
            await API.post('admin/passenger_update.php', { code: $tr.data('code'), discountRate: pct / 100 });
            showNotification($tr.data('label') + ' discount updated.', 'success');
            $tr.removeClass('is-dirty');
            loadAudit();
        } catch (err) {
            showNotification(API.describe(err), 'error');
        } finally {
            $btn.prop('disabled', !$tr.hasClass('is-dirty'));   // stays on only if the save failed
        }
    });

    // Activate / deactivate / delete (both tables)
    $('.type-table').on('click', '.toggle-type', async function () {
        const $tr = $(this).closest('tr');
        const kind = $(this).closest('table').data('kind');
        const next = $(this).attr('data-next') === 'true';
        if (!next) {
            const sure = await confirmDialog({
                title: 'Deactivate "' + $tr.data('label') + '"?',
                message: 'It will no longer appear in the calculator. Saved trips keep working, and you can activate it again.',
                confirmText: 'Deactivate', danger: true
            });
            if (!sure) return;
        }
        try {
            await API.post('admin/type_toggle.php', { kind: kind, code: $tr.data('code'), active: next });
            showNotification('"' + $tr.data('label') + '" ' + (next ? 'activated.' : 'deactivated.'), 'success');
            loadFares();
            loadAudit();
        } catch (err) {
            showNotification(API.describe(err), 'error');
        }
    });

    $('.type-table').on('click', '.delete-type', async function () {
        const $tr = $(this).closest('tr');
        const kind = $(this).closest('table').data('kind');
        const sure = await confirmDialog({
            title: 'Delete "' + $tr.data('label') + '"?',
            message: 'This only works if no saved trip or favorite uses it. Otherwise, deactivate it instead.',
            confirmText: 'Delete', danger: true
        });
        if (!sure) return;
        try {
            await API.post('admin/type_delete.php', { kind: kind, code: $tr.data('code') });
            showNotification('"' + $tr.data('label') + '" deleted.', 'info');
            loadFares();
            loadAudit();
        } catch (err) {
            showNotification(API.describe(err), 'error');
        }
    });

    // Add forms
    $('#add-transport-btn').on('click', async function () {
        const v = id => $('#' + id).val();
        const $btn = $(this).prop('disabled', true);
        try {
            await API.post('admin/type_add.php', {
                kind: 'transport', code: v('new-t-code'), label: v('new-t-label'), baseFare: v('new-t-fare'),
                baseKm: v('new-t-km'), excessPerKm: v('new-t-excess'), avgSpeedKph: v('new-t-speed')
            });
            $('#add-transport-form input').val('');
            showNotification('Vehicle type added.', 'success');
            loadFares();
            loadAudit();
        } catch (err) {
            showNotification(API.describe(err), 'error');
        } finally {
            $btn.prop('disabled', false);
        }
    });

    $('#add-passenger-btn').on('click', async function () {
        const pct = parseFloat($('#new-p-pct').val());
        if (isNaN(pct) || pct < 0 || pct > 100) {
            showNotification('Discount must be between 0 and 100%.', 'warning');
            return;
        }
        const $btn = $(this).prop('disabled', true);
        try {
            await API.post('admin/type_add.php', {
                kind: 'passenger', code: $('#new-p-code').val(), label: $('#new-p-label').val(), discountRate: pct / 100
            });
            $('#add-passenger-form input').val('');
            showNotification('Passenger type added.', 'success');
            loadFares();
            loadAudit();
        } catch (err) {
            showNotification(API.describe(err), 'error');
        } finally {
            $btn.prop('disabled', false);
        }
    });
}

// ---- Public landmarks ----
async function loadPublicLandmarks() {
    const $tb = $('#public-table tbody');
    skeletonTable($tb, 4);
    const res = await API.get('landmarks/list.php', { public: 1 });
    if (!res.landmarks.length) { emptyRow($tb, 4, 'No public landmarks yet.'); return; }
    $tb.empty();
    res.landmarks.forEach(lm => {
        $('<tr>').attr({ 'data-id': lm.id, 'data-name': lm.name }).append(
            $('<td>').text(lm.name),
            $('<td>').text(String(lm.category || 'other').replace(/^./, c => c.toUpperCase())),
            $('<td>').text(lm.lat.toFixed(5) + ', ' + lm.lng.toFixed(5)),
            $('<td>').append($('<button type="button" class="row-btn icon danger del-public" title="Delete landmark" aria-label="Delete landmark">').append('<i data-lucide="trash-2"></i>'))
        ).appendTo($tb);
    });
    revealBlocks($tb);
    refilter('public-table');
}

// ---- Add a public landmark: click the map to pick the spot ----
let newLandmarkSpot = null;     // { lat, lng } chosen on the map
let newLandmarkMarker = null;   // green pin showing that spot

// Map where the admin clicks the spot of a new public landmark.
function setupAddLandmarkMap() {
    const map = createAdminMap('admin-landmark-map');

    map.on('click', e => {
        newLandmarkSpot = { lat: e.lngLat.lat, lng: e.lngLat.lng };
        if (!newLandmarkMarker) {
            newLandmarkMarker = new maplibregl.Marker({ color: '#2ECC71' }).setLngLat(e.lngLat).addTo(map);
        } else {
            newLandmarkMarker.setLngLat(e.lngLat);
        }
        $('#new-lm-location').val(newLandmarkSpot.lat.toFixed(5) + ', ' + newLandmarkSpot.lng.toFixed(5));
    });

    $('#add-landmark-btn').on('click', addPublicLandmark);
}

// Saves the new public landmark (api/landmarks/add.php) and refreshes the table.
async function addPublicLandmark() {
    const name = $('#new-lm-name').val().trim();
    if (!name) { showNotification('Enter the landmark name.', 'warning'); return; }
    if (!newLandmarkSpot) { showNotification('Click the map to choose the location.', 'warning'); return; }

    const $btn = $('#add-landmark-btn').prop('disabled', true);
    try {
        await API.post('landmarks/add.php', {
            name: name,
            category: $('#new-lm-category').val(),
            description: $('#new-lm-desc').val().trim(),
            lat: newLandmarkSpot.lat,
            lng: newLandmarkSpot.lng,
            public: true
        });
        showNotification('Public landmark added.', 'success');

        // Reset the form for the next landmark
        $('#new-lm-name, #new-lm-desc, #new-lm-location').val('');
        newLandmarkSpot = null;
        newLandmarkMarker.remove();
        newLandmarkMarker = null;
        loadPublicLandmarks();
    } catch (err) {
        showNotification(API.describe(err), 'error');
    } finally {
        $btn.prop('disabled', false);
    }
}

// Delete buttons of the public landmarks table.
function setupPublicLandmarks() {
    $('#public-table').on('click', '.del-public', async function () {
        const $tr = $(this).closest('tr');
        const sure = await confirmDialog({
            title: 'Delete public landmark?',
            message: '"' + $tr.data('name') + '" will disappear for everyone.',
            confirmText: 'Delete', danger: true
        });
        if (!sure) return;
        try {
            await API.post('landmarks/delete.php', { id: $tr.data('id') });
            showNotification('Public landmark deleted.', 'info');
            loadPublicLandmarks();
            loadStats();
            loadAudit();
        } catch (err) {
            showNotification(API.describe(err), 'error');
        }
    });
}

// ---- Users ----
async function loadUsers() {
    const $tb = $('#users-table tbody');
    skeletonTable($tb, 8);
    const res = await API.get('admin/users_list.php');
    const me = Auth.getCurrentUser();
    $tb.empty();
    res.users.forEach(u => {
        const $action = $('<td>');
        if (!me || u.id !== me.id) $action.append($('<button type="button" class="row-btn icon danger del-user" title="Delete user" aria-label="Delete user">').append('<i data-lucide="trash-2"></i>'));
        else $action.text('You');
        $('<tr>').attr({ 'data-id': u.id, 'data-name': u.name, 'data-group': u.role }).append(
            $('<td>').text(u.name),
            $('<td>').text(u.email || (u.accountKey ? 'Account key: ' + u.accountKey : '—')),
            $('<td>').append($('<span class="role-pill">').addClass(u.role === 'admin' ? 'admin' : '').text(u.role)),
            $('<td>').text(String(u.createdAt).slice(0, 10)),
            $('<td>').text(u.trips),
            $('<td>').text(u.landmarks),
            $('<td>').text(u.favorites),
            $action
        ).appendTo($tb);
    });
    revealBlocks($tb);
    refilter('users-table');
}

// Delete buttons of the users table (with a confirmation).
function setupUsers() {
    $('#users-table').on('click', '.del-user', async function () {
        const $tr = $(this).closest('tr');
        const sure = await confirmDialog({
            title: 'Delete this user?',
            message: $tr.data('name') + ' and all of their trips, favorites and landmarks will be permanently deleted.',
            confirmText: 'Delete User', danger: true
        });
        if (!sure) return;
        try {
            await API.post('admin/user_delete.php', { id: $tr.data('id') });
            showNotification('User deleted.', 'info');
            loadUsers();
            loadStats();
            loadCharts();
            loadAudit();
        } catch (err) {
            showNotification(API.describe(err), 'error');
        }
    });
}

// ---- Audit log ----
// Which filter chip an audit action belongs to
function auditGroup(action) {
    if (/landmark/.test(action)) return 'landmarks';
    if (/user|password/.test(action)) return 'users';
    return 'fares';
}

// Fills the audit log table from api/admin/audit_list.php.
async function loadAudit() {
    const $tb = $('#audit-table tbody');
    skeletonTable($tb, 5);
    const res = await API.get('admin/audit_list.php');
    if (!res.entries.length) { emptyRow($tb, 5, 'No admin actions recorded yet.'); return; }
    $tb.empty();
    res.entries.forEach(e => {
        $('<tr>').attr('data-group', auditGroup(e.action)).append(
            $('<td>').text(e.createdAt),
            $('<td>').text(e.adminName),
            $('<td>').text(e.action.replace(/_/g, ' ')),
            $('<td>').text(e.target),
            $('<td class="audit-details">').text(e.details)
        ).appendTo($tb);
    });
    revealBlocks($tb);
    refilter('audit-table');
}

// ---- Start ----
document.addEventListener('DOMContentLoaded', () => {
    setupRailToggle();
    Auth.ready().then(async user => {
        if (!user || user.role !== 'admin') {
            $('#admin-denied').show();
            return;
        }

        $('#admin-content').show();

        const tasks = [];

        $('#today-label').text(todayLabel()).attr('datetime', manilaToday());

        if ($('#admin-name-form').length) {
            setupSettings(user);
        }

        if ($('#cal-open').length) {
            setupCalendarPopover();
        }

        if ($('#heat-map').length) {
            tasks.push(loadHeatmap());
        }

        if ($('#stat-grid').length) {
            tasks.push(loadStats());
        }

        if ($('#chart-trips').length) {
            tasks.push(loadCharts());
        }

        if ($('#transport-table').length || $('#passenger-table').length) {
            setupFareControls();
            tasks.push(loadFares());
        }

        if ($('#public-table').length) {
            setupTableFilter('public', 'public-table');
            setupPublicLandmarks();
            setupAddLandmarkMap();
            tasks.push(loadPublicLandmarks());
        }

        if ($('#users-table').length) {
            setupTableFilter('users', 'users-table');
            setupUsers();
            tasks.push(loadUsers());
        }

        if ($('#audit-table').length) {
            setupTableFilter('audit', 'audit-table');
            tasks.push(loadAudit());
        }

        const results = await Promise.allSettled(tasks);
        const failed = results.find(result => result.status === 'rejected');

        if (failed) {
            showNotification(API.describe(failed.reason), 'error');
        }
    });
});
