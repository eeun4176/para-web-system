// AUTH (talks to api/auth/*.php; the session lives on the server)
const Auth = {
    user: null,
    _ready: null,

    // Resolves once we know who (if anyone) is logged in
    ready() {
        if (!this._ready) {
            this._ready = API.session()
                .then(res => { this.user = res.user || null; rememberRole(this.user); return this.user; })
                .catch(err => { console.warn('[Auth] Could not load session:', err.message); this.user = null; return null; });
        }
        return this._ready;
    },

    getCurrentUser() { return this.user; },
    isLoggedIn() { return this.user !== null; },

    async login(email, password) {
        const res = await API.post('auth/login.php', { email, password });
        API.csrf = res.csrf;
        this.user = res.user;
        return res;
    },

    // Is this email registered to Para, and does it have a password / Google? (api/auth/start.php)
    checkEmail(email) {
        return API.post('auth/start.php', { email });
    },

    // Emails a 6-digit log-in code (api/auth/send_code.php)
    sendCode(email) {
        return API.post('auth/send_code.php', { email });
    },

    // Logs in with the emailed code; a new email gets its account here (api/auth/verify_code.php)
    async verifyCode(email, code) {
        const res = await API.post('auth/verify_code.php', { email, code });
        API.csrf = res.csrf;
        this.user = res.user;
        return res;
    },

    // Admin sign-in (admin-login.html): account key + password, checked by api/auth/admin_login.php
    async adminLogin(accountKey, password) {
        const res = await API.post('auth/admin_login.php', { accountKey, password });
        API.csrf = res.csrf;
        this.user = res.user;
        return res;
    },

    // "Continue with Google": send Google's token to PHP, which checks it and logs us in
    async loginWithGoogle(credential) {
        const res = await API.post('auth/google.php', { credential });
        API.csrf = res.csrf;
        this.user = res.user;
        return res;
    },

    async logout() {
        await API.post('auth/logout.php');
        this.user = null;
        rememberRole(null);
        await API.session(true).catch(() => {});   // fresh token for the new guest session
    }
};

// ADMIN / PASSENGER SEPARATION
// Admins only use the admin panel. Passengers only use the normal pages.
// (The server enforces this too: admin pages check the role, and passenger APIs reject admins.)
const PASSENGER_PAGES = ['', 'index.html', 'calculate.html', 'aboutus.html'];

// Signed-in passengers only need the calculator: Home and About are for guests.
const GUEST_PAGES = ['', 'index.html', 'aboutus.html'];

// Navbar greeting for a signed-in passenger, placed before the profile picture:
//   | MONDAY, NOV 2 2026        (date in Manila; uppercase by CSS)
//   | Good Morning, Ian!        (morning before 12, afternoon before 6 PM, evening after)
// The "|" divider separates it from the language and theme toggles. i18n.js translates both lines.
function buildNavGreeting(user) {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Manila' })
        .formatToParts(now);
    const part = type => (parts.find(p => p.type === type) || {}).value || '';
    const hour = Number(part('hour'));
    const timeOfDay = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
    const firstName = (user.name || '').trim().split(/\s+/)[0] || 'there';
    return [
        $('<span class="nav-divider" aria-hidden="true">'),
        $('<div class="nav-greeting">').append(
            $('<span class="nav-greeting-date">').text(`${part('weekday')}, ${part('month')} ${part('day')} ${part('year')}`),
            $('<span class="nav-greeting-hello">').text(`Good ${timeOfDay}, ${firstName}!`).attr('title', user.name || '')
        )
    ];
}

// Where a user goes after signing in: admins to the dashboard, passengers to the calculator.
function homePageFor(user) {
    if (!user) return 'index.html';
    return user.role === 'admin' ? 'admin.php' : 'calculate.html';
}

// early-theme.js reads this before the page draws, so a signed-in passenger never sees Home flash.
// It is only a hint: the session on the server decides (see the check below).
function rememberRole(user) {
    try {
        if (user) localStorage.setItem('para_role', user.role);
        else localStorage.removeItem('para_role');
    } catch (e) { /* storage blocked: the check below still redirects */ }
}

// Signed-in passengers only use the calculator, so the page links are hidden and the Para logo
// is the way home (it opens the calculator, e.g. from Account Settings)
// (html.is-member hides the links, see global.css; early-theme.js sets it before the page draws)
function applyMemberNav(user) {
    const member = !!user && user.role !== 'admin';
    document.documentElement.classList.toggle('is-member', member);
    if (!member) return;
    $('#navbar-logo').attr('alt', 'Para: back to the calculator').closest('a').attr({ href: 'calculate.html', title: 'Back to the calculator' });
}

