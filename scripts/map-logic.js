// MAP (MapLibre GL + OpenFreeMap: free vector map, no API key)
// Note: MapLibre writes coordinates as [longitude, latitude] (GeoJSON order), not [latitude, longitude].
//
// What the calculate page shows:
//   - a clean grey map (OpenFreeMap "positron"; "dark" in dark mode) with a thin SJDM outline
//   - origin: a pulsing dot with a name chip; destination: a pin with a name chip and an ETA bubble
//   - the road route from OSRM as a dark line with a soft green glow, and the chosen vehicle driving it
//   - the road distance and "how far the stop is from a road" are passed to the fare request (app.js)

const SJDM_CENTER = [121.0520, 14.8183];   // [lng, lat]
const MAP_STYLES = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark:  'https://tiles.openfreemap.org/styles/dark'
};
const EMPTY_GEOJSON = { type: 'FeatureCollection', features: [] };

// Same icons as the vehicle chips (ui.js)
const VEHICLE_ICONS = { bus_aircon: 'bus', bus_ordinary: 'bus-front', modern_jeepney: 'tram-front', traditional_jeepney: 'car-front' };

var map                   = null;
var mapTheme              = null;   // 'light' or 'dark' style currently loaded
var sjdmBoundaryData      = null;
var rodriguezBoundaryData = null;   // not drawn; only used to accept places in the presentation coverage area
var originMarker          = null;
var destinationMarker     = null;
var vehicleMarker         = null;
var routeFeature          = null;   // the route line on the map (GeoJSON), or null
var landmarkMarkers       = {};     // landmark id -> marker
var routeRequestId        = 0;
var routeController       = null;

// The road route for the current origin/destination, sent with the fare request (null = not known)
var currentRoad = null;             // { km, fromRoadM (destination), startFromRoadM, coords }
var roadOptions = [];               // every road route OSRM found for this trip (the first is the fastest)

// True when the site is in dark mode.
function isDarkMode() {
  return document.documentElement.classList.contains('dark');
}

