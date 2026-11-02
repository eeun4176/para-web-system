// STATE
let originData = null;
let destData = null;
let pendingLandmarkPos = null;
let currentViewLandmarkId = null;
let tripsCache = [];
let favoritesCache = [];
const searchTimers = {};

// The first part of a place name ("SM City SJDM, Tungko" -> "SM City SJDM").
function firstName(text) {
    return String(text || '').split(',')[0].trim();
}


// NOTIFICATIONS: bottom-right toasts with a timer line (drawn by showToast in ui.js)
function showNotification(message, type = 'success') {
    showToast(type, message);
}

// A message that must survive a page change
function queueNotification(message, type = 'success') {
    try {
        sessionStorage.setItem('para_flash', JSON.stringify({ message, type }));
    } catch (e) {}
}

// Shows the message saved before the last page change (e.g. "Welcome back!").
function showQueuedNotification() {
    try {
        const raw = sessionStorage.getItem('para_flash');
        if (!raw) return;

        sessionStorage.removeItem('para_flash');
        const f = JSON.parse(raw);

        if (f && typeof f.message === 'string') {
            showNotification(f.message, f.type);
        }
    } catch (e) {}
}

// DARK MODE
function applyDarkMode() {
    const isDark = localStorage.getItem('para_dark') === 'true';
    document.body.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('dark', isDark);
    syncToggleKnob(isDark);
}

// Dark mode button: switches the theme and remembers it.
function setupDarkToggle() {
    const btn = document.getElementById('dark-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
        const isDark = document.body.classList.toggle('dark');
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('para_dark', String(isDark));
        syncToggleKnob(isDark);
        this.setAttribute('aria-pressed', String(isDark));
    });
}

// The sun/moon icon swap is done in CSS (global.css: .toggle-knob .icon-light / .icon-dark)
function syncToggleKnob(isDark) {
    const knob = document.querySelector('#dark-toggle .toggle-knob');
    if (!knob) return;
    knob.classList.toggle('is-dark', isDark);
}

// SCROLL ANIMATIONS
function setupScrollAnimations() {
    const observer = new IntersectionObserver(
        entries => entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);   // fade in once, not every time it scrolls past
        }),
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.anim-on-scroll').forEach(el => observer.observe(el));
}

// BACK TO TOP
function setupBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('active', window.scrollY > 400);
    });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// AUTH NAV (state comes from the server session, see auth.js)
function isAdminUser() {
    const u = Auth.getCurrentUser();
    return !!u && u.role === 'admin';
}


// Navbar and phone menu for the current user: Log In / Sign Up for guests, the profile menu for members.
function updateNavAuth() {
    const user = Auth.getCurrentUser();

    // Keep the Admin Dashboard link inside the profile menu.
    $('.admin-link').remove();

    const areas = [
        { el: document.getElementById('nav-auth-area'), kind: 'nav' },
        { el: document.getElementById('sidebar-auth-area'), kind: 'sidebar' }
    ].filter(x => x.el);

    if (!areas.length) return;

    for (const { el, kind } of areas) {
        el.innerHTML = '';

        if (kind === 'nav') {
            // Guests get two clear buttons; logged-in users get their profile picture with a menu
            if (user) {
                if (user.role !== 'admin') $(el).append(buildNavGreeting(user));   // the admin dashboard has its own greeting
                el.appendChild(buildProfileMenu(user));
            }
            else $(el).append(
                '<a href="auth.html#login" class="nav-login-link">Log In</a>',
                '<a href="auth.html#signup" class="nav-auth-btn">Sign Up</a>'
            );
            continue;
        }

        if (user) {
            $('<button type="button" class="sidebar-auth-btn">')
                .append('<i data-lucide="log-out" aria-hidden="true"></i>', $('<span>').text('Log Out'))
                .on('click', doLogout)
                .appendTo(el);
        } else {
            $(el).append(
                '<a href="auth.html#signup" class="sidebar-auth-btn">Sign Up</a>',
                '<a href="auth.html#login" class="sidebar-auth-btn outline">Log In</a>'
            );
        }
    }
}


// Asks for confirmation, logs out and goes to the right sign-in page.
async function doLogout() {
    const wasAdmin = isAdminUser();
    const sure = await confirmDialog({
        title: 'Log out?',
        message: 'You will need to log in again to see your trips, favorites and landmarks.',
        confirmText: 'Log Out'
    });
    if (!sure) return;
    try {
        await Auth.logout();
    } catch (err) {
        showNotification(API.describe(err), 'error');
        return;
    }

    showNotification('Logged out. See you soon!', 'info');
    updateNavAuth();
    DataManager.reset();
    tripsCache = [];
    favoritesCache = [];
    if (typeof renderSavedLandmarks === 'function') renderSavedLandmarks();
    renderLandmarksList();
    renderTripsList();
    renderFavoritesList();
    closeAllPanels();

    window.location.replace(wasAdmin ? 'admin-login.html' : 'auth.html');   // replace: Back can't return to the signed-in page
}

// MODAL HELPERS
function openModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('open');
    popIn(overlay.querySelector('.modal'));
}

// Closes a dialog with its closing animation.
function closeModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay || !overlay.classList.contains('open')) return;
    popOut(overlay.querySelector('.modal'), () => overlay.classList.remove('open'));
}

// Clicking the dark area around a dialog closes it.
function setupModalOverlayClose() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeModal(overlay.id);
        });
    });
}

// Esc closes the open dialog or panel.
function setupEscKey() {
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.open')
                    .forEach(m => closeModal(m.id));
            closeAllPanels();
        }
    });
}


// LOCATION SEARCH

// The last places picked in either search box (shown when a box is focused while empty)
const RECENT_PLACES_KEY = 'para_recent_places';

// The places picked lately (saved in this browser).
function recentPlaces() {
    try { return JSON.parse(localStorage.getItem(RECENT_PLACES_KEY)) || []; } catch (e) { return []; }
}

// Adds a picked place to the recent places (max 5).
function rememberPlace(loc) {
    if (loc.isCurrent) return;
    const list = recentPlaces().filter(p => !sameLocation(p, loc));
    list.unshift({ name: loc.name, detail: loc.detail || '', lat: loc.lat, lng: loc.lng });
    try { localStorage.setItem(RECENT_PLACES_KEY, JSON.stringify(list.slice(0, 5))); } catch (e) { /* storage full or blocked */ }
}

// "Use my current location": the browser asks the user first; only places inside SJDM are accepted
function currentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Your browser cannot share your location.'));
        navigator.geolocation.getCurrentPosition(
            pos => {
                const loc = { name: 'My Location', lat: pos.coords.latitude, lng: pos.coords.longitude, isCurrent: true };
                if (!isLocationInsideCoverage(loc.lat, loc.lng)) return reject(new Error('You seem to be outside SJDM. Search for a place instead.'));
                resolve(loc);
            },
            () => reject(new Error('Location is turned off. Allow it in your browser, or search for a place.')),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    });
}

