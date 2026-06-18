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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const gameRef = db.ref('npv_game');

let myRole = '', map = null, tempMarker = null;

const questionsData = [
  { name: 'Eiffeltornet', lat: 48.8584, lng: 2.2945, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/800px-Tour_Eiffel_Wikimedia_Commons.jpg' },
  { name: 'Colosseum', lat: 41.8902, lng: 12.4922, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/800px-Colosseo_2020.jpg' }
];

function joinGame(role) {
    myRole = role;
    document.getElementById('role-indicator').innerText = "Du är: " + role;
    showScreen('game-area');
    if (role === 'Admin') document.getElementById('admin-bar').style.display = 'flex';
    
    gameRef.on('value', (snap) => {
        let data = snap.val();
        if(!data) return;
        if(data.question) document.getElementById('game-image').src = data.question.img;
        if(data.state === 'results') showResultsUI(data);
    });
}

function adminPrepareRound() {
    const q = questionsData[Math.floor(Math.random() * questionsData.length)];
    document.getElementById('game-image').src = q.img;
    document.getElementById('result-text').innerHTML = `<b>Förhandsvisning:</b> ${q.name}`;
    document.getElementById('result-box').classList.add('visible');
    
    gameRef.update({ state: 'preparing', pendingQuestion: q });
    document.getElementById('admin-next').style.display = 'block';
}

function adminSendToPlayers() {
    gameRef.once('value').then(snap => {
        gameRef.update({ state: 'guessing', question: snap.val().pendingQuestion, guesses: null });
        document.getElementById('admin-next').style.display = 'none';
        document.getElementById('admin-reveal').style.display = 'block';
    });
}

function adminReveal() {
    gameRef.update({ state: 'results' });
}

document.getElementById('action-btn').addEventListener('click', () => {
    const pos = tempMarker.getLatLng();
    gameRef.child('guesses/' + myRole).set({ lat: pos.lat, lng: pos.lng });
    document.getElementById('action-btn').style.display = 'none';
});

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (!map) initMap();
}

function initMap() {
    map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    map.on('click', (e) => {
        if (myRole === 'Admin') return;
        if(tempMarker) map.removeLayer(tempMarker);
        tempMarker = L.marker(e.latlng).addTo(map);
    });
}

function showResultsUI(data) {
    document.getElementById('result-box').classList.add('visible');
    document.getElementById('result-text').innerText = "Runda avslutad! Se Admin-skärmen.";
}
