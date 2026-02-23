(() => {
  "use strict";

  const SLIDE_W = 1280;
  const SLIDE_H = 720;

  const slides = [
  {
    "id": 1,
    "layers": [
      {
        "kind": "text",
        "text": "Boulet de canon lâché du haut du mât d’un bateau :",
        "x": 0,
        "y": 0,
        "w": 1280,
        "h": 242,
        "font_size": 54.0,
        "bold": true,
        "color": null
      },
      {
        "kind": "img",
        "src": "assets/img_01.png",
        "x": 388,
        "y": 209,
        "w": 547,
        "h": 517
      },
      {
        "kind": "img",
        "src": "assets/img_02.gif",
        "x": 459,
        "y": 277,
        "w": 393,
        "h": 408
      },
      {
        "kind": "text",
        "text": "Décrire sa chute.",
        "x": 372,
        "y": 114,
        "w": 960,
        "h": 106,
        "font_size": 72.0,
        "bold": true,
        "color": "#000000"
      }
    ]
  },
  {
    "id": 2,
    "layers": [
      {
        "kind": "img",
        "src": "assets/img_03.jpg",
        "x": 0,
        "y": 163,
        "w": 1280,
        "h": 557
      },
      {
        "kind": "text",
        "text": "Le bateau se déplace à vitesse constante dans le référentiel du quai",
        "x": 160,
        "y": 20,
        "w": 960,
        "h": 129,
        "font_size": 40.0,
        "bold": true,
        "color": null
      },
      {
        "kind": "img",
        "src": "assets/img_04.gif",
        "x": -318,
        "y": 292,
        "w": 349,
        "h": 361
      },
      {
        "kind": "img",
        "src": "assets/img_05.gif",
        "x": 0,
        "y": -37,
        "w": 128,
        "h": 130
      },
      {
        "kind": "img",
        "src": "assets/img_06.gif",
        "x": 1191,
        "y": -9,
        "w": 92,
        "h": 93
      },
      {
        "kind": "img",
        "src": "assets/img_02.gif",
        "x": -238,
        "y": 209,
        "w": 95,
        "h": 98
      }
    ]
  },
  {
    "id": 3,
    "layers": [
      {
        "kind": "img",
        "src": "assets/img_03.jpg",
        "x": 0,
        "y": 163,
        "w": 1280,
        "h": 557
      },
      {
        "kind": "text",
        "text": "Le bateau se déplace à vitesse constante dans le référentiel du quai",
        "x": 160,
        "y": 20,
        "w": 960,
        "h": 129,
        "font_size": 40.0,
        "bold": true,
        "color": null
      },
      {
        "kind": "text",
        "text": "Cliquer pour démarrer l’animation et observer le mouvement de la boule",
        "x": 43,
        "y": 163,
        "w": 1216,
        "h": 475,
        "font_size": 16.0,
        "bold": false,
        "color": null
      },
      {
        "kind": "text",
        "text": "vitesse constante",
        "x": 330,
        "y": 496,
        "w": 205,
        "h": 23,
        "font_size": 16.0,
        "bold": true,
        "color": "#0000ff"
      },
      {
        "kind": "text",
        "text": "Par rapport au référentiel quai",
        "x": 164,
        "y": 594,
        "w": 960,
        "h": 129,
        "font_size": 44.0,
        "bold": true,
        "color": "#0409c8"
      }
    ]
  },
  {
    "id": 4,
    "layers": [
      {
        "kind": "img",
        "src": "assets/img_03.jpg",
        "x": 0,
        "y": 163,
        "w": 1280,
        "h": 557
      },
      {
        "kind": "text",
        "text": "Vue… du bateau !",
        "x": 43,
        "y": 48,
        "w": 1216,
        "h": 88,
        "font_size": 54.0,
        "bold": true,
        "color": null
      },
      {
        "kind": "text",
        "text": "Cliquer pour démarrer l’animation et observer le mouvement de la boule",
        "x": 43,
        "y": 163,
        "w": 1216,
        "h": 475,
        "font_size": 16.0,
        "bold": false,
        "color": null
      },
      {
        "kind": "text",
        "text": "Par rapport au référentiel bateau",
        "x": 164,
        "y": 594,
        "w": 960,
        "h": 129,
        "font_size": 44.0,
        "bold": true,
        "color": "#0409c8"
      }
    ]
  }
];

  const stage = document.getElementById("stage");
  const status = document.getElementById("status");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const playBtn = document.getElementById("playBtn");

  // slideshow timing
  const SLIDE_MS = 6500;

  let idx = 0;
  let playing = true;
  let tHandle = null;

  function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function px(n) { return `${n}px`; }

  function buildSlide(s) {
    const root = el("div", "slide");
    root.dataset.slideId = String(s.id);

    for (const layer of s.layers) {
      if (layer.kind === "img") {
        const img = el("img", "layer");
        img.src = layer.src;
        img.alt = "";
        img.style.left = px(layer.x);
        img.style.top = px(layer.y);
        img.style.width = px(layer.w);
        img.style.height = px(layer.h);
        root.appendChild(img);
      } else if (layer.kind === "text") {
        const d = el("div", "layer txt");
        d.innerHTML = layer.text;
        d.style.left = px(layer.x);
        d.style.top = px(layer.y);
        d.style.width = px(layer.w);
        d.style.height = px(layer.h);
        d.style.fontSize = px(layer.font_size || 24);
        d.style.fontWeight = layer.bold ? "700" : "400";
        d.style.fontStyle = layer.italic ? "italic" : "normal";
        if (layer.color) d.style.color = layer.color;
        root.appendChild(d);
      }
    }

    // Add simulations on slides 3 and 4
    if (s.id === 3 || s.id === 4) {
      const c = el("canvas", "sim");
      // internal resolution = slide size
      c.width = SLIDE_W;
      c.height = SLIDE_H;
      root.appendChild(c);

      const hint = el("div", "hint");
      hint.innerHTML = "<strong>🖱️ Clic :</strong> démarrer/relancer l’animation du boulet";
      root.appendChild(hint);

      attachSimulation(c, s.id);
    }

    return root;
  }

  // --- Simulation ---
  function attachSimulation(canvas, slideId) {
    const ctx = canvas.getContext("2d");
    let running = false;
    let startT = 0;

    // Background photo-like region is already in the slide via img_03.jpg.
    // We'll draw the ball + a simple mast marker to guide the eye.
    const mastX = 740;     // approx on background
    const mastTopY = 235;
    const deckY = 515;

    const g = 1400;        // px/s^2 (visual)
    const vBoat = 230;     // px/s (visual constant speed)
    const ballR = 10;

    function reset() {
      running = true;
      startT = performance.now();
      requestAnimationFrame(frame);
    }

    function frame(t) {
      if (!running) return;
      const dt = (t - startT) / 1000;

      // Motion model
      // Slide 3: "référentiel quai" → ball keeps horizontal velocity vBoat while falling.
      // Slide 4: "référentiel bateau" → ball falls vertically (horizontal relative speed 0).
      const vx = (slideId === 3) ? vBoat : 0;
      const x = mastX + vx * dt;
      const y = mastTopY + 0.5 * g * dt * dt;

      // stop when reaching deck area
      const yStop = deckY - ballR;
      const xStop = x;

      // redraw only the overlay (keep underlying slide visible)
      ctx.clearRect(0, 0, SLIDE_W, SLIDE_H);

      // mast marker (thin line) to show the "vertical" under the mast
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.65)";
      ctx.beginPath();
      ctx.moveTo(mastX, mastTopY);
      ctx.lineTo(mastX, deckY);
      ctx.stroke();
      ctx.restore();

      // ball
      const yy = Math.min(y, yStop);
      ctx.beginPath();
      ctx.arc(xStop, yy, ballR, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.fill();

      if (y >= yStop) {
        running = false;
        return;
      }
      requestAnimationFrame(frame);
    }

    canvas.addEventListener("click", () => {
      reset();
    });
  }

  // --- Mount ---
  const domSlides = slides.map(buildSlide);
  for (const s of domSlides) stage.insertBefore(s, stage.firstChild);

  function show(i) {
    idx = (i + domSlides.length) % domSlides.length;
    domSlides.forEach((s, k) => s.classList.toggle("active", k === idx));
    status.textContent = `${idx + 1}/${domSlides.length}`;
  }

  function scheduleNext() {
    if (tHandle) clearTimeout(tHandle);
    if (!playing) return;
    tHandle = setTimeout(() => {
      show(idx + 1);
      scheduleNext();
    }, SLIDE_MS);
  }

  prevBtn.addEventListener("click", () => {
    show(idx - 1);
    scheduleNext();
  });

  nextBtn.addEventListener("click", () => {
    show(idx + 1);
    scheduleNext();
  });

  playBtn.addEventListener("click", () => {
    playing = !playing;
    playBtn.textContent = playing ? "⏯️ Pause" : "▶️ Lecture";
    scheduleNext();
  });

  // keyboard
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { prevBtn.click(); }
    if (e.key === "ArrowRight") { nextBtn.click(); }
    if (e.key === " ") { e.preventDefault(); playBtn.click(); }
  });

  // start
  show(0);
  scheduleNext();
})();
