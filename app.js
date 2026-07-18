'use strict';
/* ============================================================================
 * EduVerse — "A Vila que Acorda"  (DEMO do formato NOVO: app tipo trilha)
 * Trilha (mapa de paradas) + parada onde a criança FAZ (junta maçãs), NÃO responde.
 * Conceito por ÚLTIMO (juntar = somar). Byte pergunta. Erro não pune. Mundo floresce.
 * Voz REAL do Antonio (mp3). ZERO emoji. Tudo em SVG leve (roda em PC antigo).
 * ========================================================================== */

// ---------------- VOZ (Antonio, mp3 gravado) ----------------
const Voz = (function () {
  const base = 'audio/'; let atual = null;
  function stop() { if (atual) { try { atual.pause(); } catch (e) {} atual = null; } }
  function um(id, cb) {
    if (!id) { if (cb) cb(); return; }
    let a; try { a = new Audio(base + id + '.mp3'); a.volume = 1; } catch (e) { if (cb) cb(); return; }
    atual = a; let done = false;
    const fim = () => { if (done) return; done = true; if (atual === a) atual = null; if (cb) cb(); };
    a.onended = fim; a.onerror = fim; a.play().catch(fim);
  }
  function cadeia(ids, cb) { const f = (ids || []).filter(Boolean); (function nx(k) { if (k >= f.length) { if (cb) cb(); return; } um(f[k], () => nx(k + 1)); })(0); }
  function slug(s) { return (s || '').trim().split(/\s+/)[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  return { stop, um, cadeia, slug };
})();
const NOMES = new Set(['agatha','alexandre','alice','amanda','ana','analu','analuz','anthony','antonella','antonio','arthur','aurora','ayla','beatriz','benicio','benjamin','bento','bernardo','bianca','bruna','bruno','bryan','caio','caleb','camila','carolina','catarina','caua','cecile','cecilia','clara','daniel','danilo','davi','diego','duda','eduardo','elisa','eloa','emanuel','emanuelly','emilly','enzo','erick','ester','esther','felipe','fernanda','fernando','gabriel','gabriela','gael','giovanna','guilherme','gustavo','heitor','helena','heloisa','henrique','ian','igor','isaac','isabela','isadora','joao','jose','julia','juliana','kaique','lara','larissa','laura','leo','leticia','levi','live','livia','liz','lorena','lorenzo','luan','lucas','luiza','maite','malu','manuela','marcos','maria','mariana','marina','matheus','melissa','miguel','milena','murilo','nathan','nicolas','nicole','noah','olivia','otavio','pedro','pietra','pietro','rael','rafael','rafaela','ravi','rebeca','rodrigo','ryan','samuel','sarah','sofia','sophia','stella','theo','thiago','valentina','vicente','vitor','vitoria','yasmin','yuri']);
function idNome(n) { const s = Voz.slug(n); return NOMES.has(s) ? 'nome_' + s : ''; }

// ---------------- SOM (ambiente + efeitos, WebAudio) ----------------
let AC = null, MST = null, _wg = null, _on = false;
function initSom() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    MST = AC.createGain(); MST.gain.value = 0.5; MST.connect(AC.destination);
    const buf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), d = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3; }
    const src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 480;
    _wg = AC.createGain(); _wg.gain.value = 0.03; src.connect(lp); lp.connect(_wg); _wg.connect(MST); src.start(); _on = true;
  } catch (e) {}
}
function tom(f, dur, tp, v, sl) { if (!AC || !_on) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = tp || 'sine'; o.frequency.setValueAtTime(f, t); if (sl) o.frequency.exponentialRampToValueAtTime(sl, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v || 0.08, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(MST); o.start(t); o.stop(t + dur + 0.02); }
function sPop() { tom(760, 0.12, 'triangle', 0.09, 1180); }
function sPlim() { tom(1046, 0.14, 'triangle', 0.08, 1568); }
function sOk() { [523, 659, 784].forEach((f, i) => setTimeout(() => tom(f, 0.22, 'triangle', 0.09), i * 90)); }
function sFest() { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tom(f, 0.3, 'triangle', 0.1), i * 130)); }

// ---------------- util ----------------
const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function tween(dur, step, done, ease) {
  ease = ease || (x => x); let t0 = null;
  requestAnimationFrame(function fr(t) { if (t0 === null) t0 = t; let p = Math.min(1, (t - t0) / dur); step(ease(p)); if (p < 1) requestAnimationFrame(fr); else if (done) done(); });
}
const easeOut = x => 1 - Math.pow(1 - x, 3);
const easeInBack = x => 2.7 * x * x * x - 1.7 * x * x;

