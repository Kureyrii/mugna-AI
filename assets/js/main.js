// ── Mobile nav drawer ───────────────────────────────────────
const hamburger = document.getElementById('nav-hamburger');
const drawer = document.getElementById('nav-drawer');
const overlay = document.getElementById('nav-overlay');
const drawerClose = document.getElementById('nav-drawer-close');

function openDrawer() {
  drawer.classList.add('is-open');
  overlay.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  if (hamburger) {
    hamburger.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
  }
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  drawer.classList.remove('is-open');
  overlay.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  if (hamburger) {
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
  }
  document.body.style.overflow = '';
}

if (hamburger) hamburger.addEventListener('click', openDrawer);
if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
if (overlay) overlay.addEventListener('click', closeDrawer);
if (drawer) drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeDrawer));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

// ── Lenis smooth scroll ─────────────────────────────────────
let lenis = null;
if (typeof Lenis !== 'undefined') {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
  });

  lenis.on('scroll', () => { if (typeof updateActiveTabOnScroll === 'function') updateActiveTabOnScroll(); });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

// ── Hero scale: scales down as user scrolls ────────────────
const heroEl = document.querySelector('.hero');

if (heroEl) {
  function updateHeroScale() {
    const heroH = heroEl.offsetHeight;
    const scrolled = window.scrollY;
    const progress = Math.min(Math.max(scrolled / (heroH * 0.75), 0), 1);
    const eased = 1 - Math.pow(1 - progress, 2);

    heroEl.style.transform = `scale(${1 - eased * 0.12})`;
    heroEl.style.opacity = 1 - (eased * 0.3);
  }

  window.addEventListener('scroll', updateHeroScale, { passive: true });
  updateHeroScale();
}

