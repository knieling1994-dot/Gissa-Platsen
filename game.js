let mode, turn = 'Första klass', score1 = 0, score2 = 0, currentRound = 0, timer = null, timeLeft;
let redGuess, blueGuess, tempMarker, roundMarkers = [], map;

const allQuestions = [
    { name: 'Eiffeltornet', url: 'eiffeltornet.jpg', lat: 48.8584, lng: 2.2945 },
    { name: 'Berlinmuren', url: 'berlinmuren.jpg', lat: 52.5167, lng: 13.3775 },
    { name: 'Tjernobyl', url: 'tjernobyl.jpg', lat: 51.3896, lng: 30.0998 },
    { name: 'Colosseum', url: 'colosseum.jpg', lat: 41.8902, lng: 12.4922 },
    { name: 'Pyramiderna', url: 'pyramiderna.jpg', lat: 29.9792, lng: 31.1342 },
    { name: 'Machu Picchu', url: 'machu-picchu.jpg', lat: -13.1631, lng: -72.5450 },
    { name: 'Kinesiska muren', url: 'muren-i-kina.jpg', lat: 40.4319, lng: 116.5704 },
    { name: 'Frihetsgudinnan', url: 'frihetsgudinnan.jpg', lat: 40.6892, lng: -74.0445 }
];
let questions = [];

function startGame(selectedMode) {
    mode = selectedMode;
    document.getElementById('menu').style.display = 'none';
    questions = [...allQuestions].sort(() => Math.random() - 0.5);
    turn = (mode === 'solo') ? 'Du' : 'Första klass';
    if (mode === 'lag') {
        document.getElementById('video-screen').style.display = 'flex';
        document.getElementById('intro-video').onended = finishVideo;
        document.getElementById('intro-video').play();
    } else { loadRound(); }
}

function finishVideo() {
    document.getElementById('video-screen').style.display = 'none';
    loadRound();
}

function loadRound() {
    if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('turn-screen').style.display = 'flex';
    document.getElementById('turn-text').innerText = (mode === 'solo') ? "Redo för gissning?" : turn + ", dags att resa!";
}

function startRound() {
    document.getElementById('turn-screen').style.display = 'none';
    document.getElementById('game-area').style.display = 'flex';
    if (!map) {
        map = L.map('map', { minZoom: 2 }).setView([50, 10], 3);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        map.on('click', (e) => {
            if (tempMarker) map.removeLayer(tempMarker);
            tempMarker = L.marker(e.latlng, { icon: getIcon(mode === 'solo' ? 'green' : (turn === 'Första klass' ? 'red' : 'blue')) }).addTo(map);
        });
    } else { map.invalidateSize(); }
    document.getElementById('game-image').src = questions[currentRound].url;
    if (mode === 'lag') startTimer();
}

function startTimer() {
    timeLeft = 15;
    let tEl = document.getElementById('timer');
    tEl.innerText = "Tid: " + timeLeft;
    timer = setInterval(() => {
        timeLeft--;
        tEl.innerText = "Tid: " + timeLeft;
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
    document.getElementById('result-box').style.display = 'block';
    document.getElementById('action-btn').style.display = 'none';
    document.getElementById('next-btn').style.display = 'block';
    let q = questions[currentRound];
    let correct = L.marker([q.lat, q.lng], { icon: getIcon('green') }).addTo(map);
    roundMarkers.push(correct);
    let dist1 = redGuess ? map.distance(redGuess, [q.lat, q.lng]) / 1000 : null;
    let dist2 = blueGuess ? map.distance(blueGuess, [q.lat, q.lng]) / 1000 : null;
    let fmt = (d) => d === null ? "Missat" : Math.round(d) + " km";
    let html = `<div style="font-family:Impact; font-size:1.2em;"><strong>${q.name}</strong><br>Första Klass: ${fmt(dist1)}<br>Dressinen: ${fmt(dist2)}<br><strong style="color:#f1c40f;">${(dist1 < dist2) ? "Första Klass vann!" : (dist2 < dist1) ? "Dressinen vann!" : "Oavgjort!"}</strong></div>`;
    document.getElementById('result-box').innerHTML = html;
    document.getElementById('score-board').innerText = `Första Klass: ${score1} | Dressinen: ${score2}`;
}

function nextRound() {
    currentRound++; turn = 'Första klass';
    roundMarkers.forEach(m => map.removeLayer(m));
    roundMarkers = [];
    document.getElementById('result-box').style.display = 'none';
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('action-btn').style.display = 'inline-block';
    map.setView([20, 0], 2); 
    
    loadRound();
};

function getIcon(c) { return L.icon({ iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${c}.png`, iconSize: [25, 41] }); }

function goToMenu() {
    // 1. Dölj alla skärmar
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('win-screen').style.display = 'none';
    document.getElementById('turn-screen').style.display = 'none';
    document.getElementById('video-screen').style.display = 'none';
    
    // 2. Visa menyn
    document.getElementById('menu').style.display = 'flex';
    
    // 3. Återställ variabler
    score1 = 0;
    score2 = 0;
    currentRound = 0;
    roundMarkers.forEach(m => map.removeLayer(m));
    roundMarkers = [];
    location.reload(); // Enklaste sättet att nollställa allt helt
}
