const presets = [
  { name: 'Chorizos', cook: 30, flip: 7, phase: 'Entrada', detail: 'Fuego medio · girar regularmente' },
  { name: 'Provolone', cook: 10, flip: 0, phase: 'Entrada', detail: 'En provoletera · sin girar el queso' },
  { name: 'Colita de cuadril', cook: 55, flip: 15, phase: 'Carne', detail: 'Pieza entera · fuego medio-bajo' },
  { name: 'Tira de asado', cook: 45, flip: 30, phase: 'Carne', detail: 'Grosor medio · primero del lado del hueso' },
  { name: 'Bife de vacío', cook: 20, flip: 10, phase: 'Carne', detail: 'Fuego medio-alto · ajustá según el grosor' },
  { name: 'Entraña', cook: 8, flip: 4, phase: 'Carne', detail: 'Fuego fuerte · una vuelta a mitad' },
  { name: 'Vacío entero', cook: 65, flip: 25, detail: 'Fuego medio-bajo', sizes: [50, 85], rest: 10 },
  { name: 'Matambre', cook: 30, flip: 15, detail: 'Fuego medio', sizes: [20, 45] },
  { name: 'Bife de chorizo', cook: 16, flip: 8, detail: 'Fuego medio-alto', sizes: [10, 24] },
  { name: 'Ojo de bife', cook: 16, flip: 8, detail: 'Fuego medio-alto', sizes: [10, 24] },
  { name: 'Lomo', cook: 18, flip: 8, detail: 'En medallones · fuego medio-alto', sizes: [12, 26] },
  { name: 'Picaña', cook: 45, flip: 15, detail: 'Pieza entera · fuego medio-bajo', sizes: [35, 60], rest: 8 },
  { name: 'Tapa de asado', cook: 55, flip: 20, detail: 'Fuego medio-bajo', sizes: [40, 70], rest: 10 },
  { name: 'Costillar', cook: 120, flip: 60, detail: 'Fuego bajo · empezá del lado del hueso', sizes: [90, 165], rest: 10 },
  { name: 'Bife angosto', cook: 15, flip: 7, detail: 'Fuego medio-alto', sizes: [10, 22] },
  { name: 'Bife ancho', cook: 18, flip: 9, detail: 'Fuego medio-alto', sizes: [12, 26] },
  { name: 'Cuadril', cook: 18, flip: 8, detail: 'En bifes · fuego medio-alto', sizes: [12, 26] },
  { name: 'Bondiola de cerdo', cook: 24, flip: 10, detail: 'En bifes · fuego medio', sizes: [16, 35], emoji: '🥓' },
  { name: 'Pechito de cerdo', cook: 60, flip: 25, detail: 'Fuego medio-bajo', sizes: [45, 80], rest: 5, emoji: '🍖' },
  { name: 'Pollo', cook: 45, flip: 20, detail: 'En presas · fuego medio', sizes: [30, 60], emoji: '🍗' },
  { name: 'Morcilla', cook: 12, flip: 6, phase: 'Entrada', detail: 'Ya cocida · calentar a fuego suave', emoji: '🌭' },
  { name: 'Mollejas', cook: 35, flip: 12, phase: 'Entrada', detail: 'Fuego medio · dorar por ambos lados', sizes: [25, 45] },
  { name: 'Chinchulines', cook: 50, flip: 15, phase: 'Entrada', detail: 'Fuego medio-bajo', sizes: [40, 60] },
  { name: 'Riñones', cook: 18, flip: 8, phase: 'Entrada', detail: 'En mitades · fuego medio', sizes: [12, 25] },
  { name: 'Chistorra', cook: 14, flip: 5, phase: 'Entrada', detail: 'Fuego medio · girar regularmente', emoji: '🌭' },
];

