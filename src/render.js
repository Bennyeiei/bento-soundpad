import { routeForJob, routeSearch } from './router.js';

export function makeElement(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') element.className = value;
    else if (key === 'dataset') Object.entries(value).forEach(([name, data]) => { element.dataset[name] = String(data); });
    else if (key === 'text') element.textContent = value;
    else element.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return element;
}

function jobKind(job) {
  return job.kind === 'legacy' ? 'legacy' : 'job';
}

function jobIsSelected(job, route) {
  if (route.kind === 'all') return false;
  return route.kind === jobKind(job) && route.key === String(job.slug || job.id).toLowerCase();
}

function jobButton(job, route, onSelect) {
  const selected = jobIsSelected(job, route);
  const label = job.kind === 'legacy' ? 'งานเดิม' : 'Voice Guide';
  const button = makeElement('button', {
    class: 'job-choice',
    type: 'button',
    'aria-current': selected ? 'page' : 'false',
    'aria-label': `เปิดงาน ${job.id}`,
    dataset: { jobKind: jobKind(job), jobKey: String(job.slug || job.id).toLowerCase() },
  },
    makeElement('span', { class: 'job-choice-code' }, job.id),
    makeElement('span', { class: 'job-choice-title' }, label),
    job.kind === 'legacy' ? makeElement('span', { class: 'job-choice-badge' }, 'เก่า') : null,
  );
  button.addEventListener('click', () => onSelect({ kind: jobKind(job), key: String(job.slug || job.id).toLowerCase() }));
  return button;
}

export function renderSidebar(container, { jobs, legacyJobs, route, onSelect }) {
  container.replaceChildren();
  const all = makeElement('button', {
    class: 'job-choice job-choice-all',
    type: 'button',
    'aria-current': route.kind === 'all' ? 'page' : 'false',
    'aria-label': 'เปิดเสียงทั้งหมด',
  }, makeElement('span', { class: 'job-choice-code' }, 'ทั้งหมด'));
  all.addEventListener('click', () => onSelect({ kind: 'all', key: 'all' }));
  container.append(all);

  for (const job of jobs) container.append(jobButton(job, route, onSelect));
  if (legacyJobs.length) {
    container.append(makeElement('div', { class: 'sidebar-section-label' }, 'งานเดิม'));
    for (const job of legacyJobs) container.append(jobButton(job, route, onSelect));
  }
}

export function renderJobHeader(elements, { selection, route, totalCount, visibleCount }) {
  const { eyebrow, title, subtitle, link } = elements;
  link.hidden = true;
  link.textContent = '';
  link.removeAttribute('href');

  if (selection.mode === 'unknown') {
    eyebrow.textContent = 'ไม่พบงาน';
    title.textContent = `ไม่พบงาน ${selection.key}`;
    subtitle.textContent = 'รหัสงานนี้ยังไม่มีใน catalog หรือ URL อาจพิมพ์ผิด กรุณาเลือกงานจากแถบด้านซ้าย';
    return;
  }

  if (!selection.job) {
    eyebrow.textContent = 'เสียงทั้งหมด';
    title.textContent = 'เลือกงานเพื่อเริ่มฟัง';
    subtitle.textContent = `${totalCount} รายการจาก ${selection.jobCount} งาน · กดรหัสงานเพื่อสร้างลิงก์ตรง`;
    return;
  }

  const job = selection.job;
  eyebrow.textContent = job.kind === 'legacy' ? 'งานเดิม · อ่านอย่างเดียว' : 'KKT Voice Guide';
  title.textContent = `${job.id} · ${job.title}`;
  subtitle.textContent = `${visibleCount} จาก ${job.sounds.length} รายการ · ${job.source || 'แหล่งข้อมูลยืนยันแล้ว'}`;
  link.hidden = false;
  link.href = routeSearch(routeForJob(job));
  link.textContent = `🔗 ลิงก์งาน ${job.id}`;
}

function safeColor(value, index) {
  const allowed = new Set(['red', 'green', 'blue', 'pink']);
  if (allowed.has(value)) return value;
  return ['blue', 'pink', 'green', 'red'][index % 4];
}

export function renderGrid(container, entries, { showJobCode = true }) {
  container.replaceChildren();
  entries.forEach(({ job, sound }, index) => {
    const key = `${String(job.slug || job.id).toLowerCase()}:${sound.id}`;
    const jobHref = routeSearch(routeForJob(job));
    const button = makeElement('button', {
      class: `pad ${safeColor(sound.color, index)}`,
      type: 'button',
      'aria-label': `เล่นเสียง ${sound.label} จากงาน ${job.id}`,
      'aria-pressed': 'false',
      dataset: { soundKey: key, soundId: sound.id, jobKey: String(job.slug || job.id).toLowerCase() },
    }, makeElement('span', { class: 'play', 'aria-hidden': 'true' }, '▶'));

    const card = makeElement('article', {
      class: 'card',
      role: 'listitem',
      dataset: { soundKey: key },
    },
      makeElement('div', { class: 'card-topline' },
        makeElement('span', { class: 'card-number' }, String(index + 1).padStart(2, '0')),
        makeElement('span', { class: `mode-badge${sound.file ? ' file' : ''}` }, sound.file ? 'FILE' : 'TTS'),
      ),
      button,
      makeElement('h3', {}, sound.label || 'ไม่มีชื่อ'),
      makeElement('div', { class: 'meta' }, sound.note || (sound.file ? 'ไฟล์เสียงจริง' : 'กดเพื่อฟังคำอ่าน')),
      showJobCode ? makeElement('a', { class: 'card-job-link', href: jobHref }, `งาน ${job.id}`) : null,
    );
    container.append(card);
  });
}