// True on the passenger pages (Home, Calculate, About).
function isPassengerPage() {
    const page = window.location.pathname.split('/').pop();
    return PASSENGER_PAGES.includes(page);
}

// An admin who opens a passenger page is sent to the admin panel;
// a signed-in passenger who opens Home or About is sent to the calculator
Auth.ready().then(user => {
    if (user && user.role === 'admin' && isPassengerPage()) {
        window.location.replace('admin.php');
        return;
    }
    if (user && GUEST_PAGES.includes(window.location.pathname.split('/').pop())) {
        window.location.replace('calculate.html');
        return;
    }
    $(() => applyMemberNav(user));
});

// AUTH PAGE UI (auth.html): email first, then a code sent to the email or the password (like Spotify).
//   email  -> registered with a password: "choose" (code or password)
//          -> anything else (new email, Google-only account): the code is sent right away
//   code   -> logs in; a new email gets its account here (name = part before the @, changed in Account Settings)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTH_STEPS = ['email', 'choose', 'password', 'code'];
let authBusy = false;
let authEmail = '';          // the email the steps after the first one are about
let authInfo = null;         // what api/auth/start.php said about it
const emailChecks = {};      // email -> start.php answer (or its promise), so typing and Continue share one request
let resendTimer = null;

// Shows one step of the log-in page.
function showAuthStep(step, updateHistory = true) {
    if (!AUTH_STEPS.includes(step) || (step !== 'email' && !authEmail)) step = 'email';
    clearFieldErrors();
    AUTH_STEPS.forEach(s => $('#auth-' + s).toggleClass('hidden', s !== step));
    $('#auth-' + step).hide().fadeIn(220);   // soft fade when switching steps
    $('.chip-email').text(authEmail);
    if (updateHistory) history.pushState({ authStep: step, email: authEmail }, '', '#' + step);
    const focus = { email: '#auth-email-input', password: '#login-password', code: '#code-boxes input:first' }[step];
    if (focus) setTimeout(() => $(focus).trigger('focus'), 60);
}

// Removes the red error state and messages from every form field.
function clearFieldErrors() {
    $('.field-error').not('#code-error').remove();
    $('.auth-input-group, .code-boxes').removeClass('has-error');
    $('#code-error').prop('hidden', true).text('');
}

// Marks the fields the server or the checks below rejected, with their messages.
function showFieldErrors(errors, idMap) {
    Object.entries(errors || {}).forEach(([field, msg]) => {
        const id = idMap[field];
        if (!id) return;
        const $group = $('#' + id).closest('.auth-input-group');
        $group.addClass('has-error');
        $('<div class="field-error">').text(msg).insertAfter($group);   // .text() = safe
    });
}

// While waiting for the server the button shows its 'busy' label with a moving shine (auth.css)
function setAuthBusy(btnSelector, busy) {
    authBusy = busy;
    $(btnSelector).prop('disabled', busy).toggleClass('loading', busy);
}

// Success: the button turns green and shows its 'done' label
function setAuthDone(btnSelector) {
    $(btnSelector).removeClass('loading').addClass('ok');
}

// ---------- Step 1: email ----------
// The note under the email box: format problems, then whether the email is registered to Para.
function setEmailStatus(kind, text) {
    const icons = { error: 'circle-alert', ok: 'circle-check', new: 'sparkles', wait: 'loader-circle' };
    const $s = $('#email-status').prop('hidden', !kind).attr('class', 'email-status' + (kind ? ' is-' + kind : ''));
    $s.empty();
    if (kind) $s.append($('<i>').attr('data-lucide', icons[kind]), $('<span>').text(text));
    $('#auth-email-input').closest('.auth-input-group').toggleClass('has-error', kind === 'error');
}

// What's wrong with the typed email, or '' when it looks like a real address.
function emailProblem(email) {
    if (!email) return 'Email is required.';
    if (!email.includes('@')) return 'An email needs an @, like juan@gmail.com.';
    if (!EMAIL_RE.test(email)) return 'Enter a valid email address, like juan@gmail.com.';
    return '';
}

// Asks the server about an email once; later calls reuse the answer.
function checkEmail(email) {
    if (!emailChecks[email]) {
        emailChecks[email] = Auth.checkEmail(email).catch(err => { delete emailChecks[email]; throw err; });
    }
    return emailChecks[email];
}

