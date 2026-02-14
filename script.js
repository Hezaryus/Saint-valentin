const START_DATE = new Date(2025, 11, 10);
let audioContext, analyser, dataArray, listeningToBlow = false;
let isMazeActive = false;

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
    field.innerHTML = ''; 
    for (let i = 0; i < 150; i++) {
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
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        audioContext.createMediaStreamSource(stream).connect(analyser);
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        detectBlow();
    } catch(e) { console.log("Micro non dispo"); }
}

function detectBlow() {
    if (!listeningToBlow) return requestAnimationFrame(detectBlow);
    if (!analyser || !dataArray) return requestAnimationFrame(detectBlow);
    analyser.getByteFrequencyData(dataArray);
    let avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const flames = document.querySelectorAll('.candle:not(.off) .flame');
    flames.forEach(f => {
        let intensity = Math.min(avg / 50, 1);
        f.style.transform = `translateX(-50%) scale(${1 - intensity * 0.4})`;
    });
    if (avg > 55) {
        const on = document.querySelectorAll('.candle:not(.off)');
        if (on.length > 0) handleCandle(on[Math.floor(Math.random()*on.length)]);
    }
    requestAnimationFrame(detectBlow);
}

function startExperience() {
    document.getElementById('bgMusic').play().catch(() => {});
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
    }, 500);
}

function handleCandle(el) {
    if(!el.classList.contains('off')) triggerHaptic(50); 
    el.classList.toggle('off');
    const offCount = document.querySelectorAll('.candle.off').length;
    document.getElementById('star-field').style.opacity = offCount / 3;
    document.getElementById('dark-overlay').style.opacity = (offCount / 3) * 0.95;
    const msg = document.getElementById('secret-msg');
    if (offCount === 3) {
        msg.style.opacity = "1";
        document.querySelector('.page.active').classList.add('blur-effect');
    } else {
        msg.style.opacity = "0";
        document.querySelector('.page.active').classList.remove('blur-effect');
    }
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
    for(let i=0; i<45; i++) setTimeout(createPetal, i*120);
}

function closeLetter() {
    const l = document.getElementById('letter');
    l.style.display = 'none';
    document.getElementById('letter-btn').style.display = 'inline-block';
    document.getElementById('final-icon').style.display = 'block';
    if (document.querySelectorAll('.candle.off').length < 3) {
        document.getElementById('candles-area').style.opacity = '1';
    }
}

function toggleMusic(e) {
    const audio = document.getElementById('bgMusic');
    if (audio.paused) audio.play(); else audio.pause();
}

function spawnHeart(e) {
    if(e.target.closest('#game-board') || e.target.closest('.d-btn')) return;
    const h = document.createElement('div');
    h.className = 'tap-heart'; h.innerHTML = '❤️';
    h.style.left = e.clientX + 'px'; h.style.top = e.clientY + 'px';
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1200);
}

function startTimer() {
    const timerEl = document.getElementById('timer');
    const titleEl = document.getElementById('dynamic-days');
    setInterval(() => {
        const now = new Date();
        const diff = now - START_DATE;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        titleEl.textContent = `${days} Jours d'Amour`;
        timerEl.textContent = `${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
}

function initScratch() {
    const canvas = document.getElementById('scratch-canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "#c0c0c0"; ctx.fillRect(0, 0, 280, 150);
    ctx.fillStyle = "#333"; ctx.font = "20px Arial"; ctx.fillText("Gratte-moi...", 90, 80);
    let isDrawing = false;
    const scratch = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fill();
    };
    canvas.onmousedown = canvas.ontouchstart = () => isDrawing = true;
    window.onmouseup = window.ontouchend = () => isDrawing = false;
    canvas.onmousemove = canvas.ontouchmove = scratch;
}

function createPetal() {
    const p = document.createElement('div');
    const size = Math.random()*12+8;
    p.style.cssText = `position:fixed;top:-20px;background:var(--rose-petal);width:${size}px;height:${size}px;border-radius:50% 0 50% 50%;left:${Math.random()*100}vw;z-index:200;pointer-events:none;`;
    p.animate([{transform:'translateY(0)'},{transform:`translateY(105vh) rotate(720deg)`}], {duration:4000+Math.random()*4000}).onfinish=()=>p.remove();
    document.body.appendChild(p);
}

// Labyrinthe et logique (Inchangé)
const layout = [[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],[1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],[1,0,1,0,0,0,1,0,0,0,0,0,1,0,9],[2,0,1,1,1,0,1,0,1,1,1,1,1,1,1],[1,0,1,0,0,0,1,0,0,0,0,0,1,0,9],[1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],[1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]];
let playerPos = { x: 0, y: 4 };
function drawMaze() {
    const mazeEl = document.getElementById('maze');
    mazeEl.innerHTML = '';
    mazeEl.style.gridTemplateColumns = `repeat(15, 1fr)`;
    layout.forEach((row, y) => row.forEach((val, x) => {
        const cell = document.createElement('div');
        cell.className = 'cell ' + (val === 1 ? 'wall' : 'path');
        if (x === playerPos.x && y === playerPos.y) { cell.textContent = '❤️'; cell.classList.add('player'); }
        mazeEl.appendChild(cell);
    }));
}
function move(dx, dy) {
    const nx = playerPos.x + dx, ny = playerPos.y + dy;
    if (layout[ny] && layout[ny][nx] !== 1) {
        playerPos = { x: nx, y: ny };
        if (nx === 14) nextPage(4); else drawMaze();
    } else { triggerHaptic(100); playerPos = { x: 0, y: 4 }; drawMaze(); }
}
function restartExperience() { location.reload(); }
