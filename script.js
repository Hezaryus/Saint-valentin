// --- CONFIGURATION ---
const START_DATE = new Date(2025, 11, 10); // Attention: Mois 11 = Décembre
let audioContext, analyser, dataArray, listeningToBlow = false;
let isMazeActive = false;

// --- DÉMARRAGE ---
function createStars() {
    const field = document.getElementById('star-field');
    field.innerHTML = '';
    for (let i = 0; i < 150; i++) {
        const s = document.createElement('div');
        s.className = 'bg-star';
        const size = Math.random() * 2 + 1;
        s.style.width = size + 'px';
        s.style.height = size + 'px';
        s.style.left = Math.random() * 100 + 'vw';
        s.style.top = Math.random() * 100 + 'vh';
        s.style.setProperty('--duration', (Math.random() * 3 + 2) + 's');
        field.appendChild(s);
    }
}
createStars();

// --- AUDIO & MICROPHONE ---
async function initMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        
        // AJOUT : Forcer le démarrage si c'est suspendu
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        analyser = audioContext.createAnalyser();
        // Le reste ne change pas...
        audioContext.createMediaStreamSource(stream).connect(analyser);
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        detectBlow();
    } catch(e) {
        console.error("Erreur Micro :", e); // Affiche l'erreur exacte
        alert("Active le micro pour souffler les bougies ! 🎤"); // Prévient l'utilisateur
    }
}

function detectBlow() {
    if (!listeningToBlow || !analyser || !dataArray) {
        return requestAnimationFrame(detectBlow);
    }

    analyser.getByteFrequencyData(dataArray);
    
    // --- FILTRAGE AVANCÉ ---
    // On ignore les fréquences de 0 à 40 (Bruit de manipulation, frottements, moteur)
    // Le souffle humain se situe plus haut dans le spectre.
    let sum = 0;
    let count = 0;
    for(let i = 40; i < dataArray.length; i++) { 
        sum += dataArray[i];
        count++;
    }
    
    let avg = sum / count;

    // --- RÉGLAGES DE SENSIBILITÉ ---
    // SEUIL_SOUFFLE : Monte à 80 ou 90 si c'est encore trop sensible.
    const SEUIL_SOUFFLE = 0; 
    
    const flames = document.querySelectorAll('.candle:not(.off) .flame');
    
    flames.forEach(f => {
        // L'effet visuel ne s'active que si on dépasse un petit seuil
        let visualIntensity = avg > 30 ? Math.min((avg - 30) / 70, 1) : 0;
        f.style.transform = `translateX(-50%) scale(${1 - visualIntensity * 0.5})`;
    });

    if (avg > SEUIL_SOUFFLE) { 
        const on = document.querySelectorAll('.candle:not(.off)');
        if (on.length > 0) {
            handleCandle(on[Math.floor(Math.random() * on.length)]);
            
            // On bloque la détection plus longtemps (800ms) pour éviter
            // qu'un seul mouvement brusque n'éteigne TOUTES les bougies.
            listeningToBlow = false;
            setTimeout(() => { listeningToBlow = true; }, 800); 
        }
    }
    requestAnimationFrame(detectBlow);
}

// --- NAVIGATION ---
function startExperience() {
    const bgMusic = document.getElementById('bgMusic');
    bgMusic.volume = 0.5;
    bgMusic.play().catch(e => console.log("Autoplay bloqué, attente interaction"));
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
            // Activation des bougies et du mode final
            const candleArea = document.getElementById('candles-area');
            candleArea.style.opacity = "1";
            candleArea.style.pointerEvents = "all";
            listeningToBlow = true;
            
            // Nettoyage de l'iframe du jeu
            let iframe = document.getElementById('scene-container');
            if(iframe) {
                iframe.src = 'about:blank';
                iframe.style.display = 'none';
            }
            document.getElementById('maze-game-wrapper').style.display = 'block';
        }
    }, 500);
}

