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

// ---------------- ARTE (imagens PREMIUM pintadas — Gemini, recorte transparente) ----------------
// proporção (larg/alt) de cada sprite recortado
const RATIO = { byte: 270 / 420, casa: 317 / 300, maca: 156 / 190, cesta: 343 / 210, coelho: 150 / 300 };
// sprite ancorado nos PÉS em (cx, feetY), com altura ht (coords do viewBox 1024)
function sprite(name, cx, feetY, ht, extra) {
  const w = ht * RATIO[name];
  return `<image href="img/${name}.png" x="${(cx - w / 2).toFixed(1)}" y="${(feetY - ht).toFixed(1)}" width="${w.toFixed(1)}" height="${ht}" ${extra || ''}/>`;
}
function sombra(cx, cy, rx) { return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.3}" fill="#1b3a14" opacity=".18"/>`; }
// maçã (imagem) como elemento animável dentro de <g>
function macaEl(parent, x, y) {
  const g = el('g', { transform: `translate(${x},${y})` }, parent);
  const w = 44, h = 54;
  el('image', { href: 'img/maca.png', x: -w / 2, y: -h / 2, width: w, height: h }, g);
  return g;
}

// ---------------- ESTADO ----------------
const NPARADAS = 5;
let STATE = { nome: '', feitas: [] };
try { const s = JSON.parse(localStorage.getItem('ev_trilha_v1') || '{}'); if (s && s.feitas) STATE = s; } catch (e) {}
function salva() { try { localStorage.setItem('ev_trilha_v1', JSON.stringify(STATE)); } catch (e) {} }
function feito(i) { return STATE.feitas.indexOf(i) >= 0; }
function N() { const n = STATE.nome || 'amiguinho'; return n.charAt(0).toUpperCase() + n.slice(1); }

function ligaBlink() { /* Byte agora é imagem pintada (respira via CSS .byteWrap); sem blink por código */ }

// ---------------- TELAS ----------------
function show(id) { ['nome', 'trilha', 'parada'].forEach(t => $(t).classList.toggle('on', t === id)); }

