import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, collection, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ─── FIREBASE CONFIG ─── */
const firebaseConfig = {
  apiKey: "AIzaSyDGnmUH1gxYKqhNEyjacmhXO5JnfbK_xD0",
  authDomain: "peoplepleasuredahsyat.firebaseapp.com",
  projectId: "peoplepleasuredahsyat",
  storageBucket: "peoplepleasuredahsyat.firebasestorage.app",
  messagingSenderId: "1013787661296",
  appId: "1:1013787661296:web:d86ea3ee22eae70f230335",
  measurementId: "G-YERNWESJD5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ─── CONSTANTS ─── */
const SUBDIV_COLORS = {
  'fotografer':'#f59e0b',
  'videografer':'#3b82f6',
  'desainer grafis':'#a855f7',
  'content creator':'#ec4899',
  'editor':'#10b981'
};

/* ─── STATE ─── */
let members = [];
let events = [];
let tasks = [];
let announcements = [];
let notes = [];

/* ─── INITIALIZATION ─── */
function init() {
  initRealtime();
  setupNavbar();
  setupHeroTyping();
  setupParticles();
}

function initRealtime() {
  onSnapshot(collection(db, "members"), snap => {
    members = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderTeam();
    updateStats();
  });
  onSnapshot(collection(db, "events"), snap => {
    events = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderEvents();
    updateStats();
  });
  onSnapshot(collection(db, "tasks"), snap => {
    tasks = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderTasks();
    renderSubdivOverview();
    updateStats();
  });
  onSnapshot(collection(db, "announcements"), snap => {
    announcements = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderAnnouncements();
  });
  onSnapshot(collection(db, "notes"), snap => {
    notes = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderNotes();
  });
  
  // Settings Listener
  onSnapshot(collection(db, "settings"), snap => {
    const s = snap.docs.find(d => d.id === 'piska');
    if(s) {
      const data = s.data();
      const pPhoto = document.getElementById('userProfilePhoto');
      const pStatus = document.getElementById('userStatusText');
      if(pPhoto && data.photoURL) pPhoto.src = data.photoURL;
      if(pStatus && data.status) pStatus.textContent = data.status;
    }
  });
}

/* ─── UI COMPONENTS ─── */
function setupNavbar() {
  const nav = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });

  const burger = document.querySelector('.nav-hamburger');
  const mobile = document.querySelector('.nav-mobile');
  if(burger) {
    burger.addEventListener('click', () => mobile.classList.toggle('open'));
  }
}

function setupHeroTyping() {
  const text = document.querySelector('.gradient-text');
  if(!text) return;
  const words = ['Kreatif.','Inovatif.','Profesional.','Satu Visi.'];
  let i=0, j=0, current='', isDeleting=false;
  
  function type() {
    const full = words[i % words.length];
    if(isDeleting) current = full.substring(0, j--);
    else current = full.substring(0, j++);
    text.textContent = current;
    
    let speed = isDeleting ? 100 : 200;
    if(!isDeleting && current === full) { speed = 2000; isDeleting = true; }
    else if(isDeleting && current === '') { isDeleting = false; i++; speed = 500; }
    setTimeout(type, speed);
  }
  type();
}

function updateStats() {
  const today = new Date().toISOString().slice(0,10);
  const upCount = events.filter(e => e.date >= today).length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const activeCount = tasks.filter(t => t.status !== 'done').length;
  
  const elUp = document.getElementById('statEvents');
  const elDone = document.getElementById('statDone');
  const elMem = document.getElementById('statMembers');
  const elActive = document.getElementById('statActive');
  
  if(elUp) elUp.textContent = upCount;
  if(elDone) elDone.textContent = doneCount;
  if(elMem) elMem.textContent = members.length;
  if(elActive) elActive.textContent = activeCount;
}