// Shows the server's answer under the box.
function showEmailInfo(info) {
    if (info.registered) {
        setEmailStatus('ok', info.hasPassword || !info.hasGoogle
            ? 'This email is registered to Para.'
            : 'This email is registered to Para with Google.');
    } else {
        setEmailStatus('new', "New to Para? We'll create your account with this email.");
    }
}

// While typing: check the format, then (after a short pause) whether the email is registered.
let emailTypingTimer = null;
function onEmailTyping(final = false) {
    clearTimeout(emailTypingTimer);
    const email = $('#auth-email-input').val().trim().toLowerCase();
    if (!email) { setEmailStatus(null); return; }
    const problem = emailProblem(email);
    if (problem) {
        // Don't nag in the middle of typing: show format problems on a pause or when leaving the box
        if (final) setEmailStatus('error', problem);
        else { setEmailStatus(null); emailTypingTimer = setTimeout(() => onEmailTyping(true), 1200); }
        return;
    }
    emailTypingTimer = setTimeout(async () => {
        setEmailStatus('wait', 'Checking this email…');
        try {
            const info = await checkEmail(email);
            if ($('#auth-email-input').val().trim().toLowerCase() === email) showEmailInfo(info);
        } catch (err) {
            setEmailStatus(err.status === 403 ? 'error' : null, err.status === 403 ? err.message : '');
        }
    }, final ? 0 : 450);
}

// "Continue": check the email, then go to the right next step.
async function doEmailContinue() {
    if (authBusy) return;
    const email = $('#auth-email-input').val().trim().toLowerCase();
    const problem = emailProblem(email);
    if (problem) { setEmailStatus('error', problem); return; }

    setAuthBusy('#email-continue', true);
    try {
        authInfo = await checkEmail(email);
        authEmail = email;
        showEmailInfo(authInfo);
        setAuthBusy('#email-continue', false);
        if (authInfo.registered && authInfo.hasPassword) showAuthStep('choose');
        else await sendCodeAndShow();
    } catch (err) {
        setEmailStatus('error', err.errors && err.errors.email ? err.errors.email : API.describe(err));
        setAuthBusy('#email-continue', false);
    }
}

// ---------- Step 3b: the emailed code ----------
// Sends a code to authEmail and opens the code step (the code step's labels depend on new / registered).
async function sendCodeAndShow(btn = '#choose-code') {
    setAuthBusy(btn, true);
    try {
        const res = await Auth.sendCode(authEmail);
        setAuthBusy(btn, false);
        openCodeStep(res.resendIn);
        showNotification('We sent a 6-digit code to ' + authEmail + '.', 'success');
    } catch (err) {
        setAuthBusy(btn, false);
        if (err.status === 429 && err.resendIn) { openCodeStep(err.resendIn); return; }   // a code was just sent
        showNotification(API.describe(err), 'error');
    }
}

function openCodeStep(resendIn) {
    const isNew = authInfo && !authInfo.registered;
    $('#code-title').text(isNew ? 'Confirm Your Email' : 'Check Your Email');
    $('#code-submit-label').text(isNew ? 'Create Account' : 'Log In');
    $('#code-use-password').prop('hidden', !(authInfo && authInfo.hasPassword));
    $('#code-google-hint').prop('hidden', !(authInfo && authInfo.hasGoogle && !authInfo.hasPassword));
    $('#code-boxes input').val('');
    showAuthStep('code');
    startResendCountdown(resendIn || 60);
}

// "resend the code" stays disabled for a minute after each code.
function startResendCountdown(seconds) {
    clearInterval(resendTimer);
    const $btn = $('#code-resend');
    let left = seconds;
    const tick = () => {
        if (left <= 0) { clearInterval(resendTimer); $btn.prop('disabled', false).text('resend the code'); return; }
        $btn.prop('disabled', true).text('resend the code in ' + left + 's');
        left--;
    };
    tick();
    resendTimer = setInterval(tick, 1000);
}

// The 6 boxes act like one field: typing moves forward, Backspace moves back, pasting fills them all.
function setupCodeBoxes() {
    const $boxes = $('#code-boxes input');
    const fill = (from, digits) => {
        digits.split('').forEach((d, i) => { if ($boxes[from + i]) $boxes[from + i].value = d; });
        const next = Math.min(from + digits.length, $boxes.length - 1);
        $boxes[next].focus();
        if (codeValue().length === 6) doVerifyCode();   // all 6 in: submit by itself
    };
    $boxes.each(function (i) {
        $(this).on('input', function () {
            const digits = this.value.replace(/\D/g, '').slice(0, 6 - i);
            this.value = digits.charAt(0);
            $('#code-boxes').removeClass('has-error');
            if (digits) fill(i, digits);
        }).on('keydown', function (e) {
            if (e.key === 'Backspace' && !this.value && i > 0) { $boxes[i - 1].value = ''; $boxes[i - 1].focus(); e.preventDefault(); }
            if (e.key === 'ArrowLeft' && i > 0) $boxes[i - 1].focus();
            if (e.key === 'ArrowRight' && i < 5) $boxes[i + 1].focus();
        }).on('paste', function (e) {
            const digits = ((e.originalEvent.clipboardData || window.clipboardData).getData('text') || '').replace(/\D/g, '').slice(0, 6);
            if (!digits) return;
            e.preventDefault();
            fill(0, digits);
        }).on('focus', function () { this.select(); });
    });
}

