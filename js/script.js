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
  setupScrollObserver();
  setupQuoteRotator();
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
  const nav = document.getElementById('navbar');
  if(!nav) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });

  const burger = document.getElementById('navHamburger');
  const mobile = document.getElementById('navMobile');
  if(burger && mobile) {
    burger.addEventListener('click', () => {
      mobile.classList.toggle('open');
      burger.classList.toggle('active');
    });
    mobile.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobile.classList.remove('open');
        burger.classList.remove('active');
      });
    });
  }
}

function setupScrollObserver() {
  const options = { threshold: 0.5 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        document.querySelectorAll('.nav-link').forEach(link => {
          const href = link.getAttribute('href');
          if(href === `#${id}`) link.classList.add('active');
          else if(href && href.startsWith('#')) link.classList.remove('active');
        });
      }
    });
  }, options);

  document.querySelectorAll('section[id]').forEach(section => observer.observe(section));
}

function setupHeroTyping() {
  const text = document.getElementById('typingText');
  if(!text) return;
  
  // Custom words for Personal vs Portal
  const isPortal = window.location.pathname.includes('portal.html');
  const words = isPortal 
    ? ['Kreatif.', 'Inovatif.', 'Profesional.', 'Satu Visi.']
    : ['Piska Space.', 'Creative Hub.', 'Digital World.', 'My Reality.'];
    
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

function setupQuoteRotator() {
  const qEl = document.getElementById('piskaQuote');
  if(!qEl) return;
  const quotes = [
    "\"The best way to predict the future is to create it.\"",
    "\"Design is not just what it looks like, design is how it works.\"",
    "\"Simplicity is the ultimate sophistication.\"",
    "\"Stay hungry, stay foolish.\""
  ];
  let qIdx = 0;
  setInterval(() => {
    qEl.style.opacity = '0';
    setTimeout(() => {
      qIdx = (qIdx + 1) % quotes.length;
      qEl.textContent = quotes[qIdx];
      qEl.style.opacity = '1';
    }, 500);
  }, 6000);
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
        day = d.getDate(); month = d.toLocaleDateString('id-ID', {month:'short'}).toUpperCase();
      }
    } catch(err) {}
    const eventTasks = tasks.filter(t => t.eventId === e.id);
    let plottingHtml = '';
    if(eventTasks.length > 0) {
      plottingHtml = `<div class="event-plotting"><div class="plotting-title">Tugas & Crew:</div><div class="plotting-list">
          ${eventTasks.map(t => {
            const names = (t.assignedTo || []).map(id => { const m = members.find(x => x.id === id); return m ? m.name : 'Unknown'; }).slice(0, 3).join(', ');
            const tSubdivs = t.subdivs || (t.subdiv ? [t.subdiv] : []);
            return `<div class="plotting-item"><span class="p-sub" style="color:${SUBDIV_COLORS[tSubdivs[0]] || '#7c3aed'}">${tSubdivs.join(' & ')}:</span> <span class="p-names">${names || 'Belum diplot'}</span></div>`;
          }).join('')}
        </div></div>`;
    }
    return `<div class="event-card animate-on-scroll" style="--i:${i}" onclick="showEventDetail('${e.id}')">
      <div class="event-date-badge"><div class="event-day">${day}</div><div class="event-month">${month}</div></div>
      <span class="event-type">${e.type || 'EVENT'}</span><h3 class="event-title">${e.title}</h3>
      <div class="event-meta">
        <div class="event-meta-item">🕒 ${e.time || 'TBA'}</div>
        <div class="event-meta-item">📍 ${e.location || 'TBA'}</div>
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
  const fWrap = document.getElementById('tasksFilter');
  if(fWrap) {
    fWrap.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.remove('active');
      b.style.borderColor = '';
      b.style.background = '';
      b.style.color = '';
    });
  }
  if(btn) {
    btn.classList.add('active');
    const color = SUBDIV_COLORS[subdiv] || '#7c3aed';
    if(subdiv !== 'all') {
      btn.style.borderColor = color + '66';
      btn.style.background = color + '1a';
      btn.style.color = color;
    }
  }
  renderTasks();
  renderSubdivOverview(); // Sync the cards above
};

function renderTasks() {
  const board = document.getElementById('tasksBoard');
  if (!board) return;
  const filtered = currentFilter === 'all' ? tasks : tasks.filter(t => (t.subdivs || (t.subdiv ? [t.subdiv] : [])).includes(currentFilter));
  if (!filtered.length) { board.innerHTML = '<div class="no-data"><p>Tidak ada tugas.</p></div>'; return; }
  const STATUS_LABEL = {todo:'To Do',inprogress:'In Progress',done:'Selesai'};
  board.innerHTML = filtered.map((t, i) => {
    const tSubdivs = t.subdivs || (t.subdiv ? [t.subdiv] : []);
    const badges = tSubdivs.map(s => `<div class="task-subdiv"><div class="subdiv-dot" style="background:${SUBDIV_COLORS[s] || '#7c3aed'}"></div>${s}</div>`).join('');
    const names = (t.assignedTo || []).map(id => { const m = members.find(x => x.id === id); return m ? m.name : 'Unknown'; }).join(', ');
    return `<div class="task-card animate-on-scroll" style="--i:${i}" onclick="showTaskDetail('${t.id}')">
      <div class="task-header"><div class="task-title">${t.title}</div><span class="task-status status-${t.status}">${STATUS_LABEL[t.status]||t.status}</span></div>
      <p class="task-desc">${t.description ? t.description.substring(0,80)+'...' : 'No description.'}</p>
      <div class="task-footer" style="flex-direction:column; align-items:flex-start; gap:8px;">
        <div style="display:flex; flex-wrap:wrap; gap:8px;">${badges}</div>
        <div class="task-due" style="font-size:12px; color:var(--text3);">📅 ${t.dueDate || 'No Deadline'}</div>
      </div>
      <div class="task-assignees" style="font-size:11px; color:var(--text2); border-top:1px solid rgba(255,255,255,0.05); padding-top:10px; margin-top:10px; width:100%;">👥 ${names || 'Belum ditugaskan'}</div>
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
    const color = SUBDIV_COLORS[s] || '#7c3aed';
    const isActive = currentFilter === s;
    
    return `<div class="subdiv-card ${isActive ? 'active' : ''}" 
                 onclick="filterTasks('${s}', this)"
                 style="${isActive ? `border-color:${color}66; background:${color}08;` : ''}">
      <div class="subdiv-name" style="color:${color}">${s}</div>
      <div class="subdiv-count">${subTasks.length} Tugas</div>
      <div class="subdiv-progress">
        <div class="subdiv-progress-fill" style="width:${prog}%; background:${color}"></div>
      </div>
    </div>`;
  }).join('');
}