/* ─── RENDER EVENTS ─── */
let currentEventFilter = 'all';
window.filterEvents = function(filter, btn) {
  currentEventFilter = filter;
  document.querySelectorAll('#eventFilter .filter-btn').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderEvents();
};

function renderEvents() {
  const grid = document.getElementById('scheduleGrid');
  if (!grid) return;
  
  const today = new Date().toISOString().slice(0,10);
  let filtered = [...events];
  
  if(currentEventFilter === 'upcoming') filtered = events.filter(e => e.date > today);
  else if(currentEventFilter === 'today') filtered = events.filter(e => e.date === today);
  else if(currentEventFilter === 'past') filtered = events.filter(e => e.date < today);

  if (!filtered.length) {
    grid.innerHTML = `<div class="no-data"><p>Tidak ada event untuk kategori "${currentEventFilter}".</p></div>`;
    return;
  }
  
  const sorted = filtered.sort((a,b)=>b.date.localeCompare(a.date));
  
  grid.innerHTML = sorted.map((e, i) => {
    let day = '??', month = '???';
    try {
      if(e.date) {
        const d = new Date(e.date + 'T00:00:00');
        day = d.getDate();
        month = d.toLocaleDateString('id-ID', {month:'short'}).toUpperCase();
      }
    } catch(err) {}

    const eventTasks = tasks.filter(t => t.eventId === e.id);
    let plottingHtml = '';
    
    if(eventTasks.length > 0) {
      plottingHtml = `<div class="event-plotting">
        <div class="plotting-title">Tugas & Crew:</div>
        <div class="plotting-list">
          ${eventTasks.map(t => {
            const assignedNames = (t.assignedTo || []).map(id => {
              const m = members.find(x => x.id === id);
              return m ? m.name : 'Unknown';
            }).slice(0, 3).join(', ') + (t.assignedTo?.length > 3 ? '...' : '');
            const sub = (t.subdivs || (t.subdiv ? [t.subdiv] : [])).join(' & ');
            return `<div class="plotting-item">
              <span class="p-sub" style="color:${SUBDIV_COLORS[t.subdivs?.[0]] || '#7c3aed'}">${sub}:</span> 
              <span class="p-names">${assignedNames || 'Belum diplot'}</span>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }

    return `
    <div class="event-card animate-on-scroll" style="--i:${i}" onclick="showEventDetail('${e.id}')">
      <div class="event-date-badge">
        <div class="event-day">${day}</div>
        <div class="event-month">${month}</div>
      </div>
      <span class="event-type">${e.type || 'EVENT'}</span>
      <h3 class="event-title">${e.title}</h3>
      <div class="event-meta">
        <div class="event-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${e.time || 'Waktu Belum Ditentukan'}
        </div>
        <div class="event-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${e.location || 'Lokasi TBA'}
        </div>
      </div>
      ${plottingHtml}
    </div>`;
  }).join('');
  observeAnimations();
}

/* ─── RENDER TASKS ─── */
let currentFilter = 'all';
window.filterTasks = function(subdiv, btn) {
  currentFilter = subdiv;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderTasks();
};

