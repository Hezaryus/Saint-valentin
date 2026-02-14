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

function startExperience() {
    document.getElementById('bgMusic').play().catch(() => {});
    initMicrophone();
    nextPage(2);
}

function nextPage(n) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    isMazeActive = (n === 'maze');

    let targetId = 'p' + n;
    if (n === 'maze') targetId = 'p-maze';

    setTimeout(() => {
        const target = document.getElementById(targetId);
        if (target) target.classList.add('active');

        if(n === 2) startTimer();
        if(n === 3) initScratch();
        if(n === 'maze') drawMaze();
        if(n === 4) {
            document.getElementById('candles-area').style.cssText = "opacity:1; pointer-events:all;";
            listeningToBlow = true;
            document.getElementById('maze-game-wrapper').style.display = 'block';
            let iframe = document.getElementById('scene-container');
            if(iframe) iframe.remove();
        }
    }, 500);
}

function handleCandle(el) {
    if(!el.classList.contains('off')) triggerHaptic(50); 
    el.classList.toggle('off');
    const offCount = document.querySelectorAll('.candle.off').length;
    const starField = document.getElementById('star-field');
    const darkOverlay = document.getElementById('dark-overlay');
    const msg = document.getElementById('secret-msg');

    starField.style.opacity = offCount / 3;
    darkOverlay.style.opacity = (offCount / 3) * 0.95;

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
    l.classList.remove('fold-animation');
    l.classList.add('unfold-animation');
    // On garde la pluie de pétales de roses à l'ouverture, c'est très joli
    for(let i=0; i<45; i++) setTimeout(createPetal, i*120);
}

function closeLetter() {
    const l = document.getElementById('letter');
    l.classList.remove('unfold-animation');
    l.classList.add('fold-animation');
    setTimeout(() => {
        l.style.display = 'none';
        document.getElementById('letter-btn').style.display = 'inline-block';
        document.getElementById('final-icon').style.display = 'block';
        const offCount = document.querySelectorAll('.candle.off').length;
        if (offCount < 3) {
            document.getElementById('candles-area').style.opacity = '1';
        }
    }, 800);
}

function toggleMusic(e) {
    const audio = document.getElementById('bgMusic');
    if (audio.paused) { audio.play(); if(e && e.target) e.target.style.opacity = "1"; }
    else { audio.pause(); if(e && e.target) e.target.style.opacity = "0.6"; }
}

// LA FONCTION SPAWNHEART A ÉTÉ SUPPRIMÉE ICI

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
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = "#c0c0c0"; 
    ctx.fillRect(0, 0, 280, 150);
    ctx.fillStyle = "#333";
    ctx.font = "20px Arial";
    ctx.fillText("Gratte-moi...", 90, 80);

    let isDrawing = false;
    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const scratch = (e) => {
        if (!isDrawing) return;
        if(e.cancelable) e.preventDefault();
        triggerHaptic(5);
        const pos = getPos(e);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
        ctx.fill();
    };

    canvas.addEventListener('mousedown', () => isDrawing = true);
    canvas.addEventListener('touchstart', (e) => { isDrawing = true; if(e.cancelable) e.preventDefault(); }, {passive: false});
    window.addEventListener('mouseup', () => isDrawing = false);
    window.addEventListener('touchend', () => isDrawing = false);
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('touchmove', scratch, {passive: false});
}

function createPetal() {
    const p = document.createElement('div');
    const size = Math.random()*12+8;
    p.style.cssText = `position:fixed;top:-20px;background:var(--rose-petal);width:${size}px;height:${size}px;border-radius:50% 0 50% 50%;left:${Math.random()*100}vw;z-index:200;pointer-events:none;`;
    p.animate([{transform:'translateY(0) rotate(0deg)'},{transform:`translateY(105vh) rotate(${Math.random()*720}deg)`}], {duration:4000+Math.random()*4000}).onfinish=()=>p.remove();
    document.body.appendChild(p);
}

// --- CONTENU DES SCENES (MODIFIÉ POUR MOBILE) ---

const finishBtnStyle = `
    #next-step-btn { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); padding: 15px 30px; background: #be123c; color: white; border: none; border-radius: 30px; font-family: sans-serif; font-size: 1rem; cursor: pointer; opacity: 0; transition: opacity 1s; z-index: 200; box-shadow: 0 4px 15px rgba(190, 18, 60, 0.4); }
`;

