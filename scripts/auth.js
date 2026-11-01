// AUTH (talks to api/auth/*.php; the session lives on the server)
const Auth = {
    user: null,
    _ready: null,

    // Resolves once we know who (if anyone) is logged in
    ready() {
        if (!this._ready) {
            this._ready = API.session()
                .then(res => { this.user = res.user || null; return this.user; })
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

    async register(name, email, password) {
        const res = await API.post('auth/register.php', { name, email, password });
        API.csrf = res.csrf;
        this.user = res.user;
        return res;
    },

    async resetPassword(email, recoveryCode, newPassword) {
        return API.post('auth/reset_password.php', {
            email,
            recoveryCode,
            newPassword
        });
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
        await API.session(true).catch(() => {});   // fresh token for the new guest session
    }
};

// ADMIN / PASSENGER SEPARATION
// Admins only use the admin panel. Passengers only use the normal pages.
// (The server enforces this too: admin pages check the role, and passenger APIs reject admins.)
const PASSENGER_PAGES = ['', 'index.html', 'calculate.html', 'aboutus.html'];

function homePageFor(user) {
    return user && user.role === 'admin' ? 'admin.php' : 'index.html';
}

function isPassengerPage() {
    const page = window.location.pathname.split('/').pop();
    return PASSENGER_PAGES.includes(page);
}

// An admin who opens a passenger page is sent to the admin panel
Auth.ready().then(user => {
    if (user && user.role === 'admin' && isPassengerPage()) {
        window.location.replace('admin.php');
    }
});

// AUTH PAGE UI
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_FIELDS  = { email: 'login-email',  password: 'login-password' };
const SIGNUP_FIELDS = { name: 'signup-name', email: 'signup-email', password: 'signup-password' };
const FORGOT_FIELDS = {
    email: 'forgot-email',
    recoveryCode: 'forgot-recovery-code',
    newPassword: 'forgot-newpw',
    confirmPassword: 'forgot-confirmpw'
};
let authBusy = false;


function showAuthPage(page, updateHistory = true) {
    if (!['login', 'signup', 'forgot'].includes(page)) {
        page = 'login';
    }
    clearFieldErrors();
    ['login', 'signup', 'forgot'].forEach(p => {
        $('#auth-' + p).toggleClass('hidden', p !== page);
    });
    if (updateHistory) {
        history.pushState({ authPage: page }, '', '#' + page);
    }
}

function clearFieldErrors() {
    $('.field-error').remove();
    $('.auth-input-group').removeClass('has-error');
}

function showFieldErrors(errors, idMap) {
    Object.entries(errors || {}).forEach(([field, msg]) => {
        const id = idMap[field];
        if (!id) return;
        const $group = $('#' + id).closest('.auth-input-group');
        $group.addClass('has-error');
        $('<div class="field-error">').text(msg).insertAfter($group);   // .text() = safe
    });
}

function setAuthBusy(btnSelector, busy) {
    authBusy = busy;
    $(btnSelector).prop('disabled', busy);
}

async function doLogin() {
    if (authBusy) return;
    clearFieldErrors();
    const email = $('#login-email').val().trim();
    const password = $('#login-password').val();

    const errors = {};
    if (!email) errors.email = 'Email is required.';
    else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
    if (!password) errors.password = 'Password is required.';
    if (Object.keys(errors).length) { showFieldErrors(errors, LOGIN_FIELDS); return; }

    setAuthBusy('#login-submit', true);
    try {
        const res = await Auth.login(email, password);
        queueNotification('Welcome back, ' + res.user.name + '!', 'success');
        setTimeout(() => { window.location.href = homePageFor(res.user); }, 400);
    } catch (err) {
        showFieldErrors(err.errors, LOGIN_FIELDS);
        showNotification(API.describe(err), 'error');
        setAuthBusy('#login-submit', false);
    }
}

async function doSignup() {
    if (authBusy) return;
    clearFieldErrors();
    const name = $('#signup-name').val().trim();
    const email = $('#signup-email').val().trim();
    const password = $('#signup-password').val();
    const agree = $('#signup-agree').is(':checked');

    const errors = {};
    if (!name) errors.name = 'Name is required.';
    if (!email) errors.email = 'Email is required.';
    else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
    if (!password) errors.password = 'Password is required.';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (Object.keys(errors).length) { showFieldErrors(errors, SIGNUP_FIELDS); return; }
    if (!agree) { showNotification('Please agree to the Terms of Service.', 'warning'); return; }

    setAuthBusy('#signup-submit', true);
    try {
        const res = await Auth.register(name, email, password);
        $('#signup-recovery-code').text(res.recoveryCode);
        $('#signup-recovery').removeClass('hidden');
        $('#signup-submit, #signup-name, #signup-email, #signup-password, #signup-agree')
            .prop('disabled', true);
        showNotification('Account created. Save your recovery code before continuing.', 'warning');
    } catch (err) {
        if (err.status === 409) showFieldErrors({ email: err.message }, SIGNUP_FIELDS);
        else showFieldErrors(err.errors, SIGNUP_FIELDS);
        showNotification(API.describe(err), 'error');
        setAuthBusy('#signup-submit', false);
    }
}

async function doForgot() {
    if (authBusy) return;
    clearFieldErrors();

    const email = $('#forgot-email').val().trim();
    const recoveryCode = $('#forgot-recovery-code').val().trim();
    const newPassword = $('#forgot-newpw').val();
    const confirmPassword = $('#forgot-confirmpw').val();
    const errors = {};

    if (!email) errors.email = 'Email is required.';
    else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
    if (!recoveryCode) errors.recoveryCode = 'Recovery code is required.';
    if (newPassword.length < 8) {
        errors.newPassword = 'New password must be at least 8 characters.';
    }
    if (newPassword !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
    }
    if (Object.keys(errors).length) {
        showFieldErrors(errors, FORGOT_FIELDS);
        return;
    }

    setAuthBusy('#forgot-submit', true);
    try {
        await Auth.resetPassword(email, recoveryCode, newPassword);
        $('#forgot-email, #forgot-recovery-code, #forgot-newpw, #forgot-confirmpw').val('');
        setAuthBusy('#forgot-submit', false);
        showAuthPage('login');
        showNotification('Password reset successfully. You can now sign in.', 'success');
    } catch (err) {
        showFieldErrors(err.errors, FORGOT_FIELDS);
        showNotification(API.describe(err), 'error');
        setAuthBusy('#forgot-submit', false);
    }
}

// GOOGLE SIGN-IN (Google Identity Services script is loaded at the bottom of auth.html)
// Public ID of Para's Google OAuth client. Keep it the same as in api/auth/google.php.
const GOOGLE_CLIENT_ID = '996359971314-0okl6c7g9t504jm39rla9ob94q2rslre.apps.googleusercontent.com';

// Google's script calls this function by name once it has loaded
window.onGoogleLibraryLoad = function () {
    google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onGoogleCredential });

    const isDark = document.documentElement.classList.contains('dark');
    const buttonStyle = { theme: isDark ? 'filled_black' : 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 300 };
    ['google-login-btn', 'google-signup-btn'].forEach(id => {
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
        window.location.href = homePageFor(res.user);
    } catch (err) {
        showNotification(API.describe(err), 'error');
        authBusy = false;
    }
}

function setupPwToggle(btnId, inputId, iconId) {
    $('#' + btnId).on('click', function () {
        const $input = $('#' + inputId);
        const show = $input.attr('type') === 'password';
        $input.attr('type', show ? 'text' : 'password');
        $('#' + iconId).attr('class', show ? 'fi fi-rr-eye' : 'fi fi-rr-eye-crossed');
    });
}

// AUTH PAGE SETUP (only runs on auth.html)
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('auth-login')) return;

   const initialPage = ['login', 'signup', 'forgot'].includes(
    window.location.hash.slice(1)
) ? window.location.hash.slice(1) : 'login';
showAuthPage(initialPage, false);
Auth.ready().then(() => {
    if (Auth.isLoggedIn()) {
        window.location.href = homePageFor(Auth.user);
    }
});

    setupPwToggle('toggle-pw-login', 'login-password', 'eye-login');
    setupPwToggle('toggle-pw-signup', 'signup-password', 'eye-signup');

    $(document).on('keydown', e => {
        if (e.key !== 'Enter') return;
        if (!$('#auth-login').hasClass('hidden')) doLogin();
        else if (!$('#auth-signup').hasClass('hidden')) doSignup();
        else if (!$('#auth-forgot').hasClass('hidden')) doForgot();
    });

    $('#login-submit').on('click', doLogin);
    $('#signup-submit').on('click', doSignup);
    $('#forgot-submit').on('click', doForgot);
    $('#signup-recovery-continue').on('click', () => {
        queueNotification('Welcome to Para, ' + Auth.getCurrentUser().name + '!', 'success');
        window.location.href = homePageFor(Auth.user);
    });

    const nav = (linkId, page) => $('#' + linkId).on('click', e => { e.preventDefault(); showAuthPage(page); });
    nav('go-forgot', 'forgot');
    nav('go-signup', 'signup');
    nav('go-login-from-signup', 'login');
    nav('go-login-from-forgot', 'login');
    nav('go-signup-from-forgot', 'signup');

    window.addEventListener('popstate', event => {
    const page = event.state?.authPage || 'login';
    showAuthPage(page, false);
    });

});