function renderTasks() {
  const board = document.getElementById('tasksBoard');
  if (!board) return;
  const filtered = currentFilter === 'all' 
    ? tasks 
    : tasks.filter(t => (t.subdivs || (t.subdiv ? [t.subdiv] : [])).includes(currentFilter));
  
  if (!filtered.length) {
    board.innerHTML = '<div class="no-data"><p>Tidak ada tugas untuk kategori ini.</p></div>';
    return;
  }
  const STATUS_LABEL = {todo:'To Do',inprogress:'In Progress',done:'Selesai'};
  board.innerHTML = filtered.map((t, i) => {
    const tSubdivs = t.subdivs || (t.subdiv ? [t.subdiv] : []);
    const subdivBadges = tSubdivs.map(s => {
      const color = SUBDIV_COLORS[s] || '#7c3aed';
      return `<div class="task-subdiv" style="margin-bottom:4px">
        <div class="subdiv-dot" style="background:${color}"></div>
        ${s}
      </div>`;
    }).join('');

    // Check for linked event
    let eventContext = '';
    if(t.eventId) {
      const ev = events.find(e => e.id === t.eventId);
      if(ev) {
        eventContext = `<div class="task-event-link">📍 ${ev.title}</div>`;
      }
    }

    // Assignees summary
    const filteredIds = (t.assignedTo || []).filter(id => {
      if(currentFilter === 'all') return true;
      const m = members.find(x => x.id === id);
      if(!m) return false;
      const r = m.roles || (m.role ? [m.role] : []);
      return r.includes(currentFilter);
    });

    const assignedNames = filteredIds.map(id => {
      const m = members.find(x => x.id === id);
      return m ? m.name : 'Unknown';
    }).join(', ');

    return `
    <div class="task-card animate-on-scroll" style="--i:${i}" onclick="showTaskDetail('${t.id}')">
      <div class="task-header">
        <div class="task-title">${t.title}</div>
        <span class="task-status status-${t.status}">${STATUS_LABEL[t.status]||t.status}</span>
      </div>
      ${eventContext}
      <p class="task-desc">${t.description ? t.description.substring(0,80)+(t.description.length>80?'...':'') : 'Tidak ada deskripsi.'}</p>
      <div class="task-footer" style="flex-direction:column; align-items:flex-start; gap:8px;">
        <div style="display:flex; flex-wrap:wrap; gap:8px;">${subdivBadges}</div>
        <div class="task-due">📅 ${t.dueDate || 'No Deadline'}</div>
      </div>
      <div class="task-assignees" style="font-size:11px; color:var(--text3); border-top:1px solid rgba(255,255,255,0.05); padding-top:8px; width:100%;">
        👥 ${assignedNames || 'Belum ditugaskan'}
      </div>
    </div>`;
  }).join('');
  observeAnimations();
}

function renderSubdivOverview() {
  const wrap = document.getElementById('subdivOverview');
  if(!wrap) return;
  const subdivs = Object.keys(SUBDIV_COLORS);
  wrap.innerHTML = subdivs.map(s => {
    const subTasks = tasks.filter(t => (t.subdivs || (t.subdiv ? [t.subdiv] : [])).includes(s));
    const done = subTasks.filter(t => t.status === 'done').length;
    const prog = subTasks.length ? Math.round((done/subTasks.length)*100) : 0;
    const color = SUBDIV_COLORS[s];
    return `
    <div class="subdiv-card ${currentFilter===s?'active':''}" onclick="filterTasks('${s}', this)">
      <div class="subdiv-name">${s.charAt(0).toUpperCase()+s.slice(1)}</div>
      <div class="subdiv-count">${subTasks.length} Tugas</div>
      <div class="subdiv-progress"><div class="subdiv-progress-fill" style="width:${prog}%; background:${color}"></div></div>
    </div>`;
  }).join('');
}

