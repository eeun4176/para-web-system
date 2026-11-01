// Runs in <head> on every page, before anything is drawn:
// dark mode, the signed-in passenger redirect, and fresh pages after the browser's Back button.
(function () {
    try {
        // Dark mode (no flash of the light theme)
        if (localStorage.getItem('para_dark') === 'true') {
            document.documentElement.classList.add('dark');
        }

        // Signed-in passengers skip Home and About (auth.js keeps this hint in sync with the session)
        var page = location.pathname.split('/').pop();
        if (localStorage.getItem('para_role') === 'user') document.documentElement.classList.add('is-member');   // hides the page links
        if (localStorage.getItem('para_role') === 'user' && (page === '' || page === 'index.html' || page === 'aboutus.html')) {
            location.replace('calculate.html');
        }
    } catch (e) { /* storage blocked: ignore */ }

    // Back / Forward can show a page kept in memory from earlier (e.g. the dashboard from before logging out).
    // Reload it instead, so the server and auth.js check the current session again.
    window.addEventListener('pageshow', function (event) {
        if (event.persisted) location.reload();
    });
})();
