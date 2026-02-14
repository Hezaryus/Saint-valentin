// --- CONFIG & DATA ---
const START_DATE = new Date(2023, 11, 10); // Ta date de début
let playerPos = { x: 0, y: 4 };
const layout = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
    [1,1,0,1,0,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,0,0,1,0,0,1],
    [0,0,1,1,1,1,0,1,1,1,1,1,1,0,0],
    [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// --- INITIALISATION ---
window.addEventListener('load', () => {
    // Loader
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 800);
    }, 1500);

    updateCounter();
    setInterval(updateCounter, 1000);
    createStars();
    initScratch();
    drawMaze();
});

// --- COMPTEUR ---
function updateCounter() {
    const now = new Date();
    const diff = now - START_DATE;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    
    const el = document.getElementById('counter');
    if(el) el.innerHTML = `${days}j ${hours}h ${mins}m ${secs}s`;
}

// --- NAVIGATION ---
function nextPage(curr, next) {
    document.getElementById('p' + curr).classList.remove('active');
    document.getElementById('p' + next).classList.add('active');
    if(next === 2) startBlowDetection();
    if(next === 3) document.getElementById('scratch-container').style.display = 'block';
}

// --- BOUGIES & MICRO ---
let blowCount = 0;
function startBlowDetection() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const src = ctx.createMediaStreamSource(stream);
        const processor = ctx.createAnalyser();
        processor.fftSize = 256;
        src.connect(processor);
        const data = new Uint8Array(processor.frequencyBinCount);

        function check() {
            processor.getByteFrequencyData(data);
            let sum = data.reduce((a, b) => a + b, 0);
            if (sum > 4000) { // Détection du souffle
                const candles = document.querySelectorAll('.candle:not(.off)');
                if (candles.length > 0) {
                    candles[0].classList.add('off');
                    blowCount++;
                    if (blowCount >= 3) {
                        setTimeout(() => nextPage(2, 3), 1000);
                        stream.getTracks().forEach(t => t.stop());
                        return;
                    }
                }
            }
            requestAnimationFrame(check);
        }
        check();
    }).catch(err => {
        // Fallback si micro refusé : clic sur les bougies
        document.querySelectorAll('.candle').forEach(c => {
            c.onclick = () => {
                c.classList.add('off');
                blowCount++;
                if(blowCount >= 3) setTimeout(() => nextPage(2, 3), 1000);
            };
        });
    });
}

// --- GRATTAGE ---
function initScratch() {
    const canvas = document.getElementById('scratch-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 280; canvas.height = 150;
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let isDrawing = false;
    function scratch(e) {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.pageX || e.touches[0].pageX) - rect.left - window.scrollX;
        const y = (e.pageY || e.touches[0].pageY) - rect.top - window.scrollY;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fill();
    }
    
    canvas.onmousedown = canvas.ontouchstart = () => isDrawing = true;
    canvas.onmouseup = canvas.ontouchend = () => isDrawing = false;
    canvas.onmousemove = canvas.ontouchmove = scratch;
}

// --- LABYRINTHE ---
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
    if (ny >= 0 && ny < layout.length && nx >= 0 && nx < layout[0].length && layout[ny][nx] === 0) {
        playerPos = { x: nx, y: ny };
        drawMaze();
        if (nx === 14) setTimeout(() => nextPage(3, 4), 500);
    }
}

// --- LETTRE ---
function openLetter() {
    const letter = document.getElementById('letter');
    const btn = document.getElementById('letter-btn');
    letter.style.display = 'flex';
    letter.style.flexDirection = 'column';
    if(btn) btn.style.display = 'none';
}

// --- EFFETS ---
function createStars() {
    const field = document.getElementById('star-field');
    for (let i = 0; i < 100; i++) {
        const s = document.createElement('div');
        s.className = 'bg-star';
        s.style.width = s.style.height = Math.random() * 2 + 1 + 'px';
        s.style.left = Math.random() * 100 + 'vw';
        s.style.top = Math.random() * 100 + 'vh';
        field.appendChild(s);
    }
}

function spawnHeart(e) {
    if(e.target.closest('#game-board') || e.target.closest('.d-btn') || e.target.tagName === 'BUTTON') return;
    const h = document.createElement('div');
    h.textContent = '❤️'; h.style.position = 'fixed';
    h.style.left = (e.clientX || e.touches[0].clientX) + 'px';
    h.style.top = (e.clientY || e.touches[0].clientY) + 'px';
    h.style.pointerEvents = 'none'; h.style.animation = 'floatUp 2s forwards';
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 2000);
}

document.addEventListener('touchstart', spawnHeart);
window.onkeydown = (e) => {
    if(e.key === 'ArrowUp') move(0, -1);
    if(e.key === 'ArrowDown') move(0, 1);
    if(e.key === 'ArrowLeft') move(-1, 0);
    if(e.key === 'ArrowRight') move(1, 0);
};