// ── Scroll-reveal observer ──────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
    } else {
      entry.target.classList.remove('is-visible');
    }
  });
}, { threshold: 0.1, rootMargin: '-5% 0px -5% 0px' });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// ── Discovery section: orchestrated scroll-reveal sequence ──
(function () {
  const section   = document.querySelector('.discovery-section');
  const iconImg   = document.getElementById('disc-hero-icon');
  const heading   = document.querySelector('.discovery-above-card h2');
  const subtext   = document.querySelector('.discovery-above-card p');
  const chatOuter = document.querySelector('.discovery-chat-outer');

  if (!section) return;

  const BEFORE  = 'Ready to Build Something'; // no trailing space — cursor sits right after 'g'
  const SMARTER = 'Smarter?';

  // Clear heading so it stays empty until typing starts
  if (heading) heading.textContent = '';

  let triggered = false;

  // Accent colour from the session icon — accessed lazily so it's always defined by scroll time
  function accentColor() {
    return (typeof sessionIcon !== 'undefined' ? sessionIcon.bubble : '#7549AF');
  }

  function addSparkleStars(span, color) {
    for (let i = 1; i <= 3; i++) {
      const star = document.createElement('span');
      star.className = `disc-star disc-star--${i}`;
      star.setAttribute('aria-hidden', 'true');
      star.textContent = '✦';
      star.style.color = color;
      span.appendChild(star);
    }
  }

  function typeHeading(onStart, onComplete) {
    if (!heading) { onComplete?.(); return; }

    const color = accentColor();
    const speed = 65; // ms per character
    const BLINK = 380; // ms per blink half-cycle

    // Static text appears immediately, space reserved for later
    heading.textContent = '';
    heading.appendChild(document.createTextNode(BEFORE));
    const spaceNode = document.createTextNode('');
    heading.appendChild(spaceNode);

    // Smarter span — coloured from the first character
    const smarterSpan = document.createElement('span');
    smarterSpan.className = 'disc-smarter';
    smarterSpan.style.color = color;
    heading.appendChild(smarterSpan);

    // Reduced motion: fill immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      spaceNode.textContent = ' ';
      smarterSpan.textContent = SMARTER;
      addSparkleStars(smarterSpan, color);
      onStart?.();
      onComplete?.();
      return;
    }

    // Cursor sits inline in the heading, right after the smarter span.
    // We never remove it — just fade to opacity:0 — so centering never shifts.
    const cursorEl = document.createElement('span');
    cursorEl.className = 'disc-typing-cursor';
    cursorEl.setAttribute('aria-hidden', 'true');
    cursorEl.style.color = color;
    cursorEl.style.opacity = '0';
    cursorEl.textContent = '|';
    heading.appendChild(cursorEl);

    // Cursor blinks independently on its own interval — doesn't care about typing state
    let show = false;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      cursorEl.style.opacity = '1';
      show = true;
    }));
    const blinkInterval = setInterval(() => {
      show = !show;
      cursorEl.style.opacity = show ? '1' : '0';
    }, BLINK);

    let charIndex = 0;
    setTimeout(() => {
      function tick() {
        if (charIndex === 0) {
          spaceNode.textContent = ' ';
          onStart?.();
        }
        if (charIndex < SMARTER.length) {
          smarterSpan.textContent = SMARTER.slice(0, charIndex + 1);
          charIndex++;
          setTimeout(tick, speed);
        } else {
          // Stop blinking after 2 more on→off cycles
          let postBlinks = 0;
          clearInterval(blinkInterval);
          const postBlink = setInterval(() => {
            postBlinks++;
            cursorEl.style.opacity = postBlinks % 2 === 0 ? '1' : '0';
            if (postBlinks >= 4) {
              clearInterval(postBlink);
              cursorEl.style.opacity = '0';
              setTimeout(() => { addSparkleStars(smarterSpan, color); onComplete?.(); }, 220);
            }
          }, BLINK);
        }
      }
      tick();
    }, 800);
  }

  function runSequence() {
    if (triggered) return;
    triggered = true;

    typeHeading(
      () => {
        if (subtext) subtext.classList.add('disc-text-in');
        if (chatOuter) setTimeout(() => chatOuter.classList.add('disc-chat-in'), 400);
      },
      null
    );

    // Icon starts 250ms after typing — so typing is already underway when icon animates in
    setTimeout(() => {
      if (iconImg) {
        iconImg.classList.add('disc-icon-in');
        iconImg.addEventListener('animationend', () => {
          iconImg.classList.remove('disc-icon-in');
          iconImg.classList.add('disc-icon-float');
        }, { once: true });
      }
    }, 250);
  }

  const discRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        runSequence();
        discRevealObserver.disconnect();
      }
    });
  }, { threshold: 0.5 });

  discRevealObserver.observe(iconImg || section);
})();

// ── Stack scale-in observer ─────────────────────────────────
const stackObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('stack-scale-in');
      stackObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.05 });

['.rescue-section-wrap', '.process-section'].forEach((sel) => {
  const el = document.querySelector(sel);
  if (el) stackObserver.observe(el);
});

// ── Services tab navigation (desktop) ───────────────────────
const tabs = document.querySelectorAll('.services-tab');
const blocks = document.querySelectorAll('.services-block');
const stickyHead = document.querySelector('.services-sticky-head');

tabs.forEach((tab) => {
  tab.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(tab.dataset.target);
    if (target && stickyHead) {
      const offset = 73 + stickyHead.getBoundingClientRect().height;
      if (lenis) {
        lenis.scrollTo(target, { offset: -offset });
      } else {
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  });
});

function setActiveTab(id) {
  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.target === id);
  });
}

function updateActiveTabOnScroll() {
  if (!stickyHead || !blocks.length) return;
  const offset = 73 + stickyHead.getBoundingClientRect().height + 1;

  let current = blocks[0].id;
  blocks.forEach((block) => {
    const rect = block.getBoundingClientRect();
    if (rect.top <= offset) current = block.id;
  });
  setActiveTab(current);
}

