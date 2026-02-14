// --- LOGIQUE GLOBALE ---
const START_DATE = new Date(2025, 11, 10); // Mois 11 = Décembre
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

// --- HELPER HAPTIQUE ---
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

// --- MOBILE MAZE CONTROLS ---
function toggleMazeControlsForMobile() {
    const controls = document.querySelector('.maze-controls');
    if(!controls) return;
    if(window.innerWidth <= 600) controls.style.display = 'grid';
    else controls.style.display = 'none';
}

window.addEventListener('resize', toggleMazeControlsForMobile);
window.addEventListener('load', toggleMazeControlsForMobile);

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
            document.getElementById('candles-area').classList.add('visible');
            listeningToBlow = true;
        }
    }, 400);
}

function handleCandle(el) {
    if(!el.classList.contains('off')) triggerHaptic(50); 
    el.classList.toggle('off');
    const offCount = document.querySelectorAll('.candle.off').length;
    const starField = document.getElementById('star-field');
    const darkOverlay = document.getElementById('dark-overlay');
    const msg = document.getElementById('secret-msg');

    starField.style.opacity = offCount / 3;
    darkOverlay.style.opacity = (offCount / 3) * 0.9;

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

    document.getElementById('candles-area').style.visibility = 'hidden';
    document.getElementById('letter-btn').style.display = 'none';
    const l = document.getElementById('letter');
    l.style.display = 'flex'; 
    l.classList.remove('fold-animation');
    l.classList.add('unfold-animation');
    for(let i=0; i<30; i++) setTimeout(createPetal, i*120);
}

function closeLetter() {
    const l = document.getElementById('letter');
    l.classList.remove('unfold-animation');
    l.classList.add('fold-animation');
    setTimeout(() => {
        l.style.display = 'none';
        document.getElementById('letter-btn').style.display = 'inline-block';
        document.getElementById('candles-area').style.visibility = 'visible';
    }, 800);
}

function toggleMusic(e) {
    const audio = document.getElementById('bgMusic');
    if (audio.paused) { audio.play(); e.target.style.opacity = "1"; }
    else { audio.pause(); e.target.style.opacity = "0.4"; }
}

function spawnHeart(e) {
    // Correction : ne pas faire apparaître de coeur si on touche un bouton
    if(e.target.closest('#game-board') || e.target.closest('.d-btn') || e.target.closest('#scratch-canvas') || e.target.tagName === 'BUTTON') return;
    
    const h = document.createElement('div');
    h.className = 'tap-heart'; h.innerHTML = '❤️';
    h.style.left = e.clientX + 'px'; h.style.top = e.clientY + 'px';
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1200);
}

