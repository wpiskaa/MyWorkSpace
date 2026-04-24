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
function renderEvents() {
  const grid = document.getElementById('scheduleGrid');
  if (!grid) return;
  if (!events.length) {
    grid.innerHTML = '<div class="no-data"><p>Belum ada data event di database.</p></div>';
    return;
  }
  // Tampilkan semua event untuk pengecekan awal, urutkan dari yang terbaru
  const sorted = [...events].sort((a,b)=>b.date.localeCompare(a.date));
  
  grid.innerHTML = sorted.map((e, i) => {
    let day = '??', month = '???';
    try {
      if(e.date) {
        const d = new Date(e.date + 'T00:00:00');
        day = d.getDate();
        month = d.toLocaleDateString('id-ID', {month:'short'}).toUpperCase();
      }
    } catch(err) {}
    return `
    <div class="event-card animate-on-scroll" style="--i:${i}">
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
  const filtered = currentFilter === 'all' ? tasks : tasks.filter(t => t.subdiv === currentFilter);
  if (!filtered.length) {
    board.innerHTML = '<div class="no-data"><p>Tidak ada tugas untuk kategori ini.</p></div>';
    return;
  }
  const STATUS_LABEL = {todo:'To Do',inprogress:'In Progress',done:'Selesai'};
  board.innerHTML = filtered.map((t, i) => {
    const color = SUBDIV_COLORS[t.subdiv] || '#7c3aed';
    const assignees = (t.assignedTo || []).map(mid => {
      const m = members.find(x => x.id === mid);
      const initials = m ? m.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : '?';
      return `<div class="assignee-avatar" title="${m?m.name:''}">${initials}</div>`;
    }).join('');
    const dueLabel = t.dueDate ? new Date(t.dueDate+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : '-';
    return `
    <div class="task-card animate-on-scroll" style="--i:${i}" data-subdiv="${t.subdiv}" onclick="showTaskDetail('${t.id}')">
      <div class="task-header">
        <div class="task-title">${t.title}</div>
        <span class="task-status status-${t.status}">${STATUS_LABEL[t.status]||t.status}</span>
      </div>
      <p class="task-desc">${t.description ? t.description.substring(0,80)+(t.description.length>80?'...':'') : 'Tidak ada deskripsi.'}</p>
      <div class="task-footer">
        <div class="task-subdiv">
          <div class="subdiv-dot" style="background:${color}"></div>
          ${t.subdiv}
        </div>
        <div class="task-due">📅 ${dueLabel}</div>
      </div>
      <div class="task-assignees">${assignees}</div>
    </div>`;
  }).join('');
  observeAnimations();
}

function renderSubdivOverview() {
  const wrap = document.getElementById('subdivOverview');
  if(!wrap) return;
  const subdivs = Object.keys(SUBDIV_COLORS);
  wrap.innerHTML = subdivs.map(s => {
    const subTasks = tasks.filter(t => t.subdiv === s);
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

/* ─── TASK MODAL ─── */
window.showTaskDetail = function(id) {
  const t = tasks.find(x=>x.id===id);
  if(!t) return;
  const STATUS_LABEL = {todo:'To Do',inprogress:'In Progress',done:'Selesai'};
  const color = SUBDIV_COLORS[t.subdiv]||'#7c3aed';
  
  document.getElementById('m-title').textContent = t.title;
  const mSub = document.getElementById('m-subdiv');
  mSub.textContent = t.subdiv;
  mSub.style.background = color + '22';
  mSub.style.color = color;
  
  const mStat = document.getElementById('m-status');
  mStat.textContent = STATUS_LABEL[t.status];
  mStat.className = 'status-badge status-' + t.status;
  
  document.getElementById('m-desc').textContent = t.description || 'Tidak ada deskripsi.';
  document.getElementById('m-due').textContent = t.dueDate || 'Tidak ada deadline.';
  
  // Show related event
  const existingEventSection = document.getElementById('m-event-section');
  if(existingEventSection) existingEventSection.remove();

  const mEvent = document.createElement('div');
  mEvent.id = 'm-event-section';
  mEvent.className = 'modal-section';
  const relatedEvent = events.find(e => e.id === t.eventId);
  mEvent.innerHTML = `<h3>Event Terkait</h3><p>${relatedEvent ? relatedEvent.title : 'Tidak dihubungkan ke event tertentu'}</p>`;
  
  const mBody = document.querySelector('.modal-body');
  // Insert before assignees section
  mBody.insertBefore(mEvent, document.querySelector('.modal-section:last-child'));

  const mAss = document.getElementById('m-assignees');
  mAss.innerHTML = (t.assignedTo||[]).map(mid => {
    const m = members.find(x=>x.id===mid);
    return m ? `<div style="background:var(--bg3);padding:6px 12px;border-radius:20px;font-size:12px;border:1px solid var(--border)">${m.name}</div>` : '';
  }).join('');
  
  document.getElementById('taskModal').classList.add('open');
};

window.closeTaskModal = function() {
  document.getElementById('taskModal').classList.remove('open');
};

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
    return `
    <div class="ann-card animate-on-scroll">
      <div class="ann-icon ${a.priority}">
        ${isHigh
          ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
          : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>`
        }
      </div>
      <div class="ann-content">
        <h3 class="ann-title">${a.title}</h3>
        <p class="ann-text">${a.content}</p>
        <div class="ann-date">📅 ${d}</div>
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
