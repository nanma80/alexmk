'use strict';
// =====================================================
//  Paw Pals — take care of your very own kitty!
// =====================================================

const canvas = document.getElementById('room');
const ctx = canvas.getContext('2d');
const W = 960, H = 540, FLOOR_Y = 330;
const SAVE_KEY = 'paw-pals-save';
const TRICK_STARS = 5;       // successful lessons needed to learn a trick
const TREAT_MAX = 3;
const TREAT_REFILL = 90;     // seconds per treat refill
const MAX_POOPS = 4;

// ---------- Helpers ----------
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rnd = (a, b) => Math.random() * (b - a) + a;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const todayStr = () => new Date().toDateString();
const escapeHtml = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

function ell(c, x, y, rx, ry, color, rot = 0) {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    c.fill();
}

function rrect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
}

// ---------- Game data ----------
const FURS = {
    orange: { label: 'Orange Tabby', base: '#F5A54A', dark: '#D9822B', belly: '#FFE8C8', eye: '#6CC36A', line: '#5A3A22', stripes: true },
    gray:   { label: 'Gray Tabby', base: '#A3ADB8', dark: '#7B8591', belly: '#EEF1F4', eye: '#F2C14E', line: '#3A3F45', stripes: true },
    black:  { label: 'Black Cat', base: '#3B3B47', dark: '#24242C', belly: '#5A5A6E', eye: '#F5D547', line: '#D6D6E0', whisker: 'rgba(230,230,240,0.6)' },
    white:  { label: 'Snow White', base: '#F8F6F1', dark: '#D8D0C4', belly: '#FFFFFF', eye: '#58A6E8', line: '#6B5E55' },
    calico: { label: 'Calico', base: '#FBF5EA', dark: '#D9CBB5', belly: '#FFFFFF', eye: '#7CC36E', line: '#5A4636', patch1: '#F0A040', patch2: '#4A4040' },
};
const FUR_KEYS = Object.keys(FURS);

const NAME_IDEAS = ['Mochi', 'Luna', 'Whiskers', 'Ginger', 'Oreo', 'Mittens', 'Biscuit', 'Pumpkin', 'Snowball', 'Pepper', 'Coco', 'Tiger', 'Peaches', 'Bean', 'Nugget', 'Sprinkles'];

const ITEMS = [
    { id: 'yarn',      tab: 'toys',  name: 'Yarn Ball',    icon: '🧶', price: 0 },
    { id: 'mouse',     tab: 'toys',  name: 'Toy Mouse',    icon: '🐭', price: 15 },
    { id: 'bouncy',    tab: 'toys',  name: 'Bouncy Ball',  icon: '🔴', price: 15 },
    { id: 'feather',   tab: 'toys',  name: 'Feather Wand', icon: '🪶', price: 20 },
    { id: 'scratcher', tab: 'home',  name: 'Scratch Post', icon: '🪵', price: 20, furniture: true },
    { id: 'bed',       tab: 'home',  name: 'Cozy Bed',     icon: '🛏️', price: 30, furniture: true },
    { id: 'tree',      tab: 'home',  name: 'Cat Tree',     icon: '🌳', price: 45, furniture: true },
    { id: 'house',     tab: 'home',  name: 'Cat House',    icon: '🏠', price: 50, furniture: true },
    { id: 'tank',      tab: 'home',  name: 'Fish Tank',    icon: '🐠', price: 60, furniture: true },
    { id: 'rug',       tab: 'home',  name: 'Soft Rug',     icon: '🌸', price: 15 },
    { id: 'plant',     tab: 'home',  name: 'Plant',        icon: '🪴', price: 15 },
    { id: 'painting',  tab: 'home',  name: 'Fish Picture', icon: '🖼️', price: 20 },
    { id: 'curtains',  tab: 'home',  name: 'Curtains',     icon: '🪟', price: 20 },
    { id: 'lights',    tab: 'home',  name: 'Twinkle Lights', icon: '✨', price: 25 },
    { id: 'collarRed', tab: 'dress', slot: 'neck', name: 'Bell Collar',  icon: '🔔', price: 10 },
    { id: 'collarBlue', tab: 'dress', slot: 'neck', name: 'Heart Collar', icon: '💙', price: 10 },
    { id: 'bowtie',    tab: 'dress', slot: 'neck', name: 'Bow Tie',      icon: '🦋', price: 15 },
    { id: 'bow',       tab: 'dress', slot: 'head', name: 'Pink Bow',     icon: '🎀', price: 10 },
    { id: 'partyhat',  tab: 'dress', slot: 'head', name: 'Party Hat',    icon: '🥳', price: 15 },
    { id: 'flowers',   tab: 'dress', slot: 'head', name: 'Flower Crown', icon: '🌼', price: 20 },
    { id: 'crown',     tab: 'dress', slot: 'head', name: 'Royal Crown',  icon: '👑', price: 40 },
];
const itemById = id => ITEMS.find(i => i.id === id);
const SHOP_TABS = [{ id: 'toys', label: '🧶 Toys' }, { id: 'home', label: '🏠 Home' }, { id: 'dress', label: '🎀 Dress Up' }];

const TRICKS = [
    { id: 'sit',      name: 'Sit',       icon: '🐾', hearts: 0, base: 0.6 },
    { id: 'highfive', name: 'High Five', icon: '✋', hearts: 0, base: 0.5 },
    { id: 'spin',     name: 'Spin',      icon: '🌀', hearts: 1, base: 0.45 },
    { id: 'jump',     name: 'Jump',      icon: '⬆️', hearts: 2, base: 0.4 },
    { id: 'rollover', name: 'Roll Over', icon: '🔄', hearts: 3, base: 0.35 },
];

// Affection -> hearts level (0..5)
const BONDS = [
    { min: 0,  name: 'Just Met' },
    { min: 8,  name: 'Buddies' },
    { min: 22, name: 'Good Pals' },
    { min: 40, name: 'Close Friends' },
    { min: 65, name: 'Best Friends' },
    { min: 90, name: 'Soulmates' },
];

const ACTIONS = [
    { id: 'feed',   icon: '🐟', label: 'Feed' },
    { id: 'treat',  icon: '🍪', label: 'Treat' },
    { id: 'play',   icon: '🧶', label: 'Play' },
    { id: 'wash',   icon: '🛁', label: 'Wash' },
    { id: 'litter', icon: '🧹', label: 'Litter' },
    { id: 'nap',    icon: '💤', label: 'Nap' },
    { id: 'tricks', icon: '⭐', label: 'Tricks' },
    { id: 'shop',   icon: '🛍️', label: 'Shop' },
    { id: 'dress',  icon: '🎀', label: 'Dress Up' },
];

// Points lost per second while playing
const DECAY = { food: 1 / 30, clean: 1 / 60, energy: 1 / 35, fun: 1 / 25 };

// Room layout
const SPOT = {
    eat:   { x: 222, y: 497 },
    wash:  { x: 480, y: 470 },
    pose:  { x: 360, y: 455 },
    potty: { x: 875, y: 488 },
    bed:   { x: 620, y: 472 },
    rug:   { x: 480, y: 462 },
};
const TOY_SPOTS = { yarn: { x: 420, y: 508 }, mouse: { x: 545, y: 515 }, bouncy: { x: 365, y: 520 }, feather: { x: 250, y: 470 } };
const POOP_POS = [[-30, 0], [2, -2], [30, 1], [-12, -5]];
const LITTER = { x: 875, y: 470 };
const WALK = { minX: 110, maxX: 860, minY: 392, maxY: 522 };

// ---------- Audio (synthesized, no files) ----------
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null, noiseBuf = null, muted = false, lastPurr = 0;

function ensureAudio() {
    if (!audioCtx && AudioCtx) audioCtx = new AudioCtx();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function tone(freq, dur, type = 'sine', vol = 0.15, delay = 0, endFreq = 0) {
    if (!audioCtx || muted) return;
    const t0 = audioCtx.currentTime + delay;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
}

function noise(dur, freq, vol = 0.2, q = 1) {
    if (!audioCtx || muted) return;
    if (!noiseBuf) {
        noiseBuf = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t0 = audioCtx.currentTime;
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuf;
    const f = audioCtx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f).connect(g).connect(audioCtx.destination);
    src.start(t0);
    src.stop(t0 + dur);
}

function meow(pitch = 1) {
    if (!audioCtx || muted) return;
    const t0 = audioCtx.currentTime, d = 0.55;
    const o = audioCtx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(420 * pitch, t0);
    o.frequency.linearRampToValueAtTime(780 * pitch, t0 + 0.18);
    o.frequency.linearRampToValueAtTime(520 * pitch, t0 + d);
    const f = audioCtx.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(900, t0);
    f.frequency.linearRampToValueAtTime(1800, t0 + 0.2);
    f.frequency.linearRampToValueAtTime(1000, t0 + d);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.001, t0);
    g.gain.linearRampToValueAtTime(0.25, t0 + 0.06);
    g.gain.linearRampToValueAtTime(0.18, t0 + 0.35);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + d);
    o.connect(f).connect(g).connect(audioCtx.destination);
    o.start(t0);
    o.stop(t0 + d + 0.05);
    cat.mouthT = 0.4;
}

function purr() {
    if (!audioCtx || muted || time - lastPurr < 1.2) return;
    lastPurr = time;
    const t0 = audioCtx.currentTime, d = 1.2;
    const o = audioCtx.createOscillator();
    o.type = 'sawtooth'; o.frequency.value = 50;
    const f = audioCtx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 350;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.12, t0 + 0.2);
    g.gain.linearRampToValueAtTime(0, t0 + d);
    const lfo = audioCtx.createOscillator(), lfoGain = audioCtx.createGain();
    lfo.frequency.value = 24; lfoGain.gain.value = 0.06;
    lfo.connect(lfoGain).connect(g.gain);
    o.connect(f).connect(g).connect(audioCtx.destination);
    o.start(t0); lfo.start(t0);
    o.stop(t0 + d); lfo.stop(t0 + d);
}

const SFX = {
    coin:    () => { tone(988, 0.08, 'square', 0.06); tone(1319, 0.18, 'square', 0.06, 0.08); },
    sparkle: () => [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.15, 'sine', 0.1, i * 0.07)),
    pop:     () => tone(600, 0.12, 'sine', 0.15, 0, 200),
    nom:     () => { tone(220, 0.06, 'square', 0.05); tone(180, 0.06, 'square', 0.05, 0.09); },
    boing:   () => tone(300, 0.25, 'sine', 0.14, 0, 700),
    splash:  () => noise(0.5, 1200, 0.3, 0.8),
    scrub:   () => noise(0.12, 3000, 0.07, 2),
    pour:    () => { for (let i = 0; i < 6; i++) tone(rnd(1500, 2500), 0.04, 'triangle', 0.05, i * 0.05); },
    nope:    () => { tone(330, 0.12, 'triangle', 0.1); tone(247, 0.18, 'triangle', 0.1, 0.12); },
    tada:    () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.45 : 0.15, 'triangle', 0.12, i * 0.1)),
    click:   () => tone(800, 0.04, 'sine', 0.05),
};

// ---------- State ----------
let state = null;           // saved data (see newState)
let screen = 'title';       // 'title' | 'adopt' | 'home'
let activity = null;        // what the cat is busy doing (eat, play, wash, sleep, trick, ...)
let time = 0;
let bowlFull = false;
let banner = null;
let poopTimers = [];
let currentPanel = null, shopTab = 'toys';
const timers = { hud: 0, save: 5, happy: 0, thought: 6 };
const parts = [];
const keys = {};
const mouse = { x: -100, y: -100, over: false };

const cat = {
    x: 480, y: 460, facing: 1, t: 0,
    target: null, onArrive: null, moving: false, speed: 90,
    using: null, timer: 2, blink: 0, blinkT: 3,
    say: null, thought: null, happyT: 0, mouthT: 0, shakeT: 0, petMeter: 0, wantItem: null,
};

function newState(owner, catName, fur) {
    return {
        v: 1, owner, catName, fur,
        stats: { food: 38, clean: 75, energy: 80, fun: 55 },
        affection: 0, poops: 1, coins: 30,
        owned: ['yarn'], wear: { neck: null, head: null },
        tricks: { sit: 0, highfive: 0, spin: 0, jump: 0, rollover: 0 },
        treats: TREAT_MAX, treatTimer: 0,
        lastSave: Date.now(), lastDay: todayStr(), adopted: Date.now(), bestHeart: 0,
    };
}

