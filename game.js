/* ═══════════════════════════════════════════
   NÄRMAST PLATSEN VINNER — MULTIPLAYER (Firebase)
═══════════════════════════════════════════ */

'use strict';

// ── Firebase Konfiguration ──
const firebaseConfig = {
  apiKey: "AIzaSyDCiaoCbkDHPMB2qPSl1qT8pQPswjQvqO0",
  authDomain: "npv-spel.firebaseapp.com",
  databaseURL: "https://npv-spel-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "npv-spel",
  storageBucket: "npv-spel.firebasestorage.app",
  messagingSenderId: "612627186241",
  appId: "1:612627186241:web:12c490f00351e116f6fcc0",
  measurementId: "G-HHBL24Z2FN"
};

// Starta Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const gameRef = db.ref('npv_game');

// ── Globala Variabler ──
let myRole = '';
let map = null, tempMarker = null, roundMarkers = [];
let questions = [];

// ── Frågedatabas ──
const questionsData = [
  { name: 'Eiffeltornet', lat: 48.8584, lng: 2.2945 },
  { name: 'Berlinmuren', lat: 52.5167, lng: 13.3775 },
  { name: 'Tjernobyl', lat: 51.3896, lng: 30.0998 },
  { name: 'Colosseum', lat: 41.8902, lng: 12.4922 },
  { name: 'Pyramiderna', lat: 29.9792, lng: 31.1342 },
  { name: 'Machu Picchu', lat: -13.1631, lng: -72.5450 },
  { name: 'Kinesiska muren', lat: 40.4319, lng: 116.5704 },
  { name: 'Frihetsgudinnan', lat: 40.6892, lng: -74.0445 },
  { name: 'Taj Mahal', lat: 27.1751, lng: 78.0421 },
  { name: 'Akropolis', lat: 37.9715, lng: 23.7267 }
];

// ── Hjälpfunktioner ──
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'game-area' && map) setTimeout(() => map.invalidateSize(), 100);
}

function getIcon(color) {
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
  });
}

function fmt(km) {
  if (km === null) return 'Missat';
  return km < 1 ? Math.round(km * 1000) + ' m' : Math.round(km) + ' km';
}

function initMap() {
  if (map) return;
  map = L.map('map', { minZoom: 2 }).setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  map.on('click', (e) => {
    if (myRole === 'Admin') return; // Admin får inte gissa
    if (tempMarker) map.removeLayer(tempMarker);
    const color = myRole === 'Första Klass' ? 'red' : 'blue';
    tempMarker = L.marker(e.latlng, { icon: getIcon(color) }).addTo(map);
  });
}

// ══════════════════════════════════════════
// 1. GÅ MED I SPELET
// ══════════════════════════════════════════
function joinGame(role) {
  myRole = role;
  document.getElementById('role-indicator').innerText = role;

  if (role === 'Admin') {
    document.getElementById('admin-bar').style.display = 'flex';
    // Admin skapar en ny spelomgång i databasen
    questions = [...questionsData].sort(() => Math.random() - 0.5);
    gameRef.set({
      state: 'waiting',
      round: 0,
      scores: { 'Första Klass': 0, 'Dressinen': 0 },
      guesses: null
    });
  }

  // Börja lyssna på förändringar i realtid
  gameRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    syncGameState(data);
  });
}

// ══════════════════════════════════════════
// 2. HANTERA REALSTIDSÄNDRINGAR
// ══════════════════════════════════════════
function syncGameState(data) {
  // Uppdatera Poäng
  document.getElementById('score-board').innerText = `FK: ${data.scores['Första Klass']} | D: ${data.scores['Dressinen']}`;

  if (data.state === 'waiting') {
    showScreen('turn-screen');
    document.getElementById('turn-text').innerText = (myRole === 'Admin') ? "Redo? Tryck Starta Mål!" : "Väntar på Spelmästaren...";
  } 
  else if (data.state === 'guessing') {
    startRoundUI(data);
  } 
  else if (data.state === 'results') {
    showResultsUI(data);
  }
}

// ══════════════════════════════════════════
// 3. UI: GISSNINGSRUNDA PÅGÅR
// ══════════════════════════════════════════
function startRoundUI(data) {
  showScreen('game-area');
  initMap();
  map.setView([20, 0], 2);

  // Rensa gamla pins
  if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
  roundMarkers.forEach(m => map.removeLayer(m));
  roundMarkers = [];

  document.getElementById('game-image').src = `https://loremflickr.com/800/600/${encodeURIComponent(data.question.name)}`;
  const resultBox = document.getElementById('result-box');
  const actionBtn = document.getElementById('action-btn');

  // KOLLA VEM SOM GISSAT
  const fkGuessed = data.guesses && data.guesses['Första Klass'];
  const dGuessed = data.guesses && data.guesses['Dressinen'];

  if (myRole !== 'Admin') {
    // ---- SPELARENS VY ----
    const myGuess = data.guesses && data.guesses[myRole];
    if (myGuess) {
      // Om jag har gissat -> Lås skärmen
      actionBtn.style.display = 'none';
      resultBox.classList.add('visible');
      document.getElementById('result-text').innerHTML = "<b>Gissning låst!</b> Kika på storbildsskärmen.";
    } else {
      // Jag har INTE gissat -> Öppen för gissning
      actionBtn.style.display = 'block';
      resultBox.classList.remove('visible');
    }
  } else {
    // ---- SPELMÄSTARENS VY ----
    actionBtn.style.display = 'none';
    resultBox.classList.add('visible');
    document.getElementById('result-text').innerHTML = `
      <b>Inväntar lag...</b><br>
      Första Klass: ${fkGuessed ? '✅ Klar' : '⏳ Tänker'}<br>
      Dressinen: ${dGuessed ? '✅ Klar' : '⏳ Tänker'}
    `;

    // Om båda har gissat -> Lås upp "Visa Resultat"-knappen för Admin
    if (fkGuessed && dGuessed) {
      document.getElementById('admin-reveal').style.display = 'block';
    } else {
      document.getElementById('admin-reveal').style.display = 'none';
    }
  }
}