const key = 'parrilla-timer-v1';
const minute = 60_000;
const freshClock = () => ({ elapsed: 0, since: null });
const freshCut = () => ({ ...freshClock(), nextFlip: 0, flipAlerted: false, done: false });
const $ = (selector, root = document) => root.querySelector(selector);
let saved;
try {
  saved = JSON.parse(localStorage.getItem(key));
} catch {
  // The app also runs when storage is unavailable.
}
const master = { ...freshClock(), ...saved?.master };
const legacyOrder = [2, 3, 0, 1, 4, 5];
const order = [...legacyOrder, ...presets.slice(6).map((_, index) => index + 6)];
const emojis = ['🌭', '🧀', '🥩', '🍖', '🥓', '🔥'];
const profiles = [
  null, null,
  { thin: 45, thick: 65 },
  { thin: 35, thick: 50 },
  { thin: 15, thick: 25 },
  { thin: 6, thick: 10 },
  ...presets.slice(6).map(preset => preset.sizes ? { thin: preset.sizes[0], thick: preset.sizes[1] } : null),
];
function createPiece(type, profile = 'medium', id = crypto.randomUUID()) {
  return {
    ...presets[type], phase: presets[type].phase ?? 'Carne', ...freshCut(), id, type, profile,
    cook: profiles[type]?.[profile] ?? presets[type].cook,
  };
}

const legacyActive = saved?.cuts?.some(cut => cut.since !== null || cut.elapsed || cut.done);
let pieces = saved?.pieces ?? legacyOrder.flatMap(type => {
  if (!(saved?.menu ? saved.menu[type]?.selected : legacyActive)) return [];
  const { name, ...clock } = saved.cuts[type];
  return [{ ...createPiece(type, saved.menu?.[type]?.profile), ...clock, name: presets[type].name }];
});
let views = [];

function pieceLabels(list) {
  const totals = new Map();
  for (const piece of list) totals.set(piece.type, (totals.get(piece.type) ?? 0) + 1);
  const seen = new Map();
  return list.map(piece => {
    const count = (seen.get(piece.type) ?? 0) + 1;
    seen.set(piece.type, count);
    const name = presets[piece.type].name;
    return totals.get(piece.type) > 1 ? name + ' ' + count : name;
  });
}
const elapsed = (clock, now) => clock.elapsed + (clock.since === null ? 0 : Math.max(0, now - clock.since));
const active = clock => clock.since !== null;

function save() {
  try {
    localStorage.setItem(key, JSON.stringify({ master, pieces }));
  } catch {
    // Timers continue in memory.
  }
}

function format(ms, round = Math.ceil) {
  const seconds = Math.max(0, round(ms / 1000));
  return [Math.floor(seconds / 60), seconds % 60].map(n => String(n).padStart(2, '0')).join(':');
}

function toggle(clock, now) {
  if (active(clock)) {
    clock.elapsed = elapsed(clock, now);
    clock.since = null;
  } else {
    clock.since = now;
  }
}

let audio;
let sound = false;


function play(kind) {
  if (!sound || audio?.state !== 'running') return;
  const notes = kind === 'flip' ? [660, 880] : [620, 780, 1040];
  notes.forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = audio.currentTime + index * .22;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.001, start);
    gain.gain.exponentialRampToValueAtTime(.23, start + .025);
    gain.gain.exponentialRampToValueAtTime(.001, start + .19);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + .2);
  });
}

let noticeTimeout;
function notify(messages) {
  $('#notice').textContent = messages.join(' · ');
  clearTimeout(noticeTimeout);
  noticeTimeout = setTimeout(() => { $('#notice').textContent = ''; }, 8500);
}

async function enableAudio() {
  if (audio?.state === 'running') return;
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    audio ??= new Context();
    await audio.resume();
    sound = true;
  } catch {
    // Visual timer alerts still work without audio.
  }
}

$('#session').addEventListener('click', enableAudio);