window.addEventListener('scroll', updateActiveTabOnScroll, { passive: true });
updateActiveTabOnScroll();

// ── Rescue card glow effect (desktop hover) ─────────────────
document.querySelectorAll('.rescue-card').forEach((card, cardIndex) => {
  const glow = card.querySelector('.rescue-glow');
  if (!glow) return;
  const canvas = card.querySelector('.rescue-card-particles');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let mouse = { x: -9999, y: -9999 };
  let rafId = null;

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width  = card.offsetWidth;
    canvas.height = card.offsetHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const solidColors = [
    ['rgba(62,130,247,VAL)'],
    ['rgba(81,35,153,VAL)'],
  ];
  const colors = solidColors[cardIndex % 2];

  const particles = Array.from({ length: 2 }, () => ({
    x: Math.random() * (canvas ? canvas.width : 400),
    y: Math.random() * (canvas ? canvas.height : 300),
    r: 200,
    baseDx: (Math.random() - 0.5) * 0.5,
    baseDy: (Math.random() - 0.5) * 0.5,
    dx: 0, dy: 0,
    color: colors[Math.floor(Math.random() * colors.length)],
    opacity: 1,
  }));
  particles.forEach(p => { p.dx = p.baseDx; p.dy = p.baseDy; });

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const influence = 220, strength = 2.5;

    particles.forEach(p => {
      const mx = p.x - mouse.x, my = p.y - mouse.y;
      const dist = Math.sqrt(mx * mx + my * my);
      if (dist < influence && dist > 0) {
        const force = (influence - dist) / influence;
        p.dx += (mx / dist) * force * strength * 0.15;
        p.dy += (my / dist) * force * strength * 0.15;
      }
      p.dx += (p.baseDx - p.dx) * 0.12;
      p.dy += (p.baseDy - p.dy) * 0.12;
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace('VAL', p.opacity);
      ctx.fill();
    });
    rafId = requestAnimationFrame(draw);
  }

  function setPos(e) {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mouse-x', x + '%');
    card.style.setProperty('--mouse-y', y + '%');
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }

  card.addEventListener('mouseenter', (e) => {
    glow.style.transition = 'opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)';
    setPos(e);
    requestAnimationFrame(() => { glow.style.transition = ''; });
    if (!rafId) draw();
  });
  card.addEventListener('mousemove', setPos);
  card.addEventListener('mouseleave', () => {
    mouse.x = -9999; mouse.y = -9999;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  });
});

