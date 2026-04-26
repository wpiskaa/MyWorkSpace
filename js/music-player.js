/* ─── PISKA MUSIC PLAYER ENGINE (STANDALONE) ─── */
const M_SRC = 'piska_m_src';
const M_TIME = 'piska_m_time';
const M_PLAYING = 'piska_m_playing';
const M_TITLE = 'piska_m_title';
const M_ARTIST = 'piska_m_artist';
const M_COVER = 'piska_m_cover';

function formatTime(s) {
  if(isNaN(s) || s === Infinity) return "0:00";
  const m = Math.floor(s/60);
  const rs = Math.floor(s%60);
  return `${m}:${rs < 10 ? '0' : ''}${rs}`;
}

window.playMusic = function(src, title, artist, cover, forcePlay = true, shouldOpen = true) {
  const player = document.getElementById('musicPlayer');
  const audio = document.getElementById('mainAudio');
  if(!player || !audio) return;

  const pTrack = document.getElementById('pTrack'), pArtist = document.getElementById('pArtist'), pArt = document.getElementById('pArt');
  if(pTrack) pTrack.textContent = title;
  if(pArtist) pArtist.textContent = artist;
  if(pArt) pArt.src = cover;
  
  const currentFullSrc = audio.src ? new URL(audio.src).href : '';
  const newFullSrc = new URL(src, window.location.href).href;
  if (currentFullSrc !== newFullSrc) { audio.src = src; audio.load(); }
  
  const toggle = document.getElementById('playerToggle');
  if (shouldOpen) {
    player.classList.add('open');
    if(toggle) toggle.style.display = 'none';
  } else {
    player.classList.remove('open');
    if(toggle) {
      toggle.style.display = 'flex';
      toggle.style.transform = 'scale(1)';
    }
  }

  if (forcePlay) audio.play().catch(e => console.warn("Playback blocked:", e));

  localStorage.setItem(M_SRC, src);
  localStorage.setItem(M_TITLE, title);
  localStorage.setItem(M_ARTIST, artist);
  localStorage.setItem(M_COVER, cover);

  audio.ontimeupdate = () => {
    const prog = (audio.currentTime / audio.duration) * 100;
    const fill = document.getElementById('pFill');
    if(fill) fill.style.width = prog + '%';
    const curEl = document.getElementById('pCurrent'), durEl = document.getElementById('pDuration');
    if(curEl) curEl.textContent = formatTime(audio.currentTime);
    if(durEl) durEl.textContent = formatTime(audio.duration);
  };
  audio.onplay = () => {
    localStorage.setItem(M_PLAYING, 'true');
    const pi = document.getElementById('playIcon'), pa = document.getElementById('pauseIcon');
    if(pi) pi.style.display = 'none'; if(pa) pa.style.display = 'block';
  };
  audio.onpause = () => {
    localStorage.setItem(M_PLAYING, 'false');
    const pi = document.getElementById('playIcon'), pa = document.getElementById('pauseIcon');
    if(pi) pi.style.display = 'block'; if(pa) pa.style.display = 'none';
  };
};

window.togglePlay = function() {
  const audio = document.getElementById('mainAudio');
  if(audio) audio.paused ? audio.play() : audio.pause();
};

window.seekAudio = function(e) {
  const audio = document.getElementById('mainAudio');
  if(!audio) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const pos = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pos * audio.duration;
};

window.toggleWidget = function() {
  const p = document.getElementById('musicPlayer'), t = document.getElementById('playerToggle');
  if(!p) return;
  if(p.classList.contains('open')) {
    p.classList.remove('open');
    if(t) { t.style.display='flex'; t.style.transform='scale(0)'; setTimeout(()=>t.style.transform='scale(1)',10); }
  } else { p.classList.add('open'); if(t) t.style.display='none'; }
};

window.hidePlayer = function() {
  const p = document.getElementById('musicPlayer'), t = document.getElementById('playerToggle'), a = document.getElementById('mainAudio');
  if(p) p.classList.remove('open'); if(t) t.style.display='none'; if(a) a.pause();
  localStorage.setItem(M_PLAYING, 'false');
};

window.setVolume = function(val) {
  const audio = document.getElementById('mainAudio');
  if (audio) {
    audio.volume = parseFloat(val);
    localStorage.setItem('piska_m_volume', val);
  }
};

function initPersistentMusic() {
  const audio = document.getElementById('mainAudio');
  if (!audio) return;
  const src = localStorage.getItem(M_SRC);
  if (src) {
    const isPlaying = localStorage.getItem(M_PLAYING) === 'true';
    window.playMusic(
      src, 
      localStorage.getItem(M_TITLE), 
      localStorage.getItem(M_ARTIST), 
      localStorage.getItem(M_COVER), 
      false, 
      false // User requested it to be hidden initially
    );
    audio.currentTime = parseFloat(localStorage.getItem(M_TIME) || 0);
    const vol = localStorage.getItem('piska_m_volume');
    if (vol !== null) {
      audio.volume = parseFloat(vol);
      const vSlider = document.getElementById('pVolume');
      if (vSlider) vSlider.value = vol;
    }
    if (isPlaying) {
      audio.play().catch(() => localStorage.setItem(M_PLAYING, 'false'));
    }
  }
  setInterval(() => { if (audio && !audio.paused) localStorage.setItem(M_TIME, audio.currentTime); }, 1000);
}

document.addEventListener('DOMContentLoaded', initPersistentMusic);
