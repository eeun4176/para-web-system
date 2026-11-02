// FARE ENGINE (front end). The fare, distance and ETA are now computed by the server
// (api/calculate.php), so they can't be tampered with in the browser.

// Ask the server for the fare between two points. road = the road route drawn on the map
// ({ km, fromRoadM } from map-logic.js) or null; the server checks it before using it.
function fetchFare(origin, dest, transport, passenger, road) {
    const params = {
        olat: origin.lat, olng: origin.lng,
        dlat: dest.lat, dlng: dest.lng,
        transport: transport, passenger: passenger
    };
    if (road) {
        params.roadKm = road.km.toFixed(3);
        if (road.fromRoadM !== null) params.fromRoadM = Math.round(road.fromRoadM);
        if (road.startFromRoadM != null) params.startFromRoadM = Math.round(road.startFromRoadM);
    }
    return API.get('calculate.php', params).then(res => res.fare);
}

// Fill the two dropdowns from the database (api/fares.php), then apply the user's saved defaults.
// If it fails, the static <option>s already in the HTML keep working.
async function loadFareOptions() {
    try {
        const res = await API.get('fares.php');

        const $t = $('#transport-select');
        const $p = $('#passenger-select');

        if ($t.length) {
            const $first = $t.find('option').first();

            $t.empty().append($first);

            Object.entries(res.types).forEach(([code, t]) => {
                $t.append(
                    $('<option>')
                        .val(code)
                        .text(t.label)
                );
            });
        }

        if ($p.length) {
            const $first = $p.find('option').first();

            $p.empty().append($first);

            Object.entries(res.discounts).forEach(([code, d]) => {
                const pct = Math.round(d.rate * 100);

                $p.append(
                    $('<option>')
                        .val(code)
                        .text(
                            d.label +
                            (pct > 0 ? ' (' + pct + '% off)' : '')
                        )
                );
            });
        }

        // Apply saved preferences after the dropdown options are loaded.
        const user = await Auth.ready();

        if (user) {
            const profile = await API.get('auth/profile.php');
            const saved = profile.user;

            if (saved.defaultTransport && $t.find('option[value="' + saved.defaultTransport + '"]').length) {
                $t.val(saved.defaultTransport);
            }

            if (saved.defaultPassenger && $p.find('option[value="' + saved.defaultPassenger + '"]').length) {
                $p.val(saved.defaultPassenger);
            }

            // .val() fires no event: tell ui.js to highlight the matching chips (not 'change', which would
            // recalculate; refreshFareCalculation() below does that once)
            $t.add($p).trigger('sync');
        }

        refreshFareCalculation();

    } catch (err) {
        console.warn(
            '[FareEngine] Could not load fare options or preferences:',
            err.message
        );
    }
}