/* ─── TASK & EVENT MODALS ─── */
window.showTaskDetail = function(id) {
  const t = tasks.find(x=>x.id===id);
  if(!t) return;
  const STATUS_LABEL = {todo:'To Do',inprogress:'In Progress',done:'Selesai'};
  
  document.getElementById('m-title').textContent = t.title;
  document.getElementById('m-header-extra').innerHTML = '';
  
  // Reset visibility
  document.getElementById('m-meta-wrap').style.display = 'flex';
  document.getElementById('m-event-section').style.display = 'block';
  document.getElementById('m-plotting-list').style.display = 'none';
  document.getElementById('m-assignees-section').style.display = 'block';

  const mSub = document.getElementById('m-subdiv');
  const tSubdivs = t.subdivs || (t.subdiv ? [t.subdiv] : []);
  mSub.innerHTML = tSubdivs.map(s => {
    const color = SUBDIV_COLORS[s] || '#7c3aed';
    return `<span style="background:${color}22; color:${color}; padding:4px 12px; border-radius:99px; font-size:11px; font-weight:700; margin-right:6px;">${s}</span>`;
  }).join('');
  
  const mStat = document.getElementById('m-status');
  mStat.textContent = STATUS_LABEL[t.status];
  mStat.className = `status-badge status-${t.status}`;
  
  document.getElementById('m-desc').textContent = t.description || 'Tidak ada deskripsi.';
  document.getElementById('m-date-label').textContent = 'Deadline';
  document.getElementById('m-due').textContent = t.dueDate || 'Belum ditentukan';
  
  // Event Context
  const evSection = document.getElementById('m-event-section');
  if(t.eventId) {
    const ev = events.find(e => e.id === t.eventId);
    document.getElementById('m-event').textContent = ev ? ev.title : 'Event tidak ditemukan';
    evSection.style.display = 'block';
  } else {
    evSection.style.display = 'none';
  }
  
  // Assignees
  const filteredIds = (t.assignedTo || []).filter(id => {
    if(currentFilter === 'all') return true;
    const m = members.find(x => x.id === id);
    if(!m) return false;
    const r = m.roles || (m.role ? [m.role] : []);
    return r.includes(currentFilter);
  });

  const mAss = document.getElementById('m-assignees');
  mAss.innerHTML = filteredIds.map(uid => {
    const m = members.find(x => x.id === uid);
    if(!m) return '';
    return `<div class="member-chip" style="background:rgba(255,255,255,0.05); border:1px solid var(--border); padding:6px 12px; border-radius:10px; font-size:12px;">${m.name}</div>`;
  }).join('');
  
  document.getElementById('m-plotting-list').style.display = 'none';
  document.getElementById('m-meta-wrap').style.display = 'flex';
  
  document.getElementById('taskModal').classList.add('open');
};

window.showEventDetail = function(id) {
  const e = events.find(x=>x.id===id);
  if(!e) return;
  window.currentViewedEventId = id;
  
  document.getElementById('m-title').textContent = e.title;
  document.getElementById('m-header-extra').innerHTML = `<div style="font-size:14px; color:var(--text2); display:flex; justify-content:center; gap:20px; margin-bottom:15px;">
    <span><span style="color:var(--purple-l)">📅</span> ${e.date}</span>
    <span><span style="color:var(--pink-l)">📍</span> ${e.location || 'TBA'}</span>
  </div>`;
  
  document.getElementById('m-desc').textContent = e.description || 'Tidak ada deskripsi event.';
  document.getElementById('m-date-label').textContent = 'Pelaksanaan';
  document.getElementById('m-due').textContent = `${e.date} (${e.time || 'Waktu TBA'})`;
  
  // Reset visibility
  document.getElementById('m-meta-wrap').style.display = 'none';
  document.getElementById('m-event-section').style.display = 'none';
  document.getElementById('m-assignees-section').style.display = 'none';
  
  const eventTasks = tasks.filter(t => t.eventId === e.id);
  const plotList = document.getElementById('m-plotting-list');
  const plotItems = document.getElementById('m-plotting-items');
  
  if(eventTasks.length > 0) {
    plotList.style.display = 'block';
    plotItems.innerHTML = eventTasks.map(t => {
      const filteredIds = (t.assignedTo || []).filter(id => {
        if(currentFilter === 'all') return true;
        const m = members.find(x => x.id === id);
        if(!m) return false;
        const r = m.roles || (m.role ? [m.role] : []);
        return r.includes(currentFilter);
      });

      const assignedNames = filteredIds.map(uid => {
        const m = members.find(x => x.id === uid);
        return m ? m.name : 'Unknown';
      }).join(', ');
      
      const tSubdivs = t.subdivs || (t.subdiv ? [t.subdiv] : []);
      const badges = tSubdivs.map(s => {
        const color = SUBDIV_COLORS[s] || '#7c3aed';
        return `<span style="color:${color}; font-weight:800; font-size:11px; text-transform:uppercase; margin-right:8px;">${s}</span>`;
      }).join('');

      return `<div style="background:rgba(255,255,255,0.02); border:1px solid var(--border); padding:15px; border-radius:14px; margin-bottom:10px;">
        <div style="margin-bottom:8px;">${badges} <span class="status-badge status-${t.status}" style="font-size:10px; padding:2px 8px;">${t.status}</span></div>
        <div style="font-weight:700; margin-bottom:4px;">${t.title}</div>
        <div style="font-size:13px; color:var(--text2);">👥 ${assignedNames || 'Belum diplot'}</div>
      </div>`;
    }).join('');
  } else {
    plotList.style.display = 'block';
    plotItems.innerHTML = '<p style="color:var(--text3); font-size:14px;">Belum ada tugas yang diinput untuk event ini.</p>';
  }
  
  document.getElementById('m-assignees').innerHTML = '';
  document.getElementById('taskModal').classList.add('open');
};

