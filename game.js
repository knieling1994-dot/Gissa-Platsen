let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, duration) {
    let osc = audioCtx.createOscillator();
    osc.frequency.value = freq;
    osc.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

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

function startTimer() {
    if (timer) clearInterval(timer);
    timeLeft = 15;
    document.getElementById('timer').innerText = "Tid: " + timeLeft;
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = "Tid: " + timeLeft;
        if (timeLeft <= 5 && timeLeft > 0) playSound(880, 0.1);
        if (timeLeft <= 0) {
            clearInterval(timer);
            playSound(220, 0.5);
            // Om tiden är ute, kör gissnings-funktionen (utan pin om ingen finns)
            processGuess();
        }
    }, 1000);
}

function processGuess() {
    // Om ingen markör är satt, sätt gissningen till null
    let guess = tempMarker ? tempMarker.getLatLng() : null;

    if (turn === 'Första klass') {
        redGuess = guess;
        if (tempMarker) map.removeLayer(tempMarker); tempMarker = null;
        turn = 'Dressinen';
        map.setView([50, 10], 3);
        loadRound(); 
    } else {
        blueGuess = guess;
        if (tempMarker) map.removeLayer(tempMarker); tempMarker = null;
        showResults();
    }
}

function startGame(selectedMode) {
    mode = selectedMode;
    document.getElementById('menu').style.display = 'none';
    questions = [...allQuestions].sort(() => Math.random() - 0.5);
    // Om man spelar solo döper vi om turen till "Du"
    turn = (mode === 'solo') ? 'Du' : 'Första klass';
    loadRound();
}

function loadRound() {
    if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('turn-screen').style.display = 'flex';
    document.getElementById('turn-text').innerText = (mode === 'solo') ? "Redo för gissning?" : turn + ", förbered er!";
}

function startRound() {
    document.getElementById('turn-screen').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    
    if (!map) {
        map = L.map('map', {minZoom: 2}).setView([50, 10], 3);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        map.on('click', (e) => {
            if (tempMarker) map.removeLayer(tempMarker);
            tempMarker = L.marker(e.latlng, {icon: getIcon(mode === 'solo' ? 'green' : (turn === 'Första klass' ? 'red' : 'blue'))}).addTo(map);
        });
    } else {
        map.invalidateSize();
    }
    document.getElementById('game-image').src = questions[currentRound].url;
}

function getIcon(color) {
    return L.icon({ iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`, iconSize: [25, 41] });
}

document.getElementById('action-btn').onclick = function() {
    if (timer) clearInterval(timer);
    processGuess();
};

    if (mode === 'solo') {
        redGuess = tempMarker.getLatLng(); // Vi använder redGuess för solo
        map.removeLayer(tempMarker); tempMarker = null;
        showResults();
    } else if (turn === 'Första klass') {
        redGuess = tempMarker.getLatLng();
        map.removeLayer(tempMarker); tempMarker = null;
        turn = 'Dressinen';
        map.setView([50, 10], 3);
        loadRound(); 
    } else {
        blueGuess = tempMarker.getLatLng();
        map.removeLayer(tempMarker); tempMarker = null;
        showResults();
    }
};

function showResults() {
    let q = questions[currentRound];
    let resultHTML = `<strong>${q.name}</strong><br>`;
    
    if (mode === 'solo') {
        let dist = map.distance(redGuess, [q.lat, q.lng]) / 1000;
        resultHTML += `Du var ${dist < 10 ? dist.toFixed(1) : Math.round(dist)} km ifrån.`;
        roundMarkers.push(L.marker([q.lat, q.lng], {icon: getIcon('green')}).addTo(map));
        roundMarkers.push(L.marker(redGuess, {icon: getIcon('green')}).addTo(map));
    } else {
        let dist1 = map.distance(redGuess, [q.lat, q.lng]) / 1000;
        let dist2 = map.distance(blueGuess, [q.lat, q.lng]) / 1000;
        if (dist1 < dist2) score1++; else if (dist2 < dist1) score2++;
        resultHTML += `Första klass: ${dist1.toFixed(0)} km | Dressinen: ${dist2.toFixed(0)} km<br><strong>${(dist1 < dist2) ? "Första klass vinner!" : "Dressinen vinner!"}</strong>`;
        roundMarkers.push(L.marker([q.lat, q.lng], {icon: getIcon('green')}).addTo(map));
        roundMarkers.push(L.marker(redGuess, {icon: getIcon('red')}).addTo(map));
        roundMarkers.push(L.marker(blueGuess, {icon: getIcon('blue')}).addTo(map));
        document.getElementById('score-board').innerText = `Första klass: ${score1} | Dressinen: ${score2}`;
        let q = questions[currentRound];
    
    // Hantera missade gissningar (null = 9999999999999km)
    let distRaw1 = redGuess ? map.distance(redGuess, [q.lat, q.lng]) / 1000 : 9999999999999;
    let distRaw2 = blueGuess ? map.distance(blueGuess, [q.lat, q.lng]) / 1000 : 9999999999999;

    function formatDist(d) { 
        if (d >= 9999999999999) return "Misslyckades";
        return d < 10 ? d.toFixed(1) : Math.round(d); 
    }

    if (distRaw1 < distRaw2) score1++; 
    else if (distRaw2 < distRaw1) score2++;
    }

    document.getElementById('result-box').innerHTML = resultHTML;
    document.getElementById('result-box').style.display = 'block';
    document.getElementById('action-btn').style.display = 'none';
    document.getElementById('next-btn').style.display = 'inline-block';
}

document.getElementById('next-btn').onclick = () => {
    currentRound++; 
    turn = 'Första klass';
    roundMarkers.forEach(m => map.removeLayer(m));
    document.getElementById('result-box').style.display = 'none';
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('action-btn').style.display = 'inline-block';
    map.setView([50, 10], 3);
    loadRound();
};