// ---------------- ARTE (SVG) ----------------
// Byte — robôzinho fofo (vetor coeso, estilo storybook). blink por JS.
const BYTE_GUTS = `
  <defs>
    <linearGradient id="bcorp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#59e0ec"/><stop offset="1" stop-color="#2a9fb3"/></linearGradient>
    <radialGradient id="bolho" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#dffbff"/><stop offset="1" stop-color="#7fe6f5"/></radialGradient>
  </defs>
  <ellipse cx="50" cy="108" rx="26" ry="6" fill="#000" opacity=".16"/>
  <line x1="50" y1="18" x2="50" y2="6" stroke="#2a9fb3" stroke-width="3"/>
  <circle cx="50" cy="5" r="5" fill="#ffd45a"/>
  <rect x="24" y="20" width="52" height="50" rx="16" fill="url(#bcorp)" stroke="#1f7c8c" stroke-width="2"/>
  <rect x="30" y="28" width="40" height="30" rx="11" fill="#173a4a"/>
  <g class="olhos"><ellipse class="olho" cx="42" cy="43" rx="6" ry="7" fill="url(#bolho)"/><ellipse class="olho" cx="58" cy="43" rx="6" ry="7" fill="url(#bolho)"/></g>
  <path d="M42 54 Q50 60 58 54" stroke="#7fe6f5" stroke-width="3" fill="none" stroke-linecap="round"/>
  <rect x="16" y="34" width="9" height="22" rx="4" fill="#2a9fb3"/><rect x="75" y="34" width="9" height="22" rx="4" fill="#2a9fb3"/>
  <rect x="30" y="70" width="16" height="16" rx="6" fill="#2a9fb3"/><rect x="54" y="70" width="16" height="16" rx="6" fill="#2a9fb3"/>`;