// Search box with suggestions: recent places, current location, saved landmarks and places in SJDM.
function setupSearchInput(inputId, dropdownId, onSelect) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    if (!input || !dropdown) return;

    let activeIndex = -1;
    let searchVersion = 0;

    // Hides the suggestions list.
    function closeDropdown() {
        dropdown.classList.remove('open');
        dropdown.innerHTML = '';
        activeIndex = -1;
    }

    // Highlights the suggestion picked with the arrow keys.
    function updateActiveItem(items) {
        items.forEach((item, index) => {
            const active = index === activeIndex;
            item.classList.toggle('active', active);
            item.setAttribute('aria-selected', String(active));
        });

        if (items[activeIndex]) {
            items[activeIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    // Uses a place: fills the box, remembers it and puts it on the map.
    function pick(loc) {
        input.value = loc.name;
        closeDropdown();
        rememberPlace(loc);
        onSelect(loc);
    }

    // Handles a click or Enter on a suggestion (including "Use My Current Location").
    async function selectItem(item) {
        if (!item) return;

        if (item.dataset.current) {
            item.querySelector('.search-result-category').textContent = 'Finding you...';
            try {
                pick(await currentLocation());
            } catch (err) {
                closeDropdown();
                showNotification(err.message, 'warning');
            }
            return;
        }

        const loc = {
            name: item.dataset.name,
            detail: item.dataset.detail,
            lat: Number(item.dataset.lat),
            lng: Number(item.dataset.lng)
        };

        if (!Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return;
        pick(loc);
    }

    // The place name with the typed words in bold (built with text nodes: names can't inject HTML)
    function highlighted(text, query) {
        const span = document.createElement('span');
        span.className = 'search-result-name';
        const words = (query || '').toLowerCase().split(/\s+/).filter(w => w.length > 1);
        const lower = text.toLowerCase();
        let i = 0;
        while (i < text.length) {
            let hit = null;
            words.forEach(w => { if (!hit && lower.startsWith(w, i)) hit = w; });
            if (hit) {
                const mark = document.createElement('mark');
                mark.textContent = text.slice(i, i + hit.length);
                span.appendChild(mark);
                i += hit.length;
            } else {
                span.appendChild(document.createTextNode(text[i]));
                i++;
            }
        }
        span.normalize();
        return span;
    }

    // Adds one suggestion row.
    function addItem(loc, iconName, detailText, query) {
        const item = document.createElement('div');
        item.className = 'search-dropdown-item';
        item.dataset.name = loc.name;
        item.dataset.detail = loc.detail || '';
        item.dataset.lat = loc.lat;
        item.dataset.lng = loc.lng;
        if (loc.isCurrent) item.dataset.current = '1';
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', 'false');

        const icon = document.createElement('i');
        icon.className = 'item-icon';
        icon.dataset.lucide = iconName;
        icon.setAttribute('aria-hidden', 'true');

        const details = document.createElement('div');
        details.className = 'search-result-details';

        const category = document.createElement('small');
        category.className = 'search-result-category';
        category.textContent = detailText;

        details.append(highlighted(loc.name, query), category);
        item.append(icon, details);

        item.addEventListener('click', () => selectItem(item));
        dropdown.appendChild(item);
    }

    // Adds a small heading between suggestion groups.
    function addHeading(title) {
        const heading = document.createElement('div');
        heading.className = 'search-dropdown-item search-section-heading';
        heading.textContent = title;
        dropdown.appendChild(heading);
    }

    // Adds a heading and its suggestions.
    function addSection(title, results, source, query) {
        if (!results.length) return;
        addHeading(title);
        results.forEach(loc => {
            const detail = source === 'saved'
                ? (loc.isPublic ? 'Public landmark' : 'Your landmark') + ' · ' + (loc.category || 'other').replace(/^./, c => c.toUpperCase())
                : loc.detail || 'Place in SJDM';
            addItem(loc, source === 'saved' ? 'star' : 'map-pin', detail, query);
        });
    }

    // Empty box: "Use my current location" and the places picked lately
    function showSuggestions() {
        dropdown.innerHTML = '';
        activeIndex = -1;
        addItem({ name: 'Use My Current Location', isCurrent: true }, 'locate-fixed', 'Uses your phone or browser location');
        const other = inputId === 'origin-input' ? destData : originData;
        const recent = recentPlaces().filter(p => !sameLocation(p, other));
        if (recent.length) {
            addHeading('Recent');
            recent.forEach(p => addItem(p, 'history', p.detail || 'Place in SJDM'));
        }
        dropdown.classList.add('open');
    }

    input.addEventListener('focus', () => { if (!input.value.trim()) showSuggestions(); });

    input.setAttribute('autocomplete', 'off');
    dropdown.setAttribute('role', 'listbox');

    input.addEventListener('input', function () {
        const query = this.value.trim();
        const version = ++searchVersion;

        clearTimeout(searchTimers[inputId]);
        activeIndex = -1;

        if (query.length < 1) {
            showSuggestions();
            return;
        }

        // Wait until typing pauses (Nominatim allows about one request per second)
        searchTimers[inputId] = setTimeout(async () => {
            skeletonRows($(dropdown), 3);   // shimmering placeholders while searching (ui.js)
            dropdown.classList.add('open');

            try {
                const [savedResult, externalResult] = await Promise.allSettled([
                    DataManager.searchLandmarks(query, 8),
                    query.length >= 2 ? searchLocations(query) : Promise.resolve([])
                ]);

                if (version !== searchVersion) return;

                const saved = savedResult.status === 'fulfilled'
                    ? savedResult.value
                    : [];

                const external = externalResult.status === 'fulfilled'
                    ? externalResult.value
                    : [];

                const otherSelectedLocation =
                    inputId === 'origin-input' ? destData : originData;
                const availableSaved = saved.filter(loc =>
                    !sameLocation(loc, otherSelectedLocation)
                );
                const availableExternal = external.filter(loc =>
                    !sameLocation(loc, otherSelectedLocation)
                );

                // Remove Nominatim results that already exist in saved landmarks.
                                // Check whether two results are very close to each other.
                function isNearby(a, b) {
                    const toRad = value => value * Math.PI / 180;

                    const lat1 = toRad(a.lat);
                    const lat2 = toRad(b.lat);
                    const dLat = toRad(b.lat - a.lat);
                    const dLng = toRad(b.lng - a.lng);

                    const h =
                        Math.sin(dLat / 2) ** 2 +
                        Math.cos(lat1) * Math.cos(lat2) *
                        Math.sin(dLng / 2) ** 2;

                    const distance = 6371000 * 2 *
                        Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

                    return distance <= 300;
                }

                // Remove external results that match saved landmarks.
                // Also remove duplicates within the external results.
                const uniqueExternal = [];

                availableExternal.forEach(loc => {
                    const matchesSaved = availableSaved.some(savedLoc =>
                        isNearby(loc, savedLoc)
                    );

                    const matchesExternal = uniqueExternal.some(existing =>
                        isNearby(loc, existing)
                    );

                    if (!matchesSaved && !matchesExternal) {
                        uniqueExternal.push(loc);
                    }
                });

                dropdown.innerHTML = '';

                addSection('Saved Landmarks', availableSaved, 'saved', query);
                addSection('Places in SJDM', uniqueExternal, 'external', query);

                if (!availableSaved.length && !uniqueExternal.length) {
                    const empty = document.createElement('div');
                    empty.className = 'search-dropdown-item loading';

                    if (
                        savedResult.status === 'rejected' &&
                        externalResult.status === 'rejected'
                    ) {
                        empty.textContent = 'Could not load search results. Please try again.';
                    } else {
                        empty.textContent = query.length < 2
                            ? 'Keep typing to search places in SJDM.'
                            : 'No matching places found. Try another name or a nearby landmark.';
                    }

                    dropdown.appendChild(empty);
                }

            } catch (err) {
                if (version !== searchVersion) return;
                console.error('[LocationSearch] Search failed:', err);
                dropdown.innerHTML = '';

                const error = document.createElement('div');
                error.className = 'search-dropdown-item loading';
                error.textContent = 'Could not load search results. Please try again.';
                dropdown.appendChild(error);
            }
        }, 300);
    });

    input.addEventListener('keydown', function (e) {
        const items = Array.from(
            dropdown.querySelectorAll('.search-dropdown-item[role="option"]')
        );

        if (!dropdown.classList.contains('open') || !items.length) {
            if (e.key === 'Escape') closeDropdown();
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % items.length;
            updateActiveItem(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
            updateActiveItem(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            selectItem(items[Math.max(activeIndex, 0)]);
        } else if (e.key === 'Escape') {
            closeDropdown();
        }
    });

    document.addEventListener('click', e => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            closeDropdown();
        }
    });
}

// True when two places are within a few metres of each other.
function sameLocation(a, b) {
    if (!a || !b) return false;

    const toRad = value => value * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLng / 2) ** 2;

    const distance = 6371000 * 2 *
        Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

    return distance <= 300;
}

// CALCULATE PAGE
function setupCalcListeners() {
    setupSearchInput('origin-input', 'origin-dropdown', loc => {
        if (sameLocation(loc, destData)) {
            $('#origin-input').val(originData?.name || '');
            showNotification(
                'Origin and destination cannot be the same location.',
                'warning'
            );
            return;
        }

        originData = loc;
        setOriginMarker(loc.lat, loc.lng, firstName(loc.name));   // redraws the route, then recalculates
    });

    setupSearchInput('dest-input', 'dest-dropdown', loc => {
        if (sameLocation(loc, originData)) {
            $('#dest-input').val(destData?.name || '');
            showNotification(
                'Origin and destination cannot be the same location.',
                'warning'
            );
            return;
        }

        destData = loc;
        setDestinationMarker(loc.lat, loc.lng, firstName(loc.name));
    });

    // Clear the selected location when its input is changed by hand
    $('#origin-input').on('input', function () {
        if (originData && this.value.trim() !== originData.name) {
            originData = null;
            clearOriginMarker();
        }
    });

    $('#dest-input').on('input', function () {
        if (destData && this.value.trim() !== destData.name) {
            destData = null;
            clearDestinationMarker();
        }
    });

    $('#swap-btn').on('click', () => {
        [originData, destData] = [destData, originData];
        const $o = $('#origin-input');
        const $d = $('#dest-input');
        const tmp = $o.val();
        $o.val($d.val());
        $d.val(tmp);
        if (originData) setOriginMarker(originData.lat, originData.lng, firstName(originData.name));
        else clearOriginMarker();                       // no stale marker if one side was empty
        if (destData) setDestinationMarker(destData.lat, destData.lng, firstName(destData.name));
        else clearDestinationMarker();
    });

    $('#transport-select, #passenger-select').on('change', refreshFareCalculation);

    setupPanels();
    setupLandmarkList();
    setupTrips();
    setupFavorites();
}

// FARE CALCULATION (the server does the maths: api/calculate.php)
let fareTimer = null;
let fareRequestId = 0;
let lastWarnKey = '';

// Debounced, so swap/select changes that fire several updates only cause one request
function refreshFareCalculation() {
    clearTimeout(fareTimer);
    fareTimer = setTimeout(runFareCalculation, 150);
}

// Shows the fare result, or Para's hint when there is no result yet.
function setResultVisible(visible) {
    $('#result-card').toggleClass('active', visible);
    $('#para-hint').css('display', visible ? 'none' : 'flex');
    if (!visible) {
        $('#summary-fare').text('');
        if (typeof setEtaBubble === 'function') setEtaBubble('');
    }
}

// Asks the server for the fare of the current trip and shows the result, notes and ETA.
async function runFareCalculation() {
    if (!$('#result-card').length) return;
    const transport = $('#transport-select').val();
    const passenger = $('#passenger-select').val();
    const $hint = $('#para-hint-text');

    $('#summary-route').text(originData && destData
        ? firstName(originData.name) + ' → ' + firstName(destData.name)
        : 'Where to Today?');
    $('#access-banner').hide().text('');      // never show an old note next to a new result

    if (!originData || !destData) {
        $hint.html('<strong>Select an origin and destination to see the fare!</strong>');
        setResultVisible(false);
        return;
    }
    if (!transport || !passenger) {
        $hint.html('<strong>Now choose a transport type and passenger type!</strong>');
        setResultVisible(false);
        return;
    }

    // The road route is still loading: wait for it (map-logic.js recalculates when it arrives)
    if (routeController) return;

    const myId = ++fareRequestId;
    // Show the result card with shimmering placeholders until the server answers
    $('#result-card').addClass('is-loading');
    setResultVisible(true);
    try {
        const routeForSave = getCurrentRoute();
        const fare = await fetchFare(originData, destData, transport, passenger, currentRoad);
        if (myId !== fareRequestId) return;

        $('#res-origin').text(firstName(originData.name));
        $('#res-dest').text(firstName(destData.name));
        $('#res-distance').text(fare.distance + ' km' + (fare.distanceSource === 'road' ? ' by road' : ' (straight line)'));
        $('#res-eta').text('~' + fare.durationMin + ' min (arrive ~' + fare.arrivalTime + ')');
        $('#res-base').text('₱' + fare.baseFare);
        $('#res-excess').text('₱' + fare.excessFare);
        $('#res-ptype').text(fare.passengerType);
        $('#res-discount').text(fare.discountRate > 0
            ? '-₱' + fare.discountAmount + ' (' + fare.discountRate + '% off)'
            : 'None');
        $('#res-exact').text('₱' + fare.exactTotal);
        $('#res-total').text('₱' + fare.total);
        $('#summary-fare').text('₱' + fare.total);
        setResultVisible(true);
        autoSaveRecentTrip(routeForSave);

        // Walk / tricycle / long-trip note from the server (api/fare_logic.php: access_info)
        const icons = { walk: 'footprints', special_trip: 'bike', far: 'repeat' };
        if (icons[fare.access]) {
            $('#access-banner').attr('class', 'access-banner ' + fare.access).css('display', 'flex').empty().append(
                $('<i>').attr('data-lucide', icons[fare.access]), $('<span>').text(fare.accessMessage)
            ).show();
        }

        // On the map: ETA above the destination, and the chosen vehicle drives the route
        setEtaBubble(fare.durationMin + ' min');
        showVehicle(transport);
        if (window.innerWidth <= 900) setPanelCollapsed(true);   // phones: show the route, keep the fare in the pill
    } catch (err) {
        if (myId !== fareRequestId) return;
        setResultVisible(false);
        $hint.text('Could not calculate the fare. ' + API.describe(err));
        showNotification(API.describe(err), 'error');
    } finally {
        if (myId === fareRequestId) $('#result-card').removeClass('is-loading');
    }
}

// The route currently on screen, in the shape the backend expects (or null if incomplete)
function getCurrentRoute() {
    const transport = $('#transport-select').val();
    const passenger = $('#passenger-select').val();
    if (!originData || !destData || !transport || !passenger) return null;
    return {
        originName: firstName(originData.name), originLat: originData.lat, originLng: originData.lng,
        destName: firstName(destData.name), destLat: destData.lat, destLng: destData.lng,
        transport: transport, passenger: passenger,
        roadKm: currentRoad ? currentRoad.km : null,
        fromRoadM: currentRoad ? currentRoad.fromRoadM : null
    };
}


let autoSaveInProgress = false;
let pendingAutoSaveRoute = null;

// Saves the calculated trip to Recent Trips (signed-in users only, once per trip).
async function autoSaveRecentTrip(route) {
    if (!Auth.isLoggedIn() || !route) return;

    pendingAutoSaveRoute = route;

    if (autoSaveInProgress) return;

    autoSaveInProgress = true;

    try {
        while (pendingAutoSaveRoute) {
            const routeToSave = pendingAutoSaveRoute;
            pendingAutoSaveRoute = null;

            await API.post('trips/add.php', routeToSave);

            if (!$('.saved-pane[data-pane="trips"]').prop('hidden')) {
                await loadTrips();
            }
        }
    } catch (err) {
        pendingAutoSaveRoute = null;
        showNotification(
            'Could not update Recent Trips. Please try again.',
            'warning'
        );
    } finally {
        autoSaveInProgress = false;
    }
}


// Loads a saved trip / favorite back onto the map and the dropdowns
function applySavedRoute(r) {
    originData = { name: r.originName, lat: r.originLat, lng: r.originLng };
    destData = { name: r.destName, lat: r.destLat, lng: r.destLng };
    $('#origin-input').val(r.originName);
    $('#dest-input').val(r.destName);
    // trigger('change') so the vehicle/passenger chips (ui.js) highlight the loaded choice
    $('#transport-select').val(r.transport).trigger('change');
    $('#passenger-select').val(r.passenger).trigger('change');
    setOriginMarker(originData.lat, originData.lng, firstName(originData.name));
    setDestinationMarker(destData.lat, destData.lng, firstName(destData.name));
}

// CALCULATE PANEL: Trip / Saved tabs, the Favorites / Recent / Landmarks switch, and collapsing
const SAVED_PANES = {
    favorites: () => loadFavorites(),
    trips: () => loadTrips(),
    landmarks: () => renderLandmarksList($('#landmarks-search').val().trim().toLowerCase())
};

// Switches the panel between Trip and Saved.
function showCalcTab(tab) {
    $('.calc-tab').each(function () {
        const on = $(this).data('tab') === tab;
        $(this).toggleClass('is-active', on).attr('aria-selected', String(on));
    });
    $('.calc-tabpanel').each(function () {
        $(this).prop('hidden', $(this).data('panel') !== tab);
    });
    if (tab === 'saved') showSavedPane($('.saved-tab.is-active').data('pane') || 'favorites');
}

// Switches the Saved tab between Favorites, Recent Trips and Landmarks.
function showSavedPane(pane) {
    $('.saved-tab').each(function () {
        const on = $(this).data('pane') === pane;
        $(this).toggleClass('is-active', on).attr('aria-selected', String(on));
    });
    $('.saved-pane').each(function () {
        $(this).prop('hidden', $(this).data('pane') !== pane);
    });
    SAVED_PANES[pane]();
}

// The panel morphs between the card and the pill: measure both sizes, then animate from one to the other
function setPanelCollapsed(collapsed) {
    const panel = document.getElementById('calc-panel');
    $('#panel-collapse').attr('aria-expanded', String(!collapsed));
    if (!panel || panel.classList.contains('is-collapsed') === collapsed) return;

    const from = panel.getBoundingClientRect();
    panel.classList.toggle('is-collapsed', collapsed);
    const to = panel.getBoundingClientRect();
    if (prefersReducedMotion) return;

    const radius = (rect, pill) => (pill ? rect.height / 2 : 22) + 'px';
    panel.animate([
        { width: from.width + 'px', height: from.height + 'px', borderRadius: radius(from, !collapsed) },
        { width: to.width + 'px', height: to.height + 'px', borderRadius: radius(to, collapsed) }
    ], { duration: 460, easing: 'cubic-bezier(.22, 1, .36, 1)' });

    // The new content fades in once the shape has started moving
    $(panel).children(collapsed ? '.panel-summary' : '.panel-head, .panel-body').each(function () {
        this.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 140, easing: 'ease-out', fill: 'backwards' });
    });
}