function codeValue() {
    return $('#code-boxes input').map((i, el) => el.value).get().join('');
}

async function doVerifyCode() {
    if (authBusy) return;
    clearFieldErrors();
    const code = codeValue();
    if (!/^\d{6}$/.test(code)) {
        $('#code-boxes').addClass('has-error');
        $('#code-error').text('Enter the 6-digit code from your email.').prop('hidden', false);
        return;
    }
    setAuthBusy('#code-submit', true);
    try {
        const res = await Auth.verifyCode(authEmail, code);
        setAuthDone('#code-submit');
        queueNotification(res.created
            ? 'Welcome to Para! You can change your name in Account Settings.'
            : 'Welcome back, ' + res.user.name + '!', 'success');
        setTimeout(() => window.location.replace(homePageFor(res.user)), 600);
    } catch (err) {
        setAuthBusy('#code-submit', false);
        $('#code-boxes').addClass('has-error');
        $('#code-error').text(err.errors && err.errors.code ? err.errors.code : API.describe(err)).prop('hidden', false);
        $('#code-boxes input').val('');
        $('#code-boxes input:first').trigger('focus');
    }
}

// ---------- Step 3a: password ----------
async function doPasswordLogin() {
    if (authBusy) return;
    clearFieldErrors();
    const password = $('#login-password').val();
    if (!password) { showFieldErrors({ password: 'Password is required.' }, { password: 'login-password' }); return; }

    setAuthBusy('#password-submit', true);
    try {
        const res = await Auth.login(authEmail, password);
        setAuthDone('#password-submit');
        queueNotification('Welcome back, ' + res.user.name + '!', 'success');
        setTimeout(() => window.location.replace(homePageFor(res.user)), 600);
    } catch (err) {
        showFieldErrors({ password: err.status === 401 ? 'Incorrect password.' : API.describe(err) }, { password: 'login-password' });
        if (err.status !== 401) showNotification(API.describe(err), 'error');
        setAuthBusy('#password-submit', false);
    }
}

// ADMIN SIGN-IN PAGE (admin-login.html)
async function doAdminLogin() {
    if (authBusy) return;
    clearFieldErrors();
    const accountKey = $('#admin-key').val().trim();
    const password = $('#admin-password').val();
    const errors = {};
    if (!accountKey) errors.accountKey = 'Account key is required.';
    if (!password) errors.password = 'Password is required.';
    const fields = { accountKey: 'admin-key', password: 'admin-password' };
    if (Object.keys(errors).length) { showFieldErrors(errors, fields); return; }

    setAuthBusy('#admin-login-submit', true);
    try {
        await Auth.adminLogin(accountKey, password);
        setAuthDone('#admin-login-submit');
        queueNotification('Welcome, Administrator!', 'success');
        setTimeout(() => { window.location.replace('admin.php'); }, 700);
    } catch (err) {
        showFieldErrors(err.errors, fields);
        showNotification(API.describe(err), 'error');
        setAuthBusy('#admin-login-submit', false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('admin-login')) return;
    Auth.ready().then(user => {
        if (user && user.role === 'admin') window.location.replace('admin.php');
    });
    setupPwToggle('toggle-pw-admin', 'admin-password');
    $('#admin-login-submit').on('click', doAdminLogin);
    $('#admin-key, #admin-password').on('keydown', e => { if (e.key === 'Enter') doAdminLogin(); });
});

// GOOGLE SIGN-IN (Google Identity Services script is loaded at the bottom of auth.html)
// Public ID of Para's Google OAuth client (the same ID is in api/auth/google.php).
const GOOGLE_CLIENT_ID = '996359971314-0okl6c7g9t504jm39rla9ob94q2rslre.apps.googleusercontent.com';