function byteSVG(w) { return `<svg viewBox="0 0 100 115" width="${w}" height="${w * 1.15}" class="byteWrap" style="overflow:visible">${BYTE_GUTS}</svg>`; }
// Byte como <g> dentro de uma cena SVG, ancorado nos pés em (x,y).
// posição no <g> externo; animação (byteWrap) no interno SEM transform-attr (senão a CSS anula).
function byteG(x, y, s) { return `<g transform="translate(${x},${y}) scale(${s})"><g transform="translate(-50,-108)"><g class="byteWrap">${BYTE_GUTS}</g></g></g>`; }
function macieira(x, y, s) { // posição no <g> externo; animação (sway) no interno (senão a CSS anula o transform)
  return `<g transform="translate(${x},${y}) scale(${s})"><g class="sway">
    <ellipse cx="0" cy="2" rx="46" ry="10" fill="#000" opacity=".14"/>
    <rect x="-11" y="-70" width="22" height="72" rx="9" fill="#8a5a34"/>
    <rect x="-11" y="-70" width="9" height="72" rx="5" fill="#a06c40"/>
    <circle cx="-30" cy="-96" r="34" fill="#5fae43"/><circle cx="30" cy="-96" r="34" fill="#5fae43"/>
    <circle cx="0" cy="-120" r="40" fill="#6cbf4c"/><circle cx="0" cy="-96" r="42" fill="#66b846"/>
    <circle cx="-14" cy="-128" r="20" fill="#7fce5c" opacity=".8"/>
    <circle cx="-24" cy="-92" r="7" fill="#e64a3b"/><circle cx="22" cy="-104" r="7" fill="#e64a3b"/><circle cx="8" cy="-84" r="7" fill="#e64a3b"/>
    <circle cx="-6" cy="-120" r="7" fill="#e64a3b"/><circle cx="30" cy="-86" r="7" fill="#e64a3b"/>
  </g></g>`;
}
function cestaSVG(cx, cy, s) {
  return `<g transform="translate(${cx},${cy}) scale(${s})">
    <ellipse cx="0" cy="30" rx="52" ry="10" fill="#000" opacity=".14"/>
    <path d="M-46 -6 L46 -6 L38 30 L-38 30 Z" fill="#c98a4a"/>
    <path d="M-46 -6 L46 -6 L44 4 L-44 4 Z" fill="#e0a866"/>
    <path d="M-40 4 L40 4 M-42 14 L42 14 M-38 -2 L38 -2" stroke="#a56a30" stroke-width="3"/>
    <path d="M-30 4 L-26 30 M0 4 L0 30 M30 4 L26 30" stroke="#a56a30" stroke-width="3" opacity=".7"/>
    <path d="M-52 -6 Q0 -20 52 -6" stroke="#b6763a" stroke-width="7" fill="none" stroke-linecap="round"/>
  </g>`;
}
function macaEl(parent, x, y, r) {
  const g = el('g', { transform: `translate(${x},${y})` }, parent);
  el('circle', { r: r, fill: '#e64a3b' }, g);
  el('circle', { cx: -r * .3, cy: -r * .3, r: r * .3, fill: '#ff8a72', opacity: .8 }, g);
  el('rect', { x: -1.5, y: -r - 4, width: 3, height: 5, rx: 1.5, fill: '#7a4a22' }, g);
  el('ellipse', { cx: 5, cy: -r - 3, rx: 5, ry: 3, fill: '#5fae43' }, g);
  return g;
}
function coelho(x, y, s) {
  return `<g id="coelho" transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="0" cy="6" rx="26" ry="6" fill="#000" opacity=".14"/>
    <ellipse cx="-9" cy="-40" rx="8" ry="22" fill="#f2eee9"/><ellipse cx="9" cy="-40" rx="8" ry="22" fill="#f2eee9"/>
    <ellipse cx="-9" cy="-40" rx="4" ry="15" fill="#ffbcc9"/><ellipse cx="9" cy="-40" rx="4" ry="15" fill="#ffbcc9"/>
    <ellipse cx="0" cy="-4" rx="24" ry="22" fill="#fbf7f2"/>
    <circle cx="-8" cy="-8" r="3.4" fill="#3a2b28"/><circle cx="8" cy="-8" r="3.4" fill="#3a2b28"/>
    <path d="M-4 0 Q0 4 4 0" stroke="#c98" stroke-width="2" fill="none"/>
    <circle cx="0" cy="-2" r="3" fill="#ff9fb0"/>
  </g>`;
}
function casinha(cx, cy, s, cor) {
  return `<g transform="translate(${cx},${cy}) scale(${s})">
    <rect x="-26" y="-6" width="52" height="34" rx="4" fill="${cor.parede}"/>
    <path d="M-32 -6 L0 -34 L32 -6 Z" fill="${cor.telha}"/>
    <rect x="-8" y="8" width="16" height="20" rx="2" fill="${cor.porta}"/>
    <circle cx="4" cy="18" r="1.6" fill="#3a2b28"/>
  </g>`;
}
function nuvem(x, y, s, o) {
  return `<g transform="translate(${x},${y}) scale(${s})" opacity="${o}"><g class="flut">
    <ellipse cx="0" cy="0" rx="34" ry="18" fill="#fff"/><ellipse cx="-26" cy="6" rx="20" ry="13" fill="#fff"/><ellipse cx="26" cy="6" rx="22" ry="14" fill="#fff"/>
  </g></g>`;
}

// ---------------- ESTADO ----------------
const NPARADAS = 5;
let STATE = { nome: '', feitas: [] };
try { const s = JSON.parse(localStorage.getItem('ev_trilha_v1') || '{}'); if (s && s.feitas) STATE = s; } catch (e) {}
function salva() { try { localStorage.setItem('ev_trilha_v1', JSON.stringify(STATE)); } catch (e) {} }
function feito(i) { return STATE.feitas.indexOf(i) >= 0; }
function N() { const n = STATE.nome || 'amiguinho'; return n.charAt(0).toUpperCase() + n.slice(1); }

// ---------------- BLINK do Byte ----------------
function ligaBlink() {
  setInterval(() => {
    document.querySelectorAll('.olho').forEach(o => {
      o.style.transition = 'transform .08s'; o.style.transformBox = 'fill-box'; o.style.transformOrigin = 'center';
      o.style.transform = 'scaleY(.1)';
      setTimeout(() => { o.style.transform = 'scaleY(1)'; }, 120);
    });
  }, 3400);
}

// ---------------- TELAS ----------------
function show(id) { ['nome', 'trilha', 'parada'].forEach(t => $(t).classList.toggle('on', t === id)); }

