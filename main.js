(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const hero = document.getElementById('hero');
  const real = document.getElementById('real');
  const ideaLayer = document.getElementById('idea-layer');
  const grip = document.getElementById('grip');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const REST = 38;

  // One layout, two skins: the sketch is the real hero, cloned.
  const copy = real.cloneNode(true);
  copy.querySelectorAll('a').forEach(a => { a.removeAttribute('href'); a.tabIndex = -1; });
  ideaLayer.append(...copy.childNodes);

  const portrait = document.getElementById('pframe');
  document.getElementById('p-idea').append(document.getElementById('p-real').firstElementChild.cloneNode(true));

  // Any box with a --x and a grip becomes a draggable idea/real line.
  const dragLine = (box, handle, stopped, moved = () => {}) => {
    const set = x => {
      x = Math.max(2, Math.min(98, x));
      box.style.setProperty('--x', x + '%');
      handle.setAttribute('aria-valuenow', Math.round(x));
      handle.setAttribute('aria-valuetext', x > 66 ? 'Mostly idea' : x < 33 ? 'Mostly finished' : 'Half idea, half finished');
      moved(x);
    };
    const toX = e => { const r = box.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; };
    handle.addEventListener('pointerdown', e => {
      stopped();
      handle.setPointerCapture(e.pointerId); handle.classList.add('held');
      set(toX(e));
    });
    handle.addEventListener('pointermove', e => { if (handle.hasPointerCapture(e.pointerId)) set(toX(e)); });
    const drop = () => handle.classList.remove('held');
    handle.addEventListener('pointerup', drop);
    handle.addEventListener('pointercancel', drop);
    handle.addEventListener('keydown', e => {
      const step = { ArrowLeft: -4, ArrowDown: -4, ArrowRight: 4, ArrowUp: 4 }[e.key];
      const jump = { Home: 2, End: 98 }[e.key];
      if (step === undefined && jump === undefined) return;
      e.preventDefault(); stopped();
      set(jump ?? +handle.getAttribute('aria-valuenow') + step);
    });
    return set;
  };

  // The phone in the hero is the slider's readout: drag to zero and it's only a thought.
  const pcts = hero.querySelectorAll('.pct'), buttons = hero.querySelectorAll('.s-btn');
  const lists = [...hero.querySelectorAll('[data-steps]')].map(l => [...l.children]);
  const phone = pct => {
    pct = Math.round(pct);
    hero.style.setProperty('--pct', pct);
    pcts.forEach(p => { p.textContent = pct; });
    buttons.forEach(b => { b.textContent = pct >= 100 ? 'Launched' : pct < 5 ? 'Just a thought' : 'Keep moving'; });
    const done = Math.floor(pct / 20);
    lists.forEach(items => items.forEach((li, i) => {
      li.classList.toggle('done', i < done);
      li.classList.toggle('now', i === done);
    }));
  };

  let touched = false;
  const setX = dragLine(hero, grip, () => { touched = true; hero.classList.remove('hint'); }, x => phone((98 - x) / .96));
  dragLine(portrait, document.getElementById('p-grip'), () => {})(50);

  // The page opens as pure sketch, then the line wipes the real thing in.
  if (calm) setX(REST);
  else {
    setX(100);
    const start = performance.now() + 700, span = 1900;
    const run = now => {
      if (touched) return;
      const t = Math.min(1, Math.max(0, (now - start) / span));
      setX(100 + (REST - 100) * (1 - Math.pow(1 - t, 4)));
      if (t < 1) requestAnimationFrame(run); else hero.classList.add('hint');
    };
    requestAnimationFrame(run);
  }

  // The phone leans towards the pointer.
  if (!calm && matchMedia('(hover: hover)').matches) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 16 + 'deg');
      hero.style.setProperty('--rx', ((e.clientY - r.top) / r.height - .5) * -10 + 'deg');
    });
    hero.addEventListener('pointerleave', () => { hero.style.setProperty('--rx', '0deg'); hero.style.setProperty('--ry', '0deg'); });
  }

  // Sketch mode: the whole site goes back to pencil.
  const mode = document.getElementById('mode');
  mode.addEventListener('click', () => {
    const on = root.classList.toggle('sketch');
    mode.setAttribute('aria-pressed', on);
    mode.querySelector('.mode-label').textContent = on ? 'Finished mode' : 'Sketch mode';
  });

  // Three lenses.
  const tabs = [...document.querySelectorAll('[role=tab]')];
  const pick = tab => tabs.forEach(t => {
    const on = t === tab;
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => pick(t));
    t.addEventListener('keydown', e => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const next = tabs[(i + d + tabs.length) % tabs.length];
      pick(next); next.focus();
    });
  });

  // Their idea, sketched and finished, as they type.
  const input = document.getElementById('idea-text');
  const outs = document.querySelectorAll('.i-text');
  const verdict = document.getElementById('idea-verdict');
  const show = () => {
    const words = input.value.trim();
    outs.forEach(o => { o.textContent = words || input.placeholder; });
    verdict.textContent = !words ? 'your idea, today' : words.length < 16 ? 'short. dangerous.' : words.length < 55 ? 'ooh, go on' : 'this one has legs';
  };
  input.addEventListener('input', show); show();
  document.getElementById('idea-form').addEventListener('submit', e => {
    e.preventDefault();
    const idea = input.value.trim() || input.placeholder;
    location.href = 'mailto:hello@example.com?subject=' + encodeURIComponent('An idea') + '&body=' + encodeURIComponent(idea);
  });

  // Reveal on scroll, and the path line fills as you go.
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  const list = document.getElementById('path-list');
  const fill = () => {
    const r = list.getBoundingClientRect();
    list.style.setProperty('--path', Math.max(0, Math.min(1, (innerHeight * .85 - r.top) / (innerHeight * .6))));
  };
  addEventListener('scroll', fill, { passive: true }); fill();

  // S is for sketch.
  addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 's' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.target.matches('input, textarea')) mode.click();
  });

  // The portrait keeps an eye on you.
  const eyes = portrait.querySelectorAll('.eye');
  if (!calm) addEventListener('pointermove', e => {
    const r = portrait.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * .42);
    const far = Math.hypot(dx, dy) || 1, reach = Math.min(far / 60, 4);
    eyes.forEach(eye => { eye.style.transform = `translate(${dx / far * reach}px, ${dy / far * reach}px)`; });
  }, { passive: true });

  // Over paper, the pointer is a pencil. The line fades like a second thought.
  const canvas = document.getElementById('trail');
  if (!calm && matchMedia('(hover: hover)').matches) {
    const ctx = canvas.getContext('2d');
    const FADE = 1400;
    let points = [], drawing = false;
    const fit = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
    addEventListener('resize', fit); fit();
    const onPaper = e => {
      if (root.classList.contains('sketch') || e.target.closest?.('.paper')) return true;
      if (!e.target.closest?.('#hero')) return false;
      const r = hero.getBoundingClientRect();
      return (e.clientX - r.left) / r.width * 100 < parseFloat(hero.style.getPropertyValue('--x'));
    };
    const draw = now => {
      points = points.filter(p => now - p.t < FADE);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        if (b.t - a.t > 90 || !b.on) continue;
        ctx.strokeStyle = `rgba(122, 16, 34, ${(1 - (now - b.t) / FADE) * .6})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      if (points.length) requestAnimationFrame(draw); else { drawing = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
    };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      points.push({ x: e.clientX, y: e.clientY, t: performance.now(), on: onPaper(e) });
      if (!drawing) { drawing = true; requestAnimationFrame(draw); }
    }, { passive: true });
  } else canvas.remove();

  // A small thing for people who resize windows.
  const w = document.getElementById('width');
  const size = () => {
    const n = innerWidth;
    w.textContent = n >= 1700 ? `${n}px. All this room and you came to the footer.`
      : n >= 1000 ? `This page is ${n}px wide right now. Go on, squash it.`
      : n >= 640 ? `${n}px. Tighter. Keep going.`
      : n >= 430 ? `${n}px. Still standing. I planned for this.`
      : `${n}px. Phone-sized, or a very brave window.`;
  };
  addEventListener('resize', size); size();
})();
