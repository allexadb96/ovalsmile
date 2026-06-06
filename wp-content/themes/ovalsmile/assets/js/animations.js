// ── Preloader ──────────────────────────────────────────────────────────────
(function () {
  document.documentElement.classList.add('is-loading');
  if (document.body) document.body.classList.add('is-loading');
  else document.addEventListener('DOMContentLoaded', () => document.body.classList.add('is-loading'));

  const pctEl   = document.querySelector('.preloader-pct');
  const toothEl = document.querySelector('.preloader-tooth');
  const topPanel = document.querySelector('.preloader-top');
  const botPanel = document.querySelector('.preloader-bottom');
  const content  = document.querySelector('.preloader-content');

  if (!pctEl) return;

  const counter = { val: 0 };
  let exitDone  = false;

  function updatePct(v) {
    if (pctEl) pctEl.childNodes[0].textContent = Math.round(v);
  }

  function runExit() {
    if (exitDone) return;
    exitDone = true;
    document.body.classList.remove('is-loading');

    const tl = gsap.timeline();
    tl.to(counter, {
      val: 100, duration: 0.4, ease: 'power1.in',
      onUpdate() { updatePct(counter.val); }
    })
    .to(content, { opacity: 0, duration: 0.25, ease: 'power2.in' }, '-=0.15')
    .to(topPanel,   { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '-=0.1')
    .to(botPanel,   { yPercent:  100, duration: 0.9, ease: 'power4.inOut' }, '<')
    .set('#preloader', { display: 'none' });
  }

  // Drive progress from resource loading
  gsap.to(counter, {
    val: 85, duration: 2.2, ease: 'power1.out',
    onUpdate() { updatePct(counter.val); }
  });

  // Tooth pulse while loading
  gsap.to(toothEl, { scale: 1.08, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut' });

  window.addEventListener('load', () => {
    gsap.killTweensOf(counter);
    // Small delay so user sees 100% momentarily
    gsap.delayedCall(0.3, runExit);
  });

  // Fallback: never stay longer than 6s
  gsap.delayedCall(6, runExit);
})();

document.addEventListener('DOMContentLoaded', () => {


  const canvas = document.getElementById('implant-canvas');
  if (canvas) {
    const ctx   = canvas.getContext('2d');
    const TOTAL = DENTIVA.totalFrames;
    const FPS   = DENTIVA.fps;
    const BASE  = DENTIVA.framesUrl;
    const frames = [];
    let loaded = 0, current = 0, playing = false;

    function resize() {
      const W = canvas.parentElement.offsetWidth || 380;
      canvas.width  = W;
      canvas.height = Math.round(W * 960 / 762);
    }
    resize();
    window.addEventListener('resize', () => { resize(); if (frames[current]) drawFrame(frames[current]); });

    function drawFrame(img) {
      if (!img) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cw = canvas.width, ch = canvas.height;
      const scale = Math.min(cw / (img.naturalWidth||762), ch / (img.naturalHeight||960));
      const dw = (img.naturalWidth||762)*scale, dh = (img.naturalHeight||960)*scale;
      ctx.drawImage(img, (cw-dw)/2, (ch-dh)/2, dw, dh);
    }

    function startLoop() {
      if (playing) return;
      playing = true;
      let last = 0;
      const interval = 1000 / FPS;
      function tick(ts) {
        if (ts - last >= interval) { last = ts; drawFrame(frames[current]); current = (current+1) % frames.length; }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    for (let i = 0; i < TOTAL; i++) {
      const img = new Image();
      img.src = BASE + 'frame_' + String(i).padStart(2,'0') + '_delay-0.04s.webp';
      img.onload = () => {
        loaded++;
        if (loaded === 1) { drawFrame(img); gsap.from(canvas, {opacity:0, scale:.92, duration:1.4, ease:'power3.out'}); }
        if (loaded === TOTAL) startLoop();
      };
      frames.push(img);
    }
    setTimeout(() => { if (!playing && loaded > 0) startLoop(); }, 400);

    // ── Mouse parallax on the canvas wrapper ─────────────────────────────
    const canvasWrap = canvas.parentElement;
    let mouseX = 0, mouseY = 0;
    let curX = 0, curY = 0, curR = 0;

    window.addEventListener('mousemove', e => {
      // Normalize to -1 … +1 relative to viewport centre
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Smooth lerp loop
    (function parallaxTick() {
      curX += (mouseX - curX) * 0.06;
      curY += (mouseY - curY) * 0.06;
      curR += (mouseX * 4 - curR) * 0.06;   // max ±4° rotation

      gsap.set(canvasWrap, {
        x: curX * 18,          // max ±18px horizontal offset
        y: curY * 10,          // max ±10px vertical offset
        rotationZ: curR,
        transformOrigin: '50% 50%',
        ease: 'none'
      });
      requestAnimationFrame(parallaxTick);
    })();
  }

  gsap.registerPlugin(ScrollTrigger);

  // Cards that use .reveal get staggered delay based on sibling index
  const cardSelectors = new Set(['.dentist-card', '.testi-card', '.service-card']);

  gsap.utils.toArray('.reveal').forEach(el => {
    const isCard = [...cardSelectors].some(sel => el.matches(sel));
    const siblings = isCard
      ? Array.from(el.parentElement.querySelectorAll(el.tagName + '[class*="card"]'))
      : null;
    const delay = isCard ? (siblings ? siblings.indexOf(el) : 0) * 0.14 : 0;
    const trigger = isCard ? el.closest('section') || el : el;
    gsap.to(el, { opacity:1, y:0, duration:.85, delay, ease:'power3.out',
      scrollTrigger: { trigger, start:'top 78%', toggleActions:'play none none none' }
    });
  });

  gsap.utils.toArray('.reveal-left').forEach(el => {
    gsap.to(el, { opacity:1, x:0, duration:1, ease:'power3.out',
      scrollTrigger: { trigger:el, start:'top 85%', toggleActions:'play none none none' }
    });
  });
  gsap.utils.toArray('.reveal-right').forEach(el => {
    gsap.to(el, { opacity:1, x:0, duration:1, ease:'power3.out',
      scrollTrigger: { trigger:el, start:'top 85%', toggleActions:'play none none none' }
    });
  });
  gsap.utils.toArray('.reveal-scale').forEach(el => {
    gsap.to(el, { opacity:1, scale:1, duration:1, ease:'back.out(1.4)',
      scrollTrigger: { trigger:el, start:'top 90%', toggleActions:'play none none none' }
    });
  });

  // Service cards don't have .reveal class — animate them separately
  gsap.utils.toArray('.service-card').forEach((el, i) => {
    gsap.from(el, { opacity:0, y:40, duration:.85, delay:i*0.14, ease:'power3.out',
      scrollTrigger: { trigger:'#services', start:'top 78%', toggleActions:'play none none none' }
    });
  });

  document.querySelectorAll('[data-count]').forEach(el => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '+';
    ScrollTrigger.create({ trigger:el, start:'top 80%', once:true,
      onEnter: () => {
        gsap.to({ val:0 }, { val:target, duration:1.8, ease:'power2.out',
          onUpdate: function() { el.textContent = Math.round(this.targets()[0].val) + suffix; },
          onComplete: () => { el.textContent = target + suffix; }
        });
      }
    });
  });

  // Floating badges — animate `top` (CSS property) so it never conflicts
  // with the scroll-exit tween which uses `y` (transform)
  gsap.utils.toArray('.glass-badge').forEach((el, i) => {
    gsap.to(el, {
      top: '+=' + (i === 0 ? -7 : 7) + 'px',
      duration: 2 + i * 0.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: i * 0.6,
    });
  });

  gsap.to('.hero-watermark', { y:70, ease:'none',
    scrollTrigger: { trigger:'#hero', start:'top top', end:'bottom top', scrub:true }
  });

  // ── Hero scroll-exit: implant + badges fly off screen ───────────────────
  const heroExitTrigger = {
    trigger: '#hero',
    start: 'top top',
    end: '+=420',      // over 420px of scroll travel
    scrub: 1.5,        // smooth lag, reverses on scroll up
  };

  // Parent carries vertical lift + fade — affects implant AND badges together
  gsap.to('.hero-center', {
    y: '-105vh',
    opacity: 0,
    ease: 'power2.in',
    scrollTrigger: heroExitTrigger,
  });

  // Badges diverge horizontally + rotate ON TOP of parent movement.
  // No y/opacity here — parent handles those, no conflict.
  gsap.to('.badge-left', {
    x: '-180px',
    rotation: -18,
    ease: 'power2.in',
    scrollTrigger: heroExitTrigger,
  });

  gsap.to('.badge-right', {
    x: '180px',
    rotation: 18,
    ease: 'power2.in',
    scrollTrigger: heroExitTrigger,
  });

  // ── Scroll-driven video (canvas frame-by-frame) ─────────────────────────
  const videoCanvas = document.getElementById('video-canvas');
  if (videoCanvas) {
    const vCtx    = videoCanvas.getContext('2d');
    const VTOTAL  = DENTIVA.videoFrames;
    const VBASE   = DENTIVA.videoFramesUrl;
    const vFrames = [];
    let vLoaded   = 0;
    let vCurrent  = -1;

    // Offscreen buffer — eliminates clear→draw black flash
    const offscreen = document.createElement('canvas');
    const offCtx    = offscreen.getContext('2d');

    function resizeVideoCanvas() {
      const w = videoCanvas.offsetWidth;
      const h = videoCanvas.offsetHeight;
      if (videoCanvas.width === w && videoCanvas.height === h) return; // skip if unchanged
      videoCanvas.width  = w;
      videoCanvas.height = h;
      offscreen.width    = w;
      offscreen.height   = h;
      // Redraw current frame immediately after resize
      if (vCurrent >= 0 && vFrames[vCurrent] && vFrames[vCurrent].complete) {
        drawVideoFrame(vFrames[vCurrent]);
      }
    }
    resizeVideoCanvas();
    window.addEventListener('resize', resizeVideoCanvas);

    function drawVideoFrame(img) {
      if (!img || !img.complete || !img.naturalWidth) return;
      const cw = videoCanvas.width, ch = videoCanvas.height;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
      const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
      // Clear offscreen then draw — clearRect on offscreen is never visible,
      // main canvas only gets updated via single atomic blit below
      offCtx.clearRect(0, 0, cw, ch);
      offCtx.drawImage(img, dx, dy, dw, dh);
      vCtx.drawImage(offscreen, 0, 0);
    }

    // Preload all frames
    for (let i = 1; i <= VTOTAL; i++) {
      const img = new Image();
      img.src = VBASE + 'frame_' + String(i).padStart(4, '0') + '.webp';
      img.onload = () => {
        vLoaded++;
        if (vLoaded === 1) drawVideoFrame(img); // show first frame immediately
        if (vLoaded === VTOTAL) ScrollTrigger.refresh(); // recalculate all positions
      };
      vFrames.push(img);
    }

    ScrollTrigger.create({
      trigger: '#video-section',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      onUpdate: self => {
        const idx = Math.min(
          Math.floor(self.progress * VTOTAL),
          VTOTAL - 1
        );
        if (idx !== vCurrent && vFrames[idx] && vFrames[idx].complete) {
          vCurrent = idx;
          drawVideoFrame(vFrames[idx]);
        }
      },
    });
  }

  const dcOffset = window.innerWidth < 768 ? 0 : 50;
  gsap.from('.dc1', { x:-dcOffset, opacity:0, duration:.9, ease:'power3.out', scrollTrigger:{ trigger:'#discount', start:'top 70%', toggleActions:'play none none none' }});
  gsap.from('.dc2', { x:dcOffset, opacity:0, duration:.9, delay:.15, ease:'power3.out', scrollTrigger:{ trigger:'#discount', start:'top 70%', toggleActions:'play none none none' }});
  gsap.from('.cta-banner', { scale:.94, opacity:0, duration:.9, ease:'back.out(1.3)', scrollTrigger:{ trigger:'.cta-banner', start:'top 85%', toggleActions:'play none none none' }});

  const signIn = document.querySelector('.signin-btn');
  if (signIn) {
    signIn.addEventListener('mouseenter', () => gsap.to(signIn, { scale:1.05, duration:.15 }));
    signIn.addEventListener('mouseleave', () => gsap.to(signIn, { scale:1, duration:.15 }));
  }
});
