// Main interactivity + effects
const formSection = document.getElementById('formSection');
const cardSection = document.getElementById('cardSection');
const createBtn = document.getElementById('createBtn');
const demoBtn = document.getElementById('demoBtn');
const backBtn = document.getElementById('backBtn');
const nameInput = document.getElementById('nameInput');
const msgInput = document.getElementById('msgInput');
const titleText = document.getElementById('titleText');
const wishText = document.getElementById('wishText');
const bgCanvas = document.getElementById('bgCanvas');
const playPause = document.getElementById('playPause');
const downloadBtn = document.getElementById('downloadBtn');
const bgAudio = document.getElementById('bgAudio');

// Setup canvas
const ctx = bgCanvas.getContext('2d');
function resize(){ bgCanvas.width = bgCanvas.clientWidth; bgCanvas.height = bgCanvas.clientHeight; }
window.addEventListener('resize', resize);
resize();

// Particles & hearts
let particles = [];
let hearts = [];
let running = true;

function rand(min,max){ return Math.random()*(max-min)+min; }

function spawnParticles(n=80){
  for(let i=0;i<n;i++){
    particles.push({
      x: rand(0,bgCanvas.width),
      y: rand(0,bgCanvas.height),
      vx: rand(-0.4,0.4),
      vy: rand(-0.2,0.6),
      r: rand(0.8,2.6),
      hue: Math.random()*360
    });
  }
}

function spawnHeart(x,y){
  hearts.push({x,y, t:0, life:1 + Math.random()*0.8, size: 12 + Math.random()*18});
}

function drawHeart(x,y,size,fill){
  // simple heart path
  ctx.save(); ctx.translate(x,y);
  ctx.beginPath();
  ctx.moveTo(0, -size/4);
  ctx.bezierCurveTo(size/2, -size*0.9, size*1.2, size/6, 0, size);
  ctx.bezierCurveTo(-size*1.2, size/6, -size/2, -size*0.9, 0, -size/4);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.restore();
}

function update(dt){
  // particles float
  for(let p of particles){
    p.x += p.vx * dt * 60;
    p.y += p.vy * dt * 60;
    p.vy -= 0.002; // slight upward drift
    if(p.y < -10) p.y = bgCanvas.height + 10;
    if(p.x < -10) p.x = bgCanvas.width + 10;
    if(p.x > bgCanvas.width + 10) p.x = -10;
  }
  // hearts rise and fade
  for(let i=hearts.length-1;i>=0;i--){
    const h = hearts[i];
    h.t += dt;
    h.y -= 30 * dt;
    h.x += Math.sin(h.t*6) * 6 * dt * 60;
    h.life -= dt * 0.4;
    if(h.life <= 0) hearts.splice(i,1);
  }
}

function render(){
  ctx.clearRect(0,0,bgCanvas.width,bgCanvas.height);
  // subtle gradient overlay
  const g = ctx.createLinearGradient(0,0,0,bgCanvas.height);
  g.addColorStop(0,'rgba(10,6,20,0.6)');
  g.addColorStop(1,'rgba(4,0,8,0.5)');
  ctx.fillStyle = g; ctx.fillRect(0,0,bgCanvas.width,bgCanvas.height);

  // draw particles
  for(let p of particles){
    ctx.beginPath();
    ctx.fillStyle = `hsla(${p.hue},80%,65%,0.18)`;
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fill();
  }
  // draw hearts
  for(let h of hearts){
    const a = Math.max(0, Math.min(1, h.life));
    ctx.globalAlpha = a;
    drawHeart(h.x, h.y, h.size, `rgba(255,95,162,${0.9*a})`);
    ctx.globalAlpha = 1;
  }
}

let last = performance.now();
function loop(ts){
  const dt = (ts - last)/1000; last = ts;
  if(running){ update(dt); render(); }
  requestAnimationFrame(loop);
}
spawnParticles(140);
requestAnimationFrame(loop);