/* ─── MODALS ─── */
window.showTaskDetail = function(id) {
  const t = tasks.find(x=>x.id===id); if(!t) return;
  const STATUS_LABEL = {todo:'To Do',inprogress:'In Progress',done:'Selesai'};
  if(document.getElementById('m-title')) document.getElementById('m-title').textContent = t.title;
  if(document.getElementById('m-desc')) document.getElementById('m-desc').textContent = t.description || 'No description.';
  if(document.getElementById('m-due')) document.getElementById('m-due').textContent = t.dueDate || 'TBA';
  if(document.getElementById('m-date-label')) document.getElementById('m-date-label').textContent = 'Deadline';
  
  // Visibility
  const dueSection = document.getElementById('m-due')?.parentElement;
  const locSection = document.getElementById('m-location-section');
  const assignSection = document.getElementById('m-assignees-section');
  const evSection = document.getElementById('m-event-section');
  
  if(dueSection) dueSection.style.display = 'block';
  if(locSection) locSection.style.display = 'none';
  if(assignSection) assignSection.style.display = 'block';
  if(evSection) evSection.style.display = 'block';

  const modal = document.getElementById('taskModal');
  if(modal) modal.classList.add('open');
};

window.showEventDetail = function(id) {
  const e = events.find(x=>x.id===id); if(!e) return;
  if(document.getElementById('m-title')) document.getElementById('m-title').textContent = e.title;
  if(document.getElementById('m-desc')) document.getElementById('m-desc').textContent = e.description || 'No description.';
  if(document.getElementById('m-due')) document.getElementById('m-due').textContent = `${e.date} · ${e.time || 'TBA'}`;
  if(document.getElementById('m-location')) document.getElementById('m-location').textContent = e.location || 'TBA';
  if(document.getElementById('m-date-label')) document.getElementById('m-date-label').textContent = 'Waktu & Tanggal';

  // Visibility
  const dueSection = document.getElementById('m-due')?.parentElement;
  const locSection = document.getElementById('m-location-section');
  const assignSection = document.getElementById('m-assignees-section');
  const evSection = document.getElementById('m-event-section');

  if(dueSection) dueSection.style.display = 'block';
  if(locSection) locSection.style.display = 'block';
  if(assignSection) assignSection.style.display = 'none';
  if(evSection) evSection.style.display = 'none';

  const modal = document.getElementById('taskModal');
  if(modal) modal.classList.add('open');
};