// ---------------- TRILHA ----------------
function renderTrilha() {
  const cores = [
    { parede: '#f2c14e', telha: '#d1603a', porta: '#8a5a34' },
    { parede: '#8ec6e6', telha: '#3f7fb0', porta: '#5a7690' },
    { parede: '#e88fae', telha: '#b0466e', porta: '#7a3a52' },
    { parede: '#a7d98a', telha: '#5a9a44', porta: '#4a6a34' },
    { parede: '#c9a7e6', telha: '#7a52b0', porta: '#523a7a' }
  ];
  // vila lá em cima, SENTADA num morro (não flutua) — casinhas cinzas que ganham cor
  const hillY = x => { const t = x / 500; return 158 * ((1 - t) * (1 - t) + t * t) + 176 * t * (1 - t); };
  let vila = '';
  const vx = [95, 160, 225, 290, 355];
  for (let i = 0; i < NPARADAS; i++) {
    const acesa = feito(i);
    vila += `<g style="${acesa ? '' : 'filter:grayscale(1) brightness(1.05);opacity:.72'}">${casinha(vx[i], hillY(vx[i]) - 20, 0.78, cores[i])}</g>`;
  }
  // caminho serpenteando de baixo (parada 1) até a vila
  const pts = [[250, 815], [150, 690], [330, 575], [160, 455], [330, 335]];
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], mx = (a[0] + b[0]) / 2; d += ` C ${a[0]} ${(a[1] + b[1]) / 2}, ${b[0]} ${(a[1] + b[1]) / 2}, ${b[0]} ${b[1]}`; }
  // nós
  let nodes = '';
  const icones = ['cesta', 'passo', 'forma', 'letra', 'estrela'];
  for (let i = 0; i < NPARADAS; i++) {
    const [x, y] = pts[i], done = feito(i), aberta = (i === 0) || feito(i - 1), atual = aberta && !done;
    const cor = done ? '#ffcf3f' : (aberta ? '#69d06a' : '#b9c6cf');
    const sombra = done ? '#c98a1a' : (aberta ? '#2e8a38' : '#8ea3ad');
    let ic;
    if (icones[i] === 'cesta') ic = `<path d="M-13 -3 L13 -3 L9 11 L-9 11 Z" fill="#fff" opacity=".95"/><path d="M-15 -3 Q0 -11 15 -3" stroke="#fff" stroke-width="3" fill="none"/>`;
    else if (icones[i] === 'passo') ic = `<rect x="-11" y="-9" width="9" height="9" rx="2" fill="#fff"/><rect x="2" y="0" width="9" height="9" rx="2" fill="#fff"/>`;
    else if (icones[i] === 'forma') ic = `<path d="M0 -12 L11 8 L-11 8 Z" fill="#fff"/>`;
    else if (icones[i] === 'letra') ic = `<text x="0" y="7" font-size="22" font-weight="900" fill="#fff" text-anchor="middle">A</text>`;
    else ic = `<path d="M0 -12 L3 -4 L12 -4 L5 2 L7 11 L0 6 L-7 11 L-5 2 L-12 -4 L-3 -4 Z" fill="#fff"/>`;
    const lock = (!aberta) ? `<rect x="-7" y="-4" width="14" height="12" rx="2" fill="#fff" opacity=".9"/><path d="M-4 -4 V-8 a4 4 0 0 1 8 0 V-4" stroke="#fff" stroke-width="2.4" fill="none"/>` : ic;
    const anel = atual ? `<circle r="34" fill="none" stroke="#ffcf3f" stroke-width="4" class="pulso"/>` : '';
    nodes += `<g class="node" data-i="${i}" transform="translate(${x},${y})">
      ${anel}<ellipse cx="0" cy="7" rx="30" ry="9" fill="#000" opacity=".12"/>
      <circle r="27" fill="${sombra}"/><circle cx="0" cy="-3" r="27" fill="${cor}"/>
      <g transform="translate(0,-3)">${lock}</g>
      ${done ? '<path d="M-9 -3 L-3 4 L10 -10" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : ''}
    </g>`;
  }
  // Byte perto da parada atual
  const atualIdx = STATE.feitas.length < NPARADAS ? STATE.feitas.length : NPARADAS - 1;
  const bp = pts[Math.min(atualIdx, NPARADAS - 1)];
  const byte = `<g transform="translate(${bp[0] + 46},${bp[1] - 4})">${byteSVG(66)}</g>`;

  $('trilhaSVG').innerHTML =
    `<svg viewBox="0 0 500 900" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <defs><radialGradient id="sol" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c8"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs>
      <circle cx="466" cy="46" r="26" fill="#ffe27a"/><circle cx="466" cy="46" r="50" fill="url(#sol)"/>
      ${nuvem(110, 90, .9, .85)}${nuvem(340, 60, .7, .8)}
      <path d="M0 158 Q250 88 500 158 L500 250 L0 250 Z" fill="#c6e7a4"/>
      <path d="M0 172 Q250 108 500 172" stroke="#b6df8f" stroke-width="3" fill="none" opacity=".6"/>
      ${vila}
      <path d="M0 300 Q250 250 500 300 L500 900 L0 900 Z" fill="#bfe6a0"/>
      <path d="M0 384 Q250 334 500 384 L500 900 L0 900 Z" fill="#a6da86"/>
      <path d="${d}" stroke="#e9d9a8" stroke-width="30" fill="none" stroke-linecap="round"/>
      <path d="${d}" stroke="#f6ecc9" stroke-width="20" fill="none" stroke-linecap="round" stroke-dasharray="2 26"/>
      ${nodes}${byte}
    </svg>`;
  $('pilhaProg').textContent = 'Paradas: ' + STATE.feitas.length + '/' + NPARADAS;

  $('trilhaSVG').querySelectorAll('.node').forEach(n => {
    n.addEventListener('click', () => {
      const i = +n.dataset.i, aberta = (i === 0) || feito(i - 1);
      liga();
      if (!aberta) { tom(200, .18, 'sine', .05, 150); return; }
      if (i === 0) abreParada();
      else falaByte(['Essa parada chega em breve, ' + N() + '! Termine a primeira.']);
    });
  });
  ligaBlink();
}

