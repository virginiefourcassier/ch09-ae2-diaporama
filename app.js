(() => {
  "use strict";

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const hint = document.getElementById("hint");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const playBtn = document.getElementById("play");
  const progress = document.getElementById("progress");

  const W = canvas.width, H = canvas.height;

  // ---------- helpers ----------
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;

  function drawX(x, y, size, lineW, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineW;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - size, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x - size, y + size);
    ctx.lineTo(x + size, y - size);
    ctx.stroke();
    ctx.restore();
  }

  function showHint(html) {
    hint.innerHTML = html;
    hint.style.display = "block";
  }
  function hideHint() {
    hint.style.display = "none";
  }

  // ---------- assets ----------
  const assets = {};
  const assetList = [
    ["s1bg", "assets/slide1_bg.jpg"],
    ["s2bg", "assets/slide2_bg.jpg"],
    ["s3bg", "assets/slide3_bg.jpg"],
    ["s4bg", "assets/slide4_bg.jpg"],
    ["s2obj", "assets/slide2_obj.png"],
    ["s3overlay", "assets/slide3_quai_overlay.png"], // kept in assets, but NOT drawn anymore
    ["boatNoBall", "assets/boat_mast_no_ball.png"],
    ["ballBig", "assets/ball_big.png"],
    ["ballSmall", "assets/ball_small.png"],
  ];

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = src;
    });
  }

  async function loadAll() {
    for (const [k, src] of assetList) assets[k] = await loadImage(src);
  }

  // ---------- slide logic ----------
  let slide = 0;
  let playing = true;
  let lastT = performance.now();
  let slideT = 0;

  // For slides with internal animations.
  let s1Fall = { y: 0, done: false };
  let s2ObjX = 0;
  let s3 = { running: false, t: 0, marks: [] };
  let s4 = { running: false, t: 0, marks: [] };

  // Tunables
  const S1 = {
    x: 640,
    y0: 170,
    y1: 520,
    duration: 1.3,
    pause: 0.7,
  };

  const S2 = {
    // Must fit entirely in 720px height (avoid being cut off).
    y: 190,
    h: 520,
    speed: 240,
  };

  const S3 = {
    y: 410,
    h: 266,
    speed: 210,
    ballOffsetSrc: { x: 364, y: 24 },
    fallDuration: 1.25,
    g: 1050,
    markEvery: 0.09,
  };

  const S4 = {
    // Diapo 4: larger boat + ball, free-fall markers with increasing spacing
    boatH: 340,
    ball0: { x: 640, y: 280 },
    ballOffsetSrc: { x: 364, y: 24 },
    g: 1200,
    markEvery: 0.09,
  };

  function updateProgress() {
    progress.textContent = `Diapo ${slide + 1} / 4`;
  }

  function resetSlideState(i) {
    slideT = 0;
    hideHint();

    if (i === 0) {
      s1Fall = { y: S1.y0, done: false };
      playing = true;
      playBtn.textContent = "⏸️ Pause";
    }

    if (i === 1) {
      const scale = S2.h / assets.s2obj.height;
      const w = assets.s2obj.width * scale;
      s2ObjX = -w - 40;

      showHint("<b>Diapo 2</b> : l'ensemble <i>bateau + boulet</i> traverse l'écran à vitesse constante (boucle).<br><b>Clique “Suivant”</b> pour passer à la diapo 3.");
      // Diapo 2 stays paused automatically (loop continues only if user hits play)
      playing = false;
      playBtn.textContent = "▶️ Lecture";
    }

    if (i === 2) {
      s3 = { running: false, t: 0, marks: [] };
      showHint("<b>Diapo 3</b> : clique dans la diapo pour lancer l'animation (bateau + boulet) et afficher les positions successives (croix).");
      playing = false;
      playBtn.textContent = "▶️ Lecture";
    }

    if (i === 3) {
      s4 = { running: false, t: 0, marks: [] };
      showHint("<b>Diapo 4</b> : clique dans la diapo pour lancer l'animation (référentiel bateau : chute verticale).");
      playing = false;
      playBtn.textContent = "▶️ Lecture";
    }

    updateProgress();
  }

  function setSlide(i) {
    slide = (i + 4) % 4;
    resetSlideState(slide);
  }

  function drawBg(im) {
    ctx.drawImage(im, 0, 0, W, H);
  }

  // ---------- Slide 1: single fall ----------
  function stepSlide1() {
    if (s1Fall.done) return;

    const fallTime = S1.duration;
    const t = clamp(slideT / fallTime, 0, 1);
    const ease = t * t * (3 - 2 * t);
    s1Fall.y = lerp(S1.y0, S1.y1, ease);

    if (t >= 1) {
      s1Fall.done = true;
      s1Fall.y = S1.y1;
    }
  }

  function drawSlide1() {
    drawBg(assets.s1bg);

    const b = assets.ballBig;
    const scale = 0.16;
    const bw = b.width * scale, bh = b.height * scale;
    ctx.drawImage(b, S1.x - bw / 2, s1Fall.y - bh / 2, bw, bh);
  }

  // ---------- Slide 2: traverse L->R (visible fully) ----------
  function stepSlide2(dt) {
    const scale = S2.h / assets.s2obj.height;
    const w = assets.s2obj.width * scale;
    s2ObjX += S2.speed * dt;
    if (s2ObjX > W + 40) s2ObjX = -w - 40;
  }

  function drawSlide2() {
    drawBg(assets.s2bg);

    const im = assets.s2obj;
    const scale = S2.h / im.height;
    const w = im.width * scale, h = im.height * scale;
    ctx.drawImage(im, s2ObjX, S2.y, w, h);
  }

  // ---------- Slide 3: move + crosses (no quay overlay) ----------
  function startSlide3() {
    s3.running = true;
    s3.t = 0;
    s3.marks = [];
    hideHint();
    playing = true;
    playBtn.textContent = "⏸️ Pause";
  }

  function stepSlide3(dt) {
    if (!s3.running) return;

    s3.t += dt;

    const boat = assets.boatNoBall;
    const scale = S3.h / boat.height;
    const boatW = boat.width * scale;

    const boatX = -boatW * 0.2 + S3.speed * s3.t;

    const ox = S3.ballOffsetSrc.x * scale;
    const oy = S3.ballOffsetSrc.y * scale;

    const ballX = boatX + ox;
    const t = s3.t;
    const y = (S3.y + oy) + 0.5 * S3.g * t * t;

    const lastMarkT = (s3.marks.length ? s3.marks[s3.marks.length - 1].t : -1);
    if (lastMarkT < 0 || (t - lastMarkT) >= S3.markEvery) {
      s3.marks.push({ x: ballX, y: y, t: t });
    }

    if (y > 520) s3.running = false;
  }

  function drawSlide3() {
    drawBg(assets.s3bg);

    // Requested: remove beige "quai" box + big bollard -> DO NOT draw s3overlay

    const boat = assets.boatNoBall;
    const scale = S3.h / boat.height;
    const boatW = boat.width * scale, boatH = boat.height * scale;

    const boatX = -boatW * 0.2 + S3.speed * s3.t;
    ctx.drawImage(boat, boatX, S3.y, boatW, boatH);

    const ball = assets.ballSmall;
    const bw = ball.width, bh = ball.height;

    const ox = S3.ballOffsetSrc.x * scale;
    const oy = S3.ballOffsetSrc.y * scale;

    const t = s3.t;
    const ballX = boatX + ox;
    const ballY = (S3.y + oy) + 0.5 * S3.g * t * t;
    ctx.drawImage(ball, ballX - bw / 2, ballY - bh / 2, bw, bh);

    for (const m of s3.marks) drawX(m.x, m.y, 14, 5, "#0a2cff");
  }

  // ---------- Slide 4: larger boat+ball + free-fall crosses ----------
  function startSlide4() {
    s4.running = true;
    s4.t = 0;
    s4.marks = [{ x: S4.ball0.x, y: S4.ball0.y, t: 0 }]; // exact start
    hideHint();
    playing = true;
    playBtn.textContent = "⏸️ Pause";
  }

  function stepSlide4(dt) {
    if (!s4.running) return;
    s4.t += dt;

    const t = s4.t;
    const y0 = S4.ball0.y;
    const y = y0 + 0.5 * S4.g * t * t;

    const lastMarkT = (s4.marks.length ? s4.marks[s4.marks.length - 1].t : -1);
    if (lastMarkT < 0 || (t - lastMarkT) >= S4.markEvery) {
      s4.marks.push({ x: S4.ball0.x, y: y, t: t });
    }

    if (y > 520) s4.running = false;
  }

  function drawSlide4() {
    drawBg(assets.s4bg);

    const boat = assets.boatNoBall;
    const scale = S4.boatH / boat.height;
    const boatW = boat.width * scale, boatH = boat.height * scale;

    const ox = S4.ballOffsetSrc.x * scale;
    const oy = S4.ballOffsetSrc.y * scale;

    const boatX = S4.ball0.x - ox;
    const boatY = S4.ball0.y - oy;
    ctx.drawImage(boat, boatX, boatY, boatW, boatH);

    const ball = assets.ballBig;
    const ballScale = 0.18;
    const bw = ball.width * ballScale, bh = ball.height * ballScale;

    const t = s4.t;
    const ballX = S4.ball0.x;
    const ballY = S4.ball0.y + 0.5 * S4.g * t * t;
    ctx.drawImage(ball, ballX - bw / 2, ballY - bh / 2, bw, bh);

    for (const m of s4.marks) drawX(m.x, m.y, 14, 5, "#0a2cff");
  }

  // ---------- main loop ----------
  function step(tNow) {
    const dt = Math.min(0.05, (tNow - lastT) / 1000);
    lastT = tNow;

    if (playing) slideT += dt;

    if (slide === 0) stepSlide1(dt);
    if (slide === 1) stepSlide2(dt);
    if (slide === 2) stepSlide3(dt);
    if (slide === 3) stepSlide4(dt);

    ctx.clearRect(0, 0, W, H);
    if (slide === 0) drawSlide1();
    if (slide === 1) drawSlide2();
    if (slide === 2) drawSlide3();
    if (slide === 3) drawSlide4();

    requestAnimationFrame(step);
  }

  // ---------- interactions ----------
  prevBtn.addEventListener("click", () => setSlide(slide - 1));
  nextBtn.addEventListener("click", () => setSlide(slide + 1));
  playBtn.addEventListener("click", () => {
    playing = !playing;
    playBtn.textContent = playing ? "⏸️ Pause" : "▶️ Lecture";
  });

  canvas.addEventListener("click", () => {
    if (slide === 2 && !s3.running) startSlide3();
    if (slide === 3 && !s4.running) startSlide4();
  });

  // ---------- boot ----------
  loadAll().then(() => {
    setSlide(0);
    requestAnimationFrame(step);
  }).catch((e) => {
    console.error(e);
    showHint("Erreur de chargement des images. Vérifie le dépôt GitHub Pages (fichiers à la racine).");
  });
})();