function save() {
    if (!state) return;
    state.lastSave = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
}

function load() {
    let s;
    try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; }
    if (!s || !s.catName) return null;
    const d = newState(s.owner, s.catName, s.fur);
    const loaded = Object.assign(d, s, {
        stats: Object.assign(d.stats, s.stats),
        tricks: Object.assign(d.tricks, s.tricks),
        wear: Object.assign(d.wear, s.wear),
    });
    loaded.bestHeart = Math.max(loaded.bestHeart, levelFor(loaded.affection));
    return loaded;
}

// Time away: the kitty gets hungry, bored and a little lonely, but stats never drop below 10.
const AWAY_FLOOR = 10;
function applyTimeAway(s) {
    const mins = Math.min(8 * 60, (Date.now() - s.lastSave) / 60000);
    if (mins < 1) return 0;
    const lower = (v, loss) => v <= AWAY_FLOOR ? v : Math.max(AWAY_FLOOR, v - loss);
    s.stats.food = lower(s.stats.food, mins * 0.5);
    s.stats.fun = lower(s.stats.fun, mins * 0.5);
    s.stats.clean = lower(s.stats.clean, mins * 0.2);
    s.stats.energy = Math.max(s.stats.energy, Math.min(90, s.stats.energy + mins * 2));
    s.poops = Math.min(3, s.poops + Math.floor(mins / 45));
    // Lonely: -1 affection per 30 min away (after the first half hour), at most -8
    s.affection = Math.max(0, s.affection - Math.min(8, Math.max(0, mins - 30) / 30));
    if (mins >= 5) { s.treats = TREAT_MAX; s.treatTimer = 0; }
    return mins;
}

// ---------- Derived values ----------
const owns = id => state && state.owned.includes(id);
const levelFor = aff => { let l = 0; BONDS.forEach((b, i) => { if (aff >= b.min) l = i; }); return l; };
const heartLevel = () => levelFor(state.affection);
const furnitureCount = () => state.owned.filter(id => itemById(id).furniture).length;
const dirtLevel = () => state.stats.clean < 20 ? 3 : state.stats.clean < 35 ? 2 : state.stats.clean < 50 ? 1 : 0;
const ownedToys = () => ITEMS.filter(i => i.tab === 'toys' && owns(i.id));

function happiness() {
    const s = state.stats;
    const litter = 100 - state.poops * 25;
    const h = (s.food + s.clean + s.energy + s.fun * 1.5 + litter) / 5.5 + Math.min(10, furnitureCount() * 2);
    return clamp(h, 0, 100);
}

const moodOf = h => h >= 65 ? 'happy' : h >= 35 ? 'ok' : 'sad';

function urgentNeed() {
    const s = state.stats, list = [];
    if (s.food < 40) list.push({ v: s.food, icon: '🐟', action: 'feed' });
    if (s.energy < 25) list.push({ v: s.energy, icon: '💤', action: 'nap' });
    if (s.clean < 35) list.push({ v: s.clean, icon: '🛁', action: 'wash' });
    if (state.poops >= 2) list.push({ v: 45 - state.poops * 10, icon: '💩', action: 'litter' });
    if (s.fun < 35) list.push({ v: s.fun, icon: '🧶', action: 'play' });
    list.sort((a, b) => a.v - b.v);
    return list[0] || null;
}

function addStat(k, n) { state.stats[k] = clamp(state.stats[k] + n, 0, 100); }

function addAffection(n) {
    const before = heartLevel();
    state.affection = clamp(state.affection + n, 0, 100);
    const after = heartLevel();
    if (after > state.bestHeart) {
        state.bestHeart = after;
        showBanner(`${state.catName} loves you more! ❤️`, `You are now ${BONDS[after].name}`);
        SFX.tada();
        confetti(40);
        meow(1.2);
        state.coins += 10 * after;
    } else if (after > before) {
        // Won back a heart that was lost: smaller celebration, no coins
        catSay('I feel loved again! 💕');
        hearts(3);
    } else if (after < before) {
        catSay('I feel a little lonely... 💔', 3);
        meow(0.8);
    }
}

function reward(coins, affection) {
    if (coins > 0) {
        state.coins += coins;
        const v = catView();
        floatText(v.x + 30, v.y - 100 * v.s, `+${coins} 🪙`, '#C98A00');
        SFX.coin();
    }
    if (affection) addAffection(affection);
}

// ---------- Effects ----------
function addPart(p) {
    const q = Object.assign({ type: 'text', vx: 0, vy: -30, g: 0, life: 1, size: 22, rot: 0, vr: 0, color: '#fff' }, p);
    q.max = q.life;
    parts.push(q);
}

function catHead() {
    const v = catView();
    return { x: v.x, y: v.y - (72 + (v.o.lift || 0)) * v.s, s: v.s };
}

function hearts(n = 3) {
    const h = catHead();
    for (let i = 0; i < n; i++) {
        addPart({ text: pick(['❤️', '💕', '💖']), x: h.x + rnd(-25, 25), y: h.y - 10, vx: rnd(-25, 25), vy: rnd(-70, -40), life: 1.4, size: rnd(18, 26) });
    }
}

function sparkles(x, y, n = 8) {
    for (let i = 0; i < n; i++) {
        addPart({ text: pick(['✨', '⭐', '✨']), x: x + rnd(-40, 40), y: y + rnd(-30, 30), vx: rnd(-30, 30), vy: rnd(-50, -10), life: rnd(0.8, 1.4), size: rnd(16, 24) });
    }
}

function confetti(n = 30) {
    const cols = ['#FF8FB1', '#FFD54F', '#81D4FA', '#A5D6A7', '#B39DDB', '#FFAB91'];
    for (let i = 0; i < n; i++) {
        addPart({ type: 'confetti', x: rnd(100, 860), y: rnd(-20, 40), vx: rnd(-40, 40), vy: rnd(40, 140), g: 60, life: rnd(2, 3), size: rnd(6, 10), color: pick(cols), rot: rnd(0, 6), vr: rnd(-8, 8) });
    }
}

function floatText(x, y, text, color) {
    addPart({ type: 'label', text, x, y, vy: -40, life: 1.3, size: 22, color });
}

function catSay(text, secs = 2.2) {
    cat.say = { text, t: secs };
    cat.thought = null;
}

function showBanner(text, sub = '', secs = 3) {
    banner = { text, sub, t: secs, max: secs };
}

let hintTimeout = null;
function showHint(text, secs = 0) {
    const el = $('hint');
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(hintTimeout);
    if (secs) hintTimeout = setTimeout(hideHint, secs * 1000);
}

function hideHint() {
    clearTimeout(hintTimeout);
    $('hint').classList.add('hidden');
}

function updateParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        p.vy += p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
    }
}

// =====================================================
//  Cat drawing (front-facing chibi kitty)
// =====================================================
const DIRT = 'rgba(120,80,40,0.55)';

function drawCat(c, x, y, s, o) {
    const fur = FURS[o.fur] || FURS.orange;
    const f = o.facing || 1, t = o.t || 0, pose = o.pose || 'sit';
    const lift = o.lift || 0;
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    // Shadow stays on the ground and shrinks when the cat jumps
    const sw = (pose === 'sleep' ? 46 : 30) * (1 - Math.min(lift, 120) / 240);
    ell(c, 0, 0, sw, 7, 'rgba(60,30,10,0.18)');
    c.translate(0, -lift);
    if (o.rot) { c.translate(0, -36); c.rotate(o.rot); c.translate(0, 36); }
    if (o.squishX !== undefined) c.scale(o.squishX, 1);

    let head = { x: f * 3, y: -64 };
    let front = null; // paws drawn in front of the head
    if (pose === 'sleep') {
        const breathe = Math.sin(t * 2) * 1.5;
        ell(c, -f * 4, -18, 40, 19 + breathe, fur.base);
        bodyMarks(c, fur, () => { c.beginPath(); c.ellipse(-f * 4, -18, 40, 19, 0, 0, Math.PI * 2); }, f, o.dirty);
        tailStroke(c, fur, () => { c.beginPath(); c.moveTo(-f * 40, -12); c.quadraticCurveTo(-f * 34, 8, f * 14, 2); });
        head = { x: f * 26, y: -26 };
    } else if (pose === 'scratch') {
        drawTail(c, fur, f, t);
        ell(c, 0, -36, 21, 30, fur.base);
        ell(c, f * 3, -32, 12, 20, fur.belly);
        ell(c, -9, -5, 8, 6, fur.belly);
        ell(c, 9, -5, 8, 6, fur.belly);
        const sc = Math.sin(t * 14) * 5;
        front = () => { ell(c, f * 30, -62 + sc, 7, 6, fur.belly); ell(c, f * 32, -50 - sc, 7, 6, fur.belly); };
        head = { x: f * 6, y: -80 };
    } else if (pose === 'pounce') {
        drawTail(c, fur, f, t + 1);
        ell(c, 0, -24, 32, 19, fur.base, -f * 0.15);
        ell(c, f * 4, -18, 20, 10, fur.belly, -f * 0.15);
        ell(c, -f * 22, -6, 8, 6, fur.belly);
        front = () => { ell(c, f * 38, -30, 8, 6, fur.belly); ell(c, f * 32, -20, 8, 6, fur.belly); };
        head = { x: f * 24, y: -50 };
    } else {
        const walking = pose === 'walk';
        const bob = walking ? Math.abs(Math.sin(t * 12)) * 3 : 0;
        drawTail(c, fur, f, t);
        ell(c, 0, -26 - bob, 25, 25, fur.base);
        ell(c, f * 2, -22 - bob, 14, 16, fur.belly);
        bodyMarks(c, fur, () => { c.beginPath(); c.ellipse(0, -26 - bob, 25, 25, 0, 0, Math.PI * 2); }, f, o.dirty);
        const step = walking ? Math.sin(t * 12) * 4 : 0;
        ell(c, -10, -5 - Math.max(0, step), 8, 6, fur.belly);
        ell(c, 10, -5 - Math.max(0, -step), 8, 6, fur.belly);
        head = { x: f * 3, y: -64 - bob };
        if (pose === 'eat') head = { x: f * 14, y: -48 };
        if (pose === 'highfive') front = () => {
            ell(c, f * 32, -86, 9, 8, fur.belly);
            ell(c, f * 32, -84, 4, 3.5, '#F4A9B8');
        };
        if (pose === 'groom') front = () => ell(c, f * 12, head.y + 22, 7, 6, fur.belly);
    }
    drawHead(c, fur, head.x, head.y, o, pose === 'sleep' ? 0.92 : 1);
    if (front) front();
    if (o.dirty >= 3) {
        c.strokeStyle = 'rgba(110,140,60,0.6)';
        c.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const sx = -30 + i * 30, ph = t * 3 + i;
            c.beginPath();
            c.moveTo(sx, -60);
            c.quadraticCurveTo(sx + Math.sin(ph) * 6, -75, sx, -90);
            c.stroke();
        }
    }
    c.restore();
}

function bodyMarks(c, fur, pathFn, f, dirty) {
    c.save();
    pathFn();
    c.clip();
    if (fur.patch1) {
        ell(c, -f * 14, -36, 13, 10, fur.patch1);
        ell(c, f * 16, -16, 10, 8, fur.patch2);
    }
    if (fur.stripes) {
        c.strokeStyle = fur.dark; c.lineWidth = 3.5; c.lineCap = 'round';
        for (const side of [-1, 1]) {
            for (const yy of [-36, -26]) {
                c.beginPath(); c.moveTo(side * 26, yy); c.lineTo(side * 17, yy + 3); c.stroke();
            }
        }
    }
    if (dirty >= 1) ell(c, -12, -30, 6, 4, DIRT);
    if (dirty >= 2) ell(c, 12, -16, 7, 4, DIRT);
    if (dirty >= 3) ell(c, 4, -40, 5, 3, DIRT);
    c.restore();
}

function tailStroke(c, fur, pathFn) {
    c.lineCap = 'round';
    c.strokeStyle = fur.dark; c.lineWidth = 12; pathFn(); c.stroke();
    c.strokeStyle = fur.base; c.lineWidth = 8; pathFn(); c.stroke();
}

function drawTail(c, fur, f, t) {
    const sway = Math.sin(t * 3) * 8;
    tailStroke(c, fur, () => {
        c.beginPath();
        c.moveTo(-f * 16, -14);
        c.quadraticCurveTo(-f * 48, -12, -f * (42 + sway * 0.4), -50 + sway);
    });
}

