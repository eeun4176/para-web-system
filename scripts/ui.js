// UI ENHANCEMENTS (jQuery). Loaded on every page after app.js.
// Each part only runs if its elements exist on the current page:
//   1. Icons           - turns <i data-lucide="name"> into Lucide SVG icons (also ones added later)
//   2. Hero map        - pins drop, the route draws, the jeep drives it, on a loop (home page)
//   3. Features line   - a winding line that draws itself as you scroll (home page)
//   4. Calculator chips - big tap-friendly buttons for vehicle and passenger type (calculate page)
//   5. Skeletons       - grey copies of the layout while data loads, then blocks appear one by one
//   6. Toasts          - bottom-right messages with a timer line
//   7. Dialogs         - every dialog grows out of the button that opened it
//   8. Segments        - a highlight slides to the selected button in Trip/Saved, filters, settings tabs
//   9. Mobile menu     - the hamburger turns into an X and opens the menu (full screen on passenger pages)

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- 1. ICONS ----------
// Any script can add <i data-lucide="heart"></i>; this turns it into an SVG on the next frame.
let iconsQueued = false;

// Turns every <i data-lucide="..."> into its SVG icon.
function renderIcons() {
    iconsQueued = false;
    if (window.lucide && document.querySelector('i[data-lucide]')) {
        lucide.createIcons();
    }
}

// Renders new icons on the next frame (many changes at once = one render).
function queueIconRender() {
    if (iconsQueued) return;
    iconsQueued = true;
    requestAnimationFrame(renderIcons);
}

// ---------- 2. HERO ROUTE PREVIEW (index.html) ----------
// An 8-second loop: pins drop (0.3-1s), the route draws (1.1-2.5s), the jeep drives it (2.5-6.7s)
// while the ETA counts down, then everything resets.
function playHeroMap() {
    const frame = document.getElementById('hero-map');
    if (!frame) return;
    const mask = frame.querySelector('.rf-mask');
    const car = frame.querySelector('.rf-car');
    const eta = frame.querySelector('.rf-et');
    const pins = frame.querySelectorAll('.rf-pin');
    const length = mask.getTotalLength();
    mask.style.strokeDasharray = length;

    if (prefersReducedMotion) {                       // show the finished picture, no movement
        pins.forEach(p => p.classList.add('on'));
        mask.style.strokeDashoffset = 0;
        return;
    }

    const LOOP = 8000;
    const pinTimes = [300, 650, 1000];
    const ease = x => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
    const clamp = x => Math.max(0, Math.min(1, x));
    const start = performance.now() - 3400;           // start mid-loop so the first view isn't empty

    // One animation frame of the hero map loop.
    function frameStep(now) {
        const t = (now - start) % LOOP;
        pins.forEach((p, i) => p.classList.toggle('on', t >= pinTimes[i] && t < 7500));

        const drawn = t < 7500 ? ease(clamp((t - 1100) / 1400)) : 0;
        mask.style.strokeDashoffset = length * (1 - drawn);

        const progress = clamp((t - 2500) / 4200);
        const driving = t >= 2500 && t < 7300;
        car.style.opacity = driving ? 1 : 0;
        if (driving) {
            const pt = mask.getPointAtLength(length * ease(progress));
            car.setAttribute('transform', 'translate(' + pt.x.toFixed(2) + ' ' + pt.y.toFixed(2) + ')');
            eta.textContent = progress >= 1 ? 'Arrived' : 'ETA ' + Math.ceil(24 * (1 - progress)) + ' min';
        } else if (t < 2500) {
            eta.textContent = 'ETA 24 min';
        }
        requestAnimationFrame(frameStep);
    }
    requestAnimationFrame(frameStep);
}

// ---------- 3. FEATURES LINE THAT FOLLOWS YOUR SCROLL (index.html) ----------
// The line is built through the real positions of the dots, so it always passes them,
// and it is drawn only as far as you have scrolled. A round tip marks where it ends,
// and each dot (and its text) lights up once the line reaches it.
const featureLine = { ink: null, tip: null, length: 0, samples: [] };

