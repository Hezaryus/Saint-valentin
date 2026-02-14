// --- LOGIQUE GLOBALE ---
const START_DATE = new Date(2025, 11, 10); 
let audioContext, analyser, dataArray, listeningToBlow = false;
let isMazeActive = false;

// --- LOADER ---
window.addEventListener('load', () => {
    const loader = document.getElementById('loading-screen');
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 800);
    }, 1500); 
});

function triggerHaptic(duration = 10) {
    if (navigator.vibrate) navigator.vibrate(duration);
}

function createStars() {
    const field = document.getElementById('star-field');
    if(!field) return;
    field.innerHTML = ''; 
    for (let i = 0; i < 100; i++) {
        const s = document.createElement('div');
        s.className = 'bg-star';
        const size = Math.random() * 2 + 1;
        s.style.width = s.style.height = size + 'px';
        s.style.left = Math.random() * 100 + 'vw';
        s.style.top = Math.random() * 100 + 'vh';
        s.style.setProperty('--duration', (Math.random() * 3 + 2) + 's');
        field.appendChild(s);
    }
}
createStars();

async function initMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        audioContext.createMediaStreamSource(stream).connect(analyser);
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        detectBlow();
    } catch(e) { console.log("Micro non dispo ou refusé"); }
}

function detectBlow() {
    if (!listeningToBlow) return requestAnimationFrame(detectBlow);
    if (!analyser || !dataArray) return requestAnimationFrame(detectBlow);
    analyser.getByteFrequencyData(dataArray);
    let avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
    
    if (avg > 55) {
        const on = document.querySelectorAll('.candle:not(.off)');
        if (on.length > 0) handleCandle(on[Math.floor(Math.random()*on.length)]);
    }
    requestAnimationFrame(detectBlow);
}

function startExperience() {
    const music = document.getElementById('bgMusic');
    music.play().catch(e => console.log("Audio bloqué par le navigateur"));
    initMicrophone();
    nextPage(2);
}

function nextPage(n) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    isMazeActive = (n === 'maze');

    let targetId = (n === 'maze') ? 'p-maze' : 'p' + n;

    setTimeout(() => {
        const target = document.getElementById(targetId);
        if (target) target.classList.add('active');

        if(n === 2) startTimer();
        if(n === 3) initScratch();
        if(n === 'maze') drawMaze();
        if(n === 4) {
            document.getElementById('candles-area').style.cssText = "opacity:1; pointer-events:all;";
            listeningToBlow = true;
        }
    }, 300);
}

function handleCandle(el) {
    if(el.classList.contains('off')) return;
    triggerHaptic(50); 
    el.classList.add('off');
    
    const offCount = document.querySelectorAll('.candle.off').length;
    const starField = document.getElementById('star-field');
    const darkOverlay = document.getElementById('dark-overlay');
    const msg = document.getElementById('secret-msg');

    starField.style.opacity = offCount / 3;
    darkOverlay.style.opacity = (offCount / 3) * 0.95;

    if (offCount === 3) {
        msg.style.opacity = "1";
        document.querySelector('.page.active').classList.add('blur-effect');
    }
}