const schedule = $('#schedule');
function renderSchedule() {
  const isStarter = piece => presets[piece.type].phase === 'Entrada';
  const sides = pieces.filter(isStarter);
  const meats = pieces.filter(piece => !isStarter(piece));
  const rest = [0, 0, 10, 10, 0, 4];
  const span = piece => piece.cook + (rest[piece.type] ?? presets[piece.type].rest ?? 0);
  const longest = group => Math.max(0, ...group.map(span));
  const gap = sides.length && meats.length ? Math.max(20, longest(meats.filter(piece => span(piece) <= 30))) : 0;
  const main = Math.max(longest(meats), longest(sides) + gap);
  const starter = main - gap;
  const ordered = [...pieces].sort((a, b) => startAt(a) - startAt(b));
  function startAt(piece) {
    return (isStarter(piece) ? starter : main) - span(piece);
  }
  const rows = ordered.map(piece => [startAt(piece), 'Poné ' + piece.name]);
  if (sides.length) rows.push([starter, 'Serví las entradas', true]);
  if (meats.length) rows.push([main, 'Serví los cortes', true]);
  rows.sort((a, b) => a[0] - b[0] || Number(Boolean(b[2])) - Number(Boolean(a[2])));

  schedule.replaceChildren(...rows.map(([at, label, serving]) => {
    const row = document.createElement('li');
    const mark = document.createElement('strong');
    mark.textContent = format(at * minute);
    row.dataset.at = at;
    if (serving) row.dataset.serving = '';
    row.append(mark, label);
    return row;
  }));
  const cards = new Map(views.map(view => [view.cut, view.card]));
  const container = $('#cuts');
  ordered.forEach((piece, index) => {
    const card = cards.get(piece);
    if (card && container.children[index] !== card) container.insertBefore(card, container.children[index] ?? null);
  });
}

const dialog = $('#settings');
dialog.setAttribute('aria-labelledby', 'settings-title');
const form = $('#settings-form');
let editedCut;
$('#cancel').addEventListener('click', () => dialog.close());
form.addEventListener('submit', event => {
  event.preventDefault();
  const now = Date.now();
  const oldCook = editedCut.cook;
  const flip = form.elements.flip.valueAsNumber;
  if (editedCut.flip !== flip) {
    editedCut.nextFlip = flip ? elapsed(editedCut, now) + flip * minute : 0;
    editedCut.flipAlerted = false;
  }
  editedCut.flip = flip;
  editedCut.cook = form.elements.cook.valueAsNumber;
  if (editedCut.done && editedCut.cook > oldCook) editedCut.done = false;
  dialog.close();
  renderSchedule();
  save();
  tick(now);
});

function createView(cut) {
  const index = cut.type;
  const card = $('#cut-template').content.firstElementChild.cloneNode(true);
  const fields = Object.fromEntries(
    ['phase', 'state', 'name', 'detail', 'emoji', 'left', 'box', 'flip', 'bar', 'toggle', 'reset', 'edit', 'minus', 'plus', 'turn']
      .map(field => [field, $("[data-" + field + "]", card)]),
  );
  fields.phase.textContent = cut.phase;
  fields.phase.dataset.phase = cut.phase;
  fields.name.textContent = cut.name;
  fields.detail.textContent = cut.detail;
  fields.emoji.textContent = (emojis[index] ?? presets[index].emoji ?? '🥩');
  fields.left.setAttribute('aria-label', 'Cocción restante');
  fields.flip.setAttribute('aria-label', 'Próxima vuelta');

  function adjust(delta) {
    const now = Date.now();
    const previous = cut.cook;
    cut.cook = Math.max(1, Math.min(240, previous + delta));
    if (cut.cook > previous && elapsed(cut, now) < cut.cook * minute) cut.done = false;
    renderSchedule();
    save();
    tick(now);
  }

  fields.minus.addEventListener('click', () => adjust(-5));
  fields.plus.addEventListener('click', () => adjust(5));

  fields.toggle.addEventListener('click', () => {
    const now = Date.now();
    if (cut.done) return;
    if (!cut.nextFlip) cut.nextFlip = cut.flip * minute;
    toggle(cut, now);
    save();
    tick(now);
  });
  fields.reset.addEventListener('click', () => {
    Object.assign(cut, freshCut());
    save();
    tick();
  });
  fields.turn.addEventListener('click', () => {
    const now = Date.now();
    const time = elapsed(cut, now);
    if (!active(cut) || !cut.flip || time >= cut.cook * minute) return;
    cut.nextFlip = time + cut.flip * minute;
    cut.flipAlerted = false;
    save();
    tick(now);
  });
  fields.edit.addEventListener('click', () => {
    editedCut = cut;
    $('#settings-title').textContent = cut.name;
    form.elements.cook.value = cut.cook;
    form.elements.flip.value = cut.flip;
    dialog.showModal();
  });
  $('#cuts').append(card);
  return { cut, card, fields };
}

