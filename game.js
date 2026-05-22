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
    } else {
        loadRound();
    }
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
        map = L.map('map', {minZoom: 2}).setView([50, 10], 3);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        map.on('click', (e) => {
            if (tempMarker) map.removeLayer(tempMarker);
            tempMarker = L.marker(e.latlng, {icon: getIcon(mode === 'solo' ? 'green' : (turn === 'Första klass' ? 'red' : 'blue'))}).addTo(map);
        });
    } else { map.invalidateSize(); }
    
    document.getElementById('game-image').src = questions[currentRound].url;
    if (mode === 'lag') startTimer();
}

function startTimer() {
    timeLeft = 15;
    document.getElementById('timer').innerText = "Tid: " + timeLeft;
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = "Tid: " + timeLeft;
        if (timeLeft <= 0) { clearInterval(timer); processGuess(); }
    }, 1000);
}

function processGuess() {
    if (timer) clearInterval(timer);
    let guess = tempMarker ? tempMarker.getLatLng() : null;
    
    if (mode === 'solo') {
        redGuess = guess;
        if (tempMarker) {
            tempMarker.setIcon(getIcon('green'));
            roundMarkers.push(tempMarker); // Spara solo-pin
            tempMarker = null;
        }
        showResults();
    } else if (turn === 'Första klass') {
        redGuess = guess;
        // VI TAR INTE BORT MARKÖREN HÄR, VI SPARAR DEN
        if (tempMarker) {
            tempMarker.setIcon(getIcon('red'));
            roundMarkers.push(tempMarker); 
            tempMarker = null;
        }
        turn = 'Dressinen';
        map.setView([50, 10], 3);
        loadRound(); 
    } else {
        blueGuess = guess;
        // VI TAR INTE BORT MARKÖREN HÄR, VI SPARAR DEN
        if (tempMarker) {
            tempMarker.setIcon(getIcon('blue'));
            roundMarkers.push(tempMarker); 
            tempMarker = null;
        }
        showResults();
    }
}

function showResults() {
    document.getElementById('result-box').style.display = 'block';
    document.getElementById('action-btn').style.display = 'none';
    document.getElementById('next-btn').style.display = 'block';
    
    let q = questions[currentRound];
    
    // 1. Visa rätt svar
    let correct = L.marker([q.lat, q.lng], {icon: getIcon('green')}).addTo(map);
    roundMarkers.push(correct);
    
    // 2. Beräkna avstånd (hantera null om de inte satt någon pin)
    let dist1 = redGuess ? map.distance(redGuess, [q.lat, q.lng]) / 1000 : null;
    let dist2 = blueGuess ? map.distance(blueGuess, [q.lat, q.lng]) / 1000 : null;
    
    function fmt(d) { return d === null ? "Missade!" : Math.round(d) + " km"; }

    // 3. Uppdatera HTML
    let html = `<strong>${q.name}</strong><br>`;
    if (mode === 'solo') {
        html += `Du var ${fmt(dist1)} ifrån.`;
    } else {
        // Räkna poäng (om båda missat = oavgjort, om en missat = andra vinner)
        if (dist1 !== null && dist2 === null) score1++;
        else if (dist2 !== null && dist1 === null) score2++;
        else if (dist1 < dist2) score1++;
        else if (dist2 < dist1) score2++;
        
        html += `Första Klass: ${fmt(dist1)}<br>Dressinen: ${fmt(dist2)}<br>`;
        html += `<strong>${(dist1 < dist2) ? "Första Klass vann rundan!" : (dist2 < dist1) ? "Dressinen vann rundan!" : "Oavgjort!"}</strong>`;
        document.getElementById('score-board').innerText = `Första Klass: ${score1} | Dressinen: ${score2}`;
    }
    document.getElementById('result-box').innerHTML = html;
}

document.getElementById('next-btn').onclick = () => {
    currentRound++; turn = 'Första klass';
    roundMarkers.forEach(m => map.removeLayer(m));
    roundMarkers = [];
    document.getElementById('result-box').style.display = 'none';
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('action-btn').style.display = 'inline-block';
    map.setView([50, 10], 3);
    loadRound();
};

function getIcon(c) { return L.icon({ iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${c}.png`, iconSize: [25, 41] }); }
