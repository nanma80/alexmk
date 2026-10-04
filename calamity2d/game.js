// =============================================
// CALAMITY 2D — Top-Down Musou Game
// =============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Configuration ---
const C = {
    W: 960, H: 640,
    MAP_W: 1920, MAP_H: 2880,
    TILE: 48,
    PLAYER_SPEED: 3.5,
    PLAYER_RADIUS: 14,
    ENEMY_RADIUS: 12,
    COMBO_WINDOW: 28,
    SPECIAL_COOLDOWN: 180,
    IFRAMES: 50,
    KNOCKBACK: 8,
    HIT_STOP_FRAMES: 3,
};

// --- Level Definitions ---
const LEVELS = [
    {
        name: 'Tutorial',
        subtitle: 'Learn the basics of combat',
        playerHP: 120,
        isTutorial: true,
        zones: {
            GOAL_Y: 300, GATE2_Y: 500,
            BATTLE2_START: 600, BATTLE2_END: 1150,
            GATE1_Y: 1250, BATTLE1_START: 1350, BATTLE1_END: 1850,
            SPECIAL_Y: 2000, COMBO_Y: 2200, ATTACK_Y: 2400,
            START_Y: 2650,
        },
    },
    {
        name: 'The Dark March',
        subtitle: 'Three hordes bar your path',
        playerHP: 150,
        isTutorial: false,
        zones: {
            GOAL_Y: 200, GATE3_Y: 350,
            BATTLE3_START: 450, BATTLE3_END: 900,
            GATE2_Y: 1000, BATTLE2_START: 1100, BATTLE2_END: 1550,
            GATE1_Y: 1650, BATTLE1_START: 1750, BATTLE1_END: 2250,
            START_Y: 2550,
        },
        hordes: [
            { types: [{n:8,t:'soldier'},{n:4,t:'scout'}] },
            { types: [{n:8,t:'soldier'},{n:5,t:'scout'},{n:3,t:'knight'}] },
            { types: [{n:8,t:'soldier'},{n:6,t:'scout'},{n:6,t:'knight'}] },
        ],
    },
    {
        name: 'The Flooded Ruins',
        subtitle: 'Watch your step — water blocks the way',
        playerHP: 150,
        isTutorial: false,
        zones: {
            GOAL_Y: 200, GATE3_Y: 350,
            BATTLE3_START: 450, BATTLE3_END: 900,
            GATE2_Y: 1000, BATTLE2_START: 1100, BATTLE2_END: 1550,
            GATE1_Y: 1650, BATTLE1_START: 1750, BATTLE1_END: 2250,
            START_Y: 2550,
        },
        hordes: [
            { types: [{n:8,t:'soldier'},{n:5,t:'scout'}] },
            { types: [{n:7,t:'soldier'},{n:5,t:'scout'},{n:4,t:'knight'}] },
            { types: [{n:8,t:'soldier'},{n:6,t:'scout'},{n:6,t:'knight'}] },
        ],
    },
];

const TUTORIAL_STEPS = [
    { id: 'move',    text: 'Use WASD to move around',                key: 'WASD' },
    { id: 'attack',  text: 'Left Click to swing your sword!',        key: 'CLICK' },
    { id: 'combo',   text: 'Click rapidly to chain a 3-hit combo!',  key: 'CLICK x3' },
    { id: 'special', text: 'Press J for a spin attack! (SPACE = Ultra)', key: 'J' },
    { id: 'horde1',  text: 'Defeat all enemies to open the gate!',   key: '' },
    { id: 'horde2',  text: 'Defeat the second horde!',               key: '' },
    { id: 'goal',    text: 'Reach the golden goal marker!',          key: '' },
];

// --- Utility ---
function dist(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}
function angle(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); }
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }
function rnd(min, max) { return Math.random() * (max - min) + min; }
function rndInt(min, max) { return Math.floor(rnd(min, max + 1)); }
function angleDiff(a, b) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
}

