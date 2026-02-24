(() => {
"use strict";

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const progress = document.getElementById("progress");

const W = canvas.width;
const H = canvas.height;

let slide = 0;
let lastT = performance.now();

const assets = {};
const assetList = [
  ["s1bg","assets/slide1_bg.jpg"],
  ["boatNoBall","assets/boat_mast_no_ball.png"],
  ["ballBig","assets/ball_big.png"]
];

function loadImage(src){
  return new Promise((res,rej)=>{
    const im=new Image();
    im.onload=()=>res(im);
    im.onerror=rej;
    im.src=src;
  });
}

async function loadAll(){
  for(const [k,src] of assetList){
    assets[k]=await loadImage(src);
  }
}

function updateProgress(){
  progress.textContent=`Diapo ${slide+1} / 4`;
}

function setSlide(i){
  slide=i;
  updateProgress();
  if(slide===0){
    s1.running=false;
    s1.y=s1.y0;
  }
}

prevBtn.onclick=()=>setSlide(Math.max(0,slide-1));
nextBtn.onclick=()=>setSlide(Math.min(3,slide+1));

/* ---------------- DIAPO 1 ---------------- */

const s1={
  running:false,
  y0:170,
  yEnd:440,   // position du pont du bateau
  y:170,
  g:1500,
  t:0
};

function startS1(){
  if(!s1.running){
    s1.running=true;
    s1.t=0;
  }
}

function stepS1(dt){
  if(!s1.running) return;
  s1.t+=dt;
  s1.y=s1.y0+0.5*s1.g*s1.t*s1.t;
  if(s1.y>=s1.yEnd){
    s1.y=s1.yEnd;
    s1.running=false;
  }
}

function drawS1(){
  ctx.drawImage(assets.s1bg,0,0,W,H);

  const boat=assets.boatNoBall;
  const scale=0.6;
  const bw=boat.width*scale;
  const bh=boat.height*scale;
  const bx=W/2-bw/2;
  const by=400;
  ctx.drawImage(boat,bx,by,bw,bh);

  const ball=assets.ballBig;
  const bs=0.15;
  const bw2=ball.width*bs;
  const bh2=ball.height*bs;
  ctx.drawImage(ball,W/2-bw2/2,s1.y-bh2/2,bw2,bh2);
}

/* ------------------------------------------ */

canvas.addEventListener("click",()=>{
  if(slide===0){
    startS1();
  }
});

function loop(tNow){
  const dt=(tNow-lastT)/1000;
  lastT=tNow;

  ctx.clearRect(0,0,W,H);

  if(slide===0){
    stepS1(dt);
    drawS1();
  }

  requestAnimationFrame(loop);
}

loadAll().then(()=>{
  setSlide(0);
  requestAnimationFrame(loop);
});

})();