// ---------------- FALA do Byte na trilha (balão simples via alert-free) ----------------
let _balTimer = null;
function falaByte(txts) {
  // usa o balão da parada? Na trilha mostramos com o mesmo balão flutuante simples.
  const b = document.createElement('div'); b.className = 'balao on'; b.style.zIndex = 60; b.textContent = txts[0];
  document.getElementById('trilha').appendChild(b);
  clearTimeout(_balTimer); _balTimer = setTimeout(() => b.remove(), 2600);
}

// ================= PARADA: "A horta pede" (JUNTAR) =================
const RODADAS = [[3, 2], [5, 4]];
let P = null;
function abreParada() {
  show('parada');
  P = { rod: 0, ca: 0, cb: 0, fase: 'colher', apples: { a: [], b: [] }, total: 0 };
  montaCena();
  $('reflex').classList.remove('on');
  setTimeout(() => iniciaRodada(true), 350);
}
function montaCena() {
  $('paradaSVG').innerHTML =
    `<svg id="svgP" viewBox="0 0 720 900" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <defs><radialGradient id="sol2" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c8"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs>
      <circle cx="610" cy="150" r="36" fill="#ffe27a"/><circle cx="610" cy="150" r="84" fill="url(#sol2)"/>
      ${nuvem(150, 140, 1, .85)}${nuvem(520, 100, .8, .8)}
      <path d="M0 470 Q360 415 720 470 L720 900 L0 900 Z" fill="#a6da86"/>
      <path d="M0 560 Q360 520 720 560 L720 900 L0 900 Z" fill="#8fce70"/>
      ${macieira(190, 485, .86)}${macieira(530, 485, .86)}
      ${byteG(360, 470, .95)}
      ${coelho(360, 690, 1.12)}
      ${cestaSVG(190, 650, .9)}${cestaSVG(530, 650, .9)}
      <g id="capaz"></g>
      <rect id="tapA" x="110" y="310" width="160" height="190" fill="#000" opacity="0" style="cursor:pointer"/>
      <rect id="tapB" x="450" y="310" width="160" height="190" fill="#000" opacity="0" style="cursor:pointer"/>
    </svg>`;
  ligaBlink();
  $('svgP').querySelector('#tapA').addEventListener('click', () => tapArvore('a'));
  $('svgP').querySelector('#tapB').addEventListener('click', () => tapArvore('b'));
}
// posições dos "montes" (cestas), do encontro (juntar) e de onde a maçã cai
const CX_A = 190, CX_B = 530, CX_J = 360, Y_QUEDA = 360;
function slot(cx, i) { const col = i % 3, row = Math.floor(i / 3); return { x: cx + (col - 1) * 32, y: 636 - row * 26 }; }

