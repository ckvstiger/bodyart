/* ===================================================
   MARTIAL CLASH: MAIN APPLICATION LOGIC
   Combo Arena, Dynamic Radar Chart, 3D Tilt & Interactivity
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initSoundControl();
  initComboArena();
  initRadarChart();
  init3DTilt();
  initMobileNav();
});

/* ===================================================
   1. SOUND FX CONTROLLER
   =================================================== */
function initSoundControl() {
  const soundBtn = document.getElementById('soundToggleBtn');
  const soundText = document.getElementById('soundStatusText');
  if (!soundBtn) return;

  soundBtn.addEventListener('click', () => {
    soundFX.init();
    const isMuted = soundFX.toggleMute();
    if (isMuted) {
      soundBtn.classList.add('sound-muted');
      if (soundText) soundText.textContent = '音效：關閉';
    } else {
      soundBtn.classList.remove('sound-muted');
      if (soundText) soundText.textContent = '音效：開啟';
      soundFX.playUI(600);
    }
  });

  // Resume Audio on first user interaction anywhere
  const resumeAudio = () => {
    soundFX.ensureContext();
    window.removeEventListener('click', resumeAudio);
    window.removeEventListener('keydown', resumeAudio);
  };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
}

/* ===================================================
   2. INTERACTIVE COMBO ARENA (連招模擬器)
   =================================================== */
