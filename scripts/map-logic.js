// MAP INITIALISATION
const SJDM_CENTER = [14.8183, 121.0520];
const SJDM_BOUNDS = L.latLngBounds(
  L.latLng(14.6800, 121.0100),
  L.latLng(14.8800, 121.1700)
);

var map                   = null;
var sjdmBoundary          = null;
var sjdmBoundaryData      = null;
var rodriguezBoundaryData = null;
var rodriguezBoundary     = null;
var originMarker          = null;
var destinationMarker     = null;
var routeLine             = null;
var landmarkMarkers       = {};
var routeRequestId        = 0;
var routeController       = null;

const CATEGORY_COLORS = {
  school:   '#3498db',
  hospital: '#e74c3c',
  terminal: '#27ae60',
  market:   '#e67e22',
  church:   '#9b59b6',
  park:     '#1abc9c',
  food:     '#f39c12',
  other:    '#7f8c8d'
};



function initMap() {
  if (map) return;

  map = L.map('map', {
    center: SJDM_CENTER,
    zoom: 11,
    minZoom: 9
  });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(map);

  const boundaryFiles = [
    {
      name: 'sjdm',
      path: '../assets/sjdm-boundary.geojson',
      color: '#16a34a'
    },
    {
      name: 'rodriguez',
      path: '../assets/rodriguez-coverage.geojson',
      color: '#2563eb'
    }
  ];

  const allBoundaryBounds = L.latLngBounds();

  Promise.all(
    boundaryFiles.map(boundary =>
      fetch(boundary.path)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load ${boundary.name} boundary.`);
          }

          return response.json();
        })
        .then(data => {
          const boundaryLayer = L.geoJSON(data, {
            style: {
              color: boundary.color,
              weight: 3,
              opacity: 0.9,
              fillColor: boundary.color,
              fillOpacity: 0.05
            }
          }).addTo(map);

          allBoundaryBounds.extend(boundaryLayer.getBounds());

          if (boundary.name === 'sjdm') {
            sjdmBoundaryData = data;
            sjdmBoundary = boundaryLayer;
          } else if (boundary.name === 'rodriguez') {
            rodriguezBoundaryData = data;
            rodriguezBoundary = boundaryLayer;
          }
        })
    )
  )
    .then(() => {
      if (allBoundaryBounds.isValid()) {
        map.fitBounds(allBoundaryBounds.pad(0.08));

        map.setMaxBounds(allBoundaryBounds.pad(0.15));
        map.options.maxBoundsViscosity = 0.85;
      }
    })
    .catch(error => {
      console.error('[MapLogic] Boundary loading error:', error);
    });

  map.on('contextmenu', function (e) {
    if (!Auth.isLoggedIn()) {
      showNotification('Log in first to save landmarks.', 'warning');
      return;
    }

    openAddLandmarkModal(e.latlng.lat, e.latlng.lng);
  });
}


function isPointInsideBoundary(lat, lng, boundaryData) {
    if (!boundaryData || !Array.isArray(boundaryData.features)) {
        return false;
    }

    function isInsideRing(point, ring) {
        let inside = false;

        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0];
            const yi = ring[i][1];
            const xj = ring[j][0];
            const yj = ring[j][1];

            const intersects =
                ((yi > point[1]) !== (yj > point[1])) &&
                (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);

            if (intersects) inside = !inside;
        }

        return inside;
    }

    return boundaryData.features.some(feature => {
        const geometry = feature.geometry;
        if (!geometry) return false;

        const polygons = geometry.type === 'Polygon'
            ? [geometry.coordinates]
            : geometry.type === 'MultiPolygon'
                ? geometry.coordinates
                : [];

        return polygons.some(rings => {
            if (!rings.length || !isInsideRing([lng, lat], rings[0])) {
                return false;
            }

            // Exclude holes inside the polygon.
            for (let i = 1; i < rings.length; i++) {
                if (isInsideRing([lng, lat], rings[i])) {
                    return false;
                }
            }

            return true;
        });
    });
}

function isLocationInsideCoverage(lat, lng) {
    return (
        isPointInsideBoundary(lat, lng, sjdmBoundaryData) ||
        isPointInsideBoundary(lat, lng, rodriguezBoundaryData)
    );
}

function isLocationInsideSJDM(lat, lng) {
    return isPointInsideBoundary(lat, lng, sjdmBoundaryData);
}

// MARKER HELPERS
function _labelIcon(text, color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};color:#000;padding:4px 10px;
      border-radius:12px;font-size:11px;font-weight:700;
      white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.22);
      font-family:Poppins,sans-serif;
    ">${escapeHtml(text)}</div>`,
    iconAnchor: [0, 22]
  });
}

function setOriginMarker(lat, lng, label) {
  if (originMarker) map.removeLayer(originMarker);
  originMarker = L.marker([lat, lng], { icon: _labelIcon(label, '#27ae60') }).addTo(map);
  _drawRoute();
}

function setDestinationMarker(lat, lng, label) {
  if (destinationMarker) map.removeLayer(destinationMarker);
  destinationMarker = L.marker([lat, lng], { icon: _labelIcon(label, '#E67E22') }).addTo(map);
  _drawRoute();
}