// Picking a saved item (or pressing Esc) brings the Trip tab back
function closeAllPanels() {
    if ($('.calc-tab').length) showCalcTab('trip');
}

// Wires the panel tabs, collapse button, phone handle and saved lists.
function setupPanels() {
    $('.calc-tab').on('click', function () { showCalcTab($(this).data('tab')); });
    $('.saved-tab').on('click', function () { showSavedPane($(this).data('pane')); });
    $('#panel-collapse').on('click', () => setPanelCollapsed(true));
    $('#panel-summary').on('click', () => setPanelCollapsed(false));
    $('#sheet-handle').on('click', () => setPanelCollapsed(!$('#calc-panel').hasClass('is-collapsed')));
}

// LANDMARKS LIST
function setupLandmarkList() {
    $('#landmarks-search').on('input', function () {
        renderLandmarksList(this.value.trim().toLowerCase());
    });
    $('#landmarks-list').on('click', '.landmark-list-item', function (e) {
        e.stopPropagation();
        onLandmarkListClick($(this).data('id'));
    });
}

// Fills the landmarks list (with the search filter).
function renderLandmarksList(filter = '') {
    const $list = $('#landmarks-list');
    if (!$list.length) return;
    const loggedIn = Auth.isLoggedIn();
    const all = DataManager.getLandmarks();
    const filtered = filter
        ? all.filter(lm => lm.name.toLowerCase().includes(filter) || lm.category.toLowerCase().includes(filter))
        : all;

    $list.empty();
    if (!loggedIn) {
        $list.append('<div class="lm-empty">Showing public landmarks. <a href="auth.html">Log In</a> to save your own.</div>');
    }
    if (!filtered.length) {
        $list.append('<div class="lm-empty">' + (loggedIn
            ? 'No landmarks yet.<br>Right-click the map to add one!'
            : 'No public landmarks yet.') + '</div>');
        return;
    }
    filtered.forEach(lm => {
        $('<div class="landmark-list-item">').attr('data-id', lm.id).append(
            '<i data-lucide="map-pin" class="lm-icon" aria-hidden="true"></i>',
            $('<div class="lm-info">').append(
                $('<h5>').text(lm.name),
                $('<span>').text((lm.isPublic ? 'Public · ' : '') + String(lm.category || 'other').replace(/^./, c => c.toUpperCase()))
            )
        ).appendTo($list);
    });
}