// Google's script calls this function by name once it has loaded
window.onGoogleLibraryLoad = function () {
    google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onGoogleCredential });

    const isDark = document.documentElement.classList.contains('dark');
    // locale: follow Para's EN / FIL choice instead of the browser's language
    const buttonStyle = { theme: isDark ? 'filled_black' : 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 300,
                          locale: typeof paraLang !== 'undefined' && paraLang === 'fil' ? 'fil' : 'en' };
    ['google-login-btn'].forEach(id => {
        const box = document.getElementById(id);
        if (box) google.accounts.id.renderButton(box, buttonStyle);
    });
};

// Runs after the user picks a Google account; response.credential is Google's signed ID token
async function onGoogleCredential(response) {
    if (authBusy) return;
    authBusy = true;
    try {
        const res = await Auth.loginWithGoogle(response.credential);
        queueNotification('Welcome, ' + res.user.name + '!', 'success');
        window.location.replace(homePageFor(res.user));
    } catch (err) {
        showNotification(API.describe(err), 'error');
        authBusy = false;
    }
}

// Show / hide password. The button holds two icons; CSS shows the right one (auth.css: .is-showing)
function setupPwToggle(btnId, inputId) {
    $('#' + btnId).on('click', function () {
        const $input = $('#' + inputId);
        const show = $input.attr('type') === 'password';
        $input.attr('type', show ? 'text' : 'password');
        $(this).toggleClass('is-showing', show).attr('aria-label', show ? 'Hide password' : 'Show password');
    });
}

// AUTH PAGE SETUP (only runs on auth.html)
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('auth-email')) return;

    showAuthStep('email', false);   // links like auth.html#login or #signup all start at the email step
    history.replaceState({ authStep: 'email' }, '', window.location.pathname);
    Auth.ready().then(() => {
        if (Auth.isLoggedIn()) window.location.replace(homePageFor(Auth.user));
    });

    setupPwToggle('toggle-pw-login', 'login-password');
    setupCodeBoxes();

    $('#auth-email-input').on('input', () => onEmailTyping(false)).on('blur', () => onEmailTyping(true));
    $('#email-continue').on('click', doEmailContinue);
    $('#choose-code').on('click', () => sendCodeAndShow('#choose-code'));
    $('#choose-password').on('click', () => showAuthStep('password'));
    $('#password-submit').on('click', doPasswordLogin);
    $('#password-use-code').on('click', e => { e.preventDefault(); sendCodeAndShow('#password-submit'); });
    $('#code-submit').on('click', doVerifyCode);
    $('#code-resend').on('click', () => sendCodeAndShow('#code-submit'));
    $('#code-use-password a').on('click', e => { e.preventDefault(); showAuthStep('password'); });
    $('[data-auth-back]').on('click', () => history.back());

    // Enter submits the step on screen (not while a dialog is open)
    $(document).on('keydown', e => {
        if (e.key !== 'Enter' || $('.pc-overlay').length) return;
        if (!$('#auth-email').hasClass('hidden')) doEmailContinue();
        else if (!$('#auth-password').hasClass('hidden')) doPasswordLogin();
        else if (!$('#auth-code').hasClass('hidden')) doVerifyCode();
    });

    $('[data-legal]').on('click', function (e) {
        e.preventDefault();
        showLegalDialog($(this).data('legal'));
    });

    // The browser's Back button walks back through the steps
    window.addEventListener('popstate', event => {
        const state = event.state || {};
        if (state.email) authEmail = state.email;
        showAuthStep(state.authStep || 'email', false);
    });
});
// Shows the Terms of Service or Privacy Policy (from the <template id="legal-terms|legal-privacy"> in auth.html)
// in a dialog that grows out of the clicked link. Close with the button, Escape, or a click outside.
function showLegalDialog(kind) {
    const content = document.getElementById('legal-' + kind);
    if (!content) return;
    const $overlay = $('<div class="pc-overlay" role="dialog" aria-modal="true" aria-labelledby="legal-title">');
    const close = () => {
        $(document).off('keydown.paralegal');
        popOut($overlay.find('.pc-modal')[0], () => $overlay.remove());
    };
    const $close = $('<button type="button" class="pc-btn pc-primary">').text('Close').on('click', close);
    $('<div class="pc-modal legal-modal">').append(
        $('<div class="legal-body">').append(content.content.cloneNode(true)),
        $('<div class="pc-actions">').append($close)
    ).appendTo($overlay);
    $overlay.on('click', e => { if (e.target === $overlay[0]) close(); });
    $(document).on('keydown.paralegal', e => { if (e.key === 'Escape') close(); });
    $overlay.appendTo('body');
    popIn($overlay.find('.pc-modal')[0]);
    $close.trigger('focus');
}
