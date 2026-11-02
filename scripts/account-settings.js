// ACCOUNT SETTINGS PAGE (account-settings.html): profile, security, commute preferences and activity
// of the signed-in passenger, all loaded and saved through api/auth/*.php.
(function () {
    let activeTab = 'trips';
    const $ = window.jQuery;

    // Same bottom-right toasts as the rest of Para (showToast is in ui.js)
    function notify(message, type) {
        showToast(type || 'success', message);
    }

    // Dark mode button and the navbar of this page.
    function setupThemeAndNav() {
        const dark = localStorage.getItem('para_dark') === 'true';
        document.body.classList.toggle('dark', dark);
        document.documentElement.classList.toggle('dark', dark);
        $('#dark-toggle').attr('aria-pressed', String(dark)).on('click', function () {
            const next = !document.body.classList.contains('dark');
            document.body.classList.toggle('dark', next);
            document.documentElement.classList.toggle('dark', next);
            localStorage.setItem('para_dark', String(next));
            $(this).attr('aria-pressed', String(next));
        });
        $(document).on('click', e => {
            if (!$(e.target).closest('.settings-profile-wrap').length) {
                $('.settings-profile-menu').removeClass('open');
                $('.settings-profile-btn').attr('aria-expanded', 'false');
            }
        });
    }

    // Navbar for the current user (profile picture menu or Log In).
    function updateNav(user) {
        if (!user) {
            $('#nav-auth-area').empty().append($('<a class="nav-auth-btn" href="auth.html">').text('Log In'));
            return;
        }
        const $profileWrap = $('<div class="settings-profile-wrap">');
        const $profile = $('<button type="button" class="settings-profile-btn">')
            .attr({ 'aria-label': 'Open profile menu', 'aria-expanded': 'false' })
            .append(user.profilePicture
                ? $('<img>').attr({ src: '../' + user.profilePicture, alt: '' })
                : $('<span>').text((user.name || '?').trim().charAt(0).toUpperCase() || '?'));
        const $menu = $('<div class="settings-profile-menu" role="menu">');
        $profileWrap.append($profile, $menu);
        $('#nav-auth-area').empty().append(buildNavGreeting(user), $profileWrap);
        $('#sidebar-auth-area').empty().append(user ? $('<button class="sidebar-auth-btn" type="button">').text('Log Out').on('click', logout) : $('<a class="sidebar-auth-btn" href="auth.html">').text('Log In'));

        $profile.on('click', function (event) {
            event.stopPropagation();
            const open = !$menu.hasClass('open');
            $('.settings-profile-menu').removeClass('open');
            $('.settings-profile-btn').attr('aria-expanded', 'false');
            $menu.toggleClass('open', open);
            $profile.attr('aria-expanded', String(open));
            if (open) renderProfileMenu($menu, user);
        });
    }

    // Fills the profile menu of this page.
    function renderProfileMenu($menu, user) {
        $menu.empty().append(
            $('<div class="settings-profile-identity">').append(
                $('<strong>').text(user.name),
                $('<span>').text(user.email)
            )
        );
        if (user.role === 'admin') {
            $('<a class="settings-profile-action primary" href="admin.php">')
                .append('<i data-lucide="layout-dashboard"></i>', $('<span>').text('Admin Panel'))
                .appendTo($menu);
            return;
        }
        [
            ['Landmarks', 'landmarks', 'map-pin'],
            ['Recent Trips', 'trips', 'history'],
            ['Favourites', 'favourites', 'heart']
        ].forEach(([label, tab, icon]) => {
            $('<button type="button" class="settings-profile-action">')
                .append($('<i>').attr('data-lucide', icon), $('<span>').text(label))
                .on('click', function () {
                    $('.settings-profile-menu').removeClass('open');
                    $('.settings-profile-btn').attr('aria-expanded', 'false');
                    openSavedModal(tab);
                })
                .appendTo($menu);
        });
    }

    // Dialog listing the saved landmarks, favorites or trips, with remove / use buttons.
    function openSavedModal(tab) {
        const labels = { landmarks: 'Landmarks', trips: 'Recent Trips', favourites: 'Favourites' };
        const endpoints = { landmarks: 'landmarks/list.php', trips: 'trips/list.php', favourites: 'favorites/list.php' };
        const deleteEndpoints = { landmarks: 'landmarks/delete.php', trips: 'trips/delete.php', favourites: 'favorites/delete.php' };
        const $overlay = $('<div class="pc-overlay saved-modal-overlay">');
        const $list = $('<div class="saved-modal-list">').append($('<p class="muted">').text('Loading...'));
        const $modal = $('<div class="pc-modal saved-modal" role="dialog" aria-modal="true">').append(
            $('<button type="button" class="saved-modal-close" aria-label="Close">').text('×'),
            $('<span class="modal-kicker">Saved information</span>'),
            $('<h2>').text(labels[tab]),
            $list
        );
        const close = () => popOut($modal[0], () => $overlay.remove());
        $modal.find('.saved-modal-close').on('click', close);
        $overlay.append($modal).on('click', e => { if (e.target === $overlay[0]) close(); }).appendTo('body');
        popIn($modal[0]);

        API.get(endpoints[tab]).then(res => {
            const items = res.items || res.trips || res.favorites || res.landmarks || [];
            $list.empty();
            if (!items.length) return $list.append($('<p class="muted">').text('Nothing saved here yet.'));
            items.forEach(item => {
                const title = item.label || item.name || (item.originName && item.originName + ' → ' + item.destName) || 'Saved item';
                const detail = tab === 'landmarks'
                    ? (item.isPublic ? 'Public landmark' : 'Personal landmark') + ' · ' + (item.category || 'other').replace(/^./, c => c.toUpperCase())
                    : [item.transportLabel, item.passengerLabel].filter(Boolean).join(' · ');
                const $row = $('<div class="saved-modal-item">').append(
                    $('<div>').append($('<strong>').text(title), $('<span>').text(detail || 'No additional details'))
                );
                const $remove = $('<button type="button" class="small-button danger-small">').text('Remove').on('click', async () => {
                    try {
                        await API.post(deleteEndpoints[tab], { id: item.id });
                        $row.remove();
                        notify('Saved item removed.', 'success');
                    } catch (err) {
                        notify(API.describe(err), 'error');
                    }
                });
                const $actions = $('<div class="saved-modal-actions">');
                if (tab === 'landmarks' && item.isPublic) {
                    $actions.append($('<span class="public-label">').text('Admin managed'));
                } else {
                    $actions.append($remove);
                }
                if (tab === 'trips') {
                    $('<button type="button" class="small-button outline-small">').text('Use Route').on('click', () => {
                        sessionStorage.setItem('para_pending_route', JSON.stringify(item));
                        window.location.href = 'calculate.html';
                    }).prependTo($actions);
                }
                $row.append($actions).appendTo($list);
            });
        }).catch(err => $list.empty().append($('<p class="muted">').text(API.describe(err))));
    }

    // (admins never get here: they are sent to admin-settings.php on load)
    // What profile.php said about the password: is one set, and did the user just sign in
    // (then password / email changes skip the current password)
    let security = { hasPassword: false, recentLogin: false };

    function fillProfile(res) {
        const user = res.user;
        security = { hasPassword: !!user.hasPassword, recentLogin: !!user.recentLogin };
        $('#password-state').text(security.hasPassword ? '••••••••' : 'Not set');
        $('#change-password').text(security.hasPassword ? 'Change' : 'Set Password');
        renderAvatar($('#settings-avatar'), user);
        $('#hero-name, #profile-name').text(user.name);
        $('#hero-email, #profile-email').text(user.email);
        $('#profile-member-since').text(user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available');
        $('#stat-trips').text(res.stats.trips); $('#stat-fare').text('₱' + Number(res.stats.totalFare).toFixed(2));
        $('#stat-favorites').text(res.stats.favorites); $('#stat-landmarks').text(res.stats.landmarks);
        loadPreferences(user);
    }

    // Profile / Security / Preferences / Activity: show one section at a time
    function showSettingsTab(tab) {
        $('.settings-tabs .seg-btn').each(function () {
            const on = $(this).data('tab') === tab;
            $(this).toggleClass('is-active', on).attr('aria-selected', String(on));
        });
        $('.settings-panel').each(function () {
            $(this).prop('hidden', $(this).data('panel') !== tab);
        });
    }

    // Shows the profile picture, or the first letter of the name.
    function renderAvatar($target, user) {
        $target.empty();
        if (user.profilePicture) {
            $('<img>').attr({ src: '../' + user.profilePicture, alt: 'Profile picture' }).appendTo($target);
        } else {
            $target.text((user.name || '?').trim().charAt(0).toUpperCase() || '?');
        }
    }

    // Lets the user pick a new profile picture and uploads it (max 2 MB).
    function changePicture() {
        const input = $('<input type="file" accept="image/jpeg,image/png,image/webp" hidden>');
        input.on('change', function () {
            const file = this.files && this.files[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) {
                notify('Profile pictures must be 2 MB or smaller.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const res = await API.post('auth/update_profile_picture.php', { image: reader.result });
                    Auth.user.profilePicture = res.profilePicture;
                    renderAvatar($('#settings-avatar'), Auth.user);
                    notify('Profile picture updated.', 'success');
                } catch (err) {
                    notify(API.describe(err), 'error');
                }
            };
            reader.readAsDataURL(file);
        });
        input.appendTo('body').trigger('click');
        input.on('change', () => input.remove());
    }

    // Fills the commute preference dropdowns with the saved defaults.
    async function loadPreferences(user) {
        try {
            const res = await API.get('fares.php');
            const passengers = Object.entries(res.discounts || {});
            const transports = Object.entries(res.types || {});
            const option = ([code, item]) => $('<option>').val(code).text(item.label || code);
            $('#default-passenger').empty().append(passengers.map(option)).val(user.defaultPassenger || '');
            $('#default-transport').empty().append(transports.map(option)).val(user.defaultTransport || '');
        } catch (err) {
            $('#default-passenger, #default-transport').html('<option value="">Unavailable</option>');
        }
    }

    // Small form dialog (used for name, email and password changes).
    function promptDialog(title, fields, submitText, handler) {
        const overlay = $('<div class="pc-overlay">'), modal = $('<div class="pc-modal">').append($('<h2>').text(title));
        const inputs = {};
        fields.forEach(field => {
            inputs[field.key] = $('<input class="pc-input">').attr({
                type: field.type || 'text',
                autocomplete: field.autocomplete || 'off',
                placeholder: field.label,
                maxlength: field.maxlength || 255
            }).val(field.value || '');
            modal.append($('<div class="pc-field">').append($('<label>').text(field.label), inputs[field.key]));
        });
        const save = $('<button class="pc-btn pc-primary" type="button">').text(submitText), cancel = $('<button class="pc-btn pc-outline" type="button">').text('Cancel');
        const close = () => popOut(modal[0], () => overlay.remove());
        cancel.on('click', close); save.on('click', async () => { save.prop('disabled', true); try { await handler(Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.val().trim()]))); close(); } catch (err) { notify(API.describe(err), 'error'); save.prop('disabled', false); } });
        modal.append($('<div class="pc-actions">').append(cancel, save)); overlay.append(modal).on('click', e => { if (e.target === overlay[0]) close(); }).appendTo('body'); popIn(modal[0]); inputs[fields[0].key].trigger('focus');
    }

    // Edit Name dialog.
    function openName() { promptDialog('Edit Name', [{ key: 'name', label: 'Display name', autocomplete: 'name', maxlength: 100 }], 'Save Changes', async data => { if (!data.name) throw { message: 'Name is required.' }; const res = await API.post('auth/update_profile.php', data); Auth.user = res.user; updateNav(res.user); fillProfile(await API.get('auth/profile.php')); notify('Your name was updated.', 'success'); }); }
    // The current password is asked only when the account has one and the user did not just sign in.
    const needsCurrentPassword = () => security.hasPassword && !security.recentLogin;
    const currentPasswordField = { key: 'currentPassword', label: 'Current password', type: 'password', autocomplete: 'current-password' };

    // The 10 minutes after signing in passed while the page was open: reload, so the dialog asks for the password next time
    async function onSecurityError(err) {
        if (err.errors && err.errors.currentPassword && !needsCurrentPassword()) {
            fillProfile(await API.get('auth/profile.php'));
            throw { message: 'For your safety, please enter your current password.' };
        }
        throw err;
    }

    // Change Email, in two steps: the new email (+ current password if needed), then the code sent to it.
    function openEmail() {
        const fields = [{ key: 'email', label: 'New email address', type: 'email', autocomplete: 'email' }];
        if (needsCurrentPassword()) fields.push(currentPasswordField);
        promptDialog('Change Email', fields, 'Send Code', async data => {
            const email = data.email.toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw { message: 'Enter a valid email address, like juan@gmail.com.' };
            await API.post('auth/change_email.php', data).catch(onSecurityError);
            notify('We sent a 6-digit code to ' + email + '.', 'success');
            setTimeout(() => promptDialog('Confirm Your New Email', [{ key: 'code', label: 'Enter the 6-digit code sent to ' + email, autocomplete: 'one-time-code', maxlength: 6 }], 'Change Email', async step2 => {
                const res = await API.post('auth/change_email.php', { email, code: step2.code });
                Auth.user = res.user; updateNav(res.user);
                fillProfile(await API.get('auth/profile.php'));
                notify('Your email was updated.', 'success');
            }), 300);   // after the first dialog has closed
        });
    }

    // Set Password (accounts made with Google or an email code) or Change Password.
    function openPassword() {
        const fields = [];
        if (needsCurrentPassword()) fields.push(currentPasswordField);
        fields.push({ key: 'newPassword', label: 'New password (at least 8 characters)', type: 'password', autocomplete: 'new-password' },
                    { key: 'confirmPassword', label: 'Confirm new password', type: 'password', autocomplete: 'new-password' });
        const setting = !security.hasPassword;
        promptDialog(setting ? 'Set a Password' : 'Change Password', fields, setting ? 'Set Password' : 'Change Password', async data => {
            if (data.newPassword.length < 8) throw { message: 'New password must be at least 8 characters.' };
            if (data.newPassword !== data.confirmPassword) throw { message: 'Passwords do not match.' };
            delete data.confirmPassword;
            await API.post('auth/change_password.php', data).catch(onSecurityError);
            fillProfile(await API.get('auth/profile.php'));
            notify(setting ? 'Your password was set. You can now log in with it or with a code.' : 'Your password was changed.', 'success');
        });
    }

    // Loads the items of the open saved-items tab.
    async function loadSaved() {
        const endpoint = { trips: 'trips/list.php', favorites: 'favorites/list.php', landmarks: 'landmarks/list.php' }[activeTab];
        const deleteEndpoint = { trips: 'trips/delete.php', favorites: 'favorites/delete.php', landmarks: 'landmarks/delete.php' }[activeTab];
        const list = $('#saved-list').empty().append($('<p class="empty-state">').text('Loading...'));
        try {
            const res = await API.get(endpoint); const items = res.items || res.trips || res.favorites || res.landmarks || [];
            list.empty();
            if (!items.length) return list.append($('<p class="empty-state">').text('No saved ' + activeTab + ' yet.'));
            items.forEach(item => {
                const title = item.label || item.name ||
                    (item.originName && (item.originName + ' → ' + item.destName)) ||
                    'Saved item';
                const detail = activeTab === 'trips'
                    ? [item.transportLabel, item.passengerLabel, item.distanceKm ? Number(item.distanceKm).toFixed(1) + ' km' : ''].filter(Boolean).join(' · ')
                    : activeTab === 'landmarks'
                        ? (item.isPublic ? 'Public landmark · ' : 'Personal landmark · ') + (item.category || 'other').replace(/^./, c => c.toUpperCase())
                        : [item.transportLabel, item.passengerLabel].filter(Boolean).join(' · ');
                const row = $('<div class="saved-item">').append(
                    $('<div class="saved-item-content">').append(
                        $('<h3>').text(title),
                        $('<p>').text(detail || 'No additional details')
                    )
                );
                const actions = $('<div class="saved-item-actions">');
                if (activeTab === 'trips') {
                    $('<button class="small-button outline-small" type="button">').text('Use Route')
                        .on('click', () => {
                            sessionStorage.setItem('para_pending_route', JSON.stringify(item));
                            window.location.href = 'calculate.html';
                        }).appendTo(actions);
                }
                const canManageLandmark = !item.isPublic || Auth.getCurrentUser()?.role === 'admin';
                if (activeTab === 'landmarks' && item.isPublic && !canManageLandmark) {
                    $('<span class="public-label">').text('Admin managed').appendTo(actions);
                } else if (activeTab === 'landmarks') {
                    $('<button class="small-button outline-small" type="button">').text('Edit')
                        .on('click', () => openLandmarkEditor(item))
                        .appendTo(actions);
                    $('<button class="small-button danger-small" type="button">').text('Remove')
                        .on('click', async () => {
                            if (!window.confirm('Remove this landmark?')) return;
                            try {
                                await API.post(deleteEndpoint, { id: item.id });
                                await loadSaved();
                                notify('Landmark removed.', 'success');
                            } catch (err) {
                                notify(API.describe(err), 'error');
                            }
                        }).appendTo(actions);
                } else {
                    $('<button class="small-button danger-small" type="button">').text('Remove')
                        .on('click', async () => {
                            if (!window.confirm('Remove this item?')) return;
                            try {
                                await API.post(deleteEndpoint, { id: item.id });
                                await loadSaved();
                                notify('Item removed.', 'success');
                            } catch (err) {
                                notify(API.describe(err), 'error');
                            }
                        }).appendTo(actions);
                }
                row.append(actions);
                list.append(row);
            });
        } catch (err) { list.empty().append($('<p class="empty-state">').text(API.describe(err))); }
    }

    // Edit dialog for one of your landmarks.
    function openLandmarkEditor(item) {
        promptDialog('Edit landmark', [
            { key: 'name', label: 'Landmark name', maxlength: 120, value: item.name },
            { key: 'category', label: 'Category', maxlength: 30, value: item.category },
            { key: 'description', label: 'Description', maxlength: 500, value: item.description }
        ], 'Save Landmark', async data => {
            if (!data.name) throw { message: 'Landmark name is required.' };
            await API.post('landmarks/update.php', {
                id: item.id,
                name: data.name,
                category: data.category || 'other',
                description: data.description
            });
            await loadSaved();
            notify('Landmark updated.', 'success');
        });
    }

    // Saves the default passenger and vehicle types.
    async function savePreferences() { const button = $('#save-preferences').prop('disabled', true); try { await API.post('auth/preferences.php', { defaultPassenger: $('#default-passenger').val(), defaultTransport: $('#default-transport').val() }); notify('Commute preferences saved.', 'success'); } catch (err) { notify(API.describe(err), 'error'); } finally { button.prop('disabled', false); } }
    // Asks for confirmation, then logs out.
    function confirmLogout() {
        const overlay = $('<div class="pc-overlay">');
        const modal = $('<div class="pc-modal">').append(
            $('<span class="modal-kicker">Account security</span>'),
            $('<h2>').text('Log Out of Para?'),
            $('<p>').text('You will need to sign in again to manage your saved trips, favorites, and landmarks.')
        );
        const cancel = $('<button class="pc-btn pc-outline" type="button">').text('Stay Signed In');
        const confirm = $('<button class="pc-btn pc-danger" type="button">').text('Log Out');
        const close = () => popOut(modal[0], () => overlay.remove());
        cancel.on('click', close);
        confirm.on('click', async () => {
            confirm.prop('disabled', true);
            try {
                await Auth.logout();
                window.location.replace('auth.html');
            } catch (err) {
                notify(API.describe(err), 'error');
                confirm.prop('disabled', false);
            }
        });
        modal.append($('<div class="pc-actions">').append(cancel, confirm));
        overlay.append(modal).on('click', e => {
            if (e.target === overlay[0]) close();
        }).appendTo('body');
        popIn(modal[0]);
        cancel.trigger('focus');
    }

    $(async function () {
        setupThemeAndNav();
        const user = await Auth.ready();
        if (!user) { window.location.replace('auth.html#login'); return; }
        // Admins have their own settings page inside the admin panel (no passenger navigation there)
        if (user.role === 'admin') { window.location.replace('admin-settings.php'); return; }
        updateNav(user);
        try { fillProfile(await API.get('auth/profile.php')); } catch (err) { notify(API.describe(err), 'error'); }
        $('#edit-name').on('click', openName); $('#change-email').on('click', openEmail); $('#change-password').on('click', openPassword); $('#save-preferences').on('click', savePreferences); $('#logout').on('click', confirmLogout); $('#change-picture').on('click', changePicture);
        $('.settings-tabs').on('click', '.seg-btn', function () { showSettingsTab($(this).data('tab')); });
    });
})();