function clearOriginMarker() {
  if (originMarker) { map.removeLayer(originMarker); originMarker = null; }
  _drawRoute();
}

function clearDestinationMarker() {
  if (destinationMarker) { map.removeLayer(destinationMarker); destinationMarker = null; }
  _drawRoute();
}

function _removeRouteLine() {
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }
}

function _drawStraightRoute(origin, destination) {
    routeLine = L.polyline([origin, destination], {
        color: '#3498db',
        weight: 4,
        opacity: 0.85,
        dashArray: '10, 7'
    }).addTo(map);

    map.fitBounds(
        L.latLngBounds([origin, destination]).pad(0.25),
        { maxZoom: 15 }
    );
}

// Draws the road route when possible and falls back to a straight line if the
// routing service is unavailable. Fare calculation remains server-side.
async function _drawRoute() {
  const requestId = ++routeRequestId;
  if (routeController) routeController.abort();
  routeController = null;
  _removeRouteLine();

  refreshFareCalculation();

  if (!originMarker || !destinationMarker) return;

  const origin = originMarker.getLatLng();
  const destination = destinationMarker.getLatLng();
  const controller = new AbortController();
  routeController = controller;

  // Keep the map useful while the road route is loading.
  _drawStraightRoute(origin, destination);

  try {
    const url = 'https://router.project-osrm.org/route/v1/driving/'
      + `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
      + '?overview=full&geometries=geojson';
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Routing HTTP error: ${response.status}`);
    }

    const data = await response.json();
    if (requestId !== routeRequestId) return;
    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error(data.message || 'No road route found');
    }

    const roadRoute = L.geoJSON(data.routes[0].geometry, {
      style: {
        color: '#3498db',
        weight: 5,
        opacity: 0.9
      }
    });
    _removeRouteLine();
    routeLine = roadRoute.addTo(map);
    map.fitBounds(routeLine.getBounds().pad(0.25), {
    maxZoom: 15
    });
  } catch (error) {
    if (requestId !== routeRequestId || error.name === 'AbortError') return;

    console.error('[MapLogic] Road routing error:', error);
    showNotification('Road route unavailable. Showing a direct route instead.', 'warning');
  } finally {
    if (requestId === routeRequestId) routeController = null;
  }
}

// LANDMARK MARKERS
async function renderSavedLandmarks() {
  if (!map) return;
  Object.values(landmarkMarkers).forEach(m => map.removeLayer(m));
  landmarkMarkers = {};
  try {
    const list = await DataManager.load();
    list.forEach(lm => addLandmarkMarker(lm));
  } catch (err) {
    showNotification(API.describe(err), 'error');
  }
}

function addLandmarkMarker(lm) {
    if (!map) return;

    const bg = lm.isPublic ? '#3498db' : '#F1C40F';
    const bd = lm.isPublic ? '#2471a3' : '#d4ac0d';
    const fg = lm.isPublic ? '#fff' : '#000';

    const icon = L.divIcon({
        className: '',
        html: `<div style="
            color:${fg};
            background:${bg};
            border:2px solid ${bd};
            width:26px;
            height:26px;
            border-radius:50%;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:12px;
            cursor:pointer;
            box-shadow:0 2px 6px rgba(0,0,0,0.22);
        ">★</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
    });

    const marker = L.marker([lm.lat, lm.lng], { icon }).addTo(map);

    marker.on('click', () => openViewLandmarkModal(lm.id));

    landmarkMarkers[lm.id] = marker;
}

function panToLandmark(lm) {
  if (map) map.setView([lm.lat, lm.lng], 16, { animate: true });
}

// NOMINATIM LOCATION SEARCH



async function searchLocations(query) {
    if (!query || query.trim().length < 2) return [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
        // Search within the combined rectangular bounds of Para's coverage.
        const coverageBounds = L.latLngBounds();

        if (sjdmBoundaryData) {
            coverageBounds.extend(
                L.geoJSON(sjdmBoundaryData).getBounds()
            );
        }

        if (rodriguezBoundaryData) {
            coverageBounds.extend(
                L.geoJSON(rodriguezBoundaryData).getBounds()
            );
        }

        if (!coverageBounds.isValid()) {
            console.warn('[MapLogic] Coverage boundaries are not loaded.');
            return [];
        }

        const southWest = coverageBounds.getSouthWest();
        const northEast = coverageBounds.getNorthEast();

        const params = new URLSearchParams({
            q: query.trim(),
            format: 'jsonv2',
            addressdetails: '1',
            limit: '20',
            countrycodes: 'ph',
            viewbox: [
                southWest.lng,
                northEast.lat,
                northEast.lng,
                southWest.lat
            ].join(','),
            bounded: '1'
        });

        const url = 'https://nominatim.openstreetmap.org/search?' + params;

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Nominatim search HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error('Invalid Nominatim search response');
        }

        return data.map(place => ({
            name: place.display_name,
            lat: Number(place.lat),
            lng: Number(place.lon)
        }))
        .filter(place =>
            Number.isFinite(place.lat) &&
            Number.isFinite(place.lng) &&
            isLocationInsideCoverage(place.lat, place.lng)
        );

    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('[MapLogic] Nominatim error:', error);
        }

        return [];
    } finally {
        clearTimeout(timeoutId);
    }
}