// ── Smart Discovery: canvas particles ──────────────────────
const discCanvas = document.querySelector('.discovery-particles');
if (discCanvas) {
  const discSection = document.querySelector('.discovery-section');
  const ctx = discCanvas.getContext('2d');
  let mouse = { x: -9999, y: -9999 };

  function resizeDiscCanvas() {
    discCanvas.width = discSection.offsetWidth;
    discCanvas.height = discSection.offsetHeight;
  }
  resizeDiscCanvas();
  window.addEventListener('resize', resizeDiscCanvas);

  discSection.addEventListener('mousemove', (e) => {
    const rect = discCanvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  discSection.addEventListener('mouseleave', () => {
    mouse.x = -9999; mouse.y = -9999;
  });

  const colors = ['rgba(102,55,174,VAL)', 'rgba(62,130,247,VAL)', 'rgba(180,160,220,VAL)', 'rgba(40,196,216,VAL)'];
  const discParticles = [];
  for (let i = 0; i < 40; i++) {
    discParticles.push({
      x: Math.random() * discCanvas.width,
      y: Math.random() * discCanvas.height,
      r: Math.random() * 1.8 + 0.4,
      baseDx: (Math.random() - 0.5) * 0.35,
      baseDy: (Math.random() - 0.5) * 0.35,
      dx: 0, dy: 0,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.5 + 0.15,
    });
  }
  discParticles.forEach(p => { p.dx = p.baseDx; p.dy = p.baseDy; });

  let discRafId = null;
  function drawDiscParticles() {
    ctx.clearRect(0, 0, discCanvas.width, discCanvas.height);
    const influence = 120, strength = 0.6;
    discParticles.forEach(p => {
      const mx = p.x - mouse.x, my = p.y - mouse.y;
      const dist = Math.sqrt(mx * mx + my * my);
      if (dist < influence && dist > 0) {
        const force = (influence - dist) / influence;
        p.dx += (mx / dist) * force * strength * 0.15;
        p.dy += (my / dist) * force * strength * 0.15;
      }
      p.dx += (p.baseDx - p.dx) * 0.12;
      p.dy += (p.baseDy - p.dy) * 0.12;
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = discCanvas.width;
      if (p.x > discCanvas.width) p.x = 0;
      if (p.y < 0) p.y = discCanvas.height;
      if (p.y > discCanvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace('VAL', p.opacity);
      ctx.fill();
    });
    discRafId = requestAnimationFrame(drawDiscParticles);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (discRafId) { cancelAnimationFrame(discRafId); discRafId = null; }
    } else if (!discRafId) {
      drawDiscParticles();
    }
  });
  drawDiscParticles();
}

// ── Process section: canvas particles ──────────────────────
const procCanvas = document.querySelector('.process-particles');
if (procCanvas) {
  const procSection = document.querySelector('.process-section');
  const pctx = procCanvas.getContext('2d');
  let procMouse = { x: -9999, y: -9999 };

  function resizeProcCanvas() {
    procCanvas.width = procSection.offsetWidth;
    procCanvas.height = procSection.offsetHeight;
  }
  resizeProcCanvas();
  window.addEventListener('resize', resizeProcCanvas);

  procSection.addEventListener('mousemove', (e) => {
    const rect = procCanvas.getBoundingClientRect();
    procMouse.x = e.clientX - rect.left;
    procMouse.y = e.clientY - rect.top;
  });
  procSection.addEventListener('mouseleave', () => {
    procMouse.x = -9999; procMouse.y = -9999;
  });

  const procColors = ['rgba(102,55,174,VAL)', 'rgba(62,130,247,VAL)', 'rgba(255,255,255,VAL)'];
  const procParticles = [];
  for (let i = 0; i < 60; i++) {
    const p = {
      x: Math.random() * procCanvas.width,
      y: Math.random() * procCanvas.height,
      r: Math.random() * 1.8 + 0.4,
      baseDx: (Math.random() - 0.5) * 0.35,
      baseDy: (Math.random() - 0.5) * 0.35,
      dx: 0, dy: 0,
      color: procColors[Math.floor(Math.random() * procColors.length)],
      opacity: Math.random() * 0.5 + 0.15,
    };
    p.dx = p.baseDx; p.dy = p.baseDy;
    procParticles.push(p);
  }

  let procRafId = null;
  function drawProcParticles() {
    pctx.clearRect(0, 0, procCanvas.width, procCanvas.height);
    const influence = 120, strength = 0.6;
    procParticles.forEach(p => {
      const mx = p.x - procMouse.x, my = p.y - procMouse.y;
      const dist = Math.sqrt(mx * mx + my * my);
      if (dist < influence && dist > 0) {
        const force = (influence - dist) / influence;
        p.dx += (mx / dist) * force * strength * 0.08;
        p.dy += (my / dist) * force * strength * 0.08;
      }
      p.dx += (p.baseDx - p.dx) * 0.05;
      p.dy += (p.baseDy - p.dy) * 0.05;
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = procCanvas.width;
      if (p.x > procCanvas.width) p.x = 0;
      if (p.y < 0) p.y = procCanvas.height;
      if (p.y > procCanvas.height) p.y = 0;
      pctx.beginPath();
      pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pctx.fillStyle = p.color.replace('VAL', p.opacity);
      pctx.fill();
    });
    procRafId = requestAnimationFrame(drawProcParticles);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (procRafId) { cancelAnimationFrame(procRafId); procRafId = null; }
    } else if (!procRafId) {
      drawProcParticles();
    }
  });
  drawProcParticles();
}

