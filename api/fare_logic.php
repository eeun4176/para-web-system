<?php
// Shared fare + ETA computation. Requires helpers.php to be loaded first.

// Access alert thresholds (assumptions chosen by the team, not official LTFRB rules)
const WALK_MAX_KM = 0.5;          // closer than this: suggest walking
const SPECIAL_TRIP_MIN_KM = 8;    // farther than this: a tricycle Special Trip may be needed

// Complete access_info()
function access_info(float $dist): array {
    if ($dist < WALK_MAX_KM) {
        $min = max(1, (int) round($dist / 5 * 60));

        return [
            'access' => 'walk',
            'accessMessage' => "Short distance! It's about a {$min}-minute walk, so you may not need a ride."
        ];
    }

    if ($dist > SPECIAL_TRIP_MIN_KM) {
        return [
            'access' => 'special_trip',
            'accessMessage' => 'Far Destination! You may need to transfer to another ride or take multiple routes to reach your destination.'
        ];
    }

    return [
        'access' => 'normal',
        'accessMessage' => ''
    ];
}

function haversine_km(float $lat1, float $lon1, float $lat2, float $lon2): float {
    $r = 6371;
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;
    return $r * 2 * atan2(sqrt($a), sqrt(1 - $a));
}

// Returns ['distanceKm', 'durationMin', 'total' (float), 'fare' (formatted for the UI)]
function compute_fare(float $olat, float $olng, float $dlat, float $dlng, string $transport, string $passenger): array {
    $t = db()->prepare('SELECT label, base_fare, base_km, excess_per_km, avg_speed_kph FROM transport_types WHERE code = ? AND is_active = 1');
    $t->execute([$transport]);
    $tr = $t->fetch();
    $p = db()->prepare('SELECT label, discount_rate FROM passenger_types WHERE code = ? AND is_active = 1');
    $p->execute([$passenger]);
    $pa = $p->fetch();
    if (!$tr) fail(422, 'Invalid request.', ['transport' => 'Unknown or unavailable transport type.']);
    if (!$pa) fail(422, 'Invalid request.', ['passenger' => 'Unknown or unavailable passenger type.']);

    $dist     = haversine_km($olat, $olng, $dlat, $dlng);
    
    if ($dist <= 0.3) {
    fail(422, 'Invalid route.', [
        'destination' => 'Origin and destination must be different locations.'
    ]);
}

    $excessKm = max(0, $dist - (float)$tr['base_km']);
    $excess   = $excessKm * (float)$tr['excess_per_km'];
    $subtotal = (float)$tr['base_fare'] + $excess;
    $discount = $subtotal * (float)$pa['discount_rate'];
    $total    = $subtotal - $discount;

    // ETA = distance / average speed (an estimate: ignores traffic and waiting time)
    $duration = max(1, (int) round($dist / (float)$tr['avg_speed_kph'] * 60));
    $arrival  = (new DateTime('now', new DateTimeZone('Asia/Manila')))
                    ->modify('+' . $duration . ' minutes')->format('g:i A');

    $f = fn($n) => number_format($n, 2, '.', '');

    return [
        'distanceKm'  => round($dist, 2),
        'durationMin' => $duration,
        'total'       => round($total, 2),
        'fare'        => [
            'distance'       => $f($dist),
            'transportLabel' => $tr['label'],
            'baseFare'       => $f((float)$tr['base_fare']),
            'excessFare'     => $f($excess),
            'passengerType'  => $pa['label'],
            'discountRate'   => (int) round((float)$pa['discount_rate'] * 100),
            'discountAmount' => $f($discount),
            'total'          => $f($total),
            'durationMin'    => $duration,
            'arrivalTime'    => $arrival,
            'farDestination' => $dist > SPECIAL_TRIP_MIN_KM,
        ] + access_info($dist),
    ];
}