function initComboArena() {
  let comboCount = 0;
  let totalDamage = 0;
  let comboTimer = null;

  const comboCountEl = document.getElementById('comboCount');
  const totalDamageEl = document.getElementById('totalDamage');
  const statusFeedEl = document.getElementById('strikeStatusFeed');
  const dummyEl = document.getElementById('strikeDummy');
  const stageEl = document.getElementById('arenaStage');
  const strikeButtons = document.querySelectorAll('.strike-btn');

  // Move Definitions
  const moves = {
    // Boxing Moves
    'jab': { name: '刺拳 (Jab)', damage: 45, type: 'fire', sound: 'punch', strength: 0.7, desc: '迅猛先手 · 距離控制' },
    'cross': { name: '後手直拳 (Cross)', damage: 120, type: 'fire', sound: 'punch', strength: 1.2, desc: '穿透重砲 · 重心旋轉' },
    'hook': { name: '擺勾拳 (Hook)', damage: 155, type: 'fire', sound: 'punch', strength: 1.4, desc: '弧線爆擊 · 破壞下顎' },
    'uppercut': { name: '上勾拳 (Uppercut)', damage: 180, type: 'fire', sound: 'punch', strength: 1.6, desc: '極限近身 · 拔地撕裂' },

    // Taekwondo Moves
    'front_kick': { name: '前踢 (Front Kick)', damage: 60, type: 'thunder', sound: 'kick', strength: 0.8, desc: '直線破障 · 瞬間彈出' },
    'roundhouse': { name: '旋踢 (Roundhouse)', damage: 140, type: 'thunder', sound: 'kick', strength: 1.3, desc: '腰部旋扭 · 摧毀側肋' },
    'axe_kick': { name: '下壓 (Axe Kick)', damage: 175, type: 'thunder', sound: 'kick', strength: 1.5, desc: '戰斧劈扣 · 霸道制空' },
    'spinning_540': { name: '540°旋風踢 (540 Kick)', damage: 260, type: 'crit', sound: 'critical', strength: 2.0, desc: '極致空中絕技 · 終極暴擊！' }
  };

  function executeStrike(moveKey) {
    const move = moves[moveKey];
    if (!move) return;

    comboCount++;
    totalDamage += move.damage;

    // Reset combo timer (3.5 seconds)
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
      if (comboCount > 1) {
        if (statusFeedEl) statusFeedEl.innerHTML = `<span style="color:#a0a5b8">連段結束！最高連擊 ${comboCount} HITS!</span>`;
      }
      comboCount = 0;
      if (comboCountEl) comboCountEl.textContent = '0';
    }, 3500);

    // Update Counter HUD
    if (comboCountEl) {
      comboCountEl.textContent = comboCount;
      comboCountEl.classList.remove('bump');
      void comboCountEl.offsetWidth; // Trigger reflow
      comboCountEl.classList.add('bump');
    }

    if (totalDamageEl) {
      totalDamageEl.textContent = totalDamage.toLocaleString();
    }

    // Play Synthesized Audio
    if (move.sound === 'punch') {
      soundFX.playPunch(move.strength);
    } else if (move.sound === 'kick') {
      soundFX.playKick(move.strength);
    } else if (move.sound === 'critical') {
      soundFX.playCritical();
    }

    // Status Message
    let statusText = `💥 ${move.name} +${move.damage} DMG`;
    if (comboCount >= 10 && comboCount % 5 === 0) {
      statusText = `🔥 ULTRA COMBO ×${comboCount}! ${move.name}`;
    }
    if (moveKey === 'spinning_540') {
      statusText = `⚡ CRITICAL HIT!! 540° 旋風超必殺！ +${move.damage} DMG`;
    }
    if (statusFeedEl) {
      statusFeedEl.innerHTML = statusText;
    }

    // Visual Screen Shake & Target Reaction
    if (stageEl) {
      stageEl.classList.remove('screen-shake');
      void stageEl.offsetWidth;
      stageEl.classList.add('screen-shake');
    }

    if (dummyEl) {
      const tiltX = (Math.random() - 0.5) * 20;
      const tiltY = (Math.random() - 0.5) * 20;
      dummyEl.style.transform = `scale(0.92) translate(${tiltX}px, ${tiltY}px) rotate(${tiltX * 0.5}deg)`;
      setTimeout(() => {
        dummyEl.style.transform = 'scale(1) translate(0, 0) rotate(0deg)';
      }, 150);
    }

    // Floating Hit Text
    createFloatingHitText(move.name, move.damage, move.type);

    // Canvas Spark Burst
    if (particleEngine && stageEl) {
      const rect = stageEl.getBoundingClientRect();
      const sparkX = rect.left + rect.width / 2 + (Math.random() - 0.5) * 80;
      const sparkY = rect.top + rect.height / 2 + (Math.random() - 0.5) * 60;
      particleEngine.triggerBurst(sparkX, sparkY, move.type, moveKey === 'spinning_540' ? 40 : 20);
    }
  }

  function createFloatingHitText(name, damage, type) {
    if (!stageEl) return;
    const hitText = document.createElement('div');
    hitText.className = 'floating-hit-text';
    hitText.textContent = `+${damage}`;

    if (type === 'fire') {
      hitText.style.color = '#ff334b';
      hitText.style.textShadow = '0 0 15px rgba(255, 42, 68, 0.8)';
    } else if (type === 'thunder') {
      hitText.style.color = '#00e5ff';
      hitText.style.textShadow = '0 0 15px rgba(0, 229, 255, 0.8)';
    } else {
      hitText.style.color = '#ffd700';
      hitText.style.fontSize = '2.4rem';
      hitText.style.textShadow = '0 0 25px rgba(255, 215, 0, 1)';
    }

    // Position around center of stage
    const randOffsetLeft = (Math.random() - 0.5) * 120;
    const randOffsetTop = (Math.random() - 0.5) * 60;
    hitText.style.left = `calc(50% + ${randOffsetLeft}px)`;
    hitText.style.top = `calc(50% + ${randOffsetTop}px)`;

    stageEl.appendChild(hitText);

    setTimeout(() => {
      hitText.remove();
    }, 700);
  }

  // Button Click Listeners
  strikeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const move = btn.getAttribute('data-move');
      if (move) executeStrike(move);
    });
  });

  // Stage Click Listener (Random Punch/Kick)
  if (stageEl) {
    stageEl.addEventListener('click', (e) => {
      if (e.target.closest('.strike-btn')) return;
      const moveKeys = Object.keys(moves);
      const randomMove = moveKeys[Math.floor(Math.random() * moveKeys.length)];
      executeStrike(randomMove);
    });
  }

  // Keyboard Shortcuts Listener
  const keyMap = {
    'q': 'jab',
    'w': 'cross',
    'e': 'hook',
    'r': 'uppercut',
    'a': 'front_kick',
    's': 'roundhouse',
    'd': 'axe_kick',
    'f': 'spinning_540'
  };

  window.addEventListener('keydown', (e) => {
    // If typing in input or modifier keys held, ignore
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.altKey || e.metaKey) return;

    const key = e.key.toLowerCase();
    if (keyMap[key]) {
      e.preventDefault();
      executeStrike(keyMap[key]);

      // Visual feedback on button
      const btn = document.querySelector(`.strike-btn[data-move="${keyMap[key]}"]`);
      if (btn) {
        btn.classList.add('active');
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          btn.classList.remove('active');
          btn.style.transform = '';
        }, 120);
      }
    }
  });
}