// Interaction
createBtn.addEventListener('click', ()=>{
  const name = nameInput.value.trim() || 'Bạn';
  const msg = msgInput.value.trim() || 'Chúc mừng sinh nhật!';
  titleText.textContent = `🎂 Happy Birthday ${name} 🎂`;
  wishText.textContent = msg;
  formSection.classList.add('hidden');
  cardSection.classList.remove('hidden');
  // spawn a few initial hearts
  for(let i=0;i<20;i++) spawnHeart(rand(40,bgCanvas.width-40), rand(bgCanvas.height*0.2, bgCanvas.height*0.8));
  // try to play audio (some browsers require user interaction)
  tryPlayAudio();
});

demoBtn.addEventListener('click', ()=>{
  nameInput.value = 'Minh';
  msgInput.value = 'Chúc bạn luôn hạnh phúc & nhiều niềm vui!';
});

backBtn.addEventListener('click', ()=>{
  cardSection.classList.add('hidden');
  formSection.classList.remove('hidden');
  // stop audio
  stopAudio();
});

// click on stage creates hearts
bgCanvas.addEventListener('click', (e)=>{
  const rect = bgCanvas.getBoundingClientRect();
  spawnHeart(e.clientX - rect.left, e.clientY - rect.top);
});

// play/pause audio & visual
playPause.addEventListener('click', ()=>{
  running = !running;
  playPause.textContent = running? '⏯️' : '⏸️';
  if(running) tryPlayAudio(); else stopAudio();
});

// download as image
downloadBtn.addEventListener('click', ()=>{
  // draw final composite to temp canvas
  const out = document.createElement('canvas');
  out.width = bgCanvas.width; out.height = bgCanvas.height;
  const octx = out.getContext('2d');
  // background
  octx.fillStyle = '#060010'; octx.fillRect(0,0,out.width,out.height);
  // copy particles/hearts by re-rendering (simple)
  // draw content overlay
  octx.drawImage(bgCanvas,0,0);
  // draw text (center)
  octx.fillStyle = '#ffffff'; octx.font = 'bold 48px sans-serif';
  octx.textAlign = 'center';
  octx.fillText(titleText.textContent, out.width/2, out.height/2 - 20);
  octx.font = '20px sans-serif';
  octx.fillText(wishText.textContent, out.width/2, out.height/2 + 40);
  const a = document.createElement('a');
  a.href = out.toDataURL('image/png');
  a.download = 'thiệp-sinh-nhật.png';
  a.click();
});

// Audio: try to load birthday.mp3 (if present), otherwise use WebAudio synth
let audioCtx = null;
let osc = null;
let gainNode = null;
let usingAudioFile = false;

async function tryPlayAudio(){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if(!bgAudio.src){
    // attempt to fetch birthday.mp3 in same folder
    // If not present, fallback to simple synth loop
    try{
      const resp = await fetch('birthday.mp3', {method:'HEAD'});
      if(resp.ok){
        bgAudio.src = 'birthday.mp3';
        usingAudioFile = true;
        await bgAudio.play();
        return;
      }
    }catch(e){ /* ignore */ }
  }
  // fallback: simple ambient synth (looped noise + oscillator)
  usingAudioFile = false;
  if(!osc){
    osc = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();
    const biquad = audioCtx.createBiquadFilter();
    biquad.type = 'lowpass'; biquad.frequency.value = 800;
    osc.type = 'sine'; osc.frequency.value = 220;
    osc.connect(biquad);
    biquad.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = 0.0005;
    osc.start();
    // slowly modulate
    setInterval(()=>{
      osc.frequency.value = 200 + Math.random()*160;
      gainNode.gain.value = 0.0006 + Math.random()*0.002;
    }, 1200);
  }
}

function stopAudio(){
  if(usingAudioFile){
    try{ bgAudio.pause(); bgAudio.currentTime = 0; }catch(e){}
  } else {
    try{ if(osc) { osc.stop(); osc = null; } }catch(e){}
    audioCtx = null;
  }
}
