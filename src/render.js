// 画像プリロード
const SKULL_IMG_CACHE = {};
const SKULL_IMG_LOADED = {};
function preloadImages() {
  SKULLS.forEach(skull => {
    const img = new Image();
    img.onload = () => { SKULL_IMG_LOADED[skull.id] = true; };
    img.src = SKULL_IMAGES[skull.id];
    SKULL_IMG_CACHE[skull.id] = img;
  });
}

function drawSkullShape(c, skull, cx, cy, scale) {
  const img = SKULL_IMG_CACHE[skull.id];
  if (!img || !SKULL_IMG_LOADED[skull.id]) return;
  const [iw, ih] = SKULL_SIZES[skull.id] || [skull.rw, skull.rh];
  const maxW = 70 * scale, maxH = 56 * scale;
  const s = Math.min(maxW / iw, maxH / ih);
  const w = iw * s, h = ih * s;
  c.save();
  c.drawImage(img, cx - w/2, cy - h/2, w, h);
  c.restore();
}

function drawFrame() {
  ctx.clearRect(0,0,CANVAS_W,CANVAS_H);
  const grad=ctx.createLinearGradient(0,0,0,CANVAS_H);
  grad.addColorStop(0,'#0e0b06'); grad.addColorStop(1,'#1a1208');
  ctx.fillStyle=grad; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

  ctx.strokeStyle='rgba(90,64,32,0.3)'; ctx.lineWidth=0.5;
  for(let y=ISLAND_Y;y>0;y-=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CANVAS_W,y);ctx.stroke();}

  // 島の描画
  ctx.fillStyle='#3d2b1a';
  ctx.fillRect(CANVAS_W/2 - ISLAND_W/2, ISLAND_Y - ISLAND_T/2, ISLAND_W, ISLAND_T);
  ctx.fillStyle='#5a4020';
  ctx.fillRect(CANVAS_W/2 - ISLAND_W/2, ISLAND_Y - ISLAND_T/2, ISLAND_W, 2);
  // 段差（左右）
  ctx.fillStyle='#3d2b1a';
  ctx.fillRect(CANVAS_W/2 - ISLAND_W/2, ISLAND_Y - ISLAND_T/2 - 16, 4, 16);
  ctx.fillRect(CANVAS_W/2 + ISLAND_W/2 - 4, ISLAND_Y - ISLAND_T/2 - 16, 4, 16);
  ctx.fillStyle='#5a4020';
  ctx.fillRect(CANVAS_W/2 - ISLAND_W/2, ISLAND_Y - ISLAND_T/2 - 16, 2, 16);
  ctx.fillRect(CANVAS_W/2 + ISLAND_W/2 - 4, ISLAND_Y - ISLAND_T/2 - 16, 2, 16);

  const bodies = Composite.allBodies(world);
  for(const body of bodies){
    if(body.label==='island'||body.label==='wall') continue;
    const skull=body.skullData||{};
    const img = SKULL_IMG_CACHE[skull.id];
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    if(body===currentBody){ctx.shadowColor='rgba(200,169,110,0.6)';ctx.shadowBlur=12;}
    if(img && SKULL_IMG_LOADED[skull.id]){
      const s = getBodyScale(skull);
      const w = skull.rw * s, h = skull.rh * s;
      const ox = body.renderOffsetX || 0;
      const oy = body.renderOffsetY || 0;
      ctx.drawImage(img, -w/2 + ox, -h/2 + oy, w, h);
    } else {
      // フォールバック：図形描画
      const verts=body.vertices;
      ctx.beginPath(); ctx.moveTo(verts[0].x-body.position.x,verts[0].y-body.position.y);
      for(let i=1;i<verts.length;i++) ctx.lineTo(verts[i].x-body.position.x,verts[i].y-body.position.y);
      ctx.closePath();
      ctx.fillStyle=skull.color||'#d0c4a8'; ctx.fill();
    }
    ctx.restore();
  }

  if(placedBodies.length>0){
    let minY=ISLAND_Y;
    for(const b of placedBodies){if(b.bounds.min.y<minY) minY=b.bounds.min.y;}
    document.getElementById('height-display').textContent=Math.round((ISLAND_Y-minY)*0.5)+' cm';
  }

  if(!gameOver){
    for(const b of placedBodies){
      if(b.position.y > ISLAND_Y + 60 || b.position.y > CANVAS_H){triggerGameOver();break;}
    }
    if(!gameOver && currentBody && currentBody.position.y > CANVAS_H){triggerGameOver();}
  }
}
