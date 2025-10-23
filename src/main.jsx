// src/main.jsx
// (keeps original comments and behavior; makes the audio overlay function as a modal)

document.addEventListener('DOMContentLoaded', () => {
  (function () {
    const audioOverlay = document.getElementById('audio-overlay');
    const allowBtn = document.getElementById('allow-audio');
    const canIcon = document.getElementById('can-icon');
    // canSound previously came from a DOM <audio>; moved into JS as requested
    const canSound = new Audio('/canopening.mp3');
    canSound.preload = 'auto';
    const momBtn = document.getElementById('mom-btn');
    const momAudio = document.getElementById('mom-audio');
    const blocksOverlay = document.getElementById('blocks-overlay');
    const stopMotionNav = document.getElementById('stopmotion-btn');
    const blocksStage = document.getElementById('blocks-stage');

    let audioAllowed = false;
    let canClickLock = false;

    // Safety: if audioOverlay or allowBtn missing, bail gracefully
    if (!audioOverlay || !allowBtn) {
      // Still wire up other features if present
      // (we don't throw — user wanted minimal changes elsewhere)
      if (canIcon) {
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
          document.querySelector('#home')?.scrollIntoView({ behavior: 'smooth' });
        });
      }
      // Return early since overlay/button not available to convert to modal
      return;
    }

    // ---------------- Audio overlay (modal) logic ----------------
    // We'll treat the overlay as a modal controlled by the 'visible' class.
    // CSS already defines:
    //   #audio-overlay { opacity:0; pointer-events:none; ... }
    //   #audio-overlay.visible { opacity:1; pointer-events:all; ... }
    // So adding/removing 'visible' shows/hides and controls interactivity.

    function openOverlay() {
      audioOverlay.classList.add('visible');
      audioOverlay.setAttribute('aria-hidden', 'false');
      // trap focus: move focus to the allow button
      try { allowBtn.focus(); } catch (e) {}
    }

    function hideOverlay() {
      audioOverlay.classList.remove('visible');
      audioOverlay.setAttribute('aria-hidden', 'true');
      audioAllowed = true;
      try { localStorage.setItem('audioAllowed', 'true'); } catch (e) {}
    }

    // Check if already allowed (persisted)
    try {
      if (localStorage.getItem('audioAllowed') === 'true') {
        audioAllowed = true;
        // ensure overlay is hidden
        audioOverlay.classList.remove('visible');
        audioOverlay.setAttribute('aria-hidden', 'true');
      } else {
        // show modal on first visit
        openOverlay();
      }
    } catch (err) {
      // localStorage unavailable -> show overlay but don't crash
      openOverlay();
    }

    // Clicking the allow button
    allowBtn.addEventListener('click', async (e) => {
      e.stopPropagation(); // prevent overlay click from interfering
      try {
        // attempt to unlock audio context
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

    // Clicking anywhere on overlay background should also close the modal
    audioOverlay.addEventListener('click', (e) => {
      // only treat clicks on the backdrop (overlay itself) as dismissal
      if (e.target === audioOverlay) {
        // simulate clicking allow button so same code path runs
        allowBtn.click();
      }
    });

    // Make Escape key close the modal (standard modal behavior)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && audioOverlay.classList.contains('visible')) {
        allowBtn.click();
      }
    });

    // ---------------- Can click sound ----------------
    if (canIcon) {
      canIcon.addEventListener('click', async () => {
        if (canClickLock) return;
        canClickLock = true;

        const original = canIcon.getAttribute('src');
        const swapped = '/can_icon_uponclick.svg';
        canIcon.setAttribute('src', swapped);

        // Attempt to play the can sound. If audio not unlocked yet, try to unlock via AudioContext,
        // then attempt to play the Audio object. If that still fails, fallback to quickSfx if present.
        if (canSound) {
          try {
            // If the overlay hasn't granted audio yet, try to resume/create an AudioContext on this user gesture.
            if (!audioAllowed) {
              try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                // Some browsers require resume() on a context created earlier — resume defensively.
                if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
                  await ctx.resume();
                }
                // Mark audioAllowed since we had a user gesture
                audioAllowed = true;
                try { localStorage.setItem('audioAllowed', 'true'); } catch (e) {}
                // close context since we only used it to unlock
                try { ctx.close(); } catch (e) {}
              } catch (unlockErr) {
                // ignore — we'll still try to play the Audio object directly
                console.warn('audio unlock attempt failed', unlockErr);
              }
            }

            canSound.currentTime = 0;
            await canSound.play();
          } catch (e) {
            // fallback: try quickSfx (if defined) — preserve original behavior
            try { quickSfx && quickSfx.play(); } catch (e2) {}
          }
        }

        setTimeout(() => {
          canIcon.setAttribute('src', original);
          canClickLock = false;
        }, 2000);

        document.querySelector('#home')?.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // ---------------- Mom button audio cycle ----------------
    let momIndex = 0;
    const momAudioFiles = [
      '/mom.mp3',
      '/mom2.mp3',
      '/mom3.mp3',
      '/mom4.mp3',
      '/mom5.mp3',
      '/mom6.mp3',
    ];

    if (momBtn) {
      momBtn.addEventListener('click', async () => {
        const src = momAudioFiles[momIndex];
        momIndex = (momIndex + 1) % momAudioFiles.length;

        if (!audioAllowed) {
          openOverlay();
          return;
        }

        momAudio.src = src;
        momAudio.currentTime = 0;
        try { await momAudio.play(); } catch (e) {
          console.warn('mom audio play prevented', e);
        }
      });
    }

    // ---------------- Stop motion sequence (continuous looping) ----------------
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

    // only set up interval if there are blocks
    if (blocks.length > 0) {
      setInterval(playStopMotionSequence, 3000);
    }

    // ---------------- Navigation ----------------
    if (stopMotionNav) {
      stopMotionNav.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('#stopmotion')?.scrollIntoView({ behavior: 'smooth' });
      });
    }

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
    if (blocksStage) {
      blocksStage.addEventListener('click', () => {
        window.open('https://www.youtube.com/watch?v=8JGcD7ExDtA&t', '_blank', 'noopener');
      });
    }

    // ---------------- Keyboard trigger for mom button ----------------
    if (momBtn) {
      momBtn.addEventListener('keyup', (e) => {
        if (e.key === 'Enter' || e.key === ' ') momBtn.click();
      });
    }

  })();
});