// ══════════════════════════════════════════
// 4. UI: RESULTATREDOVISNING
// ══════════════════════════════════════════
function showResultsUI(data) {
  document.getElementById('action-btn').style.display = 'none';

  // Placera ut Rätt Svar
  const correct = L.marker([data.question.lat, data.question.lng], { icon: getIcon('gold') }).addTo(map);
  correct.bindPopup(`<strong>${data.question.name}</strong>`).openPopup();
  roundMarkers.push(correct);

  let g1 = data.guesses ? data.guesses['Första Klass'] : null;
  let g2 = data.guesses ? data.guesses['Dressinen'] : null;

  let d1 = g1 ? map.distance([g1.lat, g1.lng], [data.question.lat, data.question.lng]) / 1000 : null;
  let d2 = g2 ? map.distance([g2.lat, g2.lng], [data.question.lat, data.question.lng]) / 1000 : null;

  // Placera ut Lagens gissningar
  if (g1) roundMarkers.push(L.marker([g1.lat, g1.lng], { icon: getIcon('red') }).addTo(map).bindPopup('Första Klass'));
  if (g2) roundMarkers.push(L.marker([g2.lat, g2.lng], { icon: getIcon('blue') }).addTo(map).bindPopup('Dressinen'));

  // Zooma ut för att se alla
  const group = new L.featureGroup(roundMarkers);
  map.fitBounds(group.getBounds(), { padding: [50, 50] });

  // Visa Vinnartext
  let roundWinner = 'Båda missade!';
  if (d1 !== null || d2 !== null) {
    if (d1 === null) roundWinner = '🏆 Dressinen vann rundan!';
    else if (d2 === null) roundWinner = '🏆 Första Klass vann rundan!';
    else if (d1 < d2) roundWinner = '🏆 Första Klass vann rundan!';
    else if (d2 < d1) roundWinner = '🏆 Dressinen vann rundan!';
    else roundWinner = '🤝 Oavgjort!';
  }

  document.getElementById('result-score').innerHTML = `📍 ${data.question.name}`;
  document.getElementById('result-text').innerHTML = `
    Första Klass: <strong>${fmt(d1)}</strong> &nbsp;|&nbsp; Dressinen: <strong>${fmt(d2)}</strong><br>
    <span style="color:var(--gold); font-size: 1.2em; display:block; margin-top:5px;">${roundWinner}</span>
  `;
  document.getElementById('result-box').classList.add('visible');

  // Uppdatera Spelmästarens knappar
  if (myRole === 'Admin') {
    document.getElementById('admin-reveal').style.display = 'none';
    document.getElementById('admin-next').style.display = 'block';
    document.getElementById('admin-next').innerText = 'Starta Nästa Runda';
  }
}

// ══════════════════════════════════════════
// 5. SPELARENS KNAPP: Lås in gissning
// ══════════════════════════════════════════
document.getElementById('action-btn').addEventListener('click', () => {
  if (!tempMarker) return alert("Sätt ut en pin på kartan först!");
  const pos = tempMarker.getLatLng();
  
  // Skickar gissningen till Firebase
  gameRef.child('guesses/' + myRole).set({
    lat: pos.lat,
    lng: pos.lng
  });
});

// ══════════════════════════════════════════
// 6. SPELMÄSTARENS KNAPPAR (ADMIN)
// ══════════════════════════════════════════
function adminNextRound() {
  gameRef.once('value').then(snap => {
    let data = snap.val();
    let nextRound = (data.round || 0) + 1;
    let q = questions[nextRound % questions.length];

    // Uppdaterar databasen -> Triggar ny runda hos alla
    gameRef.update({
      state: 'guessing',
      round: nextRound,
      question: q,
      guesses: null
    });
    document.getElementById('admin-next').style.display = 'none';
  });
}

function adminReveal() {
  gameRef.once('value').then(snap => {
    let data = snap.val();
    let q = data.question;
    let g1 = data.guesses ? data.guesses['Första Klass'] : null;
    let g2 = data.guesses ? data.guesses['Dressinen'] : null;

    let s1 = data.scores['Första Klass'] || 0;
    let s2 = data.scores['Dressinen'] || 0;

    let d1 = g1 ? map.distance([g1.lat, g1.lng], [q.lat, q.lng]) : null;
    let d2 = g2 ? map.distance([g2.lat, g2.lng], [q.lat, q.lng]) : null;

    // Poänguträkning
    if (d1 !== null && d2 !== null) {
      if (d1 < d2) s1++; else if (d2 < d1) s2++;
    } else if (d1 !== null) { s1++; } else if (d2 !== null) { s2++; }

    // Tvingar spelet till resultatskärmen och sparar poängen
    gameRef.update({
      state: 'results',
      scores: { 'Första Klass': s1, 'Dressinen': s2 }
    });
  });
}
