// Self-contained Canvas platformer shown in the preview panel while a build runs.
// Uses srcDoc so it tears down the moment the generated html lands.
// Layout: flex column (header + canvas-wrapper + footer) so canvas.clientWidth/Height
// are non-zero immediately — position:fixed gave offsetWidth=0 before layout settled.
export const WYBER_GAME_SRC = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Building...</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#09090b;font-family:system-ui,sans-serif;display:flex;flex-direction:column}
#hdr{
  flex-shrink:0;height:40px;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 14px;background:#09090b;
  border-bottom:1px solid rgba(139,92,246,0.25);
}
#hdr-l{display:flex;align-items:center;gap:8px}
.dot{width:8px;height:8px;border-radius:50%;background:#8b5cf6;animation:pulse 1.4s ease-in-out infinite}
#hdr-t{font:600 12px system-ui;color:#a78bfa}
#hdr-s{font:600 12px monospace;color:#fbbf24}
#wrap{flex:1;position:relative;overflow:hidden}
canvas{position:absolute;top:0;left:0;width:100%;height:100%;display:block}
#ftr{
  flex-shrink:0;height:28px;
  display:flex;align-items:center;justify-content:center;gap:20px;
  background:rgba(9,9,11,0.9);font:11px monospace;color:#52525b;
}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
</style>
</head>
<body>
<div id="hdr">
  <div id="hdr-l">
    <div class="dot"></div>
    <span id="hdr-t">&#x1F3D7; Building your full production suite &mdash; auth, analytics, settings + your features (~10 min)</span>
  </div>
  <span id="hdr-s">&#x26A1; 0 credits</span>
</div>
<div id="wrap"><canvas id="cvs"></canvas></div>
<div id="ftr">
  <span>&#x2190; &#x2192; move</span>
  <span>&#x2191; / Space &mdash; jump (x2)</span>
  <span>dodge bugs &bull; collect credits</span>
