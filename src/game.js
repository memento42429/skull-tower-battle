
function triggerGameOver() {
  gameOver=true;
  const skull=lastCollapseSkull||SKULLS[0];
  document.getElementById('final-score-text').textContent=`SCORE: ${score} pt`;
  document.getElementById('sp-name-jp').textContent  = skull.nameJp;
  document.getElementById('sp-name-sci').textContent = skull.nameSci;
  document.getElementById('sp-fact').textContent     = skull.fact;
  const link = document.getElementById('sp-link');
  if(skull.url){ link.href = skull.url; link.style.display='block'; }
  else { link.style.display='none'; }
  document.getElementById('overlay').classList.add('visible');
}

let rotateTimer = null;
const ROTATE_SPEED = 0.05; // ラジアン/フレーム

function startRotate() {
  if(isDropping || gameOver || !currentBody) return;
  if(rotateTimer) return;
  rotateTimer = setInterval(()=>{
    if(currentBody && !isDropping) Body.setAngle(currentBody, currentBody.angle + ROTATE_SPEED);
  }, 16);
}

function stopRotate() {
  if(rotateTimer){ clearInterval(rotateTimer); rotateTimer = null; }
}

canvas.addEventListener('mousemove',(e)=>{
  if(isDropping||gameOver) return;
  const rect=canvas.getBoundingClientRect();
  dropX=Math.max(20,Math.min(CANVAS_W-20,e.clientX-rect.left));
  if(currentBody) Body.setPosition(currentBody,{x:dropX,y:DROP_Y});
  dropGuide.style.left=dropX+'px'; dropGuide.style.height=CANVAS_H+'px'; dropGuide.style.display='block';
});
canvas.addEventListener('mousedown',()=>{ startRotate(); });
canvas.addEventListener('mouseup',()=>{ stopRotate(); if(!gameOver) dropCurrent(); });
canvas.addEventListener('touchmove',(e)=>{
  e.preventDefault();
  if(isDropping||gameOver) return;
  const rect=canvas.getBoundingClientRect();
  dropX=Math.max(20,Math.min(CANVAS_W-20,e.touches[0].clientX-rect.left));
  if(currentBody) Body.setPosition(currentBody,{x:dropX,y:DROP_Y});
},{passive:false});
canvas.addEventListener('touchstart',(e)=>{ e.preventDefault(); startRotate(); },{passive:false});
canvas.addEventListener('touchend',(e)=>{ stopRotate(); if(!gameOver) dropCurrent(); });

function buildRuler() {
  const ruler=document.getElementById('ruler'); ruler.innerHTML='';
  for(let y=ISLAND_Y;y>=0;y-=80){
    const mark=document.createElement('div');
    mark.className='ruler-mark'; mark.style.position='absolute';
    mark.style.bottom=(100-y/CANVAS_H*100)+'%';
    mark.textContent=Math.round((ISLAND_Y-y)*0.5);
    ruler.appendChild(mark);
  }
}

// ============================================================
// メインループ
// ============================================================
let lastTime=0;
function loop(time){
  const delta=time-lastTime; lastTime=time;
  Engine.update(engine,Math.min(delta,33));
  drawFrame();
  requestAnimationFrame(loop);
}

function restartGame(){
  document.getElementById('overlay').classList.remove('visible');
  Composite.clear(world,false); initEngine();
  nextSkull=pickRandomSkull(); spawnNext();
  document.getElementById('height-display').textContent='0 cm';
}

preloadImages();
initEngine(); buildRuler();
nextSkull=pickRandomSkull(); spawnNext();
requestAnimationFrame(loop);