// Creates the calculator map, its controls and the right-click "save landmark" action.
function initMap() {
  if (map) return;

  mapTheme = isDarkMode() ? 'dark' : 'light';
  map = new maplibregl.Map({
    container: 'map',
    style: MAP_STYLES[mapTheme],
    center: SJDM_CENTER,
    zoom: 12,
    minZoom: 9,
    attributionControl: { compact: true }
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

  // Our own layers (boundary, route) are removed whenever the map style changes,
  // so they are added again every time a style finishes loading.
  map.on('style.load', addParaLayers);

  loadBoundaries();

  // Click a grey alternative route to use it instead
  map.on('click', 'route-alt', e => selectRoadOption(e.features[0].properties.index));
  map.on('mouseenter', 'route-alt', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'route-alt', () => { map.getCanvas().style.cursor = ''; });

  // Right-click the map to save a landmark
  map.on('contextmenu', e => {
    if (!Auth.isLoggedIn()) {
      showNotification('Log in first to save landmarks.', 'warning');
      return;
    }
    openAddLandmarkModal(e.lngLat.lat, e.lngLat.lng);
  });

  // Switch to the dark map when the site's dark mode is toggled (only when the theme really changed)
  new MutationObserver(() => {
    const wanted = isDarkMode() ? 'dark' : 'light';
    if (wanted === mapTheme) return;
    mapTheme = wanted;
    map.setStyle(MAP_STYLES[wanted], { diff: false });   // full reload, so 'style.load' brings our layers back
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

// BOUNDARIES
async function loadBoundaries() {
  try {
    const [sjdm, rodriguez] = await Promise.all(
      ['../assets/sjdm-boundary.geojson', '../assets/rodriguez-coverage.geojson'].map(async path => {
        const response = await fetch(path);
        if (!response.ok) throw new Error('Failed to load ' + path);
        return response.json();
      })
    );
    sjdmBoundaryData = sjdm;
    rodriguezBoundaryData = rodriguez;

    if (map.isStyleLoaded()) addParaLayers();   // otherwise 'style.load' adds them

    // Zoom to SJDM and keep the user from panning far away
    const box = coverageBox();
    map.fitBounds(boxAround(sjdm.features.map(f => f.geometry.coordinates)), { padding: 40, animate: false });
    map.setMaxBounds(growBox(box, 0.25));
  } catch (error) {
    console.error('[MapLogic] Boundary loading error:', error);
  }
}

// Adds the SJDM outline and the route layers (safe to call more than once)
function addParaLayers() {
  const dark = mapTheme === 'dark';

  if (sjdmBoundaryData && !map.getSource('sjdm')) {
    map.addSource('sjdm', { type: 'geojson', data: sjdmBoundaryData });
    map.addLayer({
      id: 'sjdm-outline', type: 'line', source: 'sjdm',
      paint: { 'line-color': dark ? '#ffffff' : '#1D1F1E', 'line-width': 1.5, 'line-opacity': 0.25, 'line-dasharray': [3, 2] }
    });
  }

  if (!map.getSource('route')) {
    map.addSource('route', { type: 'geojson', data: routeFeature || EMPTY_GEOJSON });
    const road = ['all', ['!=', ['get', 'direct'], true], ['!=', ['get', 'alt'], true]];
    // Other possible routes: grey, under the chosen one (click one to use it)
    map.addLayer({
      id: 'route-alt', type: 'line', source: 'route', filter: ['==', ['get', 'alt'], true],
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': dark ? '#8a8f8c' : '#9aa19d', 'line-width': 5, 'line-opacity': 0.7 }
    });
    // Soft green glow under the road route
    map.addLayer({
      id: 'route-glow', type: 'line', source: 'route', filter: road,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#2ECC71', 'line-width': 16, 'line-opacity': 0.28, 'line-blur': 8 }
    });
    // The route itself: green, a shade darker than the glow so the line stays crisp
    map.addLayer({
      id: 'route-road', type: 'line', source: 'route', filter: road,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#27AE60', 'line-width': 5 }
    });
    // Dashed straight line while the road route loads (or if the routing service fails)
    map.addLayer({
      id: 'route-direct', type: 'line', source: 'route', filter: ['==', ['get', 'direct'], true],
      layout: { 'line-cap': 'round' },
      paint: { 'line-color': '#2ECC71', 'line-width': 3, 'line-opacity': 0.7, 'line-dasharray': [1.5, 1.5] }
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

// Box around SJDM + the Rodriguez coverage area, or null if the boundary files are not loaded yet
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

// COVERAGE CHECKS (is a point inside SJDM / the coverage area?)
function isPointInsideBoundary(lat, lng, boundaryData) {
  if (!boundaryData || !Array.isArray(boundaryData.features)) return false;

  // Ray-casting test: is the point inside this polygon ring?
  function isInsideRing(point, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      const intersects = ((yi > point[1]) !== (yj > point[1])) &&
        (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  }

  return boundaryData.features.some(feature => {
    const geometry = feature.geometry;
    if (!geometry) return false;
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates]
      : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
    return polygons.some(rings => {
      if (!rings.length || !isInsideRing([lng, lat], rings[0])) return false;
      for (let i = 1; i < rings.length; i++) {            // holes
        if (isInsideRing([lng, lat], rings[i])) return false;
      }
      return true;
    });
  });
}

// True when the point is inside the area Para searches (SJDM plus the presentation area).
function isLocationInsideCoverage(lat, lng) {
  return isPointInsideBoundary(lat, lng, sjdmBoundaryData) || isPointInsideBoundary(lat, lng, rodriguezBoundaryData);
}

// True when the point is inside San Jose del Monte.
function isLocationInsideSJDM(lat, lng) {
  return isPointInsideBoundary(lat, lng, sjdmBoundaryData);
}

// ORIGIN / DESTINATION MARKERS (looks are in calculate.css: .map-origin, .map-dest, .map-chip)
function _nameChip(text) {
  const chip = document.createElement('span');
  chip.className = 'map-chip';
  chip.innerHTML = '<i data-lucide="map-pin" aria-hidden="true"></i>';
  const name = document.createElement('span');
  name.textContent = text;   // textContent, not innerHTML: place names can never inject HTML
  chip.appendChild(name);
  return chip;
}

// Puts the start marker on the map and redraws the route.
function setOriginMarker(lat, lng, label) {
  if (originMarker) originMarker.remove();
  const el = document.createElement('div');
  el.className = 'map-origin';
  el.innerHTML = '<span class="pulse-dot" aria-hidden="true"></span>';
  el.appendChild(_nameChip(label));
  originMarker = new maplibregl.Marker({ element: el, anchor: 'left', offset: [-11, 0] }).setLngLat([lng, lat]).addTo(map);
  _drawRoute();
}

// Puts the destination pin on the map and redraws the route.
function setDestinationMarker(lat, lng, label) {
  if (destinationMarker) destinationMarker.remove();
  const el = document.createElement('div');
  el.className = 'map-dest';
  el.innerHTML = '<span class="eta-bubble" hidden></span>'
    + '<svg class="dest-pin" viewBox="0 0 24 30" aria-hidden="true"><path d="M12 29C7 22.5 2 17.6 2 11.5a10 10 0 0 1 20 0C22 17.6 17 22.5 12 29z"/><circle cx="12" cy="11.5" r="3.6"/></svg>';
  el.appendChild(_nameChip(label));
  destinationMarker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([lng, lat]).addTo(map);
  _drawRoute();
}

// Removes the start marker and the route.
function clearOriginMarker() {
  if (originMarker) { originMarker.remove(); originMarker = null; }
  _drawRoute();
}

// Removes the destination pin and the route.
function clearDestinationMarker() {
  if (destinationMarker) { destinationMarker.remove(); destinationMarker = null; }
  _drawRoute();
}

// "12 min" bubble above the destination pin (app.js calls this when the fare result arrives)
function setEtaBubble(text) {
  const bubble = destinationMarker && destinationMarker.getElement().querySelector('.eta-bubble');
  if (!bubble) return;
  bubble.textContent = text || '';
  bubble.hidden = !text;
}

// ROUTE LINE
// Shows a line on the map. isDirect = true draws it dashed. Pass null to remove the line.
// alternatives = [{ index, coords }] are drawn grey underneath.
function _showRouteLine(coordinates, isDirect, alternatives) {
  const line = (coords, props) => ({ type: 'Feature', properties: props, geometry: { type: 'LineString', coordinates: coords } });
  const features = (alternatives || []).map(a => line(a.coords, { alt: true, index: a.index }));
  if (coordinates) features.push(line(coordinates, { direct: isDirect }));
  routeFeature = features.length ? { type: 'FeatureCollection', features: features } : null;
  const source = map.getSource('route');
  if (source) source.setData(routeFeature || EMPTY_GEOJSON);
}

// Leaves room for the "Where to Today?" panel on the left (or the sheet at the bottom on phones)
function _zoomToLine(coordinates) {
  const phone = window.innerWidth <= 900;
  const panelOpen = !document.querySelector('.calc-panel.is-collapsed');
  const padding = phone
    ? { top: 170, bottom: panelOpen ? Math.round(window.innerHeight * 0.45) : 120, left: 40, right: 40 }
    : { top: 170, bottom: 70, left: panelOpen ? 440 : 80, right: 110 };   // top: room for the ETA bubble
  map.fitBounds(boxAround(coordinates), { padding: padding, maxZoom: 16 });
}

// Gets the road route from OSRM and draws it; falls back to a dashed straight line if the routing
// service is unavailable. Either way, the fare is recalculated afterwards (with the road distance if known).
async function _drawRoute() {
  const requestId = ++routeRequestId;
  if (routeController) routeController.abort();
  routeController = null;
  currentRoad = null;
  roadOptions = [];
  renderRouteOptions();
  _showRouteLine(null);
  hideVehicle();

  if (!originMarker || !destinationMarker) {
    refreshFareCalculation();
    return;
  }

  const origin = originMarker.getLngLat();
  const destination = destinationMarker.getLngLat();
  const controller = new AbortController();
  routeController = controller;

  // Keep the map useful while the road route is loading: dashed straight line first.
  const straightLine = [[origin.lng, origin.lat], [destination.lng, destination.lat]];
  _showRouteLine(straightLine, true);
  _zoomToLine(straightLine);
  showRouteLoading(true);

  try {
    const url = 'https://router.project-osrm.org/route/v1/driving/'
      + `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
      + '?overview=full&geometries=geojson&alternatives=true';
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Routing HTTP error: ${response.status}`);

    const data = await response.json();
    if (requestId !== routeRequestId) return;
    if (data.code !== 'Ok' || !data.routes?.length) throw new Error(data.message || 'No road route found');

    const fromRoadM = data.waypoints?.[1]?.distance ?? null;   // how far the destination is from the nearest road
    roadOptions = data.routes.map(r => ({ km: r.distance / 1000, fromRoadM: fromRoadM, startFromRoadM: null, coords: r.geometry.coordinates }));
    selectRoadOption(0, false);
    _zoomToLine(roadOptions.flatMap(r => r.coords));   // fit every option on screen

    // Jeepneys and buses only run on main roads: measure how far each end is from one (replaces the
    // "nearest road" above, which counts small subdivision streets too)
    const ends = await measureMainRoads(origin, destination);
    if (requestId !== routeRequestId) return;
    roadOptions.forEach(r => {
      if (ends.dest !== null) r.fromRoadM = ends.dest;
      r.startFromRoadM = ends.start;
    });
  } catch (error) {
    if (requestId !== routeRequestId || error.name === 'AbortError') return;
    console.error('[MapLogic] Road routing error:', error);
    showNotification('Road route unavailable. Showing a direct line and estimating the distance.', 'warning');
  } finally {
    if (requestId === routeRequestId) {
      routeController = null;
      showRouteLoading(false);
      refreshFareCalculation();
    }
  }
}

// ---------- Main roads (where jeepneys and buses run) ----------
// Road classes of the map tiles (OpenMapTiles "transportation" layer). Smaller streets (minor, service, track)
// are inside subdivisions and barangays, where a tricycle or walking is needed.
const MAIN_ROAD_CLASSES = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'];

// Metres from a point (anything with lng/lat) to the nearest main road in the tiles on screen,
// or null when it can't be known (zoomed out too far for the smaller main roads, or no tiles loaded).
function distanceToMainRoad(point) {
  if (map.getZoom() < 11) return null;
  const sources = map.getStyle().sources;
  const tiles = Object.keys(sources).find(k => sources[k].type === 'vector');
  if (!tiles) return null;
  const k = Math.cos(point.lat * Math.PI / 180);   // degrees of longitude are shorter away from the equator
  const metresPerDegree = 111320;
  let best = null;
  map.querySourceFeatures(tiles, { sourceLayer: 'transportation', filter: ['in', ['get', 'class'], ['literal', MAIN_ROAD_CLASSES]] })
    .forEach(f => {
      const g = f.geometry;
      const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
      lines.forEach(line => {
        for (let i = 1; i < line.length; i++) {
          // distance from the point to segment i-1..i, on a flat local grid (fine over a few kilometres)
          const ax = (line[i - 1][0] - point.lng) * k, ay = line[i - 1][1] - point.lat;
          const bx = (line[i][0] - point.lng) * k, by = line[i][1] - point.lat;
          const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
          const t = len ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len)) : 0;
          const d = Math.hypot(ax + t * dx, ay + t * dy) * metresPerDegree;
          if (best === null || d < best) best = d;
        }
      });
    });
  return best === null ? null : Math.round(best);
}

// Waits until the map has stopped zooming to the route and its tiles are loaded, then measures both ends.
// Checks every 250 ms; after 6 s it measures with whatever tiles are there, so a slow map never holds up the fare.
function measureMainRoads(origin, destination) {
  return new Promise(resolve => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const ready = !map.isMoving() && map.areTilesLoaded();
      if (!ready && Date.now() - startedAt < 6000) return;
      clearInterval(timer);
      resolve({ start: distanceToMainRoad(origin), dest: distanceToMainRoad(destination) });
    }, 250);
  });
}

// Use road route number i: it becomes the green line, the others turn grey.
// recalc = false while _drawRoute is still running (it recalculates the fare itself when done).
function selectRoadOption(i, recalc = true) {
  if (!roadOptions[i]) return;
  currentRoad = roadOptions[i];
  const others = roadOptions.map((r, index) => ({ index: index, coords: r.coords })).filter(a => a.index !== i);
  _showRouteLine(currentRoad.coords, false, others);
  renderRouteOptions();
  if (recalc) refreshFareCalculation();
}

// "Route 1 · 2.8 km" buttons in the panel, only when OSRM found more than one way
function renderRouteOptions() {
  const $box = $('#route-options');
  if (!$box.length) return;
  const $list = $box.find('.chips').empty();
  roadOptions.forEach((r, i) => {
    $('<button type="button" class="chip">')
      .toggleClass('is-selected', r === currentRoad)
      .attr('aria-pressed', String(r === currentRoad))
      .text(`Route ${i + 1} · ${r.km.toFixed(1)} km`)
      .on('click', () => selectRoadOption(i))
      .appendTo($list);
  });
  $box.prop('hidden', roadOptions.length < 2);
}

// The fare card shows its loading shimmer while the route is being found
function showRouteLoading(on) {
  if (on && $('#transport-select').val() && $('#passenger-select').val()) {
    $('#result-card').addClass('is-loading');
    setResultVisible(true);
  }
}

// THE CHOSEN VEHICLE drives the route once, then waits at the start
function showVehicle(transportCode) {
  if (!map || !currentRoad || !originMarker) return;
  const coords = currentRoad.coords;
  if (!vehicleMarker) {
    const el = document.createElement('div');
    el.className = 'map-vehicle';
    vehicleMarker = new maplibregl.Marker({ element: el }).setLngLat(coords[0]).addTo(map);
  }
  const el = vehicleMarker.getElement();
  el.innerHTML = '';
  const icon = document.createElement('i');
  icon.setAttribute('data-lucide', VEHICLE_ICONS[transportCode] || 'bus');
  el.appendChild(icon);
  el.hidden = false;

  if (prefersReducedMotion || coords.length < 2) { vehicleMarker.setLngLat(coords[0]); return; }

  // Distance along the line for each point, so the vehicle moves at a steady speed
  const along = [0];
  for (let i = 1; i < coords.length; i++) {
    along.push(along[i - 1] + Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]));
  }
  const total = along[along.length - 1];
  const duration = 3200;
  const myRun = (showVehicle.run = (showVehicle.run || 0) + 1);
  const start = performance.now();

  (function step(now) {
    if (myRun !== showVehicle.run || !vehicleMarker) return;
    const k = Math.min(1, (now - start) / duration);
    const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const target = eased * total;
    let i = 1;
    while (i < along.length - 1 && along[i] < target) i++;
    const seg = (target - along[i - 1]) / ((along[i] - along[i - 1]) || 1);
    vehicleMarker.setLngLat([
      coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * seg,
      coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * seg
    ]);
    if (k < 1) requestAnimationFrame(step);
    else setTimeout(() => { if (myRun === showVehicle.run && vehicleMarker) vehicleMarker.setLngLat(coords[0]); }, 900);
  })(start);
}

// Hides the moving vehicle and stops its animation.
function hideVehicle() {
  showVehicle.run = (showVehicle.run || 0) + 1;   // stops a running animation
  if (vehicleMarker) vehicleMarker.getElement().hidden = true;
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
  pin.innerHTML = '<i data-lucide="star" aria-hidden="true"></i>';
  pin.setAttribute('aria-label', lm.name);
  pin.title = lm.name;
  pin.addEventListener('click', () => openViewLandmarkModal(lm.id));

  landmarkMarkers[lm.id] = new maplibregl.Marker({ element: pin })
    .setLngLat([lm.lng, lm.lat])
    .addTo(map);
}

// Takes a deleted landmark off the map.
function removeLandmarkMarker(id) {
  if (!landmarkMarkers[id]) return;
  landmarkMarkers[id].remove();
  delete landmarkMarkers[id];
}

// Moves the map to a landmark and opens its details.
function panToLandmark(lm) {
  if (map) map.flyTo({ center: [lm.lng, lm.lat], zoom: 16 });
}

// PLACE SEARCH (OpenStreetMap Nominatim, limited to the SJDM area)
// One request at a time: a new search cancels the one still running (Nominatim allows ~1 request/second).
let searchController = null;

// Place search: Photon first (it understands half-typed words like "tungk" or "sm cit"),
// Nominatim when Photon is down or finds nothing. Both are free OpenStreetMap services.
async function searchLocations(query) {
  if (!query || query.trim().length < 2) return [];
  const box = coverageBox();
  if (!box) return [];

  if (searchController) searchController.abort();
  const controller = new AbortController();
  searchController = controller;
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const fromPhoton = await searchPhoton(query.trim(), box, controller.signal).catch(error => {
      if (error.name === 'AbortError') throw error;
      console.warn('[MapLogic] Photon search failed, trying Nominatim:', error.message);
      return [];
    });
    if (fromPhoton.length) return fromPhoton;
    return await searchNominatim(query.trim(), box, controller.signal);
  } catch (error) {
    if (error.name !== 'AbortError') console.error('[MapLogic] Search error:', error);
    return [];
  } finally {
    clearTimeout(timeoutId);
    if (searchController === controller) searchController = null;
  }
}

