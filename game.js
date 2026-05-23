/* ═══════════════════════════════════════════
   NÄRMAST PLATSEN VINNER — game.js
   Kompatibel med index.html (screen-klass-systemet)
═══════════════════════════════════════════ */

'use strict';

// ── State ──────────────────────────────────
let mode, turn = 'Första klass';
let score1 = 0, score2 = 0;
let currentRound = 0;
let timer = null, timeLeft = 15;
let redGuess = null, blueGuess = null;
let tempMarker = null, roundMarkers = [], map = null;
let questions = [];

// ── Frågedatabas ───────────────────────────
const questionsData = [
  { name: 'Eiffeltornet',       lat:  48.8584, lng:   2.2945, img: 'Eiffel_Tower' },
  { name: 'Berlinmuren',        lat:  52.5167, lng:  13.3775, img: 'Berlin_Wall' },
  { name: 'Tjernobyl',          lat:  51.3896, lng:  30.0998, img: 'Chernobyl_Nuclear_Power_Plant' },
  { name: 'Colosseum',          lat:  41.8902, lng:  12.4922, img: 'Colosseum_in_Rome' },
  { name: 'Pyramiderna',        lat:  29.9792, lng:  31.1342, img: 'Great_Pyramid_of_Giza' },
  { name: 'Machu Picchu',       lat: -13.1631, lng: -72.5450, img: 'Machu_Picchu' },
  { name: 'Kinesiska muren',    lat:  40.4319, lng: 116.5704, img: 'Great_Wall_of_China' },
  { name: 'Frihetsgudinnan',    lat:  40.6892, lng: -74.0445, img: 'Statue_of_Liberty' },
  { name: 'Taj Mahal',          lat:  27.1751, lng:  78.0421, img: 'Taj_Mahal' },
  { name: 'Akropolis',          lat:  37.9715, lng:  23.7267, img: 'Acropolis_of_Athens' },
  { name: 'Stora barriärrevet', lat: -18.2871, lng: 147.6992, img: 'Great_Barrier_Reef' },
  { name: 'Petra',              lat:  30.3285, lng:  35.4444, img: 'Petra_Jordan' },
  { name: 'Sagrada Familia',    lat:  41.4036, lng:   2.1744, img: 'Sagrada_Família' },
  { name: 'Mount Everest',      lat:  27.9881, lng:  86.9250, img: 'Mount_Everest' },
  { name: 'Burj Khalifa',       lat:  25.1972, lng:  55.2744, img: 'Burj_Khalifa' },
  { name: 'Stonehenge',         lat:  51.1789, lng:  -1.8262, img: 'Stonehenge' },
  { name: 'Chichén Itzá',       lat:  20.6843, lng: -88.5678, img: 'Chichen-Itza' },
  { name: 'Sydney Opera House', lat: -33.8568, lng: 151.2153, img: 'Sydney_Opera_House' },
  { name: 'Angkor Wat',         lat:  13.4125, lng: 103.8670, img: 'Angkor_Wat' },
  { name: 'Alhambra',           lat:  37.1760, lng:  -3.5881, img: 'Alhambra_Granada' },
  { name: 'Christ the Redeemer',lat: -22.9519, lng: -43.2105, img: 'Cristo_Redentor' },
  { name: 'Vatikanstaten',      lat:  41.9029, lng:  12.4534, img: 'Saint_Peter%27s_Basilica' },
  { name: 'Hollywoodskylten',   lat:  34.1341, lng:-118.3215, img: 'Hollywood_Sign' },
  { name: 'Mont Saint-Michel',  lat:  48.6361, lng:  -1.5115, img: 'Mont_Saint-Michel' },
  { name: 'Golden Gate-bron',   lat:  37.8199, lng:-122.4783, img: 'Golden_Gate_Bridge' },
  { name: 'Hagia Sofia',        lat:  41.0086, lng:  28.9802, img: 'Hagia_Sophia' },
  { name: 'Versailles',         lat:  48.8049, lng:   2.1204, img: 'Palace_of_Versailles' },
];