function drawHead(c, fur, hx, hy, o, k) {
    const f = o.facing || 1, R = 27;
    c.save();
    c.translate(hx, hy);
    c.rotate(o.tilt || 0);
    c.scale(k, k);
    // Ears
    const earDrop = o.mood === 'sad' ? 0.45 : 0;
    for (const side of [-1, 1]) {
        c.save();
        c.translate(side * 14, -15);
        c.rotate(side * (0.28 + earDrop));
        c.fillStyle = fur.patch1 ? (side < 0 ? fur.patch1 : fur.patch2) : fur.base;
        c.beginPath(); c.moveTo(-10, 4); c.lineTo(0, -22); c.lineTo(10, 4); c.closePath(); c.fill();
        c.fillStyle = '#F4A9B8';
        c.beginPath(); c.moveTo(-5, 2); c.lineTo(0, -13); c.lineTo(5, 2); c.closePath(); c.fill();
        c.restore();
    }
    // Head and markings
    const headPath = () => { c.beginPath(); c.ellipse(0, 0, R + 3, R, 0, 0, Math.PI * 2); };
    c.fillStyle = fur.base;
    headPath(); c.fill();
    c.save();
    headPath(); c.clip();
    if (fur.patch1) { ell(c, -15, -12, 13, 11, fur.patch1); ell(c, 16, -14, 10, 9, fur.patch2); }
    if (fur.stripes) {
        c.strokeStyle = fur.dark; c.lineWidth = 3.5; c.lineCap = 'round';
        for (const i of [-8, 0, 8]) { c.beginPath(); c.moveTo(i * 1.1, -R + 1); c.lineTo(i * 0.9, -R + 10); c.stroke(); }
        for (const side of [-1, 1]) { c.beginPath(); c.moveTo(side * (R + 3), -3); c.lineTo(side * (R - 6), -1); c.stroke(); }
    }
    if (o.dirty >= 2) ell(c, -f * 13, -11, 6, 4, DIRT);
    c.restore();

    const fx = f * 3 + (o.lookX || 0), fy = o.lookY || 0;
    ell(c, fx, 9, 13, 9, fur.belly);
    if (o.mood === 'happy') {
        c.fillStyle = 'rgba(255,120,150,0.35)';
        for (const side of [-1, 1]) { c.beginPath(); c.arc(fx + side * 17, 6, 5, 0, Math.PI * 2); c.fill(); }
    }
    drawEyes(c, fur, fx, fy, o);
    // Nose and mouth
    c.fillStyle = '#F28C9A';
    c.beginPath(); c.moveTo(fx - 4, 4); c.lineTo(fx + 4, 4); c.lineTo(fx, 8.5); c.closePath(); c.fill();
    c.strokeStyle = fur.line; c.lineWidth = 1.8; c.lineCap = 'round';
    if (o.mouth === 'open') {
        ell(c, fx, 13, 4.5, 4, '#7A2E3A');
    } else if (o.mood === 'sad') {
        c.beginPath(); c.arc(fx, 15, 4, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    } else {
        c.beginPath(); c.arc(fx - 3.5, 9, 3.5, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
        c.beginPath(); c.arc(fx + 3.5, 9, 3.5, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
    }
    // Whiskers
    c.strokeStyle = fur.whisker || 'rgba(80,60,50,0.55)'; c.lineWidth = 1.2;
    for (const side of [-1, 1]) {
        for (const w of [-1, 0, 1]) {
            c.beginPath(); c.moveTo(fx + side * 11, 8 + w * 2.5); c.lineTo(fx + side * 28, 6 + w * 5); c.stroke();
        }
    }
    if (o.neck) drawNeckItem(c, o.neck);
    if (o.headItem) drawHeadItem(c, o.headItem);
    c.restore();
}

function drawEyes(c, fur, fx, fy, o) {
    const ey = -3 + fy;
    const kind = o.blink ? 'closed' : (o.eyes || 'open');
    c.strokeStyle = fur.line; c.lineWidth = 2.5; c.lineCap = 'round';
    for (const side of [-1, 1]) {
        const ex = fx + side * 10;
        if (kind === 'happy') {
            c.beginPath(); c.arc(ex, ey + 3, 5, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
        } else if (kind === 'closed') {
            c.beginPath(); c.arc(ex, ey - 2, 5, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
        } else {
            ell(c, ex, ey, 6.5, 8, fur.eye);
            ell(c, ex + (o.facing || 1) * 0.8 + (o.lookX || 0) * 0.3, ey + (o.lookY || 0) * 0.4, 3.5, 6, '#1E1E24');
            ell(c, ex - 2, ey - 3, 2.2, 2.2, '#FFFFFF');
            if (kind === 'sleepy') {
                c.fillStyle = fur.base;
                c.fillRect(ex - 8, ey - 10, 16, 9);
                c.beginPath(); c.moveTo(ex - 7, ey - 1); c.lineTo(ex + 7, ey - 1); c.stroke();
            }
        }
        if (o.mood === 'sad' && kind !== 'closed') {
            c.beginPath(); c.moveTo(ex + side * 6, ey - 11); c.lineTo(ex - side * 5, ey - 15); c.stroke();
        }
    }
}

function heartPath(c, x, y, s) {
    c.beginPath();
    c.moveTo(x, y + s * 0.9);
    c.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.6, y - s * 1.4, x, y - s * 0.4);
    c.bezierCurveTo(x + s * 0.6, y - s * 1.4, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
    c.closePath();
}

function drawNeckItem(c, id) {
    if (id === 'bowtie') {
        c.fillStyle = '#8E5BD8';
        c.beginPath();
        c.moveTo(0, 26); c.lineTo(-13, 19); c.lineTo(-13, 33); c.closePath();
        c.moveTo(0, 26); c.lineTo(13, 19); c.lineTo(13, 33); c.closePath();
        c.fill();
        ell(c, 0, 26, 4, 4, '#6A3FB5');
        return;
    }
    c.strokeStyle = id === 'collarRed' ? '#E53935' : '#1E88E5';
    c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.ellipse(0, 20, 19, 7, 0, 0.12 * Math.PI, 0.88 * Math.PI); c.stroke();
    if (id === 'collarRed') {
        ell(c, 0, 31, 5, 5, '#FFD54F');
        c.strokeStyle = '#B8860B'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(-3, 32); c.lineTo(3, 32); c.stroke();
    } else {
        c.fillStyle = '#FF8FB1';
        heartPath(c, 0, 31, 5); c.fill();
    }
}

function drawHeadItem(c, id) {
    const R = 27;
    if (id === 'bow') {
        c.save(); c.translate(18, -22); c.rotate(0.3);
        ell(c, -8, 0, 9, 6, '#FF6FA8', -0.3);
        ell(c, 8, 0, 9, 6, '#FF6FA8', 0.3);
        ell(c, 0, 0, 4, 4, '#E0408A');
        c.restore();
    } else if (id === 'partyhat') {
        c.save(); c.translate(-2, -R + 5); c.rotate(-0.12);
        c.fillStyle = '#4FC3F7';
        c.beginPath(); c.moveTo(-12, 0); c.lineTo(12, 0); c.lineTo(0, -30); c.closePath(); c.fill();
        ell(c, -3, -7, 2.5, 2.5, '#FFEB3B');
        ell(c, 4, -14, 2.5, 2.5, '#FF5C8A');
        ell(c, -1, -21, 2, 2, '#FFEB3B');
        ell(c, 0, -31, 5, 5, '#FF5C8A');
        c.restore();
    } else if (id === 'flowers') {
        const cols = ['#FF8FB1', '#FFD54F', '#B39DDB', '#81D4FA', '#FF8A65'];
        for (let i = 0; i < 5; i++) {
            const a = -Math.PI * 0.85 + i * (Math.PI * 0.7 / 4);
            const px = Math.cos(a) * (R + 1), py = Math.sin(a) * (R - 2);
            for (let p = 0; p < 5; p++) {
                const pa = p * Math.PI * 2 / 5;
                ell(c, px + Math.cos(pa) * 3.5, py + Math.sin(pa) * 3.5, 3, 3, cols[i]);
            }
            ell(c, px, py, 2.2, 2.2, '#FFF59D');
        }
    } else if (id === 'crown') {
        c.save(); c.translate(0, -R + 3);
        c.fillStyle = '#FFC928';
        c.beginPath();
        c.moveTo(-14, 0); c.lineTo(-14, -14); c.lineTo(-7, -7); c.lineTo(0, -17);
        c.lineTo(7, -7); c.lineTo(14, -14); c.lineTo(14, 0); c.closePath();
        c.fill();
        c.strokeStyle = '#E0A400'; c.lineWidth = 1.5; c.stroke();
        ell(c, 0, -5, 2.5, 2.5, '#E53935');
        ell(c, -8, -4, 2, 2, '#42A5F5');
        ell(c, 8, -4, 2, 2, '#66BB6A');
        c.restore();
    }
}

function drawToy(c, id, x, y, t) {
    if (id === 'yarn') {
        ell(c, x, y, 13, 13, '#EC6F9C');
        c.strokeStyle = '#C94F7C'; c.lineWidth = 2;
        for (let i = -1; i <= 1; i++) { c.beginPath(); c.arc(x + i * 3, y, 10, -1.2 + i * 0.3, 1.4 + i * 0.3); c.stroke(); }
        c.beginPath(); c.moveTo(x + 10, y + 8); c.quadraticCurveTo(x + 24, y + 14, x + 30, y + 6); c.stroke();
    } else if (id === 'mouse') {
        c.strokeStyle = '#E58C9A'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(x + 14, y); c.quadraticCurveTo(x + 26, y - 6, x + 30, y + 4); c.stroke();
        ell(c, x, y, 16, 10, '#9E9EA8');
        ell(c, x - 9, y - 9, 5, 5, '#F4A9B8');
        ell(c, x - 15, y - 1, 2, 2, '#222');
    } else if (id === 'bouncy') {
        ell(c, x, y, 11, 11, '#FF5252');
        c.strokeStyle = '#fff'; c.lineWidth = 2.5;
        c.beginPath(); c.arc(x, y, 7, -0.5, 1.8); c.stroke();
    } else if (id === 'feather') {
        c.strokeStyle = '#8D6E63'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + 26, y - 30); c.stroke();
        const sway = Math.sin(t * 6) * 0.3;
        ell(c, x - 6, y + 2, 12, 4, '#4FC3F7', 0.6 + sway);
        ell(c, x - 4, y + 6, 11, 4, '#FF8FB1', 1.2 + sway);
        ell(c, x - 8, y - 2, 10, 3.5, '#FFD54F', 0.1 + sway);
    }
}

// =====================================================
//  Room drawing
// =====================================================
function drawWall() {
    const g = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
    g.addColorStop(0, '#FFE7D1');
    g.addColorStop(1, '#FFD9BD');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, FLOOR_Y);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let row = 0, y = 30; y < FLOOR_Y - 20; y += 50, row++) {
        for (let x = 15 + (row % 2) * 30; x < W; x += 60) {
            ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
        }
    }
    ctx.fillStyle = '#FFF7EE';
    ctx.fillRect(0, FLOOR_Y - 12, W, 14);
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    ctx.fillRect(0, FLOOR_Y + 2, W, 3);
}

function drawFloor() {
    ctx.fillStyle = '#E3B27A';
    ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
    ctx.strokeStyle = 'rgba(140,90,40,0.22)';
    ctx.lineWidth = 2;
    for (let i = 0, y = FLOOR_Y + 30; y < H + 34; y += 34, i++) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        for (let x = 40 + (i % 2) * 90; x < W; x += 180) {
            ctx.beginPath(); ctx.moveTo(x, y - 34); ctx.lineTo(x, y); ctx.stroke();
        }
    }
}

function drawWindow() {
    const x = 400, y = 50, w = 160, h = 150;
    const hr = new Date().getHours(), day = hr >= 7 && hr < 19;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, day ? '#7FCBFF' : '#1B2550');
    g.addColorStop(1, day ? '#CDEEFF' : '#3B4C8A');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    if (day) {
        ell(ctx, x + 120, y + 35, 18, 18, '#FFE066');
        for (let i = 0; i < 2; i++) {
            const cx = x + ((time * 8 + i * 110) % (w + 80)) - 40, cy = y + 70 + i * 35;
            ell(ctx, cx, cy, 22, 10, '#fff'); ell(ctx, cx + 14, cy - 6, 14, 10, '#fff'); ell(ctx, cx - 12, cy - 3, 12, 8, '#fff');
        }
    } else {
        ell(ctx, x + 115, y + 38, 16, 16, '#FFF6C9');
        ell(ctx, x + 123, y + 33, 14, 14, '#2A386E');
        for (let i = 0; i < 9; i++) {
            const sx = x + 12 + (i * 37) % (w - 20), sy = y + 15 + (i * 53) % (h - 30);
            ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 2 + i);
            ell(ctx, sx, sy, 1.8, 1.8, '#fff');
        }
        ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 8;
    ctx.strokeRect(x, y, w, h);
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
    ctx.fillStyle = '#FFF7EE';
    rrect(ctx, x - 14, y + h + 2, w + 28, 12, 4); ctx.fill();
    if (owns('curtains')) {
        for (const side of [-1, 1]) {
            const cx = side < 0 ? x - 22 : x + w + 22;
            ctx.fillStyle = '#FF9EC0';
            ctx.beginPath();
            ctx.moveTo(cx - side * 2, y - 14);
            ctx.lineTo(cx + side * 34, y - 14);
            ctx.quadraticCurveTo(cx + side * 10, y + 90, cx + side * 30, y + h + 10);
            ctx.lineTo(cx - side * 6, y + h + 10);
            ctx.closePath(); ctx.fill();
            ell(ctx, cx + side * 12, y + 92, 10, 5, '#E36A98');
        }
        ctx.fillStyle = '#C98A5E';
        ctx.fillRect(x - 40, y - 18, w + 80, 6);
    }
}