window.closeTaskModal = function() {
  const modal = document.getElementById('taskModal');
  const content = modal.querySelector('.modal-content');
  modal.classList.remove('open');
  // Reset SS mode if active
  if(content.classList.contains('ss-mode')) {
    content.classList.remove('ss-mode');
    modal.style.background = 'rgba(5,5,15,0.85)';
  }
};

// Click overlay to close
document.getElementById('taskModal').addEventListener('click', function(e) {
  if(e.target === this) closeTaskModal();
});

/* ─── RENDER TEAM ─── */
function renderTeam() {
  const grid = document.getElementById('teamGrid');
  if (!grid) return;
  if (!members.length) return;
  grid.innerHTML = members.map((m, i) => {
    const initials = m.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
    const mRoles = m.roles || (m.role ? [m.role] : []);
    const roleBadges = mRoles.map(r => {
      return `<div class="member-role role-${r.split(' ')[0]}">${r}</div>`;
    }).join('');
    return `
    <div class="member-card animate-on-scroll" style="--i:${i}">
      <div class="member-avatar">${initials}</div>
      <div class="member-name">${m.name}</div>
      <div style="display:flex; flex-wrap:wrap; gap:4px; justify-content:center;">${roleBadges}</div>
    </div>`;
  }).join('');
  observeAnimations();
}