</div>
<script>
(function(){
  var wrap = document.getElementById('wrap');
  var canvas = document.getElementById('cvs');
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0;

  function resize() {
    W = canvas.width = wrap.clientWidth || wrap.offsetWidth || 400;
    H = canvas.height = wrap.clientHeight || wrap.offsetHeight || 300;
  }

  // Resize now and again after first paint to catch any layout delay
  resize();
  requestAnimationFrame(function(){ resize(); });
  window.addEventListener('resize', resize);

  var GRAVITY = 0.55, JUMP_V = -12, GROUND_H = 55;
  function groundTop(){ return H - GROUND_H; }

  var plr = { x:70, y:0, w:22, h:26, vy:0, onGround:false, jumps:0 };
  var speed, score, frame, dead;
  var platforms, coins, bugs, particles, bgCodes;

  function makeCode(){
    var labels=['{}','<>','=>','//','[]','++','()','fn','if','&&'];
    return{
      x:Math.random()*(W||400),
      y:Math.random()*((H||300)*0.8)+20,
      txt:labels[Math.floor(Math.random()*labels.length)],
      alpha:0.03+Math.random()*0.04,
      spd:0.2+Math.random()*0.4,
    };
  }

  function reset(){
    speed=3.5; score=0; frame=0; dead=false;
    plr.y=groundTop()-plr.h; plr.vy=0; plr.onGround=true; plr.jumps=0;
    platforms=[]; coins=[]; bugs=[]; particles=[];
    bgCodes=[];
    for(var i=0;i<25;i++) bgCodes.push(makeCode());
    document.getElementById('hdr-s').textContent='⚡ 0 credits';
  }

  function spawnPlatform(){
    var pY=groundTop()-70-Math.random()*120;
    var pW=75+Math.random()*80;
    var pX=W+Math.random()*60;
    platforms.push({x:pX,y:pY,w:pW,h:10});
    if(Math.random()>0.35) coins.push({x:pX+pW/2,y:pY-22,r:9,alive:true});
  }

  function spawnBug(){
    var bH=18+Math.random()*16;
    bugs.push({x:W+30,y:groundTop()-bH,w:20,h:bH});
  }

  function spawnCoin(){
    var cY=groundTop()-70-Math.random()*90;
    coins.push({x:W+20,y:cY,r:9,alive:true});
  }

  function addParticles(x,y,color){
    for(var i=0;i<8;i++){
      particles.push({x:x,y:y,vx:(Math.random()-0.5)*6,vy:(Math.random()-0.5)*6-2,life:1,color:color});
    }
  }

  var keys={};
  function handleJump(){
    if(dead){reset();return;}
    if(plr.jumps<2){ plr.vy=JUMP_V; plr.jumps++; plr.onGround=false; }
  }

  canvas.setAttribute('tabindex','0');
  canvas.focus();
  document.addEventListener('keydown',function(e){
    if((e.code==='Space'||e.code==='ArrowUp')&&!keys[e.code]){ handleJump(); e.preventDefault(); }
    keys[e.code]=true;
  });
  document.addEventListener('keyup',function(e){ keys[e.code]=false; });
  canvas.addEventListener('click',handleJump);
  canvas.addEventListener('touchstart',function(e){ e.preventDefault(); handleJump(); },{passive:false});

  function update(){
    if(dead) return;
    frame++;
    speed=Math.min(10,3.5+frame*0.0015);

    if(keys['ArrowLeft']) plr.x=Math.max(20,plr.x-3);
    if(keys['ArrowRight']) plr.x=Math.min(W*0.45,plr.x+4);

    plr.vy+=GRAVITY; plr.y+=plr.vy; plr.onGround=false;

    if(plr.y+plr.h>=groundTop()){
      plr.y=groundTop()-plr.h; plr.vy=0; plr.onGround=true; plr.jumps=0;
    }

    for(var i=0;i<platforms.length;i++){
      var p=platforms[i];
      if(plr.vy>=0&&plr.x+plr.w>p.x&&plr.x<p.x+p.w&&
         plr.y+plr.h>=p.y&&plr.y+plr.h<=p.y+p.h+12){
        plr.y=p.y-plr.h; plr.vy=0; plr.onGround=true; plr.jumps=0;
      }
    }

    if(plr.y>H+50){ dead=true; return; }

    for(var i=0;i<platforms.length;i++) platforms[i].x-=speed;
    for(var i=0;i<coins.length;i++) coins[i].x-=speed;
    for(var i=0;i<bugs.length;i++) bugs[i].x-=speed;
    for(var i=0;i<particles.length;i++){
      var pt=particles[i]; pt.x+=pt.vx; pt.y+=pt.vy; pt.vy+=0.15; pt.life-=0.05;
    }

    for(var i=0;i<coins.length;i++){
      var c=coins[i]; if(!c.alive) continue;
      var dx=plr.x+plr.w/2-c.x, dy=plr.y+plr.h/2-c.y;
      if(Math.sqrt(dx*dx+dy*dy)<c.r+12){
        c.alive=false; score+=10;
        addParticles(c.x,c.y,'#fbbf24');
        document.getElementById('hdr-s').textContent='⚡ '+score+' credits';
      }
    }

    for(var i=0;i<bugs.length;i++){
      var b=bugs[i];
      if(plr.x+plr.w-4>b.x&&plr.x+4<b.x+b.w&&
         plr.y+plr.h-4>b.y&&plr.y+4<b.y+b.h){
        dead=true; addParticles(plr.x+plr.w/2,plr.y+plr.h/2,'#8b5cf6'); return;
      }
    }

    platforms=platforms.filter(function(p){return p.x+p.w>-50;});
    coins=coins.filter(function(c){return c.x>-20;});
    bugs=bugs.filter(function(b){return b.x+b.w>-50;});
    particles=particles.filter(function(p){return p.life>0;});

    var lastP=platforms[platforms.length-1];
    if(!lastP||lastP.x<W-200) spawnPlatform();
    var bugInterval=Math.max(65,160-frame*0.05);
    if(frame%Math.round(bugInterval)===0) spawnBug();
    if(frame%95===55) spawnCoin();
  }

  function drawPlayer(){
    var x=plr.x, y=plr.y;
    var leg=Math.floor(frame/6)%2;
    ctx.fillStyle='#8b5cf6'; ctx.fillRect(x+2,y+9,plr.w-4,plr.h-9);
    ctx.fillStyle='#fde68a'; ctx.beginPath(); ctx.arc(x+plr.w/2,y+7,7,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#f59e0b'; ctx.fillRect(x+2,y+1,plr.w-4,5); ctx.fillRect(x-1,y+4,plr.w+2,3);
    ctx.fillStyle='#1c1917'; ctx.fillRect(x+plr.w/2+1,y+5,2,2);
    ctx.fillStyle='#6d28d9'; ctx.fillRect(x-3,y+11,4,8); ctx.fillRect(x+plr.w-1,y+11,4,8);
    if(plr.onGround){
      ctx.fillRect(x+3,y+plr.h-8,6,8); ctx.fillRect(x+plr.w-9,y+plr.h-8,6,8);
      if(leg===0) ctx.fillRect(x+3,y+plr.h-10,6,8);
      else ctx.fillRect(x+plr.w-9,y+plr.h-10,6,8);
    } else {
      ctx.fillRect(x+3,y+plr.h-6,6,6); ctx.fillRect(x+plr.w-9,y+plr.h-6,6,6);
    }
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#09090b'; ctx.fillRect(0,0,W,H);

    for(var i=0;i<bgCodes.length;i++){
      var cd=bgCodes[i]; cd.x-=cd.spd;
      if(cd.x<-20){ cd.x=W+10; cd.y=Math.random()*H*0.7+20; }
      ctx.fillStyle='rgba(139,92,246,'+cd.alpha+')';
      ctx.font='11px monospace'; ctx.textAlign='left';
      ctx.fillText(cd.txt,cd.x,cd.y);
    }

    ctx.fillStyle='#18181b'; ctx.fillRect(0,groundTop(),W,GROUND_H);
    ctx.fillStyle='#8b5cf6'; ctx.fillRect(0,groundTop(),W,2);

    for(var i=0;i<platforms.length;i++){
      var p=platforms[i];
      ctx.fillStyle='#27272a'; ctx.fillRect(p.x,p.y,p.w,p.h);
      ctx.fillStyle='#6d28d9'; ctx.fillRect(p.x,p.y,p.w,2);
    }

    ctx.textAlign='center'; ctx.textBaseline='middle';
    for(var i=0;i<coins.length;i++){
      var c=coins[i]; if(!c.alive) continue;
      var pulse=0.7+0.3*Math.sin(frame*0.12+c.x*0.05);
      ctx.fillStyle='rgba(251,191,36,'+(0.2*pulse)+')';
      ctx.beginPath(); ctx.arc(c.x,c.y,c.r+5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fbbf24'; ctx.beginPath(); ctx.arc(c.x,c.y,c.r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#78350f'; ctx.font='bold 9px monospace'; ctx.fillText('C',c.x,c.y);
    }
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';

    for(var i=0;i<bugs.length;i++){
      var b=bugs[i];
      ctx.fillStyle='#ef4444'; ctx.fillRect(b.x,b.y,b.w,b.h);
      ctx.fillStyle='#991b1b';
      ctx.fillRect(b.x+4,b.y-5,2,5); ctx.fillRect(b.x+b.w-6,b.y-5,2,5);
      ctx.fillStyle='#fff';
      ctx.fillRect(b.x+2,b.y+3,5,4); ctx.fillRect(b.x+b.w-7,b.y+3,5,4);
      ctx.fillStyle='#991b1b';
      ctx.fillRect(b.x+4,b.y+4,2,2); ctx.fillRect(b.x+b.w-6,b.y+4,2,2);
      ctx.fillStyle='#fca5a5'; ctx.font='7px monospace';
      ctx.textAlign='center'; ctx.fillText('bug',b.x+b.w/2,b.y+b.h-2); ctx.textAlign='left';
    }

    for(var i=0;i<particles.length;i++){
      var pt=particles[i];
      ctx.globalAlpha=pt.life; ctx.fillStyle=pt.color;
      ctx.fillRect(pt.x-2,pt.y-2,4,4);
    }
    ctx.globalAlpha=1;

    if(!dead) drawPlayer();

    ctx.fillStyle='rgba(139,92,246,0.35)';
    ctx.font='11px monospace'; ctx.textAlign='right';
    ctx.fillText(Math.floor(frame*0.1)+'m',W-8,H-6);
    ctx.textAlign='left';

    if(dead){
      ctx.fillStyle='rgba(9,9,11,0.85)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#e4e4e7'; ctx.font='bold 22px system-ui';
      ctx.textAlign='center'; ctx.fillText('A bug got you!',W/2,H/2-24);
      ctx.fillStyle='#8b5cf6'; ctx.font='15px system-ui';
      ctx.fillText('Credits collected: '+score,W/2,H/2+8);
      ctx.fillStyle='#52525b'; ctx.font='12px system-ui';
      ctx.fillText('Tap or press Space to try again',W/2,H/2+35);
      ctx.textAlign='left';
    }
  }

  function loop(){ update(); draw(); requestAnimationFrame(loop); }

  reset();
  loop();
})();
</script>
</body>
</html>`