function drawPainting() {
    const x = 130, y = 90;
    ctx.fillStyle = '#E0A93A'; rrect(ctx, x, y, 100, 76, 6); ctx.fill();
    ctx.fillStyle = '#BFE6FF'; ctx.fillRect(x + 8, y + 8, 84, 60);
    ell(ctx, x + 50, y + 40, 20, 11, '#FF8A65');
    ctx.fillStyle = '#FF8A65';
    ctx.beginPath(); ctx.moveTo(x + 68, y + 40); ctx.lineTo(x + 82, y + 30); ctx.lineTo(x + 82, y + 50); ctx.closePath(); ctx.fill();
    ell(ctx, x + 38, y + 37, 2.5, 2.5, '#333');
    ell(ctx, x + 22, y + 26, 3, 3, 'rgba(255,255,255,0.8)');
    ell(ctx, x + 28, y + 18, 2, 2, 'rgba(255,255,255,0.8)');
}

function drawLights() {
    const cols = ['#FF6B9A', '#FFD54F', '#81D4FA', '#A5D6A7', '#CE93D8'];
    ctx.strokeStyle = '#6D8B5A'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const x0 = 20 + i * 155;
        ctx.moveTo(x0, 18); ctx.quadraticCurveTo(x0 + 77, 46, x0 + 155, 18);
    }
    ctx.stroke();
    for (let i = 0; i < 30; i++) {
        const seg = Math.floor(i / 5), k = (i % 5 + 0.5) / 5;
        const x0 = 20 + seg * 155;
        const bx = x0 + k * 155, by = 24 + 56 * k * (1 - k);
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 3 + i * 1.7);
        ell(ctx, bx, by + 4, 4.5, 6, cols[i % cols.length]);
    }
    ctx.globalAlpha = 1;
}

function drawPlant() {
    const x = 920, y = 362;
    ctx.fillStyle = '#4CAF50';
    for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.35 + Math.sin(time + i) * 0.03;
        ell(ctx, x + Math.cos(a) * 34, y - 52 + Math.sin(a) * 40, 9, 26, i % 2 ? '#43A047' : '#66BB6A', a + Math.PI / 2);
    }
    ctx.fillStyle = '#D9774B';
    ctx.beginPath(); ctx.moveTo(x - 25, y - 42); ctx.lineTo(x + 25, y - 42); ctx.lineTo(x + 19, y); ctx.lineTo(x - 19, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#C0643A'; ctx.fillRect(x - 27, y - 46, 54, 8);
}

function drawTank() {
    ctx.fillStyle = '#9C6B43'; ctx.fillRect(548, 300, 104, 72);
    ctx.fillStyle = '#86593A'; ctx.fillRect(556, 310, 40, 52); ctx.fillRect(604, 310, 40, 52);
    ctx.fillStyle = 'rgba(127,208,240,0.85)'; ctx.fillRect(552, 232, 96, 68);
    ctx.fillStyle = '#F2DCA0'; ctx.fillRect(552, 290, 96, 10);
    ctx.strokeStyle = '#4CAF50'; ctx.lineWidth = 3;
    for (const sx of [566, 632]) {
        ctx.beginPath(); ctx.moveTo(sx, 292); ctx.quadraticCurveTo(sx + Math.sin(time * 2 + sx) * 6, 268, sx, 250); ctx.stroke();
    }
    for (let i = 0; i < 2; i++) {
        const fx = 600 + Math.sin(time * 0.7 + i * 2) * 32, fy = 255 + i * 18;
        const dir = Math.cos(time * 0.7 + i * 2) > 0 ? 1 : -1;
        const col = i ? '#FFB74D' : '#FF7043';
        ell(ctx, fx, fy, 9, 6, col);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.moveTo(fx - dir * 8, fy); ctx.lineTo(fx - dir * 15, fy - 5); ctx.lineTo(fx - dir * 15, fy + 5); ctx.closePath(); ctx.fill();
        ell(ctx, fx + dir * 4, fy - 1, 1.5, 1.5, '#222');
    }
    for (let i = 0; i < 3; i++) {
        const by = 290 - ((time * 20 + i * 20) % 55);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(585 + i * 4, by, 2.5, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.strokeStyle = '#5D8AA8'; ctx.lineWidth = 4; ctx.strokeRect(552, 232, 96, 68);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(558, 238, 8, 50);
}

function drawTree() {
    ctx.fillStyle = '#C49A6C'; rrect(ctx, 28, 370, 100, 18, 6); ctx.fill();
    ctx.fillStyle = '#E2C08F'; ctx.fillRect(70, 170, 18, 202);
    ctx.strokeStyle = 'rgba(150,110,60,0.5)'; ctx.lineWidth = 2;
    for (let y = 176; y < 370; y += 8) { ctx.beginPath(); ctx.moveTo(70, y); ctx.lineTo(88, y + 3); ctx.stroke(); }
    ctx.fillStyle = '#8FB8DE';
    rrect(ctx, 66, 290, 90, 12, 5); ctx.fill();
    rrect(ctx, 14, 226, 80, 12, 5); ctx.fill();
    rrect(ctx, 34, 158, 90, 14, 6); ctx.fill();
    ell(ctx, 79, 158, 40, 7, '#A9CBEA');
    ctx.strokeStyle = '#E58C9A'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(140, 302); ctx.lineTo(140, 328 + Math.sin(time * 2) * 2); ctx.stroke();
    ell(ctx, 140, 332 + Math.sin(time * 2) * 2, 6, 6, '#FFD54F');
}

function drawScratcher() {
    ctx.fillStyle = '#9FC5A8'; rrect(ctx, 262, 398, 76, 14, 5); ctx.fill();
    ctx.fillStyle = '#DDBB88'; ctx.fillRect(289, 318, 22, 82);
    ctx.strokeStyle = 'rgba(150,110,60,0.55)'; ctx.lineWidth = 2;
    for (let y = 322; y < 398; y += 6) { ctx.beginPath(); ctx.moveTo(289, y); ctx.lineTo(311, y + 2); ctx.stroke(); }
    ctx.fillStyle = '#9FC5A8'; rrect(ctx, 280, 310, 40, 10, 4); ctx.fill();
}

function drawHouse() {
    const inside = cat.using && cat.using.id === 'house';
    ctx.fillStyle = '#F2A07B'; ctx.fillRect(712, 322, 96, 80);
    ctx.fillStyle = '#C8644B';
    ctx.beginPath(); ctx.moveTo(700, 328); ctx.lineTo(760, 280); ctx.lineTo(820, 328); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4A2C2A';
    ctx.beginPath(); ctx.arc(760, 402, 26, Math.PI, 0); ctx.closePath(); ctx.fill();
    ell(ctx, 760, 302, 8, 8, '#FFE1A8');
    if (inside) {
        const fur = FURS[state.fur];
        const blink = cat.blink > 0;
        for (const side of [-1, 1]) {
            if (blink) { ctx.fillStyle = fur.eye; ctx.fillRect(760 + side * 9 - 5, 386, 10, 2); }
            else ell(ctx, 760 + side * 9, 387, 4.5, 5.5, fur.eye === '#F5D547' ? fur.eye : '#FFE066');
        }
    }
}

function drawBed() {
    ell(ctx, 620, 470, 62, 22, '#9C88D6');
    ell(ctx, 620, 468, 48, 14, '#D9CCF7');
}

function drawRug() {
    ell(ctx, 480, 462, 170, 46, '#F6B5C8');
    ell(ctx, 480, 462, 140, 34, '#F9CEDB');
    for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2;
        ell(ctx, 480 + Math.cos(a) * 155, 462 + Math.sin(a) * 40, 4, 3, '#FFFFFF');
    }
}

function drawBowls() {
    ell(ctx, 120, 500, 22, 8, '#5FA8E0');
    ell(ctx, 120, 496, 18, 5, '#BFE6FF');
    ell(ctx, 170, 497, 28, 10, '#E86A6A');
    ell(ctx, 170, 492, 24, 7, '#B84848');
    if (bowlFull) {
        for (let i = 0; i < 7; i++) ell(ctx, 156 + i * 4.5, 489 - (i % 2) * 2, 4, 3, '#A8683A');
    }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🐟', 170, 503);
}

function poopPos(i) {
    return { x: LITTER.x + POOP_POS[i][0], y: LITTER.y + POOP_POS[i][1] };
}

function drawPoop(x, y) {
    ell(ctx, x, y, 9, 5, '#7B4A2D');
    ell(ctx, x, y - 5, 7, 4, '#8D5A3B');
    ell(ctx, x + 1, y - 9, 4, 3, '#9C6A48');
}

function drawLitter() {
    ctx.fillStyle = '#61BFAE'; rrect(ctx, 818, 462, 114, 44, 10); ctx.fill();
    ell(ctx, 875, 466, 50, 9, '#EEDFAE');
    for (let i = 0; i < state.poops; i++) { const p = poopPos(i); drawPoop(p.x, p.y); }
    ctx.fillStyle = '#4FA595'; rrect(ctx, 818, 476, 114, 30, 10); ctx.fill();
    ctx.font = '16px serif'; ctx.textAlign = 'center';
    ctx.fillText('🐾', 875, 497);
    if (state.poops >= 2) {
        ctx.strokeStyle = 'rgba(110,140,60,0.6)'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const sx = 850 + i * 25, ph = time * 3 + i;
            ctx.beginPath(); ctx.moveTo(sx, 455); ctx.quadraticCurveTo(sx + Math.sin(ph) * 6, 440, sx, 425); ctx.stroke();
        }
    }
}

function drawTub(front, a) {
    if (!front) {
        ell(ctx, 480, 452, 80, 18, '#B0BEC5');
        return;
    }
    ctx.fillStyle = '#ECEFF1';
    ctx.beginPath();
    ctx.moveTo(398, 450);
    ctx.lineTo(562, 450);
    ctx.quadraticCurveTo(556, 500, 480, 500);
    ctx.quadraticCurveTo(404, 500, 398, 450);
    ctx.fill();
    ctx.strokeStyle = '#CFD8DC'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(480, 451, 82, 9, 0, 0, Math.PI); ctx.stroke();
    ell(ctx, 420, 503, 7, 4, '#B0BEC5');
    ell(ctx, 540, 503, 7, 4, '#B0BEC5');
    const suds = Math.floor((a.progress / 100) * 14) + 3;
    for (let i = 0; i < suds; i++) {
        const sx = 410 + (i * 53) % 140, sy = 446 + Math.sin(i * 2.3) * 4;
        ell(ctx, sx, sy, 9 + (i % 3) * 3, 7 + (i % 2) * 3, 'rgba(255,255,255,0.95)');
    }
}

