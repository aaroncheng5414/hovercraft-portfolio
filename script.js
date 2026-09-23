(() => {
  'use strict';
  const story = document.querySelector('.door-story');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let scrollFrame = 0;
  const updateDoor = () => {
    scrollFrame = 0;
    const rect = story.getBoundingClientRect();
    const distance = Math.max(1, story.offsetHeight - story.querySelector('.hero-sticky').offsetHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / distance));
    const eased = progress * progress * (3 - 2 * progress);
    story.style.setProperty('--open', progress.toFixed(4));
    story.style.setProperty('--angle', `${reducedMotion.matches ? -72 : -108 * eased}deg`);
  };
  const scheduleDoor = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateDoor); };
  window.addEventListener('scroll', scheduleDoor, { passive: true });
  window.addEventListener('resize', scheduleDoor, { passive: true });
  reducedMotion.addEventListener('change', scheduleDoor);
  updateDoor();

  const canvas = document.querySelector('#signal-canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  const toggle = document.querySelector('#signal-mode');
  const motionToggle = document.querySelector('#signal-motion');
  let width = 0, height = 0, visible = false, pattern = false, frame = 0, playing = false;
  let pointer = { x: .5, y: .5 }, phase = 0;
  const fitCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  };
  function render() {
    context.clearRect(0, 0, width, height);
    const centerX = pointer.x * width;
    for (let row = 0; row < 15; row++) {
      const base = height * .14 + row * height * .049;
      context.beginPath();
      for (let x = 0; x <= width; x += 3) {
        const envelope = Math.exp(-Math.pow((x - centerX) / (width * .25), 2));
        const amplitude = pattern ? 18 : 34;
        const wave = Math.sin(x * (pattern ? .025 : .015) + row * .3 + phase);
        const y = base + wave * amplitude * envelope + (pointer.y - .5) * 38 * envelope;
        x === 0 ? context.moveTo(x, y) : context.lineTo(x, y);
      }
      context.strokeStyle = row % 4 === 0 ? '#c9f44a' : '#6e874a';
      context.lineWidth = row % 4 === 0 ? 1.35 : .75;
      context.stroke();
    }
    context.fillStyle = '#c9f44a';
    context.beginPath();context.arc(centerX, height * pointer.y, 3, 0, Math.PI * 2);context.fill();
  }
  const animate = () => {
    frame = 0;
    if (!playing || !visible || reducedMotion.matches || document.hidden) return;
    phase += .008; render(); frame = requestAnimationFrame(animate);
  };
  const resume = () => { if (playing && visible && !frame && !reducedMotion.matches && !document.hidden) animate(); else render(); };
  canvas.addEventListener('pointermove', event => {
    const rect = canvas.getBoundingClientRect();
    pointer = {x:Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y:Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))};
    render();
  });
  canvas.addEventListener('keydown', event => {
    const movement = {ArrowLeft:[-.05,0],ArrowRight:[.05,0],ArrowUp:[0,-.05],ArrowDown:[0,.05]}[event.key];
    if (!movement) return;
    event.preventDefault();
    pointer.x = Math.min(1, Math.max(0, pointer.x + movement[0]));
    pointer.y = Math.min(1, Math.max(0, pointer.y + movement[1]));
    render();
  });
  toggle.addEventListener('click', () => {pattern = !pattern;toggle.setAttribute('aria-pressed', String(pattern));render();});
  motionToggle.addEventListener('click', () => {
    playing = !playing;
    motionToggle.setAttribute('aria-pressed', String(playing));
    motionToggle.textContent = playing ? 'Pause motion' : 'Play motion';
    resume();
  });
  const motionPreference = () => {
    motionToggle.disabled = reducedMotion.matches;
    if (reducedMotion.matches) {playing = false;motionToggle.setAttribute('aria-pressed','false');motionToggle.textContent = 'Motion reduced';}
    else motionToggle.textContent = playing ? 'Pause motion' : 'Play motion';
    resume();
  };
  new ResizeObserver(fitCanvas).observe(canvas);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; resume(); }, { threshold:.05 }).observe(canvas);
  document.addEventListener('visibilitychange', resume);
  reducedMotion.addEventListener('change', motionPreference);
  fitCanvas();
  motionPreference();
})();