// ── Smart Discovery: randomise icon per session ────────────
const discIcons = [
  { src: 'assets/icons/spark-blue.svg',   glow: 'rgba(62,130,247,0.5)',  bubble: '#3E82F7' },
  { src: 'assets/icons/ai-spark.svg',     glow: 'rgba(254,212,89,0.55)', bubble: '#C89A00' },
  { src: 'assets/icons/spark-purple.svg', glow: 'rgba(117,73,175,0.5)',  bubble: '#7549AF' },
];

const sessionIconIndex = Math.floor(Math.random() * discIcons.length);
const sessionIcon = discIcons[sessionIconIndex];

const discHeroIcon  = document.getElementById('disc-hero-icon');
const discInputIcon = document.getElementById('disc-input-icon');

if (discHeroIcon)  { discHeroIcon.src  = sessionIcon.src; discHeroIcon.style.setProperty('--disc-glow', sessionIcon.glow); }
if (discInputIcon) { discInputIcon.src = sessionIcon.src; }

document.documentElement.style.setProperty('--disc-bubble', sessionIcon.bubble);

// ── Smart Discovery: chat interaction ──────────────────────
const discMessages  = document.getElementById('discovery-messages');
const discField     = document.getElementById('discovery-chatbox-field');
const discSend      = document.getElementById('discovery-chatbox-send');
const discFileInput = document.getElementById('discovery-file-input');
const discFilePreviews = document.getElementById('discovery-file-previews');

const botReplies = [
  "That's really helpful — sounds like a great fit for a custom AI workflow. Book a discovery call and we'll map this out properly.",
  "Interesting! We've helped similar businesses automate exactly that. Let's get you on a call to scope it out.",
  "Got it. The first step is a 30-minute discovery call — we'll identify your highest-impact opportunities and put together an action plan.",
  "That's a common challenge we solve. A quick call is all it takes to figure out the best approach for your setup.",
  "Love the direction you're heading. We've helped teams like yours go from idea to working product in 6–8 weeks. Want to explore what that could look like for you?",
  "This is right in our wheelhouse. We'd start with a lightweight discovery sprint to map the technical requirements — want us to walk you through what that involves?",
];

const suggestionSets = [
  ["Tell me more", "What's the timeline?", "What does it cost?"],
  ["Book a discovery call", "What's involved?", "See examples"],
  ["Walk me through it", "What do I need to prepare?", "How long does it take?"],
  ["I'm interested", "Can you show examples?", "What's the next step?"],
  ["What's included?", "How do we get started?", "Do you work with my stack?"],
];

function getRandomSuggestions() {
  return suggestionSets[Math.floor(Math.random() * suggestionSets.length)];
}

function clearSuggestions() {
  discMessages.querySelectorAll('.disc-suggestions').forEach(el => el.remove());
}

const ALLOWED_EXTS = ['pdf','jpg','jpeg','png','gif','webp','doc','docx','xls','xlsx','ppt','pptx','txt','csv'];
let attachedFiles = [];
let objectURLs = [];

function getExt(name) {
  return name.split('.').pop().toLowerCase();
}

function scrollToBottom() {
  requestAnimationFrame(() => { discMessages.scrollTop = discMessages.scrollHeight; });
}

// Only trap page-scroll inside the chat once it actually has its own
// overflow to scroll — otherwise the empty space "anchors" wheel/touch
// input and the page appears to jitter/stop scrolling over it.
function updateLenisPrevent() {
  if (!discMessages) return;
  if (discMessages.scrollHeight > discMessages.clientHeight + 1) {
    discMessages.setAttribute('data-lenis-prevent', '');
  } else {
    discMessages.removeAttribute('data-lenis-prevent');
  }
}