function drawSpeech() {
    const h = catHead();
    if (cat.say) {
        ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
        const w = ctx.measureText(cat.say.text).width + 28;
        const bx = clamp(h.x - w / 2, 8, W - w - 8), by = h.y - 78;
        ctx.globalAlpha = clamp(cat.say.t * 4, 0, 1);
        ctx.fillStyle = '#fff';
        rrect(ctx, bx, by, w, 40, 14); ctx.fill();
        ctx.beginPath(); ctx.moveTo(h.x - 8, by + 39); ctx.lineTo(h.x + 8, by + 39); ctx.lineTo(h.x, by + 52); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5A3E36'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(cat.say.text, bx + w / 2, by + 21);
        ctx.textBaseline = 'alphabetic';
        ctx.globalAlpha = 1;
    } else if (cat.thought) {
        const bx = h.x + 40, by = h.y - 60;
        ctx.globalAlpha = clamp(cat.thought.t * 3, 0, 1);
        ell(ctx, h.x + 16, h.y - 18, 4, 4, '#fff');
        ell(ctx, h.x + 26, h.y - 32, 7, 7, '#fff');
        ell(ctx, bx, by, 30, 24, '#fff');
        ell(ctx, bx - 18, by + 6, 16, 14, '#fff');
        ell(ctx, bx + 18, by + 6, 16, 14, '#fff');
        ctx.font = '30px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(cat.thought.icon, bx, by + 2 + Math.sin(time * 4) * 2);
        ctx.textBaseline = 'alphabetic';
        ctx.globalAlpha = 1;
    }
}

function drawParts() {
    for (const p of parts) {
        ctx.globalAlpha = clamp(p.life / p.max * 1.6, 0, 1);
        if (p.type === 'confetti') {
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            ctx.restore();
        } else if (p.type === 'bubble') {
            ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.stroke();
            ell(ctx, p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.25, p.size * 0.25, 'rgba(255,255,255,0.8)');
        } else if (p.type === 'drop') {
            ell(ctx, p.x, p.y, 3, 5, '#64B5F6');
        } else if (p.type === 'label') {
            ctx.font = `bold ${p.size}px "Trebuchet MS", sans-serif`; ctx.textAlign = 'center';
            ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.strokeText(p.text, p.x, p.y);
            ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y);
        } else {
            ctx.font = `${p.size}px serif`; ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x, p.y);
        }
    }
    ctx.globalAlpha = 1;
}

function drawBanner() {
    if (!banner) return;
    const k = Math.min(1, (banner.max - banner.t) * 5, banner.t * 3);
    ctx.save();
    ctx.globalAlpha = clamp(k, 0, 1);
    ctx.translate(W / 2, 120);
    ctx.scale(0.8 + 0.2 * clamp(k, 0, 1), 0.8 + 0.2 * clamp(k, 0, 1));
    ctx.font = 'bold 36px "Trebuchet MS", sans-serif';
    const w = Math.max(ctx.measureText(banner.text).width, 300) + 60;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    rrect(ctx, -w / 2, -48, w, banner.sub ? 100 : 72, 24); ctx.fill();
    ctx.strokeStyle = '#FF8FB1'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#FF6F9C'; ctx.textAlign = 'center';
    ctx.fillText(banner.text, 0, 0);
    if (banner.sub) {
        ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
        ctx.fillStyle = '#7A5A50';
        ctx.fillText(banner.sub, 0, 34);
    }
    ctx.restore();
}

// Where and how to draw the cat right now
const depthScale = y => 0.88 + (y - WALK.minY) / (WALK.maxY - WALK.minY) * 0.24;

function catView() {
    const a = activity, mood = moodOf(happiness());
    let x = cat.x, y = cat.y, s = depthScale(cat.y);
    const o = {
        fur: state.fur, facing: cat.facing, t: cat.t, pose: cat.moving ? 'walk' : 'sit',
        mood, eyes: state.stats.energy < 25 ? 'sleepy' : 'open', blink: cat.blink > 0,
        neck: state.wear.neck, headItem: state.wear.head, dirty: dirtLevel(), lift: 0,
    };
    if (cat.happyT > 0) { o.eyes = 'happy'; o.mood = 'happy'; }
    if (cat.mouthT > 0) o.mouth = 'open';
    if (cat.shakeT > 0) o.tilt = Math.sin(cat.t * 30) * 0.25;
    const u = cat.using;
    if (u && !cat.target) {
        if (u.id === 'tree') { x = 79; y = 160; s = 0.72; }
        else if (u.id === 'house') o.hidden = true;
        else if (u.id === 'scratcher') o.pose = 'scratch';
        else if (u.id === 'bed') { o.pose = 'sleep'; o.eyes = 'closed'; o.blink = false; }
        else if (u.id === 'tank') { o.lookY = -4; o.lookX = 2; }
        else if (u.id === 'toy') o.pose = Math.sin(cat.t * 7) > 0.2 ? 'pounce' : 'sit';
        else if (u.id === 'groom') { o.pose = 'groom'; o.eyes = 'closed'; }
        else if (u.id === 'potty') o.eyes = 'happy';
    }
    if (a && !a.walking) {
        if (a.type === 'eat') { o.pose = 'eat'; o.eyes = 'closed'; }
        else if (a.type === 'sleep') { o.pose = 'sleep'; o.eyes = 'closed'; o.blink = false; }
        else if (a.type === 'treat') {
            const e = a.el;
            if (e > 0.35 && e < 0.85) o.lift = Math.sin((e - 0.35) / 0.5 * Math.PI) * 45;
            if (e > 0.4 && e < 0.7) o.mouth = 'open';
            o.eyes = e > 0.7 ? 'happy' : 'open';
        } else if (a.type === 'play') {
            o.eyes = 'open';
            if (a.pounceT > 0) { o.pose = 'pounce'; o.lift = Math.sin((1 - a.pounceT / 0.45) * Math.PI) * a.jumpH; }
        } else if (a.type === 'wash') {
            o.eyes = a.phase === 'scrub' ? 'happy' : 'closed';
            if (a.phase === 'shake') o.rot = Math.sin(a.t * 40) * 0.15;
        } else if (a.type === 'trick') {
            trickView(a, o);
        }
    }
    return { x, y, s, o };
}

function trickView(a, o) {
    const p = clamp(a.t / a.dur, 0, 1);
    o.pose = 'sit';
    if (!a.success) { o.tilt = Math.sin(p * Math.PI) * 0.35; o.eyes = 'open'; return; }
    o.eyes = p > 0.6 ? 'happy' : 'open';
    o.mood = 'happy';
    if (a.id === 'sit') o.lift = p < 0.4 ? Math.sin(p / 0.4 * Math.PI) * 18 : 0;
    else if (a.id === 'highfive') { if (p > 0.15 && p < 0.9) o.pose = 'highfive'; }
    else if (a.id === 'spin') o.squishX = Math.cos(p * Math.PI * 4);
    else if (a.id === 'jump') o.lift = Math.sin(p * Math.PI) * 95;
    else if (a.id === 'rollover') { o.rot = cat.facing * p * Math.PI * 2; o.lift = Math.sin(p * Math.PI) * 15; }
}

function drawTheCat() {
    const v = catView();
    const washing = activity && activity.type === 'wash' && !activity.walking;
    if (washing) drawTub(false, activity);
    if (!v.o.hidden) drawCat(ctx, v.x, v.y, v.s, v.o);
    if (washing) drawTub(true, activity);
}

function catSortY() {
    if (cat.using && !cat.target && cat.using.id === 'tree') return 386;
    return cat.y;
}

function render() {
    ctx.clearRect(0, 0, W, H);
    drawWall();
    drawWindow();
    if (owns('painting')) drawPainting();
    if (owns('lights')) drawLights();
    drawFloor();
    if (!state) return;
    if (owns('rug')) drawRug();
    const list = [];
    if (owns('tank')) list.push({ y: 372, d: drawTank });
    if (owns('plant')) list.push({ y: 362, d: drawPlant });
    if (owns('tree')) list.push({ y: 385, d: drawTree });
    if (owns('house')) list.push({ y: 402, d: drawHouse });
    if (owns('scratcher')) list.push({ y: 410, d: drawScratcher });
    if (owns('bed')) list.push({ y: 468, d: drawBed });
    list.push({ y: 492, d: drawBowls });
    list.push({ y: 500, d: drawLitter });
    const playToy = activity && activity.type === 'play' ? activity.toy : null;
    for (const t of ownedToys()) {
        if (t.id === playToy) continue;
        const sp = TOY_SPOTS[t.id];
        list.push({ y: sp.y, d: () => drawToy(ctx, t.id, sp.x, sp.y, time) });
    }
    if (screen === 'home') list.push({ y: catSortY(), d: drawTheCat });
    list.sort((a, b) => a.y - b.y);
    for (const item of list) item.d();

    if (activity && activity.type === 'play') {
        const a = activity;
        const gy = clamp(a.ty, WALK.minY, WALK.maxY + 8);
        ell(ctx, a.tx, gy + 6, 12, 4, 'rgba(60,30,10,0.18)');
        const bounce = a.toy === 'bouncy' ? -Math.abs(Math.sin(time * 8)) * 14 : 0;
        drawToy(ctx, a.toy, a.tx, a.ty + bounce, time);
    }
    if (activity && activity.type === 'treat' && activity.el < 0.6) {
        const a = activity, h = catHead();
        const k = clamp(a.el / 0.6, 0, 1);
        ctx.font = '28px serif'; ctx.textAlign = 'center';
        ctx.fillText('🍪', h.x, (h.y - 230) + k * 220);
    }
    if (activity && activity.type === 'sleep' && !activity.walking) {
        ctx.fillStyle = 'rgba(25,25,70,0.35)';
        ctx.fillRect(0, 0, W, H);
    }
    if (screen === 'home') {
        drawParts();
        drawSpeech();
        drawBanner();
    }
}

// =====================================================
//  Cat behaviour
// =====================================================
function goTo(spot, then) {
    cat.target = { x: clamp(spot.x, WALK.minX, WALK.maxX), y: clamp(spot.y, WALK.minY, WALK.maxY) };
    cat.onArrive = then || null;
}

function stopUsing() {
    const u = cat.using;
    if (!u) return;
    cat.using = null;
    if (u.id === 'potty') addPoop();
    if (u.id === 'tree') { cat.x = 110; cat.y = 395; }
    if (u.id === 'house') { cat.x = 760; cat.y = 412; }
}

function startActivity(a, spot) {
    stopUsing();
    cat.target = null;
    cat.onArrive = null;
    cat.moving = false;
    cat.thought = null;
    activity = a;
    if (spot) {
        a.walking = true;
        goTo(spot);
    }
}

function endActivity() {
    activity = null;
    cat.timer = rnd(1.5, 3);
}

function updateCat(dt) {
    cat.t += dt;
    cat.blinkT -= dt;
    if (cat.blinkT <= 0) { cat.blink = 0.13; cat.blinkT = rnd(2, 5); }
    cat.blink -= dt;
    cat.happyT -= dt;
    cat.mouthT -= dt;
    cat.shakeT -= dt;
    if (cat.say) { cat.say.t -= dt; if (cat.say.t <= 0) cat.say = null; }
    if (cat.thought) { cat.thought.t -= dt; if (cat.thought.t <= 0) cat.thought = null; }

    const playing = activity && activity.type === 'play';
    if (!playing) cat.moving = false;
    if (cat.target) {
        const dx = cat.target.x - cat.x, dy = cat.target.y - cat.y, d = Math.hypot(dx, dy);
        const step = cat.speed * (state.stats.energy < 25 ? 0.7 : 1) * dt;
        if (d <= step + 0.5) {
            cat.x = cat.target.x; cat.y = cat.target.y;
            cat.target = null;
            const cb = cat.onArrive;
            cat.onArrive = null;
            if (cb) cb();
        } else {
            cat.x += dx / d * step;
            cat.y += dy / d * step;
            if (Math.abs(dx) > 2) cat.facing = dx > 0 ? 1 : -1;
            cat.moving = true;
        }
    }
    if (!activity) updateCatAI(dt);

    // Holding P pets the cat
    if (keys.p && (!activity || activity.type === 'sleep')) petCat(260 * dt);

    // Thought bubble about what the kitty needs
    timers.thought -= dt;
    if (timers.thought <= 0) {
        timers.thought = 8;
        const need = urgentNeed();
        if (need && !activity && !cat.say && !(cat.using && cat.using.id === 'house')) {
            cat.thought = { icon: need.icon, t: 3 };
            if (Math.random() < 0.5) meow(0.85);
        }
    }
}