// ── Hjälp: skärmhantering ──────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  // Leaflet behöver invalideras när kartan blir synlig
  if (id === 'game-area' && map) map.invalidateSize();
}

// ── Hjälp: markör-ikon ─────────────────────
function getIcon(color) {
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    iconSize:   [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
}

// ── Hjälp: formatera avstånd ───────────────
function fmt(km) {
  if (km === null) return 'Missat';
  return km < 1
    ? Math.round(km * 1000) + ' m'
    : Math.round(km) + ' km';
}

// ── Timer ──────────────────────────────────
function startTimer() {
  timeLeft = 15;
  updateTimerDisplay();
  timer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timer);
      timer = null;
      processGuess(); // Tid ute → automatisk inlämning
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('timer');
  el.textContent = `Tid: ${timeLeft}`;
  el.classList.toggle('urgent', timeLeft <= 5);
}

function stopTimer() {
  if (timer) { clearInterval(timer); timer = null; }
}

// ── Initiera kartan (en gång) ──────────────
function initMap() {
  if (map) return;
  map = L.map('map', { minZoom: 2 }).setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(map);
  map.on('click', onMapClick);
}

function onMapClick(e) {
  if (tempMarker) map.removeLayer(tempMarker);
  const color = mode === 'solo' ? 'green' : (turn === 'Första klass' ? 'red' : 'blue');
  tempMarker = L.marker(e.latlng, { icon: getIcon(color) }).addTo(map);
}

// ══════════════════════════════════════════
//  SPELFLÖDE
// ══════════════════════════════════════════

// Anropas från HTML (index.html kopplar knapparna)
function startGame(selectedMode) {
  mode = selectedMode;
  score1 = 0; score2 = 0;
  currentRound = 0;
  turn = mode === 'solo' ? 'Du' : 'Första klass';
  questions = [...questionsData].sort(() => Math.random() - 0.5);

  if (mode === 'lag') {
    showScreen('video-screen');
    const vid = document.getElementById('intro-video');
    if (vid) vid.play().catch(() => {}); // autoplay kan blockeras av webbläsaren
  } else {
    loadRound();
  }
}

function finishVideo() {
  const vid = document.getElementById('intro-video');
  if (vid) vid.pause();
  loadRound();
}

function loadRound() {
  stopTimer();
  clearTempMarker();

  // Ta bort gamla markörer
  roundMarkers.forEach(m => map && map.removeLayer(m));
  roundMarkers = [];
  redGuess = null; blueGuess = null;

  // Dölj resultat & knappar
  document.getElementById('result-box').classList.remove('visible');
  document.getElementById('action-btn').style.display = 'inline-block';
  document.getElementById('next-btn').style.display   = 'none';

  // Visa vems tur det är
  document.getElementById('turn-text').textContent =
    mode === 'solo' ? 'Redo att gissa?' : `${turn}, dags att resa!`;
  showScreen('turn-screen');
}

function startRound() {
  showScreen('game-area');
  initMap();
  map.setView([20, 0], 2);

  const q = questions[currentRound % questions.length];

  // Bild — använder specifik img-nyckel per plats
  const img = document.getElementById('game-image');
  img.alt = q.name;
  img.onerror = () => {
    img.src = `https://placehold.co/600x400/1a1a2e/f5f0e8?text=${encodeURIComponent(q.name)}`;
  };
  img.src = `https://en.wikipedia.org/wiki/Special:FilePath/${q.img}.jpg`;

  if (mode === 'lag') startTimer();
}

function processGuess() {
  stopTimer();

  const guess = tempMarker ? tempMarker.getLatLng() : null;

  if (mode === 'solo') {
    redGuess = guess;
    if (tempMarker) { tempMarker.setIcon(getIcon('green')); roundMarkers.push(tempMarker); tempMarker = null; }
    showResults();

  } else if (turn === 'Första klass') {
    redGuess = guess;
    if (tempMarker) {
      tempMarker.setIcon(getIcon('red'));
      tempMarker.setOpacity(0); // Dölj för lag 2
      roundMarkers.push(tempMarker);
      tempMarker = null;
    }
    turn = 'Dressinen';
    loadRound();

  } else {
    blueGuess = guess;
    if (tempMarker) { tempMarker.setIcon(getIcon('blue')); roundMarkers.push(tempMarker); tempMarker = null; }
    showResults();
  }
}