if (discMessages) {
  updateLenisPrevent();
  new ResizeObserver(updateLenisPrevent).observe(discMessages);
  new MutationObserver(updateLenisPrevent).observe(discMessages, { childList: true, subtree: true });
  window.addEventListener('resize', updateLenisPrevent);
}

function addMessage(text, role, suggestions = []) {
  if (!discMessages) return;
  const msg = document.createElement('div');
  msg.className = `disc-msg disc-msg--${role}`;

  if (role === 'ai') {
    const avatar = document.createElement('div');
    avatar.className = 'disc-msg-avatar';
    const icon = document.createElement('img');
    icon.src = sessionIcon.src;
    icon.alt = '';
    icon.width = 18;
    icon.height = 18;
    avatar.appendChild(icon);
    msg.appendChild(avatar);

    const body = document.createElement('div');
    body.className = 'disc-msg-body';

    const bubble = document.createElement('div');
    bubble.className = 'disc-msg-bubble';
    bubble.textContent = text;
    body.appendChild(bubble);

    if (suggestions.length > 0) {
      const pillsRow = document.createElement('div');
      pillsRow.className = 'disc-suggestions';
      suggestions.forEach(label => {
        const btn = document.createElement('button');
        btn.className = 'disc-suggestion';
        btn.textContent = label;
        btn.addEventListener('click', () => {
          clearSuggestions();
          if (discPromptsEl) discPromptsEl.classList.add('is-hidden');
          addUserMessage(label, []);
          showTyping();
          setTimeout(() => {
            removeTyping();
            addMessage(botReplies[Math.floor(Math.random() * botReplies.length)], 'ai', getRandomSuggestions());
            discField.focus();
          }, 1400 + Math.random() * 600);
        });
        pillsRow.appendChild(btn);
      });
      body.appendChild(pillsRow);
    }

    msg.appendChild(body);
  } else {
    const bubble = document.createElement('div');
    bubble.className = 'disc-msg-bubble';
    bubble.textContent = text;
    msg.appendChild(bubble);
  }

  discMessages.appendChild(msg);
  scrollToBottom();
}

function showTyping() {
  if (!discMessages) return;
  const typing = document.createElement('div');
  typing.className = 'disc-msg disc-msg--ai';
  typing.id = 'disc-typing';
  typing.innerHTML = `
    <div class="disc-msg-avatar">
      <img src="${sessionIcon.src}" alt="" width="18" height="18">
    </div>
    <div class="disc-msg-bubble">
      <div class="disc-typing"><span></span><span></span><span></span></div>
    </div>`;
  discMessages.appendChild(typing);
  scrollToBottom();
}

function removeTyping() {
  const t = document.getElementById('disc-typing');
  if (t) t.remove();
}

function renderFilePreviews() {
  // Revoke stale object URLs to prevent memory leaks
  objectURLs.forEach(url => URL.revokeObjectURL(url));
  objectURLs = [];

  if (!discFilePreviews) return;
  discFilePreviews.innerHTML = '';

  attachedFiles.forEach((file, i) => {
    const chip = document.createElement('div');
    chip.className = 'disc-file-chip';
    const ext = getExt(file.name);
    const isImage = ['jpg','jpeg','png','gif','webp'].includes(ext);
    const nameShort = file.name.length > 20 ? file.name.slice(0, 18) + '…' : file.name;

    if (isImage) {
      const url = URL.createObjectURL(file);
      objectURLs.push(url);
      const img = document.createElement('img');
      img.src = url;
      img.alt = file.name;
      chip.appendChild(img);
    } else {
      const icon = document.createElement('div');
      icon.className = 'disc-file-chip-icon';
      icon.textContent = ext;
      chip.appendChild(icon);
    }

    const nameEl = document.createElement('span');
    nameEl.className = 'disc-file-chip-name';
    nameEl.textContent = nameShort;
    chip.appendChild(nameEl);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'disc-file-chip-remove';
    removeBtn.dataset.index = i;
    removeBtn.setAttribute('aria-label', 'Remove file');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      attachedFiles.splice(i, 1);
      renderFilePreviews();
    });
    chip.appendChild(removeBtn);

    discFilePreviews.appendChild(chip);
  });
}