// Opens a landmark from the list on the map.
function onLandmarkListClick(id) {
    const lm = DataManager.getLandmark(id);
    if (!lm) return;
    panToLandmark(lm);
    closeAllPanels();
    openViewLandmarkModal(id);
}

// ADD LANDMARK
function openAddLandmarkModal(lat, lng) {
    if (!isLocationInsideSJDM(lat, lng)) {
        showNotification('You can only add landmarks within San Jose del Monte.', 'warning');
        return;
    }

    pendingLandmarkPos = { lat, lng };
    document.getElementById('lm-name').value = '';
    document.getElementById('lm-category').value = 'other';
    document.getElementById('lm-desc').value = '';
    $('#lm-public').prop('checked', false);
    $('#lm-public-group').toggle(isAdminUser());
    openModal('add-landmark-modal');
}

// Checks and saves a new landmark from the Add Landmark dialog.
async function submitAddLandmark() {
    const name = document.getElementById('lm-name')?.value.trim();
    const category = document.getElementById('lm-category')?.value;
    const desc = document.getElementById('lm-desc')?.value.trim();
    const isPublic = isAdminUser() && $('#lm-public').is(':checked');
    if (!name) {
        showNotification('Please enter a landmark name.', 'warning');
        return;
    }
    if (!pendingLandmarkPos) return;
    try {
        const lm = await DataManager.addLandmark(name, category, desc, pendingLandmarkPos.lat, pendingLandmarkPos.lng, isPublic);
        addLandmarkMarker(lm);
        renderLandmarksList();
        closeModal('add-landmark-modal');
        showNotification('"' + name + '" added' + (isPublic ? ' as a public landmark!' : ' to your landmarks!'), 'success');
        pendingLandmarkPos = null;
    } catch (err) {
        showNotification(API.describe(err), 'error');
    }
}

