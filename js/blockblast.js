
// ===== BLOCK BLAST 6x6 GAME ENGINE =====
const GRID = 6;
let grid, score, playerName, currentPieces, selectedIdx, isDragging, streak, feverMode, combo, sessionDocId;

// Audio Context
let audioCtx;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, type='sine', vol=0.15, dur=0.2, slide=null) {
  try {
    const ac = getAudio();
    if (ac.state === 'suspended') ac.resume();
    const o = ac.createOscillator(), g = ac.createGain(), dist = ac.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i=0;i<256;i++){const x=i*2/256-1;curve[i]=x*(3+1)/(1+3*Math.abs(x));}
    dist.curve = curve;
    o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, ac.currentTime + dur);
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.connect(dist); dist.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + dur);
  } catch(e){}
}

function sndPlace() {
  playTone(220,'triangle',0.2,0.08,440);
  setTimeout(()=>playTone(440,'sine',0.1,0.06,660),60);
}
function sndPick() { playTone(600,'sine',0.08,0.04,800); }
function sndClear(n) {
  const notes=[261,329,392,523,659,784];
  for(let i=0;i<Math.min(n+1,notes.length);i++)
    setTimeout(()=>playTone(notes[i],'sine',0.18,0.15),i*60);
  if(n>1) setTimeout(()=>playTone(1046,'triangle',0.12,0.2),n*60+60);
}
function sndCombo() {
  [523,659,784,1046,1318].forEach((f,i)=>setTimeout(()=>playTone(f,'sine',0.15,0.12),i*50));
}
function sndFever() {
  [261,523,784,1046,1568,2093].forEach((f,i)=>setTimeout(()=>playTone(f,'triangle',0.18,0.2),i*80));
  setTimeout(()=>playTone(2093,'sine',0.12,0.4),500);
}
function sndGameover() {
  [440,330,261,196,147].forEach((f,i)=>setTimeout(()=>playTone(f,'sawtooth',0.15,0.35,f*0.6),i*180));
}
function sndError() {
  playTone(150,'sawtooth',0.18,0.12);
  setTimeout(()=>playTone(120,'sawtooth',0.15,0.15),100);
}
function sndLevelUp() {
  [440,554,659,880].forEach((f,i)=>setTimeout(()=>playTone(f,'square',0.12,0.18),i*70));
}