const discPromptsEl = document.querySelector('.discovery-prompts');

function addUserMessage(text, files) {
  if (!discMessages) return;
  const msg = document.createElement('div');
  msg.className = 'disc-msg disc-msg--user';
  const bubble = document.createElement('div');
  bubble.className = 'disc-msg-bubble';
  if (text) {
    const textNode = document.createElement('p');
    textNode.textContent = text;
    bubble.appendChild(textNode);
  }
  if (files.length > 0) {
    const fileRow = document.createElement('div');
    fileRow.className = 'disc-msg-files';
    files.forEach(file => {
      const chip = document.createElement('span');
      chip.className = 'disc-msg-file-chip';
      chip.textContent = file.name;
      fileRow.appendChild(chip);
    });
    bubble.appendChild(fileRow);
  }
  msg.appendChild(bubble);
  discMessages.appendChild(msg);
  scrollToBottom();
}

function sendMessage() {
  const text = discField.value.trim();
  if (!text && attachedFiles.length === 0) return;

  clearSuggestions();
  if (discPromptsEl) discPromptsEl.classList.add('is-hidden');
  addUserMessage(text, [...attachedFiles]);

  // Clear input + files
  discField.value = '';
  discField.style.height = 'auto';
  attachedFiles = [];
  renderFilePreviews();

  showTyping();
  setTimeout(() => {
    removeTyping();
    addMessage(botReplies[Math.floor(Math.random() * botReplies.length)], 'ai', getRandomSuggestions());
    discField.focus();
  }, 1400 + Math.random() * 600);
}

if (discField) {
  discField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-expand textarea
  discField.addEventListener('input', () => {
    discField.style.height = 'auto';
    const lineHeight = parseFloat(getComputedStyle(discField).lineHeight) || 22.5;
    const maxHeight = lineHeight * 5;
    const newHeight = Math.min(discField.scrollHeight, maxHeight);
    discField.style.height = newHeight + 'px';
    discField.style.overflowY = discField.scrollHeight > maxHeight ? 'auto' : 'hidden';
  });
}

if (discSend) discSend.addEventListener('click', sendMessage);

document.querySelectorAll('.disc-prompt-card').forEach(card => {
  card.addEventListener('click', () => {
    if (!discField) return;
    discField.value = card.dataset.prompt;
    discField.dispatchEvent(new Event('input'));
    discField.focus();
  });
});

if (discFileInput) {
  discFileInput.addEventListener('change', () => {
    Array.from(discFileInput.files).forEach(file => {
      const ext = getExt(file.name);
      if (ALLOWED_EXTS.includes(ext)) {
        attachedFiles.push(file);
      }
    });
    discFileInput.value = '';
    renderFilePreviews();
  });
}


// ── Case studies: drag-to-scroll carousel (mobile) ──────────
document.querySelectorAll('.case-studies-grid').forEach((grid) => {
  let down = false, moved = false, startX = 0, startScroll = 0;

  grid.addEventListener('pointerdown', (e) => {
    // Left mouse button or touch/pen only
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    down = true;
    moved = false;
    startX = e.clientX;
    startScroll = grid.scrollLeft;
  });

  grid.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 4) {
      moved = true;
      grid.classList.add('is-dragging');
      grid.setPointerCapture(e.pointerId);
    }
    if (moved) {
      e.preventDefault();
      grid.scrollLeft = startScroll - dx;
    }
  });

  const end = () => {
    if (!down) return;
    down = false;
    grid.classList.remove('is-dragging');
  };
  grid.addEventListener('pointerup', end);
  grid.addEventListener('pointercancel', end);
  // Swallow the click that fires right after a drag so cards don't react
  grid.addEventListener('click', (e) => {
    if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
  }, true);
});