// VIEW LANDMARK
function openViewLandmarkModal(id) {
    const lm = DataManager.getLandmark(id);
    if (!lm) return;
    currentViewLandmarkId = lm.id;
    document.getElementById('view-lm-name').textContent = lm.name;
    document.getElementById('view-lm-category').textContent =
        lm.category.charAt(0).toUpperCase() + lm.category.slice(1);
    document.getElementById('view-lm-desc').textContent = lm.description || '—';
    $('#view-lm-public').toggle(!!lm.isPublic);
    $('#view-lm-edit, #view-lm-delete').toggle(!lm.isPublic || isAdminUser());   // public ones: admins only
    openModal('view-landmark-modal');
}

// Asks for confirmation, then deletes the landmark.
async function deleteLandmarkConfirm() {
    if (!currentViewLandmarkId) return;
    const id = currentViewLandmarkId;
    const lm = DataManager.getLandmark(id);
    const name = lm ? lm.name : 'this landmark';
    const sure = await confirmDialog({
        title: 'Delete landmark?',
        message: '"' + name + '" will be permanently removed.',
        confirmText: 'Delete',
        danger: true
    });
    if (!sure) return;
    try {
        await DataManager.deleteLandmark(id);
    } catch (err) {
        showNotification(API.describe(err), 'error');
        return;
    }
    removeLandmarkMarker(id);
    renderLandmarksList();
    closeModal('view-landmark-modal');
    showNotification('"' + name + '" deleted.', 'info');
    currentViewLandmarkId = null;
}

// EDIT LANDMARK
function openEditLandmark() {
    if (!currentViewLandmarkId) return;
    const lm = DataManager.getLandmark(currentViewLandmarkId);
    if (!lm) return;
    document.getElementById('edit-lm-id').value = lm.id;
    document.getElementById('edit-lm-name').value = lm.name;
    document.getElementById('edit-lm-category').value = lm.category;
    document.getElementById('edit-lm-desc').value = lm.description || '';
    closeModal('view-landmark-modal');
    openModal('edit-landmark-modal');
}

// Saves the changes made in the Edit Landmark dialog.
async function submitEditLandmark() {
    const id = document.getElementById('edit-lm-id')?.value;
    const name = document.getElementById('edit-lm-name')?.value.trim();
    const category = document.getElementById('edit-lm-category')?.value;
    const desc = document.getElementById('edit-lm-desc')?.value.trim();
    if (!name) {
        showNotification('Please enter a landmark name.', 'warning');
        return;
    }
    try {
        await DataManager.updateLandmark(id, name, category, desc);
    } catch (err) {
        showNotification(API.describe(err), 'error');
        return;
    }
    removeLandmarkMarker(id);
    const updated = DataManager.getLandmark(id);
    if (updated) addLandmarkMarker(updated);
    renderLandmarksList();
    closeModal('edit-landmark-modal');
    showNotification('"' + name + '" updated!', 'success');
}

// RECENT TRIPS (api/trips/*.php)
function setupTrips() {

    $('#trips-list').on('click', '.item-del', async function (e) {
        e.stopPropagation();
        const id = $(this).closest('.landmark-list-item').data('id');
        try {
            await API.post('trips/delete.php', { id });
            tripsCache = tripsCache.filter(t => t.id !== id);
            renderTripsList();
            showNotification('Trip removed.', 'info');
        } catch (err) {
            showNotification(API.describe(err), 'error');
        }
    });

    $('#trips-list').on('click', '.landmark-list-item', function (e) {
        e.stopPropagation();
        const trip = tripsCache.find(t => t.id === $(this).data('id'));
        if (trip) {
            applySavedRoute(trip);
            closeAllPanels();
            showNotification('Trip loaded. The fare was recalculated with current rates.', 'info');
        }
    });

    $('#trips-export-btn').on('click', function (e) {
        e.stopPropagation();
        if (!tripsCache.length) {
            showNotification('No trips to export yet.', 'warning');
            return;
        }
        const data = { exportedAt: new Date().toISOString(), count: tripsCache.length, trips: tripsCache };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'para-trips.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showNotification('Trip history exported as para-trips.json.', 'success');
    });

    $('#trips-clear-btn').on('click', async function (e) {
        e.stopPropagation();
        if (!tripsCache.length) return;
        const sure = await confirmDialog({
            title: 'Clear trip history?',
            message: 'All of your saved trips will be removed.',
            confirmText: 'Clear All',
            danger: true
        });
        if (!sure) return;
        try {
            await API.post('trips/clear.php');
            tripsCache = [];
            renderTripsList();
            showNotification('Trip history cleared.', 'info');
        } catch (err) {
            showNotification(API.describe(err), 'error');
        }
    });
}

// Loads the recent trips of the signed-in user.
async function loadTrips() {
    if (!$('#trips-list').length) return;
    if (!Auth.isLoggedIn()) { tripsCache = []; renderTripsList(); return; }
    skeletonRows($('#trips-list'), 3);
    try {
        const res = await API.get('trips/list.php');
        tripsCache = res.trips;
        renderTripsList();
        revealBlocks($('#trips-list'));
    } catch (err) {
        $('#trips-list').html('<div class="lm-empty">Could not load your trips.</div>');
        showNotification(API.describe(err), 'error');
    }
}

// Fills the Recent Trips list.
function renderTripsList() {
    const $list = $('#trips-list');
    if (!$list.length) return;
    if (!Auth.isLoggedIn()) {
        $list.html('<div class="lm-empty">Please <a href="auth.html">log in</a> to see your recent trips.</div>');
        return;
    }
    if (!tripsCache.length) {
        $list.html('<div class="lm-empty">No recent trips yet.<br>Calculate a fare while logged in to build your history.</div>');
        return;
    }
    $list.empty();
    tripsCache.forEach(t => {
        const detail = t.transportLabel + ' · ' + t.passengerLabel + ' · ₱' + t.totalFare.toFixed(2)
            + ' · ' + t.durationMin + ' min · ' + String(t.createdAt).slice(0, 10);
        $('<div class="landmark-list-item">').attr('data-id', t.id).append(
            '<i data-lucide="history" class="lm-icon" aria-hidden="true"></i>',
            $('<div class="lm-info">').append(
                $('<h5>').text(firstName(t.originName) + ' → ' + firstName(t.destName)),
                $('<span>').text(detail)
            ),
            $('<button type="button" class="item-del" title="Remove" aria-label="Remove trip">').text('×')
        ).appendTo($list);
    });
}