const masterToggle = $('#master-toggle');
masterToggle.addEventListener('click', () => {
  const now = Date.now();
  toggle(master, now);
  save();
  tick(now);
});
$('#master-reset').addEventListener('click', () => {
  Object.assign(master, freshClock());
  save();
  tick();
});

function updateCut(view, now, messages) {
  const { cut, card, fields } = view;
  const total = cut.cook * minute;
  const time = elapsed(cut, now);
  const hasFlip = cut.flip > 0;
  const dueAt = cut.nextFlip || cut.flip * minute;
  if (!cut.done && time >= total) {
    cut.elapsed = time;
    cut.since = null;
    cut.done = true;
    messages.push({ kind: 'done', text: 'Revisá el punto · ' + cut.name });
  }
  const due = !cut.done && hasFlip && dueAt < total && time >= dueAt;
  if (active(cut) && due && !cut.flipAlerted) {
    cut.flipAlerted = true;
    messages.push({ kind: 'flip', text: 'Dale la vuelta · ' + cut.name });
  }

  const state = cut.done ? 'done' : active(cut) ? 'running' : time ? 'paused' : 'ready';
  fields.state.dataset.kind = state;
  fields.state.textContent = { done: 'Revisar punto', running: 'Cocinando', paused: 'En pausa', ready: 'Por empezar' }[state];
  fields.left.textContent = format(total - time);
  fields.edit.setAttribute('aria-label', cut.name + ': ' + fields.left.textContent + ' restantes. Ajustar tiempos');
  fields.minus.disabled = cut.cook <= 1;
  fields.plus.disabled = cut.cook >= 240;
  fields.box.hidden = !hasFlip || cut.done || dueAt >= total || state === 'ready';
  fields.flip.textContent = due ? '¡Dale la vuelta!' : 'Vuelta en ' + format(dueAt - time);
  fields.box.dataset.due = String(due);
  card.dataset.urgent = String(due || cut.done);
  const progress = Math.min(100, Math.floor(100 * time / total));
  fields.bar.style.setProperty('--progress', progress + '%');
  fields.bar.setAttribute('aria-valuenow', String(progress));
  fields.toggle.textContent = active(cut) ? 'Pausar' : time && !cut.done ? 'Reanudar' : 'Iniciar';
  fields.toggle.disabled = cut.done;
  fields.turn.disabled = !active(cut);
}

function tick(now = Date.now()) {
  const messages = [];
  const visible = views;
  for (const view of visible) updateCut(view, now, messages);
  const time = elapsed(master, now);
  $('#master-time').textContent = format(time, Math.floor);
  masterToggle.textContent = active(master) ? 'Pausar reloj' : time ? 'Reanudar reloj' : 'Iniciar reloj';
  $('#progress').textContent = visible.filter(view => view.cut.done).length + ' / ' + visible.length + ' listas';
  for (const row of schedule.children) row.dataset.past = String(time >= Number(row.dataset.at) * minute && (time > 0 || active(master)));
  if (messages.length) {
    save();
    notify(messages.map(message => message.text));
    play(messages.some(message => message.kind === 'done') ? 'done' : 'flip');
  }
}

const setup = $('#setup');
const setupForm = $('#setup-form');
const session = $('#session');
const dropZone = $('#selected-pieces');
let draft = [];
let draggedType = null;

function addPiece(type) {
  draft.push(createPiece(type));
  renderDraft();
}

for (const type of order) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button';
  button.draggable = true;
  button.textContent = (emojis[type] ?? presets[type].emoji ?? '🥩') + ' ' + presets[type].name + ' +';
  button.addEventListener('click', () => addPiece(type));
  button.addEventListener('dragstart', event => {
    draggedType = type;
    event.dataTransfer.setData('text/plain', presets[type].name);
    event.dataTransfer.effectAllowed = 'copy';
  });
  button.addEventListener('dragend', () => {
    draggedType = null;
    dropZone.classList.remove('drag-over');
  });
  $('#ingredients').append(button);
}

