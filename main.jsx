(function () {
  const audioOverlay = document.getElementById('audio-overlay');
  const allowBtn = document.getElementById('allow-audio');
  const canIcon = document.getElementById('can-icon');
  const canSound = document.getElementById('can-sound');
  const momBtn = document.getElementById('mom-btn');
  const momAudio = document.getElementById('mom-audio');
  const quickSfx = document.getElementById('quick-sfx');
  const blocksOverlay = document.getElementById('blocks-overlay');
  const stopMotionNav = document.getElementById('stopmotion-btn');
  const blocksStage = document.getElementById('blocks-stage');

  let audioAllowed = false;
  let canClickLock = false;

  // check if user already allowed audio
  if (localStorage.getItem('audioAllowed') === 'true') {
    audioAllowed = true;
    audioOverlay.classList.remove('visible');
    audioOverlay.setAttribute('aria-hidden', 'true');
    audioOverlay.style.display = 'none'; // hide completely
  } else {
    // make sure overlay blocks clicks while visible
    audioOverlay.style.pointerEvents = 'all';
    audioOverlay.style.display = 'flex';
  }

  allowBtn.addEventListener('click', async () => {
    try {
      await unlockAudio();
    } catch (e) {
      console.warn('Audio unlock failed:', e);
    }
    audioAllowed = true;
    localStorage.setItem('audioAllowed', 'true');

    // hide overlay safely
    audioOverlay.style.pointerEvents = 'none';
    audioOverlay.classList.remove('visible');
    audioOverlay.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      audioOverlay.style.display = 'none';
    }, 300); // match CSS fade-out duration
  });

  async function unlockAudio() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = 0;
      o.connect(g);
      g.connect(ctx.destination);
      o.start(0);
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, 50);
    } catch (err) {}
  }

  // Allow audio if user clicks outside
  audioOverlay.addEventListener('click', (e) => {
    if (e.target === audioOverlay) {
      allowBtn.click();
      e.stopPropagation(); // prevent clicks from passing through
    }
  });

  // Can click sound
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
        try {
          quickSfx && quickSfx.play();
        } catch (e2) {}
      }
    }

    setTimeout(() => {
      canIcon.setAttribute('src', original);
      canClickLock = false;
    }, 2000);

    document.querySelector('#home').scrollIntoView({ behavior: 'smooth' });
  });

  // Mom button audio cycle
  let momIndex = 0;
  const momAudioFiles = [
    '/mom.mp3',
    '/mom2.mp3',
    '/mom3.mp3',
    '/mom4.mp3',
    '/mom5.mp3',
    '/mom6.mp3',
  ];

  momBtn.addEventListener('click', async () => {
    const src = momAudioFiles[momIndex];
    momIndex = (momIndex + 1) % momAudioFiles.length;

    if (!audioAllowed) {
      audioOverlay.classList.add('visible');
      audioOverlay.setAttribute('aria-hidden', 'false');
      audioOverlay.style.pointerEvents = 'all';
      audioOverlay.style.display = 'flex';
      return;
    }

    momAudio.src = src;
    momAudio.currentTime = 0;
    try {
      await momAudio.play();
    } catch (e) {
      console.warn('mom audio play prevented', e);
    }
  });

  // Stop motion sequence (continuous looping)
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

  // continuous looping animation every 3s
  setInterval(playStopMotionSequence, 3000);

  // Scroll to stopmotion on nav click (no YouTube)
  stopMotionNav.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('#stopmotion').scrollIntoView({ behavior: 'smooth' });
  });

  // smooth scroll for all nav links
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

  // make clicking the stage open YouTube
  blocksStage.addEventListener('click', () => {
    window.open('https://www.youtube.com/watch?v=8JGcD7ExDtA&t', '_blank', 'noopener');
  });

  // keyboard trigger for mom button
  momBtn.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' || e.key === ' ') momBtn.click();
  });
})();
