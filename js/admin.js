import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, collection, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, 
  onSnapshot, query, orderBy, limit, serverTimestamp 
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
const ADMIN_PASSWORD = 'piska19';
const SUBDIV_COLORS = {
  'fotografer':'#f59e0b','videografer':'#3b82f6',
  'desainer grafis':'#a855f7','content creator':'#ec4899','editor':'#10b981'
};
const SUBDIV_LIST = ['fotografer','videografer','desainer grafis','content creator','editor'];
const EVENT_TYPES = ['Rapat','Event','Workshop','Peliputan','Lainnya'];

/* ─── STATE ─── */
let members = [];
let events  = [];
let tasks   = [];
let announcements = [];
let notes = [];

/* ─── AUTH ─── */
window.doLogin = function() {
  const val = document.getElementById('loginPass').value;
  const overlay = document.getElementById('loginOverlay');
  if (val === ADMIN_PASSWORD) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
      overlay.style.display = 'none';
      document.getElementById('adminApp').classList.add('visible');
      initRealtime();
    }, 500);
  } else {
    const err = document.getElementById('loginError');
    err.textContent='❌ Password salah. Coba lagi.';
    setTimeout(()=>err.textContent='',2500);
  }
};
window.doLogout = function() {
  if(confirm('Keluar dari admin panel?')) location.reload();
};

/* ─── PANEL NAV ─── */
const PANEL_INFO = {
  dashboard:{title:'Dashboard',sub:'Ringkasan divisi Multimedia ITSpecta'},
  events:{title:'Jadwal & Event',sub:'Kelola jadwal kegiatan divisi'},
  tasks:{title:'Manajemen Tugas',sub:'Kelola tugas dan jobdesk per sub-divisi'},
  members:{title:'Anggota Tim',sub:'Kelola daftar anggota divisi'},
  announcements:{title:'Pengumuman',sub:'Kelola info dan pengumuman'},
  notes:{title:'Notulensi Rapat',sub:'Kelola catatan hasil rapat divisi'},
  data:{title:'Manajemen Data',sub:'Ekspor, impor, dan reset data website'}
};
window.showPanel = function(name, btn) {
  document.querySelectorAll('.panel-page').forEach(p=>p.classList.remove('active'));
  const panel = document.getElementById('panel-'+name);
  if(panel) panel.classList.add('active');
  document.querySelectorAll('.sidebar-link').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const info = PANEL_INFO[name];
  document.getElementById('topbarTitle').textContent=info.title;
  document.getElementById('topbarSub').textContent=info.sub;
};

/* ─── TOAST ─── */
function toast(msg, dur=2500) {
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),dur);
}

/* ─── REALTIME SYNC ─── */
function initRealtime() {
  onSnapshot(collection(db, "members"), snap => {
    members = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderMembersTable();
    renderDashboard();
  });
  onSnapshot(collection(db, "events"), snap => {
    events = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderEventsTable();
    renderDashboard();
  });
  onSnapshot(collection(db, "tasks"), snap => {
    tasks = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderTasksTable();
    renderDashboard();
  });
  onSnapshot(collection(db, "announcements"), snap => {
    announcements = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderAnnTable();
  });
  onSnapshot(collection(db, "notes"), snap => {
    notes = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderNotesTable();
  });
}