// FAVORITE ROUTES (api/favorites/*.php)
function setupFavorites() {
    $('#fav-btn').on('click', () => {
        if (!Auth.isLoggedIn()) {
            showNotification('Log in to save favorite routes.', 'warning');
            return;
        }
        const route = getCurrentRoute();
        if (!route) return;
        $('#fav-label').val((route.originName + ' → ' + route.destName).slice(0, 100));
        $('#fav-label-error').text('');
        openModal('add-favorite-modal');
        $('#fav-label').trigger('focus').trigger('select');
    });

    $('#fav-save-btn').on('click', async function () {
        const label = $('#fav-label').val().trim();
        if (!label) { $('#fav-label-error').text('Label is required.'); return; }
        const route = getCurrentRoute();
        if (!route) { closeModal('add-favorite-modal'); return; }
        const $btn = $(this).prop('disabled', true);
        try {
            await API.post('favorites/add.php', Object.assign({ label }, route));
            closeModal('add-favorite-modal');
            showNotification('Added to your favorites!', 'success');
            loadFavorites();
        } catch (err) {
            $('#fav-label-error').text(API.describe(err));
        } finally {
            $btn.prop('disabled', false);
        }
    });

    $('#fav-label').on('keydown', e => { if (e.key === 'Enter') $('#fav-save-btn').trigger('click'); });

    $('#favorites-list').on('click', '.item-del', async function (e) {
        e.stopPropagation();
        const id = $(this).closest('.landmark-list-item').data('id');
        try {
            await API.post('favorites/delete.php', { id });
            favoritesCache = favoritesCache.filter(f => f.id !== id);
            renderFavoritesList();
            showNotification('Favorite removed.', 'info');
        } catch (err) {
            showNotification(API.describe(err), 'error');
        }
    });

    $('#favorites-list').on('click', '.landmark-list-item', function (e) {
        e.stopPropagation();
        const fav = favoritesCache.find(f => f.id === $(this).data('id'));
        if (fav) {
            applySavedRoute(fav);
            closeAllPanels();
        }
    });
}

// Loads the favorite routes of the signed-in user.
async function loadFavorites() {
    if (!$('#favorites-list').length) return;
    if (!Auth.isLoggedIn()) { favoritesCache = []; renderFavoritesList(); return; }
    skeletonRows($('#favorites-list'), 3);
    try {
        const res = await API.get('favorites/list.php');
        favoritesCache = res.favorites;
        renderFavoritesList();
        revealBlocks($('#favorites-list'));
    } catch (err) {
        $('#favorites-list').html('<div class="lm-empty">Could not load your favorites.</div>');
        showNotification(API.describe(err), 'error');
    }
}

// Fills the Favorites list.
function renderFavoritesList() {
    const $list = $('#favorites-list');
    if (!$list.length) return;
    if (!Auth.isLoggedIn()) {
        $list.html('<div class="lm-empty">Please <a href="auth.html">log in</a> to see your favorite routes.</div>');
        return;
    }
    if (!favoritesCache.length) {
        $list.html('<div class="lm-empty">No favorites yet.<br>Calculate a fare, then press the star.</div>');
        return;
    }
    $list.empty();
    favoritesCache.forEach(f => {
        $('<div class="landmark-list-item">').attr('data-id', f.id).append(
            '<i data-lucide="star" class="lm-icon" aria-hidden="true"></i>',
            $('<div class="lm-info">').append(
                $('<h5>').text(f.label),
                $('<span>').text(firstName(f.originName) + ' → ' + firstName(f.destName) + ' · ' + f.transportLabel)
            ),
            $('<button type="button" class="item-del" title="Remove" aria-label="Remove favorite">').text('×')
        ).appendTo($list);
    });
}

// PAGE START
document.addEventListener('DOMContentLoaded', () => {
    injectUiStyles();
    setupProfileMenus();
    showQueuedNotification();
    applyDarkMode();
    setupDarkToggle();
    setupScrollAnimations();
    setupBackToTop();
    setupModalOverlayClose();
    setupEscKey();

    const isCalcPage = !!document.getElementById('origin-input');

    if (isCalcPage) {
        setupCalcListeners();
        initMap();
    }

    Auth.ready().then(async () => {
        updateNavAuth();

        if (!isCalcPage) return;

        await loadFareOptions();

        renderSavedLandmarks();
        renderLandmarksList();
        renderTripsList();
        renderFavoritesList();

        try {
            const pending = sessionStorage.getItem('para_pending_route');

            if (!pending) return;

            sessionStorage.removeItem('para_pending_route');

            const route = JSON.parse(pending);

            if (route && route.originName && route.destName) {
                applySavedRoute(route);
            }
        } catch (err) {
            sessionStorage.removeItem('para_pending_route');
            showNotification(
                'Could not restore the selected route.',
                'warning'
            );
        }
    });
});

// CONFIRM DIALOG: Para's own Yes / No dialog in place of the browser's plain confirm box.
// Resolves to true (confirmed) or false (cancelled, Esc or a click outside).
function confirmDialog({ title = 'Are you sure?', message = '', confirmText = 'Confirm', cancelText = 'Cancel', danger = false } = {}) {
    return new Promise(resolve => {
        const $overlay = $('<div class="pc-overlay" role="dialog" aria-modal="true">');
        const done = value => {
            $(document).off('keydown.paraconfirm');
            resolve(value);
            popOut($overlay.find('.pc-modal')[0], () => $overlay.remove());
        };
        const $confirm = $('<button type="button" class="pc-btn">')
            .addClass(danger ? 'pc-danger' : 'pc-primary').text(confirmText).on('click', () => done(true));
        const $cancel = $('<button type="button" class="pc-btn pc-outline">').text(cancelText).on('click', () => done(false));
        $('<div class="pc-modal">').append(
            $('<h2>').text(title),
            $('<p>').text(message),
            $('<div class="pc-actions">').append($cancel, $confirm)
        ).appendTo($overlay);
        $overlay.on('click', e => { if (e.target === $overlay[0]) done(false); });
        $(document).on('keydown.paraconfirm', e => { if (e.key === 'Escape') done(false); });
        $overlay.appendTo('body');
        popIn($overlay.find('.pc-modal')[0]);
        $confirm.trigger('focus');
    });
}

// PROFILE MENU (the round icon in the navbar: guest or logged-in user)
function buildProfileMenu(user) {
    const $wrap = $('<div class="profile-wrap">');
    const $btn = $('<button type="button" class="profile-btn" aria-label="Profile" aria-expanded="false">');
    if (user) {
        $btn.append(user.profilePicture
            ? $('<img>').attr({ src: profilePictureUrl(user.profilePicture), alt: '' })
            : $('<span>').text(user.name.trim().charAt(0).toUpperCase() || '?'));
    }
    else $btn.append('<i data-lucide="user" aria-hidden="true"></i>');
    const $menu = $('<div class="profile-menu" role="dialog" aria-label="Profile">');
    $wrap.append($btn, $menu);
    $btn.on('click', e => {
        e.stopPropagation();
        const willOpen = !$menu.hasClass('open');
        closeProfileMenus();
        if (willOpen) {
            $menu.addClass('open');
            $btn.attr('aria-expanded', 'true');
            fillProfileMenu($menu);
        }

    });
    return $wrap[0];
}

