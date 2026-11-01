// ADMIN DASHBOARD (talks to api/admin/*.php; the server checks the admin role on every request)
const money = n => '₱' + Number(n).toFixed(2);
const charts = {};

function numCell(name, value, step) {
    return $('<td>').append($('<input type="number">').attr({ name: name, step: step, min: 0 }).val(value));
}

function pill(active) {
    return $('<span class="role-pill">').addClass(active ? 'admin' : 'inactive').text(active ? 'Active' : 'Inactive');
}

function emptyRow($tbody, cols, text) {
    $tbody.empty().append($('<tr>').append($('<td class="empty">').attr('colspan', cols).text(text)));
}

function typeButtons(active) {
    return $('<td class="actions">').append(
        $('<button type="button" class="row-btn save-row">').text('Save'),
        $('<button type="button" class="row-btn neutral toggle-type">').attr('data-next', active ? 'false' : 'true').text(active ? 'Deactivate' : 'Activate'),
        $('<button type="button" class="row-btn danger delete-type">').text('Delete')
    );
}

// ---- Overview ----
async function loadStats() {
    const res = await API.get('admin/stats.php');
    const s = res.stats;
    const card = (value, label) => $('<div class="stat-card">').append($('<strong>').text(value), $('<span>').text(label));
    $('#stat-grid').empty().append(
        card(s.users, 'Users'),
        card(s.trips, 'Saved trips'),
        card(money(s.totalFare), 'Total fare (all saved trips)'),
        card(s.landmarks, 'User landmarks'),
        card(s.publicLandmarks, 'Public landmarks'),
        card(s.favorites, 'Favorite routes')
    );
}

// ---- Charts (Chart.js) ----
function drawChart(id, emptyId, config, hasData) {
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
    $('#' + id).toggle(hasData);
    $('#' + emptyId).toggle(!hasData);
    if (!hasData) return;
    charts[id] = new Chart(document.getElementById(id), config);
}

async function loadCharts() {
    if (typeof Chart === 'undefined') {
        $('.chart-box').text('Charts are unavailable (Chart.js did not load; check your internet connection).');
        return;
    }
    const res = await API.get('admin/charts.php');
    const c = res.charts;
    const css = getComputedStyle(document.body);
    Chart.defaults.color = css.getPropertyValue('--text-muted').trim() || '#7f8c8d';
    Chart.defaults.borderColor = css.getPropertyValue('--border').trim() || '#e0e0e0';
    const base = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                   scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } };

    drawChart('chart-trips', 'empty-trips', {
        type: 'line',
        data: { labels: c.tripsPerDay.map(d => d.date.slice(5)),
                datasets: [{ data: c.tripsPerDay.map(d => d.count), borderColor: '#2ecc71',
                             backgroundColor: 'rgba(46,204,113,.2)', fill: true, tension: 0.3 }] },
        options: base
    }, c.tripsPerDay.some(d => d.count > 0));

    drawChart('chart-vehicle', 'empty-vehicle', {
        type: 'bar',
        data: { labels: c.byVehicle.map(d => d.label),
                datasets: [{ data: c.byVehicle.map(d => d.count), backgroundColor: '#2ecc71' }] },
        options: base
    }, c.byVehicle.length > 0);

    drawChart('chart-dest', 'empty-dest', {
        type: 'bar',
        data: { labels: c.topDestinations.map(d => d.label.length > 22 ? d.label.slice(0, 21) + '…' : d.label),
                datasets: [{ data: c.topDestinations.map(d => d.count), backgroundColor: '#e67e22' }] },
        options: Object.assign({}, base, { indexAxis: 'y',
                 scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } })
    }, c.topDestinations.length > 0);
}

// ---- Fare management ----
async function loadFares() {
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
}