// --- Procedural Audio ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function ensureAudio() { if (!audioCtx) audioCtx = new AudioCtx(); }
function playSound(type) {
    ensureAudio();
    const now = audioCtx.currentTime;
    const gain = audioCtx.createGain();
    gain.connect(audioCtx.destination);
    if (type === 'slash') {
        const buf = audioCtx.createBuffer(1, 2200, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.3;
        const src = audioCtx.createBufferSource(); src.buffer = buf;
        gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        src.connect(gain); src.start(now);
    } else if (type === 'hit') {
        const o = audioCtx.createOscillator(); o.type = 'square';
        o.frequency.setValueAtTime(150, now); o.frequency.exponentialRampToValueAtTime(60, now + 0.1);
        gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        o.connect(gain); o.start(now); o.stop(now + 0.12);
    } else if (type === 'kill') {
        const o = audioCtx.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(400, now); o.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        o.connect(gain); o.start(now); o.stop(now + 0.3);
    } else if (type === 'spin') {
        const o = audioCtx.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(300, now); o.frequency.linearRampToValueAtTime(600, now + 0.15);
        o.frequency.linearRampToValueAtTime(200, now + 0.35);
        gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        o.connect(gain); o.start(now); o.stop(now + 0.45);
    } else if (type === 'hurt') {
        const o = audioCtx.createOscillator(); o.type = 'square';
        o.frequency.setValueAtTime(200, now); o.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        o.connect(gain); o.start(now); o.stop(now + 0.25);
    } else if (type === 'victory') {
        [523, 659, 784, 1047].forEach((freq, i) => {
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'sine'; o.frequency.value = freq;
            g.gain.setValueAtTime(0.12, now + i * 0.15); g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
            o.connect(g); g.connect(audioCtx.destination); o.start(now + i * 0.15); o.stop(now + i * 0.15 + 0.45);
        });
    } else if (type === 'gate') {
        const o = audioCtx.createOscillator(); o.type = 'triangle';
        o.frequency.setValueAtTime(300, now); o.frequency.linearRampToValueAtTime(500, now + 0.3);
        gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        o.connect(gain); o.start(now); o.stop(now + 0.55);
    } else if (type === 'step') {
        const o = audioCtx.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(600, now); o.frequency.linearRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        o.connect(gain); o.start(now); o.stop(now + 0.25);
    }
}

// --- Input ---
const input = { keys: {}, mouse: { x: C.W / 2, y: C.H / 2, clicked: false, down: false }, spacePressed: false, jPressed: false };
window.addEventListener('keydown', e => { input.keys[e.key.toLowerCase()] = true; if (e.key === ' ') { input.spacePressed = true; e.preventDefault(); } if (e.key.toLowerCase() === 'j') input.jPressed = true; });
window.addEventListener('keyup', e => { input.keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); input.mouse.x = (e.clientX - r.left) * (C.W / r.width); input.mouse.y = (e.clientY - r.top) * (C.H / r.height); });
canvas.addEventListener('mousedown', e => { if (e.button === 0) { input.mouse.clicked = true; input.mouse.down = true; } });
canvas.addEventListener('mouseup', e => { if (e.button === 0) input.mouse.down = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// --- Camera ---
class Camera {
    constructor() { this.x = 0; this.y = 0; this.shake = 0; this.shakeX = 0; this.shakeY = 0; }
    follow(t) {
        this.x = lerp(this.x, t.x - C.W / 2, 0.08); this.y = lerp(this.y, t.y - C.H / 2, 0.08);
        this.x = clamp(this.x, 0, C.MAP_W - C.W); this.y = clamp(this.y, 0, C.MAP_H - C.H);
    }
    update() {
        if (this.shake > 0) { this.shakeX = rnd(-this.shake, this.shake); this.shakeY = rnd(-this.shake, this.shake); this.shake *= 0.85; if (this.shake < 0.5) this.shake = 0; }
        else { this.shakeX = 0; this.shakeY = 0; }
    }
    applyTransform() { ctx.translate(-this.x + this.shakeX, -this.y + this.shakeY); }
}

// --- Particles & FloatingText ---
class Particle {
    constructor(x,y,vx,vy,life,color,size) { this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.life=life;this.maxLife=life;this.color=color;this.size=size; }
    update() { this.x+=this.vx;this.y+=this.vy;this.vx*=0.96;this.vy*=0.96;this.life--; }
    draw() { const a=this.life/this.maxLife;ctx.globalAlpha=a;ctx.fillStyle=this.color;const s=this.size*(0.5+0.5*a);ctx.fillRect(this.x-s/2,this.y-s/2,s,s);ctx.globalAlpha=1; }
}
const particles = [];
function spawnParticles(x,y,count,color,speed,life,size) {
    for (let i=0;i<count;i++) { const a=rnd(0,Math.PI*2),s=rnd(speed*0.3,speed); particles.push(new Particle(x,y,Math.cos(a)*s,Math.sin(a)*s,rndInt(life*0.5,life),color,rnd(size*0.5,size))); }
}
class FloatingText {
    constructor(x,y,text,color,size) { this.x=x;this.y=y;this.text=text;this.color=color;this.size=size||20;this.life=60;this.maxLife=60; }
    update() { this.y-=0.8;this.life--; }
    draw() { ctx.globalAlpha=this.life/this.maxLife;ctx.fillStyle=this.color;ctx.font=`bold ${this.size}px sans-serif`;ctx.textAlign='center';ctx.fillText(this.text,this.x,this.y);ctx.globalAlpha=1; }
}
const floatingTexts = [];

// --- Obstacles ---
const obstacles = [];
function createObstacles(levelIdx) {
    obstacles.length = 0;
    const trees = [
        ...Array.from({length:20},(_,i)=>({x:40,y:100+i*140,r:24,type:'tree'})),
        ...Array.from({length:20},(_,i)=>({x:C.MAP_W-40,y:100+i*140,r:24,type:'tree'})),
        {x:300,y:200,r:22,type:'tree'},{x:1600,y:200,r:22,type:'tree'},
    ];
    const rocks = [];
    if (levelIdx === 0) {
        trees.push({x:300,y:1500,r:22,type:'tree'},{x:1600,y:1600,r:22,type:'tree'},
                   {x:400,y:900,r:22,type:'tree'},{x:1500,y:800,r:22,type:'tree'});
        rocks.push({x:800,y:1700,r:16,type:'rock'},{x:1100,y:1500,r:14,type:'rock'},
                   {x:600,y:1000,r:16,type:'rock'},{x:1300,y:950,r:14,type:'rock'});
    } else if (levelIdx === 1) {
        trees.push({x:350,y:1900,r:20,type:'tree'},{x:1550,y:2000,r:20,type:'tree'},
                   {x:400,y:1300,r:22,type:'tree'},{x:1500,y:1200,r:22,type:'tree'},
                   {x:350,y:650,r:20,type:'tree'},{x:1550,y:750,r:20,type:'tree'});
        rocks.push({x:700,y:2100,r:16,type:'rock'},{x:1200,y:2000,r:14,type:'rock'},
                   {x:600,y:1400,r:16,type:'rock'},{x:1300,y:1350,r:14,type:'rock'},
                   {x:800,y:700,r:16,type:'rock'},{x:1100,y:600,r:14,type:'rock'},
                   {x:500,y:800,r:12,type:'rock'},{x:1400,y:500,r:12,type:'rock'});
    } else {
        trees.push({x:350,y:1900,r:20,type:'tree'},{x:1550,y:2050,r:20,type:'tree'},
                   {x:400,y:1250,r:22,type:'tree'},{x:1500,y:1300,r:22,type:'tree'},
                   {x:350,y:700,r:20,type:'tree'},{x:1550,y:650,r:20,type:'tree'});
        rocks.push({x:500,y:2100,r:14,type:'rock'},{x:1400,y:1950,r:14,type:'rock'},
                   {x:800,y:700,r:12,type:'rock'},{x:1100,y:550,r:12,type:'rock'});
        // Water pools — large impassable terrain in battle zones
        const water = [
            // Battle zone 1 (south)
            {x:750,y:1900,r:32,type:'water'},{x:1200,y:2000,r:28,type:'water'},
            {x:1050,y:1850,r:24,type:'water'},
            // Battle zone 2 (middle)
            {x:650,y:1350,r:30,type:'water'},{x:1300,y:1250,r:30,type:'water'},
            {x:960,y:1400,r:26,type:'water'},{x:850,y:1150,r:22,type:'water'},
            // Battle zone 3 (north)
            {x:700,y:750,r:34,type:'water'},{x:1250,y:650,r:34,type:'water'},
            {x:960,y:550,r:28,type:'water'},{x:500,y:600,r:24,type:'water'},
            {x:1400,y:800,r:24,type:'water'},
        ];
        obstacles.push(...water);
    }
    obstacles.push(...trees,...rocks);
}

// --- Gate ---
class Gate {
    constructor(y) { this.y=y;this.open=false;this.openAnim=0;this.segments=[];
        for (let x=80;x<C.MAP_W-80;x+=50) { if (Math.abs(x-C.MAP_W/2)<80) continue; this.segments.push({x,baseY:y,offsetY:0,opacity:1}); }
    }
    update() { if (this.open&&this.openAnim<1) { this.openAnim+=0.02; this.segments.forEach(s=>{ s.offsetY=lerp(0,-40,this.openAnim); s.opacity=lerp(1,0,this.openAnim); }); } }
    draw() { if (this.openAnim>=1) return; this.segments.forEach(s=>{ ctx.globalAlpha=s.opacity;
        ctx.fillStyle='#8B5E3C';ctx.fillRect(s.x-20,s.baseY+s.offsetY-12,40,24);
        ctx.fillStyle='#6B3E1C';ctx.fillRect(s.x-18,s.baseY+s.offsetY-10,36,4);ctx.fillRect(s.x-18,s.baseY+s.offsetY+6,36,4);
        ctx.fillStyle='#5C3010';ctx.fillRect(s.x-22,s.baseY+s.offsetY-18,6,36);ctx.fillRect(s.x+16,s.baseY+s.offsetY-18,6,36);
        ctx.globalAlpha=1; }); }
    collides(x,y,r) { if (this.open) return false; if (Math.abs(x-C.MAP_W/2)<80) return false; return Math.abs(y-this.y)<20+r; }
}

// --- Player ---
class Player {
    constructor(x, y, hp) {
        this.x=x;this.y=y;this.vx=0;this.vy=0;
        this.hp=hp;this.maxHp=hp;this.radius=C.PLAYER_RADIUS;
        this.facing=-Math.PI/2;this.speed=C.PLAYER_SPEED;
        this.attacking=false;this.attackTimer=0;this.attackDuration=0;
        this.comboStep=0;this.comboTimer=0;this.attackAngle=0;this.attackArc=0;
        this.attackRange=0;this.attackDamage=0;this.attackHitEnemies=new Set();
        this.specialCooldown=0;this.spinning=false;this.spinTimer=0;this.spinDuration=0;this.isUltraSpin=false;
        this.iframes=0;this.knockVx=0;this.knockVy=0;
        this.walkCycle=0;this.hitFlash=0;this.totalMoved=0;
    }
    update(game) {
        let mx=0,my=0;
        if (input.keys['w']||input.keys['arrowup']) my-=1;
        if (input.keys['s']||input.keys['arrowdown']) my+=1;
        if (input.keys['a']||input.keys['arrowleft']) mx-=1;
        if (input.keys['d']||input.keys['arrowright']) mx+=1;
        if (mx!==0||my!==0){const l=Math.sqrt(mx*mx+my*my);mx/=l;my/=l;}
        const ms=this.attacking?this.speed*0.4:this.speed;
        this.vx=mx*ms+this.knockVx;this.vy=my*ms+this.knockVy;
        this.knockVx*=0.8;this.knockVy*=0.8;
        const px=this.x,py=this.y;this.x+=this.vx;this.y+=this.vy;
        this.totalMoved+=dist(px,py,this.x,this.y);
        this.x=clamp(this.x,this.radius+70,C.MAP_W-this.radius-70);
        this.y=clamp(this.y,this.radius,C.MAP_H-this.radius);
        for (const ob of obstacles){const d=dist(this.x,this.y,ob.x,ob.y);const md=this.radius+ob.r;if(d<md&&d>0){this.x=ob.x+(this.x-ob.x)/d*md;this.y=ob.y+(this.y-ob.y)/d*md;}}
        for (const g of game.gates){if(g.collides(this.x,this.y,this.radius)){if(this.vy<0)this.y=g.y+20+this.radius;if(this.vy>0)this.y=g.y-20-this.radius;}}
        const wmx=input.mouse.x+game.camera.x,wmy=input.mouse.y+game.camera.y;
        this.facing=angle(this.x,this.y,wmx,wmy);
        if(mx!==0||my!==0)this.walkCycle+=0.15;
        if(input.mouse.clicked&&!this.attacking&&!this.spinning)this.startAttack();
        input.mouse.clicked=false;
        if(input.jPressed&&!this.spinning)this.startMiniSpin();
        input.jPressed=false;
        if(input.spacePressed&&this.specialCooldown<=0&&!this.spinning)this.startUltraSpin();
        input.spacePressed=false;
        if(this.attacking){this.attackTimer--;if(this.attackTimer<=0){this.attacking=false;this.comboTimer=C.COMBO_WINDOW;}}
        if(this.comboTimer>0&&!this.attacking){this.comboTimer--;if(this.comboTimer<=0)this.comboStep=0;}
        if(this.spinning){this.spinTimer--;this.facing+=0.35;if(this.spinTimer<=0)this.spinning=false;}
        if(this.specialCooldown>0)this.specialCooldown--;
        if(this.iframes>0)this.iframes--;
        if(this.hitFlash>0)this.hitFlash--;
    }
    startAttack() {
        this.comboStep=(this.comboTimer>0)?Math.min(this.comboStep+1,3):1;
        this.attacking=true;this.attackHitEnemies=new Set();this.comboTimer=0;playSound('slash');
        if(this.comboStep===1){this.attackDuration=14;this.attackArc=Math.PI*0.65;this.attackRange=48;this.attackDamage=20;}
        else if(this.comboStep===2){this.attackDuration=16;this.attackArc=Math.PI*0.8;this.attackRange=52;this.attackDamage=25;}
        else{this.attackDuration=20;this.attackArc=Math.PI*1.0;this.attackRange=60;this.attackDamage=35;}
        this.attackTimer=this.attackDuration;this.attackAngle=this.facing;
    }
    startMiniSpin() {
        this.spinning=true;this.spinTimer=18;this.spinDuration=18;this.isUltraSpin=false;
        this.attackHitEnemies=new Set();this.attackDamage=20;this.attackRange=70;playSound('spin');
    }
    startUltraSpin() {
        this.spinning=true;this.spinTimer=30;this.spinDuration=30;this.isUltraSpin=true;
        this.specialCooldown=C.SPECIAL_COOLDOWN;
        this.attackHitEnemies=new Set();this.attackDamage=120;this.attackRange=90;playSound('spin');
    }
    takeDamage(amount,fromX,fromY) {
        if(this.iframes>0)return;this.hp-=amount;this.iframes=C.IFRAMES;this.hitFlash=10;
        const a=angle(fromX,fromY,this.x,this.y);this.knockVx=Math.cos(a)*6;this.knockVy=Math.sin(a)*6;
        playSound('hurt');spawnParticles(this.x,this.y,8,'#ff4444',3,20,4);
    }
    isAttackHitting(){return this.attacking&&this.attackTimer>this.attackDuration*0.3;}
    checkHitEnemy(e) {
        if(this.attackHitEnemies.has(e))return false;
        if(this.spinning&&this.spinTimer>0){if(dist(this.x,this.y,e.x,e.y)<this.attackRange+e.radius){this.attackHitEnemies.add(e);return true;}}
        if(this.isAttackHitting()){const d=dist(this.x,this.y,e.x,e.y);if(d>this.attackRange+e.radius)return false;
            const a=angle(this.x,this.y,e.x,e.y);if(Math.abs(angleDiff(this.attackAngle,a))<this.attackArc/2){this.attackHitEnemies.add(e);return true;}}
        return false;
    }
    draw() {
        ctx.save();ctx.translate(this.x,this.y);
        if(this.iframes>0&&Math.floor(this.iframes/4)%2===0)ctx.globalAlpha=0.3;
        if(this.hitFlash>0)ctx.globalAlpha=0.8;
        ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(0,8,14,6,0,0,Math.PI*2);ctx.fill();
        if(this.attacking||this.spinning)this.drawAttackEffect();
        const b=Math.sin(this.walkCycle)*2;
        ctx.fillStyle='#5B4530';ctx.fillRect(-6,2+b,5,10);ctx.fillRect(1,2+b,5,10);
        ctx.fillStyle=this.hitFlash>0?'#fff':'#3a8c3f';ctx.fillRect(-9,-10+b,18,16);
        ctx.fillStyle='#8B5E3C';ctx.fillRect(-9,2+b,18,3);ctx.fillStyle='#FFD700';ctx.fillRect(-2,2+b,4,3);
        ctx.fillStyle=this.hitFlash>0?'#fff':'#3a8c3f';ctx.fillRect(-13,-8+b,5,12);ctx.fillRect(8,-8+b,5,12);
        ctx.fillStyle=this.hitFlash>0?'#fff':'#FFD5A6';ctx.beginPath();ctx.arc(0,-16+b,9,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#DAA520';ctx.beginPath();ctx.arc(0,-19+b,9,-Math.PI,0);ctx.fill();ctx.fillRect(-10,-20+b,4,10);ctx.fillRect(6,-20+b,4,10);
        const ed=Math.cos(this.facing)>0?1:-1;ctx.fillStyle='#334';ctx.fillRect(-3+ed*2,-17+b,2,2);ctx.fillRect(2+ed*2,-17+b,2,2);
        ctx.fillStyle='#2d7d32';ctx.beginPath();ctx.moveTo(-2,-27+b);ctx.lineTo(6,-30+b);ctx.lineTo(0,-22+b);ctx.closePath();ctx.fill();
        ctx.globalAlpha=1;ctx.restore();
    }
    drawAttackEffect() {
        const p=this.attacking?1-this.attackTimer/this.attackDuration:1-this.spinTimer/this.spinDuration;
        if(this.spinning){ctx.save();
            if(this.isUltraSpin){ctx.strokeStyle='rgba(255,200,50,0.9)';ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,this.attackRange,this.facing-Math.PI,this.facing+Math.PI);ctx.stroke();ctx.strokeStyle='rgba(255,100,30,0.5)';ctx.lineWidth=10;ctx.beginPath();ctx.arc(0,0,this.attackRange*0.7,this.facing-Math.PI,this.facing+Math.PI);ctx.stroke();}
            else{ctx.strokeStyle='rgba(100,200,255,0.8)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,this.attackRange,this.facing-Math.PI,this.facing+Math.PI);ctx.stroke();}
            ctx.rotate(this.facing);ctx.fillStyle='#C0C0C0';ctx.fillRect(10,-2,40,4);ctx.fillStyle='#FFD700';ctx.fillRect(6,-4,8,8);ctx.restore();}
        else if(this.attacking){ctx.save();const ss=this.attackAngle-this.attackArc/2,se=this.attackAngle+this.attackArc/2,c=lerp(ss,se,p);ctx.strokeStyle=`rgba(255,255,200,${0.6*(1-p)})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,this.attackRange*0.8,ss,c);ctx.stroke();ctx.rotate(c);ctx.fillStyle='#C0C0C0';ctx.fillRect(10,-2,38,4);ctx.fillStyle='#A0A0B0';ctx.fillRect(10,-1,38,1);ctx.fillStyle='#FFD700';ctx.fillRect(6,-5,8,10);ctx.fillStyle='#8B4513';ctx.fillRect(0,-3,8,6);ctx.restore();}
    }
}

// --- Enemy ---
const ENEMY_TYPES = {
    dummy:   {hp:20,speed:0,damage:0,color:'#7B6B5B',radius:12,cooldown:[999,999]},
    basic:   {hp:25,speed:0.8,damage:5,color:'#8B2252',radius:12,cooldown:[100,180]},
    fast:    {hp:20,speed:1.0,damage:4,color:'#AA3333',radius:12,cooldown:[100,180]},
    tough:   {hp:50,speed:0.7,damage:8,color:'#5B1A86',radius:14,cooldown:[100,180]},
    soldier: {hp:30,speed:1.0,damage:10,color:'#7B1A32',radius:12,cooldown:[70,120]},
    scout:   {hp:20,speed:1.5,damage:6,color:'#CC4422',radius:11,cooldown:[60,100]},
    knight:  {hp:55,speed:0.7,damage:15,color:'#3B1A66',radius:15,cooldown:[80,130]},
};

class Enemy {
    constructor(x,y,type) {
        this.x=x;this.y=y;this.vx=0;this.vy=0;this.type=type||'basic';
        const t=ENEMY_TYPES[this.type];
        this.hp=t.hp;this.maxHp=t.hp;this.speed=t.speed;this.damage=t.damage;
        this.color=t.color;this.radius=t.radius;
        this.facing=0;this.active=false;
        this.attackCooldown=rndInt(t.cooldown[0],t.cooldown[1]);this.attackTimer=0;
        this.knockVx=0;this.knockVy=0;this.hitFlash=0;
        this.walkCycle=Math.random()*Math.PI*2;this.dead=false;
        this.wanderAngle=Math.random()*Math.PI*2;this.wanderTimer=rndInt(30,90);this.staggerTimer=0;
    }
    update(player,enemies) {
        if(this.dead||!this.active)return;
        if(this.staggerTimer>0){this.staggerTimer--;this.x+=this.knockVx;this.y+=this.knockVy;this.knockVx*=0.85;this.knockVy*=0.85;this.clampPosition();return;}
        if(this.type==='dummy'){this.walkCycle+=0.05;return;}
        const d=dist(this.x,this.y,player.x,player.y);const ar=this.radius+player.radius+8;
        const cd=ENEMY_TYPES[this.type].cooldown;
        if(d<280){this.facing=angle(this.x,this.y,player.x,player.y);
            if(d>ar+5){this.vx=Math.cos(this.facing)*this.speed;this.vy=Math.sin(this.facing)*this.speed;}
            else{this.vx=0;this.vy=0;if(this.attackCooldown<=0){this.attackTimer=20;this.attackCooldown=rndInt(cd[0],cd[1]);}}}
        else{this.wanderTimer--;if(this.wanderTimer<=0){this.wanderAngle=rnd(0,Math.PI*2);this.wanderTimer=rndInt(40,100);}this.facing=this.wanderAngle;this.vx=Math.cos(this.wanderAngle)*this.speed*0.3;this.vy=Math.sin(this.wanderAngle)*this.speed*0.3;}
        for(const o of enemies){if(o===this||o.dead)continue;const od=dist(this.x,this.y,o.x,o.y);const md=this.radius+o.radius+4;if(od<md&&od>0){const ps=(md-od)/md*0.5;this.vx+=(this.x-o.x)/od*ps;this.vy+=(this.y-o.y)/od*ps;}}
        this.x+=this.vx+this.knockVx;this.y+=this.vy+this.knockVy;this.knockVx*=0.85;this.knockVy*=0.85;this.clampPosition();
        if(this.attackTimer>0){this.attackTimer--;if(this.attackTimer===5&&d<ar+15)player.takeDamage(this.damage,this.x,this.y);}
        if(this.attackCooldown>0)this.attackCooldown--;if(this.hitFlash>0)this.hitFlash--;this.walkCycle+=0.12;
    }
    clampPosition(){this.x=clamp(this.x,this.radius+70,C.MAP_W-this.radius-70);this.y=clamp(this.y,this.radius,C.MAP_H-this.radius);for(const ob of obstacles){const d=dist(this.x,this.y,ob.x,ob.y);const md=this.radius+ob.r;if(d<md&&d>0){this.x=ob.x+(this.x-ob.x)/d*md;this.y=ob.y+(this.y-ob.y)/d*md;}}}
    takeDamage(amount,fromAngle){this.hp-=amount;this.hitFlash=6;this.staggerTimer=8;this.knockVx=Math.cos(fromAngle)*C.KNOCKBACK;this.knockVy=Math.sin(fromAngle)*C.KNOCKBACK;spawnParticles(this.x,this.y,6,'#ffcc44',4,15,4);playSound('hit');if(this.hp<=0){this.dead=true;spawnParticles(this.x,this.y,15,this.color,5,30,6);spawnParticles(this.x,this.y,8,'#ffdd66',3,25,3);playSound('kill');}}
    draw() {
        if(this.dead||!this.active)return;ctx.save();ctx.translate(this.x,this.y);
        ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(0,6,this.radius,5,0,0,Math.PI*2);ctx.fill();
        const b=Math.sin(this.walkCycle)*1.5;
        if(this.type==='dummy'){
            const bc=this.hitFlash>0?'#fff':'#A08060';ctx.fillStyle='#6B4226';ctx.fillRect(-2,-4+b,4,18);ctx.fillRect(-14,-2+b,28,4);
            ctx.fillStyle=bc;ctx.fillRect(-8,-10+b,16,14);ctx.fillStyle=this.hitFlash>0?'#fff':'#C8A870';ctx.beginPath();ctx.arc(0,-16+b,8,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='#555';ctx.fillRect(-3,-17+b,2,2);ctx.fillRect(1,-17+b,2,2);ctx.fillRect(-2,-13+b,4,1);
        } else {
            if(this.attackTimer>10){ctx.strokeStyle='rgba(255,50,50,0.6)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,this.radius+10,0,Math.PI*2);ctx.stroke();}
            ctx.fillStyle=this.hitFlash>0?'#fff':this.color;ctx.fillRect(-this.radius+2,-8+b,(this.radius-2)*2,14);
            ctx.fillStyle=this.hitFlash>0?'#fff':'#D4A08A';ctx.beginPath();ctx.arc(0,-12+b,7,0,Math.PI*2);ctx.fill();
            const helmCol = this.type==='knight'?'#2a1050':this.type==='scout'?'#882211':'#5a1232';
            ctx.fillStyle=this.hitFlash>0?'#fff':helmCol;ctx.beginPath();ctx.arc(0,-14+b,7,Math.PI,0);ctx.fill();
            ctx.fillStyle='#ff3333';ctx.fillRect(-3,-13+b,2,2);ctx.fillRect(1,-13+b,2,2);
            ctx.save();ctx.rotate(this.facing);if(this.attackTimer>0)ctx.rotate(-0.8+(1-this.attackTimer/20)*1.6);
            ctx.fillStyle=this.type==='knight'?'#555':'#8B7355';ctx.fillRect(this.radius,-2,this.type==='knight'?22:18,4);ctx.restore();
        }
        if(this.hp<this.maxHp){const bw=24,hr=this.hp/this.maxHp;ctx.fillStyle='#333';ctx.fillRect(-bw/2,-24,bw,4);ctx.fillStyle=hr>0.5?'#4CAF50':hr>0.25?'#FF9800':'#f44336';ctx.fillRect(-bw/2,-24,bw*hr,4);}
        ctx.restore();
    }
}

// --- Rendering Helpers ---
function drawMap(camera, zones) {
    const sx=Math.floor(camera.x/C.TILE),sy=Math.floor(camera.y/C.TILE);
    const ex=Math.ceil((camera.x+C.W)/C.TILE),ey=Math.ceil((camera.y+C.H)/C.TILE);
    for(let ty=sy;ty<=ey;ty++)for(let tx=sx;tx<=ex;tx++){
        const px=tx*C.TILE,py=ty*C.TILE,h=((tx*7+ty*13)&0xFF)/255;
        const g=Math.floor(100+h*30);
        ctx.fillStyle=`rgb(${60+Math.floor(h*15)},${g},${40+Math.floor(h*10)})`;ctx.fillRect(px,py,C.TILE,C.TILE);
        if(Math.abs(px+C.TILE/2-C.MAP_W/2)<100){ctx.fillStyle=`rgb(${160+Math.floor(h*20)},${140+Math.floor(h*15)},${100+Math.floor(h*10)})`;ctx.fillRect(px,py,C.TILE,C.TILE);}
    }
    ctx.globalAlpha=0.06;ctx.fillStyle='#ff0000';
    ctx.fillRect(80,zones.BATTLE1_START,C.MAP_W-160,zones.BATTLE1_END-zones.BATTLE1_START);
    if(zones.BATTLE2_START)ctx.fillRect(80,zones.BATTLE2_START,C.MAP_W-160,zones.BATTLE2_END-zones.BATTLE2_START);
    if(zones.BATTLE3_START)ctx.fillRect(80,zones.BATTLE3_START,C.MAP_W-160,zones.BATTLE3_END-zones.BATTLE3_START);
    ctx.globalAlpha=1;
}
function drawObstacles(){for(const ob of obstacles){if(ob.type==='tree'){ctx.fillStyle='#6B3E1C';ctx.fillRect(ob.x-5,ob.y-3,10,12);ctx.fillStyle='#2d6b2f';ctx.beginPath();ctx.arc(ob.x,ob.y-8,ob.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3a8c3f';ctx.beginPath();ctx.arc(ob.x-3,ob.y-10,ob.r*0.7,0,Math.PI*2);ctx.fill();}else if(ob.type==='water'){ctx.fillStyle='#1a4a6a';ctx.beginPath();ctx.arc(ob.x,ob.y,ob.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1f5880';ctx.beginPath();ctx.arc(ob.x+2,ob.y-2,ob.r*0.85,0,Math.PI*2);ctx.fill();ctx.fillStyle='#266a96';ctx.beginPath();ctx.arc(ob.x+3,ob.y-3,ob.r*0.55,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(100,180,220,0.3)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(ob.x,ob.y,ob.r+2,0,Math.PI*2);ctx.stroke();}else{ctx.fillStyle='#888';ctx.beginPath();ctx.arc(ob.x,ob.y,ob.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#999';ctx.beginPath();ctx.arc(ob.x-2,ob.y-2,ob.r*0.6,0,Math.PI*2);ctx.fill();}}}
function drawGroundMarker(x,y,frame,label){const p=Math.sin(frame*0.06)*0.2+0.8;ctx.globalAlpha=0.4*p;ctx.strokeStyle='#FFD700';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,30,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);ctx.stroke();if(label){ctx.globalAlpha=0.5*p;ctx.fillStyle='#FFD700';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText(label,x,y+50);}ctx.globalAlpha=1;}
function drawGroundArrow(x,y,frame){const b=Math.sin(frame*0.08)*4;ctx.globalAlpha=0.35;ctx.fillStyle='#FFD700';ctx.beginPath();ctx.moveTo(x,y-20+b);ctx.lineTo(x+15,y+5+b);ctx.lineTo(x+5,y+5+b);ctx.lineTo(x+5,y+20+b);ctx.lineTo(x-5,y+20+b);ctx.lineTo(x-5,y+5+b);ctx.lineTo(x-15,y+5+b);ctx.closePath();ctx.fill();ctx.globalAlpha=1;}
function drawGoalPoint(x,y,active,frame){const p=Math.sin(frame*0.05)*0.3+0.7;ctx.save();ctx.translate(x,y);if(active){ctx.globalAlpha=0.3*p;ctx.fillStyle='#FFD700';ctx.beginPath();ctx.arc(0,0,40,0,Math.PI*2);ctx.fill();ctx.globalAlpha=0.5*p;ctx.fillStyle='#FFF8DC';ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=active?1:0.3;ctx.fillStyle='#FFD700';ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(15,10);ctx.lineTo(-15,10);ctx.closePath();ctx.fill();ctx.fillStyle='#FFF8DC';ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(10,6);ctx.lineTo(-10,6);ctx.closePath();ctx.fill();if(active){for(let i=0;i<4;i++){const a=frame*0.03+i*Math.PI/2,r=30+Math.sin(frame*0.08+i)*5;ctx.fillStyle='#FFD700';ctx.globalAlpha=p;ctx.fillRect(Math.cos(a)*r-2,Math.sin(a)*r-2,4,4);}}ctx.globalAlpha=1;ctx.restore();}

// --- HUD ---
function drawHUD(player, game) {
    ctx.save();
    const barX=20,barY=20,barW=200,barH=20,hpR=player.hp/player.maxHp;
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(barX-2,barY-2,barW+4,barH+4);ctx.fillStyle='#333';ctx.fillRect(barX,barY,barW,barH);
    ctx.fillStyle=hpR>0.5?'#4CAF50':hpR>0.25?'#FF9800':'#f44336';ctx.fillRect(barX,barY,barW*hpR,barH);
    ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.strokeRect(barX,barY,barW,barH);ctx.fillStyle='#fff';ctx.font='bold 14px sans-serif';ctx.textAlign='left';ctx.fillText(`HP: ${Math.ceil(player.hp)} / ${player.maxHp}`,barX+6,barY+15);
    const spX=20,spY=48;ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(spX-2,spY-2,104,14);ctx.fillStyle='#333';ctx.fillRect(spX,spY,100,10);
    const sr=1-player.specialCooldown/C.SPECIAL_COOLDOWN;ctx.fillStyle=sr>=1?'#64B5F6':'#2196F3';ctx.fillRect(spX,spY,100*sr,10);ctx.fillStyle='#fff';ctx.font='10px sans-serif';ctx.fillText(sr>=1?'ULTRA READY [SPACE]':'Ultra charging...',spX+2,spY+9);
    ctx.textAlign='right';ctx.fillStyle='#FFD700';ctx.font='bold 36px sans-serif';ctx.fillText(game.koCount,C.W-20,46);ctx.fillStyle='#fff';ctx.font='14px sans-serif';ctx.fillText('KOs',C.W-20,62);
    if(game.hitCombo>1&&game.hitComboTimer>0){ctx.globalAlpha=Math.min(1,game.hitComboTimer/30);ctx.textAlign='center';ctx.fillStyle='#FFD700';ctx.font=`bold ${28+Math.min(game.hitCombo,20)*2}px sans-serif`;ctx.fillText(`${game.hitCombo} HIT!`,C.W/2,100);ctx.globalAlpha=1;}

    // Tutorial prompt (only for tutorial level)
    if(game.levelDef.isTutorial) drawTutorialPrompt(game);

    // Horde progress (for non-tutorial)
    if(!game.levelDef.isTutorial && game.hordeGroups) {
        const cleared = game.hordeGroups.filter(h=>h.every(e=>e.dead)).length;
        const total = game.hordeGroups.length;
        ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(C.W/2-100,6,200,30);
        ctx.strokeStyle='rgba(255,215,0,0.3)';ctx.lineWidth=1;ctx.strokeRect(C.W/2-100,6,200,30);
        ctx.fillStyle='#fff';ctx.font='bold 16px sans-serif';ctx.textAlign='center';
        ctx.fillText(`Hordes Cleared: ${cleared} / ${total}`,C.W/2,27);
    }

    // Waypoint arrow
    drawWaypointArrow(player,game);

    if(game.objectiveText&&game.objectiveTimer>0){ctx.globalAlpha=Math.min(1,game.objectiveTimer/30);ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold 20px sans-serif';ctx.fillText(game.objectiveText,C.W/2,C.H-50);ctx.globalAlpha=1;}
    if(game.bannerText&&game.bannerTimer>0){const bt=game.bannerTimer;ctx.globalAlpha=bt>80?(100-bt)/20:bt>20?1:bt/20;ctx.textAlign='center';ctx.fillStyle='#FFD700';ctx.font='bold 48px sans-serif';ctx.fillText(game.bannerText,C.W/2,C.H/2-40);if(game.bannerSubText){ctx.fillStyle='#fff';ctx.font='20px sans-serif';ctx.fillText(game.bannerSubText,C.W/2,C.H/2);}ctx.globalAlpha=1;}

    // Minimap
    const z=game.zones,mmW=100,mmH=150,mmX=C.W-mmW-16,mmY=C.H-mmH-16;
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(mmX-2,mmY-2,mmW+4,mmH+4);ctx.fillStyle='#2a4a2a';ctx.fillRect(mmX,mmY,mmW,mmH);
    ctx.fillStyle='#4CAF50';ctx.fillRect(mmX+(player.x/C.MAP_W)*mmW-2,mmY+(player.y/C.MAP_H)*mmH-2,4,4);
    for(const e of game.enemies){if(e.dead||!e.active)continue;ctx.fillStyle=e.type==='dummy'?'#aa8855':'#f44336';ctx.fillRect(mmX+(e.x/C.MAP_W)*mmW-1,mmY+(e.y/C.MAP_H)*mmH-1,2,2);}
    ctx.fillStyle='#FFD700';ctx.fillRect(mmX+0.5*mmW-2,mmY+(z.GOAL_Y/C.MAP_H)*mmH-2,4,4);
    for(const g of game.gates){if(g.open)continue;ctx.fillStyle='#8B5E3C';ctx.fillRect(mmX,mmY+(g.y/C.MAP_H)*mmH,mmW,2);}
    ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.strokeRect(mmX,mmY,mmW,mmH);
    ctx.restore();
}

function drawTutorialPrompt(game) {
    const step=TUTORIAL_STEPS[game.tutorialStep]; if(!step)return;
    const bw=420,bh=50,bx=(C.W-bw)/2,by=8;
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.beginPath();const r=10;ctx.moveTo(bx+r,by);ctx.lineTo(bx+bw-r,by);ctx.quadraticCurveTo(bx+bw,by,bx+bw,by+r);ctx.lineTo(bx+bw,by+bh-r);ctx.quadraticCurveTo(bx+bw,by+bh,bx+bw-r,by+bh);ctx.lineTo(bx+r,by+bh);ctx.quadraticCurveTo(bx,by+bh,bx,by+bh-r);ctx.lineTo(bx,by+r);ctx.quadraticCurveTo(bx,by,bx+r,by);ctx.fill();
    ctx.strokeStyle='rgba(255,215,0,0.4)';ctx.lineWidth=1;ctx.stroke();
    const dy=by+12;for(let i=0;i<TUTORIAL_STEPS.length;i++){ctx.fillStyle=i<game.tutorialStep?'#4CAF50':i===game.tutorialStep?'#FFD700':'#555';ctx.beginPath();ctx.arc(bx+14+i*14,dy,4,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#fff';ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillText(step.text,C.W/2,by+38);
    if(step.key){const p=Math.sin(game.frame*0.08)*0.3+0.7;ctx.globalAlpha=p;const kw=ctx.measureText(step.key).width+16;ctx.fillStyle='#FFD700';const kx=bx+bw-kw-10;ctx.beginPath();ctx.roundRect(kx,by+22,kw,22,4);ctx.fill();ctx.fillStyle='#222';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText(step.key,kx+kw/2,by+37);ctx.globalAlpha=1;}
}

function drawWaypointArrow(player,game) {
    const t=game.getWaypointTarget();if(!t)return;
    const dx=t.x-player.x,dy=t.y-player.y,d=Math.sqrt(dx*dx+dy*dy);if(d<60)return;
    const a=Math.atan2(dy,dx),p=Math.sin(game.frame*0.1)*3;
    ctx.save();ctx.translate(C.W/2+Math.cos(a)*(80+p),C.H/2+Math.sin(a)*(80+p));ctx.rotate(a);
    ctx.fillStyle='rgba(255,215,0,0.7)';ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-6,-8);ctx.lineTo(-3,0);ctx.lineTo(-6,8);ctx.closePath();ctx.fill();ctx.restore();
}

// --- Progress Persistence ---
const PROGRESS_KEY = 'calamity2d-progress';
function getMaxUnlocked() {
    const v = parseInt(localStorage.getItem(PROGRESS_KEY), 10);
    return isNaN(v) ? 0 : v;
}
function unlockUpTo(idx) {
    if (idx > getMaxUnlocked()) localStorage.setItem(PROGRESS_KEY, idx);
}
function resetProgress() {
    localStorage.removeItem(PROGRESS_KEY);
}

// --- Main Game ---
class Game {
    constructor() {
        this.state='title';this.frame=0;this.player=null;this.enemies=[];this.gates=[];
        this.camera=new Camera();this.koCount=0;this.hitCombo=0;this.hitComboTimer=0;this.hitStopFrames=0;
        this.goalActive=false;this.objectiveText='';this.objectiveTimer=0;
        this.bannerText='';this.bannerSubText='';this.bannerTimer=0;this.startTime=0;
        this.levelIdx=0;this.levelDef=LEVELS[0];this.zones={};
        this.tutorialStep=0;this.tutorialEnemies={};
        this.hordeGroups=null;this.hordeActive=[];this.hordeCleared=[];
    }

    showLevelSelect() {
        this.state='select';
        document.querySelectorAll('.overlay').forEach(o=>o.classList.add('hidden'));
        document.getElementById('levelSelect').classList.remove('hidden');
        this.buildLevelGrid();
    }

    buildLevelGrid() {
        const grid=document.getElementById('levelGrid'); grid.innerHTML='';
        const maxUnlocked = getMaxUnlocked();
        LEVELS.forEach((lv,i)=>{
            const locked = i > maxUnlocked;
            const btn=document.createElement('button');
            btn.className='level-btn' + (locked ? ' locked' : '');
            if (locked) {
                btn.innerHTML=`<span class="level-num">Level ${i+1}</span><span class="level-name"><span class="lock-icon">&#x1F512;</span> ${lv.name}</span><span class="level-desc">Complete previous level to unlock</span>`;
            } else {
                btn.innerHTML=`<span class="level-num">Level ${i+1}</span><span class="level-name">${lv.name}</span><span class="level-desc">${lv.subtitle}</span>`;
                btn.addEventListener('click',()=>{ensureAudio();this.startLevel(i);});
            }
            grid.appendChild(btn);
        });
    }

    startLevel(idx) {
        document.querySelectorAll('.overlay').forEach(o=>o.classList.add('hidden'));
        unlockUpTo(idx);
        this.levelIdx=idx;this.levelDef=LEVELS[idx];this.zones=this.levelDef.zones;
        this.frame=0;this.koCount=0;this.hitCombo=0;this.hitComboTimer=0;this.hitStopFrames=0;
        this.goalActive=false;this.objectiveText='';this.objectiveTimer=0;
        this.bannerText='';this.bannerSubText='';this.bannerTimer=0;
        this.tutorialStep=0;this.tutorialEnemies={};
        this.hordeGroups=null;this.hordeActive=[];this.hordeCleared=[];

        particles.length=0;floatingTexts.length=0;

        this.player=new Player(C.MAP_W/2,this.zones.START_Y,this.levelDef.playerHP);
        this.camera=new Camera();
        this.camera.x=this.player.x-C.W/2;this.camera.y=this.player.y-C.H/2;

        createObstacles(idx);
        this.enemies=[];this.gates=[];

        if(this.levelDef.isTutorial) this.setupTutorial();
        else this.setupCombatLevel();

        this.startTime=Date.now();
        this.state='playing';
    }

    setupTutorial() {
        const z=this.zones, cx=C.MAP_W/2;
        this.tutorialEnemies={attack:[],combo:[],special:[],horde1:[],horde2:[]};
        for(let i=0;i<3;i++){const e=new Enemy(cx-60+i*60,z.ATTACK_Y,'dummy');this.enemies.push(e);this.tutorialEnemies.attack.push(e);}
        for(let i=0;i<3;i++){const e=new Enemy(cx-60+i*60,z.COMBO_Y,'dummy');this.enemies.push(e);this.tutorialEnemies.combo.push(e);}
        for(let i=0;i<5;i++){const a=(i/5)*Math.PI*2;const e=new Enemy(cx+Math.cos(a)*35,z.SPECIAL_Y+Math.sin(a)*35,'dummy');this.enemies.push(e);this.tutorialEnemies.special.push(e);}
        for(let i=0;i<8;i++){const e=new Enemy(rnd(300,C.MAP_W-300),rnd(z.BATTLE1_START+50,z.BATTLE1_END-50),i<6?'basic':'fast');this.enemies.push(e);this.tutorialEnemies.horde1.push(e);}
        for(let i=0;i<12;i++){const e=new Enemy(rnd(300,C.MAP_W-300),rnd(z.BATTLE2_START+50,z.BATTLE2_END-50),i<8?'basic':i<11?'fast':'tough');this.enemies.push(e);this.tutorialEnemies.horde2.push(e);}
        this.gates=[new Gate(z.GATE1_Y),new Gate(z.GATE2_Y)];
        this.showBanner('TUTORIAL','Learn the basics of combat');
    }

    setupCombatLevel() {
        const z=this.zones, def=this.levelDef;
        this.hordeGroups=[];this.hordeActive=[];this.hordeCleared=[];
        const gateYs=[z.GATE1_Y,z.GATE2_Y,z.GATE3_Y].filter(Boolean);
        this.gates=gateYs.map(y=>new Gate(y));

        const battleZones=[
            {start:z.BATTLE1_START,end:z.BATTLE1_END},
            {start:z.BATTLE2_START,end:z.BATTLE2_END},
        ];
        if(z.BATTLE3_START)battleZones.push({start:z.BATTLE3_START,end:z.BATTLE3_END});

        def.hordes.forEach((horde,i)=>{
            const group=[];const bz=battleZones[i];
            horde.types.forEach(({n,t})=>{
                for(let j=0;j<n;j++){
                    const e=new Enemy(rnd(250,C.MAP_W-250),rnd(bz.start+40,bz.end-40),t);
                    this.enemies.push(e);group.push(e);
                }
            });
            this.hordeGroups.push(group);
            this.hordeActive.push(false);
            this.hordeCleared.push(false);
        });

        this.showBanner(def.name.toUpperCase(),def.subtitle);
        this.setObjective('Head north to engage the enemy!');
    }

    showBanner(t,s){this.bannerText=t;this.bannerSubText=s||'';this.bannerTimer=100;}
    setObjective(t){this.objectiveText=t;this.objectiveTimer=300;}

    // --- Tutorial Logic ---
    advanceTutorial() {
        this.tutorialStep++;playSound('step');
        const step=TUTORIAL_STEPS[this.tutorialStep];if(!step)return;const z=this.zones;
        if(step.id==='attack'){this.tutorialEnemies.attack.forEach(e=>e.active=true);this.setObjective('Destroy the training dummies ahead!');}
        else if(step.id==='combo'){this.tutorialEnemies.combo.forEach(e=>e.active=true);this.setObjective('Try chaining 3 quick clicks!');}
        else if(step.id==='special'){this.tutorialEnemies.special.forEach(e=>e.active=true);this.setObjective('Use spin attack on the grouped dummies!');}
        else if(step.id==='horde1'){this.tutorialEnemies.horde1.forEach(e=>e.active=true);this.showBanner('ENEMY HORDE!','Defeat them all!');this.setObjective('Defeat all enemies!');}
        else if(step.id==='horde2'){this.tutorialEnemies.horde2.forEach(e=>e.active=true);this.showBanner('SECOND WAVE!','More enemies incoming!');this.setObjective('Defeat all enemies!');}
        else if(step.id==='goal'){this.goalActive=true;this.showBanner('PATH CLEAR!','Reach the goal!');this.setObjective('Reach the golden goal marker!');}
    }

    checkTutorialProgress() {
        const step=TUTORIAL_STEPS[this.tutorialStep];if(!step)return;const z=this.zones,cx=C.MAP_W/2;
        if(step.id==='move'&&this.player.totalMoved>150&&this.player.y<z.START_Y-50)this.advanceTutorial();
        else if(step.id==='attack'&&this.tutorialEnemies.attack.every(e=>e.dead)){this.showBanner('NICE!','You can swing a sword!');this.advanceTutorial();}
        else if(step.id==='combo'&&this.tutorialEnemies.combo.every(e=>e.dead)){this.showBanner('GREAT COMBO!','Chain attacks for more damage!');this.advanceTutorial();}
        else if(step.id==='special'&&this.tutorialEnemies.special.every(e=>e.dead)){this.showBanner('POWERFUL!','Spin attack hits all around you!');this.advanceTutorial();}
        else if(step.id==='horde1'&&this.tutorialEnemies.horde1.every(e=>e.dead)){this.gates[0].open=true;this.showBanner('HORDE DEFEATED!','The gate is open!');playSound('gate');spawnParticles(cx,z.GATE1_Y,30,'#FFD700',5,40,5);this.advanceTutorial();}
        else if(step.id==='horde2'&&this.tutorialEnemies.horde2.every(e=>e.dead)){this.gates[1].open=true;playSound('gate');spawnParticles(cx,z.GATE2_Y,30,'#FFD700',5,40,5);this.advanceTutorial();}
        else if(step.id==='goal'&&dist(this.player.x,this.player.y,cx,z.GOAL_Y)<40)this.victory();
    }

    // --- Combat Level Logic ---
    checkHordeProgress() {
        const z=this.zones,py=this.player.y,cx=C.MAP_W/2;
        const battleZones=[
            {start:z.BATTLE1_START,end:z.BATTLE1_END},
            {start:z.BATTLE2_START,end:z.BATTLE2_END},
        ];
        if(z.BATTLE3_START)battleZones.push({start:z.BATTLE3_START,end:z.BATTLE3_END});
        const gateYs=[z.GATE1_Y,z.GATE2_Y,z.GATE3_Y].filter(Boolean);

        for(let i=0;i<this.hordeGroups.length;i++){
            const bz=battleZones[i];
            // Activate: player enters zone AND previous hordes cleared
            if(!this.hordeActive[i]&&!this.hordeCleared[i]&&py<bz.end&&py>bz.start){
                const prevCleared=i===0||this.hordeCleared[i-1];
                if(prevCleared){
                    this.hordeActive[i]=true;
                    this.hordeGroups[i].forEach(e=>e.active=true);
                    this.showBanner(`HORDE ${i+1}!`,`${this.hordeGroups[i].length} enemies incoming!`);
                    this.setObjective(`Defeat all enemies! (Wave ${i+1}/${this.hordeGroups.length})`);
                }
            }
            // Check cleared
            if(this.hordeActive[i]&&!this.hordeCleared[i]&&this.hordeGroups[i].every(e=>e.dead)){
                this.hordeCleared[i]=true;this.hordeActive[i]=false;
                if(this.gates[i])this.gates[i].open=true;
                playSound('gate');
                if(gateYs[i])spawnParticles(cx,gateYs[i],30,'#FFD700',5,40,5);

                if(this.hordeCleared.every(Boolean)){
                    this.goalActive=true;
                    this.showBanner('ALL CLEAR!','Reach the goal!');
                    this.setObjective('Head north to the golden goal marker!');
                } else {
                    this.showBanner('HORDE DEFEATED!','Keep pushing forward!');
                    this.setObjective('Continue north!');
                }
            }
        }
        // Goal check
        if(this.goalActive&&dist(this.player.x,this.player.y,cx,z.GOAL_Y)<40)this.victory();
    }

    getWaypointTarget() {
        const z=this.zones,cx=C.MAP_W/2;
        if(this.levelDef.isTutorial){
            const step=TUTORIAL_STEPS[this.tutorialStep];if(!step)return null;
            if(step.id==='move')return{x:cx,y:z.ATTACK_Y+100};
            const group=this.tutorialEnemies[step.id==='horde1'?'horde1':step.id==='horde2'?'horde2':step.id];
            if(group){const alive=group.find(e=>!e.dead);if(alive)return{x:alive.x,y:alive.y};}
            if(step.id==='goal')return{x:cx,y:z.GOAL_Y};
            return{x:cx,y:z[step.id==='attack'?'ATTACK_Y':step.id==='combo'?'COMBO_Y':step.id==='special'?'SPECIAL_Y':'GOAL_Y']||z.GOAL_Y};
        } else {
            if(this.goalActive)return{x:cx,y:z.GOAL_Y};
            if(this.hordeGroups){for(let i=0;i<this.hordeGroups.length;i++){
                if(!this.hordeCleared[i]){const alive=this.hordeGroups[i].find(e=>!e.dead&&e.active);if(alive)return{x:alive.x,y:alive.y};
                    const bz=[{s:z.BATTLE1_START,e:z.BATTLE1_END},{s:z.BATTLE2_START,e:z.BATTLE2_END}];
                    if(z.BATTLE3_START)bz.push({s:z.BATTLE3_START,e:z.BATTLE3_END});
                    return{x:cx,y:(bz[i].s+bz[i].e)/2};
                }
            }}
            return null;
        }
    }

    // --- Update ---
    update() {
        if(this.state!=='playing')return;
        if(this.hitStopFrames>0){this.hitStopFrames--;return;}
        this.frame++;this.player.update(this);
        if(this.levelDef.isTutorial)this.checkTutorialProgress();
        else this.checkHordeProgress();
        for(const e of this.enemies)e.update(this.player,this.enemies);
        for(const e of this.enemies){if(e.dead||!e.active)continue;
            if(this.player.checkHitEnemy(e)){const ha=angle(this.player.x,this.player.y,e.x,e.y);e.takeDamage(this.player.attackDamage,ha);this.hitCombo++;this.hitComboTimer=90;
                if(e.dead){this.koCount++;floatingTexts.push(new FloatingText(e.x,e.y-20,'+KO','#FFD700',18));}
                this.camera.shake=Math.min(this.camera.shake+2,8);this.hitStopFrames=(this.player.spinning||this.player.comboStep===3)?C.HIT_STOP_FRAMES:2;}}
        if(this.hitComboTimer>0){this.hitComboTimer--;if(this.hitComboTimer<=0)this.hitCombo=0;}
        if(this.player.hp<=0)this.gameOver();
        for(let i=particles.length-1;i>=0;i--){particles[i].update();if(particles[i].life<=0)particles.splice(i,1);}
        for(let i=floatingTexts.length-1;i>=0;i--){floatingTexts[i].update();if(floatingTexts[i].life<=0)floatingTexts.splice(i,1);}
        for(const g of this.gates)g.update();
        if(this.objectiveTimer>0)this.objectiveTimer--;
        if(this.bannerTimer>0)this.bannerTimer--;
        this.camera.follow(this.player);this.camera.update();
    }

    victory() {
        this.state='victory';playSound('victory');
        unlockUpTo(this.levelIdx + 1);
        const el=Math.floor((Date.now()-this.startTime)/1000),m=Math.floor(el/60),s=el%60;
        document.getElementById('finalStats').textContent=`KOs: ${this.koCount}  |  Time: ${m}:${s.toString().padStart(2,'0')}`;
        const nextBtn=document.getElementById('btnNextLevel');
        if(this.levelIdx<LEVELS.length-1){nextBtn.style.display='';nextBtn.textContent=`Next: ${LEVELS[this.levelIdx+1].name}`;}
        else{nextBtn.style.display='none';}
        document.getElementById('victoryScreen').classList.remove('hidden');
    }

    gameOver() {
        this.state='gameover';
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    // --- Draw ---
    draw() {
        ctx.fillStyle='#1a3a1a';ctx.fillRect(0,0,C.W,C.H);
        if(this.state!=='playing'||!this.player)return;
        ctx.save();this.camera.applyTransform();
        drawMap(this.camera,this.zones);
        if(this.levelDef.isTutorial)this.drawTutorialGroundElements();
        drawGoalPoint(C.MAP_W/2,this.zones.GOAL_Y,this.goalActive,this.frame);
        for(const g of this.gates)g.draw();drawObstacles();
        const sorted=this.enemies.filter(e=>!e.dead&&e.active).sort((a,b)=>a.y-b.y);
        for(const e of sorted)e.draw();this.player.draw();
        for(const p of particles)p.draw();for(const ft of floatingTexts)ft.draw();
        ctx.restore();drawHUD(this.player,this);
    }

    drawTutorialGroundElements() {
        const cx=C.MAP_W/2,z=this.zones,step=TUTORIAL_STEPS[this.tutorialStep];if(!step)return;
        if(step.id==='move'){for(let y=z.START_Y-30;y>z.START_Y-200;y-=60)drawGroundArrow(cx,y,this.frame);drawGroundMarker(cx,z.ATTACK_Y+100,this.frame,'Walk here');}
        if(step.id==='attack')drawGroundMarker(cx,z.ATTACK_Y,this.frame);
        if(step.id==='combo')drawGroundMarker(cx,z.COMBO_Y,this.frame);
        if(step.id==='special')drawGroundMarker(cx,z.SPECIAL_Y,this.frame);
        if(step.id==='horde1')for(let y=z.BATTLE1_END-30;y>z.BATTLE1_START;y-=100)drawGroundArrow(cx,y,this.frame);
        if(step.id==='horde2')for(let y=z.BATTLE2_END-30;y>z.BATTLE2_START;y-=100)drawGroundArrow(cx,y,this.frame);
        if(step.id==='goal'){drawGroundMarker(cx,z.GOAL_Y,this.frame,'GOAL');for(let y=z.GATE2_Y-30;y>z.GOAL_Y+50;y-=60)drawGroundArrow(cx,y,this.frame);}
    }

    // --- Init ---
    start() {
        canvas.width=C.W;canvas.height=C.H;this.resizeCanvas();
        window.addEventListener('resize',()=>this.resizeCanvas());

        document.getElementById('titleScreen').addEventListener('click',()=>{ensureAudio();this.showLevelSelect();});
        document.getElementById('btnNextLevel').addEventListener('click',()=>{if(this.levelIdx<LEVELS.length-1)this.startLevel(this.levelIdx+1);});
        document.getElementById('btnVictorySelect').addEventListener('click',()=>this.showLevelSelect());
        document.getElementById('btnRetry').addEventListener('click',()=>this.startLevel(this.levelIdx));
        document.getElementById('btnGameOverSelect').addEventListener('click',()=>this.showLevelSelect());
        document.getElementById('btnReset').addEventListener('click',()=>{resetProgress();this.buildLevelGrid();});

        this.loop();
    }
    resizeCanvas(){const a=C.W/C.H;let w=window.innerWidth,h=window.innerHeight;if(w/h>a)w=h*a;else h=w/a;canvas.style.width=w+'px';canvas.style.height=h+'px';}
    loop(){this.update();this.draw();requestAnimationFrame(()=>this.loop());}
}

const game = new Game();
game.start();