const commonSceneCSS = `
    ${finishBtnStyle} 
    :root { --night-sky: #0f172a; --night-glow: #1e293b; } 
    body { margin: 0; padding: 0; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle at top, var(--night-glow), var(--night-sky)); font-family: 'Segoe UI', sans-serif; overflow: hidden; touch-action: none; } 
    .star { position: absolute; background: white; border-radius: 50%; opacity: 0.5; animation: twinkle var(--duration) infinite ease-in-out; z-index: 0; } 
    @keyframes twinkle { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } } 
    .cloud { position: absolute; background: rgba(255, 255, 255, 0.12); border-radius: 50px; filter: blur(12px); animation: drift linear infinite; z-index: 2; } 
    @keyframes drift { from { left: 110%; } to { left: -35%; } } 
    #moon { position: absolute; top: 50px; right: 15%; width: 80px; height: 80px; background: #fefce8; border-radius: 50%; box-shadow: 0 0 50px rgba(254, 252, 232, 0.3); z-index: 1; } 
    #stage { position: relative; width: 100%; height: 400px; display: flex; align-items: flex-end; justify-content: center; overflow: hidden; } 
    .speech-bubble { position: absolute; bottom: 110px; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); padding: 8px 15px; border-radius: 15px; border: 1px solid rgba(255, 255, 255, 0.2); color: white; font-size: 0.9rem; white-space: nowrap; opacity: 0; transform: translateY(10px); transition: all 0.5s ease; z-index: 100; } 
    .speech-bubble::after { content: ''; position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid rgba(255, 255, 255, 0.15); } 
    .speech-bubble.visible { opacity: 1; transform: translateY(0); } 
    .character-wrapper { position: absolute; bottom: 35px; display: flex; flex-direction: column; align-items: center; transition: left 0.4s cubic-bezier(0.25, 1, 0.5, 1), right 0.4s; } 
    .emoji { font-size: 65px; filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.1)); user-select: none; } 
    #julia { left: 10%; z-index: 5; } 
    #boy-wrapper { right: 10%; } 
    #action-btn { margin-top: 30px; padding: 18px 50px; background: rgba(255, 255, 255, 0.05); color: white; border: 2px solid rgba(255, 255, 255, 0.5); border-radius: 40px; font-size: 1.1rem; font-weight: bold; cursor: pointer; backdrop-filter: blur(5px); z-index: 20; } 
    .sparkle { position: absolute; pointer-events: none; animation: float-up 2s ease-out forwards; } 
    @keyframes float-up { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; } }
    @media (max-width: 600px) {
        .emoji { font-size: 45px; }
        #stage { height: 350px; }
        .speech-bubble { bottom: 95px; font-size: 0.8rem; }
    }
`;

const finishScript = `
    function showNextButton() {
        const btn = document.createElement('button');
        btn.id = 'next-step-btn';
        btn.innerHTML = 'Continuer ❤️';
        btn.onclick = () => window.parent.nextPage(4);
        document.body.appendChild(btn);
        setTimeout(() => btn.style.opacity = '1', 100);
    }
`;

const htmlAmour = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${commonSceneCSS}</style></head><body> 
<div id="moon"></div> 
<div id="stage"> 
    <div class="cloud" style="width:130px; height:50px; top:15%; animation-duration: 35s;"></div> 
    <div id="julia" class="character-wrapper"><div class="emoji">👩</div></div> 
    <div id="boy-wrapper" class="character-wrapper"> 
        <div id="bubble" class="speech-bubble">Soun d'amour, un bisou ? 💋</div> 
        <div class="emoji">👦</div> 
    </div> 
