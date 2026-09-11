# KKT Voice Guide Soundpad Redesign Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** เปลี่ยน `Bennyeiei/bento-soundpad` ให้เป็นเว็บ KKT Voice Guide ที่เปิดด้วยลิงก์เฉพาะงาน กดฟัง TTS ได้ทันที และรองรับการแทนที่ด้วยไฟล์เสียงจริงภายหลัง โดยไม่ทำลายงานเก่าใน repo

**Architecture:** ใช้ static/PWA แบบไม่ต้องมี backend เพื่อให้ลิงก์ใช้งานง่ายบน GitHub Pages โดยเปลี่ยนจากข้อมูลรวมแบบ `categories` เป็นข้อมูลแบบ `jobs` ที่มีรหัสงานเป็น canonical key เช่น `KKT10` URL หลักจะเป็น `?job=KKT10` และสามารถ fallback จาก TTS (`speechSynthesis`) ไปเป็นไฟล์เสียงจริง (`file`) ได้โดยไม่เปลี่ยนลิงก์เดิม

**Tech Stack:** HTML/CSS/Vanilla JavaScript, JSON data, Web Speech API, HTML Audio, GitHub Pages, GitHub Actions สำหรับ validation, Node.js built-in test/validation เท่าที่จำเป็น

---

## หลักการและขอบเขต

### สิ่งที่ยืนยันจาก repo ปัจจุบัน

- `index.html` เป็นหน้าเว็บหลักที่รวม CSS/JS ไว้ในไฟล์เดียว
- `sounds.json` มีงานเก่า `kkm15` และ `kkm17`
- ไฟล์เสียงอยู่ใต้ `audio/<รหัสงาน>/...`
- มี URL query สำหรับหมวดเดิม เช่น `?cat=kkm17`
- ปุ่ม `แชร์หมวดนี้` ทำงานบนเว็บจริงแล้ว
- GitHub Pages deploy จาก branch `main` ที่ root และสถานะปัจจุบันเป็น `built`
- ไม่มี README/runtime contract/test suite ที่ชัดเจน

### กฎห้ามพลาด

- ห้ามเดาว่า `kkm15` หรือ `kkm17` คือ KKT งานใดงานหนึ่ง เพราะ KKT/KKM เป็นรหัสคนละระบบ
- งานเก่าต้องเก็บเป็น legacy/archive และคง provenance เดิมไว้ก่อน ห้ามลบหรือ rename แบบตีความเอง
- Source of truth ของคำอ่านคือ Voice Guide Master ไม่ใช่ local cache ของ Sheet และไม่ใช่ชื่อไฟล์อย่างเดียว
- KKT10 ต้องเริ่มจากข้อมูลที่ยืนยันแล้วเท่านั้น ถ้ามี `มิสต์คลับ` อยู่เฉพาะ local cache ต้องเพิ่ม/ยืนยันใน Master ก่อน export
- Repo/Pages เป็น public: ห้ามใส่ข้อมูลลูกค้าลับ, token, private URL หรือข้อมูลปฏิบัติการลงใน data ที่ deploy
- TTS browser เป็น fallback ที่ทุกคนกดได้ แต่เสียงและคุณภาพขึ้นกับเบราว์เซอร์/ระบบปฏิบัติการ
- Real MP3 จะมี priority สูงกว่า TTS แต่ไม่บังคับให้มี MP3 ในระยะเริ่มต้น

---

## เป้าหมาย UX รุ่นใหม่

ลิงก์ของงาน:

```text
https://bennyeiei.github.io/bento-soundpad/?job=KKT10
```

เมื่อเปิดลิงก์:

- เปิดอยู่ในงาน KKT10 ทันที
- แสดงรหัสงาน/ชื่อเรื่อง/สถานะอย่างชัดเจน
- ถ้าเป็นลิงก์แบบงาน ให้ซ่อนงานอื่นหรือไม่แสดงเป็นจุดสนใจหลัก
- เห็นรายการคำค้นและคำอ่านเป็น card/button
- กด `▶ ฟัง` แล้วใช้ TTS ได้ทันที ไม่ต้อง login และไม่ต้องเปิด Google Sheet
- ถ้ามี MP3 ให้แสดง badge `FILE` และเล่นไฟล์จริง
- ถ้าไม่มี MP3 ให้แสดง badge `TTS`
- ค้นหาชื่อ, คำอ่าน, alias ได้
- ปรับความเร็วและระดับเสียงได้
- รองรับ keyboard, mobile, reduced motion และ screen reader
- ปุ่มแชร์คัดลอกลิงก์ของงานปัจจุบัน ไม่ใช่ลิงก์รวมทั้งหมด

ภาพลักษณ์ที่แนะนำ: **KKT Midnight Gold Vault** — พื้น navy/black, card สีน้ำเงินเข้ม, accent สีทองสำหรับ action และสถานะสำคัญ, typography อ่านง่าย ไม่ใช้เอฟเฟกต์มากจนรบกวนการกดฟัง

---

## Data contract รุ่นใหม่

### ไฟล์หลัก

- Create: `data/jobs.json`
- Keep temporarily: `sounds.json` เป็น legacy compatibility data ระหว่าง migration
- Create: `data/schema.md` อธิบาย field และกฎตั้งชื่อ
- Create: `scripts/validate-data.mjs` ตรวจ JSON, IDs, asset paths และ URL contract

ตัวอย่างโครงสร้าง:

```json
{
  "version": 2,
  "branding": {
    "title": "KKT Voice Guide",
    "theme": "midnight-gold-vault"
  },
  "jobs": [
    {
      "id": "KKT10",
      "slug": "kkt10",
      "title": "KKT10",
      "status": "active",
      "source": "Voice Guide Master",
      "sounds": [
        {
          "id": "ฉินอวี่ชวน",
          "label": "ฉินอวี่ชวน",
          "pronunciation": "ฉิน อวี่ ชวน",
          "aliases": [],
          "type": "tts",
          "tts": { "lang": "th-TH", "rate": 0.85 },
          "file": null,
          "note": ""
        }
      ]
    }
  ]
}
```

กฎ field:

- `id` ของงานใช้รหัส canonical ตัวพิมพ์ใหญ่ เช่น `KKT10`
- `slug` ใช้สำหรับ URL และต้อง unique เช่น `kkt10`
- `sound.id` ต้อง unique ภายในงาน
- `pronunciation` เป็นข้อความที่ TTS พูด ห้ามแก้บทต้นฉบับใน Sheet
- `aliases` เป็นรูปแบบชื่อที่ใช้ค้นหา ไม่ใช่การสร้างเสียงซ้ำ
- `type` เป็น `tts` หรือ `file`
- ถ้า `file` มีค่า ให้เล่นไฟล์จริงก่อน TTS
- ถ้าไฟล์โหลดไม่ได้ ให้ fallback ไป `pronunciation`
- ห้ามใส่ Audio File ID ของ Google Drive ลงใน public JSON หากยังไม่ได้ออกแบบสิทธิ์ public อย่างชัดเจน

---

## URL และ backward compatibility

### URL ใหม่

```text
?job=kkt10
```

พฤติกรรม:

- normalize รหัส/slug เป็น lowercase สำหรับ lookup
- แสดงเฉพาะ job ที่เลือกในโหมด share
- ถ้าไม่พบ job ให้แสดงหน้า error ที่อ่านง่าย พร้อมลิงก์กลับหน้าเลือกงาน
- ปุ่มแชร์สร้าง URL ของ job ปัจจุบัน โดยไม่เอา search query ติดไปโดยไม่จำเป็น

### URL เดิม

```text
?cat=kkm15
?cat=kkm17
```