dropZone.addEventListener('dragover', event => {
  if (draggedType === null) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', event => {
  if (!dropZone.contains(event.relatedTarget)) dropZone.classList.remove('drag-over');
});
dropZone.addEventListener('drop', event => {
  if (draggedType === null) return;
  event.preventDefault();
  addPiece(draggedType);
  dropZone.classList.remove('drag-over');
});

function renderDraft() {
  const labels = pieceLabels(draft);
  $('#empty-pieces').hidden = draft.length > 0;
  $('#build-plan').disabled = draft.length === 0;
  $('#draft-list').replaceChildren(...draft.map((piece, index) => {
    const row = $('#ingredient-template').content.firstElementChild.cloneNode(true);
    $('.ingredient-name', row).textContent = (emojis[piece.type] ?? presets[piece.type].emoji ?? '🥩') + ' ' + labels[index];
    const select = $('select', row);
    select.parentElement.hidden = !profiles[piece.type];
    select.value = piece.profile;
    select.setAttribute('aria-label', 'Grosor de ' + labels[index]);
    select.addEventListener('change', () => { piece.profile = select.value; });
    const remove = $('button', row);
    remove.setAttribute('aria-label', 'Quitar ' + labels[index]);
    remove.addEventListener('click', () => {
      draft.splice(index, 1);
      renderDraft();
      const nextRemove = $('#draft-list').querySelectorAll('button')[index] ??
        $('#draft-list').lastElementChild?.querySelector('button') ?? $('#ingredients button');
      nextRemove.focus();
    });
    return row;
  }));
}

function openSetup(focus = false) {
  draft = pieces.map(({ id, type, profile }) => ({ id, type, profile }));
  session.hidden = true;
  setup.hidden = false;
  $('#cancel-setup').hidden = !pieces.length;
  $('#build-plan').textContent = pieces.length ? 'Guardar cambios' : 'Empezar asado';
  renderDraft();
  if (focus) $('#setup-title').focus();
}

function showSession(focus = false) {
  setup.hidden = true;
  session.hidden = false;
  $('#cuts').replaceChildren();
  const labels = pieceLabels(pieces);
  pieces.forEach((piece, index) => { piece.name = labels[index]; });
  views = pieces.map(createView);
  renderSchedule();
  tick();
  if (focus) $('#cuts-title').focus();
}

const finishDialog = $('#finish-dialog');
$('#finish-session').addEventListener('click', () => {
  finishDialog.returnValue = '';
  finishDialog.showModal();
});
finishDialog.addEventListener('close', () => {
  if (finishDialog.returnValue !== 'finish') return;
  pieces = [];
  views = [];
  Object.assign(master, freshClock());
  $('#cuts').replaceChildren();
  renderSchedule();
  clearTimeout(noticeTimeout);
  $('#notice').textContent = '';
  save();
  openSetup(true);
});

$('#edit-menu').addEventListener('click', () => openSetup(true));
$('#cancel-setup').addEventListener('click', () => showSession(true));
setupForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!draft.length) return;
  void enableAudio();
  if (!pieces.length) $('.plan').open = false;
  const previous = new Map(pieces.map(piece => [piece.id, piece]));
  const now = Date.now();
  pieces = draft.map(({ id, type, profile }) => {
    const existing = previous.get(id);
    if (!existing) return createPiece(type, profile);
    if (existing.profile !== profile) {
      existing.profile = profile;
      existing.cook = profiles[type]?.[profile] ?? presets[type].cook;
      if (elapsed(existing, now) < existing.cook * minute) existing.done = false;
    }
    return existing;
  });
  showSession(true);
  save();
});

if (pieces.length) showSession();
else openSetup();
setInterval(tick, 250);
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
window.addEventListener('pageshow', () => tick());
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Modo sin conexión:', error));
}
