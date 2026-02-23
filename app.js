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
    ["s3overlay", "assets/slide3_quai_overlay.png"],
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

  // For slides with internal looping animations.
  let s1Fall = { y: 0, vy: 0, wait: 0 };
  let s2ObjX = 0;
  let s3 = { running: false, t: 0, marks: [] };
  let s4 = { running: false, t: 0, marks: [] };

  // Tunables (picked to match the provided images)
  const S1 = {
    // approximate mast top / landing point inside the central boat image
    // (coordinates are in 1280x720 slide space)
    x: 640,
    y0: 170,
    y1: 520,
    duration: 1.3, // seconds
    pause: 0.7,
  };

  const S2 = {
    y: 330,
    h: 520,          // desired rendered height (px)
    speed: 240,      // px/s
  };

  const S3 = {
    // boat + mast (without ball) moves left->right
    y: 410,
    h: 266,          // rendered height for boatNoBall (~0.45 of source)
    speed: 210,      // px/s
    // ball relative to boat image (source coordinates from analysis: x=364,y=24 in the original composite 1093x592)
    ballOffsetSrc: { x: 364, y: 24 },
    // fall parameters (in shore frame)
    fallDuration: 1.25,
    g: 1050,         // px/s^2 (visual)
    markEvery: 0.09, // seconds
  };

  const S4 = {
    // "vue du bateau": ball falls vertically on a static boat
    // ball target is visually near the little red dot already on the slide;
    // we overlay a vertical series of X markers at that x.
    x: 640,
    y0: 250,
    y1: 520,
    duration: 1.25,
    markEvery: 0.09,
  };

  function resetSlideState(i) {
    slideT = 0;
    hideHint();

    if (i === 0) {
      s1Fall = { y: S1.y0, vy: 0, wait: 0 };
    }
    if (i === 1) {
      // start off-screen left
      const scale = S2.h / assets.s2obj.height;
      const w = assets.s2obj.width * scale;
      s2ObjX = -w - 40;
      showHint("<b>Diapo 2</b> : l'ensemble <i>bateau + boulet</i> traverse l'écran à vitesse constante (boucle).<br><b>Clique “Suivant”</b> pour passer à la diapo 3.");
      // IMPORTANT: diapo 2 reste en “pause auto” jusqu'au clic suivant (demande de l'utilisateur)
      playing = false;
      playBtn.textContent = "▶️ Lecture";
    }
    if (i === 2) {
      s3 = { running: false, t: 0, marks: [] };
      showHint("<b>Diapo 3</b> : clique dans la diapo pour lancer l'animation (bateau + boulet) et afficher les positions successives (croix).");
      // Pause auto until click inside slide 3
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

  function updateProgress() {
    progress.textContent = `Diapo ${slide + 1} / 4`;
  }

  function setSlide(i) {
    slide = (i + 4) % 4;
    resetSlideState(slide);
  }

  // ---------- draw background full ----------
  function drawBg(im) {
    // images are already 1280x720, just draw
    ctx.drawImage(im, 0, 0, W, H);
  }

  // ---------- Slide 1: ball falls on the boat photo ----------
  function stepSlide1(dt) {
    // loop: fall then pause then reset
    const fallTime = S1.duration;
    if (s1Fall.wait > 0) {
      s1Fall.wait -= dt;
      if (s1Fall.wait <= 0) s1Fall.y = S1.y0;
      return;
    }

    // Parametric (smooth) fall
    const t = clamp(slideT / fallTime, 0, 1);
    const ease = t * t * (3 - 2 * t);
    s1Fall.y = lerp(S1.y0, S1.y1, ease);

    if (t >= 1) s1Fall.wait = S1.pause;
  }

  function drawSlide1() {
    drawBg(assets.s1bg);

    // ball (big)
    const b = assets.ballBig;
    const scale = 0.16; // visually reasonable on 1280x720
    const bw = b.width * scale, bh = b.height * scale;
    ctx.drawImage(b, S1.x - bw / 2, s1Fall.y - bh / 2, bw, bh);
  }

  // ---------- Slide 2: boat+ball traverse left->right continuously ----------
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

  // ---------- Slide 3: boat moves; ball falls; crosses mark successive positions ----------
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

    // boat x
    const boat = assets.boatNoBall;
    const scale = S3.h / boat.height;
    const boatW = boat.width * scale;

    const boatX = -boatW * 0.2 + S3.speed * s3.t;

    // ball position in shore frame
    const ox = S3.ballOffsetSrc.x * scale;
    const oy = S3.ballOffsetSrc.y * scale;

    const ballX = boatX + ox;
    const t = s3.t;
    const y = (S3.y + oy) + 0.5 * S3.g * t * t;

    // add marker regularly
    const lastMarkT = (s3.marks.length ? s3.marks[s3.marks.length - 1].t : -1);
    if (lastMarkT < 0 || (t - lastMarkT) >= S3.markEvery) {
      s3.marks.push({ x: ballX, y: y, t: t });
    }

    // stop once the ball reaches the quay top zone (approx y ~ 520)
    if (y > 520) {
      s3.running = false;
    }
  }

  function drawSlide3() {
    drawBg(assets.s3bg);

    // (optional) overlay: quai label / bite (kept if present; it's sized for the original PPT layout)
    // We anchor it to the lower-left so it doesn't cover titles.
    const ov = assets.s3overlay;
    const ovScale = 0.62;
    const ovW = ov.width * ovScale, ovH = ov.height * ovScale;
    ctx.drawImage(ov, 0, H - ovH, ovW, ovH);

    const boat = assets.boatNoBall;
    const scale = S3.h / boat.height;
    const boatW = boat.width * scale, boatH = boat.height * scale;

    const boatX = -boatW * 0.2 + S3.speed * s3.t;
    ctx.drawImage(boat, boatX, S3.y, boatW, boatH);

    // ball
    const ball = assets.ballSmall;
    const ballScale = 1.0; // already small
    const bw = ball.width * ballScale, bh = ball.height * ballScale;

    const ox = S3.ballOffsetSrc.x * scale;
    const oy = S3.ballOffsetSrc.y * scale;

    const t = s3.t;
    const ballX = boatX + ox;
    const ballY = (S3.y + oy) + 0.5 * S3.g * t * t;
    ctx.drawImage(ball, ballX - bw / 2, ballY - bh / 2, bw, bh);

    // crosses
    for (const m of s3.marks) {
      drawX(m.x, m.y, 14, 5, "#0a2cff");
    }
  }

  // ---------- Slide 4: boat frame – vertical fall with crosses ----------
  function startSlide4() {
    s4.running = true;
    s4.t = 0;
    s4.marks = [];
    hideHint();
    playing = true;
    playBtn.textContent = "⏸️ Pause";
  }

  function stepSlide4(dt) {
    if (!s4.running) return;
    s4.t += dt;

    const t = s4.t;
    // parametric fall (smooth) for marker placement
    const T = S4.duration;
    const tt = clamp(t / T, 0, 1);
    const ease = tt * tt * (3 - 2 * tt);
    const y = lerp(S4.y0, S4.y1, ease);

    const lastMarkT = (s4.marks.length ? s4.marks[s4.marks.length - 1].t : -1);
    if (lastMarkT < 0 || (t - lastMarkT) >= S4.markEvery) {
      s4.marks.push({ x: S4.x, y: y, t: t });
    }
    if (tt >= 1) s4.running = false;
  }

  function drawSlide4() {
    drawBg(assets.s4bg);

    // crosses (vertical)
    for (const m of s4.marks) drawX(m.x, m.y, 14, 5, "#0a2cff");
  }

  // ---------- main loop ----------
  function step(tNow) {
    const dt = Math.min(0.05, (tNow - lastT) / 1000);
    lastT = tNow;

    if (playing) slideT += dt;

    // update
    if (slide === 0) {
      stepSlide1(dt);
    } else if (slide === 1) {
      stepSlide2(dt);
    } else if (slide === 2) {
      stepSlide3(dt);
    } else if (slide === 3) {
      stepSlide4(dt);
    }

    // draw
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
