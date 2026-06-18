// ── Mobile nav drawer ───────────────────────────────────────
const hamburger = document.getElementById('nav-hamburger');
const drawer = document.getElementById('nav-drawer');
const overlay = document.getElementById('nav-overlay');
const drawerClose = document.getElementById('nav-drawer-close');

function openDrawer() {
  drawer.classList.add('is-open');
  overlay.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  drawer.classList.remove('is-open');
  overlay.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

if (hamburger) hamburger.addEventListener('click', openDrawer);
if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
if (overlay) overlay.addEventListener('click', closeDrawer);
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

  lenis.on('scroll', updateActiveTabOnScroll);

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

// ── Stack scroll: hero scales down, discovery section expands ─
const heroEl = document.querySelector('.hero');
const discEl = document.querySelector('.discovery-section');
const discChatOuter = document.querySelector('.discovery-chat-outer');

if (heroEl && discEl && discChatOuter) {
  discEl.style.transformOrigin = 'center center';
  discEl.style.willChange = 'transform';
  discChatOuter.style.transformOrigin = 'center center';
  discChatOuter.style.willChange = 'transform';

  let discSeqTriggered = false;

  function updateStackScroll() {
    const heroH = heroEl.offsetHeight;
    const scrolled = window.scrollY;
    const progress = Math.min(Math.max(scrolled / (heroH * 0.75), 0), 1);
    const eased = 1 - Math.pow(1 - progress, 2);

    heroEl.style.transform = `scale(${1 - eased * 0.12})`;
    heroEl.style.opacity = 1 - (eased * 0.3);
    discEl.style.borderRadius = `${Math.round(24 - eased * 24)}px`;
    discChatOuter.style.transform = `scale(${0.4 + eased * 0.6})`;

    // Reveal sequence: text first, chat 600ms later
    if (eased > 0.7 && !discSeqTriggered) {
      discSeqTriggered = true;
      discEl.classList.add('disc-text-in');
      setTimeout(() => discEl.classList.add('disc-chat-in'), 600);
    }
  }

  window.addEventListener('scroll', updateStackScroll, { passive: true });
  updateStackScroll();
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

// ── Services tab navigation ─────────────────────────────────
const tabs = document.querySelectorAll('.services-tab');
const blocks = document.querySelectorAll('.services-block');

tabs.forEach((tab) => {
  tab.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(tab.dataset.target);
    if (target) {
      const stickyHead = document.querySelector('.services-sticky-head');
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
  const stickyHead = document.querySelector('.services-sticky-head');
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

// ── Rescue card glow effect ─────────────────────────────────
document.querySelectorAll('.rescue-card').forEach((card, cardIndex) => {
  const glow = card.querySelector('.rescue-glow');
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

  const colors = ['rgba(102,55,174,VAL)', 'rgba(62,130,247,VAL)', 'rgba(255,255,255,VAL)'];
  const discParticles = [];
  for (let i = 0; i < 60; i++) {
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
    requestAnimationFrame(drawDiscParticles);
  }
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
    requestAnimationFrame(drawProcParticles);
  }
  drawProcParticles();
}

// ── Smart Discovery: chat interaction ──────────────────────
const discTrigger = document.getElementById('discovery-input-trigger');
const discChatbox = document.getElementById('discovery-chatbox');
const discMessages = document.getElementById('discovery-messages');
const discField = document.getElementById('discovery-chatbox-field');
const discSend = document.getElementById('discovery-chatbox-send');
const discPillsBox = document.getElementById('discovery-pills');

const botReplies = [
  "That's really helpful — sounds like a great fit for a custom AI workflow. Book a discovery call and we'll map this out properly.",
  "Interesting! We've helped similar businesses automate exactly that. Let's get you on a call to scope it out.",
  "Got it. The first step is a 30-minute discovery call — we'll identify your highest-impact opportunities and put together an action plan.",
  "That's a common challenge we solve. A quick call is all it takes to figure out the best approach for your setup.",
];

function addMessage(text, role) {
  const msg = document.createElement('div');
  msg.className = `discovery-message ${role}`;
  msg.innerHTML = role === 'bot'
    ? `<div class="discovery-message-avatar">✦</div><div class="discovery-message-bubble">${text}</div>`
    : `<div class="discovery-message-bubble">${text}</div>`;
  discMessages.appendChild(msg);
  discMessages.scrollTop = discMessages.scrollHeight;
}

function showTyping() {
  const typing = document.createElement('div');
  typing.className = 'discovery-message bot';
  typing.id = 'disc-typing';
  typing.innerHTML = `<div class="discovery-message-avatar">✦</div><div class="discovery-typing"><span></span><span></span><span></span></div>`;
  discMessages.appendChild(typing);
  discMessages.scrollTop = discMessages.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('disc-typing');
  if (t) t.remove();
}

if (discTrigger && discChatbox) {
  let hasChatted = false;

  function sendMessage() {
    const text = discField.value.trim();
    if (!text) return;
    hasChatted = true;
    addMessage(text, 'user');
    discField.value = '';
    showTyping();
    setTimeout(() => {
      removeTyping();
      addMessage(botReplies[Math.floor(Math.random() * botReplies.length)], 'bot');
      discField.focus();
    }, 1400);
  }

  discTrigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  discSend.addEventListener('click', sendMessage);
  discField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-expand textarea + adaptive border-radius
  discField.addEventListener('input', () => {
    discField.style.height = 'auto';
    const lineHeight = parseFloat(getComputedStyle(discField).lineHeight) || 22.5;
    const maxHeight = lineHeight * 5;
    const newHeight = Math.min(discField.scrollHeight, maxHeight);
    discField.style.height = newHeight + 'px';
    discField.style.overflowY = discField.scrollHeight > maxHeight ? 'auto' : 'hidden';
    const isMultiline = newHeight > lineHeight * 1.5;
    discTrigger.style.borderRadius = isMultiline ? '16px' : '28px';
  });

  if (discPillsBox) {
    discPillsBox.querySelectorAll('.discovery-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        hasChatted = true;
        setTimeout(() => {
          addMessage(pill.textContent.trim(), 'user');
          showTyping();
          setTimeout(() => {
            removeTyping();
            addMessage(botReplies[Math.floor(Math.random() * botReplies.length)], 'bot');
            discField.focus();
          }, 1400);
        }, 450);
      });
    });
  }
}

// ── Discovery: character pop on card hover ──────────────────
const discoveryChat = document.querySelector('.discovery-chat-outer');
if (discoveryChat) {
  const characters = Array.from(discoveryChat.querySelectorAll('.discovery-character'));
  let lastPick = -1;
  discoveryChat.addEventListener('mouseenter', () => {
    let idx;
    do { idx = Math.floor(Math.random() * characters.length); }
    while (idx === lastPick && characters.length > 1);
    lastPick = idx;
    characters.forEach((c, i) => {
      if (i !== idx) c.classList.remove('is-active');
    });
    characters[idx].classList.add('is-active');
  });
  discoveryChat.addEventListener('mouseleave', () => {
    characters.forEach((c) => c.classList.remove('is-active'));
  });
}

// ── Discovery pills: populate input on click ────────────────
document.querySelectorAll('.discovery-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    const input = document.querySelector('.discovery-input span');
    if (input) {
      input.textContent = pill.textContent;
      input.style.color = 'rgba(255,255,255,0.85)';
    }
    document.querySelectorAll('.discovery-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});

// ── Discovery bot bubble: scroll-triggered typewriter ───────
(function () {
  const botIntro   = document.getElementById('discovery-bot-intro');
  const typingDots = document.getElementById('discovery-typing-dots');
  const botText    = document.getElementById('discovery-bot-text');
  const discSection = document.querySelector('.discovery-section');

  if (!botIntro || !discSection) return;

  const fullText = "Tell us what's slowing your business down — or maybe an idea you've been sitting on. We'll help you figure out where to start.";
  let triggered = false;

  function typeWriter(el, text, speed) {
    let i = 0;
    el.textContent = '';
    el.style.display = 'block';
    function tick() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(tick, speed);
      }
    }
    tick();
  }

  const botObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !triggered) {
        triggered = true;
        botObserver.disconnect();
        botIntro.classList.add('is-visible');
        setTimeout(() => {
          typingDots.style.display = 'none';
          typeWriter(botText, fullText, 28);
        }, 1200);
      }
    });
  }, { threshold: 0.35 });

  botObserver.observe(discSection);
})();
