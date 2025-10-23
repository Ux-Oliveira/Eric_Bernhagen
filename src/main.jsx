document.addEventListener('DOMContentLoaded', () => {
  (function () {
    const audioOverlay = document.getElementById('audio-overlay');
    const allowBtn = document.getElementById('allow-audio');
    const canIcon = document.getElementById('can-icon');
    //the can sound wasn't working on html
    const canSound = new Audio('/canopening.mp3');
    canSound.preload = 'auto';
    const momBtn = document.getElementById('mom-btn');
    const momAudio = document.getElementById('mom-audio');
    const blocksOverlay = document.getElementById('blocks-overlay');
    const stopMotionNav = document.getElementById('stopmotion-btn');
    const blocksStage = document.getElementById('blocks-stage');

    let audioAllowed = false;
    let canClickLock = false;

    if (!audioOverlay || !allowBtn) {
      if (canIcon) {
        canIcon.addEventListener('click', async () => {
          if (canClickLock) return;
          canClickLock = true;
          const original = canIcon.getAttribute('src');
          const swapped = '/caniconuponclick.png';
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
      return;
    }
    
    function openOverlay() {
      audioOverlay.classList.add('visible');
      audioOverlay.setAttribute('aria-hidden', 'false');
      //this allows focus to the allow button
      try { allowBtn.focus(); } catch (e) {}
    }

    function hideOverlay() {
      audioOverlay.classList.remove('visible');
      audioOverlay.setAttribute('aria-hidden', 'true');
      audioAllowed = true;
      try { localStorage.setItem('audioAllowed', 'true'); } catch (e) {}
    }

    //now we gotta check if the audio was already allowed on the device
    try {
      if (localStorage.getItem('audioAllowed') === 'true') {
        audioAllowed = true;
        //ensures overlay is hidden
        audioOverlay.classList.remove('visible');
        audioOverlay.setAttribute('aria-hidden', 'true');
      } else {
        // show modal on first visit
        openOverlay();
      }
    } catch (err) {
      //this will catch the fact you didn't allow audio and the overlay will still appear
      openOverlay();
    }

    //upon clicking the allow button
    allowBtn.addEventListener('click', async (e) => {
      e.stopPropagation(); //I had to add this cause I thought the overlay was interfering with other functions
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

    //jnow this will make sure clicking anywhere on overlay background should also close the allow audio modal
    audioOverlay.addEventListener('click', (e) => {
      //but it won't _blank the link behind the modal, in the video being displayed
      if (e.target === audioOverlay) {
        allowBtn.click();
      }
    });

    //escape key closes the modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && audioOverlay.classList.contains('visible')) {
        allowBtn.click();
      }
    });

    //I had to move the can clicking sound to the main.jsx
    if (canIcon) {
      canIcon.addEventListener('click', async () => {
        if (canClickLock) return;
        canClickLock = true;

        const original = canIcon.getAttribute('src');
        const swapped = '/caniconuponclick.png';
        canIcon.setAttribute('src', swapped);

        //this attempts to play the can sound. If audio is not unlocked, it'll try to unlock via audio context
        if (canSound) {
          try {
            //audio context created upon user not allowing audio
            if (!audioAllowed) {
              try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                //some browsers require resume() on a context created earlier. So...
                if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
                  await ctx.resume();
                }
                //this will mark audioAllowed since we had a user say yes
                audioAllowed = true;
                try { localStorage.setItem('audioAllowed', 'true'); } catch (e) {}
                try { ctx.close(); } catch (e) {}
              } catch (unlockErr) {
                //if ignored it'll still try to play the audio object directly
                console.warn('audio unlock attempt failed', unlockErr);
              }
            }

            canSound.currentTime = 0;
            await canSound.play();
          } catch (e) {
            //fallback not totally necessary
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

    //mom audio button
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

   //stop motion sequence
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

    if (blocks.length > 0) {
      setInterval(playStopMotionSequence, 3000);
    }

    //navbar
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

    //this makes sure clicking on any of the block pngs will on top the main block png will _blank a link
    if (blocksStage) {
      blocksStage.addEventListener('click', () => {
        window.open('https://www.youtube.com/watch?v=8JGcD7ExDtA&t', '_blank', 'noopener');
      });
    }

    //trigger for eric's mom button
    if (momBtn) {
      momBtn.addEventListener('keyup', (e) => {
        if (e.key === 'Enter' || e.key === ' ') momBtn.click();
      });
    }

  })();
});