function startTimer() {
    const timerEl = document.getElementById('timer');
    const titleEl = document.getElementById('dynamic-days');
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

function initScratch() {
    const canvas = document.getElementById('scratch-canvas');
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = "#c0c0c0"; 
    ctx.fillRect(0, 0, 280, 150);
    ctx.fillStyle = "#444";
    ctx.font = "20px Poppins";
    ctx.textAlign = "center";
    ctx.fillText("Gratte-moi...", 140, 85);

    let isDrawing = false;
    const scratch = (e) => {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        const x = t.clientX - rect.left;
        const y = t.clientY - rect.top;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
    };

    canvas.addEventListener('mousedown', () => isDrawing = true);
    canvas.addEventListener('touchstart', (e) => { isDrawing = true; e.preventDefault(); }, {passive: false});
    window.addEventListener('mouseup', () => isDrawing = false);
    window.addEventListener('touchend', () => isDrawing = false);
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('touchmove', (e) => { scratch(e); e.preventDefault(); }, {passive: false});
}

function createPetal() {
    const p = document.createElement('div');
    const size = Math.random()*12+8;
    p.style.cssText = `position:fixed;top:-20px;background:var(--rose-petal);width:${size}px;height:${size}px;border-radius:50% 0 50% 50%;left:${Math.random()*100}vw;z-index:200;pointer-events:none;`;
    p.animate([{transform:'translateY(0) rotate(0deg)'},{transform:`translateY(105vh) rotate(${Math.random()*720}deg)`}], {duration:4000+Math.random()*4000}).onfinish=()=>p.remove();
    document.body.appendChild(p);
}

// --- CONTENU SCÈNE FINALE (CORRIGÉ POUR MOBILE) ---
// Utilisation de % et vh pour que les personnages soient toujours visibles
const finishBtnStyle = `#next-step-btn { position: absolute; bottom: 5%; left: 50%; transform: translateX(-50%); padding: 12px 25px; background: #be123c; color: white; border: none; border-radius: 30px; font-family: sans-serif; cursor: pointer; z-index: 100; font-size: 16px; }`;
const finishScript = `function showNextButton() { const btn = document.createElement('button'); btn.id = 'next-step-btn'; btn.innerHTML = 'Continuer ❤️'; btn.onclick = () => window.parent.nextPage(4); document.body.appendChild(btn); }`;

const htmlAmour = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${finishBtnStyle} body { margin: 0; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0f172a; overflow: hidden; color: white; } .emoji { font-size: 12vh; transition: all 0.5s; position: absolute; bottom: 20%; } #julia { left: 10%; } #boy { right: 10%; } #btn { position: absolute; bottom: 10%; padding: 10px 20px; border-radius: 20px; background: rgba(255,255,255,0.1); border: 1px solid white; color: white; cursor: pointer; } </style></head><body><div id="julia" class="emoji">👩</div><div id="boy" class="emoji">👦</div><button id="btn">S'approcher 🌙</button><script>${finishScript} let pos = 10; document.getElementById('btn').onclick = function() { if(pos < 40) { pos += 10; document.getElementById('julia').style.left = pos + '%'; } else { this.style.display='none'; document.getElementById('julia').innerHTML = '👩‍❤️‍💋‍👨'; document.getElementById('boy').style.display = 'none'; document.getElementById('julia').style.left = '50%'; document.getElementById('julia').style.transform = 'translateX(-50%)'; showNextButton(); } }; <\/script></body></html>`;

const htmlBanane = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${finishBtnStyle} body { margin: 0; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0f172a; overflow: hidden; color: white; } .emoji { font-size: 12vh; transition: all 0.5s; position: absolute; bottom: 20%; } #julia { left: 10%; } #boy { right: 10%; } #btn { position: absolute; bottom: 10%; padding: 10px 20px; border-radius: 20px; background: rgba(255,255,255,0.1); border: 1px solid white; color: white; cursor: pointer; } </style></head><body><div id="julia" class="emoji">👩</div><div id="boy" class="emoji">👦</div><button id="btn">S'approcher 🌙</button><script>${finishScript} let pos = 10; document.getElementById('btn').onclick = function() { if(pos < 40) { pos += 10; document.getElementById('julia').style.left = pos + '%'; } else { this.style.display='none'; document.getElementById('boy').innerHTML = '🍌'; document.getElementById('julia').style.left = '35%'; alert("C'était une banane ! 😂"); showNextButton(); } }; <\/script></body></html>`;

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
    mazeEl.innerHTML = '';
    // La grille s'adapte automatiquement avec le CSS (repeat)
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
    }
    else {
        playerPos = { x: nx, y: ny };
        if (nx === 14) {
            document.getElementById('maze-game-wrapper').style.display = 'none';
            const iframe = document.createElement('iframe');
            iframe.id = 'scene-container';
            iframe.style.display = 'block';
            document.getElementById('p-maze').appendChild(iframe);
            const sceneContent = (ny === 3) ? htmlBanane : htmlAmour;
            const doc = iframe.contentWindow.document;
            doc.open(); doc.write(sceneContent); doc.close();
            return;
        }
    }
    drawMaze();
}

function restartExperience() {
    location.reload(); 
}