// ---------------- TRILHA (fundo pintado + vila em sprites) ----------------
// viewBox 1024x1024 + slice: no celular mostra o centro; no PC mostra tudo. Elementos na
// zona-segura x:280..760, y:130..900 (visível nas duas orientações).
function renderTrilha() {
  // vila no platô pintado (y~430). Casinhas acesas (coloridas) ou dormindo (cinza).
  const vx = [312, 412, 512, 612, 712];
  let vila = '';
  for (let i = 0; i < NPARADAS; i++) {
    const dorme = !feito(i);
    const fx = dorme ? 'filter:grayscale(1) brightness(1.03);opacity:.82' : '';
    vila += sprite('casa', vx[i], 452, 96, `style="${fx}"`);
  }
  // caminho serpenteando de baixo até o platô
  const pts = [[512, 880], [372, 780], [652, 672], [372, 560], [600, 486]];
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; d += ` C ${a[0]} ${(a[1] + b[1]) / 2}, ${b[0]} ${(a[1] + b[1]) / 2}, ${b[0]} ${b[1]}`; }
  // nós
  let nodes = '';
  const icones = ['cesta', 'passo', 'forma', 'letra', 'estrela'];
  for (let i = 0; i < NPARADAS; i++) {
    const [x, y] = pts[i], done = feito(i), aberta = (i === 0) || feito(i - 1), atual = aberta && !done;
    const cor = done ? '#ffcf3f' : (aberta ? '#69d06a' : '#c3ced6');
    const som = done ? '#c98a1a' : (aberta ? '#2e8a38' : '#95a6b0');
    let ic;
    if (icones[i] === 'cesta') ic = `<path d="M-20 -5 L20 -5 L14 17 L-14 17 Z" fill="#fff" opacity=".95"/><path d="M-23 -5 Q0 -17 23 -5" stroke="#fff" stroke-width="5" fill="none"/>`;
    else if (icones[i] === 'passo') ic = `<rect x="-17" y="-14" width="14" height="14" rx="3" fill="#fff"/><rect x="3" y="0" width="14" height="14" rx="3" fill="#fff"/>`;
    else if (icones[i] === 'forma') ic = `<path d="M0 -18 L17 12 L-17 12 Z" fill="#fff"/>`;
    else if (icones[i] === 'letra') ic = `<text x="0" y="11" font-size="34" font-weight="900" fill="#fff" text-anchor="middle">A</text>`;
    else ic = `<path d="M0 -18 L5 -6 L18 -6 L8 3 L11 17 L0 9 L-11 17 L-8 3 L-18 -6 L-5 -6 Z" fill="#fff"/>`;
    const lock = (!aberta) ? `<rect x="-11" y="-6" width="22" height="18" rx="3" fill="#fff" opacity=".92"/><path d="M-6 -6 V-12 a6 6 0 0 1 12 0 V-6" stroke="#fff" stroke-width="4" fill="none"/>` : ic;
    const anel = atual ? `<circle r="52" fill="none" stroke="#ffcf3f" stroke-width="6" class="pulso"/>` : '';
    nodes += `<g class="node" data-i="${i}" transform="translate(${x},${y})">
      ${anel}<ellipse cx="0" cy="11" rx="46" ry="14" fill="#000" opacity=".14"/>
      <circle r="42" fill="${som}"/><circle cx="0" cy="-5" r="42" fill="${cor}"/>
      <g transform="translate(0,-5)">${lock}</g>
      ${done ? '<path d="M-14 -5 L-5 6 L15 -15" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : ''}
    </g>`;
  }
  // Byte perto da parada atual
  const atualIdx = STATE.feitas.length < NPARADAS ? STATE.feitas.length : NPARADAS - 1;
  const bp = pts[Math.min(atualIdx, NPARADAS - 1)];
  const byte = sombra(bp[0] + 74, bp[1] + 8, 42) + sprite('byte', bp[0] + 74, bp[1] + 10, 128, 'class="byteWrap"');

  $('trilhaSVG').innerHTML =
    `<svg viewBox="0 0 1024 1024" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <image href="img/bg_trilha.jpg" x="0" y="0" width="1024" height="1024"/>
      ${vila}
      <path d="${d}" stroke="#efe0b0" stroke-width="46" fill="none" stroke-linecap="round" opacity=".92"/>
      <path d="${d}" stroke="#fbf1cf" stroke-width="30" fill="none" stroke-linecap="round" stroke-dasharray="2 40"/>
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
// Cena da parada: fundo POMAR pintado (duas macieiras já na arte) + sprites por cima.
// viewBox 1024 + slice; zona-segura central. As duas macieiras do fundo ficam à
// esquerda (~x350) e à direita (~x670); cestas embaixo delas; Byte e coelho no centro.
function montaCena() {
  $('paradaSVG').innerHTML =
    `<svg id="svgP" viewBox="0 0 1024 1024" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <image href="img/bg_horta.jpg" x="0" y="0" width="1024" height="1024"/>
      ${sombra(512, 560, 46)}${sprite('byte', 512, 560, 150, 'class="byteWrap"')}
      ${sombra(512, 838, 44)}${sprite('coelho', 512, 838, 138, 'id="coelho"')}
      ${sombra(CX_A, 772, 62)}${sprite('cesta', CX_A, 780, 132)}
      ${sombra(CX_B, 772, 62)}${sprite('cesta', CX_B, 780, 132)}
      <g id="capaz"></g>
      <rect id="tapA" x="238" y="180" width="228" height="360" fill="#000" opacity="0" style="cursor:pointer"/>
      <rect id="tapB" x="560" y="180" width="228" height="360" fill="#000" opacity="0" style="cursor:pointer"/>
    </svg>`;
  $('svgP').querySelector('#tapA').addEventListener('click', () => tapArvore('a'));
  $('svgP').querySelector('#tapB').addEventListener('click', () => tapArvore('b'));
}
// posições dos "montes" (cestas), do encontro (juntar) e de onde a maçã cai
const CX_A = 352, CX_B = 672, CX_J = 512, Y_QUEDA = 430;
function slot(cx, i) { const col = i % 3, row = Math.floor(i / 3); return { x: cx + (col - 1) * 42, y: 760 - row * 34 }; }

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
  $('byteFim').innerHTML = '<img src="img/byte.png" style="height:100%" alt="Byte">';
  $('reflex').classList.add('on');
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
  nd.style.left = '50%'; nd.style.top = '28%';
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
$('byteHi').innerHTML = '<img src="img/byte.png" style="height:100%" alt="Byte">';
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