// Particle system
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() { canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
window.addEventListener('resize', resizeCanvas); resizeCanvas();

class Particle {
  constructor(x,y,color,type='burst'){
    this.x=x; this.y=y; this.color=color; this.type=type;
    if(type==='burst'){
      this.vx=(Math.random()-0.5)*12; this.vy=(Math.random()-0.5)*12-4;
      this.size=Math.random()*8+3; this.life=1; this.decay=Math.random()*0.03+0.02;
      this.gravity=0.3; this.spin=Math.random()*0.3-0.15;
    } else if(type==='star'){
      const angle=Math.random()*Math.PI*2;
      const speed=Math.random()*8+4;
      this.vx=Math.cos(angle)*speed; this.vy=Math.sin(angle)*speed-6;
      this.size=Math.random()*5+2; this.life=1; this.decay=0.015; this.gravity=0.15;
    } else if(type==='sparkle'){
      this.vx=(Math.random()-0.5)*6; this.vy=-Math.random()*8-2;
      this.size=Math.random()*3+1; this.life=1; this.decay=0.04; this.gravity=0.1;
    }
  }
  update(){
    this.x+=this.vx; this.y+=this.vy;
    this.vy+=this.gravity||0;
    this.vx*=0.98;
    this.life-=this.decay;
    this.size*=0.97;
  }
  draw(){
    ctx.save(); ctx.globalAlpha=Math.max(0,this.life);
    ctx.fillStyle=this.color;
    ctx.shadowColor=this.color; ctx.shadowBlur=8;
    if(this.type==='star'){
      ctx.beginPath();
      for(let i=0;i<5;i++){
        const a=i*Math.PI*2/5-Math.PI/2;
        const r2=a+Math.PI/5;
        i===0?ctx.moveTo(this.x+Math.cos(a)*this.size,this.y+Math.sin(a)*this.size):ctx.lineTo(this.x+Math.cos(a)*this.size,this.y+Math.sin(a)*this.size);
        ctx.lineTo(this.x+Math.cos(r2)*this.size*0.4,this.y+Math.sin(r2)*this.size*0.4);
      }
      ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

function explode(x,y,color,count=24){
  for(let i=0;i<count;i++) particles.push(new Particle(x,y,color,'burst'));
  for(let i=0;i<Math.floor(count/4);i++) particles.push(new Particle(x,y,'#fff','star'));
}
function sparkle(x,y,color,count=12){
  for(let i=0;i<count;i++) particles.push(new Particle(x,y,color,'sparkle'));
}

function animParticles(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles=particles.filter(p=>p.life>0);
  particles.forEach(p=>{p.update();p.draw();});
  requestAnimationFrame(animParticles);
}
animParticles();

// Pieces - Block Blast style (normal difficulty)
const PIECES = [
  // 1-cell (banyakin supaya lebih mudah)
  {p:[[1]],c:'#a78bfa'}, {p:[[1]],c:'#a78bfa'}, {p:[[1]],c:'#a78bfa'},
  // 2-cell
  {p:[[1,1]],c:'#f472b6'}, {p:[[1,1]],c:'#f472b6'},
  {p:[[1],[1]],c:'#fb923c'}, {p:[[1],[1]],c:'#fb923c'},
  // 3-cell L/lines
  {p:[[1,1,1]],c:'#34d399'}, {p:[[1,1,1]],c:'#34d399'},
  {p:[[1],[1],[1]],c:'#38bdf8'}, {p:[[1],[1],[1]],c:'#38bdf8'},
  {p:[[1,1],[1,0]],c:'#f59e0b'},
  {p:[[1,1],[0,1]],c:'#e879f9'},
  {p:[[1,0],[1,1]],c:'#4ade80'},
  {p:[[0,1],[1,1]],c:'#f87171'},
  // 2x2 square
  {p:[[1,1],[1,1]],c:'#facc15'}, {p:[[1,1],[1,1]],c:'#facc15'},
  // 4-cell
  {p:[[1,1,1,1]],c:'#22d3ee'},
  {p:[[1],[1],[1],[1]],c:'#818cf8'},
  {p:[[1,1,1],[1,0,0]],c:'#fb7185'},
  {p:[[1,1,1],[0,0,1]],c:'#a3e635'},
  {p:[[1,0,0],[1,1,1]],c:'#fbbf24'},
  {p:[[0,0,1],[1,1,1]],c:'#60a5fa'},
  // T-shape
  {p:[[1,1,1],[0,1,0]],c:'#c084fc'},
  {p:[[0,1,0],[1,1,1]],c:'#f9a8d4'},
  {p:[[1,0],[1,1],[1,0]],c:'#c084fc'},
  {p:[[0,1],[1,1],[0,1]],c:'#f9a8d4'},
  // S/Z shapes
  {p:[[0,1,1],[1,1,0]],c:'#6ee7b7'},
  {p:[[1,1,0],[0,1,1]],c:'#fcd34d'}
];

// Game state
function initGame(){
  grid = Array(GRID).fill(null).map(()=>Array(GRID).fill(null));
  score=0; streak=0; feverMode=false; combo=0;
  const gridEl = document.getElementById('gameGrid');
  gridEl.innerHTML='';
  for(let r=0;r<GRID;r++){
    for(let c=0;c<GRID;c++){
      const cell=document.createElement('div');
      cell.className='cell'; cell.id=`c-${r}-${c}`;
      gridEl.appendChild(cell);
    }
  }
  updateUI(); spawnPieces();
}

function spawnPieces(){
  currentPieces=[];
  const row=document.getElementById('piecesRow');
  row.innerHTML='';
  // Pick 3 pieces that can fit on a 6x6
  const eligible = PIECES.filter(p=>{
    const rows=p.p.length, cols=p.p[0].length;
    return rows<=GRID && cols<=GRID;
  });
  for(let i=0;i<3;i++){
    const pd=JSON.parse(JSON.stringify(eligible[Math.floor(Math.random()*eligible.length)]));
    currentPieces.push(pd);
    const box=document.createElement('div');
    box.className='piece-box'; box.id=`pb-${i}`;
    box.innerHTML=miniPiece(pd.p,pd.c,22);
    box.addEventListener('mousedown',e=>{e.preventDefault();startDrag(e,i);});
    box.addEventListener('touchstart',e=>{e.preventDefault();startDrag(e,i);},{passive:false});
    row.appendChild(box);
  }
  checkGameOver();
}

function miniPiece(p,color,sz=20){
  const rs=p.length,cs=p[0].length;
  let h=`<div style="display:grid;grid-template-columns:repeat(${cs},${sz}px);gap:3px;">`;
  for(let r=0;r<rs;r++)for(let c=0;c<cs;c++){
    h+=`<div style="width:${sz}px;height:${sz}px;border-radius:6px;background:${p[r][c]?color:'transparent'};${p[r][c]?`box-shadow:0 0 8px ${color}88,inset 0 1px 0 rgba(255,255,255,0.4)`:''};${p[r][c]?'border:1px solid rgba(255,255,255,0.3)':''}"></div>`;
  }
  return h+'</div>';
}

// Drag
const ghost = document.getElementById('drag-ghost');

function startDrag(e,idx){
  if(currentPieces[idx]===null) return;
  isDragging=true; selectedIdx=idx;
  const pd=currentPieces[idx];
  ghost.innerHTML=miniPiece(pd.p,pd.c,36);
  ghost.style.display='block';
  document.getElementById(`pb-${idx}`).classList.add('dragging');
  moveGhost(e); sndPick();
}

function moveGhost(e){
  if(!isDragging) return;
  const x=e.touches?e.touches[0].clientX:e.clientX;
  const y=e.touches?e.touches[0].clientY:e.clientY;
  const offY=e.touches?-130:-70;
  ghost.style.left=(x-ghost.offsetWidth/2)+'px';
  ghost.style.top=(y+offY-ghost.offsetHeight/2)+'px';
  clearPrev();
  const gridEl=document.getElementById('gameGrid');
  const rect=gridEl.getBoundingClientRect();
  const cw=rect.width/GRID, ch=rect.height/GRID;
  const pd=currentPieces[selectedIdx];
  const pc=pd.p, pr=pc.length, pcs=pc[0].length;
  const tr=Math.round(((y+offY)-rect.top-(pr*ch)/2)/ch);
  const tc=Math.round((x-rect.left-(pcs*cw)/2)/cw);
  if(canPlace(pc,tr,tc)) applyPrev(pc,tr,tc,pd.c);
}

function dropPiece(e){
  if(!isDragging) return;
  const x=e.changedTouches?e.changedTouches[0].clientX:e.clientX;
  const y=e.changedTouches?e.changedTouches[0].clientY:e.clientY;
  const offY=e.changedTouches?-130:-70;
  const gridEl=document.getElementById('gameGrid');
  const rect=gridEl.getBoundingClientRect();
  const cw=rect.width/GRID, ch=rect.height/GRID;
  const pd=currentPieces[selectedIdx];
  const pc=pd.p, pr=pc.length, pcs=pc[0].length;
  const tr=Math.round(((y+offY)-rect.top-(pr*ch)/2)/ch);
  const tc=Math.round((x-rect.left-(pcs*cw)/2)/cw);
  if(canPlace(pc,tr,tc)){
    place(selectedIdx,tr,tc); sndPlace();
  } else { sndError(); }
  isDragging=false; ghost.style.display='none';
  document.querySelectorAll('.piece-box').forEach(b=>b.classList.remove('dragging'));
  clearPrev();
}

window.addEventListener('mousemove',moveGhost);
window.addEventListener('touchmove',e=>{if(isDragging){e.preventDefault();moveGhost(e);}},{passive:false});
window.addEventListener('mouseup',dropPiece);
window.addEventListener('touchend',dropPiece);

function canPlace(p,r,c){
  for(let pr=0;pr<p.length;pr++)for(let pc=0;pc<p[0].length;pc++){
    if(p[pr][pc]){
      const tr=r+pr,tc=c+pc;
      if(tr<0||tc<0||tr>=GRID||tc>=GRID||grid[tr][tc]) return false;
    }
  }
  return true;
}

function applyPrev(p,r,c,color){
  for(let pr=0;pr<p.length;pr++)for(let pc=0;pc<p[0].length;pc++){
    if(p[pr][pc]){
      const el=document.getElementById(`c-${r+pr}-${c+pc}`);
      if(el){el.style.setProperty('--cc',color);el.classList.add('preview');}
    }
  }
}
function clearPrev(){ document.querySelectorAll('.cell.preview').forEach(el=>el.classList.remove('preview')); }

function place(idx,r,c){
  const pd=currentPieces[idx], p=pd.p;
  let cells=0;
  for(let pr=0;pr<p.length;pr++)for(let pc=0;pc<p[0].length;pc++){
    if(p[pr][pc]){
      grid[r+pr][c+pc]=pd.c;
      const el=document.getElementById(`c-${r+pr}-${c+pc}`);
      el.style.setProperty('--cc',pd.c); el.classList.add('filled','pop-in');
      setTimeout(()=>el.classList.remove('pop-in'),400);
      cells++;
    }
  }
  score+=cells*5;
  currentPieces[idx]=null;
  document.getElementById(`pb-${idx}`).style.opacity='0';
  document.getElementById(`pb-${idx}`).style.pointerEvents='none';
  checkLines();
  updateUI();
  if(currentPieces.every(x=>x===null)) spawnPieces();
  else checkGameOver();
}

function checkLines(){
  const rows=[],cols=[];
  for(let r=0;r<GRID;r++) if(grid[r].every(x=>x!==null)) rows.push(r);
  for(let c=0;c<GRID;c++) if(grid.every(row=>row[c]!==null)) cols.push(c);
  const total=rows.length+cols.length;
  if(!total){streak=0;return;}
  streak++;
  const multi=feverMode?3:1;
  const pts=total*100*multi*(streak>1?streak:1);
  score+=pts;
  combo++;

  // Shake grid
  const gridEl=document.getElementById('gameGrid');
  gridEl.classList.add('shake');
  setTimeout(()=>gridEl.classList.remove('shake'),400);

  // Flash overlay
  const flash=document.getElementById('lineFlash');
  flash.style.opacity='0.4'; setTimeout(()=>flash.style.opacity='0',300);

  // Sound
  sndClear(Math.min(total,5));
  if(streak>=3 && !feverMode){ startFever(); sndFever(); }
  if(combo>1) sndCombo();

  // Clear with animation
  const toClear=new Set();
  rows.forEach(r=>{for(let c=0;c<GRID;c++) toClear.add(`${r}-${c}`);});
  cols.forEach(c=>{for(let r=0;r<GRID;r++) toClear.add(`${r}-${c}`);});
  toClear.forEach(key=>{
    const [r,c]=key.split('-');
    clearCell(+r,+c);
  });

  // Show score popup
  showPts(`+${pts}`,pts>=500?'gold':pts>=200?'#a78bfa':'#34d399');
}

function clearCell(r,c){
  const el=document.getElementById(`c-${r}-${c}`);
  const rect=el.getBoundingClientRect();
  const color=grid[r][c]||'#7c3aed';
  explode(rect.left+rect.width/2,rect.top+rect.height/2,color,20);
  sparkle(rect.left+rect.width/2,rect.top+rect.height/2,'#fff',8);
  grid[r][c]=null;
  el.classList.add('clearing');
  setTimeout(()=>{el.classList.remove('filled','clearing');el.style.removeProperty('--cc');},500);
}

function showPts(txt,color='#34d399'){
  const el=document.createElement('div');
  el.className='pts-popup';
  el.textContent=txt;
  el.style.cssText=`color:${color};left:50%;top:35%;`;
  document.querySelector('.board-wrap').appendChild(el);
  setTimeout(()=>el.remove(),900);
}

function startFever(){
  if(feverMode) return;
  feverMode=true;
  document.getElementById('gameArea').classList.add('fever');
  document.getElementById('feverBadge').style.display='flex';
  const fa=document.getElementById('feverAlert');
  fa.className='fever-alert show';
  setTimeout(()=>fa.className='fever-alert',1200);
  setTimeout(()=>{feverMode=false;document.getElementById('gameArea').classList.remove('fever');document.getElementById('feverBadge').style.display='none';},8000);
}

function updateUI(){
  document.getElementById('scoreVal').textContent=score;
  const titles=['ROOKIE','PLAYER','SMART','SKILLED','PRO','MASTER','LEGEND','GOD'];
  const t=titles[Math.min(Math.floor(score/800),titles.length-1)];
  document.getElementById('rankBadge').textContent=t;
  // Combo
  document.getElementById('comboBar').textContent=streak>1?`🔥 ${streak}x Combo!`:'';
}

function checkGameOver(){
  const rem=currentPieces.filter(x=>x!==null);
  if(!rem.length) return;
  let possible=false;
  outer:for(const pd of rem){
    for(let r=0;r<GRID;r++) for(let c=0;c<GRID;c++){
      if(canPlace(pd.p,r,c)){possible=true;break outer;}
    }
  }
  if(!possible){
    sndGameover();
    saveScore();
    setTimeout(()=>{
      document.getElementById('goScore').textContent=score;
      document.getElementById('goRank').textContent=document.getElementById('rankBadge').textContent;
      const msgs=['Hampir! Coba lagi 💪','Keren juga! Bisa lebih tinggi?','Game Over! Jangan menyerah!','Wah hampir perfect!','Besok pasti lebih baik!'];
      document.getElementById('goMsg').textContent=msgs[Math.floor(Math.random()*msgs.length)];
      document.getElementById('gameOverModal').style.display='flex';
    },800);
  }
}

// Leaderboard / Firebase
let db;
window.initFirebase=function(firestore){ db=firestore; loadLB(); };

async function loadLB(){
  if(!db) return;
  try{
    const {collection,query,orderBy,limit,onSnapshot}=window.firestoreApi;
    const q=query(collection(db,'leaderboard'),orderBy('score','desc'),limit(10));
    onSnapshot(q,snap=>{
      const html=snap.docs.map((d,i)=>{
        const it=d.data();
        const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`;
        return `<div class="lb-row ${i<3?'top':''}"><span>${medal} ${it.playerName}</span><span class="lb-score">${it.score.toLocaleString()}</span></div>`;
      }).join('')||'<div class="lb-empty">Belum ada skor</div>';
      document.querySelectorAll('.lb-list').forEach(el=>el.innerHTML=html);
    });
  }catch(e){console.warn(e);}
}

async function saveScore(){
  if(!db||score<10) return;
  try{
    const {collection,query,where,getDocs,addDoc,updateDoc,doc}=window.firestoreApi;
    const q=query(collection(db,'leaderboard'),where('playerName','==',playerName));
    const snap=await getDocs(q);
    if(!snap.empty){
      const d=snap.docs[0];
      if(score>d.data().score) await updateDoc(doc(db,'leaderboard',d.id),{score:Number(score),timestamp:new Date().toISOString()});
    }else{
      await addDoc(collection(db,'leaderboard'),{playerName,score:Number(score),timestamp:new Date().toISOString()});
    }
  }catch(e){console.warn(e);}
}

window.startGame=function(){
  const inp=document.getElementById('playerName');
  const n=inp.value.trim();
  if(!n){inp.classList.add('shake-inp');setTimeout(()=>inp.classList.remove('shake-inp'),400);return;}
  playerName=n;
  document.getElementById('nameOverlay').classList.add('hidden');
  document.getElementById('dispName').textContent=n;
  if(audioCtx) audioCtx.resume();
  sndLevelUp();
  initGame();
};
window.restartGame=function(){
  document.getElementById('gameOverModal').style.display='none';
  initGame();
};
