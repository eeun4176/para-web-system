// MAP (MapLibre GL + OpenFreeMap: free modern vector map, no API key)
// Note: MapLibre writes coordinates as [longitude, latitude] (the opposite order of Leaflet).

const SJDM_CENTER = [121.0520, 14.8183];   // [lng, lat]
const MAP_STYLES = {
  light: 'https://tiles.openfreemap.org/styles/liberty',
  dark:  'https://tiles.openfreemap.org/styles/dark'
};
const BOUNDARIES = [
  { name: 'sjdm',      path: '../assets/sjdm-boundary.geojson',      color: '#16a34a' },
  { name: 'rodriguez', path: '../assets/rodriguez-coverage.geojson', color: '#2563eb' }
];
const ROUTE_COLOR = '#3498db';
const EMPTY_GEOJSON = { type: 'FeatureCollection', features: [] };

var map                   = null;
var sjdmBoundaryData      = null;
var rodriguezBoundaryData = null;
var originMarker          = null;
var destinationMarker     = null;
var routeFeature          = null;   // the route line on the map (GeoJSON), or null
var landmarkMarkers       = {};     // landmark id -> marker
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

function isDarkMode() {
  return document.documentElement.classList.contains('dark');
}

function initMap() {
  if (map) return;

  map = new maplibregl.Map({
    container: 'map',
    style: isDarkMode() ? MAP_STYLES.dark : MAP_STYLES.light,
    center: SJDM_CENTER,
    zoom: 11,
    minZoom: 9
  });
  map.addControl(new maplibregl.NavigationControl(), 'bottom-right');   // zoom buttons + compass

  // Our own layers (boundaries, route) are removed whenever the map style changes,
  // so they are added again every time a style finishes loading.
  map.on('style.load', addParaLayers);

  loadBoundaries();

  // Right-click the map to save a landmark
  map.on('contextmenu', e => {
    if (!Auth.isLoggedIn()) {
      showNotification('Log in first to save landmarks.', 'warning');
      return;
    }
    openAddLandmarkModal(e.lngLat.lat, e.lngLat.lng);
  });

  // Switch to the dark map when the site's dark mode is toggled
  new MutationObserver(() => {
    const wanted = isDarkMode() ? MAP_STYLES.dark : MAP_STYLES.light;
    map.setStyle(wanted, { diff: false });   // full reload, so 'style.load' fires and our layers come back
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

// BOUNDARIES (SJDM + Rodriguez coverage area)
async function loadBoundaries() {
  try {
    const [sjdm, rodriguez] = await Promise.all(BOUNDARIES.map(async boundary => {
      const response = await fetch(boundary.path);
      if (!response.ok) throw new Error(`Failed to load ${boundary.name} boundary.`);
      return response.json();
    }));
    sjdmBoundaryData = sjdm;
    rodriguezBoundaryData = rodriguez;

    if (map.isStyleLoaded()) addParaLayers();   // otherwise 'style.load' adds them

    // Zoom to the coverage area and keep the user from panning far away
    const box = coverageBox();
    map.fitBounds(box, { padding: 30, animate: false });
    map.setMaxBounds(growBox(box, 0.15));
  } catch (error) {
    console.error('[MapLogic] Boundary loading error:', error);
  }
}

// Adds the boundary and route layers (safe to call more than once)
function addParaLayers() {
  BOUNDARIES.forEach(boundary => {
    const data = boundary.name === 'sjdm' ? sjdmBoundaryData : rodriguezBoundaryData;
    if (!data || map.getSource(boundary.name)) return;

    map.addSource(boundary.name, { type: 'geojson', data: data });
    map.addLayer({
      id: boundary.name + '-fill', type: 'fill', source: boundary.name,
      paint: { 'fill-color': boundary.color, 'fill-opacity': 0.05 }
    });
    map.addLayer({
      id: boundary.name + '-outline', type: 'line', source: boundary.name,
      paint: { 'line-color': boundary.color, 'line-width': 3, 'line-opacity': 0.9 }
    });
  });

  if (!map.getSource('route')) {
    map.addSource('route', { type: 'geojson', data: routeFeature || EMPTY_GEOJSON });
    // Solid line = road route. Dashed line = straight line shown while the road route loads (or if it fails).
    map.addLayer({
      id: 'route-road', type: 'line', source: 'route', filter: ['!=', ['get', 'direct'], true],
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': ROUTE_COLOR, 'line-width': 5, 'line-opacity': 0.9 }
    });
    map.addLayer({
      id: 'route-direct', type: 'line', source: 'route', filter: ['==', ['get', 'direct'], true],
      paint: { 'line-color': ROUTE_COLOR, 'line-width': 4, 'line-opacity': 0.85, 'line-dasharray': [2.5, 1.75] }
    });
  }
}

// BOX HELPERS. A "box" is [[west, south], [east, north]], which fitBounds() and setMaxBounds() accept.

// Smallest box around all the given coordinates (works with any nesting: points, lines, polygons)
function boxAround(coordinates) {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  (function visit(c) {
    if (typeof c[0] === 'number') {
      west = Math.min(west, c[0]); east = Math.max(east, c[0]);
      south = Math.min(south, c[1]); north = Math.max(north, c[1]);
    } else {
      c.forEach(visit);
    }
  })(coordinates);
  return west === Infinity ? null : [[west, south], [east, north]];
}

// Box around SJDM + Rodriguez, or null if the boundary files are not loaded yet
function coverageBox() {
  const shapes = [sjdmBoundaryData, rodriguezBoundaryData]
    .filter(Boolean)
    .flatMap(data => data.features.map(feature => feature.geometry.coordinates));
  return shapes.length ? boxAround(shapes) : null;
}

// Makes a box bigger on every side by the given fraction (0.15 = 15%)
function growBox([[west, south], [east, north]], fraction) {
  const padLng = (east - west) * fraction;
  const padLat = (north - south) * fraction;
  return [[west - padLng, south - padLat], [east + padLng, north + padLat]];
}

// COVERAGE CHECKS (is a point inside SJDM / Rodriguez?)
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

// ORIGIN / DESTINATION MARKERS
// A small colored name tag pinned to the map (looks are in calculate.css: .map-label)
function _labelMarker(lat, lng, text, color) {
  const tag = document.createElement('div');
  tag.className = 'map-label';
  tag.style.background = color;
  tag.textContent = text;   // textContent, not innerHTML: place names can never inject HTML
  return new maplibregl.Marker({ element: tag, anchor: 'bottom-left' })
    .setLngLat([lng, lat])
    .addTo(map);
}

function setOriginMarker(lat, lng, label) {
  if (originMarker) originMarker.remove();
  originMarker = _labelMarker(lat, lng, label, '#27ae60');
  _drawRoute();
}

function setDestinationMarker(lat, lng, label) {
  if (destinationMarker) destinationMarker.remove();
  destinationMarker = _labelMarker(lat, lng, label, '#E67E22');
  _drawRoute();
}

function clearOriginMarker() {
  if (originMarker) { originMarker.remove(); originMarker = null; }
  _drawRoute();
}

function clearDestinationMarker() {
  if (destinationMarker) { destinationMarker.remove(); destinationMarker = null; }
  _drawRoute();
}

// ROUTE LINE
// Shows a line on the map. isDirect = true draws it dashed. Pass null to remove the line.
function _showRouteLine(coordinates, isDirect) {
  routeFeature = coordinates
    ? { type: 'Feature', properties: { direct: isDirect }, geometry: { type: 'LineString', coordinates: coordinates } }
    : null;
  const source = map.getSource('route');
  if (source) source.setData(routeFeature || EMPTY_GEOJSON);
}

function _zoomToLine(coordinates) {
  map.fitBounds(boxAround(coordinates), { padding: 70, maxZoom: 15 });
}

// Draws the road route when possible and falls back to a straight line if the
// routing service is unavailable. Fare calculation remains server-side.
async function _drawRoute() {
  const requestId = ++routeRequestId;
  if (routeController) routeController.abort();
  routeController = null;
  _showRouteLine(null);

  refreshFareCalculation();

  if (!originMarker || !destinationMarker) return;

  const origin = originMarker.getLngLat();
  const destination = destinationMarker.getLngLat();
  const controller = new AbortController();
  routeController = controller;

  // Keep the map useful while the road route is loading: dashed straight line first.
  const straightLine = [[origin.lng, origin.lat], [destination.lng, destination.lat]];
  _showRouteLine(straightLine, true);
  _zoomToLine(straightLine);

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

    const roadLine = data.routes[0].geometry.coordinates;
    _showRouteLine(roadLine, false);
    _zoomToLine(roadLine);
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
  Object.keys(landmarkMarkers).forEach(removeLandmarkMarker);
  try {
    const list = await DataManager.load();
    list.forEach(lm => addLandmarkMarker(lm));
  } catch (err) {
    showNotification(API.describe(err), 'error');
  }
}

// Star pin: blue = public landmark, yellow = your own (looks are in calculate.css: .map-landmark)
function addLandmarkMarker(lm) {
  if (!map) return;

  const pin = document.createElement('button');
  pin.type = 'button';
  pin.className = 'map-landmark' + (lm.isPublic ? ' is-public' : '');
  pin.textContent = '★';
  pin.setAttribute('aria-label', lm.name);
  pin.addEventListener('click', () => openViewLandmarkModal(lm.id));

  landmarkMarkers[lm.id] = new maplibregl.Marker({ element: pin })
    .setLngLat([lm.lng, lm.lat])
    .addTo(map);
}

function removeLandmarkMarker(id) {
  if (!landmarkMarkers[id]) return;
  landmarkMarkers[id].remove();
  delete landmarkMarkers[id];
}

function panToLandmark(lm) {
  if (map) map.flyTo({ center: [lm.lng, lm.lat], zoom: 16 });
}

// NOMINATIM LOCATION SEARCH
async function searchLocations(query) {
    if (!query || query.trim().length < 2) return [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
        // Search within the rectangle around Para's coverage area.
        const box = coverageBox();
        if (!box) {
            console.warn('[MapLogic] Coverage boundaries are not loaded.');
            return [];
        }
        const [[west, south], [east, north]] = box;

        const params = new URLSearchParams({
            q: query.trim(),
            format: 'jsonv2',
            addressdetails: '1',
            limit: '20',
            countrycodes: 'ph',
            viewbox: [west, north, east, south].join(','),
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