function furnitureOptions() {
    const s = state.stats, opts = [];
    if (owns('scratcher')) opts.push({ id: 'scratcher', spot: { x: 338, y: 412 }, face: -1, t: [3, 5] });
    if (owns('tree')) opts.push({ id: 'tree', spot: { x: 110, y: 395 }, t: [5, 9] });
    if (owns('house')) opts.push({ id: 'house', spot: { x: 760, y: 412 }, t: [4, 8] });
    if (owns('tank')) opts.push({ id: 'tank', spot: { x: 600, y: 398 }, t: [4, 7] });
    if (owns('bed') && s.energy < 70) opts.push({ id: 'bed', spot: SPOT.bed, t: [5, 8] });
    for (const toy of ownedToys()) {
        const sp = TOY_SPOTS[toy.id];
        opts.push({ id: 'toy', spot: { x: sp.x + 34, y: sp.y }, face: -1, t: [2, 4] });
    }
    return opts;
}

function useFurniture(opt) {
    goTo(opt.spot, () => {
        if (opt.face) cat.facing = opt.face;
        cat.using = { id: opt.id, t: rnd(opt.t[0], opt.t[1]) };
    });
}

function updateCatAI(dt) {
    if (cat.target) return;
    if (cat.using) {
        cat.using.t -= dt;
        if (cat.using.t <= 0) finishUsing();
        return;
    }
    cat.timer -= dt;
    if (cat.timer > 0) return;
    cat.timer = rnd(2, 5);

    if (currentPanel && $('panel').classList.contains('side')) {
        if (dist(cat.x, cat.y, SPOT.pose.x, SPOT.pose.y) > 5) goTo(SPOT.pose, () => { cat.facing = 1; });
        cat.timer = 1;
        return;
    }
    if (poopTimers.length && poopTimers[0] <= 0) {
        poopTimers.shift();
        goTo(SPOT.potty, () => { cat.using = { id: 'potty', t: 2 }; });
        return;
    }
    if (state.stats.energy < 12) {
        actNap(true);
        return;
    }
    const opts = furnitureOptions();
    if (cat.wantItem) {
        const want = opts.find(o => o.id === cat.wantItem);
        cat.wantItem = null;
        if (want) { useFurniture(want); return; }
    }
    const r = Math.random();
    if (opts.length && r < 0.45) {
        useFurniture(pick(opts));
    } else if (r < 0.82) {
        goTo({ x: rnd(WALK.minX + 40, WALK.maxX - 60), y: rnd(WALK.minY + 10, WALK.maxY - 10) });
    } else if (r < 0.92) {
        cat.using = { id: 'groom', t: 2.5 };
    } else {
        meow(rnd(0.9, 1.2));
        if (moodOf(happiness()) === 'happy') hearts(1);
    }
}

function finishUsing() {
    const u = cat.using;
    stopUsing();
    if (u.id === 'scratcher') { addStat('fun', 4); hearts(1); }
    else if (u.id === 'tree') { addStat('fun', 3); hearts(1); }
    else if (u.id === 'house') addStat('energy', 4);
    else if (u.id === 'tank') addStat('fun', 4);
    else if (u.id === 'bed') addStat('energy', 6);
    else if (u.id === 'toy') addStat('fun', 3);
}

function addPoop() {
    if (state.poops >= MAX_POOPS) return;
    state.poops++;
    SFX.pop();
}

function petCat(amount) {
    cat.petMeter += amount;
    if (cat.petMeter < 110) return;
    cat.petMeter = 0;
    cat.happyT = 1.2;
    hearts(1);
    purr();
    addStat('fun', 2);
    addAffection(0.25);
}

// =====================================================
//  Actions
// =====================================================
function doAction(id) {
    if (screen !== 'home') return;
    ensureAudio();
    if (id === 'shop' || id === 'dress') {
        if (activity && (activity.type === 'play' || activity.type === 'wash')) { nope(id); return; }
        togglePanel(id === 'shop' ? 'shop' : 'closet');
        return;
    }
    if (id === 'tricks') {
        if (activity && activity.type !== 'sleep') { nope(id); return; }
        togglePanel('tricks');
        return;
    }
    if (currentPanel) closePanel();
    if (activity) {
        if (activity.type !== 'sleep') { nope(id); return; }
        if (id === 'nap') { wakeUp(); return; }
        wakeUp(true);
    }
    ({ feed: actFeed, treat: actTreat, play: actPlay, wash: actWash, litter: actLitter, nap: actNap })[id]();
}

function nope(id) {
    const b = document.querySelector(`.act[data-id="${id}"]`);
    if (!b) return;
    b.classList.remove('nope');
    void b.offsetWidth;
    b.classList.add('nope');
}

function actFeed() {
    if (state.stats.food >= 90) { catSay("I'm full! 😊"); SFX.nope(); cat.shakeT = 0.5; return; }
    SFX.pour();
    bowlFull = true;
    startActivity({ type: 'eat', t: 3, nomT: 0 }, SPOT.eat);
}

function actTreat() {
    if (state.treats <= 0) {
        const secs = Math.ceil(TREAT_REFILL - state.treatTimer);
        catSay(`More treats in ${secs}s 🍪`);
        SFX.nope();
        return;
    }
    state.treats--;
    startActivity({ type: 'treat', el: 0, caught: false });
    cat.facing = 1;
    SFX.boing();
}

function actPlay() {
    if (state.stats.energy < 15) { catSay('Too sleepy... 💤'); SFX.nope(); return; }
    const toys = ownedToys();
    if (toys.length > 1) openPanel('toys');
    else startPlay(toys[0].id);
}

function startPlay(toyId) {
    if (currentPanel) closePanel();
    startActivity({
        type: 'play', toy: toyId, t: 15, cd: 0.6, pounces: 0, pounceT: 0, jumpH: 30,
        tx: clamp(cat.x + 140 * (cat.x < 480 ? 1 : -1), 80, 880), ty: cat.y,
    });
    showHint('Move the toy with the mouse or arrow keys! 🐾');
}

function actWash() {
    startActivity({ type: 'wash', progress: 0, phase: 'scrub', t: 0, scrubSfx: 0 }, SPOT.wash);
    showHint('Scrub-a-dub! Rub the kitty with the mouse or tap SPACE 🫧');
}

function actLitter() {
    if (state.poops <= 0) { catSay('Litter is clean! ✨'); return; }
    startActivity({ type: 'scoop', t: 0.2 });
}

function actNap(auto) {
    if (state.stats.energy >= 90 && !auto) { catSay('Not sleepy! 😸'); return; }
    const spot = owns('bed') ? SPOT.bed : owns('rug') ? SPOT.rug : { x: 480, y: 470 };
    startActivity({ type: 'sleep', zT: 0 }, spot);
    if (auto) catSay('Yaaawn... 💤');
}

function wakeUp(quiet) {
    endActivity();
    if (!quiet) { catSay('Yawn! 😺'); meow(0.9); }
    addStat('fun', 3);
}

function doTrick(id) {
    const tr = TRICKS.find(t => t.id === id);
    if (heartLevel() < tr.hearts && state.tricks[id] < TRICK_STARS) {
        SFX.nope();
        setPanelMsg(`${state.catName} needs to love you more first! ${'❤️'.repeat(tr.hearts)}`);
        return;
    }
    if (activity) {
        if (activity.type !== 'sleep') return;
        wakeUp(true);
    }
    if (state.stats.energy < 8) { catSay('Too sleepy... 💤'); SFX.nope(); return; }
    const stars = state.tricks[id];
    const learned = stars >= TRICK_STARS;
    const chance = tr.base + stars * 0.08 + heartLevel() * 0.02;
    startActivity({ type: 'trick', id, t: 0, dur: 1.4, learned, success: learned || Math.random() < chance });
    cat.facing = 1;
    addStat('energy', -3);
    if (activity.success && (id === 'jump' || id === 'sit')) SFX.boing();
}

function updateActivity(dt) {
    const a = activity;
    if (!a) return;
    if (a.walking) {
        if (!cat.target) a.walking = false;
        return;
    }
    const s = state.stats;
    switch (a.type) {
        case 'eat': {
            cat.facing = -1;
            a.t -= dt;
            addStat('food', 40 * dt / 3);
            a.nomT -= dt;
            if (a.nomT <= 0) {
                a.nomT = 0.45;
                SFX.nom();
                addPart({ text: '✦', type: 'label', x: cat.x - 30 + rnd(-8, 8), y: cat.y - 40, vx: rnd(-20, 20), vy: -40, life: 0.5, size: 12, color: '#A8683A' });
            }
            if (a.t <= 0) {
                bowlFull = false;
                endActivity();
                catSay('Yum! 🐟');
                meow(1.1);
                reward(2, 1);
                poopTimers.push(rnd(40, 80));
            }
            break;
        }
        case 'treat': {
            a.el += dt;
            if (!a.caught && a.el >= 0.6) { a.caught = true; SFX.nom(); }
            if (a.el >= 1.3) {
                endActivity();
                addStat('fun', 12);
                addStat('food', 4);
                catSay('Yummy! 💕');
                hearts(3);
                reward(1, 2);
            }
            break;
        }
        case 'play': updatePlay(a, dt); break;
        case 'wash': updateWash(a, dt); break;
        case 'scoop': {
            a.t -= dt;
            if (a.t <= 0) {
                scoopOne();
                a.t = 0.35;
                if (state.poops <= 0) {
                    endActivity();
                    sparkles(LITTER.x, LITTER.y - 10, 6);
                    SFX.sparkle();
                    catSay('Thank you! 💕');
                    addAffection(1);
                }
            }
            break;
        }
        case 'sleep': {
            addStat('energy', 3 * dt);
            a.zT -= dt;
            if (a.zT <= 0) {
                a.zT = 1;
                const h = catHead();
                addPart({ type: 'label', text: 'Z', x: h.x + 20, y: h.y - 10, vx: 12, vy: -25, life: 2, size: rnd(18, 26), color: '#B3C7FF' });
            }
            if (s.energy >= 100) wakeUp();
            break;
        }
        case 'trick': {
            a.t += dt;
            if (a.t >= a.dur) finishTrick(a);
            break;
        }
    }
}

function scoopOne() {
    if (state.poops <= 0) return;
    state.poops--;
    const p = poopPos(state.poops);
    sparkles(p.x, p.y - 10, 3);
    SFX.pop();
    state.coins += 1;
    floatText(p.x, p.y - 20, '+1 🪙', '#C98A00');
}

function updatePlay(a, dt) {
    const s = state.stats;
    a.t -= dt;
    const kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
    const ky = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
    if (kx || ky) { a.tx += kx * 400 * dt; a.ty += ky * 400 * dt; }
    a.tx = clamp(a.tx, 60, 900);
    a.ty = clamp(a.ty, a.toy === 'feather' ? 230 : 385, 525);

    const gx = a.tx, gy = clamp(a.ty, WALK.minY, WALK.maxY);
    if (a.pounceT > 0) {
        a.pounceT -= dt;
        cat.moving = false;
    } else {
        a.cd -= dt;
        const dx = gx - cat.x, dy = gy - cat.y, d = Math.hypot(dx, dy);
        if (d > 28) {
            const sp = 170 * dt;
            cat.x += dx / d * Math.min(sp, d);
            cat.y += dy / d * Math.min(sp, d);
            if (Math.abs(dx) > 2) cat.facing = dx > 0 ? 1 : -1;
            cat.moving = true;
        } else {
            cat.moving = false;
        }
        if (d < 48 && a.cd <= 0) {
            a.pounceT = 0.45;
            a.cd = 1.1;
            a.pounces++;
            a.jumpH = clamp(cat.y - 95 - a.ty, 30, 140);
            addStat('fun', 6);
            addStat('energy', -1.5);
            addStat('clean', -0.6);
            addAffection(0.4);
            hearts(1);
            SFX.boing();
            if (Math.random() < 0.35) meow(1.3);
        }
    }
    if (a.t <= 0 || s.energy < 5) endPlay();
}

function endPlay() {
    const a = activity;
    endActivity();
    hideHint();
    if (a.pounces > 0) {
        catSay('That was fun! 🎉');
        reward(Math.min(8, 1 + Math.floor(a.pounces / 2)), 1);
    } else {
        catSay('Maybe later! 🐾');
    }
}

function scrub(amount) {
    const a = activity;
    if (!a || a.type !== 'wash' || a.walking || a.phase !== 'scrub') return;
    a.progress = Math.min(100, a.progress + amount);
    if (Math.random() < 0.5) {
        const v = catView();
        addPart({ type: 'bubble', x: v.x + rnd(-35, 35), y: v.y - rnd(20, 90), vx: rnd(-15, 15), vy: rnd(-40, -15), life: rnd(0.8, 1.5), size: rnd(4, 9) });
    }
    if (time - a.scrubSfx > 0.15) { a.scrubSfx = time; SFX.scrub(); }
}