function setupFareControls() {
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
            loadAudit();
        } catch (err) {
            showNotification(API.describe(err), 'error');
        } finally {
            $btn.prop('disabled', false);
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
            loadAudit();
        } catch (err) {
            showNotification(API.describe(err), 'error');
        } finally {
            $btn.prop('disabled', false);
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
    const res = await API.get('landmarks/list.php', { public: 1 });
    const $tb = $('#public-table tbody');
    if (!res.landmarks.length) { emptyRow($tb, 4, 'No public landmarks yet.'); return; }
    $tb.empty();
    res.landmarks.forEach(lm => {
        $('<tr>').attr({ 'data-id': lm.id, 'data-name': lm.name }).append(
            $('<td>').text(lm.name),
            $('<td>').text(lm.category),
            $('<td>').text(lm.lat.toFixed(5) + ', ' + lm.lng.toFixed(5)),
            $('<td>').append($('<button type="button" class="row-btn danger del-public">').text('Delete'))
        ).appendTo($tb);
    });
}

// ---- Add a public landmark: click the map to pick the spot ----
let newLandmarkSpot = null;     // { lat, lng } chosen on the map
let newLandmarkMarker = null;   // green pin showing that spot

function setupAddLandmarkMap() {
    const isDark = document.documentElement.classList.contains('dark');
    const map = new maplibregl.Map({
        container: 'admin-landmark-map',
        style: 'https://tiles.openfreemap.org/styles/' + (isDark ? 'dark' : 'liberty'),
        center: [121.0520, 14.8183],    // SJDM, as [longitude, latitude]
        zoom: 12
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

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
    const res = await API.get('admin/users_list.php');
    const me = Auth.getCurrentUser();
    const $tb = $('#users-table tbody').empty();
    res.users.forEach(u => {
        const $action = $('<td>');
        if (!me || u.id !== me.id) $action.append($('<button type="button" class="row-btn danger del-user">').text('Delete'));
        else $action.text('You');
        $('<tr>').attr({ 'data-id': u.id, 'data-name': u.name }).append(
            $('<td>').text(u.name),
            $('<td>').text(u.email),
            $('<td>').append($('<span class="role-pill">').addClass(u.role === 'admin' ? 'admin' : '').text(u.role)),
            $('<td>').text(String(u.createdAt).slice(0, 10)),
            $('<td>').text(u.trips),
            $('<td>').text(u.landmarks),
            $('<td>').text(u.favorites),
            $action
        ).appendTo($tb);
    });
}

function setupUsers() {
    $('#users-table').on('click', '.del-user', async function () {
        const $tr = $(this).closest('tr');
        const sure = await confirmDialog({
            title: 'Delete this user?',
            message: $tr.data('name') + ' and all of their trips, favorites and landmarks will be permanently deleted.',
            confirmText: 'Delete user', danger: true
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
async function loadAudit() {
    const res = await API.get('admin/audit_list.php');
    const $tb = $('#audit-table tbody');
    if (!res.entries.length) { emptyRow($tb, 5, 'No admin actions recorded yet.'); return; }
    $tb.empty();
    res.entries.forEach(e => {
        $('<tr>').append(
            $('<td>').text(e.createdAt),
            $('<td>').text(e.adminName),
            $('<td>').text(e.action.replace(/_/g, ' ')),
            $('<td>').text(e.target),
            $('<td class="audit-details">').text(e.details)
        ).appendTo($tb);
    });
}

// ---- Start ----
document.addEventListener('DOMContentLoaded', () => {
    Auth.ready().then(async user => {
        if (!user || user.role !== 'admin') {
            $('#admin-denied').show();
            return;
        }

        $('#admin-content').show();

        const tasks = [];

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
            setupPublicLandmarks();
            setupAddLandmarkMap();
            tasks.push(loadPublicLandmarks());
        }

        if ($('#users-table').length) {
            setupUsers();
            tasks.push(loadUsers());
        }

        if ($('#audit-table').length) {
            tasks.push(loadAudit());
        }

        const results = await Promise.allSettled(tasks);
        const failed = results.find(result => result.status === 'rejected');

        if (failed) {
            showNotification(API.describe(failed.reason), 'error');
        }
    });
});