/* ─── RENDERERS ─── */
function renderDashboard() {
  const today = new Date().toISOString().slice(0,10);
  const upcoming = events.filter(e=>e.date>=today).length;
  const done = tasks.filter(t=>t.status==='done').length;
  const active = tasks.filter(t=>t.status==='inprogress').length;
  
  const stats = document.getElementById('dashStats');
  if(!stats) return;
  stats.innerHTML = `
    <div class="admin-stat-card"><div class="asc-icon" style="background:rgba(245,158,11,.15);color:#f59e0b"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div><div><span class="asc-num">${members.length}</span><span class="asc-label">Total Anggota</span></div></div>
    <div class="admin-stat-card"><div class="asc-icon" style="background:rgba(59,130,246,.15);color:#3b82f6"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><div><span class="asc-num">${upcoming}</span><span class="asc-label">Event Mendatang</span></div></div>
    <div class="admin-stat-card"><div class="asc-icon" style="background:rgba(16,185,129,.15);color:#10b981"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div><div><span class="asc-num">${done}</span><span class="asc-label">Tugas Selesai</span></div></div>
    <div class="admin-stat-card"><div class="asc-icon" style="background:rgba(245,158,11,.15);color:#f59e0b"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div><span class="asc-num">${active}</span><span class="asc-label">Tugas Aktif</span></div></div>
  `;
  
  const upcomingEvents = events.filter(e=>e.date>=today).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
  document.getElementById('dashEvents').innerHTML = upcomingEvents.length
    ? upcomingEvents.map(e=>`<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:8px">
        <div style="font-weight:700;font-size:13px;margin-bottom:3px">${e.title}</div>
        <div style="font-size:11px;color:var(--text2)">📅 ${e.date} · ⏰ ${e.time} · 📍 ${e.location}</div>
      </div>`).join('')
    : '<p style="color:var(--text3);font-size:13px">Tidak ada event mendatang.</p>';

  const activeTasks = tasks.filter(t=>t.status==='inprogress').slice(0,4);
  document.getElementById('dashTasks').innerHTML = activeTasks.length
    ? activeTasks.map(t=>{
        const color=SUBDIV_COLORS[t.subdiv]||'#7c3aed';
        return `<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:8px">
          <div style="font-weight:700;font-size:13px;margin-bottom:3px">${t.title}</div>
          <div style="font-size:11px;color:${color}">${t.subdiv} · <span style="color:var(--text2)">${t.dueDate}</span></div>
        </div>`;}).join('')
    : '<p style="color:var(--text3);font-size:13px">Tidak ada tugas aktif.</p>';
}

function renderEventsTable() {
  const tbody = document.getElementById('eventsBody');
  if(!tbody) return;
  if(!events.length){tbody.innerHTML=`<tr><td colspan="6" class="table-empty">Belum ada event. Klik + Tambah Event.</td></tr>`;return;}
  tbody.innerHTML = events.map(e=>`
    <tr>
      <td><strong>${e.title}</strong>${e.description?`<div style="font-size:11px;color:var(--text3);margin-top:2px">${e.description}</div>`:''}</td>
      <td>${e.date}</td><td>${e.time||'-'}</td><td>${e.location||'-'}</td>
      <td><span class="subdiv-badge" style="background:rgba(124,58,237,.12);color:var(--purple-l)">${e.type||'Event'}</span></td>
      <td><div class="col-actions">
        <button class="btn-edit" onclick="openModal('event','${e.id}')">Edit</button>
        <button class="btn-del" onclick="deleteItem('event','${e.id}')">Hapus</button>
      </div></td>
    </tr>`).join('');
}

function renderTasksTable() {
  const tbody = document.getElementById('tasksBody');
  if(!tbody) return;
  if(!tasks.length){tbody.innerHTML=`<tr><td colspan="6" class="table-empty">Belum ada tugas.</td></tr>`;return;}

  const html = [];
  
  // Group events by their title to unify multi-day events
  const unifiedEvents = {};
  events.forEach(e => {
    if(!unifiedEvents[e.title]) unifiedEvents[e.title] = { title: e.title, ids: [], dates: [] };
    unifiedEvents[e.title].ids.push(e.id);
    unifiedEvents[e.title].dates.push(e.date);
  });

  // Sort unified groups by their earliest date
  const sortedUnified = Object.values(unifiedEvents).sort((a,b) => {
    const dateA = a.dates.sort()[0];
    const dateB = b.dates.sort()[0];
    return dateA.localeCompare(dateB);
  });

  // Tasks with Events (Unified)
  sortedUnified.forEach(group => {
    const eventTasks = tasks.filter(t => group.ids.includes(t.eventId));
    if(eventTasks.length > 0) {
      const displayDates = [...new Set(group.dates)].sort().join(', ');
      html.push(`<tr style="background:rgba(124,58,237,0.05);">
        <td colspan="6" style="padding:12px 20px; font-weight:800; color:var(--purple-l); font-size:12px; text-transform:uppercase; letter-spacing:1px; border-left:4px solid var(--purple);">
          📅 Event: ${group.title} <span style="margin-left:10px; font-weight:400; opacity:0.7;">(${displayDates})</span>
        </td>
      </tr>`);
      eventTasks.forEach(t => html.push(renderTaskRow(t)));
    }
  });

  // Tasks without Events
  const noEventTasks = tasks.filter(t => !t.eventId);
  if(noEventTasks.length > 0) {
    html.push(`<tr style="background:rgba(255,255,255,0.03);">
      <td colspan="6" style="padding:12px 20px; font-weight:800; color:var(--text3); font-size:12px; text-transform:uppercase; letter-spacing:1px; border-left:4px solid var(--text3);">
        📌 Tugas Tanpa Event (Umum / Rutin)
      </td>
    </tr>`);
    noEventTasks.forEach(t => html.push(renderTaskRow(t)));
  }

  tbody.innerHTML = html.join('');
}

