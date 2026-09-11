export function getTtsText(item) {
  return String(item?.pronunciation || item?.label || '').trim();
}

export function getPlaybackKind(item, fileUsable = true) {
  return item?.file && fileUsable ? 'file' : 'tts';
}

export function scaledTtsRate(item, speed = 1) {
  const base = Number(item?.tts?.rate) || 0.85;
  const multiplier = Number(speed) || 1;
  return Math.min(10, Math.max(0.1, base * multiplier));
}

function clampVolume(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(1, Math.max(0, numeric)) : 1;
}

export function createAudioController({
  getVolume = () => 1,
  getSpeed = () => 1,
  onStateChange = () => {},
  onNotice = () => {},
} = {}) {
  let generation = 0;
  let current = null;

  function safeState(item, playing, meta) {
    try {
      onStateChange(item, playing, meta);
    } catch {
      // Rendering a status indicator must never break playback.
    }
  }

  function finish(token) {
    if (!current || token !== generation) return;
    const previous = current;
    current = null;
    safeState(previous.item, false, previous.meta);
  }

  function stopAll() {
    generation += 1;
    const previous = current;
    current = null;
    if (previous?.audio) {
      try {
        previous.audio.pause();
        previous.audio.currentTime = 0;
      } catch {
        // Ignore cleanup errors from a detached media element.
      }
    }
    if ('speechSynthesis' in globalThis) {
      try {
        globalThis.speechSynthesis.cancel();
      } catch {
        // Some WebViews expose speechSynthesis but reject cancel().
      }
    }
    if (previous) safeState(previous.item, false, previous.meta);
  }

  function speak(item, meta, token) {
    const text = getTtsText(item);
    const Utterance = globalThis.SpeechSynthesisUtterance;
    const synth = globalThis.speechSynthesis;
    if (!text || typeof Utterance !== 'function' || !synth || typeof synth.speak !== 'function') {
      if (token === generation) {
        onNotice('เบราว์เซอร์นี้ยังไม่รองรับการอ่านออกเสียง');
        finish(token);
      }
      return Promise.resolve({ ok: false, mode: 'tts-unavailable' });
    }

    try {
      const utterance = new Utterance(text);
      utterance.lang = item?.tts?.lang || 'th-TH';
      utterance.rate = scaledTtsRate(item, getSpeed());
      utterance.volume = clampVolume(getVolume());
      utterance.onend = () => finish(token);
      utterance.onerror = (event) => {
        if (token !== generation) return;
        onNotice(`TTS เล่นไม่สำเร็จ${event?.error ? `: ${event.error}` : ''}`);
        finish(token);
      };
      if (current && token === generation) {
        current.mode = 'tts';
        current.utterance = utterance;
      }
      synth.speak(utterance);
      return Promise.resolve({ ok: true, mode: 'tts' });
    } catch (error) {
      if (token === generation) {
        onNotice('เกิดข้อผิดพลาดขณะเริ่ม TTS');
        finish(token);
      }
      return Promise.resolve({ ok: false, mode: 'tts-error', error });
    }
  }

  async function playItem(item, meta = {}) {
    stopAll();
    const token = generation;
    current = { item, meta, audio: null, utterance: null, mode: null };
    safeState(item, true, meta);

    if (!item?.file) {
      return speak(item, meta, token);
    }

    const audio = new Audio(item.file);
    audio.preload = 'auto';
    audio.volume = clampVolume(getVolume());
    audio.playbackRate = Math.max(0.25, Number(getSpeed()) || 1);
    current.audio = audio;
    current.mode = 'file';

    let fallbackStarted = false;
    const fallbackToTts = async () => {
      if (fallbackStarted || token !== generation) return { ok: false, mode: 'stale' };
      fallbackStarted = true;
      try {
        audio.pause();
      } catch {
        // Ignore a failed media element during fallback.
      }
      if (current) current.audio = null;
      onNotice('ไฟล์เสียงไม่พร้อม กำลังใช้ TTS แทน');
      return speak(item, meta, token);
    };

    audio.addEventListener('ended', () => finish(token), { once: true });
    audio.addEventListener('error', () => { void fallbackToTts(); }, { once: true });

    try {
      await audio.play();
      return { ok: true, mode: 'file' };
    } catch (error) {
      const result = await fallbackToTts();
      return { ...result, fallbackFrom: 'file', error };
    }
  }

  function updateVolume(volume) {
    const normalized = clampVolume(volume);
    if (current?.audio) current.audio.volume = normalized;
    if (current?.utterance) current.utterance.volume = normalized;
  }

  function updateSpeed(speed) {
    if (current?.audio) current.audio.playbackRate = Math.max(0.25, Number(speed) || 1);
  }

  return { playItem, stopAll, updateVolume, updateSpeed };
}
