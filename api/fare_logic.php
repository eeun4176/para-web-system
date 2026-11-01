<?php
// Shared fare + ETA computation. Requires helpers.php to be loaded first.

// Access notes. These numbers are the team's assumptions, not official LTFRB rules.
// "From the road" = how far the destination is from the nearest road a vehicle can drive on
// (the routing service reports it when it snaps the destination onto the road network).
const WALK_FROM_ROAD_M     = 150;   // farther than this from a road: walk the last part
const TRICYCLE_FROM_ROAD_M = 600;   // farther than this: ride a tricycle (special trip) for the last part
const LONG_TRIP_KM         = 8;     // longer trips may need a transfer to another jeepney/bus

function access_info(float $distKm, ?float $fromRoadM): array {
    if ($fromRoadM !== null && $fromRoadM > TRICYCLE_FROM_ROAD_M) {
        $m = (int) round($fromRoadM / 10) * 10;
        return [
            'access' => 'special_trip',
            'accessMessage' => "Jeepneys and buses can't reach your stop. It's about {$m} m from the nearest road, so ride a tricycle (special trip) for the last part.",
        ];
    }
    if ($fromRoadM !== null && $fromRoadM > WALK_FROM_ROAD_M) {
        $min = max(1, (int) round($fromRoadM / 1000 / 5 * 60));   // walking at about 5 km/h
        return [
            'access' => 'walk',
            'accessMessage' => "Your stop isn't on a road vehicles use. Get off at the nearest road and walk about {$min} min.",
        ];
    }
    if ($distKm > LONG_TRIP_KM) {
        return [
            'access' => 'far',
            'accessMessage' => 'Long trip: You may need to transfer to another jeepney or bus on the way.',
        ];
    }
    return ['access' => 'normal', 'accessMessage' => ''];
}

// Optional road data sent by the browser (from the route drawn on the map). Returns [roadKm, fromRoadM],
// each null when missing or not a sensible number. compute_fare() checks roadKm against the straight line.
function road_input(array $src): array {
    $num = fn($k, $max) => isset($src[$k]) && is_numeric($src[$k]) && $src[$k] >= 0 && $src[$k] <= $max ? (float) $src[$k] : null;
    return [$num('roadKm', 200), $num('fromRoadM', 5000)];
}

function haversine_km(float $lat1, float $lon1, float $lat2, float $lon2): float {
    $r = 6371;
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;
    return $r * 2 * atan2(sqrt($a), sqrt(1 - $a));
}

// Returns ['distanceKm', 'durationMin', 'total' (float), 'fare' (formatted for the UI)]
// $roadKm: length of the road route shown on the map (used when it is believable, else the straight line)
function compute_fare(float $olat, float $olng, float $dlat, float $dlng, string $transport, string $passenger,
                      ?float $roadKm = null, ?float $fromRoadM = null): array {
    $t = db()->prepare('SELECT label, base_fare, base_km, excess_per_km, avg_speed_kph FROM transport_types WHERE code = ? AND is_active = 1');
    $t->execute([$transport]);
    $tr = $t->fetch();
    $p = db()->prepare('SELECT label, discount_rate FROM passenger_types WHERE code = ? AND is_active = 1');
    $p->execute([$passenger]);
    $pa = $p->fetch();
    if (!$tr) fail(422, 'Invalid request.', ['transport' => 'Unknown or unavailable transport type.']);
    if (!$pa) fail(422, 'Invalid request.', ['passenger' => 'Unknown or unavailable passenger type.']);

    $straight = haversine_km($olat, $olng, $dlat, $dlng);
    if ($straight <= 0.3) {
        fail(422, 'Invalid route.', ['destination' => 'Origin and destination must be different locations.']);
    }

    // A road is never shorter than the straight line, and in SJDM rarely more than 3x longer.
    // Anything outside that range is ignored (so a tampered request can't change the fare much).
    $roadOk = $roadKm !== null && $roadKm >= $straight * 0.95 && $roadKm <= $straight * 3 + 1;
    $dist   = $roadOk ? $roadKm : $straight;

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
            'distanceSource' => $roadOk ? 'road' : 'straight',
        ] + access_info($dist, $fromRoadM),
    ];
}