// --- SCRATCH FIXÉ POUR MOBILE ---
function initScratch() {
    const canvas = document.getElementById('scratch-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = "#c0c0c0"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#666";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Gratte-moi... ❤️", canvas.width/2, canvas.height/2 + 7);

    let isDrawing = false;

    const scratch = (e) => {
        if (!isDrawing) return;
        e.preventDefault(); 
        
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
    };

    canvas.addEventListener('mousedown', () => isDrawing = true);
    canvas.addEventListener('touchstart', (e) => { isDrawing = true; scratch(e); }, {passive: false});
    window.addEventListener('mouseup', () => isDrawing = false);
    window.addEventListener('touchend', () => isDrawing = false);
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('touchmove', scratch, {passive: false});
}

// --- LE RESTE DU CODE (Labyrinthe, Lettre, etc.) ---
function startTimer() {
    const timerEl = document.getElementById('timer');
    const titleEl = document.getElementById('dynamic-days');
    if(!timerEl) return;

    const update = () => {
        const now = new Date();
        const diff = now - START_DATE;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        titleEl.textContent = `${days} Jours d'Amour`;
        timerEl.textContent = `${hours}h ${minutes}m ${seconds}s`;
    };
    update();
    setInterval(update, 1000);
}

function openLetter() {
    const snd = document.getElementById('paperSound');
    if(snd) { snd.currentTime=0; snd.play().catch(()=>{}); }
    document.getElementById('candles-area').style.opacity = '0';
    document.getElementById('letter-btn').style.display = 'none';
    document.getElementById('final-icon').style.display = 'none';
    const l = document.getElementById('letter');
    l.style.display = 'block'; 
    l.classList.add('unfold-animation');
    for(let i=0; i<30; i++) setTimeout(createPetal, i*150);
}

function closeLetter() {
    const l = document.getElementById('letter');
    l.style.display = 'none';
    document.getElementById('letter-btn').style.display = 'inline-block';
    document.getElementById('final-icon').style.display = 'block';
}

function createPetal() {
    const p = document.createElement('div');
    const size = Math.random()*12+8;
    p.style.cssText = `position:fixed;top:-20px;background:var(--rose-petal);width:${size}px;height:${size}px;border-radius:50% 0 50% 50%;left:${Math.random()*100}vw;z-index:200;pointer-events:none;`;
    p.animate([{transform:'translateY(0) rotate(0deg)'},{transform:`translateY(105vh) rotate(${Math.random()*720}deg)`}], {duration:4000+Math.random()*4000}).onfinish=()=>p.remove();
    document.body.appendChild(p);
}

function toggleMusic() {
    const audio = document.getElementById('bgMusic');
    if (audio.paused) audio.play(); else audio.pause();
}

function spawnHeart(e) {
    if(e.target.closest('.d-btn') || e.target.closest('.nav-btn')) return;
    const h = document.createElement('div');
    h.className = 'tap-heart'; h.innerHTML = '❤️';
    h.style.position = 'fixed';
    h.style.left = (e.clientX || e.touches[0].clientX) + 'px';
    h.style.top = (e.clientY || e.touches[0].clientY) + 'px';
    h.style.pointerEvents = 'none';
    h.style.zIndex = '1000';
    h.style.animation = 'floatUp 1.2s forwards';
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1200);
}

// --- LABYRINTHE ---
const layout = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 9], 
    [2, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 9], 
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];
let playerPos = { x: 0, y: 4 };

function drawMaze() {
    const mazeEl = document.getElementById('maze');
    if(!mazeEl) return;
    mazeEl.innerHTML = '';
    mazeEl.style.gridTemplateColumns = `repeat(${layout[0].length}, 1fr)`;
    layout.forEach((row, y) => {
        row.forEach((val, x) => {
            const cell = document.createElement('div');
            cell.className = 'cell ' + (val === 1 ? 'wall' : 'path');
            if (x === playerPos.x && y === playerPos.y) {
                cell.textContent = '❤️'; cell.classList.add('player');
            }
            mazeEl.appendChild(cell);
        });
    });
}

function move(dx, dy) {
    const nx = playerPos.x + dx, ny = playerPos.y + dy;
    if (!layout[ny] || layout[ny][nx] === undefined) return;
    if (layout[ny][nx] === 1) { 
        triggerHaptic(100); 
        const snd = document.getElementById('bumpSound');
        if(snd) { snd.currentTime=0; snd.play().catch(()=>{}); }
        playerPos = { x: 0, y: 4 }; 
    } else {
        playerPos = { x: nx, y: ny };
        if (nx === 14) {
            nextPage(4); // On simplifie pour mobile en allant direct à la fin
            return;
        }
    }
    drawMaze();
}

function restartExperience() {
    location.reload(); // Plus simple pour réinitialiser tous les états
}