ให้รองรับอย่างน้อยในช่วง migration โดย map ไปยัง legacy job ที่ชื่อเดิม ห้ามเปลี่ยนเป็น KKT โดยอัตโนมัติ

---

# Implementation Tasks

## Task 1: สร้าง legacy snapshot ก่อนแก้โค้ด

**Objective:** เก็บ baseline ของ repo เดิมและทำ rollback boundary

**Files:**
- Create: `docs/legacy/2025-10-21-pre-kkt-redesign.md`
- Create: `docs/legacy/sounds-v1.json` (สำเนาข้อมูลเดิมพร้อม provenance)

**Steps:**

1. บันทึก commit ปัจจุบันของ `main` เป็น baseline
2. เก็บ `index.html`, `sounds.json`, `sw.js`, `manifest.webmanifest` และรายการไฟล์ `audio/` เป็นหลักฐาน
3. ระบุชัดว่างาน `kkm15`, `kkm17` เป็น legacy ที่ยังไม่ถูก remap
4. ตรวจ `git diff` ต้องว่างก่อนเริ่ม branch redesign

**Verification:** เปิดไฟล์ legacy แล้วเทียบกับ `git show` ของ baseline; ต้องไม่มีไฟล์เสียงเก่าหาย

---

## Task 2: แยก branch สำหรับ KKT redesign

**Objective:** ทำงานแยกจาก `main` และไม่ทำลายเว็บเก่า

**Branch:**

```text
redesign/kkt-voice-guide
```

**Steps:**

1. สร้าง branch จาก `main`
2. ไม่แก้ Pages setting และไม่ลบ workflow เดิมใน task นี้
3. เพิ่ม `README.md` ที่บอก entrypoint, URL, data source, public-data boundary และ rollback
4. เพิ่ม `.gitignore` สำหรับ local preview/temp files

**Verification:** `git status --short --branch` ต้องแสดง branch ใหม่และไม่มี unexpected changes

---

## Task 3: เพิ่ม data contract และ KKT10 seed data

**Objective:** สร้างข้อมูล job รุ่นใหม่จาก Master โดยไม่ใช้ข้อมูล legacy เป็น source of truth

**Files:**
- Create: `data/jobs.json`
- Create: `data/schema.md`
- Create: `data/legacy-map.json`

**Steps:**

1. อ่าน Voice Guide Master แท็บ `Guide` แบบ read-only
2. ใช้คำที่ยืนยันใน Master เป็น KKT10 seed
3. ตรวจว่า `มิสต์คลับ` อยู่ใน Master แล้วก่อนใส่ ถ้ายังไม่อยู่ให้แยกเป็น `needs_review` ไม่ export เป็นเสียงหลัก
4. ตั้ง `type: "tts"` และ `file: null` ในระยะเริ่มต้น
5. เก็บ `legacy-map.json` เป็น mapping ที่ว่างหรือ explicit เท่านั้น ห้าม map `kkm15/kkm17 -> KKT10` เอง

**Verification:** รัน `node scripts/validate-data.mjs`; ต้องผ่าน unique ID, required fields, valid job slug และไม่มี path ที่หลุดออกจาก `audio/`

---

## Task 4: แยก frontend ออกจาก monolithic index

**Objective:** ทำให้ redesign ได้โดยไม่ต้องแก้ทุกอย่างใน `index.html` ไฟล์เดียว

**Files:**
- Modify: `index.html`
- Create: `src/app.js`
- Create: `src/data.js`
- Create: `src/audio.js`
- Create: `src/router.js`
- Create: `src/render.js`

**Design:**

- `router.js` อ่าน `job`, `q`, และโหมด share
- `data.js` โหลด `data/jobs.json` และ normalize legacy `sounds.json` ชั่วคราว
- `audio.js` มี `playFile()` และ `speakTts()` ที่คืนสถานะสำเร็จ/ล้มเหลว
- `render.js` สร้าง DOM ด้วย `textContent`/DOM API หลีกเลี่ยง HTML injection
- `app.js` เชื่อม event, search, share, keyboard และ lifecycle

