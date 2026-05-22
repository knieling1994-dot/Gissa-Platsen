let mode, turn = 'Första klass', score1 = 0, score2 = 0, currentRound = 0, timer = null, timeLeft;
let redGuess, blueGuess, tempMarker, roundMarkers = [], map;

const questionsData = [
    { "name": "Eiffeltornet", "lat": 48.8584, "lng": 2.2945 },
    { "name": "Berlinmuren", "lat": 52.5167, "lng": 13.3775 },
    { "name": "Tjernobyl", "lat": 51.3896, "lng": 30.0998 },
    { "name": "Colosseum", "lat": 41.8902, "lng": 12.4922 },
    { "name": "Pyramiderna", "lat": 29.9792, "lng": 31.1342 },
    { "name": "Machu Picchu", "lat": -13.1631, lng: -72.5450 },
    { "name": "Kinesiska muren", "lat": 40.4319, lng: 116.5704 },
    { "name": "Frihetsgudinnan", "lat": 40.6892, lng: -74.0445 },
    { "name": "Taj Mahal", "lat": 27.1751, "lng": 78.0421 },
    { "name": "Akropolis", "lat": 37.9715, lng: 23.7267 },
    { "name": "Stora barriärrevet", "lat": -18.2871, lng: 147.6992 },
    { "name": "Petra", "lat": 30.3285, lng: 35.4444 },
    { "name": "Sagrada Familia", "lat": 41.4036, lng: 2.1744 },
    { "name": "Mount Everest", "lat": 27.9881, lng: 86.9250 },
    { "name": "Burj Khalifa", "lat": 25.1972, lng: 55.2744 },
    { "name": "Stonehenge", "lat": 51.1789, lng: -1.8262 },
    { "name": "Chichén Itzá", "lat": 20.6843, lng: -88.5678 },
    { "name": "Sydney Opera House", "lat": -33.8568, lng: 151.2153 },
    { "name": "Angkor Wat", "lat": 13.4125, lng: 103.8670 },
    { "name": "Alhambra", "lat": 37.1760, lng: -3.5881 },
    { "name": "Christ the Redeemer", "lat": -22.9519, lng: -43.2105 },
    { "name": "Vatikanstaten", "lat": 41.9029, lng: 12.4534 },
    { "name": "Hollywoodskylten", "lat": 34.1341, lng: -118.3215 },
    { "name": "Mont Saint-Michel", "lat": 48.6361, lng: -1.5115 },
    { "name": "Golden Gate-bron", "lat": 37.8199, lng: -122.4783 },
    { "name": "Hagia Sofia", "lat": 41.0086, lng: 28.9802 },
    { "name": "Versailles", "lat": 48.8049, lng: 2.1204 }
];
let questions = [];

function startGame(selectedMode) {
    mode = selectedMode;
    document.getElementById('menu').style.display = 'none';
    questions = [...questionsData].sort(() => Math.random() - 0.5);
    turn = (mode === 'solo') ? 'Du' : 'Första klass';
    
    if (mode === 'lag') {
        let vidScreen = document.getElementById('video-screen');
        let vid = document.getElementById('intro-video');
        if (vidScreen && vid) {
            vidScreen.style.display = 'flex';
            vid.play();
        } else { loadRound(); }
    } else { loadRound(); }
}

function finishVideo() { document.getElementById('video-screen').style.display = 'none'; loadRound(); }

function loadRound() {
    if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('turn-screen').style.display = 'flex';
    document.getElementById('turn-text').innerText = (mode === 'solo') ? "Redo?" : turn + ", dags att resa!";
}

function startRound() {
    document.getElementById('turn-screen').style.display = 'none';
    document.getElementById('game-area').style.display = 'flex';
    let q = questions[currentRound];
    
    // Uppdaterad bildhämtning för bättre kompatibilitet
    let img = document.getElementById('game-image');
    if (img) img.src = `https://loremflickr.com/400/250/${encodeURIComponent(q.name)}?lock=${currentRound}`;
    
    if (!map) {
        map = L.map('map', { minZoom: 2 }).setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        map.on('click', (e) => {
            if (tempMarker) map.removeLayer(tempMarker);
            tempMarker = L.marker(e.latlng, { icon: getIcon(mode === 'solo' ? 'green' : (turn === 'Första klass' ? 'red' : 'blue')) }).addTo(map);
        });
    } else { map.setView([20, 0], 2); }
    if (mode === 'lag') startTimer();
}

function startTimer() {
    timeLeft = 15;
    let tEl = document.getElementById('timer');
    timer = setInterval(() => {
        timeLeft--;
        if (tEl) tEl.innerText = "Tid: " + timeLeft;
        if (timeLeft <= 0) { clearInterval(timer); processGuess(); }
    }, 1000);
}

function processGuess() {
    if (timer) clearInterval(timer);
    let guess = tempMarker ? tempMarker.getLatLng() : null;
    if (mode === 'solo') {
        redGuess = guess;
        if (tempMarker) { tempMarker.setIcon(getIcon('green')); roundMarkers.push(tempMarker); tempMarker = null; }
        showResults();
    } else if (turn === 'Första klass') {
        redGuess = guess;
        if (tempMarker) { tempMarker.setIcon(getIcon('red')); tempMarker.setOpacity(0); roundMarkers.push(tempMarker); tempMarker = null; }
        turn = 'Dressinen'; loadRound();
    } else {
        blueGuess = guess;
        if (tempMarker) { tempMarker.setIcon(getIcon('blue')); roundMarkers.push(tempMarker); tempMarker = null; }
        showResults();
    }
}

function showResults() {
    roundMarkers.forEach(m => m.setOpacity(1));
    let resBox = document.getElementById('result-box');
    if (resBox) resBox.style.display = 'block';
    document.getElementById('action-btn').style.display = 'none';
    document.getElementById('next-btn').style.display = 'inline-block';
    
    let q = questions[currentRound];
    L.marker([q.lat, q.lng], { icon: getIcon('green') }).addTo(map);
    let dist1 = redGuess ? map.distance(redGuess, [q.lat, q.lng]) / 1000 : null;
    let dist2 = blueGuess ? map.distance(blueGuess, [q.lat, q.lng]) / 1000 : null;
    let fmt = (d) => d === null ? "Missat" : Math.round(d) + " km";
    
    if (resBox) resBox.innerHTML = `<strong>${q.name}</strong><br>Första Klass: ${fmt(dist1)}<br>Dressinen: ${fmt(dist2)}<br><strong style="color:#f1c40f;">${(dist1 < dist2) ? "Första Klass vann!" : (dist2 < dist1) ? "Dressinen vann!" : "Oavgjort!"}</strong>`;
    if (dist1 !== null && dist2 !== null) { if (dist1 < dist2) score1++; else if (dist2 < dist1) score2++; }
    let scoreEl = document.getElementById('score-board');
    if (scoreEl) scoreEl.innerText = `Första Klass: ${score1} | Dressinen: ${score2}`;
}

function nextRound() {
    currentRound++; turn = 'Första klass';
    roundMarkers.forEach(m => map.removeLayer(m));
    roundMarkers = [];
    document.getElementById('result-box').style.display = 'none';
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('action-btn').style.display = 'inline-block';
    loadRound();
}

function goToMenu() { location.reload(); }
function getIcon(c) { return L.icon({ iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${c}.png`, iconSize: [25, 41] }); }
