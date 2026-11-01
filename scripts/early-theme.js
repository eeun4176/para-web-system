// Applies dark mode before the page renders (prevents a flash of the light theme).
(function () {
    try {
        if (localStorage.getItem('para_dark') === 'true') {
            document.documentElement.classList.add('dark');
        }

        // Signed-in passengers skip Home and About (auth.js keeps this hint in sync with the session)
        var page = location.pathname.split('/').pop();
        if (localStorage.getItem('para_role') === 'user' && (page === '' || page === 'index.html' || page === 'aboutus.html')) {
            location.replace('calculate.html');
        }
    } catch (e) { /* storage blocked: ignore */ }
})();