// Only places inside the covered area, each place once (Photon often returns the same mall twice)
function cleanPlaces(places) {
  const seen = new Set();
  return places.filter(place => {
    if (!place.name || !Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return false;
    if (!isLocationInsideCoverage(place.lat, place.lng)) return false;
    const key = place.name.toLowerCase() + '|' + place.lat.toFixed(3) + '|' + place.lng.toFixed(3);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Asks Photon for places matching the text (understands half-typed words).
async function searchPhoton(query, box, signal) {
  const [[west, south], [east, north]] = box;
  const params = new URLSearchParams({ q: query, limit: '12', lang: 'en', bbox: [west, south, east, north].join(',') });
  const response = await fetch('https://photon.komoot.io/api/?' + params, { signal: signal });
  if (!response.ok) throw new Error('Photon HTTP error: ' + response.status);
  const data = await response.json();
  return cleanPlaces((data.features || []).map(f => {
    const p = f.properties || {};
    const area = p.district || p.locality || p.suburb || '';
    return {
      name: p.name || p.street || '',
      detail: [area, p.city || p.county || ''].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', '),
      lat: Number(f.geometry && f.geometry.coordinates[1]),
      lng: Number(f.geometry && f.geometry.coordinates[0])
    };
  }));
}

// Asks Nominatim for places matching the text (used when Photon finds nothing).
async function searchNominatim(query, box, signal) {
  const [[west, south], [east, north]] = box;
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '15',
    countrycodes: 'ph',
    'accept-language': 'en',
    viewbox: [west, north, east, south].join(','),
    bounded: '1'
  });
  const response = await fetch('https://nominatim.openstreetmap.org/search?' + params, {
    signal: signal,
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) throw new Error(`Nominatim search HTTP error: ${response.status}`);

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Invalid Nominatim search response');

  return cleanPlaces(data.map(place => {
    const a = place.address || {};
    const area = a.village || a.suburb || a.neighbourhood || a.quarter || a.hamlet || '';
    const city = a.city || a.town || a.municipality || '';
    return {
      name: place.name || String(place.display_name || '').split(',')[0],
      detail: [area, city].filter(Boolean).join(', '),
      lat: Number(place.lat),
      lng: Number(place.lon)
    };
  }));
}
