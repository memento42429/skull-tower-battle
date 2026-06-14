// ============================================================
// ゲーム定数
// ============================================================
const CANVAS_W  = 280;
const CANVAS_H  = 480;
const DROP_Y    = 40;  // 役物の落下開始Y座標

// 島（台）の設定
const ISLAND_Y  = Math.round(CANVAS_H * 0.77); // 島の中心Y座標
const ISLAND_W  = 200;                          // 島の幅(px)
const ISLAND_T  = 12;                           // 島の厚さ(px)

// ゲームオーバー判定：島の縁よりGO_MARGIN px上を超えたら終了
const GO_MARGIN   = 30;
const GAME_OVER_Y = ISLAND_Y - GO_MARGIN;

let engine, world, currentBody, currentSkull, nextSkull;
let score = 0, dropX = CANVAS_W/2, isDropping = false, gameOver = false;
let placedBodies = [], lastCollapseSkull = null;

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-skull-canvas');
const nextCtx    = nextCanvas.getContext('2d');
const dropGuide  = document.getElementById('drop-guide');

function initEngine() {
  engine = Engine.create({ gravity: { y: 1.2 } });
  world  = engine.world;
  const island = Bodies.rectangle(CANVAS_W/2, ISLAND_Y, ISLAND_W, ISLAND_T, {isStatic:true, label:'island', friction:50, restitution:0.1});
  const STOPPER_H = 16;  // 段差の高さ（役物高さの約2/3）
  const STOPPER_W = 4;  // 段差の幅
  const stopperL = Bodies.rectangle(CANVAS_W/2 - ISLAND_W/2 + STOPPER_W/2, ISLAND_Y - STOPPER_H/2, STOPPER_W, STOPPER_H, {isStatic:true, label:'island', friction:50, restitution:0.0});
  const stopperR = Bodies.rectangle(CANVAS_W/2 + ISLAND_W/2 - STOPPER_W/2, ISLAND_Y - STOPPER_H/2, STOPPER_W, STOPPER_H, {isStatic:true, label:'island', friction:50, restitution:0.0});
  Composite.add(world, [island, stopperL, stopperR]);
  placedBodies=[]; currentBody=null; score=0; gameOver=false; isDropping=false; lastCollapseSkull=null;
  updateScore(0);
}

function pickRandomSkull() { return SKULLS[Math.floor(Math.random()*SKULLS.length)]; }
function getBodyScale(skull) { return skull.scale * 1.8; }

// ============================================================
// 役物ボディ生成
// Bodies.fromVertices はMatter.jsが内部で重心を再計算するため、
// 指定座標と実際のbody.positionがズレる。
// このズレを renderOffsetX/Y に記録し、描画時に補正する。
// ============================================================
function createSkullBody(skull, x, y) {
  const s = getBodyScale(skull);
  const scaledVerts = skull.verts.map(v=>({x:v.x*s, y:v.y*s}));
  // 指定した頂点群の視覚的中心（バウンディングボックス中心）
  const xs = scaledVerts.map(v=>v.x), ys = scaledVerts.map(v=>v.y);
  const visualCx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const visualCy = (Math.min(...ys) + Math.max(...ys)) / 2;

  const body = Bodies.fromVertices(x, y, scaledVerts, {
    restitution:0.0, friction:1.0, frictionStatic:10.0, frictionAir:0.05, density:0.05, label:skull.id,
  }, true);

  // Matter.jsが設定した重心と視覚的中心のズレを記録
  // body.position は fromVertices 後に Matter.js が再計算した重心
  // 指定座標(x,y)からのズレ = body.position - (x,y)
  // 視覚的中心は (x + visualCx, y + visualCy) になるべきなので
  // 描画オフセット = visualCx - (body.position.x - x)
  body.renderOffsetX = visualCx - (body.position.x - x);
  body.renderOffsetY = visualCy - (body.position.y - y);
  body.skullData = skull;
  return body;
}

function spawnNext() {
  if (!nextSkull) nextSkull = pickRandomSkull();
  currentSkull = nextSkull;
  nextSkull    = pickRandomSkull();
  currentBody  = createSkullBody(currentSkull, dropX, DROP_Y);
  Body.setStatic(currentBody, true);
  Composite.add(world, currentBody);
  isDropping = false;
  updateNextCard();
}

function dropCurrent() {
  if (!currentBody || isDropping || gameOver) return;
  Body.setStatic(currentBody, false);
  isDropping = true;
  const checkRest = setInterval(()=>{
    if (!currentBody){clearInterval(checkRest);return;}
    const speed = Math.sqrt(currentBody.velocity.x**2+currentBody.velocity.y**2);
    if (speed < 0.3 && isDropping) {
      placedBodies.push(currentBody); currentBody=null; clearInterval(checkRest);
      updateScore(score + Math.max(10, Math.round(Math.log10(currentSkull.weight + 1) * 20)));
      lastCollapseSkull = currentSkull;
      setTimeout(()=>{ if(!gameOver) spawnNext(); }, 300);
    }
  }, 100);
}

function updateScore(s) { score=s; document.getElementById('score-display').textContent=score; }

function updateNextCard() {
  const s = nextSkull;
  document.getElementById('next-name-jp').textContent  = s.nameJp;
  document.getElementById('next-name-sci').textContent = s.nameSci;
  document.getElementById('next-weight').textContent = `${s.weight} kg`;
  nextCtx.clearRect(0,0,80,64);
  drawSkullShape(nextCtx, s, 40, 32, 1.0);
}

