/* ═══════════════════════════════════════════
   NÄRMAST PLATSEN VINNER — MULTIPLAYER (Firebase)
   Alla skärmar styrs av Spelmästaren = Samma bilder!
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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const gameRef = db.ref('npv_game');

// ── Globala Variabler ──
let myRole = '';
let map = null, tempMarker = null, roundMarkers = [];
let questions = [];

// ── Frågedatabas (Fasta och direkta bildlänkar) ──
const questionsData = [
  { name: 'Eiffeltornet', lat: 48.8584, lng: 2.2945, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/800px-Tour_Eiffel_Wikimedia_Commons.jpg' },
  { name: 'Berlinmuren', lat: 52.5167, lng: 13.3775, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Berlinermauer.jpg/800px-Berlinermauer.jpg' },
  { name: 'Tjernobyl', lat: 51.3896, lng: 30.0998, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Chernobyl_NPP_Site_Panorama_with_NSC_Construction_-_June_2013.jpg/800px-Chernobyl_NPP_Site_Panorama_with_NSC_Construction_-_June_2013.jpg' },
  { name: 'Colosseum', lat: 41.8902, lng: 12.4922, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/800px-Colosseo_2020.jpg' },
  { name: 'Pyramiderna', lat: 29.9792, lng: 31.1342, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Kheops-Pyramid.jpg/800px-Kheops-Pyramid.jpg' },
  { name: 'Machu Picchu', lat: -13.1631, lng: -72.5450, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu%2C_Peru.jpg/800px-Machu_Picchu%2C_Peru.jpg' },
  { name: 'Kinesiska muren', lat: 40.4319, lng: 116.5704, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/The_Great_Wall_of_China_at_Jinshanling-edit.jpg/800px-The_Great_Wall_of_China_at_Jinshanling-edit.jpg' },
  { name: 'Frihetsgudinnan', lat: 40.6892, lng: -74.0445, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Statue_of_Liberty_7.jpg/600px-Statue_of_Liberty_7.jpg' },
  { name: 'Taj Mahal', lat: 27.1751, lng: 78.0421, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Taj_Mahal%2C_Agra%2C_India_edit3.jpg/800px-Taj_Mahal%2C_Agra%2C_India_edit3.jpg' },
  { name: 'Akropolis', lat: 37.9715, lng: 23.7267, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/The_Parthenon_in_Athens.jpg/800px-The_Parthenon_in_Athens.jpg' }
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
    if (myRole === 'Admin') return; // Spelmästaren får inte klicka
    if (tempMarker) map.removeLayer(tempMarker);
    const color = myRole === 'Första Klass' ? 'red' : 'blue';
    tempMarker = L.marker(e.latlng, { icon: getIcon(color) }).addTo(map);
  });
}

// ══════════════════════════════════════════
// 1. GÅ MED I SPELET
// ══════════════════════════════════════════
window.joinGame = function(role) {
  myRole = role;
  document.getElementById('role-indicator').innerText = role;

  // Om jag är Spelmästare -> Nollställ databasen för ett nytt spel
  if (role === 'Admin') {
    document.getElementById('admin-bar').style.display = 'flex';
    questions = [...questionsData].sort(() => Math.random() - 0.5); // Bara admin blandar
    gameRef.set({
      state: 'waiting',
      round: 0,
      scores: { 'Första Klass': 0, 'Dressinen': 0 },
      guesses: null,
      question: null
    });
  }

  // Börja lyssna på vad som händer i databasen
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
  document.getElementById('score-board').innerText = `FK: ${data.scores['Första Klass']} | D: ${data.scores['Dressinen']}`;

  if (data.state === 'waiting') {
    showScreen('turn-screen');
    document.getElementById('turn-text').innerText = (myRole === 'Admin') ? "Redo? Tryck på Starta Mål i menyn!" : "Väntar på Spelmästaren...";
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

  if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
  roundMarkers.forEach(m => map.removeLayer(m));
  roundMarkers = [];

  // 🔴 HÄR ÄR MAGIN: Alla hämtar exakt samma bild från databasen!
  const imgEl = document.getElementById('game-image');
  imgEl.src = data.question.img;
  imgEl.onerror = () => { imgEl.src = 'https://via.placeholder.com/600x400?text=Kunde+inte+ladda+bild'; };

  const resultBox = document.getElementById('result-box');
  const actionBtn = document.getElementById('action-btn');

  const fkGuessed = data.guesses && data.guesses['Första Klass'];
  const dGuessed = data.guesses && data.guesses['Dressinen'];

  if (myRole !== 'Admin') {
    const myGuess = data.guesses && data.guesses[myRole];
    if (myGuess) {
      actionBtn.style.display = 'none';
      resultBox.classList.add('visible');
      document.getElementById('result-text').innerHTML = "<b>Gissning låst!</b> Kika på storbildsskärmen.";
    } else {
      actionBtn.style.display = 'block';
      resultBox.classList.remove('visible');
    }
  } else {
    actionBtn.style.display = 'none';
    resultBox.classList.add('visible');
    document.getElementById('result-text').innerHTML = `
      <b>Inväntar lag...</b><br>
      Första Klass: ${fkGuessed ? '✅ Klar' : '⏳ Tänker'}<br>
      Dressinen: ${dGuessed ? '✅ Klar' : '⏳ Tänker'}
    `;

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

  const correct = L.marker([data.question.lat, data.question.lng], { icon: getIcon('gold') }).addTo(map);
  correct.bindPopup(`<strong>${data.question.name}</strong>`).openPopup();
  roundMarkers.push(correct);

  let g1 = data.guesses ? data.guesses['Första Klass'] : null;
  let g2 = data.guesses ? data.guesses['Dressinen'] : null;

  let d1 = g1 ? map.distance([g1.lat, g1.lng], [data.question.lat, data.question.lng]) / 1000 : null;
  let d2 = g2 ? map.distance([g2.lat, g2.lng], [data.question.lat, data.question.lng]) / 1000 : null;

  if (g1) roundMarkers.push(L.marker([g1.lat, g1.lng], { icon: getIcon('red') }).addTo(map).bindPopup('Första Klass'));
  if (g2) roundMarkers.push(L.marker([g2.lat, g2.lng], { icon: getIcon('blue') }).addTo(map).bindPopup('Dressinen'));

  const group = new L.featureGroup(roundMarkers);
  map.fitBounds(group.getBounds(), { padding: [50, 50] });

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

  if (myRole === 'Admin') {
    document.getElementById('admin-reveal').style.display = 'none';
    document.getElementById('admin-next').style.display = 'block';
    document.getElementById('admin-next').innerText = 'Starta Nästa Runda';
  }
}

// ══════════════════════════════════════════
// 5. SPELARENS KNAPP: Lås in gissning
// ══════════════════════════════════════════
document.getElementById('action-btn')?.addEventListener('click', () => {
  if (!tempMarker) return alert("Sätt ut en pin på kartan först!");
  const pos = tempMarker.getLatLng();
  
  gameRef.child('guesses/' + myRole).set({
    lat: pos.lat,
    lng: pos.lng
  });
});

// ══════════════════════════════════════════
// 6. SPELMÄSTARENS KNAPPAR (ADMIN)
// ══════════════════════════════════════════
window.adminNextRound = function() {
  gameRef.once('value').then(snap => {
    let data = snap.val();
    let nextRound = data.state === 'waiting' ? 0 : (data.round + 1);
    
    // Om frågorna tar slut börjar de om från början
    let q = questions[nextRound % questions.length];

    gameRef.update({
      state: 'guessing',
      round: nextRound,
      question: q,
      guesses: null
    });
    document.getElementById('admin-next').style.display = 'none';
  });
}

window.adminReveal = function() {
  gameRef.once('value').then(snap => {
    let data = snap.val();
    let q = data.question;
    let g1 = data.guesses ? data.guesses['Första Klass'] : null;
    let g2 = data.guesses ? data.guesses['Dressinen'] : null;

    let s1 = data.scores['Första Klass'] || 0;
    let s2 = data.scores['Dressinen'] || 0;

    let d1 = g1 ? map.distance([g1.lat, g1.lng], [q.lat, q.lng]) : null;
    let d2 = g2 ? map.distance([g2.lat, g2.lng], [q.lat, q.lng]) : null;

    if (d1 !== null && d2 !== null) {
      if (d1 < d2) s1++; else if (d2 < d1) s2++;
    } else if (d1 !== null) { s1++; } else if (d2 !== null) { s2++; }

    gameRef.update({
      state: 'results',
      scores: { 'Första Klass': s1, 'Dressinen': s2 }
    });
  });
}
