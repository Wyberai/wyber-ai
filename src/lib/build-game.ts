// Self-contained game screen shown in the preview panel while a first build runs.
// Three games: Runner (platformer), Snake, Breakout — user picks via header tabs.
// Rendered as srcDoc in an iframe; tears down the moment generated html lands.
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
  flex-shrink:0;height:42px;
  display:flex;align-items:center;gap:8px;
  padding:0 12px;background:#09090b;
  border-bottom:1px solid rgba(139,92,246,0.25);
}
#hdr-l{display:flex;align-items:center;gap:8px;flex:1;min-width:0;overflow:hidden}
.dot{width:8px;height:8px;border-radius:50%;background:#8b5cf6;animation:pulse 1.4s ease-in-out infinite;flex-shrink:0}
#hdr-t{font:600 11px system-ui;color:#a78bfa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#hdr-s{font:700 12px monospace;color:#fbbf24;flex-shrink:0}
#tabs{display:flex;gap:3px;flex-shrink:0}
.tab{
  background:none;border:1px solid rgba(139,92,246,0.22);border-radius:6px;
  color:#52525b;cursor:pointer;font:600 11px system-ui;padding:3px 9px;
  transition:all 0.15s;white-space:nowrap;
}
.tab:hover{border-color:rgba(139,92,246,0.5);color:#a78bfa}
.tab.on{background:rgba(139,92,246,0.14);border-color:#8b5cf6;color:#c4b5fd}
#wrap{flex:1;min-height:0;position:relative;overflow:hidden}
canvas{position:absolute;top:0;left:0;width:100%;height:100%;display:block;outline:none}
#ftr{
  flex-shrink:0;height:26px;
  display:flex;align-items:center;justify-content:center;
  background:rgba(9,9,11,0.9);font:10px monospace;color:#3f3f46;
}
#ctrl{letter-spacing:0.02em}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
</style>
</head>
<body>
<div id="hdr">
  <div id="hdr-l">
    <div class="dot"></div>
    <span id="hdr-t">&#x1F3D7; Coding your full app &mdash; auth, dashboard, settings + every feature you asked for</span>
  </div>
  <span id="hdr-s">&#x26A1; 0 cr</span>
  <div id="tabs">
    <button class="tab on" data-g="runner">&#x1F3C3; Runner</button>
    <button class="tab" data-g="snake">&#x1F40D; Snake</button>
    <button class="tab" data-g="breakout">&#x1F3AF; Breakout</button>
  </div>
</div>
<div id="wrap"><canvas id="cvs" tabindex="0"></canvas></div>
<div id="ftr"><span id="ctrl">&#x2190; &#x2192; move &bull; &#x2191; / Space jump (x2) &bull; dodge bugs, collect credits</span></div>
<script>
(function(){
  var wrap=document.getElementById('wrap');
  var cvs=document.getElementById('cvs');
  var ctx=cvs.getContext('2d');
  var W=0,H=0,score=0,curGame='runner',animId=null;

  function resize(){
    W=cvs.width=wrap.clientWidth||wrap.offsetWidth||400;
    H=cvs.height=wrap.clientHeight||wrap.offsetHeight||300;
  }
  resize();
  requestAnimationFrame(resize);
  window.addEventListener('resize',function(){resize();init();});

  function setScore(s){score=s;document.getElementById('hdr-s').textContent='\\u26A1 '+s+' cr';}
  function setCtrl(t){document.getElementById('ctrl').textContent=t;}

  // ── tabs ───────────────────────────────────────────────────────────────
  document.querySelectorAll('.tab').forEach(function(b){
    b.addEventListener('click',function(){
      document.querySelectorAll('.tab').forEach(function(x){x.classList.remove('on');});
      b.classList.add('on');
      if(animId){cancelAnimationFrame(animId);animId=null;}
      curGame=b.getAttribute('data-g');
      setScore(0);
      init();
      loop();
    });
  });

  // ── keys ────────────────────────────────────────────────────────────────
  var keys={};
  document.addEventListener('keydown',function(e){
    var k=e.code;
    if(!keys[k]){
      if(curGame==='runner') rKeyDown(k);
      else if(curGame==='snake') sKeyDown(k);
      else bKeyDown(k);
    }
    keys[k]=true;
    if('Space ArrowUp ArrowDown ArrowLeft ArrowRight'.indexOf(k)>=0) e.preventDefault();
  });
  document.addEventListener('keyup',function(e){keys[e.code]=false;});
  cvs.addEventListener('click',function(){
    if(curGame==='runner') rClick();
    else if(curGame==='snake') sClick();
    else bClick();
  });
  cvs.focus();

  function init(){
    if(curGame==='runner') rInit();
    else if(curGame==='snake') sInit();
    else bInit();
  }

  // ══════════════════════════════════════════════════════════════════════
  //  GAME 1 — RUNNER  (dodge bugs, collect credits)
  // ══════════════════════════════════════════════════════════════════════
  var GV=0.55,JV=-12,GH=55;
  function gTop(){return H-GH;}
  var P,rSpd,rF,rDead,plats,rCoins,rBugs,rParts,bgC;

  function mkCode(){
    var l=['{}','<>','=>','//','[]','++','()','fn','if','&&'];
    return{x:Math.random()*W,y:Math.random()*H*0.8+20,
      t:l[0|Math.random()*l.length],a:0.03+Math.random()*0.04,s:0.2+Math.random()*0.4};
  }

  function rInit(){
    P={x:70,y:0,w:22,h:26,vy:0,on:false,j:0};
    rSpd=3.5;rF=0;rDead=false;
    plats=[];rCoins=[];rBugs=[];rParts=[];bgC=[];
    for(var i=0;i<25;i++) bgC.push(mkCode());
    setScore(0);
    setCtrl('\\u2190 \\u2192 move  \\u00B7  \\u2191/Space jump (x2)  \\u00B7  dodge bugs, collect credits');
  }

  function rKeyDown(k){if(k==='Space'||k==='ArrowUp') rJump();}
  function rClick(){rJump();}
  function rJump(){
    if(rDead){rInit();return;}
    if(P.j<2){P.vy=JV;P.j++;P.on=false;}
  }

  function addPart(x,y,c){
    for(var i=0;i<8;i++)
      rParts.push({x:x,y:y,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6-2,l:1,c:c});
  }

  function rSpawnPlat(){
    var py=gTop()-70-Math.random()*120,pw=75+Math.random()*80,px=W+Math.random()*60;
    plats.push({x:px,y:py,w:pw,h:10});
    if(Math.random()>.35) rCoins.push({x:px+pw/2,y:py-22,r:9,a:true});
  }

  function rUpd(){
    if(rDead) return;
    rF++;rSpd=Math.min(10,3.5+rF*0.0015);
    if(keys.ArrowLeft) P.x=Math.max(20,P.x-3);
    if(keys.ArrowRight) P.x=Math.min(W*0.45,P.x+4);
    P.vy+=GV;P.y+=P.vy;P.on=false;
    if(P.y+P.h>=gTop()){P.y=gTop()-P.h;P.vy=0;P.on=true;P.j=0;}
    for(var i=0;i<plats.length;i++){
      var pl=plats[i];
      if(P.vy>=0&&P.x+P.w>pl.x&&P.x<pl.x+pl.w&&P.y+P.h>=pl.y&&P.y+P.h<=pl.y+pl.h+12){
        P.y=pl.y-P.h;P.vy=0;P.on=true;P.j=0;
      }
    }
    if(P.y>H+50){rDead=true;return;}
    for(var i=0;i<plats.length;i++) plats[i].x-=rSpd;
    for(var i=0;i<rCoins.length;i++) rCoins[i].x-=rSpd;
    for(var i=0;i<rBugs.length;i++) rBugs[i].x-=rSpd;
    for(var i=0;i<rParts.length;i++){
      var pt=rParts[i];pt.x+=pt.vx;pt.y+=pt.vy;pt.vy+=0.15;pt.l-=0.05;
    }
    for(var i=0;i<rCoins.length;i++){
      var c=rCoins[i];if(!c.a) continue;
      var dx=P.x+P.w/2-c.x,dy=P.y+P.h/2-c.y;
      if(Math.sqrt(dx*dx+dy*dy)<c.r+12){c.a=false;setScore(score+10);addPart(c.x,c.y,'#fbbf24');}
    }
    for(var i=0;i<rBugs.length;i++){
      var b=rBugs[i];
      if(P.x+P.w-4>b.x&&P.x+4<b.x+b.w&&P.y+P.h-4>b.y&&P.y+4<b.y+b.h){
        rDead=true;addPart(P.x+P.w/2,P.y+P.h/2,'#8b5cf6');return;
      }
    }
    plats=plats.filter(function(p){return p.x+p.w>-50;});
    rCoins=rCoins.filter(function(c){return c.x>-20;});
    rBugs=rBugs.filter(function(b){return b.x+b.w>-50;});
    rParts=rParts.filter(function(p){return p.l>0;});
    var lp=plats[plats.length-1];
    if(!lp||lp.x<W-200) rSpawnPlat();
    var bi=Math.max(65,160-rF*0.05);
    if(rF%Math.round(bi)===0) rBugs.push({x:W+30,y:gTop()-22,w:20,h:22});
    if(rF%95===55) rCoins.push({x:W+20,y:gTop()-70-Math.random()*90,r:9,a:true});
  }

  function rDraw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#09090b';ctx.fillRect(0,0,W,H);
    for(var i=0;i<bgC.length;i++){
      var cd=bgC[i];cd.x-=cd.s;
      if(cd.x<-20){cd.x=W+10;cd.y=Math.random()*H*0.7+20;}
      ctx.fillStyle='rgba(139,92,246,'+cd.a+')';
      ctx.font='11px monospace';ctx.textAlign='left';ctx.fillText(cd.t,cd.x,cd.y);
    }
    ctx.fillStyle='#18181b';ctx.fillRect(0,gTop(),W,GH);
    ctx.fillStyle='#8b5cf6';ctx.fillRect(0,gTop(),W,2);
    for(var i=0;i<plats.length;i++){
      var pl=plats[i];
      ctx.fillStyle='#27272a';ctx.fillRect(pl.x,pl.y,pl.w,pl.h);
      ctx.fillStyle='#6d28d9';ctx.fillRect(pl.x,pl.y,pl.w,2);
    }
    ctx.textAlign='center';ctx.textBaseline='middle';
    for(var i=0;i<rCoins.length;i++){
      var c=rCoins[i];if(!c.a) continue;
      var pulse=0.7+0.3*Math.sin(rF*0.12+c.x*0.05);
      ctx.fillStyle='rgba(251,191,36,'+(0.2*pulse)+')';
      ctx.beginPath();ctx.arc(c.x,c.y,c.r+5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fbbf24';ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#78350f';ctx.font='bold 9px monospace';ctx.fillText('C',c.x,c.y);
    }
    ctx.textAlign='left';ctx.textBaseline='alphabetic';
    for(var i=0;i<rBugs.length;i++){
      var b=rBugs[i];
      ctx.fillStyle='#ef4444';ctx.fillRect(b.x,b.y,b.w,b.h);
      ctx.fillStyle='#fca5a5';ctx.font='7px monospace';
      ctx.textAlign='center';ctx.fillText('bug',b.x+b.w/2,b.y+b.h-2);ctx.textAlign='left';
    }
    for(var i=0;i<rParts.length;i++){
      var pt=rParts[i];ctx.globalAlpha=pt.l;ctx.fillStyle=pt.c;ctx.fillRect(pt.x-2,pt.y-2,4,4);
    }
    ctx.globalAlpha=1;
    // player
    var x=P.x,y=P.y,leg=Math.floor(rF/6)%2;
    ctx.fillStyle='#8b5cf6';ctx.fillRect(x+2,y+9,P.w-4,P.h-9);
    ctx.fillStyle='#fde68a';ctx.beginPath();ctx.arc(x+P.w/2,y+7,7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f59e0b';ctx.fillRect(x+2,y+1,P.w-4,5);ctx.fillRect(x-1,y+4,P.w+2,3);
    ctx.fillStyle='#6d28d9';
    if(P.on){
      ctx.fillRect(x+3,y+P.h-8,6,8);ctx.fillRect(x+P.w-9,y+P.h-8,6,8);
      if(leg===0) ctx.fillRect(x+3,y+P.h-10,6,8);
      else ctx.fillRect(x+P.w-9,y+P.h-10,6,8);
    } else {
      ctx.fillRect(x+3,y+P.h-6,6,6);ctx.fillRect(x+P.w-9,y+P.h-6,6,6);
    }
    ctx.fillStyle='rgba(139,92,246,0.35)';
    ctx.font='11px monospace';ctx.textAlign='right';
    ctx.fillText(Math.floor(rF*0.1)+'m',W-8,H-6);
    ctx.textAlign='left';
    if(rDead){
      ctx.fillStyle='rgba(9,9,11,0.88)';ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#e4e4e7';ctx.font='bold 22px system-ui';ctx.textAlign='center';
      ctx.fillText('A bug got you!',W/2,H/2-24);
      ctx.fillStyle='#8b5cf6';ctx.font='15px system-ui';
      ctx.fillText('Credits: '+score,W/2,H/2+8);
      ctx.fillStyle='#52525b';ctx.font='12px system-ui';
      ctx.fillText('Tap or Space to try again',W/2,H/2+35);
      ctx.textAlign='left';
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  //  GAME 2 — SNAKE  (eat credits, grow longer)
  // ══════════════════════════════════════════════════════════════════════
  var CELL=20;
  var snake,sDir,sNext,sFood,sDead,sF,sSpd,sGrow;

  function sInit(){
    var cols=Math.floor((W||400)/CELL),rows=Math.floor((H||300)/CELL);
    snake=[{x:Math.floor(cols/2),y:Math.floor(rows/2)}];
    sDir={x:1,y:0};sNext={x:1,y:0};
    sDead=false;sF=0;sSpd=9;sGrow=0;
    sSpawnFood();
    setScore(0);
    setCtrl('Arrow keys to steer  \\u00B7  eat credits to grow  \\u00B7  don\\u2019t hit walls or yourself');
  }

  function sSpawnFood(){
    var cols=Math.floor((W||400)/CELL),rows=Math.floor((H||300)/CELL);
    var fx,fy,ok;
    do{
      fx=1+(Math.random()*(cols-2)|0);fy=1+(Math.random()*(rows-2)|0);ok=true;
      for(var i=0;i<snake.length;i++) if(snake[i].x===fx&&snake[i].y===fy){ok=false;break;}
    }while(!ok);
    sFood={x:fx,y:fy};
  }

  function sKeyDown(k){
    if(sDead){sInit();return;}
    if(k==='ArrowUp'&&sDir.y!==1) sNext={x:0,y:-1};
    else if(k==='ArrowDown'&&sDir.y!==-1) sNext={x:0,y:1};
    else if(k==='ArrowLeft'&&sDir.x!==1) sNext={x:-1,y:0};
    else if(k==='ArrowRight'&&sDir.x!==-1) sNext={x:1,y:0};
  }
  function sClick(){if(sDead) sInit();}

  function sUpd(){
    sF++;
    if(sF%sSpd!==0) return;
    sDir=sNext;
    var cols=Math.floor((W||400)/CELL),rows=Math.floor((H||300)/CELL);
    var hd={x:snake[0].x+sDir.x,y:snake[0].y+sDir.y};
    if(hd.x<0||hd.x>=cols||hd.y<0||hd.y>=rows){sDead=true;return;}
    for(var i=0;i<snake.length;i++) if(snake[i].x===hd.x&&snake[i].y===hd.y){sDead=true;return;}
    snake.unshift(hd);
    if(hd.x===sFood.x&&hd.y===sFood.y){
      setScore(score+15);sGrow+=3;
      sSpd=Math.max(3,sSpd-0.4);
      sSpawnFood();
    }
    if(sGrow>0) sGrow--;
    else snake.pop();
  }

  function sDraw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#09090b';ctx.fillRect(0,0,W,H);
    // subtle grid
    ctx.fillStyle='rgba(139,92,246,0.05)';
    var cols=Math.floor((W||400)/CELL),rows=Math.floor((H||300)/CELL);
    for(var gx=0;gx<cols;gx++) for(var gy=0;gy<rows;gy++)
      ctx.fillRect(gx*CELL+CELL/2-1,gy*CELL+CELL/2-1,2,2);
    // food
    if(sFood){
      var pulse=0.7+0.3*Math.sin(sF*0.09);
      ctx.fillStyle='rgba(251,191,36,'+(0.22*pulse)+')';
      ctx.beginPath();ctx.arc(sFood.x*CELL+CELL/2,sFood.y*CELL+CELL/2,CELL/2+4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fbbf24';
      ctx.beginPath();ctx.arc(sFood.x*CELL+CELL/2,sFood.y*CELL+CELL/2,CELL/2-1,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#78350f';ctx.font='bold 9px monospace';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('C',sFood.x*CELL+CELL/2,sFood.y*CELL+CELL/2);
      ctx.textAlign='left';ctx.textBaseline='alphabetic';
    }
    // snake body
    for(var i=snake.length-1;i>=0;i--){
      var seg=snake[i];
      var t=1-i/Math.max(snake.length,1);
      var alpha=0.25+0.75*t;
      ctx.fillStyle='rgba(139,92,246,'+alpha+')';
      var r=i===0?3:2;
      ctx.beginPath();
      ctx.roundRect(seg.x*CELL+2,seg.y*CELL+2,CELL-4,CELL-4,r);
      ctx.fill();
    }
    // head details
    if(snake.length>0){
      var h=snake[0];
      ctx.fillStyle='#fde68a';
      ctx.fillRect(h.x*CELL+4,h.y*CELL+4,3,3);
      ctx.fillRect(h.x*CELL+CELL-7,h.y*CELL+4,3,3);
    }
    if(sDead){
      ctx.fillStyle='rgba(9,9,11,0.9)';ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#e4e4e7';ctx.font='bold 22px system-ui';ctx.textAlign='center';
      ctx.fillText('You crashed!',W/2,H/2-24);
      ctx.fillStyle='#8b5cf6';ctx.font='15px system-ui';
      ctx.fillText('Credits: '+score,W/2,H/2+8);
      ctx.fillStyle='#52525b';ctx.font='12px system-ui';
      ctx.fillText('Any arrow key to restart',W/2,H/2+35);
      ctx.textAlign='left';
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  //  GAME 3 — BREAKOUT  (ship features, don't drop the ball)
  // ══════════════════════════════════════════════════════════════════════
  var ROWS=4,BCOLS=9,BH=16,BGAP=3,PAD_H=10,BALL_R=7;
  var bPad,bBall,bBricks,bDead,bWon,bF,bLives,bMx=null;
  var BLABELS=['deploy','build','fix','ship','test','push','auth','api','css','sql','cdn','git','ui','orm','ws'];

  function bInit(){
    bF=0;bDead=false;bWon=false;bLives=3;bMx=null;
    var pw=Math.min(100,W*0.27);
    bPad={x:W/2-pw/2,y:H-40,w:pw,h:PAD_H,spd:6};
    bBall={x:W/2,y:H-55,vx:3.2*(Math.random()>.5?1:-1),vy:-3.8,r:BALL_R};
    bBricks=[];
    var totalW=W-24,bw=Math.floor((totalW-(BGAP*(BCOLS-1)))/BCOLS),sx=12,sy=38;
    var cols=['#7c3aed','#6d28d9','#5b21b6','#4c1d95'];
    for(var r=0;r<ROWS;r++) for(var c=0;c<BCOLS;c++){
      bBricks.push({x:sx+c*(bw+BGAP),y:sy+r*(BH+BGAP),w:bw,h:BH,alive:true,
        lbl:BLABELS[(r*BCOLS+c)%BLABELS.length],col:cols[r]});
    }
    setScore(0);
    setCtrl('\\u2190 \\u2192 / mouse to move paddle  \\u00B7  break all blocks  \\u00B7  don\\u2019t drop the ball');
  }

  function bKeyDown(k){
    if((bDead||bWon)&&(k==='Space'||k==='ArrowLeft'||k==='ArrowRight')){bInit();return;}
  }
  function bClick(){if(bDead||bWon) bInit();}

  cvs.addEventListener('mousemove',function(e){
    var r=cvs.getBoundingClientRect();
    bMx=(e.clientX-r.left)*(cvs.width/r.width);
  });
  cvs.addEventListener('touchmove',function(e){
    e.preventDefault();
    var r=cvs.getBoundingClientRect();
    bMx=(e.touches[0].clientX-r.left)*(cvs.width/r.width);
  },{passive:false});

  function bUpd(){
    bF++;
    if(keys.ArrowLeft) bPad.x=Math.max(0,bPad.x-bPad.spd);
    if(keys.ArrowRight) bPad.x=Math.min(W-bPad.w,bPad.x+bPad.spd);
    if(bMx!==null) bPad.x=Math.max(0,Math.min(W-bPad.w,bMx-bPad.w/2));
    if(bDead||bWon) return;
    bBall.x+=bBall.vx;bBall.y+=bBall.vy;
    // walls
    if(bBall.x-BALL_R<=0){bBall.x=BALL_R;bBall.vx=Math.abs(bBall.vx);}
    if(bBall.x+BALL_R>=W){bBall.x=W-BALL_R;bBall.vx=-Math.abs(bBall.vx);}
    if(bBall.y-BALL_R<=0){bBall.y=BALL_R;bBall.vy=Math.abs(bBall.vy);}
    // paddle
    if(bBall.vy>0&&bBall.y+BALL_R>=bPad.y&&bBall.y-BALL_R<=bPad.y+bPad.h&&
       bBall.x>=bPad.x-2&&bBall.x<=bPad.x+bPad.w+2){
      bBall.vy=-Math.abs(bBall.vy);
      bBall.vx+=((bBall.x-(bPad.x+bPad.w/2))/(bPad.w/2))*2;
      var spd=Math.sqrt(bBall.vx*bBall.vx+bBall.vy*bBall.vy);
      if(spd>7){bBall.vx=bBall.vx/spd*7;bBall.vy=bBall.vy/spd*7;}
    }
    // fall off
    if(bBall.y-BALL_R>H){
      bLives--;
      if(bLives<=0){bDead=true;return;}
      bBall.x=bPad.x+bPad.w/2;bBall.y=bPad.y-BALL_R-2;
      bBall.vx=3.2*(Math.random()>.5?1:-1);bBall.vy=-3.8;
    }
    // bricks
    var alive=0;
    for(var i=0;i<bBricks.length;i++){
      var b=bBricks[i];if(!b.alive){continue;}alive++;
      if(bBall.x+BALL_R>b.x&&bBall.x-BALL_R<b.x+b.w&&
         bBall.y+BALL_R>b.y&&bBall.y-BALL_R<b.y+b.h){
        b.alive=false;setScore(score+8);alive--;
        var fromTop=bBall.y-(b.y+b.h/2),fromLeft=bBall.x-(b.x+b.w/2);
        if(Math.abs(fromTop/b.h)>Math.abs(fromLeft/b.w)) bBall.vy=-bBall.vy;
        else bBall.vx=-bBall.vx;
        break;
      }
    }
    if(alive===0) bWon=true;
  }

  function bDraw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#09090b';ctx.fillRect(0,0,W,H);
    // lives
    for(var i=0;i<3;i++){
      ctx.beginPath();
      ctx.fillStyle=i<bLives?'#8b5cf6':'#27272a';
      ctx.arc(W-18-i*18,14,5,0,Math.PI*2);ctx.fill();
    }
    // bricks
    for(var i=0;i<bBricks.length;i++){
      var b=bBricks[i];if(!b.alive) continue;
      ctx.fillStyle=b.col;ctx.fillRect(b.x,b.y,b.w,b.h);
      ctx.fillStyle='rgba(255,255,255,0.07)';ctx.fillRect(b.x,b.y,b.w,3);
      ctx.fillStyle='rgba(253,230,138,0.9)';ctx.font='7px monospace';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(b.lbl,b.x+b.w/2,b.y+b.h/2);
      ctx.textAlign='left';ctx.textBaseline='alphabetic';
    }
    // paddle
    ctx.fillStyle='#8b5cf6';ctx.fillRect(bPad.x,bPad.y,bPad.w,bPad.h);
    ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(bPad.x,bPad.y,bPad.w,3);
    // ball glow
    ctx.fillStyle='rgba(139,92,246,0.28)';
    ctx.beginPath();ctx.arc(bBall.x,bBall.y,BALL_R+5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#c4b5fd';
    ctx.beginPath();ctx.arc(bBall.x,bBall.y,BALL_R,0,Math.PI*2);ctx.fill();
    if(bDead){
      ctx.fillStyle='rgba(9,9,11,0.9)';ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#e4e4e7';ctx.font='bold 22px system-ui';ctx.textAlign='center';
      ctx.fillText('Deploy failed!',W/2,H/2-24);
      ctx.fillStyle='#8b5cf6';ctx.font='15px system-ui';
      ctx.fillText('Credits: '+score,W/2,H/2+8);
      ctx.fillStyle='#52525b';ctx.font='12px system-ui';
      ctx.fillText('Space or click to retry',W/2,H/2+35);
      ctx.textAlign='left';
    }
    if(bWon){
      ctx.fillStyle='rgba(9,9,11,0.9)';ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#fbbf24';ctx.font='bold 22px system-ui';ctx.textAlign='center';
      ctx.fillText('All features shipped! \\uD83D\\uDE80',W/2,H/2-24);
      ctx.fillStyle='#8b5cf6';ctx.font='15px system-ui';
      ctx.fillText('Credits: '+score,W/2,H/2+8);
      ctx.fillStyle='#52525b';ctx.font='12px system-ui';
      ctx.fillText('Space or click for next round',W/2,H/2+35);
      ctx.textAlign='left';
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  //  MAIN LOOP
  // ══════════════════════════════════════════════════════════════════════
  function loop(){
    if(curGame==='runner'){rUpd();rDraw();}
    else if(curGame==='snake'){sUpd();sDraw();}
    else{bUpd();bDraw();}
    animId=requestAnimationFrame(loop);
  }

  rInit();
  loop();
})();
</script>
</body>
</html>`;