</div> 
<button id="action-btn">S'approcher 🌙</button> 
<script>${finishScript} 
const julia = document.getElementById('julia'); 
const boyWrapper = document.getElementById('boy-wrapper'); 
const bubble = document.getElementById('bubble'); 
const btn = document.getElementById('action-btn'); 
const stage = document.getElementById('stage'); 
let juliaPos = 10; 
let finished = false; 
const LIMIT_POS = window.innerWidth < 600 ? 55 : 75; 
const STEP = window.innerWidth < 600 ? 6 : 7;
btn.onclick = () => { 
    if (finished) return; 
    if (juliaPos < LIMIT_POS) { 
        juliaPos += STEP; 
        julia.style.left = juliaPos + '%'; 
        if (juliaPos > 30) bubble.classList.add('visible'); 
        julia.animate([{transform:'translateY(0)'},{transform:'translateY(-12px)'},{transform:'translateY(0)'}], 350); 
    } else { 
        finished = true; 
        btn.style.opacity = '0'; 
        bubble.style.transform = window.innerWidth < 600 ? 'translateX(-80px)' : 'translateX(-115px)'; 
        bubble.innerHTML = "Mwah! Je t'aime fort mon cœur ❤️"; 
        setTimeout(() => { 
            julia.querySelector('.emoji').innerHTML = '👩‍❤️‍💋‍👨'; 
            boyWrapper.querySelector('.emoji').style.opacity = '0'; 
            for(let i=0; i<30; i++) setTimeout(spawnSparkle, i*30); 
            showNextButton(); 
        }, 200); 
    } 
}; 
function spawnSparkle() { 
    const s = document.createElement('div'); 
    s.className = 'sparkle'; 
    s.innerHTML = ['❤️', '✨', '💖', '💋'][Math.floor(Math.random()*4)]; 
    s.style.left = (juliaPos+8)+'%'; 
    s.style.bottom = '80px'; 
    s.style.setProperty('--dx', (Math.random()-0.5)*250+'px'); 
    s.style.setProperty('--dy', '-'+(Math.random()*200+100)+'px'); 
    stage.appendChild(s); 
} 
<\/script></body></html>`;

const htmlBanane = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${commonSceneCSS}</style></head><body> 
<div id="moon"></div> 
<div id="stage"> 
    <div class="cloud" style="width:130px; height:50px; top:15%; animation-duration: 35s;"></div> 
    <div id="julia" class="character-wrapper"><div class="emoji">👩</div></div> 
    <div id="boy-wrapper" class="character-wrapper"> 
        <div id="bubble" class="speech-bubble">Soun d'amour, un bisou ? 💋</div> 
        <div class="emoji">👦</div> 
    </div> 
</div> 
<button id="action-btn">S'approcher 🌙</button> 
<script>${finishScript} 
const julia = document.getElementById('julia'); 
const boyWrapper = document.getElementById('boy-wrapper'); 
const bubble = document.getElementById('bubble'); 
const btn = document.getElementById('action-btn'); 
let juliaPos = 10; 
let finished = false; 
const LIMIT_POS = window.innerWidth < 600 ? 55 : 75; 
const STEP = window.innerWidth < 600 ? 5 : 6;
btn.onclick = () => { 
    if (finished) return; 
    if (juliaPos < LIMIT_POS) { 
        juliaPos += STEP; 
        julia.style.left = juliaPos + '%'; 
        if (juliaPos > 25) bubble.classList.add('visible'); 
        julia.animate([{transform:'translateY(0)'},{transform:'translateY(-12px)'},{transform:'translateY(0)'}], 350); 
    } else { 
        finished = true; 
        btn.style.opacity = '0'; 
        boyWrapper.style.right = window.innerWidth < 600 ? '5%' : '2%'; 
        bubble.style.transform = 'translateX(-40px)'; 
        setTimeout(() => { 
            bubble.innerHTML = "Eh Non, c'était une banane ! 🍌"; 
            boyWrapper.querySelector('.emoji').innerHTML = '🍌'; 
            for(let i=0; i<30; i++) setTimeout(spawnSparkle, i*30); 
            showNextButton(); 
        }, 100); 
    } 
}; 
function spawnSparkle() { 
    const s = document.createElement('div'); 
    s.className = 'sparkle'; 
    s.innerHTML = ['🍌', '😂', '✨'][Math.floor(Math.random()*3)]; 
    s.style.right = '5%'; 
    s.style.bottom = '100px'; 
    s.style.setProperty('--dx', (Math.random()-0.5)*300+'px'); 
    s.style.setProperty('--dy', '-'+(Math.random()*250+100)+'px'); 
    document.getElementById('stage').appendChild(s); 
} 
<\/script></body></html>`;

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
        triggerHaptic(200); 
        const snd = document.getElementById('bumpSound');
        if(snd) { snd.currentTime=0; snd.play().catch(()=>{}); }
        playerPos = { x: 0, y: 4 }; 
    }
    else {
        playerPos = { x: nx, y: ny };
        if (nx === 14) {
            document.getElementById('maze-game-wrapper').style.display = 'none';
            let oldIframe = document.getElementById('scene-container');
            if (oldIframe) oldIframe.remove();
            const iframe = document.createElement('iframe');
            iframe.id = 'scene-container';
            iframe.style.display = 'block';
            document.getElementById('p-maze').appendChild(iframe);
            const sceneContent = (ny === 3) ? htmlBanane : htmlAmour;
            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(sceneContent);
            doc.close();
            return;
        }
    }
    drawMaze();
}

document.addEventListener('keydown', (e) => {
    if(!isMazeActive) return;
    if(e.key === "ArrowUp") move(0, -1);
    if(e.key === "ArrowDown") move(0, 1);
    if(e.key === "ArrowLeft") move(-1, 0);
    if(e.key === "ArrowRight") move(1, 0);
});

function restartExperience() {
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
        p.classList.remove('blur-effect');
    });
    document.getElementById('p1').classList.add('active');
    document.querySelectorAll('.candle').forEach(c => c.classList.remove('off'));
    document.getElementById('candles-area').style.opacity = '0';
    document.getElementById('candles-area').style.pointerEvents = 'none';
    document.getElementById('star-field').style.opacity = '0';
    document.getElementById('dark-overlay').style.opacity = '0';
    document.getElementById('secret-msg').style.opacity = '0';
    listeningToBlow = false;
    const l = document.getElementById('letter');
    l.style.display = 'none';
    l.classList.remove('unfold-animation', 'fold-animation');
    document.getElementById('letter-btn').style.display = 'inline-block';
    document.getElementById('final-icon').style.display = 'block';
    playerPos = { x: 0, y: 4 };
    isMazeActive = false;
    document.getElementById('maze-game-wrapper').style.display = 'block';
    const iframe = document.getElementById('scene-container');
    if (iframe) iframe.remove();
    initScratch();
}
