(function () {
  const audioOverlay = document.getElementById('audio-overlay');
  const allowBtn = document.getElementById('allow-audio');
  const canIcon = document.getElementById('can-icon');
  const canSound = document.getElementById('can-sound');
  const momBtn = document.getElementById('mom-btn');
  const momAudio = document.getElementById('mom-audio');
  const blocksOverlay = document.getElementById('blocks-overlay');
  const stopMotionNav = document.getElementById('stopmotion-btn');
  const blocksStage = document.getElementById('blocks-stage');

  let audioAllowed = false;
  let canClickLock = false;

  // ---------------- Audio overlay logic ----------------
  function hideOverlay() {
    audioOverlay.style.display = 'none';
    audioAllowed = true;
    localStorage.setItem('audioAllowed', 'true');
  }

  // Check if already allowed
  if (localStorage.getItem('audioAllowed') === 'true') {
    audioAllowed = true;
    audioOverlay.style.display = 'none';
  } else {
    audioOverlay.style.display = 'flex';
  }

  // Clicking the allow button
  allowBtn.addEventListener('click', async (e) => {
    e.stopPropagation(); // prevent overlay click from interfering
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = 0;
      o.connect(g);
      g.connect(ctx.destination);
      o.start(0);
      setTimeout(() => { o.stop(); ctx.close(); }, 50);
    } catch (err) {
      console.warn('Audio unlock failed', err);
    }
    hideOverlay();
  });

  // Clicking anywhere on overlay background
  audioOverlay.addEventListener('click', (e) => {
    if (e.target === audioOverlay) {
      allowBtn.click();
    }
  });

  // ---------------- Can click sound ----------------
  canIcon.addEventListener('click', async () => {
    if (canClickLock) return;
    canClickLock = true;

    const original = canIcon.getAttribute('src');
    const swapped = '/can_icon_uponclick.svg';
    canIcon.setAttribute('src', swapped);

    if (audioAllowed) {
      try {
        canSound.currentTime = 0;
        await canSound.play();
      } catch (e) {
        try { quickSfx && quickSfx.play(); } catch (e2) {}
      }
    }

    setTimeout(() => {
      canIcon.setAttribute('src', original);
      canClickLock = false;
    }, 2000);

    document.querySelector('#home').scrollIntoView({ behavior: 'smooth' });
  });

  // ---------------- Mom button audio cycle ----------------
  let momIndex = 0;
  const momAudioFiles = [
    '/mom.mp3', '/mom2.mp3', '/mom3.mp3',
    '/mom4.mp3', '/mom5.mp3', '/mom6.mp3',
  ];

  momBtn.addEventListener('click', async () => {
    const src = momAudioFiles[momIndex];
    momIndex = (momIndex + 1) % momAudioFiles.length;

    if (!audioAllowed) {
      audioOverlay.style.display = 'flex';
      return;
    }

    momAudio.src = src;
    momAudio.currentTime = 0;
    try { await momAudio.play(); } catch (e) {
      console.warn('mom audio play prevented', e);
    }
  });

  // ---------------- Stop motion sequence ----------------
  const blocks = Array.from(document.querySelectorAll('.block'));
  blocks.sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));

  async function playStopMotionSequence() {
    for (let i = 0; i < blocks.length; i++) {
      const el = blocks[i];
      setTimeout(() => {
        el.classList.add('lay');
        setTimeout(() => el.classList.remove('lay'), 500);
      }, i * 110);
    }
  }

  setInterval(playStopMotionSequence, 3000);

  // ---------------- Navigation ----------------
  stopMotionNav.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('#stopmotion').scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelectorAll('.nav-link').forEach((a) => {
    a.addEventListener('click', (ev) => {
      const href = a.getAttribute('href');
      if (href && href.startsWith('#')) {
        ev.preventDefault();
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ---------------- Blocks stage YouTube ----------------
  blocksStage.addEventListener('click', () => {
    window.open('https://www.youtube.com/watch?v=8JGcD7ExDtA&t', '_blank', 'noopener');
  });

  // ---------------- Keyboard trigger for mom button ----------------
  momBtn.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' || e.key === ' ') momBtn.click();
  });

})();
