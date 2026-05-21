let mode, turn = 'Första klass', score1 = 0, score2 = 0, currentRound = 0;
let redGuess, blueGuess, tempMarker, roundMarkers = [], map;

const allQuestions = [
    { name: 'Eiffeltornet', url: 'eiffeltornet.jpg', lat: 48.8584, lng: 2.2945 },
    { name: 'Berlinmuren', url: 'berlinmuren.jpg', lat: 52.5167, lng: 13.3775 },
    { name: 'Tjernobyl', url: 'tjernobyl.jpg', lat: 51.3896, lng: 30.0998 }
];
let questions = [];

function startGame(selectedMode) {
    mode = selectedMode;
    document.getElementById('menu').style.display = 'none';
    questions = [...allQuestions].sort(() => Math.random() - 0.5);
    loadRound();
}

function loadRound() {
    if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('turn-screen').style.display = 'flex';
    document.getElementById('turn-text').innerText = turn + ", förbered er!";
}

function startRound() {
    document.getElementById('turn-screen').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    
    if (!map) {
        map = L.map('map', {minZoom: 2}).setView([50, 10], 3);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        map.on('click', (e) => {
            if (tempMarker) map.removeLayer(tempMarker);
            tempMarker = L.marker(e.latlng, {icon: getIcon(turn === 'Första klass' ? 'red' : 'blue')}).addTo(map);
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
    if (!tempMarker) { alert("Ni måste placera en markör!"); return; }

    if (turn === 'Första klass') {
        redGuess = tempMarker.getLatLng();
        map.removeLayer(tempMarker); tempMarker = null;
        turn = 'Dressinen';
        
        // Återställ karta till startvy innan Dressinen får turen
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
    let distRaw1 = map.distance(redGuess, [q.lat, q.lng]) / 1000;
    let distRaw2 = map.distance(blueGuess, [q.lat, q.lng]) / 1000;

    function formatDist(d) { return d < 10 ? d.toFixed(1) : Math.round(d); }

    if (distRaw1 < distRaw2) score1++; 
    else if (distRaw2 < distRaw1) score2++;
    
    document.getElementById('score-board').innerText = `Första klass: ${score1} | Dressinen: ${score2}`;
    document.getElementById('result-box').style.display = 'block';
    let winnerText = (distRaw1 < distRaw2) ? "Första klass vinner rundan!" : (distRaw2 < distRaw1 ? "Dressinen vinner rundan!" : "Oavgjort!");

    document.getElementById('result-box').innerHTML = `<strong>${q.name}</strong><br>Första klass: ${formatDist(distRaw1)} km | Dressinen: ${formatDist(distRaw2)} km<br><strong>${winnerText}</strong>`;
    
    roundMarkers.push(L.marker([q.lat, q.lng], {icon: getIcon('green')}).addTo(map));
    roundMarkers.push(L.marker(redGuess, {icon: getIcon('red')}).addTo(map));
    roundMarkers.push(L.marker(blueGuess, {icon: getIcon('blue')}).addTo(map));

    if (score1 >= 3 || score2 >= 3) {
        document.getElementById('win-screen').style.display = 'flex';
        document.getElementById('win-text').innerText = (score1 >= 3 ? "Första klass" : "Dressinen") + " vann matchen!";
    } else {
        document.getElementById('action-btn').style.display = 'none';
        document.getElementById('next-btn').style.display = 'inline-block';
    }
}

document.getElementById('next-btn').onclick = () => {
    currentRound++; turn = 'Första klass';
    roundMarkers.forEach(m => map.removeLayer(m));
    document.getElementById('result-box').style.display = 'none';
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('action-btn').style.display = 'inline-block';
    map.setView([50, 10], 3);
    loadRound();
};