/* ─── RENDER ANNOUNCEMENTS ─── */
function renderAnnouncements() {
  const list = document.getElementById('annList');
  if (!list) return;
  if (!announcements.length) return;
  const sorted = [...announcements].sort((a,b)=>b.date.localeCompare(a.date));
  list.innerHTML = sorted.map(a => {
    const isHigh = a.priority==='high';
    const d = new Date(a.date+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
    const timeInfo = a.time ? `<span style="margin-left:12px;">🕒 ${a.time}</span>` : '';
    const locInfo = a.location ? `<div class="ann-loc" style="font-size:12px; color:var(--text3); margin-top:4px;">📍 ${a.location}</div>` : '';
    
    return `
    <div class="ann-card animate-on-scroll" onclick="showAnnDetail('${a.id}')">
      <div class="ann-icon ${a.priority}">
        ${isHigh
          ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
          : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>`
        }
      </div>
      <div class="ann-content">
        <h3 class="ann-title">${a.title}</h3>
        <p class="ann-text">${a.content.substring(0,100)}${a.content.length>100?'...':''}</p>
        <div class="ann-date">📅 ${d} ${timeInfo}</div>
        ${locInfo}
      </div>
      <span class="priority-badge priority-${a.priority}">${isHigh?'Penting':'Info'}</span>
    </div>`;
  }).join('');
  observeAnimations();
}

/* ─── RENDER NOTES ─── */
function renderNotes() {
  const grid = document.getElementById('notesList');
  if (!grid) return;
  if (!notes.length) return;
  const sorted = [...notes].sort((a,b)=>b.date.localeCompare(a.date));
  grid.innerHTML = sorted.map(n => {
    const d = new Date(n.date+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
    return `
    <div class="event-card animate-on-scroll" style="--accent:var(--purple)">
      <span class="event-type">${n.topic || 'NOTULENSI'}</span>
      <h3 class="event-title">${n.title}</h3>
      <p style="font-size:14px; color:var(--text2); line-height:1.6; margin-bottom:12px;">${n.content}</p>
      <div class="event-meta">
        <div class="event-meta-item">📅 ${d}</div>
      </div>
    </div>`;
  }).join('');
  observeAnimations();
}

/* ─── ANIMATIONS ─── */
function observeAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

/* ─── PARTICLES ─── */
function setupParticles() {
  const canvas = document.getElementById('particleCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();
  
  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.v = Math.random() * 0.5 + 0.2;
      this.s = Math.random() * 1.5 + 0.5;
      this.a = Math.random() * 0.5;
    }
    update() { this.y -= this.v; if(this.y < 0) this.reset(); }
    draw() {
      ctx.fillStyle = `rgba(124, 58, 237, ${this.a})`;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.s, 0, Math.PI*2); ctx.fill();
    }
  }
  for(let i=0; i<50; i++) particles.push(new Particle());
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
}

// Start app
init();


/* ─── SS MODE LOGIC ─── */
window.toggleSSMode = function() {
  const modal = document.querySelector('.modal-content');
  const overlay = document.getElementById('taskModal');
  const body = document.querySelector('.modal-body');
  if(!modal || !overlay) return;
  
  if (modal.classList.contains('ss-mode')) {
    modal.classList.remove('ss-mode');
    overlay.style.background = 'rgba(5,5,15,0.85)';
  } else {
    modal.classList.add('ss-mode');
    overlay.style.background = '#000'; // Solid black for contrast
    body.scrollTop = 0;
  }
};
window.showAnnDetail = function(id) {
  const a = announcements.find(x=>x.id===id);
  if(!a) return;
  
  const d = new Date(a.date+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
  const titleEl = document.getElementById('m-title');
  const extraEl = document.getElementById('m-header-extra');
  const descEl = document.getElementById('m-desc');
  const dateLabelEl = document.getElementById('m-date-label');
  const dueEl = document.getElementById('m-due');
  const modal = document.getElementById('taskModal');

  if(titleEl) titleEl.textContent = a.title;
  if(extraEl) extraEl.innerHTML = `<div style="font-size:14px; color:var(--text2); display:flex; justify-content:center; flex-wrap:wrap; gap:15px; margin-bottom:15px;">
    <span><span style="color:var(--purple-l)">📅</span> ${d}</span>
    ${a.time ? `<span><span style="color:var(--cyan-l)">🕒</span> ${a.time}</span>` : ''}
    ${a.location ? `<span><span style="color:var(--pink-l)">📍</span> ${a.location}</span>` : ''}
  </div>`;
  
  if(descEl) descEl.textContent = a.content;
  if(dateLabelEl) dateLabelEl.textContent = 'Informasi Tanggal';
  if(dueEl) dueEl.textContent = d + (a.time ? ' pukul ' + a.time : '');
  
  // Reset visibility
  const metaWrap = document.getElementById('m-meta-wrap');
  const eventSec = document.getElementById('m-event-section');
  const plotList = document.getElementById('m-plotting-list');
  const assSec = document.getElementById('m-assignees-section');

  if(metaWrap) metaWrap.style.display = 'none';
  if(eventSec) eventSec.style.display = 'none';
  if(plotList) plotList.style.display = 'none';
  if(assSec) assSec.style.display = 'none';
  
  if(modal) modal.classList.add('open');
};