// Full address of a profile picture from any page.
function profilePictureUrl(path) {
    return (window.location.pathname.indexOf('/client/') !== -1 ? '../' : '') + path;
}

// Closes every open profile menu.
function closeProfileMenus() {
    $('.profile-menu').removeClass('open');
    $('.profile-btn').attr('aria-expanded', 'false');
}

// Clicking anywhere else closes the profile menu.
function setupProfileMenus() {
    $(document).on('click', e => {
        if (!$(e.target).closest('.profile-wrap').length) closeProfileMenus();
    });
}

// Dialog listing the saved landmarks, favorites or trips, with remove / use buttons.
function openSavedModal(tab) {
    const titles = { landmarks: 'Your landmarks', favourites: 'Your favourite routes', trips: 'Your recent trips' };
    const endpoints = { landmarks: 'landmarks/list.php', favourites: 'favorites/list.php', trips: 'trips/list.php' };
    const deleteEndpoints = { landmarks: 'landmarks/delete.php', favourites: 'favorites/delete.php', trips: 'trips/delete.php' };
    const $overlay = $('<div class="pc-overlay saved-modal-overlay">');
    const $modal = $('<div class="pc-modal saved-modal" role="dialog" aria-modal="true">').append(
        $('<span class="modal-kicker">Saved information</span>'),
        $('<h2>').text(titles[tab]),
        $('<div class="saved-modal-list" aria-live="polite">').append($('<p class="pm-sub">').text('Loading...'))
    );
    const close = () => popOut($modal[0], () => $overlay.remove());
    $modal.prepend($('<button type="button" class="saved-modal-close" aria-label="Close">').text('×').on('click', close));
    $overlay.append($modal).on('click', e => { if (e.target === $overlay[0]) close(); }).appendTo('body');
    popIn($modal[0]);
    skeletonRows($modal.find('.saved-modal-list'), 3);

    API.get(endpoints[tab]).then(res => {
        const items = res.items || res.trips || res.favorites || res.landmarks || [];
        const $list = $modal.find('.saved-modal-list').empty();
        if (!items.length) {
            $list.append($('<p class="pm-sub">').text('Nothing saved here yet.'));
            return;
        }
        items.forEach(item => {
            const title = item.label || item.name ||
                (item.originName && item.originName + ' → ' + item.destName) || 'Saved item';
            const detail = tab === 'trips'
                ? [item.transportLabel, item.passengerLabel, item.distanceKm ? Number(item.distanceKm).toFixed(1) + ' km' : ''].filter(Boolean).join(' · ')
                : tab === 'landmarks'
                    ? (item.isPublic ? 'Public landmark · ' : 'Personal landmark · ') + (item.category || 'other').replace(/^./, c => c.toUpperCase())
                    : [item.transportLabel, item.passengerLabel].filter(Boolean).join(' · ');
            const $row = $('<div class="saved-modal-item">').append(
                $('<div>').append($('<strong>').text(title), $('<span>').text(detail || 'No additional details'))
            );
            const $actions = $('<div class="saved-modal-actions">');
            if (tab === 'trips') {
                $('<button type="button" class="small-button outline-small">').text('Use Route').on('click', () => {
                    sessionStorage.setItem('para_pending_route', JSON.stringify(item));
                    window.location.href = 'calculate.html';
                }).appendTo($actions);
            }
            if (tab === 'landmarks' && item.isPublic) {
                $('<span class="public-label">').text('Admin managed').appendTo($actions);
            } else {
                $('<button type="button" class="small-button danger-small">').text('Remove').on('click', async () => {
                    const confirmed = await confirmDialog({
                        title: 'Remove saved item?',
                        message: 'This saved item will be removed from your account.',
                        confirmText: 'Remove',
                        danger: true
                    });
                    if (!confirmed) return;
                    try {
                        await API.post(deleteEndpoints[tab], { id: item.id });
                        $row.remove();
                        showNotification('Saved item removed.', 'success');
                    } catch (err) {
                        showNotification(API.describe(err), 'error');
                    }
                }).appendTo($actions);
            }
            $row.append($actions).appendTo($list);
        });
        revealBlocks($list);
    }).catch(err => {
        $modal.find('.saved-modal-list').empty().append($('<p class="pm-sub">').text(API.describe(err)));
    });
}


// Fills the profile menu: who is signed in, settings, saved items and Log Out.
async function fillProfileMenu($menu) {
    const user = Auth.getCurrentUser();
    $menu.empty();

    if (!user) {
        $menu.append(
            $('<div class="pm-name">').text('Welcome to Para'),
            $('<p class="pm-sub">').text('You are browsing as a guest. Create an account to save trips, favorites and landmarks.'),
            $('<a class="pm-btn" href="auth.html#signup">').text('Sign Up'),
            $('<a class="pm-btn pm-outline" href="auth.html#login">').text('Log In')
        );
        return;
    }

    const isAdmin = user.role === 'admin';
    const currentPage = window.location.pathname.split('/').pop();
    const isAdminPage = /^admin(?:-[^/]+)?\.php$/i.test(currentPage);
    const isAdminSettings = isAdmin && currentPage === 'account-settings.html';

    const $identity = $('<div class="pm-identity">').append(
        user.profilePicture
            ? $('<div class="pm-avatar"><img alt=""></div>').find('img').attr('src', profilePictureUrl(user.profilePicture)).end()
            : $('<div class="pm-avatar">').text(user.name.trim().charAt(0).toUpperCase() || '?'),
        $('<div class="pm-identity-copy">').append(
            $('<div class="pm-name">').text(user.name),
            $('<div class="pm-email">').text(user.email)
        )
    );

    $menu.append($identity);

    $menu.append($('<span class="pm-role">').text(user.role === 'admin' ? 'Administrator' : 'Passenger'));

    if (isAdmin && !isAdminPage) {
        $menu.append(
            $('<a class="pm-btn pm-outline" href="admin.php">').text('Admin Panel')
        );
    }

    $menu.append(
        $('<a class="pm-btn pm-primary">').attr('href', isAdmin ? 'admin-settings.php' : 'account-settings.html')
            .append('<i data-lucide="settings" aria-hidden="true"></i>', $('<span>').text('Account Settings'), '<i data-lucide="chevron-right" class="pm-chevron" aria-hidden="true"></i>')
            .on('click', closeProfileMenus)
    );
    if (!isAdmin && !isAdminPage && !isAdminSettings) {
        [
            ['Landmarks', 'landmarks', 'map-pin'],
            ['Favourites', 'favourites', 'heart'],
            ['Recent Trips', 'trips', 'history']
        ].forEach(([label, tab, icon]) => $menu.append(
            $('<button type="button" class="pm-btn pm-outline pm-action">')
                .attr('data-saved-tab', tab)
                .append($('<i>').attr({ 'data-lucide': icon, 'aria-hidden': 'true' }), $('<span>').text(label), $('<i data-lucide="chevron-right" class="pm-chevron" aria-hidden="true">'))
                .on('click', function () { closeProfileMenus(); openSavedModal($(this).data('saved-tab')); })
        ));
    }

    $menu.append(
        $('<button type="button" class="pm-btn pm-logout">')
            .append('<i data-lucide="log-out" aria-hidden="true"></i>', $('<span>').text('Log Out'))
            .on('click', () => { closeProfileMenus(); doLogout(); })
    );
}

