import { allJobs, findJob, listEntries, loadCatalog } from './data.js';
import { createAudioController } from './audio.js';
import { parseRoute, routeForJob, routeSearch } from './router.js';
import { renderGrid, renderJobHeader, renderSidebar } from './render.js';

const elements = {
  brandLink: document.getElementById('brandLink'),
  brandTitle: document.getElementById('brandTitle'),
  logo: document.getElementById('logo'),
  jobLink: document.getElementById('jobLink'),
  volume: document.getElementById('volume'),
  speed: document.getElementById('speed'),
  search: document.getElementById('search'),
  shareJob: document.getElementById('shareJob'),
  installBtn: document.getElementById('installBtn'),
  notice: document.getElementById('notice'),
  sidebar: document.getElementById('sidebar'),
  contentEyebrow: document.getElementById('contentEyebrow'),
  contentTitle: document.getElementById('contentTitle'),
  contentSubtitle: document.getElementById('contentSubtitle'),
  jobLinkButton: document.getElementById('jobLinkButton'),
  grid: document.getElementById('grid'),
  emptyState: document.getElementById('emptyState'),
  emptyTitle: document.getElementById('emptyTitle'),
  emptyText: document.getElementById('emptyText'),
};

const state = {
  catalog: null,
  route: parseRoute(location.search),
  volume: 1,
  speed: 1,
  audio: null,
};

function setNotice(message = '') {
  elements.notice.textContent = message;
}

function currentSelection() {
  if (state.route.kind === 'all') {
    return { mode: 'all', job: null, key: 'all', jobCount: allJobs(state.catalog).length };
  }
  const job = findJob(state.catalog, state.route.key, state.route.kind);
  if (!job) return { mode: 'unknown', job: null, key: state.route.key, jobCount: allJobs(state.catalog).length };
  return { mode: 'selected', job, key: state.route.key, jobCount: allJobs(state.catalog).length };
}

function currentEntries() {
  const selection = currentSelection();
  if (selection.mode === 'unknown') return [];
  return listEntries(state.catalog, selection.job, state.route.query);
}

function updateUrl(route, { replace = false } = {}) {
  state.route = { ...route, query: route.query ?? state.route.query ?? '' };
  const method = replace ? 'replaceState' : 'pushState';
  history[method](null, '', `${location.pathname}${routeSearch(state.route)}`);
  render();
}

function selectRoute(next) {
  const sameSelection = state.route.kind === next.kind && state.route.key === next.key;
  updateUrl({ ...next, query: sameSelection ? state.route.query : '' });
}