// --- BOUGIES ---
function handleCandle(el) {
    if(el.classList.contains('off')) return; // Évite de rallumer
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

// --- LETTRE ---
function openLetter() {
    document.getElementById('candles-area').style.opacity = '0';
    document.getElementById('letter-btn').style.display = 'none';
    document.getElementById('final-icon').style.display = 'none';
    
    const l = document.getElementById('letter');
    l.style.display = 'block';
    l.classList.remove('fold-animation');
    l.classList.add('unfold-animation');
    
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

// --- CONTROLES AUDIO ---
function toggleMusic(e) {
    const audio = document.getElementById('bgMusic');
    if (audio.paused) {
        audio.play();
        if(e && e.target) e.target.style.opacity = "1";
    } else {
        audio.pause();
        if(e && e.target) e.target.style.opacity = "0.6";
    }
}

function toggleRain() {
    const audio = document.getElementById('rainAmbience');
    if (audio.paused) {
        audio.play();
        audio.volume = 0.3;
    } else {
        audio.pause();
    }
}

// --- EFFETS VISUELS ---
function spawnHeart(e) {
    if(e.target.closest('#game-board') || e.target.closest('.d-btn') || e.target.closest('.nav-btn')) return;
    
    const h = document.createElement('div');
    h.className = 'tap-heart';
    h.innerHTML = '❤️';
    h.style.left = e.clientX + 'px';
    h.style.top = e.clientY + 'px';
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

function createPetal() {
    const p = document.createElement('div');
    const size = Math.random()*12+8;
    p.style.cssText = `position:fixed;top:-20px;background:var(--rose-petal);width:${size}px;height:${size}px;border-radius:50% 0 50% 50%;left:${Math.random()*100}vw;z-index:200;pointer-events:none;`;
    
    p.animate([
        {transform:'translateY(0) rotate(0deg)'},
        {transform:`translateY(105vh) rotate(${Math.random()*720}deg)`}
    ], {
        duration: 4000 + Math.random()*4000
    }).onfinish = () => p.remove();
    
    document.body.appendChild(p);
}

// --- JEU DE GRATTAGE (Correction Mobile) ---
function initScratch() {
    const canvas = document.getElementById('scratch-canvas');
    if(!canvas) return;
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
        let clientX, clientY;
        
        if(e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const scratch = (e) => {
        if (!isDrawing) return;
        if(e.type === 'touchmove') e.preventDefault();
        
        const pos = getPos(e);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
        ctx.fill();
    };

    canvas.addEventListener('mousedown', () => isDrawing = true);
    window.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mousemove', scratch);

    canvas.addEventListener('touchstart', (e) => {
        isDrawing = true;
        e.preventDefault(); 
    }, { passive: false });
    
    window.addEventListener('touchend', () => isDrawing = false);
    canvas.addEventListener('touchmove', scratch, { passive: false });
}

// --- JEU DU LABYRINTHE ---
const finishBtnStyle = `
#next-step-btn {
    position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
    padding: 15px 30px; background: #be123c; color: white; border: none;
    border-radius: 30px; font-family: sans-serif; font-size: 1rem;
    cursor: pointer; opacity: 0; transition: opacity 1s; z-index: 200;
    box-shadow: 0 4px 15px rgba(190, 18, 60, 0.4);
}`;

const finishScript = `
function showNextButton() {
    const btn = document.createElement('button');
    btn.id = 'next-step-btn';
    btn.innerHTML = 'Continuer ❤️';
    btn.onclick = () => window.parent.nextPage(4);
    document.body.appendChild(btn);
    setTimeout(() => btn.style.opacity = '1', 100);
}`;

// HTML Injecté pour la fin
const htmlCommonStyle = `
:root { --night-sky: #0f172a; --night-glow: #1e293b; }
body { margin:0; padding:0; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center;
background: radial-gradient(circle at top, var(--night-glow), var(--night-sky)); font-family: 'Segoe UI', sans-serif; overflow:hidden; touch-action:none; }
.star { position:absolute; background:white; border-radius:50%; opacity:0.5; animation: twinkle var(--duration) infinite ease-in-out; }
@keyframes twinkle { 0%,100%{opacity:0.3;transform:scale(1);} 50%{opacity:1;transform:scale(1.2);} }
.cloud { position:absolute; background:rgba(255,255,255,0.12); border-radius:50px; filter:blur(12px); animation: drift linear infinite; }
@keyframes drift { from{left:110%;} to{left:-35%;} }
#moon { position:absolute; top:50px; right:15%; width:80px; height:80px; background:#fefce8; border-radius:50%; box-shadow:0 0 50px rgba(254,252,232,0.3); }
#stage { position:relative; width:100%; height:400px; display:flex; align-items:flex-end; justify-content:center; overflow:hidden; }
.speech-bubble { position:absolute; bottom:110px; background:rgba(255,255,255,0.15); backdrop-filter:blur(10px); padding:8px 15px; border-radius:15px; border:1px solid rgba(255,255,255,0.2); color:white; font-size:0.9rem; white-space:nowrap; opacity:0; transform:translateY(10px); transition:all 0.5s ease; z-index:100; }
.speech-bubble::after { content:''; position:absolute; bottom:-8px; left:50%; transform:translateX(-50%); border-left:8px solid transparent; border-right:8px solid transparent; border-top:8px solid rgba(255,255,255,0.15); }
.speech-bubble.visible { opacity:1; transform:translateY(0); }
.character-wrapper { position:absolute; bottom:35px; display:flex; flex-direction:column; align-items:center; transition:left 0.4s cubic-bezier(0.25,1,0.5,1); }
.emoji { font-size:65px; filter:drop-shadow(0 0 15px rgba(255,255,255,0.1)); user-select:none; }
#julia { left:10%; z-index:5; }
#boy-wrapper { right:10%; transition: right 0.6s ease; }
#action-btn { margin-top:30px; padding:18px 50px; background:rgba(255,255,255,0.05); color:white; border:2px solid rgba(255,255,255,0.5); border-radius:40px; font-size:1.1rem; font-weight:bold; cursor:pointer; backdrop-filter:blur(5px); z-index:20; }
.sparkle { position:absolute; pointer-events:none; animation:float-up 2s ease-out forwards; }
@keyframes float-up { 0% { transform: translate(0,0) scale(1); opacity:1; } 100% { transform: translate(var(--dx),var(--dy)) scale(0); opacity:0; } }
`;

const htmlAmour = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${finishBtnStyle} ${htmlCommonStyle}</style></head><body>
<div id="moon"></div><div id="stage"><div class="cloud" style="width:130px; height:50px; top:15%; animation-duration: 35s;"></div>
<div id="julia" class="character-wrapper"><div class="emoji">👩</div></div>
<div id="boy-wrapper" class="character-wrapper"><div id="bubble" class="speech-bubble">Soun d'amour, un bisou ? 💋</div><div class="emoji">👦</div></div></div>
<button id="action-btn">S'approcher 🌙</button>
<script>${finishScript}
const julia=document.getElementById('julia'), boyWrapper=document.getElementById('boy-wrapper'), bubble=document.getElementById('bubble'), btn=document.getElementById('action-btn'), stage=document.getElementById('stage');
let juliaPos=10, finished=false;
btn.onclick=()=>{
    if(finished)return;
    if(juliaPos<55){
        juliaPos+=7; julia.style.left=juliaPos+'%';
        if(juliaPos>35) bubble.classList.add('visible');
        julia.animate([{transform:'translateY(0)'},{transform:'translateY(-12px)'},{transform:'translateY(0)'}],350);
    }else{
        finished=true; btn.style.opacity='0';
        bubble.style.transform='translateX(-115px)'; bubble.innerHTML="Mwah! Je t'aime fort ❤️";
        setTimeout(()=>{
            julia.querySelector('.emoji').innerHTML='👩‍❤️‍💋‍👨'; boyWrapper.querySelector('.emoji').style.opacity='0';
            for(let i=0;i<30;i++) setTimeout(spawnSparkle,i*30);
            showNextButton();
        },200);
    }
};
function spawnSparkle(){
    const s=document.createElement('div'); s.className='sparkle';
    s.innerHTML=['❤️','✨','💖','💋'][Math.floor(Math.random()*4)];
    s.style.left=(juliaPos+8)+'%'; s.style.bottom='80px';
    s.style.setProperty('--dx',(Math.random()-0.5)*250+'px');
    s.style.setProperty('--dy','-'+(Math.random()*200+100)+'px');
    stage.appendChild(s);
}
</script></body></html>`;

const htmlBanane = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${finishBtnStyle} ${htmlCommonStyle}</style></head><body>
<div id="moon"></div><div id="stage"><div class="cloud" style="width:130px; height:50px; top:15%; animation-duration: 35s;"></div>
<div id="julia" class="character-wrapper"><div class="emoji">👩</div></div>
<div id="boy-wrapper" class="character-wrapper"><div id="bubble" class="speech-bubble">Soun d'amour, un bisou ? 💋</div><div class="emoji">👦</div></div></div>
<button id="action-btn">S'approcher 🌙</button>
<script>${finishScript}
const julia=document.getElementById('julia'), boyWrapper=document.getElementById('boy-wrapper'), bubble=document.getElementById('bubble'), btn=document.getElementById('action-btn');
let juliaPos=10, finished=false;
btn.onclick=()=>{
    if(finished)return;
    if(juliaPos<55){
        juliaPos+=6; julia.style.left=juliaPos+'%';
        if(juliaPos>30) bubble.classList.add('visible');
        julia.animate([{transform:'translateY(0)'},{transform:'translateY(-12px)'},{transform:'translateY(0)'}],350);
    }else{
        finished=true; btn.style.opacity='0';
        boyWrapper.style.right='2%';
        bubble.style.transform='translateX(-40px)';
        setTimeout(()=>{
            bubble.innerHTML="Eh Non, c'était une banane ! 🍌";
            boyWrapper.querySelector('.emoji').innerHTML='🍌';
            for(let i=0;i<30;i++) setTimeout(spawnSparkle,i*30);
            showNextButton();
        },100);
    }
};
function spawnSparkle(){
    const s=document.createElement('div'); s.className='sparkle';
    s.innerHTML=['🍌','😂','✨'][Math.floor(Math.random()*3)];
    s.style.right='5%'; s.style.bottom='100px';
    s.style.setProperty('--dx',(Math.random()-0.5)*300+'px');
    s.style.setProperty('--dy','-'+(Math.random()*250+100)+'px');
    document.getElementById('stage').appendChild(s);
}
</script></body></html>`;

// --- DONNÉES DU LABYRINTHE (RESTAURÉES) ---
const layout = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 9],
  [2, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1], // Ligne de départ
  [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// Position de départ restaurée (gauche)
let playerPos = { x: 0, y: 4 };

function drawMaze() {
    const mazeEl = document.getElementById('maze');
    if(!mazeEl) return;
    mazeEl.innerHTML = '';
    mazeEl.style.gridTemplateColumns = `repeat(${layout[0].length}, 1fr)`;
    
    layout.forEach((row, y) => {
        row.forEach((val, x) => {
            const cell = document.createElement('div');
            // Si val = 1 c'est un mur, sinon chemin
            cell.className = 'cell ' + (val === 1 ? 'wall' : 'path');
            
            // Affichage du joueur
            if (x === playerPos.x && y === playerPos.y) {
                cell.textContent = '❤️';
                cell.classList.add('player');
            }
            mazeEl.appendChild(cell);
        });
    });
}

function move(dx, dy) {
    const nx = playerPos.x + dx;
    const ny = playerPos.y + dy;

    // Vérification limites du tableau
    if (!layout[ny] || layout[ny][nx] === undefined) return;

    // Logique de collision et victoire
    if (layout[ny][nx] === 1) {
        // Mur -> Reset position si vous le souhaitez, ou juste bloquer (ici retour départ)
        playerPos = { x: 0, y: 4 };
        const mazeWrap = document.getElementById('maze-game-wrapper');
        mazeWrap.style.transform = "translateX(5px)";
        setTimeout(() => mazeWrap.style.transform = "translateX(0)", 100);
    } else {
        // Déplacement valide
        playerPos = { x: nx, y: ny };
        
        // CONDITION DE VICTOIRE (Basé sur votre code original: x=14 est la fin)
        // J'ai aussi ajouté la détection des cases 9 (banane) si le joueur tombe dessus
        if (nx === 14) {
            const isBanana = (layout[ny][nx] === 9);
            
            document.getElementById('maze-game-wrapper').style.display = 'none';
            
            let oldIframe = document.getElementById('scene-container');
            if (oldIframe) oldIframe.remove();

            const iframe = document.createElement('iframe');
            iframe.id = 'scene-container';
            iframe.style.display = 'block';
            document.getElementById('p-maze').appendChild(iframe);

            const sceneContent = isBanana ? htmlBanane : htmlAmour;
            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(sceneContent);
            doc.close();
            return;
        }
    }
    drawMaze();
}

// Support Clavier
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
    
    // Reset Maze
    playerPos = { x: 0, y: 4 }; // Reset à votre position gauche
    isMazeActive = false;
    document.getElementById('maze-game-wrapper').style.display = 'block';
    const iframe = document.getElementById('scene-container');
    if (iframe) iframe.remove();

}