// Styles for the pieces above (injected here so every page gets them without extra CSS links)
function injectUiStyles() {
    if (document.getElementById('para-ui-styles')) return;
    const css = `
    .pc-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(3px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px}
    .pc-modal{background:var(--bg-card);color:var(--text);border-radius:var(--radius);padding:26px;width:100%;max-width:400px;box-shadow:var(--shadow-lg)}
    .pc-modal h2{font-size:1.1rem;font-weight:650;margin-bottom:10px}
    .pc-modal p{font-size:.92rem;color:var(--text-muted);line-height:1.5}
    .pc-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:22px}
    .pc-btn{padding:9px 22px;border-radius:24px;font-size:.9rem;font-weight:700;cursor:pointer;border:none;font-family:inherit}
    .pc-primary{background:var(--primary);color:var(--on-primary)}.pc-primary:hover{background:var(--primary-hover)}
    .pc-danger{background:var(--red);color:#fff}.pc-danger:hover{background:#c0392b}
    .pc-outline{background:transparent;color:var(--text);border:1.5px solid var(--border)}
    .pc-outline:hover{border-color:var(--primary);color:var(--primary)}
    .saved-modal{position:relative;max-width:560px}
    .saved-modal-close{position:absolute;top:14px;right:16px;border:0;background:transparent;color:var(--text-muted);font-size:1.6rem;line-height:1;cursor:pointer}
    .saved-modal-list{display:grid;gap:9px;max-height:min(55vh,430px);overflow:auto;margin-top:16px}
    .saved-modal-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid var(--border);border-radius:11px;background:var(--bg)}
    .saved-modal-item>div:first-child{min-width:0;display:grid;gap:3px}
    .saved-modal-item strong{overflow-wrap:anywhere;color:var(--text-main)}
    .saved-modal-item span{font-size:.8rem;color:var(--text-muted)}
    .saved-modal-actions{display:flex;align-items:center;justify-content:flex-end;gap:7px;flex-shrink:0}
    .saved-modal .small-button{white-space:nowrap}
    .pm-btn.pm-action{font-family:inherit}
    .profile-wrap{position:relative;margin-right:8px}
    #nav-auth-area{display:flex;align-items:center;gap:8px}
    .profile-btn{width:38px;height:38px;border-radius:50%;border:2px solid var(--primary);background:var(--bg-card);color:var(--primary);font-weight:650;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit}
    .profile-btn img,.pm-avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover}
    .profile-btn:hover{background:var(--green-light)}
    .profile-menu{visibility:hidden;opacity:0;transform:translateY(-6px) scale(.97);transform-origin:top right;transition:opacity .18s ease,transform .25s cubic-bezier(.22,1,.36,1),visibility 0s linear .25s;position:absolute;top:calc(100% + 14px);right:0;width:292px;background:var(--bg-card);color:var(--text);border:1px solid rgba(46,204,113,.2);border-radius:20px;box-shadow:0 16px 38px rgba(0,0,0,.16);padding:16px;z-index:1200}
    .profile-menu.open{visibility:visible;opacity:1;transform:none;transition:opacity .18s ease,transform .25s cubic-bezier(.22,1,.36,1)}
    .pm-btn.pm-logout{background:none;color:var(--red);border:1px solid var(--border)}
    .pm-btn.pm-logout:hover{background:rgba(231,76,60,.1);color:var(--red);box-shadow:none}
    .pm-identity{display:flex;align-items:center;gap:11px;padding:4px 3px 14px;border-bottom:1px solid var(--border)}
    .pm-avatar{display:grid;grid-template:100% / 100%;place-items:center;flex:none;width:42px;height:42px;border-radius:50%;background:var(--primary);color:var(--on-primary);font-size:1.1rem;font-weight:650;box-shadow:0 4px 10px rgba(46,204,113,.2);overflow:hidden}
    .pm-identity-copy{min-width:0}
    .pm-name{font-weight:650;font-size:1rem;line-height:1.2;overflow-wrap:anywhere}
    .pm-email{font-size:.78rem;color:var(--text-muted);word-break:break-all;margin-top:4px}
    .pm-role{display:inline-flex;margin-top:12px;padding:4px 9px;border-radius:999px;background:var(--green-light);color:var(--primary-hover);font-size:.7rem;font-weight:650;letter-spacing:.04em;text-transform:uppercase}
    .pm-sub{font-size:.84rem;color:var(--text-muted);line-height:1.45;margin:6px 0 12px}
    .pm-helper{padding-top:12px;margin:12px 0 0;border-top:1px solid var(--border);font-size:.78rem}
    .pm-badge{display:inline-block;background:var(--primary);color:var(--on-primary);border-radius:10px;padding:2px 10px;font-size:.72rem;font-weight:700;margin-bottom:8px}
    .pm-btn{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px;border-radius:10px;border:none;background:var(--primary);color:var(--on-primary);font-weight:700;font-size:.88rem;cursor:pointer;font-family:inherit;margin-top:10px;box-sizing:border-box;transition:background .2s ease,transform .2s ease,box-shadow .2s ease}
    .pm-btn i:first-child{width:17px;text-align:center}.pm-chevron{margin-left:auto;font-size:1.1rem}
    .pm-btn:hover{background:var(--primary-hover);color:var(--on-primary);transform:translateY(-1px);box-shadow:0 5px 12px rgba(46,204,113,.2)}
    .pm-outline{background:transparent;color:var(--primary);border:1.5px solid var(--primary)}
    .pm-outline:hover{background:var(--green-light);color:var(--primary-hover)}
    .pm-danger{background:var(--red)}.pm-danger:hover{background:#c0392b;box-shadow:0 5px 12px rgba(231,76,60,.2)}
    .access-banner{display:none;align-items:flex-start;gap:8px;margin-top:12px;padding:10px 12px;border-radius:12px;font-size:.84rem;font-weight:700;line-height:1.4}.access-banner .lucide{flex:none;width:16px;height:16px;margin-top:1px}
    .access-banner.far{background:var(--bg-soft);color:var(--text-main);border:1px solid var(--border)}
    .access-banner.walk{background:#e8f4fd;color:#1a5f8a;border:1px solid #b6dcf3}
    .access-banner.special_trip{background:#fff3e0;color:#9a5b00;border:1px solid #ffd699}
    body.dark .access-banner.walk{background:#12303f;color:#9bd0ee;border-color:#1f4d66}
    body.dark .access-banner.special_trip{background:#3b2a10;color:#ffcf85;border-color:#6b4a1a}
    .public-badge{display:inline-block;background:#3498db;color:#fff;border-radius:10px;padding:2px 10px;font-size:.72rem;font-weight:700;margin:-10px 0 12px}
    .pc-field{margin-top:12px}
    .pc-field label{display:block;font-size:.82rem;font-weight:600;color:var(--text-muted);margin-bottom:5px}
    .pc-input{width:100%;padding:10px 12px;background:var(--bg-input);border:1.5px solid var(--border);border-radius:10px;color:var(--text);font-family:inherit;font-size:.9rem;box-sizing:border-box}
    .pc-input:focus{outline:none;border-color:var(--primary)}
    .pc-error{color:var(--red);font-size:.78rem;margin:4px 0 0;min-height:0}
    @media (max-width:768px){.profile-menu{position:fixed;top:84px;right:12px;left:12px;width:auto}}
    `;
    $('<style id="para-ui-styles">').text(css).appendTo('head');
}