function renderTaskRow(t) {
  const STATUS_LABEL = {todo:'To Do',inprogress:'In Progress',done:'Selesai'};
  const tSubdivs = t.subdivs || (t.subdiv ? [t.subdiv] : []);
  const subdivBadges = tSubdivs.map(s => {
    const color = SUBDIV_COLORS[s] || '#7c3aed';
    return `<span class="subdiv-badge" style="background:${color}22; color:${color}; margin-right:4px">${s}</span>`;
  }).join(' ');
  
  const assignedNames = (t.assignedTo || []).map(id => {
    const m = members.find(x => x.id === id); 
    return m ? m.name : '?';
  }).join(', ') || '-';
  
  const sbClass = {todo:'sb-todo',inprogress:'sb-inprogress',done:'sb-done'}[t.status] || 'sb-todo';
  
  return `<tr>
    <td style="padding-left:35px;"><strong>${t.title}</strong>${t.priority==='high'?'<span class="subdiv-badge priority-hi" style="margin-left:6px">Penting</span>':''}</td>
    <td><div style="display:flex;flex-wrap:wrap;gap:4px">${subdivBadges}</div></td>
    <td style="font-size:12px">${assignedNames}</td>
    <td style="font-size:12px">${t.dueDate||'-'}</td>
    <td><span class="status-badge ${sbClass}">${STATUS_LABEL[t.status]}</span></td>
    <td><div class="col-actions">
      <button class="btn-edit" onclick="openModal('task','${t.id}')">Edit</button>
      <button class="btn-del" onclick="deleteItem('task','${t.id}')">Hapus</button>
    </div></td>
  </tr>`;
}

function renderMembersTable() {
  const tbody = document.getElementById('membersBody');
  if(!tbody) return;
  if(!members.length){tbody.innerHTML=`<tr><td colspan="4" class="table-empty">Belum ada anggota.</td></tr>`;return;}
  tbody.innerHTML = members.map(m=>{
    const mRoles = m.roles || (m.role ? [m.role] : []);
    const roleBadges = mRoles.map(r => {
      const color=SUBDIV_COLORS[r]||'#7c3aed';
      return `<span class="subdiv-badge" style="background:${color}22;color:${color};margin-right:4px">${r}</span>`;
    }).join('');
    const taskCount=tasks.filter(t=>(t.assignedTo||[]).includes(m.id)).length;
    return `<tr>
      <td><strong>${m.name}</strong></td>
      <td><div style="display:flex;flex-wrap:wrap;gap:4px">${roleBadges}</div></td>
      <td style="font-size:12px;color:var(--text2)">${taskCount} tugas</td>
      <td><div class="col-actions">
        <button class="btn-edit" onclick="openModal('member','${m.id}')">Edit</button>
        <button class="btn-del" onclick="deleteItem('member','${m.id}')">Hapus</button>
      </div></td>
    </tr>`;}).join('');
}

function renderAnnTable() {
  const tbody = document.getElementById('annBody');
  if(!tbody) return;
  if(!announcements.length){tbody.innerHTML=`<tr><td colspan="4" class="table-empty">Belum ada pengumuman.</td></tr>`;return;}
  tbody.innerHTML = announcements.map(a=>{
    const isHigh=a.priority==='high';
    return `<tr>
      <td><strong>${a.title}</strong><div style="font-size:11px;color:var(--text3);margin-top:2px">${a.content.slice(0,60)}${a.content.length>60?'...':''}</div></td>
      <td style="font-size:12px">${a.date}</td>
      <td><span class="status-badge ${isHigh?'sb-inprogress':'sb-todo'}">${isHigh?'Penting':'Normal'}</span></td>
      <td><div class="col-actions">
        <button class="btn-edit" onclick="openModal('announcement','${a.id}')">Edit</button>
        <button class="btn-del" onclick="deleteItem('announcement','${a.id}')">Hapus</button>
      </div></td>
    </tr>`;}).join('');
}