function updateWash(a, dt) {
    a.t += dt;
    if (a.phase === 'scrub') {
        if (a.progress >= 100) { a.phase = 'rinse'; a.t = 0; SFX.splash(); }
    } else if (a.phase === 'rinse') {
        for (let i = 0; i < 3; i++) addPart({ type: 'drop', x: cat.x + rnd(-40, 40), y: cat.y - 140, vy: rnd(150, 250), g: 200, life: 0.6 });
        if (a.t > 1.4) { a.phase = 'shake'; a.t = 0; SFX.splash(); }
    } else if (a.phase === 'shake') {
        if (Math.random() < 0.6) addPart({ type: 'drop', x: cat.x, y: cat.y - 50, vx: rnd(-200, 200), vy: rnd(-150, -50), g: 400, life: 0.7 });
        if (a.t > 0.8) finishWash(true);
    }
}

function finishWash(done) {
    const a = activity;
    endActivity();
    hideHint();
    if (done) {
        state.stats.clean = 100;
        sparkles(cat.x, cat.y - 60, 10);
        SFX.sparkle();
        catSay('So fresh! ✨');
        reward(3, 2);
    } else {
        addStat('clean', a.progress * 0.6);
    }
    cat.y = SPOT.wash.y + 10;
}

function finishTrick(a) {
    const tr = TRICKS.find(t => t.id === a.id);
    endActivity();
    if (a.learned) {
        addStat('fun', 6);
        catSay('Ta-da! ⭐');
        hearts(2);
        const now = Date.now();
        if (!tr.lastPaid || now - tr.lastPaid > 20000) { tr.lastPaid = now; reward(1, 1); }
        else addAffection(0.5);
    } else if (a.success) {
        state.tricks[a.id]++;
        const h = catHead();
        sparkles(h.x, h.y, 6);
        if (state.tricks[a.id] >= TRICK_STARS) {
            showBanner(`${state.catName} learned ${tr.name}! 🎉`, 'Press it again to show off!');
            SFX.tada();
            confetti(50);
            reward(10, 3);
        } else {
            SFX.sparkle();
            catSay('Good kitty! ⭐');
            reward(2, 1);
        }
    } else {
        catSay(pick(['Huh? ❓', 'Meow? 🤔', 'Oops! 😹']));
        SFX.nope();
        setPanelMsg('Almost! Try again! 💪');
    }
    if (currentPanel === 'tricks') renderPanel();
}

// =====================================================
//  Panels (shop, dress up, tricks, toys, settings)
// =====================================================
const SIDE_PANELS = ['tricks', 'closet', 'toys'];

function togglePanel(id) {
    if (currentPanel === id) closePanel();
    else openPanel(id);
}

function openPanel(id) {
    SFX.click();
    currentPanel = id;
    const p = $('panel');
    p.classList.remove('hidden');
    p.classList.toggle('side', SIDE_PANELS.includes(id));
    setPanelMsg('');
    renderPanel();
    const first = $('panelBody').querySelector('button');
    if (first) first.focus();
    if (SIDE_PANELS.includes(id) && !activity) { stopUsing(); cat.timer = 0; }
}

function closePanel() {
    currentPanel = null;
    $('panel').classList.add('hidden');
    if (document.activeElement) document.activeElement.blur();
}

function setPanelMsg(text) {
    $('panelMsg').textContent = text;
}

function card(act, id, icon, name, sub, cls, n) {
    const num = n !== undefined && n < 9 ? `<span class="num">${n + 1}</span>` : '';
    return `<button class="card ${cls || ''}" data-act="${act}" data-id="${id}">${num}<div class="card-icon">${icon}</div><div class="card-name">${name}</div><div class="card-sub">${sub}</div></button>`;
}

function renderPanel() {
    const focusIdx = [...$('panelBody').querySelectorAll('button')].indexOf(document.activeElement);
    const title = $('panelTitle'), tabs = $('panelTabs'), body = $('panelBody');
    tabs.innerHTML = '';
    let html = '';
    if (currentPanel === 'shop') {
        title.textContent = `🛍️ Shop — 🪙 ${state.coins}`;
        tabs.innerHTML = SHOP_TABS.map(t => `<button class="tab ${t.id === shopTab ? 'active' : ''}" data-act="tab" data-id="${t.id}">${t.label}</button>`).join('');
        const items = ITEMS.filter(i => i.tab === shopTab);
        html = '<div class="grid">' + items.map((it, n) => {
            const own = owns(it.id);
            const worn = it.slot && state.wear[it.slot] === it.id;
            const sub = own ? (it.slot ? (worn ? '✓ Wearing' : 'Wear it') : '✓ Got it!') : `🪙 ${it.price}`;
            const cls = own ? 'owned' : state.coins < it.price ? 'poor' : '';
            return card('buy', it.id, it.icon, it.name, sub, cls, n);
        }).join('') + '</div>';
    } else if (currentPanel === 'closet') {
        title.textContent = '🎀 Dress Up';
        const wearables = ITEMS.filter(i => i.slot && owns(i.id));
        if (!wearables.length) {
            html = `<div class="empty-msg">No outfits yet!<br><br><button class="big-btn small" data-act="gotoShop" data-id="dress">Visit the Shop 🛍️</button></div>`;
        } else {
            let n = 0;
            for (const [slot, label] of [['head', 'Head'], ['neck', 'Neck']]) {
                const list = wearables.filter(i => i.slot === slot);
                if (!list.length) continue;
                html += `<h3>${label}</h3><div class="grid">`;
                html += card('wear', `none:${slot}`, '🚫', 'Nothing', '', state.wear[slot] ? '' : 'selected', n++);
                for (const it of list) html += card('wear', it.id, it.icon, it.name, state.wear[slot] === it.id ? '✓ Wearing' : '', state.wear[slot] === it.id ? 'selected' : '', n++);
                html += '</div>';
            }
        }
    } else if (currentPanel === 'tricks') {
        title.textContent = '⭐ Tricks';
        const lvl = heartLevel();
        html = '<div class="grid">' + TRICKS.map((tr, n) => {
            const stars = state.tricks[tr.id];
            const learned = stars >= TRICK_STARS;
            const locked = lvl < tr.hearts && !learned;
            const starLine = `<span class="stars">${'★'.repeat(stars)}${'☆'.repeat(TRICK_STARS - stars)}</span>`;
            const sub = locked ? `🔒 ${'❤️'.repeat(tr.hearts)}` : learned ? `${starLine}<br>Show off!` : `${starLine}<br>Teach`;
            return card('trick', tr.id, tr.icon, tr.name, sub, locked ? 'locked' : learned ? 'owned' : '', n);
        }).join('') + '</div>';
        if (!$('panelMsg').textContent) setPanelMsg('Teach a trick 5 times to learn it!');
    } else if (currentPanel === 'toys') {
        title.textContent = '🧶 Pick a toy!';
        html = '<div class="grid">' + ownedToys().map((t, n) => card('toy', t.id, t.icon, t.name, '', '', n)).join('') + '</div>';
    } else if (currentPanel === 'settings') {
        title.textContent = '⚙️ Settings';
        html = `<div class="form">
            <label>Kitty's name <input id="setCatName" maxlength="12" value="${escapeHtml(state.catName)}"></label>
            <label>Your name <input id="setOwner" maxlength="12" value="${escapeHtml(state.owner)}"></label>
            <button class="big-btn" data-act="saveSettings">Save ✓</button>
            <button class="big-btn secondary small" data-act="newKitty">Adopt a different kitty…</button>
        </div>`;
    }
    body.innerHTML = html;
    const btns = body.querySelectorAll('button');
    if (focusIdx >= 0 && btns[focusIdx]) btns[focusIdx].focus();
}

function onPanelClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    ensureAudio();
    const act = b.dataset.act, id = b.dataset.id;
    if (act === 'tab') { shopTab = id; SFX.click(); setPanelMsg(''); renderPanel(); $('panelTabs').querySelector('.active').focus(); }
    else if (act === 'buy') buyItem(id, b);
    else if (act === 'wear') wearItem(id);
    else if (act === 'trick') doTrick(id);
    else if (act === 'toy') startPlay(id);
    else if (act === 'gotoShop') { shopTab = id; openPanel('shop'); }
    else if (act === 'saveSettings') saveSettings();
    else if (act === 'newKitty') {
        if (confirm(`Adopt a different kitty? ${state.catName} will be replaced and progress starts over.`)) {
            closePanel();
            beginAdopt();
        }
    }
}

function buyItem(id, btn) {
    const it = itemById(id);
    if (owns(id)) {
        if (it.slot) wearItem(state.wear[it.slot] === id ? `none:${it.slot}` : id);
        else setPanelMsg(`${it.icon} ${it.name} is already in your room!`);
        return;
    }
    if (state.coins < it.price) {
        SFX.nope();
        btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake');
        setPanelMsg(`You need ${it.price - state.coins} more 🪙 — take care of ${state.catName} to earn more!`);
        return;
    }
    state.coins -= it.price;
    state.owned.push(id);
    if (it.slot) state.wear[it.slot] = id;
    SFX.coin(); SFX.sparkle();
    confetti(25);
    setPanelMsg(`${it.icon} ${it.name} is yours! 🎉`);
    if (it.furniture) cat.wantItem = id;
    hearts(2);
    save();
    renderPanel();
}

function wearItem(id) {
    if (id.startsWith('none:')) {
        state.wear[id.slice(5)] = null;
        SFX.click();
    } else {
        const it = itemById(id);
        state.wear[it.slot] = state.wear[it.slot] === id ? null : id;
        if (state.wear[it.slot]) {
            SFX.sparkle();
            catSay(pick(['So pretty! 💕', 'Do I look cute? 😻', 'I love it! 💖']));
            hearts(2);
        }
    }
    save();
    renderPanel();
}

function saveSettings() {
    const n = $('setCatName').value.trim(), o = $('setOwner').value.trim();
    if (n) state.catName = n;
    if (o) state.owner = o;
    save();
    updateHUD();
    SFX.sparkle();
    closePanel();
    catSay(`I'm ${state.catName}! 😺`);
}

// Arrow keys move focus between panel buttons
function moveFocus(dir) {
    const btns = [...$('panel').querySelectorAll('.tabs button, .panel-body button')];
    if (!btns.length) return;
    let i = btns.indexOf(document.activeElement);
    i = i < 0 ? 0 : (i + dir + btns.length) % btns.length;
    btns[i].focus();
}

// =====================================================
//  HUD
// =====================================================
function buildActionBar() {
    $('actions').innerHTML = ACTIONS.map((a, i) =>
        `<button class="act" data-id="${a.id}" title="${a.label} (${i + 1})"><span class="key">${i + 1}</span><span class="emoji">${a.icon}</span><span class="label">${a.label}</span>${a.id === 'treat' ? '<span class="badge" id="treatBadge"></span>' : ''}</button>`
    ).join('');
    $('actions').addEventListener('click', e => {
        const b = e.target.closest('.act');
        if (b) { b.blur(); doAction(b.dataset.id); }
    });
}

function setBar(id, v) {
    const el = $(id);
    el.style.width = `${Math.max(3, v)}%`;
    el.classList.toggle('mid', v < 60 && v >= 30);
    el.classList.toggle('low', v < 30);
}

function updateHUD() {
    const s = state.stats, lvl = heartLevel();
    $('hudName').textContent = state.catName;
    $('hudHearts').textContent = '❤️'.repeat(lvl) + '🤍'.repeat(5 - lvl);
    $('hudHearts').title = `${BONDS[lvl].name} with ${state.owner}`;
    setBar('barFood', s.food);
    setBar('barClean', s.clean);
    setBar('barEnergy', s.energy);
    setBar('barFun', s.fun);
    const h = happiness();
    $('hudMood').textContent = h >= 80 ? '😻' : h >= 60 ? '😺' : h >= 35 ? '🐱' : '😿';
    $('hudMood').title = `Happiness: ${Math.round(h)}%`;
    $('hudCoins').textContent = state.coins;
    $('treatBadge').textContent = state.treats;
    const need = activity ? null : urgentNeed();
    document.querySelectorAll('.act').forEach(b => b.classList.toggle('nudge', !!need && b.dataset.id === need.action));
    if (currentPanel === 'shop') $('panelTitle').textContent = `🛍️ Shop — 🪙 ${state.coins}`;
}