// Builds the winding features line through the dots (and again after a resize).
function buildFeatureLine() {
    const track = document.getElementById('features-track');
    const svg = document.getElementById('features-line');
    if (!track || !svg) return;

    const box = track.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);

    // Points the line passes: above the first dot, every dot, then below the last dot
    const dots = [...track.querySelectorAll('.feature-node')].map(dot => {
        const r = dot.getBoundingClientRect();
        return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
    });
    const points = [{ x: dots[0].x, y: 0 }, ...dots, { x: dots[dots.length - 1].x, y: box.height }];

    // Smooth S-curves between the points (the dots alternate left/right, so the line winds)
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const midY = (a.y + b.y) / 2;
        d += ` C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
    }

    svg.querySelector('.fl-bg').setAttribute('d', d);
    const ink = svg.querySelector('.fl-ink');
    ink.setAttribute('d', d);
    featureLine.ink = ink;
    featureLine.tip = svg.querySelector('.fl-tip');
    featureLine.length = ink.getTotalLength();

    // Remember where the line is (height) at 150 spots along it, to find "how much to draw" quickly
    featureLine.samples = [];
    for (let i = 0; i <= 150; i++) {
        const at = featureLine.length * i / 150;
        featureLine.samples.push({ at: at, y: ink.getPointAtLength(at).y });
    }

    ink.style.strokeDasharray = featureLine.length;
    updateFeatureLine();
}

// Draws the features line as far as the page is scrolled and lights up the dots it reached.
function updateFeatureLine() {
    const line = featureLine;
    if (!line.ink) return;

    const track = document.getElementById('features-track');
    const trackTop = track.getBoundingClientRect().top;
    // The tip follows a point 60% down the screen (or the whole line, with reduced motion)
    const tipY = prefersReducedMotion ? Infinity : window.innerHeight * 0.6 - trackTop;

    const sample = line.samples.find(s => s.y >= tipY);
    const drawn = sample ? sample.at : line.length;
    line.ink.style.strokeDashoffset = Math.max(0, line.length - drawn);

    const pt = line.ink.getPointAtLength(drawn);
    line.tip.setAttribute('cx', pt.x);
    line.tip.setAttribute('cy', pt.y);

    $(track).find('.feature-item').each(function () {
        const dotY = this.querySelector('.feature-node').getBoundingClientRect().top - trackTop;
        $(this).toggleClass('is-reached', dotY <= tipY);
    });
}

// ---------- NAVBAR GLASS ----------
// The navbar is see-through at the top of the page and turns to frosted glass once you scroll.
function updateNavbarGlass() {
    $('#navbar').toggleClass('is-scrolled', window.scrollY > 8);
}

// ---------- 4. CALCULATOR CHIPS (calculate.html) ----------
// The <select> boxes stay (app.js reads them); they are hidden and these chips set their value.
const CHIP_ICONS = {
    bus_aircon: 'bus', bus_ordinary: 'bus-front', modern_jeepney: 'tram-front', traditional_jeepney: 'car-front',
    regular: 'user', student: 'graduation-cap', senior: 'person-standing', pwd: 'accessibility'
};

// Builds one chip per option of the hidden <select>.
function buildChips($select, $chips) {
    $chips.empty();
    $select.find('option').each(function () {
        if (!this.value) return;                            // skip the "Transportation" placeholder
        // "Student (20% off)" (Filipino: "20% bawas") -> label "Student" + tag "-20%".  "Bus (Aircon)" stays as it is.
        const text = typeof englishOf === 'function' ? englishOf(this) : $(this).text();   // English even if Filipino is shown
        const discount = text.match(/^(.*) \((\d+)% (?:off|bawas)\)$/);
        $('<button type="button" class="chip">')
            .attr({ 'data-value': this.value, 'aria-pressed': 'false' })
            .append(
                $('<i>').attr('data-lucide', CHIP_ICONS[this.value] || 'circle'),
                $('<span>').text(discount ? discount[1] : text),
                discount ? $('<em class="chip-tag">').text('-' + discount[2] + '%') : null
            )
            .appendTo($chips);
    });
    syncChips($select, $chips);
}

// Highlights the chip of the selected option.
function syncChips($select, $chips) {
    $chips.find('.chip').each(function () {
        const selected = $(this).data('value') === $select.val();
        $(this).toggleClass('is-selected', selected).attr('aria-pressed', String(selected));
    });
}

// Connects a <select> to its chips both ways.
function setupChips(selectId, chipsId) {
    const $select = $('#' + selectId);
    const $chips = $('#' + chipsId);
    if (!$select.length || !$chips.length) return;

    buildChips($select, $chips);

    // fare-engine.js refills the options from the database: rebuild the chips when that happens
    new MutationObserver(() => buildChips($select, $chips)).observe($select[0], { childList: true });

    // Clicking a chip picks that value; app.js listens for 'change' and recalculates the fare
    $chips.on('click', '.chip', function () {
        $select.val($(this).data('value')).trigger('change');
    });
    $select.on('change', () => syncChips($select, $chips));
}

// ---------- 5. SKELETONS (grey copies of the real layout, then the real blocks appear one by one) ----------
// skeletonRows($('#origin-dropdown'), 3) fills a list with 3 shimmering placeholder rows.
function skeletonRows($container, count) {
    $container.empty();
    for (let i = 0; i < count; i++) {
        $('<div class="skeleton-row">').append(
            $('<div class="skeleton skeleton-line">'),
            $('<div class="skeleton skeleton-line short">')
        ).appendTo($container);
    }
}

// skeletonTable($('#users-table tbody'), 8) shows 5 grey table rows with the same number of columns
function skeletonTable($tbody, columns, rows = 5) {
    $tbody.empty();
    for (let r = 0; r < rows; r++) {
        const $tr = $('<tr class="skeleton-tr">');
        for (let c = 0; c < columns; c++) {
            $('<td>').append($('<span class="skeleton skeleton-line">').css('width', (45 + ((r + c) * 17) % 45) + '%')).appendTo($tr);
        }
        $tbody.append($tr);
    }
}

// skeletonCards($('#stat-grid'), 6, 'stat-card') shows grey cards shaped like the real ones
function skeletonCards($box, count, cardClass) {
    $box.empty();
    for (let i = 0; i < count; i++) {
        $('<div class="is-skeleton">').addClass(cardClass).append(
            $('<span class="skeleton skeleton-line short">'),
            $('<span class="skeleton skeleton-block">')
        ).appendTo($box);
    }
}

// After the real content is in place: its blocks fade in one after another
function revealBlocks($box, selector) {
    $box.find(selector || '> *').each(function (i) {
        this.style.setProperty('--i', i);
        this.classList.add('block-in');
    });
}

// ---------- 6. TOASTS (bottom-right, with a timer line; hovering pauses it) ----------
const TOAST_LOOK = {
    success: { icon: 'check',          title: 'Done' },
    error:   { icon: 'x',              title: 'Something went wrong' },
    warning: { icon: 'triangle-alert', title: 'Heads up' },
    info:    { icon: 'info',           title: 'Good to know' }
};

// Shows a toast message in the bottom-right corner.
function showToast(type, message, title) {
    const look = TOAST_LOOK[type] || TOAST_LOOK.success;
    let $stack = $('#notification-container');
    if (!$stack.length) $stack = $('<div id="notification-container" role="status" aria-live="polite">').appendTo('body');
    $stack.children().slice(0, -3).remove();        // keep at most 4 on screen

    const $toast = $('<div class="toast">').addClass('toast-' + (TOAST_LOOK[type] ? type : 'success'))
        .attr('role', type === 'error' ? 'alert' : 'status');
    const dismiss = () => {
        if ($toast.hasClass('leaving')) return;
        $toast.addClass('leaving');
        setTimeout(() => $toast.remove(), 260);
    };
    $toast.append(
        $('<span class="toast-icon">').append($('<i>').attr('data-lucide', look.icon)),
        $('<div class="toast-body">').append($('<b>').text(title || look.title), $('<span>').text(message)),
        $('<button type="button" class="toast-close" aria-label="Dismiss">').append('<i data-lucide="x"></i>').on('click', dismiss),
        // The line shrinks over 4 s (CSS); when its animation ends the toast closes
        $('<i class="toast-timer">').on('animationend', dismiss)
    ).appendTo($stack);
}

// ---------- 7. DIALOGS THAT GROW OUT OF THEIR BUTTON ----------
// The last button the user pressed is remembered; a dialog opens from it (scale 0.12, slight overshoot)
// and closes back into it. popIn/popOut are used by app.js, admin.js and account-settings.js.
let lastPressed = null;
document.addEventListener('pointerdown', e => { lastPressed = e.target.closest('button, a, [role="button"]'); }, true);
document.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') lastPressed = document.activeElement; }, true);

// Distance from the centre of a dialog to the button that opened it.
function offsetFromButton(dialog, button) {
    if (!button || !button.isConnected || !button.getClientRects().length) return null;
    const b = button.getBoundingClientRect();
    const d = dialog.getBoundingClientRect();
    return { x: (b.left + b.width / 2) - (d.left + d.width / 2), y: (b.top + b.height / 2) - (d.top + d.height / 2) };
}

// Plays the dialog opening animation (it grows out of its button).
function popIn(dialog) {
    if (!dialog || !dialog.animate) return;
    dialog._openedBy = lastPressed;
    const from = offsetFromButton(dialog, lastPressed);
    if (prefersReducedMotion || !from) {
        dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 });
        return;
    }
    dialog.animate([
        { transform: `translate(${from.x}px, ${from.y}px) scale(0.12)`, opacity: 0 },
        { opacity: 1, offset: 0.25 },
        { transform: 'none', opacity: 1 }
    ], { duration: 420, easing: 'cubic-bezier(.34, 1.56, .64, 1)' });
}

// Plays the closing animation, then calls done() (which hides or removes the dialog)
function popOut(dialog, done) {
    const to = dialog && dialog.animate && !prefersReducedMotion ? offsetFromButton(dialog, dialog._openedBy) : null;
    if (!to) {
        if (dialog && dialog.animate) dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140 }).onfinish = done;
        else done();
        return;
    }
    dialog.animate([
        { transform: 'none', opacity: 1 },
        { opacity: 1, offset: 0.7 },
        { transform: `translate(${to.x}px, ${to.y}px) scale(0.12)`, opacity: 0 }
    ], { duration: 260, easing: 'cubic-bezier(.4, 0, 1, 1)' }).onfinish = done;
}

// ---------- 8. SEGMENTED CONTROLS (a highlight slides under the selected button) ----------
// Works with any group whose selected button has .is-active; the group's own script only switches that class.
function setupSegmentGlider(group) {
    const glider = document.createElement('span');
    glider.className = 'seg-glider';
    glider.setAttribute('aria-hidden', 'true');
    group.prepend(glider);

    const move = () => {
        const active = group.querySelector('.is-active');
        glider.style.opacity = active && active.offsetWidth ? 1 : 0;
        if (!active || !active.offsetWidth) return;
        glider.style.width = active.offsetWidth + 'px';
        glider.style.height = active.offsetHeight + 'px';
        glider.style.transform = 'translate(' + active.offsetLeft + 'px, ' + active.offsetTop + 'px)';
    };
    new MutationObserver(move).observe(group, { subtree: true, attributes: true, attributeFilter: ['class'] });
    const sizes = new ResizeObserver(move);   // runs when the group appears or a label changes length (e.g. Filipino)
    sizes.observe(group);
    group.querySelectorAll('button').forEach(b => sizes.observe(b));
    move();
    requestAnimationFrame(() => glider.classList.add('ready'));   // no slide on the first placement
}

// ---------- 9. MOBILE MENU ----------
// The same button opens and closes the menu (its three lines morph into an X, see global.css).
// Tapping a link, the empty background or pressing Esc closes it too.
function setupMobileMenu() {
    const $btn = $('#hamburger-btn');
    const $menu = $('#sidebar-overlay');
    if (!$btn.length || !$menu.length) return;
    const setOpen = open => {
        $menu.toggleClass('active', open);
        $btn.toggleClass('is-open', open).attr({ 'aria-expanded': String(open), 'aria-label': open ? 'Close menu' : 'Open menu' });
        $('body').toggleClass('menu-open', open);
    };
    $btn.on('click', () => setOpen(!$menu.hasClass('active')));
    $('#sidebar-close').on('click', () => setOpen(false));
    $menu.on('click', e => { if (e.target === e.currentTarget || $(e.target).closest('a').length) setOpen(false); });
    $(document).on('keydown', e => { if (e.key === 'Escape' && $menu.hasClass('active')) setOpen(false); });
}

// ---------- START ----------
$(function () {
    renderIcons();
    new MutationObserver(queueIconRender).observe(document.body, { childList: true, subtree: true });

    updateNavbarGlass();
    $(window).on('scroll', updateNavbarGlass);

    playHeroMap();

    // "Watch Demo" has no video yet: say so instead of jumping to the top of the page
    $('#watch-demo-btn[href="#"]').on('click', function (e) {
        e.preventDefault();
        showNotification('The demo video is coming soon.', 'info');
    });

    if ($('#features-line').length) {
        buildFeatureLine();
        $(window).on('scroll', updateFeatureLine);
        $(window).on('resize', buildFeatureLine);
        $(window).on('load', buildFeatureLine);   // images change the layout once they finish loading
    }

    setupChips('transport-select', 'transport-chips');
    setupChips('passenger-select', 'passenger-chips');

    document.querySelectorAll('.calc-tabs, .saved-switch, .filter-chips, .seg').forEach(setupSegmentGlider);
    setupMobileMenu();
});
