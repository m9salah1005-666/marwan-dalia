document.addEventListener('DOMContentLoaded', () => {
  /* =========================================================
     1. WOODEN KNOCK & DOOR CREAK SOUNDS (WEB AUDIO API)
  ========================================================= */
  let sharedAudioCtx = null;

  function getAudioContext() {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  }

  function playWoodKnockSound() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const triggerThud = (startTime, baseFreq, peakGain) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(52, startTime + 0.09);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(340, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.13);
    };

    const now = ctx.currentTime;
    triggerThud(now, 165, 0.55);
    triggerThud(now + 0.065, 145, 0.35);
  }

  function playWoodenDoorCreak() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 1.65;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';

    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(235, now + 0.35);
    osc.frequency.exponentialRampToValueAtTime(175, now + 0.72);
    osc.frequency.exponentialRampToValueAtTime(295, now + 1.15);
    osc.frequency.exponentialRampToValueAtTime(135, now + duration);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(14, now);
    lfo.frequency.linearRampToValueAtTime(24, now + 0.9);
    lfo.frequency.linearRampToValueAtTime(9, now + duration);
    lfoGain.gain.setValueAtTime(18, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, now);
    filter.Q.setValueAtTime(5.5, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.16, now + 0.14);
    gainNode.gain.setValueAtTime(0.13, now + 0.75);
    gainNode.gain.linearRampToValueAtTime(0.17, now + 1.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + duration);
    lfo.stop(now + duration);
  }

  /* =========================================================
     2. THREE-KNOCK INTERACTION & 3D HINGED DOUBLE DOORS
  ========================================================= */
  const doorOverlay = document.getElementById('doorOverlay');
  const doorScene = document.querySelector('.door-scene');
  const tapHintText = document.getElementById('tapHintText');
  const dots = [
    document.getElementById('dot1'),
    document.getElementById('dot2'),
    document.getElementById('dot3')
  ];

  const bgMusic = document.getElementById('bgMusic');
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const iconPlay = document.getElementById('iconPlay');
  const iconEqualizer = document.getElementById('iconEqualizer');

  let knockCount = 0;
  let doorsTriggered = false;
  let isPlaying = false;

  function updateAudioUI(playing) {
    isPlaying = playing;
    if (playing) {
      iconPlay.classList.add('hidden');
      iconEqualizer.classList.remove('hidden');
    } else {
      iconEqualizer.classList.add('hidden');
      iconPlay.classList.remove('hidden');
    }
  }

  function startMusicSafely() {
    if (!bgMusic) return;
    bgMusic.volume = 0.65;
    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => updateAudioUI(true))
        .catch(() => updateAudioUI(false));
    }
  }

  function openInvitationDoors() {
    if (doorsTriggered) return;
    doorsTriggered = true;

    playWoodenDoorCreak();
    doorOverlay.classList.add('doors-open');

    setTimeout(() => {
      doorOverlay.classList.add('enter-site');
      document.body.classList.remove('doors-locked');
    }, 1650);

    setTimeout(() => {
      doorOverlay.classList.add('is-hidden');
      triggerVisibleReveals();
    }, 2800);
  }

  function handleDoorKnock() {
    if (doorsTriggered || knockCount >= 3) return;

    knockCount += 1;
    playWoodKnockSound();

    if (navigator.vibrate) {
      navigator.vibrate(45);
    }

    if (doorScene) {
      doorScene.classList.remove('door-knock-shake');
      void doorScene.offsetWidth;
      doorScene.classList.add('door-knock-shake');
    }

    if (dots[knockCount - 1]) {
      dots[knockCount - 1].classList.add('active');
    }

    if (tapHintText) {
      if (knockCount === 1) {
        tapHintText.textContent = 'الدقة الأولى... باقي دقتين';
      } else if (knockCount === 2) {
        tapHintText.textContent = 'الدقة الثانية... باقي دقة';
      } else if (knockCount === 3) {
        tapHintText.textContent = 'أهلاً بكم...';
      }
    }

    if (knockCount === 3) {
      // Unlock & start music directly inside user gesture so browsers allow autoplay
      startMusicSafely();
      setTimeout(() => {
        openInvitationDoors();
      }, 280);
    }
  }

  if (doorOverlay) {
    doorOverlay.addEventListener('click', handleDoorKnock);
    doorOverlay.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDoorKnock();
      }
    });
  }

  /* =========================================================
     3. FLOATING MUSIC CONTROLLER
  ========================================================= */
  if (audioToggleBtn && bgMusic) {
    audioToggleBtn.addEventListener('click', () => {
      if (isPlaying) {
        bgMusic.pause();
        updateAudioUI(false);
      } else {
        startMusicSafely();
      }
    });
  }

  /* =========================================================
     4. LIVE COUNTDOWN TO 9 DECEMBER 2026 (2:00 PM)
  ========================================================= */
  // Fixed ISO format: '09' instead of '9'
  const targetDate = new Date('2026-12-09T14:00:00').getTime();
  const cdDays = document.getElementById('cdDays');
  const cdHours = document.getElementById('cdHours');
  const cdMins = document.getElementById('cdMins');
  const cdSecs = document.getElementById('cdSecs');

  function updateCountdown() {
    const now = Date.now();
    const diff = targetDate - now;

    if (isNaN(diff) || diff <= 0) {
      cdDays.textContent = '00';
      cdHours.textContent = '00';
      cdMins.textContent = '00';
      cdSecs.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    cdDays.textContent = String(days).padStart(2, '0');
    cdHours.textContent = String(hours).padStart(2, '0');
    cdMins.textContent = String(mins).padStart(2, '0');
    cdSecs.textContent = String(secs).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* =========================================================
     5. RSVP RADIO PILLS & GUEST BOOK (LOCALSTORAGE)
  ========================================================= */
  const pillYes = document.getElementById('pillYes');
  const pillNo = document.getElementById('pillNo');
  const radioInputs = document.querySelectorAll('input[name="attending"]');

  radioInputs.forEach((radio) => {
    radio.addEventListener('change', () => {
      pillYes.classList.toggle('active', radio.value === 'YES' && radio.checked);
      pillNo.classList.toggle('active', radio.value === 'NO' && radio.checked);
    });
  });

  const rsvpForm = document.getElementById('rsvpForm');
  const guestNameInput = document.getElementById('guestName');
  const guestMessageInput = document.getElementById('guestMessage');
  const formFeedback = document.getElementById('formFeedback');
  const guestbookList = document.getElementById('guestbookList');
  const guestbookEmpty = document.getElementById('guestbookEmpty');

  const STORAGE_KEY = 'marwan_dalia_guestbook_2026';

  function loadEntries() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function renderGuestbook() {
    const entries = loadEntries();
    guestbookList.innerHTML = '';

    if (entries.length === 0) {
      guestbookEmpty.classList.remove('hidden');
      return;
    }

    guestbookEmpty.classList.add('hidden');

    entries.forEach((entry) => {
      const li = document.createElement('li');
      li.className = 'guestbook-item';

      const topRow = document.createElement('div');
      topRow.className = 'guestbook-item-top';

      const nameEl = document.createElement('span');
      nameEl.className = 'guestbook-item-name';
      nameEl.textContent = entry.name;

      const badgeEl = document.createElement('span');
      badgeEl.className = 'guestbook-badge';
      badgeEl.textContent = entry.attending === 'YES' ? 'ATTENDING' : 'REGRETS';

      topRow.appendChild(nameEl);
      topRow.appendChild(badgeEl);
      li.appendChild(topRow);

      if (entry.message) {
        const msgEl = document.createElement('p');
        msgEl.className = 'guestbook-item-msg';
        msgEl.textContent = entry.message;
        li.appendChild(msgEl);
      }

      guestbookList.appendChild(li);
    });
  }

  renderGuestbook();

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = guestNameInput.value.trim();
      const message = guestMessageInput.value.trim();
      const attendingEl = document.querySelector('input[name="attending"]:checked');
      const attending = attendingEl ? attendingEl.value : 'YES';

      if (!name) {
        formFeedback.textContent = 'Please enter your name first.';
        guestNameInput.focus();
        return;
      }

      const entries = loadEntries();
      entries.unshift({
        name,
        attending,
        message,
        createdAt: new Date().toISOString()
      });
      saveEntries(entries);
      renderGuestbook();

      rsvpForm.reset();
      pillYes.classList.add('active');
      pillNo.classList.remove('active');
      formFeedback.textContent = 'Thank you! Your response has been recorded.';

      setTimeout(() => {
        formFeedback.textContent = '';
      }, 4000);
    });
  }

  /* =========================================================
     6. SCROLL REVEAL & SHARE BUTTONS
  ========================================================= */
  const revealElements = document.querySelectorAll('.reveal');

  function triggerVisibleReveals() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealElements.forEach((el) => observer.observe(el));
  }

  const shareWhatsapp = document.getElementById('shareWhatsapp');
  const copyLinkBtn = document.getElementById('copyLinkBtn');

  if (shareWhatsapp) {
    shareWhatsapp.addEventListener('click', () => {
      const text = encodeURIComponent(
        "You're invited to Marwan & Dalia's Wedding on 9 December 2026! " + window.location.href
      );
      window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    });
  }

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        copyLinkBtn.title = 'Link Copied!';
      } catch {
        // Fallback ignored
      }
    });
  }
});