/* ===================================================
   3. RADAR CHART (5-AXIS MARTIAL COMPARISON)
   =================================================== */
function initRadarChart() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Set crisp canvas dimensions
  const dpr = window.devicePixelRatio || 1;
  const size = 380;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  ctx.scale(dpr, dpr);

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 130;

  const labels = ['攻擊距離 (Range)', '瞬間爆發 (Power)', '移動敏捷 (Agility)', '防守覆蓋 (Defense)', '體能續航 (Stamina)'];
  const totalAxes = labels.length;

  // Stats on scale 0.0 to 1.0
  // Boxing: 近身爆發高、防守緊密、步伐沉穩，但距離短
  const boxingData = [0.55, 0.95, 0.85, 0.92, 0.88];
  // Taekwondo: 距離遠、腿法極致靈活速度快、爆發高，防禦偏側向
  const tkdData = [0.98, 0.90, 0.96, 0.65, 0.85];

  let animationProgress = 0;

  function drawRadar() {
    ctx.clearRect(0, 0, size, size);

    // 1. Draw Web Polygons (Grid)
    const levels = 5;
    for (let l = 1; l <= levels; l++) {
      const levelRadius = (radius / levels) * l;
      ctx.beginPath();
      for (let i = 0; i < totalAxes; i++) {
        const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
        const x = centerX + Math.cos(angle) * levelRadius;
        const y = centerY + Math.sin(angle) * levelRadius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 2. Draw Axis Lines & Labels
    ctx.font = '600 12px "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#a0a5b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < totalAxes; i++) {
      const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.stroke();

      // Label Position
      const labelX = centerX + Math.cos(angle) * (radius + 24);
      const labelY = centerY + Math.sin(angle) * (radius + 20);
      ctx.fillText(labels[i], labelX, labelY);
    }

    // 3. Draw Boxing Polygon (Fire Crimson)
    drawDataPolygon(boxingData, 'rgba(255, 42, 68, 0.35)', '#ff2a44', animationProgress);

    // 4. Draw Taekwondo Polygon (Thunder Cyan)
    drawDataPolygon(tkdData, 'rgba(0, 229, 255, 0.35)', '#00e5ff', animationProgress);

    if (animationProgress < 1) {
      animationProgress += 0.03;
      requestAnimationFrame(drawRadar);
    }
  }

  function drawDataPolygon(data, fillColor, strokeColor, progress) {
    ctx.beginPath();
    for (let i = 0; i < totalAxes; i++) {
      const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
      const val = data[i] * progress;
      const x = centerX + Math.cos(angle) * (radius * val);
      const y = centerY + Math.sin(angle) * (radius * val);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Points
    for (let i = 0; i < totalAxes; i++) {
      const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
      const val = data[i] * progress;
      const x = centerX + Math.cos(angle) * (radius * val);
      const y = centerY + Math.sin(angle) * (radius * val);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Animate on scroll trigger
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animationProgress = 0;
        drawRadar();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  observer.observe(canvas);
}

/* ===================================================
   4. 3D CARD TILT EFFECT
   =================================================== */
function init3DTilt() {
  const tiltElements = document.querySelectorAll('.clash-card, .pillar-card');

  tiltElements.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });
}

/* ===================================================
   5. MOBILE NAV & SMOOTH SCROLL
   =================================================== */
function initMobileNav() {
  const mobileToggle = document.getElementById('mobileToggleBtn');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
    });
  }
}
