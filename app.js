'use strict';
const $ = id => document.getElementById(id);
const storage = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
};
const storedFavorites = storage.get('kkt-voice-favorites', []);
const state = {
  categories: [], category: 'kkt', query: '', favoritesOnly: false,
  favorites: new Set(Array.isArray(storedFavorites) ? storedFavorites.filter(v => typeof v === 'string') : []),
  visible: [], current: null, loading: true, error: false, toastTimer: null
};
const audio = $('audio');
const params = new URLSearchParams(location.search);
state.category = params.get('cat') || 'kkt';
state.query = params.get('q') || '';
$('search').value = state.query;
audio.volume = Math.max(0, Math.min(1, Number(storage.get('kkt-voice-volume', 1)) || 0));
const savedSpeed = String(storage.get('kkt-voice-speed', 1));
if (Array.from($('speed').options).some(option => option.value === savedSpeed)) $('speed').value = savedSpeed;
audio.playbackRate = Number($('speed').value);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function toast(message) {
  clearTimeout(state.toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  state.toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4500);
}
function normalize(value) { return String(value || '').normalize('NFC').toLocaleLowerCase('th').trim(); }
function soundKey(sound) { return sound.id || sound.file; }
function updateUrl() {
  const url = new URL(location.href);
  url.searchParams.set('cat', state.category);
  if (state.query.trim()) url.searchParams.set('q', state.query.trim()); else url.searchParams.delete('q');
  history.replaceState(null, '', url.pathname + url.search);
}
function validateCatalogue(data) {
  if (!data || !Array.isArray(data.categories)) throw new Error('catalogue_invalid');
  const ids = new Set();
  return data.categories.filter(cat => /^kkt(?:\d.*|[-_].*)?$/i.test(String(cat.id || ''))).map(cat => {
    if (ids.has(cat.id) || !Array.isArray(cat.sounds)) throw new Error('category_invalid');
    ids.add(cat.id);
    return {
      id: String(cat.id), name: String(cat.name || cat.id),
      sounds: cat.sounds.map(sound => {
        if (!sound || typeof sound.name !== 'string' || typeof sound.file !== 'string' || !sound.name.trim()) throw new Error('sound_invalid');
        const url = new URL(sound.file, location.href);
        if (!['http:', 'https:'].includes(url.protocol) || (url.origin !== location.origin && url.protocol !== 'https:')) throw new Error('audio_url_invalid');
        return {
          ...sound, name: sound.name.trim(), _url: url.href,
          aliases: Array.isArray(sound.aliases) ? sound.aliases.map(String) : typeof sound.aliases === 'string' ? sound.aliases.split(/[,;|]/) : [],
          _cat: { id: String(cat.id), name: String(cat.name || cat.id) }
        };
      })
    };
  });
}
async function loadCatalogue() {
  state.loading = true; state.error = false;
  $('retry').disabled = true;
  $('load-error').hidden = true;
  $('empty').hidden = true;
  $('sound-grid').replaceChildren();
  $('result-count').textContent = 'กำลังโหลดคลังเสียง…';
  try {
    const response = await fetch('sounds.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('catalogue_unavailable');
    state.categories = validateCatalogue(await response.json());
    if (!state.categories.length) state.categories = [{ id: 'kkt', name: 'KKT', sounds: [] }];
    if (!state.categories.some(cat => cat.id === state.category)) state.category = state.categories[0].id;
    $('total-count').textContent = String(state.categories.reduce((n, cat) => n + cat.sounds.length, 0));
    updateUrl();
  } catch (_) {
    state.error = true;
    $('load-error-text').textContent = 'โหลดคลังเสียงไม่สำเร็จ กรุณาตรวจการเชื่อมต่อแล้วลองใหม่';
    $('load-error').hidden = false;
    $('total-count').textContent = '—';
  } finally {
    state.loading = false;
    $('retry').disabled = false;
    render();
  }
}
function renderCategories() {
  $('categories').replaceChildren();
  for (const cat of state.categories) {
    const button = el('button', 'category', cat.name);
    button.type = 'button';
    button.setAttribute('aria-current', String(state.category === cat.id));
    button.append(el('small', '', String(cat.sounds.length)));
    button.addEventListener('click', () => { state.category = cat.id; updateUrl(); render(); });
    $('categories').append(button);
  }
}
function updatePlaying() {
  for (const card of $('sound-grid').children) {
    const active = Boolean(state.current && card.dataset.key === soundKey(state.current) && !audio.paused);
    card.dataset.playing = String(active);
    const button = card.querySelector('.play-btn');
    button.setAttribute('aria-pressed', String(active));
    button.firstChild.textContent = active ? 'Ⅱ หยุดชั่วคราว' : '▶ ฟังเสียง';
  }
}
async function playSound(sound) {
  if (state.current && soundKey(state.current) === soundKey(sound) && !audio.paused) {
    audio.pause();
    return;
  }
  if (!state.current || soundKey(state.current) !== soundKey(sound)) {
    audio.pause();
    audio.src = sound._url;
    state.current = sound;
    $('playing-name').textContent = sound.name;
    $('playing-meta').textContent = 'ไกด์ออกเสียง · ' + sound._cat.name;
  } else if (audio.ended) audio.currentTime = 0;
  audio.playbackRate = Number($('speed').value);
  try { await audio.play(); } catch (error) {
    if (error.name !== 'AbortError') toast('เล่นเสียงไม่สำเร็จ กรุณาลองอีกครั้งหรือตรวจไฟล์เสียง');
  }
  updatePlaying();
}
function render() {
  renderCategories();
  $('favorites').setAttribute('aria-pressed', String(state.favoritesOnly));
  $('favorites').firstElementChild.textContent = state.favoritesOnly ? '♥' : '♡';
  if (state.error) {
    state.visible = [];
    $('result-count').textContent = 'ยังอ่านรายการเสียงไม่ได้';
    $('sound-grid').replaceChildren();
    $('empty').hidden = true;
    return;
  }
  const cat = state.categories.find(item => item.id === state.category);
  const query = normalize(state.query);
  state.visible = (cat ? cat.sounds : []).filter(sound => {
    const text = [sound.name, sound.note || '', ...sound.aliases].map(normalize).join(' ');
    return (!query || text.includes(query)) && (!state.favoritesOnly || state.favorites.has(soundKey(sound)));
  });
  if ($('sort').value === 'name') state.visible.sort((a, b) => a.name.localeCompare(b.name, 'th'));
  $('result-count').textContent = state.visible.length + ' เสียง' + (cat ? ' · ' + cat.name : '');
  const grid = $('sound-grid');
  grid.replaceChildren();
  state.visible.forEach((sound, index) => {
    const card = el('article', 'sound-card');
    card.setAttribute('role', 'listitem');
    card.dataset.key = soundKey(sound);
    const top = el('div', 'card-top');
    top.append(el('span', 'sound-tag', sound._cat.name));
    const saved = state.favorites.has(soundKey(sound));
    const save = el('button', 'save-sound', saved ? '♥' : '♡');
    save.type = 'button';
    save.setAttribute('aria-pressed', String(saved));
    save.setAttribute('aria-label', (saved ? 'เอาออกจากคำที่เก็บไว้: ' : 'เก็บไว้ฟัง: ') + sound.name);
    save.addEventListener('click', () => {
      if (state.favorites.has(soundKey(sound))) state.favorites.delete(soundKey(sound)); else state.favorites.add(soundKey(sound));
      storage.set('kkt-voice-favorites', Array.from(state.favorites));
      const focusIndex = Array.from(grid.children).indexOf(card);
      render();
      const nextCard = grid.children[Math.min(focusIndex, grid.children.length - 1)];
      if (nextCard) nextCard.querySelector('.save-sound').focus(); else $('favorites').focus();
    });
    top.append(save);
    const play = el('button', 'play-btn');
    play.type = 'button';
    play.setAttribute('aria-label', 'ฟังเสียง ' + sound.name);
    play.append(el('span', '', '▶ ฟังเสียง'));
    if (index < 9) play.append(el('kbd', '', String(index + 1)));
    play.addEventListener('click', () => playSound(sound));
    card.append(top, el('h3', '', sound.name), el('p', 'sound-note', sound.note || sound.aliases.join(' · ')), play);
    grid.append(card);
  });
  $('empty').hidden = state.visible.length > 0 || state.loading;
  const filtered = Boolean(query || state.favoritesOnly);
  $('clear-filters').hidden = !filtered;
  $('empty-title').textContent = query ? 'ไม่พบคำที่ค้นหา' : state.favoritesOnly ? 'ยังไม่มีคำที่เก็บไว้ในหมวดนี้' : 'คลัง KKT พร้อมเริ่มต้นแล้ว';
  $('empty-description').textContent = query ? 'ลองค้นหาด้วยชื่ออื่น หรือล้างตัวกรองเพื่อดูรายการทั้งหมด' :
    state.favoritesOnly ? 'กดหัวใจข้างเสียงที่ต้องใช้บ่อย แล้วกลับมาฟังได้จากที่นี่' :
    'ยังไม่มีเสียงไกด์ในหมวดนี้ เมื่อเพิ่มเสียงแล้ว ค้นหาและกดฟังได้จากที่นี่';
  updatePlaying();
}
$('search').addEventListener('input', event => { state.query = event.target.value; updateUrl(); render(); });
$('sort').addEventListener('change', render);
$('favorites').addEventListener('click', () => { state.favoritesOnly = !state.favoritesOnly; render(); });
$('clear-filters').addEventListener('click', () => {
  state.query = ''; state.favoritesOnly = false; $('search').value = ''; updateUrl(); render(); $('search').focus();
});
$('speed').addEventListener('change', () => {
  audio.playbackRate = Number($('speed').value); storage.set('kkt-voice-speed', audio.playbackRate);
});
audio.addEventListener('volumechange', () => storage.set('kkt-voice-volume', audio.volume));
for (const name of ['play', 'pause', 'ended']) audio.addEventListener(name, updatePlaying);
audio.addEventListener('error', () => { if (state.current) toast('อ่านไฟล์เสียงไม่ได้ กรุณาตรวจไฟล์แล้วลองอีกครั้ง'); updatePlaying(); });
function effectiveDark() {
  return document.documentElement.dataset.theme === 'dark' ||
    (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
}
function updateThemeLabel() {
  $('theme').setAttribute('aria-label', effectiveDark() ? 'ใช้ธีมสว่าง' : 'ใช้ธีมมืด');
  $('theme').title = $('theme').getAttribute('aria-label');
  document.querySelector('meta[name="theme-color"]').content = effectiveDark() ? '#0b1220' : '#eef2f8';
}
$('theme').addEventListener('click', () => {
  const theme = effectiveDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('kkt-voice-theme', theme); } catch (_) {}
  updateThemeLabel();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeLabel);
updateThemeLabel();
$('share').addEventListener('click', async () => {
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('cat', state.category);
  if (state.query.trim()) url.searchParams.set('q', state.query.trim());
  try { await navigator.clipboard.writeText(url.href); toast('คัดลอกลิงก์หมวดนี้แล้ว'); }
  catch (_) { $('share-fallback').hidden = false; $('share-url').value = url.href; $('share-url').focus(); $('share-url').select(); toast('เลือกลิงก์ด้านล่างเพื่อคัดลอกได้เลย'); }
});
$('retry').addEventListener('click', loadCatalogue);
document.addEventListener('keydown', event => {
  const target = event.target;
  if (event.ctrlKey || event.metaKey || event.altKey || target.isContentEditable ||
    target.closest('input,textarea,select,button,a,audio,[role="button"]')) return;
  if (event.key === '/') { event.preventDefault(); $('search').focus(); }
  else if (event.code === 'Space') { event.preventDefault(); audio.pause(); if (state.current && audio.readyState) audio.currentTime = 0; }
  else if (/^[1-9]$/.test(event.key)) { const sound = state.visible[Number(event.key) - 1]; if (sound) { event.preventDefault(); playSound(sound); } }
});
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
loadCatalogue();
