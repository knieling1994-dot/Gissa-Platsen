/* ═══════════════════════════════════════════
   NÄRMAST PLATSEN VINNER — game.js
═══════════════════════════════════════════ */

'use strict';

const WIN_SCORE = 3; // Först till 3 vinner matchen

// ── State ──────────────────────────────────
let mode, turn = 'Första Klass';
let score1 = 0, score2 = 0;
let currentRound = 0;
let timer = null, timeLeft = 15;
let redGuess = null, blueGuess = null;
let tempMarker = null, roundMarkers = [], map = null;
let questions = [];

// ── Frågedatabas ───────────────────────────
const questionsData = [
  { name: 'Eiffeltornet',        lat:  48.8584, lng:   2.2945, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/800px-Tour_Eiffel_Wikimedia_Commons.jpg' },
  { name: 'Berlinmuren',         lat:  52.5167, lng:  13.3775, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Berlinermauer.jpg/800px-Berlinermauer.jpg' },
  { name: 'Tjernobyl',           lat:  51.3896, lng:  30.0998, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Chernobyl_NPP_Site_Panorama_with_NSC_Construction_-_June_2013.jpg/800px-Chernobyl_NPP_Site_Panorama_with_NSC_Construction_-_June_2013.jpg' },
  { name: 'Colosseum',           lat:  41.8902, lng:  12.4922, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/800px-Colosseo_2020.jpg' },
  { name: 'Pyramiderna',         lat:  29.9792, lng:  31.1342, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Kheops-Pyramid.jpg/800px-Kheops-Pyramid.jpg' },
  { name: 'Machu Picchu',        lat: -13.1631, lng: -72.5450, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu%2C_Peru.jpg/800px-Machu_Picchu%2C_Peru.jpg' },
  { name: 'Kinesiska muren',     lat:  40.4319, lng: 116.5704, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/The_Great_Wall_of_China_at_Jinshanling-edit.jpg/800px-The_Great_Wall_of_China_at_Jinshanling-edit.jpg' },
  { name: 'Frihetsgudinnan',     lat:  40.6892, lng: -74.0445, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Statue_of_Liberty_7.jpg/600px-Statue_of_Liberty_7.jpg' },
  { name: 'Taj Mahal',           lat:  27.1751, lng:  78.0421, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Taj_Mahal%2C_Agra%2C_India_edit3.jpg/800px-Taj_Mahal%2C_Agra%2C_India_edit3.jpg' },
  { name: 'Akropolis',           lat:  37.9715, lng:  23.7267, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/The_Parthenon_in_Athens.jpg/800px-The_Parthenon_in_Athens.jpg' },
  { name: 'Petra',               lat:  30.3285, lng:  35.4444, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Jordan_Petra_Al-Khazneh_BW_1.jpg/600px-Jordan_Petra_Al-Khazneh_BW_1.jpg' },
  { name: 'Sagrada Familia',     lat:  41.4036, lng:   2.1744, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Sagrada_Familia_01.jpg/600px-Sagrada_Familia_01.jpg' },
  { name: 'Mount Everest',       lat:  27.9881, lng:  86.9250, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg/800px-Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg' },
  { name: 'Burj Khalifa',        lat:  25.1972, lng:  55.2744, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Burj_Khalifa.jpg/600px-Burj_Khalifa.jpg' },
  { name: 'Stonehenge',          lat:  51.1789, lng:  -1.8262, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Stonehenge2007_07_30.jpg/800px-Stonehenge2007_07_30.jpg' },
  { name: 'Chichén Itzá',        lat:  20.6843, lng: -88.5678, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Chichen_Itza_3.jpg/800px-Chichen_Itza_3.jpg' },
  { name: 'Sydney Opera House',  lat: -33.8568, lng: 151.2153, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Sydney_NSW_2000%2C_Australia_-_panoramio%2887%29.jpg/800px-Sydney_NSW_2000%2C_Australia_-_panoramio%2887%29.jpg' },
  { name: 'Angkor Wat',          lat:  13.4125, lng: 103.8670, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Angkor_Wat%2C_Angkor%2C_Cambodia.jpg/800px-Angkor_Wat%2C_Angkor%2C_Cambodia.jpg' },
  { name: 'Alhambra',            lat:  37.1760, lng:  -3.5881, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Alhambra_granada_spain.jpg/800px-Alhambra_granada_spain.jpg' },
  { name: 'Christ the Redeemer', lat: -22.9519, lng: -43.2105, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Christ_the_Redeemer_-_Cristo_Redentor.jpg/600px-Christ_the_Redeemer_-_Cristo_Redentor.jpg' },
  { name: 'Vatikanstaten',       lat:  41.9029, lng:  12.4534, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg/800px-Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg' },
  { name: 'Hollywoodskylten',    lat:  34.1341, lng:-118.3215, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Hollywoodsign.jpg/800px-Hollywoodsign.jpg' },
  { name: 'Mont Saint-Michel',   lat:  48.6361, lng:  -1.5115, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Mont_Saint-Michel_2008.jpg/800px-Mont_Saint-Michel_2008.jpg' },
  { name: 'Golden Gate-bron',    lat:  37.8199, lng:-122.4783, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/GoldenGateBridge-001.jpg/800px-GoldenGateBridge-001.jpg' },
  { name: 'Hagia Sofia',         lat:  41.0086, lng:  28.9802, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Hagia_Sophia_Mars_2013.jpg/800px-Hagia_Sophia_Mars_2013.jpg' },
  { name: 'Versailles',          lat:  48.8049, lng:   2.1204, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Palace_of_Versailles%2C_chateau%2C_vue_du_ciel.jpg/800px-Palace_of_Versailles%2C_chateau%2C_vue_du_ciel.jpg' },
];

// ── Skärmhantering ─────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'game-area' && map) setTimeout(() => map.invalidateSize(), 100);
}

// ── Markör-ikon ────────────────────────────
function getIcon(color) {
  return L.icon({
    iconUrl:    `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    iconSize:   [25, 41],
    iconAnchor: [12, 41],
    popupAnchor:[1, -34],
  });
}

// ── Formatera avstånd ──────────────────────
function fmt(km) {
  if (km === null) return 'Missat';
  return km < 1 ? Math.round(km * 1000) + ' m' : Math.round(km) + ' km';
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
      processGuess();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('timer');
  if (timeLeft > 5) {
    el.textContent = `Tid: ${timeLeft}`;
    el.classList.remove('urgent');
  } else if (timeLeft > 0) {
    el.textContent = `⚠ ${timeLeft}`;
    el.classList.add('urgent');
    beep();
  } else {
    el.textContent = '⚠ 0';
    el.classList.add('urgent');
  }
}

let audioCtx = null;
function beep() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.value = timeLeft === 1 ? 880 : 440;
    gain.gain.setValueAtTime(.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + .15);
    osc.start(); osc.stop(audioCtx.currentTime + .15);
  } catch(e) {}
}

function stopTimer() {
  if (timer) { clearInterval(timer); timer = null; }
}

// ── Karta ──────────────────────────────────
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
  const color = mode === 'solo' ? 'green' : (turn === 'Första Klass' ? 'red' : 'blue');
  tempMarker = L.marker(e.latlng, { icon: getIcon(color) }).addTo(map);
}

// ══════════════════════════════════════════
//  SPELFLÖDE
// ══════════════════════════════════════════

function startGame(selectedMode) {
  mode = selectedMode;
  score1 = 0; score2 = 0;
  currentRound = 0;
  turn = 'Första Klass';
  questions = [...questionsData].sort(() => Math.random() - 0.5);
  // Dölj overlay om den är öppen
  document.getElementById('winner-overlay').classList.remove('show');

  if (mode === 'lag') {
    showScreen('video-screen');
    const vid = document.getElementById('intro-video');
    if (vid) vid.play().catch(() => {});
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
  roundMarkers.forEach(m => map && map.removeLayer(m));
  roundMarkers = [];
  redGuess = null; blueGuess = null;

  document.getElementById('result-box').classList.remove('visible');
  document.getElementById('action-btn').style.display = 'inline-block';
  document.getElementById('next-btn').style.display   = 'none';

  document.getElementById('turn-text').textContent =
    mode === 'solo' ? 'Redo att gissa?' : `${turn}, dags att resa!`;
  showScreen('turn-screen');
}

function startRound() {
  showScreen('game-area');
  initMap();
  map.setView([20, 0], 2);

  const q = questions[currentRound % questions.length];
  const img = document.getElementById('game-image');
  img.alt = q.name;
  img.src = q.img;
  img.onerror = () => {
    img.src = `https://placehold.co/600x400/1a1a2e/f5f0e8?text=${encodeURIComponent(q.name)}`;
  };

  if (mode === 'lag') startTimer();
}

function processGuess() {
  stopTimer();
  const guess = tempMarker ? tempMarker.getLatLng() : null;

  if (mode === 'solo') {
    redGuess = guess;
    if (tempMarker) { tempMarker.setIcon(getIcon('green')); roundMarkers.push(tempMarker); tempMarker = null; }
    showResults();

  } else if (turn === 'Första Klass') {
    redGuess = guess;
    if (tempMarker) {
      tempMarker.setIcon(getIcon('red'));
      tempMarker.setOpacity(0);
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
  roundMarkers.forEach(m => m.setOpacity(1));

  const q = questions[currentRound % questions.length];
  const correct = L.marker([q.lat, q.lng], { icon: getIcon('gold') }).addTo(map);
  correct.bindPopup(`<strong>${q.name}</strong>`).openPopup();
  roundMarkers.push(correct);

  const dist1 = redGuess  ? map.distance(redGuess,  [q.lat, q.lng]) / 1000 : null;
  const dist2 = blueGuess ? map.distance(blueGuess, [q.lat, q.lng]) / 1000 : null;

  let resultText = '';
  if (mode === 'solo') {
    resultText = `Din gissning var <strong>${fmt(dist1)}</strong> från målet.`;
  } else {
    let roundWinner = '';
    if (dist1 !== null || dist2 !== null) {
      if      (dist1 === null)  { score2++; roundWinner = '🏆 Dressinen vann rundan! (FK missade)'; }
      else if (dist2 === null)  { score1++; roundWinner = '🏆 Första Klass vann rundan! (D missade)'; }
      else if (dist1 < dist2)   { score1++; roundWinner = '🏆 Första Klass vann rundan!'; }
      else if (dist2 < dist1)   { score2++; roundWinner = '🏆 Dressinen vann rundan!'; }
      else                      { roundWinner = '🤝 Oavgjort!'; }
    }
    resultText =
      `Första Klass: <strong>${fmt(dist1)}</strong> &nbsp;|&nbsp; Dressinen: <strong>${fmt(dist2)}</strong><br>
       <span style="color:var(--gold)">${roundWinner}</span>`;
    document.getElementById('score-board').textContent =
      `Första Klass: ${score1} | Dressinen: ${score2}`;
  }

  document.getElementById('result-score').innerHTML = `📍 ${q.name}`;
  document.getElementById('result-text').innerHTML  = resultText;
  document.getElementById('result-box').classList.add('visible');
  document.getElementById('action-btn').style.display = 'none';

  // Byt knapptext om matchen är avgjord
  const matchOver = mode === 'lag' && (score1 >= WIN_SCORE || score2 >= WIN_SCORE);
  const btn = document.getElementById('next-btn');
  btn.textContent = matchOver ? '🏆 Se vinnaren →' : 'Nästa Mål →';
  btn.style.display = 'inline-block';
}

function nextRound() {
  // Kolla om matchen är avgjord innan vi går vidare
  if (mode === 'lag' && (score1 >= WIN_SCORE || score2 >= WIN_SCORE)) {
    showWinnerOverlay();
    return;
  }

  currentRound++;
  turn = 'Första Klass';
  if (currentRound >= questions.length) {
    // Frågorna tog slut utan vinnare — visa bäst-av-resultatet
    showWinnerOverlay();
    return;
  }
  loadRound();
}

function showWinnerOverlay() {
  stopTimer();
  let title, subtitle;
  if (score1 > score2) {
    title    = 'Första Klass vinner!';
    subtitle = `Grattis! Matchen vanns med ${score1}–${score2}. 🎉`;
  } else if (score2 > score1) {
    title    = 'Dressinen vinner!';
    subtitle = `Grattis! Matchen vanns med ${score2}–${score1}. 🎉`;
  } else {
    title    = 'Oavgjort!';
    subtitle = 'Ingen vann matchen denna gång.';
  }
  document.getElementById('winner-title').textContent    = title;
  document.getElementById('winner-subtitle').textContent = subtitle;
  document.getElementById('winner-score').textContent    = `Första Klass ${score1} – ${score2} Dressinen`;
  document.getElementById('winner-overlay').classList.add('show');
}

function goToMenu() { stopTimer(); location.reload(); }

function clearTempMarker() {
  if (tempMarker && map) { map.removeLayer(tempMarker); tempMarker = null; }
}

// ── Knapp-lyssnare ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-lag')?.addEventListener('click',         () => startGame('lag'));
  document.getElementById('btn-solo')?.addEventListener('click',        () => startGame('solo'));
  document.getElementById('btn-skip-video')?.addEventListener('click',  finishVideo);
  document.getElementById('intro-video')?.addEventListener('ended',     finishVideo);
  document.getElementById('btn-start-round')?.addEventListener('click', startRound);
  document.getElementById('action-btn')?.addEventListener('click',      processGuess);
  document.getElementById('next-btn')?.addEventListener('click',        nextRound);
  document.getElementById('menu-btn')?.addEventListener('click',        goToMenu);

  // Overlay-knappar
  document.getElementById('btn-play-again')?.addEventListener('click',  () => startGame('lag'));
  document.getElementById('btn-winner-menu')?.addEventListener('click', goToMenu);
});