function renderNotesTable() {
  const tbody = document.getElementById('notesBody');
  if(!tbody) return;
  if(!notes.length){tbody.innerHTML=`<tr><td colspan="4" class="table-empty">Belum ada notulensi.</td></tr>`;return;}
  tbody.innerHTML = notes.map(n=>`<tr>
    <td><strong>${n.title}</strong><div style="font-size:11px;color:var(--text3);margin-top:2px">${n.content.slice(0,80)}${n.content.length>80?'...':''}</div></td>
    <td style="font-size:12px">${n.date}</td>
    <td><span class="subdiv-badge" style="background:rgba(124,58,237,.12);color:var(--purple-l)">${n.topic||'-'}</span></td>
    <td><div class="col-actions">
      <button class="btn-edit" onclick="openModal('note','${n.id}')">Edit</button>
      <button class="btn-del" onclick="deleteItem('note','${n.id}')">Hapus</button>
    </div></td>
  </tr>`).join('');
}

/* ─── MODAL ─── */
let currentModalType='', currentEditId=null;
window.openModal = function(type, editId=null) {
  currentModalType=type; currentEditId=editId;
  const overlay=document.getElementById('modalOverlay');
  const titles={event:editId?'Edit Event':'Tambah Event',task:editId?'Edit Tugas':'Tambah Tugas',member:editId?'Edit Anggota':'Tambah Anggota',announcement:editId?'Edit Pengumuman':'Tambah Pengumuman',note:editId?'Edit Notulensi':'Tambah Notulensi'};
  document.getElementById('modalTitle').textContent=titles[type];
  document.getElementById('modalBody').innerHTML=buildForm(type,editId);
  overlay.classList.add('open');
  document.getElementById('btnSave').onclick=()=>saveModal(type,editId);
};
window.closeModal = function() {
  document.getElementById('modalOverlay').classList.remove('open');
  currentEditId=null;
};