window.showAnnDetail = function(id) {
  const a = announcements.find(x=>x.id===id); if(!a) return;
  if(document.getElementById('m-title')) document.getElementById('m-title').textContent = a.title;
  if(document.getElementById('m-desc')) document.getElementById('m-desc').textContent = a.content || 'No content.';
  if(document.getElementById('m-due')) document.getElementById('m-due').textContent = `${a.date} · ${a.time || 'TBA'}`;
  if(document.getElementById('m-location')) document.getElementById('m-location').textContent = a.location || 'TBA';
  if(document.getElementById('m-date-label')) document.getElementById('m-date-label').textContent = 'Waktu & Tanggal';

  // Visibility
  const dueSection = document.getElementById('m-due')?.parentElement;
  const locSection = document.getElementById('m-location-section');
  const assignSection = document.getElementById('m-assignees-section');
  const evSection = document.getElementById('m-event-section');

  if(dueSection) dueSection.style.display = 'block';
  if(locSection) locSection.style.display = a.location ? 'block' : 'none';
  if(assignSection) assignSection.style.display = 'none';
  if(evSection) evSection.style.display = 'none';

  const modal = document.getElementById('taskModal');
  if(modal) modal.classList.add('open');
};

window.closeTaskModal = function() {
  const modal = document.getElementById('taskModal');
  if(modal) modal.classList.remove('open');
};

window.toggleSSMode = function() {
  const modal = document.getElementById('taskModal');
  const content = modal?.querySelector('.modal-content');
  if(content) content.classList.toggle('ss-mode');
};

/* ─── RENDERERS ─── */
function renderTeam() {
  const grid = document.getElementById('teamGrid');
  if (!grid || !members.length) return;
  grid.innerHTML = members.map((m, i) => {
    const initials = m.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
    const mRoles = m.roles || (m.role ? [m.role] : []);
    const badges = mRoles.map(r => `<div class="member-role role-${r.split(' ')[0].toLowerCase()}">${r}</div>`).join('');
    return `<div class="member-card animate-on-scroll" style="--i:${i}"><div class="member-avatar">${initials}</div><div class="member-name">${m.name}</div><div style="display:flex; flex-wrap:wrap; gap:4px; justify-content:center;">${badges}</div></div>`;
  }).join('');
  observeAnimations();
}

function renderAnnouncements() {
  const list = document.getElementById('annList');
  if (!list || !announcements.length) return;
  list.innerHTML = announcements.map(a => {
    const isHigh = a.priority === 'high';
    const badgeClass = isHigh ? 'sb-urgent' : 'sb-normal';
    const badgeLabel = isHigh ? 'Penting' : 'Info';
    return `<div class="ann-card animate-on-scroll" onclick="showAnnDetail('${a.id}')">
      <div class="ann-content">
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
          <h3 class="ann-title" style="margin:0;">${a.title}</h3>
          <span class="status-badge ${badgeClass}" style="font-size:9px; padding:2px 8px;">${badgeLabel}</span>
        </div>
        <p class="ann-text">${a.content.substring(0,80)}...</p>
        <div class="ann-date" style="margin-top:10px; font-size:11px; opacity:0.6;">📅 ${a.date}</div>
      </div>
    </div>`;
  }).join('');
  observeAnimations();
}

function renderNotes() {
  const grid = document.getElementById('notesList');
  if (!grid || !notes.length) return;
  grid.innerHTML = notes.map(n => `<div class="event-card animate-on-scroll"><h3 class="event-title">${n.title}</h3><p style="font-size:14px; color:var(--text2);">${n.content.substring(0,100)}...</p></div>`).join('');
  observeAnimations();
}

function observeAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

function setupParticles() {
  const canvas = document.getElementById('particleCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();
  class Particle {
    constructor() { this.reset(); }
    reset() { this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height; this.v = Math.random() * 0.5 + 0.2; this.s = Math.random() * 1.5 + 0.5; this.a = Math.random() * 0.5; }
    update() { this.y -= this.v; if(this.y < 0) this.reset(); }
    draw() { ctx.fillStyle = `rgba(124, 58, 237, ${this.a})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.s, 0, Math.PI*2); ctx.fill(); }
  }
  for(let i=0; i<50; i++) particles.push(new Particle());
  function animate() { ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); p.draw(); }); requestAnimationFrame(animate); }
  animate();
}

const modalOverlay = document.getElementById('taskModal');
if(modalOverlay) modalOverlay.addEventListener('click', (e) => { if(e.target === modalOverlay) window.closeTaskModal(); });

init();