function setPlaying(key, playing) {
  const buttons = elements.grid.querySelectorAll('button[data-sound-key]');
  buttons.forEach((button) => {
    const active = playing && button.dataset.soundKey === key;
    button.classList.toggle('playing', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function render() {
  if (!state.catalog) return;
  const selection = currentSelection();
  const entries = currentEntries();
  const branding = state.catalog.branding;
  const selectedJob = selection.job;

  elements.brandTitle.textContent = branding.title || 'KKT Voice Guide';
  elements.logo.alt = branding.title || 'KKT Voice Guide';
  if (branding.logo) elements.logo.src = branding.logo;
  elements.jobLink.textContent = selectedJob ? `กำลังดูงาน ${selectedJob.id}` : 'เลือกงานจากแถบด้านซ้าย';
  elements.search.value = state.route.query;

  renderSidebar(elements.sidebar, {
    jobs: state.catalog.jobs,
    legacyJobs: state.catalog.legacyJobs,
    route: state.route,
    onSelect: selectRoute,
  });
  renderJobHeader({
    eyebrow: elements.contentEyebrow,
    title: elements.contentTitle,
    subtitle: elements.contentSubtitle,
    link: elements.jobLinkButton,
  }, {
    selection,
    route: state.route,
    totalCount: entries.length,
    visibleCount: entries.length,
  });
  renderGrid(elements.grid, entries, { showJobCode: !selectedJob });

  const isEmpty = entries.length === 0;
  elements.emptyState.hidden = !isEmpty;
  if (isEmpty) {
    if (selection.mode === 'unknown') {
      elements.emptyTitle.textContent = `ไม่พบรหัสงาน ${selection.key}`;
      elements.emptyText.textContent = 'เลือกงานที่มีอยู่จากแถบด้านซ้าย หรือตรวจสอบลิงก์งานอีกครั้ง';
    } else if (state.route.query) {
      elements.emptyTitle.textContent = 'ไม่พบเสียงที่ตรงกับคำค้น';
      elements.emptyText.textContent = 'ลองค้นด้วยชื่ออื่น คำอ่าน หรือ alias';
    } else {
      elements.emptyTitle.textContent = 'ยังไม่มีรายการเสียง';
      elements.emptyText.textContent = 'งานนี้ยังไม่มีข้อมูลเสียงที่เผยแพร่';
    }
  }

  document.title = selectedJob ? `${selectedJob.id} · KKT Voice Guide` : 'KKT Voice Guide';
}

function shareUrl() {
  const selection = currentSelection();
  const route = selection.job ? routeForJob(selection.job) : { kind: 'all', key: 'all', query: '' };
  return new URL(`${location.pathname}${routeSearch(route)}`, location.href).href;
}

async function copyCurrentLink() {
  const url = shareUrl();
  try {
    await navigator.clipboard.writeText(url);
    setNotice(`คัดลอกลิงก์ ${currentSelection().job?.id || 'หน้ารวม'} แล้ว`);
  } catch {
    setNotice(`ลิงก์งาน: ${url}`);
  }
}

function findEntry(button) {
  const key = button.dataset.soundKey;
  return currentEntries().find(({ job, sound }) => `${String(job.slug || job.id).toLowerCase()}:${sound.id}` === key);
}

function isTypingTarget(target) {
  return target instanceof HTMLElement && (target.matches('input, textarea, select') || target.isContentEditable);
}

function setupEvents() {
  elements.search.addEventListener('input', (event) => {
    updateUrl({ ...state.route, query: event.target.value }, { replace: true });
  });
  elements.volume.addEventListener('input', (event) => {
    state.volume = Number(event.target.value);
    state.audio?.updateVolume(state.volume);
  });
  elements.speed.addEventListener('input', (event) => {
    state.speed = Number(event.target.value);
    state.audio?.updateSpeed(state.speed);
  });
  elements.shareJob.addEventListener('click', copyCurrentLink);
  elements.jobLinkButton.addEventListener('click', (event) => {
    if (!elements.jobLinkButton.href) return;
    event.preventDefault();
    void copyCurrentLink();
  });
  elements.grid.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-sound-key]');
    if (!button) return;
    const entry = findEntry(button);
    if (!entry) return;
    const key = button.dataset.soundKey;
    const result = await state.audio.playItem(entry.sound, { key });
    if (!result.ok) setPlaying(key, false);
    else setNotice(result.mode === 'file' ? 'กำลังเล่นไฟล์เสียง' : 'กำลังอ่านด้วย TTS');
  });
  window.addEventListener('popstate', () => {
    state.route = parseRoute(location.search);
    render();
  });
  window.addEventListener('keydown', (event) => {
    if (isTypingTarget(event.target)) return;
    if (event.code === 'Space') {
      event.preventDefault();
      state.audio.stopAll();
      setNotice('หยุดเสียงทั้งหมดแล้ว');
      return;
    }
    const number = Number.parseInt(event.key, 10);
    if (number >= 1 && number <= 9) {
      const button = elements.grid.querySelectorAll('button[data-sound-key]')[number - 1];
      if (button) button.click();
    }
  });
}

function setupInstallPrompt() {
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    elements.installBtn.hidden = false;
  });
  elements.installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    elements.installBtn.disabled = true;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      elements.installBtn.hidden = true;
    } finally {
      elements.installBtn.disabled = false;
    }
  });
}

async function init() {
  try {
    state.catalog = await loadCatalog();
    state.audio = createAudioController({
      getVolume: () => state.volume,
      getSpeed: () => state.speed,
      onStateChange: (_item, playing, meta) => setPlaying(meta?.key, playing),
      onNotice: setNotice,
    });
    setupEvents();
    setupInstallPrompt();
    render();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => setNotice('โหมดออฟไลน์ยังไม่พร้อมใช้งาน'));
    }
  } catch (error) {
    elements.contentTitle.textContent = 'โหลดข้อมูลไม่สำเร็จ';
    elements.contentSubtitle.textContent = 'ตรวจสอบการเชื่อมต่อหรือไฟล์ data/jobs.json แล้วลองโหลดหน้าใหม่';
    elements.emptyState.hidden = false;
    elements.emptyTitle.textContent = 'ไม่สามารถเปิด catalog ได้';
    elements.emptyText.textContent = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
    console.error(error);
  }
}

void init();