function buildForm(type,editId) {
  if(type==='event') {
    const e=editId?events.find(x=>x.id===editId):{};
    return `<div class="form-group"><label class="form-label">Nama Event *</label><input class="form-input" id="f-title" value="${e.title||''}"></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Tanggal *</label><input type="date" class="form-input" id="f-date" value="${e.date||''}"></div>
      <div class="form-group"><label class="form-label">Waktu</label><input type="time" class="form-input" id="f-time" value="${e.time||''}"></div></div>
      <div class="form-group"><label class="form-label">Lokasi</label><input class="form-input" id="f-location" value="${e.location||''}"></div>
      <div class="form-group"><label class="form-label">Tipe</label><select class="form-select" id="f-type">${EVENT_TYPES.map(t=>`<option value="${t}"${(e.type||'')==t?' selected':''}>${t}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Deskripsi</label><textarea class="form-textarea" id="f-desc">${e.description||''}</textarea></div>`;
  }
  if(type==='task') {
    const t=editId?tasks.find(x=>x.id===editId):{};
    const eventOptions = `<option value="">-- Tanpa Event --</option>` + events.map(e=>`<option value="${e.id}"${t.eventId===e.id?' selected':''}>${e.title} (${e.date})</option>`).join('');
    return `<div class="form-group"><label class="form-label">Judul Tugas *</label><input class="form-input" id="f-title" value="${t.title||''}"></div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Sub-divisi (Bisa pilih lebih dari 1) *</label>
          <div class="roles-grid" id="taskSubdivGrid" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            ${SUBDIV_LIST.map(s => {
              const isChecked = (t.subdivs || (t.subdiv ? [t.subdiv] : [])).includes(s);
              return `<label class="assignee-check"><input type="checkbox" value="${s}"${isChecked?' checked':''}><span>${s}</span></label>`;
            }).join('')}
          </div>
        </div>
        <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="f-status"><option value="todo"${t.status==='todo'?' selected':''}>To Do</option><option value="inprogress"${t.status==='inprogress'?' selected':''}>In Progress</option><option value="done"${t.status==='done'?' selected':''}>Selesai</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Deadline</label><input type="date" class="form-input" id="f-due" value="${t.dueDate||''}"></div>
        <div class="form-group"><label class="form-label">Prioritas</label><select class="form-select" id="f-priority"><option value="normal"${t.priority==='normal'?' selected':''}>Normal</option><option value="high"${t.priority==='high'?' selected':''}>Tinggi</option></select></div>
      </div>
      <div class="form-group"><label class="form-label">Hubungkan ke Event</label><select class="form-select" id="f-event">${eventOptions}</select></div>
      <div class="form-group"><label class="form-label">Deskripsi</label><textarea class="form-textarea" id="f-desc">${t.description||''}</textarea></div>
      <div class="form-group"><label class="form-label">Assign ke Anggota</label>
      <div class="assignees-grid" id="assigneesGrid" style="display:block;">${SUBDIV_LIST.map(s => {
        const subMembers = members.filter(m => (m.roles || (m.role ? [m.role] : [])).includes(s));
        if(!subMembers.length) return '';
        return `
          <div style="margin-top:15px; margin-bottom:8px; font-size:11px; font-weight:800; color:var(--purple-l); text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid rgba(124,58,237,0.2); padding-bottom:4px;">${s}</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            ${subMembers.map(m => `
              <label class="assignee-check">
                <input type="checkbox" value="${m.id}" onchange="syncCheckboxes(this)" ${(t.assignedTo||[]).includes(m.id)?' checked':''}>
                <span>${m.name}</span>
              </label>
            `).join('')}
          </div>
        `;
      }).join('')}</div></div>`;
  }
  if(type==='member') {
    const m=editId?members.find(x=>x.id===editId):{};
    const mRoles = m.roles || (m.role ? [m.role] : []);
    return `<div class="form-group"><label class="form-label">Nama Lengkap *</label><input class="form-input" id="f-name" value="${m.name||''}"></div>
      <div class="form-group"><label class="form-label">Sub-divisi (Bisa pilih > 1) *</label>
      <div class="assignees-grid" id="rolesGrid">${SUBDIV_LIST.map(s=>`<label class="assignee-check"><input type="checkbox" value="${s}"${mRoles.includes(s)?' checked':''}><span>${s}</span></label>`).join('')}</div></div>`;
  }
  if(type==='announcement') {
    const a=editId?announcements.find(x=>x.id===editId):{};
    return `<div class="form-group"><label class="form-label">Judul *</label><input class="form-input" id="f-title" value="${a.title||''}"></div>
      <div class="form-group"><label class="form-label">Isi Pengumuman *</label><textarea class="form-textarea" style="min-height:120px" id="f-content">${a.content||''}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Tanggal</label><input type="date" class="form-input" id="f-date" value="${a.date||new Date().toISOString().slice(0,10)}"></div>
        <div class="form-group"><label class="form-label">Waktu</label><input type="time" class="form-input" id="f-time" value="${a.time||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Lokasi</label><input class="form-input" id="f-location" value="${a.location||''}"></div>
        <div class="form-group"><label class="form-label">Prioritas</label><select class="form-select" id="f-priority"><option value="normal"${(a.priority||'normal')==='normal'?' selected':''}>Normal</option><option value="high"${(a.priority||'')==='high'?' selected':''}>Penting/Urgent</option></select></div>
      </div>`;
  }
  if(type==='note') {
    const n=editId?notes.find(x=>x.id===editId):{};
    return `<div class="form-group"><label class="form-label">Judul Rapat *</label><input class="form-input" id="f-title" value="${n.title||''}"></div>
      <div class="form-group"><label class="form-label">Tanggal *</label><input type="date" class="form-input" id="f-date" value="${n.date||new Date().toISOString().slice(0,10)}"></div>
      <div class="form-group"><label class="form-label">Topik Utama</label><input class="form-input" id="f-topic" value="${n.topic||''}"></div>
      <div class="form-group"><label class="form-label">Isi Notulensi *</label><textarea class="form-textarea" style="min-height:150px" id="f-content">${n.content||''}</textarea></div>`;
  }
  return '';
}

async function saveModal(type, editId) {
  const btn = document.getElementById('btnSave');
  const g = id => { const e=document.getElementById(id); return e?e.value.trim():''; };
  const collectionName = type==='member'?'members':type==='announcement'?'announcements':type==='note'?'notes':type+'s';
  
  let item = {};
  if(type==='event') {
    if(!g('f-title')||!g('f-date')){alert('Nama dan tanggal wajib diisi!');return;}
    item={title:g('f-title'),date:g('f-date'),time:g('f-time'),location:g('f-location'),type:g('f-type'),description:g('f-desc')};
  } else if(type==='task') {
    if(!g('f-title')){alert('Judul tugas wajib diisi!');return;}
    const selectedSubdivs = [...document.querySelectorAll('#taskSubdivGrid input:checked')].map(c=>c.value);
    if(!selectedSubdivs.length){alert('Pilih minimal satu sub-divisi!');return;}
    const assignedIds = [...document.querySelectorAll('#assigneesGrid input:checked')].map(c=>c.value);
    item={title:g('f-title'),subdivs:selectedSubdivs,status:g('f-status'),dueDate:g('f-due'),priority:g('f-priority'),description:g('f-desc'),eventId:g('f-event'),assignedTo:[...new Set(assignedIds)]};
  } else if(type==='member') {
    if(!g('f-name')){alert('Nama wajib diisi!');return;}
    const selectedRoles = [...document.querySelectorAll('#rolesGrid input:checked')].map(c=>c.value);
    if(!selectedRoles.length){alert('Pilih minimal satu sub-divisi!');return;}
    item={name:g('f-name'),roles:selectedRoles};
  } else if(type==='announcement') {
    if(!g('f-title')||!g('f-content')){alert('Judul dan isi wajib diisi!');return;}
    item={title:g('f-title'),content:g('f-content'),date:g('f-date'),time:g('f-time'),location:g('f-location'),priority:g('f-priority')};
  } else if(type==='note') {
    if(!g('f-title')||!g('f-content')){alert('Judul dan isi wajib diisi!');return;}
    item={title:g('f-title'),content:g('f-content'),date:g('f-date'),topic:g('f-topic')};
  }

  try {
    const originalText = btn.textContent;
    btn.textContent = 'Menyimpan...';
    btn.disabled = true;
    
    if(editId) await updateDoc(doc(db, collectionName, editId), item);
    else await addDoc(collection(db, collectionName), item);
    
    closeModal();
    toast('✅ Data berhasil disimpan!');
  } catch (e) {
    console.error(e);
    alert('Gagal menyimpan data.');
  } finally {
    btn.textContent = 'Simpan';
    btn.disabled = false;
  }
}

window.deleteItem = async function(type, id) {
  if(!confirm(`Yakin ingin menghapus ini?`)) return;
  const col = type==='member'?'members':type==='announcement'?'announcements':type==='note'?'notes':type+'s';
  try {
    await deleteDoc(doc(db, col, id));
    toast('🗑️ Data berhasil dihapus!');
  } catch (e) { alert('Gagal menghapus.'); }
};

/* ─── DATA MANAGEMENT ─── */
window.exportData = function() {
  const allData = { members, events, tasks, announcements, notes };
  const blob = new Blob([JSON.stringify(allData, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `multimedia_data.json`; a.click();
};

window.importData = async function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      toast('⏳ Mengimpor data, harap tunggu...');
      const data = JSON.parse(e.target.result);
      // Batch import (simple version)
      for(const col in data) {
        for(const item of data[col]) {
          const {id, ...rest} = item;
          await addDoc(collection(db, col.replace('mm_','')), rest);
        }
      }
      alert('Impor selesai! Halaman akan dimuat ulang.'); 
      location.reload();
    } catch (err) { alert('Format tidak valid.'); }
  };
  reader.readAsText(file);
};

window.resetData = function() {
  if (confirm('Fitur reset dinonaktifkan di versi Firebase untuk keamanan.')) return;
};

window.syncCheckboxes = function(el) {
  const val = el.value;
  const isChecked = el.checked;
  document.querySelectorAll(`#assigneesGrid input[value="${val}"]`).forEach(input => {
    input.checked = isChecked;
  });
};
