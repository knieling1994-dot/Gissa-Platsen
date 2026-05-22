// Globala variabler
let mode, turn = 'Första klass', score1 = 0, score2 = 0, currentRound = 0, timer = null, timeLeft;
let redGuess, blueGuess, tempMarker, roundMarkers = [], map;
let questions = [];

// --- Initiering ---

async function fetchQuestions() {
    try {
        const response = await fetch('questions.json');
        return await response.json();
    } catch (e) {
        console.error("Kunde inte ladda questions.json", e);
        return [];
    }
}

async function startGame(selectedMode) {
    mode = selectedMode;
    document.getElementById('menu').style.display = 'none';
    
    // Hämta frågor och blanda
    const allQuestions = await fetchQuestions();
    questions = [...allQuestions].sort(() => Math.random() - 0.5);
    
    turn = (mode === 'solo') ? 'Du' : 'Första klass';
    score1 = 0; score2 = 0; currentRound = 0; // Nollställ poäng
    
    if (mode === 'lag') {
        document.getElementById('score-board').innerText = `Första Klass: 0 | Dressinen: 0`;
        document.getElementById('video-screen').style.display = 'flex';
        let vid = document.getElementById('intro-video');
        vid.onended = finishVideo;
        vid.play();
    } else {
        loadRound();
    }
}

function finishVideo() {
    document.getElementById('video-screen').style.display = 'none';
    loadRound();
}

// --- Spelrunda ---

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
        map = L.map('map', { minZoom: 2 }).setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        map.on('click', (e) => {
            if (tempMarker) map.removeLayer(tempMarker);
            tempMarker = L.marker(e.latlng, { 
                icon: getIcon(mode === 'solo' ? 'green' : (turn === 'Första klass' ? 'red' : 'blue')) 
            }).addTo(map);
        });
    } else {
        map.invalidateSize();
        map.setView([20, 0], 2); // Zooma ut vid start av runda
    }

    document.getElementById('game-image').src = `https://source.unsplash.com/featured/?${encodeURIComponent(questions[currentRound].name)}`;
    if (mode === 'lag') startTimer();
}

// --- Timer & Gissningar ---

function startTimer() {
    timeLeft = 15;
    let tEl = document.getElementById('timer');
    if(tEl) tEl.innerText = "Tid: " + timeLeft;
    timer = setInterval(() => {
        timeLeft--;
        if(tEl) tEl.innerText = "Tid: " + timeLeft;
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

// --- Resultat ---

function showResults() {
    roundMarkers.forEach(m => m.setOpacity(1)); // Visa alla pins
    document.getElementById('result-box').style.display = 'block';
    document.getElementById('action-btn').style.display = 'none';
    document.getElementById('next-btn').style.display = 'block';
    
    let q = questions[currentRound];
    let correct = L.marker([q.lat, q.lng], {icon: getIcon('green')}).addTo(map);
    roundMarkers.push(correct);
    
    let dist1 = redGuess ? map.distance(redGuess, [q.lat, q.lng]) / 1000 : null;
    let dist2 = blueGuess ? map.distance(blueGuess, [q.lat, q.lng]) / 1000 : null;
    
    let fmt = (d) => d === null ? "Missat" : Math.round(d) + " km";
    
    // Räkna poäng
    if (dist1 !== null && dist2 !== null) {
        if (dist1 < dist2) score1++; else if (dist2 < dist1) score2++;
    }

    let html = `<div style="font-family:Impact; font-size:1.2em;"><strong>${q.name}</strong><br>
                Första Klass: ${fmt(dist1)}<br>Dressinen: ${fmt(dist2)}<br>
                <strong style="color:#f1c40f;">${(dist1 < dist2) ? "Första Klass vann!" : (dist2 < dist1) ? "Dressinen vann!" : "Oavgjort!"}</strong></div>`;
    
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
    map.setView([20, 0], 2); // Zooma ut hela världen
    loadRound();
}

function goToMenu() {
    location.reload();
}

function getIcon(c) { 
    return L.icon({ 
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${c}.png`, 
        iconSize: [25, 41] 
    }); 
}
