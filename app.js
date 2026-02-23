(() => {
  "use strict";

  const SLIDE_MS = 6500;
  const slides = Array.from(document.querySelectorAll(".slide"));
  const stage = document.getElementById("stage");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const playBtn = document.getElementById("play");
  const status = document.getElementById("status");

  let idx = 0;
  let playing = true;
  let tHandle = null;

  // --- "Positions successives" (croix bleues) ---
  function drawCross(ctx, x, y, size = 16, lineW = 6) {
    ctx.save();
    ctx.strokeStyle = "#0000ff";
    ctx.lineWidth = lineW;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - size/2, y - size/2);
    ctx.lineTo(x + size/2, y + size/2);
    ctx.moveTo(x - size/2, y + size/2);
    ctx.lineTo(x + size/2, y - size/2);
    ctx.stroke();
    ctx.restore();
  }

  function animateCrosses(slideEl, points, stepMs = 90) {
    const canvas = slideEl.querySelector("canvas.overlay");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let start = null;
    function frame(ts) {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const k = Math.min(points.length, 1 + Math.floor(elapsed / stepMs));

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < k; i++) {
        const [x, y] = points[i];
        drawCross(ctx, x, y);
      }

      if (k < points.length) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // Points calibrés à partir du rendu des diapositives du PPTX (1280×720)
  const ptsSlide3 = [[306.0, 388.0], [343.06666666666666, 388.5422222222222], [380.1333333333333, 390.1688888888889], [417.2, 392.88], [454.26666666666665, 396.67555555555555], [491.33333333333337, 401.55555555555554], [528.4, 407.52], [565.4666666666667, 414.56888888888886], [602.5333333333333, 422.70222222222225], [639.5999999999999, 431.91999999999996], [676.6666666666667, 442.22222222222223], [713.7333333333333, 453.60888888888894], [750.8, 466.08000000000004], [787.8666666666667, 479.6355555555556], [824.9333333333334, 494.27555555555557], [862.0, 510.0]];
  const ptsSlide4 = [[611.0, 388.0], [611.0, 391.6111111111111], [611.0, 402.44444444444446], [611.0, 420.5], [611.0, 445.77777777777777], [611.0, 478.27777777777777], [611.0, 518.0]];

  // Click on slides 3/4 → replay the intended animation
  slides.forEach((s) => {
    const id = Number(s.dataset.id);
    if (id === 3) {
      s.addEventListener("click", () => animateCrosses(s, ptsSlide3));
    }
    if (id === 4) {
      s.addEventListener("click", () => animateCrosses(s, ptsSlide4));
    }
  });

  function show(i) {
    idx = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("active", k === idx));
    status.textContent = `${idx + 1}/${slides.length}`;

    // stop overlays when leaving the slide
    slides.forEach((s) => {
      const c = s.querySelector("canvas.overlay");
      if (c) c.getContext("2d").clearRect(0, 0, c.width, c.height);
    });
  }

  function scheduleNext() {
    if (tHandle) clearTimeout(tHandle);
    if (!playing) return;
    tHandle = setTimeout(() => {
      show(idx + 1);
      scheduleNext();
    }, SLIDE_MS);
  }

  prevBtn.addEventListener("click", () => { show(idx - 1); scheduleNext(); });
  nextBtn.addEventListener("click", () => { show(idx + 1); scheduleNext(); });
  playBtn.addEventListener("click", () => {
    playing = !playing;
    playBtn.textContent = playing ? "⏯️ Pause" : "▶️ Lecture";
    scheduleNext();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") prevBtn.click();
    if (e.key === "ArrowRight") nextBtn.click();
    if (e.key === " ") { e.preventDefault(); playBtn.click(); }
  });

  show(0);
  scheduleNext();
})();