// =====================================================
//  Main update
// =====================================================
function update(dt) {
    time += dt;
    if (screen !== 'home') return;
    const sleeping = activity && activity.type === 'sleep' && !activity.walking;
    addStat('food', -DECAY.food * dt * (sleeping ? 0.5 : 1));
    addStat('clean', -DECAY.clean * dt);
    if (!sleeping) addStat('energy', -DECAY.energy * dt);
    addStat('fun', -DECAY.fun * dt * (sleeping ? 0.3 : 1));

    for (let i = 0; i < poopTimers.length; i++) poopTimers[i] -= dt;
    // If the kitty is too busy to walk to the box, the poop just appears
    if (poopTimers.length && poopTimers[0] < -30) { poopTimers.shift(); addPoop(); }

    if (state.treats < TREAT_MAX) {
        state.treatTimer += dt;
        if (state.treatTimer >= TREAT_REFILL) { state.treatTimer = 0; state.treats++; }
    }

    // A very unhappy kitty slowly loses affection (-1 per minute)
    if (happiness() < 35) addAffection(-dt / 60);

    // A happy kitty earns a coin every 30 seconds
    if (happiness() >= 70) {
        timers.happy += dt;
        if (timers.happy >= 30) {
            timers.happy = 0;
            state.coins++;
            const h = catHead();
            floatText(h.x, h.y - 20, '+1 🪙 happy kitty!', '#C98A00');
        }
    }

    if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
    updateActivity(dt);
    updateCat(dt);
    updateParts(dt);

    timers.hud -= dt;
    if (timers.hud <= 0) { timers.hud = 0.2; updateHUD(); }
    timers.save -= dt;
    if (timers.save <= 0) { timers.save = 5; save(); }
}

// =====================================================
//  Screens: title, adopt, home
// =====================================================
let adoptIdx = 0;

function showScreen(id) {
    screen = id;
    $('titleScreen').classList.toggle('hidden', id !== 'title');
    $('adoptScreen').classList.toggle('hidden', id !== 'adopt');
    $('hud').classList.toggle('hidden', id !== 'home');
    $('actions').classList.toggle('hidden', id !== 'home');
    if (id !== 'home') { closePanel(); hideHint(); }
}

function showTitle() {
    const saved = state;
    $('btnContinue').classList.toggle('hidden', !saved);
    if (saved) $('continueName').textContent = saved.catName;
    showScreen('title');
    (saved ? $('btnContinue') : $('btnNew')).focus();
}

function beginAdopt() {
    showScreen('adopt');
    $('adoptStep1').classList.remove('hidden');
    $('adoptStep2').classList.add('hidden');
    refreshKittens();
    $('btnPick').focus();
}

function buildKittens() {
    $('kittenRow').innerHTML = FUR_KEYS.map((k, i) =>
        `<button class="kitten" data-i="${i}"><canvas width="150" height="150"></canvas><span>${FURS[k].label}</span></button>`
    ).join('');
    $('kittenRow').addEventListener('click', e => {
        const b = e.target.closest('.kitten');
        if (!b) return;
        ensureAudio();
        const i = +b.dataset.i;
        if (i === adoptIdx) adoptNext();
        else { adoptIdx = i; refreshKittens(); meow(1.3); }
    });
}

function refreshKittens() {
    document.querySelectorAll('.kitten').forEach((b, i) => b.classList.toggle('selected', i === adoptIdx));
}

function renderKittens() {
    if (screen !== 'adopt' || $('adoptStep1').classList.contains('hidden')) return;
    document.querySelectorAll('.kitten canvas').forEach((cv, i) => {
        const c = cv.getContext('2d');
        c.clearRect(0, 0, 150, 150);
        const sel = i === adoptIdx;
        drawCat(c, 75, 138, 1.15, {
            fur: FUR_KEYS[i], facing: 1, t: time + i, pose: 'sit', mood: sel ? 'happy' : 'ok',
            eyes: sel ? 'happy' : 'open', blink: Math.sin(time * 1.3 + i * 2) > 0.97,
            lift: sel ? Math.abs(Math.sin(time * 4)) * 8 : 0,
        });
    });
}

function adoptNext() {
    SFX.click();
    $('adoptStep1').classList.add('hidden');
    $('adoptStep2').classList.remove('hidden');
    const ideas = [...NAME_IDEAS].sort(() => Math.random() - 0.5).slice(0, 8);
    $('nameIdeas').innerHTML = ideas.map(n => `<button class="chip">${n}</button>`).join('');
    $('catNameInput').value = '';
    $('catNameInput').focus();
}

function adoptGo() {
    ensureAudio();
    const name = $('catNameInput').value.trim() || pick(NAME_IDEAS);
    const owner = $('ownerInput').value.trim() || 'Alex';
    state = newState(owner, name, FUR_KEYS[adoptIdx]);
    poopTimers = [];
    save();
    startHome(0, true);
}

function startHome(minsAway, isNew, lostHeart) {
    showScreen('home');
    activity = null;
    bowlFull = false;
    parts.length = 0;
    Object.assign(cat, { x: 480, y: 460, facing: 1, target: null, onArrive: null, using: null, say: null, thought: null, timer: 2 });
    updateHUD();
    if (isNew) {
        showBanner(`Welcome home, ${state.catName}!`, `Take good care of your kitty, ${state.owner} 💕`, 3.5);
        meow(1.2);
        setTimeout(() => showHint('Tip: rub your kitty with the mouse to pet! 💕 (or hold P)', 6), 4500);
    } else if (lostHeart) {
        catSay(`${state.owner}... I was lonely 💔 Pet me?`, 3.5);
        meow(0.8);
    } else if (minsAway >= 10) {
        catSay(`${state.owner}! I missed you! 💕`, 3);
        meow(1.1);
        hearts(3);
    }
    if (state.lastDay !== todayStr()) {
        state.lastDay = todayStr();
        state.coins += 15;
        setTimeout(() => { showBanner('Daily gift! 🎁', '+15 🪙 for visiting today'); SFX.tada(); confetti(30); }, isNew ? 0 : 1500);
    }
    save();
}

function continueGame() {
    ensureAudio();
    const before = heartLevel();
    const mins = applyTimeAway(state);
    startHome(mins, false, heartLevel() < before);
}

// =====================================================
//  Input
// =====================================================
function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}

function overCat(x, y) {
    const v = catView();
    if (v.o.hidden) return false;
    const top = v.y - (110 + (v.o.lift || 0)) * v.s;
    return Math.abs(x - v.x) < 42 * v.s && y > top && y < v.y + 5;
}

canvas.addEventListener('pointermove', e => {
    if (screen !== 'home') return;
    const p = canvasPos(e);
    const moved = mouse.over ? dist(mouse.x, mouse.y, p.x, p.y) : 0;
    mouse.x = p.x; mouse.y = p.y; mouse.over = true;
    const a = activity;
    if (a && a.type === 'play') { a.tx = p.x; a.ty = p.y; canvas.style.cursor = 'none'; return; }
    const onCat = overCat(p.x, p.y);
    if (a && a.type === 'wash') { if (onCat) scrub(moved * 0.12); canvas.style.cursor = 'grab'; return; }
    canvas.style.cursor = onCat ? 'grab' : 'default';
    if (onCat && (!a || a.type === 'sleep')) petCat(moved);
});

canvas.addEventListener('pointerleave', () => { mouse.over = false; });

canvas.addEventListener('pointerdown', e => {
    if (screen !== 'home') return;
    ensureAudio();
    const p = canvasPos(e);
    const a = activity;
    if (a && (a.type === 'play' || a.type === 'wash')) { if (a.type === 'wash' && overCat(p.x, p.y)) scrub(5); return; }
    for (let i = state.poops - 1; i >= 0; i--) {
        const pp = poopPos(i);
        if (dist(p.x, p.y, pp.x, pp.y - 4) < 16 && (!a || a.type === 'sleep')) {
            scoopOne();
            if (state.poops === 0) { sparkles(LITTER.x, LITTER.y, 5); addAffection(1); }
            return;
        }
    }
    if (owns('house') && cat.using && cat.using.id === 'house' && dist(p.x, p.y, 760, 385) < 30) {
        stopUsing(); meow(1.2); hearts(2); return;
    }
    if (overCat(p.x, p.y)) {
        if (a && a.type === 'sleep') { if (!a.walking) wakeUp(); return; }
        if (a) return;
        if (cat.using && cat.using.id !== 'tree') stopUsing();
        meow(rnd(1, 1.3));
        cat.happyT = 1;
        hearts(2);
        catSay(pick(['Meow! 💕', `Hi ${state.owner}! 😺`, 'Purrrr... 💖', 'Mrrp? 🐾']));
        addAffection(0.2);
    }
});

window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    const inInput = e.target.tagName === 'INPUT';
    if (inInput) {
        if (k === 'enter' && e.target.id === 'catNameInput') adoptGo();
        if (k === 'enter' && e.target.id === 'ownerInput') adoptGo();
        if (k === 'escape') e.target.blur();
        return;
    }
    keys[k] = true;
    ensureAudio();
    if (screen === 'title') {
        if (k === 'enter' || k === ' ') { e.preventDefault(); (state ? continueGame : beginAdopt)(); }
        return;
    }
    if (screen === 'adopt') {
        if ($('adoptStep2').classList.contains('hidden')) {
            if (k === 'arrowleft' || k === 'a') { adoptIdx = (adoptIdx + FUR_KEYS.length - 1) % FUR_KEYS.length; refreshKittens(); meow(1.3); }
            if (k === 'arrowright' || k === 'd') { adoptIdx = (adoptIdx + 1) % FUR_KEYS.length; refreshKittens(); meow(1.3); }
            if (k === 'enter' || k === ' ') { e.preventDefault(); adoptNext(); }
        }
        if (k === 'escape') showTitle();
        return;
    }
    // Home screen
    if (k === 'm') { toggleMute(); return; }
    if (currentPanel) {
        if (k === 'escape') { closePanel(); return; }
        if (['arrowleft', 'arrowup'].includes(k)) { e.preventDefault(); moveFocus(-1); return; }
        if (['arrowright', 'arrowdown'].includes(k)) { e.preventDefault(); moveFocus(1); return; }
        if (/^[1-9]$/.test(k)) {
            const cards = $('panelBody').querySelectorAll('.card');
            const b = cards[+k - 1];
            if (b) { b.focus(); b.click(); }
            return;
        }
        return;
    }
    const a = activity;
    if (a && a.type === 'play') {
        if (k === 'escape') endPlay();
        if (k.startsWith('arrow') || k === ' ') e.preventDefault();
        return;
    }
    if (a && a.type === 'wash') {
        if (k === ' ' || k.startsWith('arrow')) { e.preventDefault(); if (!e.repeat) scrub(7); }
        if (k === 'escape' && !a.walking && a.phase === 'scrub') finishWash(false);
        return;
    }
    if (/^[1-9]$/.test(k)) { doAction(ACTIONS[+k - 1].id); return; }
    if (k === ' ') e.preventDefault();
});

window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

function toggleMute() {
    muted = !muted;
    $('btnSound').textContent = muted ? '🔇' : '🔊';
}

// ---------- Wire up buttons ----------
$('btnContinue').onclick = continueGame;
$('btnNew').onclick = () => {
    ensureAudio();
    if (state && !confirm(`Adopt a new kitty? ${state.catName} will be replaced and progress starts over.`)) return;
    beginAdopt();
};
$('btnPick').onclick = () => { ensureAudio(); adoptNext(); };
$('btnAdoptBack').onclick = beginAdopt;
$('btnAdoptGo').onclick = adoptGo;
$('btnRandomName').onclick = () => { $('catNameInput').value = pick(NAME_IDEAS); SFX.click(); };
$('nameIdeas').addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (b) { $('catNameInput').value = b.textContent; SFX.click(); }
});
$('btnPanelClose').onclick = closePanel;
$('panelBody').addEventListener('click', onPanelClick);
$('panelTabs').addEventListener('click', onPanelClick);
$('btnSound').onclick = e => { e.currentTarget.blur(); toggleMute(); };
$('btnSettings').onclick = e => { e.currentTarget.blur(); togglePanel('settings'); };
window.addEventListener('beforeunload', save);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

// ---------- Start ----------
buildActionBar();
buildKittens();
state = load();
showTitle();

let lastFrame = performance.now();
function frame(now) {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    update(dt);
    render();
    renderKittens();
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