function showResults() {
  // Visa alla dolda markörer
  roundMarkers.forEach(m => m.setOpacity(1));

  const q = questions[currentRound % questions.length];
  const correct = L.marker([q.lat, q.lng], { icon: getIcon('gold') }).addTo(map);
  correct.bindPopup(`<strong>${q.name}</strong>`).openPopup();
  roundMarkers.push(correct);

  const dist1 = redGuess  ? map.distance(redGuess,  [q.lat, q.lng]) / 1000 : null;
  const dist2 = blueGuess ? map.distance(blueGuess, [q.lat, q.lng]) / 1000 : null;

  let scoreHTML = '';
  let resultText = '';

  if (mode === 'solo') {
    resultText = `Din gissning var <strong>${fmt(dist1)}</strong> från målet.`;
  } else {
    let winner = '';
    if (dist1 !== null && dist2 !== null) {
      if (dist1 < dist2)      { score1++; winner = '🏆 Första Klass vann rundan!'; }
      else if (dist2 < dist1) { score2++; winner = '🏆 Dressinen vann rundan!'; }
      else                    { winner = '🤝 Oavgjort!'; }
    }
    resultText =
      `Första Klass: <strong>${fmt(dist1)}</strong> &nbsp;|&nbsp; Dressinen: <strong>${fmt(dist2)}</strong><br>
       <span style="color:var(--gold)">${winner}</span>`;
    document.getElementById('score-board').textContent =
      `Första Klass: ${score1} | Dressinen: ${score2}`;
  }

  document.getElementById('result-score').innerHTML = `📍 ${q.name}`;
  document.getElementById('result-text').innerHTML  = resultText;
  document.getElementById('result-box').classList.add('visible');
  document.getElementById('action-btn').style.display = 'none';
  document.getElementById('next-btn').style.display   = 'inline-block';
}

function nextRound() {
  currentRound++;
  turn = 'Första klass';

  if (currentRound >= questions.length) {
    endGame();
    return;
  }
  loadRound();
}

function endGame() {
  let msg = '';
  if (mode === 'solo') {
    msg = `Spelet slut! Du klarade alla ${questions.length} platser.`;
  } else {
    msg = score1 > score2
      ? `Spelet slut! 🏆 Första Klass vinner med ${score1}–${score2}!`
      : score2 > score1
      ? `Spelet slut! 🏆 Dressinen vinner med ${score2}–${score1}!`
      : `Spelet slut! Oavgjort ${score1}–${score2}!`;
  }
  document.getElementById('result-score').textContent = '🎉 Klart!';
  document.getElementById('result-text').innerHTML = msg;
  document.getElementById('result-box').classList.add('visible');
  document.getElementById('next-btn').style.display = 'none';
  document.getElementById('action-btn').style.display = 'none';
}

function goToMenu() {
  stopTimer();
  location.reload();
}

// ── Intern hjälp ───────────────────────────
function clearTempMarker() {
  if (tempMarker && map) { map.removeLayer(tempMarker); tempMarker = null; }
}

// ── Koppla knappar (kompletterar index.html) ─
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-lag')?.addEventListener('click',          () => startGame('lag'));
  document.getElementById('btn-solo')?.addEventListener('click',         () => startGame('solo'));
  document.getElementById('btn-skip-video')?.addEventListener('click',   finishVideo);
  document.getElementById('intro-video')?.addEventListener('ended',      finishVideo);
  document.getElementById('btn-start-round')?.addEventListener('click',  startRound);
  document.getElementById('action-btn')?.addEventListener('click',       processGuess);
  document.getElementById('next-btn')?.addEventListener('click',         nextRound);
  document.getElementById('menu-btn')?.addEventListener('click',         goToMenu);
});