function iniciaRodada(primeira) {
  const [a, b] = RODADAS[P.rod]; P.a = a; P.b = b; P.ca = 0; P.cb = 0; P.fase = 'colher';
  P.apples = { a: [], b: [] }; $('capaz').innerHTML = ''; $('pilhaCesta').textContent = 'Maçãs: 0';
  acao(false);
  const id = idNome(STATE.nome);
  const falas = primeira
    ? [[id, 't_vila'], ['t_pede']]
    : [['t_boa']];
  balaoSeq(primeira ? ['Oi, ' + N() + '! A vila está dormindo e os bichos com fome.', 'Toque na macieira pra colher as maçãs nas cestas.']
                    : ['Muito bem! Vamos colher mais um pouquinho.'], falas);
}
function tapArvore(side) {
  if (!P || P.fase !== 'colher') return;
  const alvo = side === 'a' ? P.a : P.b;
  P.fly = P.fly || { a: 0, b: 0 };
  const have = (side === 'a' ? P.ca : P.cb) + P.fly[side];
  if (have >= alvo) return;               // já tem/vem o suficiente (some o spam-toque)
  liga();
  const idx = have;                        // reserva ESTE slot (cada maçã no seu lugar)
  P.fly[side]++;
  const cx = side === 'a' ? CX_A : CX_B, sl = slot(cx, idx);
  const m = macaEl($('capaz'), cx + (Math.random() * 40 - 20), Y_QUEDA, 15);
  sPop();
  tween(520, p => { m.setAttribute('transform', `translate(${cx + (sl.x - cx) * p},${Y_QUEDA + (sl.y - Y_QUEDA) * p - Math.sin(p * Math.PI) * 60})`); }, () => {
    m.setAttribute('transform', `translate(${sl.x},${sl.y})`);
    P.fly[side]--;
    if (side === 'a') { P.ca++; P.apples.a.push(m); } else { P.cb++; P.apples.b.push(m); }
    const c = side === 'a' ? P.ca : P.cb;
    Voz.stop(); Voz.um('kn' + c); popNum(c, cx);
    $('pilhaCesta').textContent = 'Maçãs: ' + (P.ca + P.cb);
    if (P.ca >= P.a && P.cb >= P.b && P.fase === 'colher') faseJuntar();
  }, easeOut);
}
function faseJuntar() {
  P.fase = 'juntar';
  balaoSeq(['Agora junte as duas cestas! Quantas maçãs dão ao todo?'], [['t_junta']]);
  const bt = $('acao'); bt.textContent = 'JUNTAR'; bt.className = 'acao on pulsa';
  bt.onclick = juntar;
}
function acao(on, txt, fn) { const bt = $('acao'); bt.className = 'acao' + (on ? ' on' : ''); if (txt) bt.textContent = txt; bt.onclick = fn || null; }
function juntar() {
  if (P.fase !== 'juntar') return; P.fase = 'contando'; acao(false);
  Voz.stop(); $('balao').classList.remove('on');
  const todas = P.apples.a.concat(P.apples.b), total = todas.length; let k = 0;
  (function passo() {
    if (k >= total) { fimRodada(total); return; }
    const m = todas[k], sl = slot(CX_J, k), from = m.getAttribute('transform');
    const fx = parseFloat(from.split('(')[1]); const fy = parseFloat(from.split(',')[1]);
    tween(300, p => { m.setAttribute('transform', `translate(${fx + (sl.x - fx) * p},${fy + (sl.y - fy) * p - Math.sin(p * Math.PI) * 40})`); }, () => {
      k++; sPlim(); Voz.stop(); Voz.um('kn' + k); popNum(k, CX_J);
      hop($('coelho'));
      setTimeout(passo, 340);
    }, easeOut);
  })();
}
function fimRodada(total) {
  sFest(); confete();
  P.rod++;
  if (P.rod < RODADAS.length) {
    balaoSeq([total + ' maçãs! Você juntou os dois montes.'], [['t_desc']], () => setTimeout(() => iniciaRodada(false), 700));
  } else {
    balaoSeq([total + ' maçãs! Juntar as duas cestas é o mesmo que SOMAR.'], [['t_desc']], () => setTimeout(vitoria, 500));
  }
}
function vitoria() {
  if (STATE.feitas.indexOf(0) < 0) STATE.feitas.push(0); salva();
  $('reflexT').textContent = 'Você acordou a vila, ' + N() + '!';
  $('reflexP').textContent = 'O que você mais gostou de fazer hoje?';
  $('byteFim').innerHTML = byteSVG(80);
  $('reflex').classList.add('on'); ligaBlink();
  Voz.cadeia(['t_festa', 't_refl']);
}