**Verification:** เปิดหน้า default, `?job=kkt10`, และ `?job=unknown`; ทั้งสามกรณีต้อง render อย่างตั้งใจและไม่เกิด uncaught error

---

## Task 5: ทำ KKT visual system

**Objective:** เปลี่ยนหน้าตาเป็นธีม KKT โดยยังอ่านง่ายและกดฟังได้เร็ว

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/layout.css`
- Create: `src/styles/components.css`
- Modify: `index.html`

**Tokens ที่ต้องมี:**

- `--kkt-bg`: midnight navy/black
- `--kkt-surface`: card navy
- `--kkt-gold`: action/highlight
- `--kkt-text`: main text
- `--kkt-muted`: secondary text
- `--kkt-focus`: keyboard focus ring
- spacing, radius, shadow และ motion duration

**UX constraints:**

- ห้ามใช้สีทองกับข้อความขนาดเล็กที่ contrast ไม่ผ่าน
- ทุกปุ่มต้องมี visible focus
- `prefers-reduced-motion` ต้องลด/ปิด animation
- mobile ต้องกด card ได้ง่าย ไม่ต้อง hover
- badge `TTS`/`FILE` ต้องไม่พึ่งสีอย่างเดียว

**Verification:** ตรวจ desktop/mobile viewport, keyboard Tab/Enter/Space และ contrast ของข้อความ/ปุ่ม

---

## Task 6: ทำ job-focused share mode

**Objective:** ให้ลิงก์แต่ละงานเปิดมาแล้วใช้งานได้ทันที

**Files:**
- Modify: `src/router.js`
- Modify: `src/render.js`
- Modify: `src/styles/layout.css`

**Behavior:**

- `?job=kkt10` เปิด KKT10 โดยอัตโนมัติ
- แสดง job header และปุ่ม `คัดลอกลิงก์งานนี้`
- ไม่แสดงรายการงานอื่นเป็น default ใน shared view
- มีทางกลับหน้าเลือกงานสำหรับผู้ดูแล/เจ้าของลิงก์
- query search สามารถใช้ร่วมกับ job ได้ เช่น `?job=kkt10&q=ฉิน`

**Verification:** คลิกลิงก์จากหน้าใหม่/Incognito แล้วเห็นเฉพาะข้อมูล public ของ KKT10 และปุ่มแชร์คัดลอก URL ที่ถูกต้อง

---

## Task 7: ทำ TTS และ real-audio fallback

**Objective:** กดฟังได้โดยไม่มี MP3 และรองรับ MP3 ภายหลัง

**Files:**
- Create: `src/audio.js`
- Modify: `src/render.js`
- Create: `tests/audio-contract.test.mjs`

**Behavior:**

1. ถ้า item มี `file` ให้สร้าง `Audio`, ตั้ง volume/rate และเล่น
2. ถ้า `Audio.play()` reject หรือไฟล์โหลดไม่ได้ ให้พูด `pronunciation`
3. ถ้า item เป็น TTS ให้สร้าง `SpeechSynthesisUtterance`, ตั้ง `lang = th-TH`, rate เริ่มต้น `0.85`
4. ทุกครั้งที่เล่นใหม่ให้หยุดเสียงเดิมตามโหมด Solo
5. ปุ่มต้องแสดงสถานะกำลังเล่น/ผิดพลาดที่อ่านได้
6. ไม่ autoplay เมื่อเปิดลิงก์ครั้งแรก

**Verification:**

- ทดสอบ TTS item จาก click จริงใน Chrome
- ทดสอบ file item ด้วย fixture เสียงสั้น
- ทดสอบ file 404 แล้วต้อง fallback TTS ไม่ค้างและไม่ throw uncaught error
- ทดสอบ Space หยุดเสียงและปรับ speed/volume

ข้อจำกัดที่ต้องรายงาน: automated/headless test พิสูจน์ได้เฉพาะ audio decision path; เสียงภาษาไทยจริงต้องตรวจด้วย browser ที่มี `speechSynthesis`

---

## Task 8: เพิ่ม search, alias และ keyboard UX

**Objective:** ค้นคำอ่านได้เร็วในงานที่มีหลายรายการ

**Files:**
- Modify: `src/data.js`
- Modify: `src/render.js`
- Modify: `src/app.js`
- Create: `tests/search.test.mjs`

**Behavior:**

- search จาก `label`, `pronunciation`, และ `aliases`
- normalize whitespace/เครื่องหมายที่ไม่สำคัญแบบไม่แก้ source
- keyboard `1–9` เล่นรายการที่เห็นเฉพาะเมื่อ search/filter อยู่ในบริบทเดียวกัน
- `Space` หยุดเสียง
- ปุ่มทุกตัวมี `aria-label` ชัดเจน

**Verification:** รัน test search/alias และทดสอบจาก browser ด้วยชุดคำภาษาไทยจริง

---

## Task 9: จัดการ legacy jobs โดยไม่ตีความรหัส

**Objective:** นำงานเก่ามาอยู่ในระบบใหม่โดยไม่ทำให้ประวัติหรือรหัสผิด

**Files:**
- Create: `data/legacy-jobs.json`
- Create: `docs/legacy-migration.md`
- Modify: `src/data.js`

**Steps:**

1. ย้าย metadata ของ `kkm15`, `kkm17` ไป namespace legacy/archive โดยยังคงรหัสเดิม
2. คง path ไฟล์เสียงเดิมไว้ก่อน เช่น `audio/kkm15/`, `audio/kkm17/`
3. ทำ legacy view หรือ route read-only ให้ลิงก์เก่ายังเปิดได้
4. ห้ามเปลี่ยน `KKM` เป็น `KKT` จนกว่าจะมี mapping ที่ผู้ใช้ยืนยัน
5. การลบ/ย้ายไฟล์จริงต้องเป็น task แยก มี manifest และ read-back

**Verification:** URL เก่า `?cat=kkm17` ยังเปิดได้ หรือแสดงหน้า legacy migration ที่มีลิงก์ไปยังข้อมูลเดิม โดยไม่มีเสียงเก่าหาย

---

## Task 10: เพิ่ม data/asset validation และ CI

**Objective:** ป้องกัน deploy ที่มี JSON ผิด, ลิงก์เสียงเสีย หรือ job ซ้ำ

**Files:**
- Create: `scripts/validate-data.mjs`
- Create: `scripts/check-assets.mjs`
- Create: `.github/workflows/validate.yml`
- Modify/remove only after verification: `.github/workflows/jekyll-docker.yml`

**Checks:**

- JSON parse
- unique job slug/sound ID
- required fields
- `file` path อยู่ใต้ `audio/` และไม่มี `..`
- asset ที่อ้างอิงมีอยู่จริง
- no secrets/private URLs
- legacy URL compatibility fixture

**Verification commands:**

```bash
node scripts/validate-data.mjs
node scripts/check-assets.mjs
```

Expected: exit code 0 และรายงานจำนวน job/sound/file ที่ตรวจ โดยไม่พิมพ์ข้อมูลลับ

หมายเหตุ: workflow Jekyll เดิมใช้ `jekyll/builder:latest` ทั้งที่เว็บเป็น static; อย่าเพิ่งลบจนกว่าจะตรวจว่า GitHub Pages setting ไม่ได้พึ่ง workflow นี้ ให้เปลี่ยนเป็น static validation ก่อนเมื่อ preview ผ่านแล้ว

---

## Task 11: สร้าง preview และ browser smoke test

**Objective:** ตรวจ UX จริงก่อน merge/push main

**Files:**
- Create: `docs/preview-checklist.md`
- Create: `tests/fixtures/`

**Test matrix:**

- `/` หน้าเลือกงาน
- `/?job=kkt10` หน้า job-focused
- `/?job=kkt10&q=ฉิน` search
- `/?job=unknown` error/fallback
- legacy `/?cat=kkm17`
- TTS click
- file playback fixture
- failed file fallback
- share button
- mobile width
- keyboard-only
- reduced motion
- reload/service worker cache

**Verification:** ใช้ browser เปิด URL จริงบน GitHub Pages preview/branch ที่ deploy แล้ว ตรวจ console ไม่มี uncaught errors และกดปุ่ม TTS ได้จริง

---

## Task 12: Migration rollout และเปิดใช้งาน

**Objective:** เปิด KKT redesign แบบย้อนกลับได้

**Steps:**

1. เปิด Pull Request จาก `redesign/kkt-voice-guide`
2. ตรวจ CI และ browser preview
3. ให้ผู้ใช้ approve visual/wording/data ของ KKT10
4. merge เข้า `main`
5. รอ GitHub Pages build แล้วตรวจ URL production
6. ส่งลิงก์งาน KKT10 ให้ทีมทดลอง
7. เก็บ URL เดิมและ legacy route ไว้จนกว่าจะยืนยันว่าไม่มีผู้ใช้งานเก่าเหลือ
8. ค่อยทำงานรอบถัดไปสำหรับ KKT งานอื่น โดยเพิ่ม job ผ่าน data contract ไม่ copy/paste หน้าใหม่

**Rollback:** revert merge commit หรือชี้ Pages กลับไป baseline branch/commit โดยไม่ลบ `audio/` และไม่แก้ข้อมูล Voice Guide Master

---

# Acceptance Criteria

ถือว่า redesign รุ่นแรกผ่านเมื่อ:

- เปิดลิงก์ `?job=kkt10` ได้โดยไม่ต้อง login
- เห็นเฉพาะ KKT10 ใน shared mode
- กดคำอ่าน TTS ภาษาไทยได้จาก Chrome/เบราว์เซอร์ที่รองรับ
- ไม่มี MP3 ก็ใช้งานได้
- หากมี MP3 ภายหลัง ระบบเลือกไฟล์จริงก่อน TTS
- Search ชื่อ/คำอ่าน/Alias ทำงาน
- ลิงก์ legacy ของ `kkm15`/`kkm17` ไม่ถูกตีความเป็น KKT และไม่ทำให้ไฟล์เก่าหาย
- mobile/keyboard/a11y/reduced-motion ผ่าน checklist
- CI ตรวจ JSON และ assets ผ่าน
- GitHub Pages production URL ตรวจแล้ว ไม่มี console error สำคัญ
- ไม่มี Google login, Apps Script authorization หรือ backend dependency สำหรับผู้กดฟัง

# Decisions ที่ควรยึดเป็นค่าเริ่มต้น

1. ใช้ **hybrid TTS-first**: ทำปุ่ม TTS ก่อน แล้วเติม MP3 ใน data ภายหลัง
2. ใช้ URL ใหม่ `?job=kkt10` และรองรับ `?cat=...` เป็น legacy compatibility
3. ใช้ vanilla static architecture ต่อไป ไม่เพิ่ม React/Vite จนกว่าจะมี requirement ที่จำเป็น
4. แยก `KKT`, `KKM`, `KKN` ตามรหัสจริง ห้าม rename จากความคล้ายของชื่อ
5. เก็บงานเก่าและไฟล์เก่าไว้ก่อน ไม่ลบจนกว่าจะมี migration manifest และผู้ใช้ยืนยัน
6. ให้ KKT10 เป็น pilot แรก แล้วค่อยทำ importer/exporter จาก Voice Guide Master สำหรับงานถัดไป
7. ไม่ใส่ข้อมูลลับใน public GitHub Pages; ถ้าต้องการ private link ต้องเปลี่ยน hosting/auth architecture แยกต่างหาก
