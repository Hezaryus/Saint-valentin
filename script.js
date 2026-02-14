const START_DATE = new Date(2025, 11, 10); // 10 Décembre 2025
let audioContext, analyser, listeningToBlow = false;

// --- INITIALISATION ---
window.addEventListener('load', () => {
    createStars();
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }, 1200);
});

function createStars() {
    const field = document.getElementById('star-field');
    for (let i = 0; i < 80; i++) {
        const s = document.createElement('div');
        s.style.cssText = `position:absolute; background:white; border-radius:50%;
            width:${Math.random()*2}px; height:${Math.random()*2}px;
            top:${Math.random()*100}%; left:${Math.random()*100}%;
            opacity:${Math.random()}; animation: pulse ${2+Math.random()*3}s infinite;`;
        field.appendChild(s);
    }
}

// --- MICROPHONE ---
async function initMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        audioContext.createMediaStreamSource(stream).connect(analyser);
        detectBlow();
    } catch(e) { console.log("Micro non supporté ou refusé"); }
}

function detectBlow() {
    if (!listeningToBlow || !analyser) return requestAnimationFrame(detectBlow);
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    let avg = data.reduce((a, b) => a + b) / data.length;
    if (avg > 55) { // Seuil de souffle
        const on = document.querySelectorAll('.candle:not(.off)');
        if (on.length > 0) handleCandle(on[Math.floor(Math.random()*on.length)]);
    }
    requestAnimationFrame(detectBlow);
}

// --- NAVIGATION ---
function startExperience() {
    document.getElementById('bgMusic').play().catch(() => {});
    initMicrophone();
    nextPage(2);
}

function nextPage(n) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    let targetId = (n === 'maze') ? 'p-maze' : 'p' + n;
    
    setTimeout(() => {
        const target = document.getElementById(targetId);
        if(target) target.classList.add('active');

        if(n === 2) startTimer();
        if(n === 3) initScratch();
        if(n === 'maze') drawMaze();
        if(n === 4) {
            const area = document.getElementById('candles-area');
            area.style.opacity = '1';
            // On n'active les interactions bougies qu'à la fin
            setTimeout(() => {
                area.classList.add('active-blow');
                listeningToBlow = true;
            }, 1000);
        }
    }, 400);
}

// --- LOGIQUE BOUGIES ---
function handleCandle(el) {
    if (el.classList.contains('off')) return;
    el.classList.add('off');
    const offCount = document.querySelectorAll('.candle.off').length;
    
    document.getElementById('star-field').style.opacity = offCount / 3;
    document.getElementById('dark-overlay').style.opacity = (offCount / 3) * 0.9;
    
    if (offCount === 3) {
        document.getElementById('secret-msg').style.opacity = "1";
        document.querySelector('.page.active').style.filter = "blur(8px)";
        document.querySelector('.page.active').style.pointerEvents = "none";
    }
}

// --- LETTRE ---
function openLetter() {
    document.getElementById('paperSound').play().catch(()=>{});
    document.getElementById('candles-area').style.opacity = '0';
    document.getElementById('letter-btn').style.display = 'none';
    document.getElementById('final-icon').style.display = 'none';
    document.getElementById('letter').style.display = 'block';
}

function closeLetter() {
    document.getElementById('letter').style.display = 'none';
    document.getElementById('letter-btn').style.display = 'inline-block';
    document.getElementById('final-icon').style.display = 'block';
    document.getElementById('candles-area').style.opacity = '1';
}

// --- TOOLS ---
function toggleMusic() {
    const a = document.getElementById('bgMusic');
    a.paused ? a.play() : a.pause();
}

function startTimer() {
    const timerLoop = () => {
        const diff = new Date() - START_DATE;
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff / 3600000) % 24);
        const m = Math.floor((diff / 60000) % 60);
        const s = Math.floor((diff / 1000) % 60);
        document.getElementById('dynamic-days').textContent = `${d} Jours`;
        document.getElementById('timer').textContent = `${h}h ${m}m ${s}s`;
    };
    timerLoop();
    setInterval(timerLoop, 1000);
}

function initScratch() {
    const canvas = document.getElementById('scratch-canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "#c0c0c0"; ctx.fillRect(0, 0, 280, 140);
    ctx.fillStyle = "#666"; ctx.font = "18px Arial"; ctx.fillText("Gratte ici ❤️", 90, 75);
    
    let drawing = false;
    const scratch = (e) => {
        if (!drawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath(); ctx.arc(x, y, 20, 0, 6.28); ctx.fill();
    };
    canvas.onmousedown = canvas.ontouchstart = () => drawing = true;
    window.onmouseup = window.ontouchend = () => drawing = false;
    canvas.onmousemove = canvas.ontouchmove = scratch;
}

// --- MAZE ---
const layout = [[1,1,1,1,1,1,1,1,1],[1,0,0,0,1,0,0,0,1],[1,0,1,0,1,0,1,0,1],[1,0,0,0,0,0,1,0,9],[1,1,1,1,1,1,1,1,1]];
let playerPos = { x: 1, y: 1 };
function drawMaze() {
    const m = document.getElementById('maze');
    m.innerHTML = ''; m.style.gridTemplateColumns = `repeat(9, 1fr)`;
    layout.forEach((row, y) => row.forEach((val, x) => {
        const c = document.createElement('div');
        c.className = 'cell ' + (val === 1 ? 'wall' : 'path');
        if (x === playerPos.x && y === playerPos.y) c.textContent = '❤️';
        m.appendChild(c);
    }));
}
function move(dx, dy) {
    const nx = playerPos.x + dx, ny = playerPos.y + dy;
    if (layout[ny] && (layout[ny][nx] === 0 || layout[ny][nx] === 9)) {
        playerPos = { x: nx, y: ny };
        if (layout[ny][nx] === 9) nextPage(4);
        else drawMaze();
    }
}

function spawnHeart(e) {
    if(e.target.closest('button') || e.target.closest('.d-btn')) return;
    const h = document.createElement('div');
    h.innerHTML = '❤️';
    h.style.cssText = `position:fixed; left:${e.clientX}px; top:${e.clientY}px; pointer-events:none; z-index:1000; animation:fadeUp 1s forwards; font-size:1.5rem;`;
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1000);
}