// ---- balão + número + fx ----
let _bt = null, _ba = null;
function balaoSeq(txts, audios, done) {
  const b = $('balao'); let i = 0;
  function mostra() {
    b.textContent = txts[i]; b.classList.add('on');
    const ids = audios && audios[i] ? audios[i] : null;
    const proximo = () => { i++; if (i < txts.length) mostra(); else { setTimeout(() => b.classList.remove('on'), 900); if (done) done(); } };
    if (ids) { Voz.stop(); Voz.cadeia(ids, () => setTimeout(proximo, 250)); }
    else { clearTimeout(_bt); _bt = setTimeout(proximo, 1400 + txts[i].length * 45); }
  }
  clearTimeout(_bt); mostra();
}
function popNum(n, svgX) {
  const nd = $('numerao'); nd.textContent = n;
  // posição horizontal aproximada (viewBox 720 de largura); vertical fixo no alto
  nd.style.left = (svgX / 720 * 100) + '%'; nd.style.top = '30%';
  nd.style.opacity = '1'; nd.style.transition = 'none'; nd.style.transform = 'translate(-50%,-50%) scale(.4)';
  requestAnimationFrame(() => { nd.style.transition = 'transform .18s cubic-bezier(.2,1.6,.4,1)'; nd.style.transform = 'translate(-50%,-50%) scale(1.1)'; });
  clearTimeout(_ba); _ba = setTimeout(() => { nd.style.transition = 'opacity .4s,transform .4s'; nd.style.opacity = '0'; nd.style.transform = 'translate(-50%,-70%) scale(1)'; }, 460);
}
function hop(node) { if (!node) return; node.style.transition = 'transform .18s'; node.style.transform = 'translateY(-16px)'; setTimeout(() => { node.style.transform = 'translateY(0)'; }, 190); }

// confete no canvas
function confete() {
  const c = $('fx'), r = c.getBoundingClientRect(); c.width = r.width; c.height = r.height; const g = c.getContext('2d');
  const cor = ['#ffd45a', '#ff5a5a', '#5ad1ff', '#8aff7a', '#ff8ad1'], ps = [];
  for (let i = 0; i < 90; i++) ps.push({ x: Math.random() * c.width, y: -20 - Math.random() * 80, vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 3, a: Math.random() * 6, va: (Math.random() - .5) * .4, w: 7 + Math.random() * 6, cor: cor[i % 5] });
  let t = 0;
  (function fr() {
    g.clearRect(0, 0, c.width, c.height); t++;
    ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.a += p.va; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.cor; g.fillRect(-p.w / 2, -p.w / 2, p.w, p.w * 1.4); g.restore(); });
    if (t < 150) requestAnimationFrame(fr); else g.clearRect(0, 0, c.width, c.height);
  })();
}

// ---------------- gesto p/ ligar som ----------------
let _ligado = false;
function liga() { if (_ligado) return; _ligado = true; initSom(); }

// ---------------- BOOT ----------------
$('byteHi').innerHTML = byteSVG(86);
ligaBlink();
$('nbt').addEventListener('click', comecar);
$('nin').addEventListener('keydown', e => { if (e.key === 'Enter') comecar(); });
setTimeout(() => { try { $('nin').focus(); } catch (e) {} }, 300);
function comecar() {
  const n = ($('nin').value || '').trim() || 'amiguinho';
  STATE.nome = n; salva(); liga();
  show('trilha'); renderTrilha();
  const id = idNome(n);
  setTimeout(() => Voz.cadeia([id, 't_ola', 't_prox']), 500);
}
$('pilhaVolta').addEventListener('click', () => { Voz.stop(); show('trilha'); renderTrilha(); });
$('reflexBt').addEventListener('click', () => { Voz.stop(); $('reflex').classList.remove('on'); show('trilha'); renderTrilha(); });
$('btVoz').addEventListener('click', () => { liga(); Voz.cadeia([idNome(STATE.nome), 't_vila']); });
if (STATE.nome) { /* já tem nome salvo: começa direto na trilha */ }
