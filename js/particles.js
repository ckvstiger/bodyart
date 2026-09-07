/* ===================================================
   MARTIAL PARTICLES ENGINE
   Fiery Embers (Boxing) vs Electric Sparks (Taekwondo)
   =================================================== */

class ParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.sparkBurstList = [];
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.mouse = { x: -100, y: -100 };

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    // Create ambient particles
    const particleCount = Math.min(80, Math.floor(this.width / 20));
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createAmbientParticle());
    }

    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  createAmbientParticle() {
    const isLeft = Math.random() < 0.5;
    return {
      x: isLeft ? Math.random() * (this.width * 0.5) : this.width * 0.5 + Math.random() * (this.width * 0.5),
      y: Math.random() * this.height,
      size: Math.random() * 3 + 1,
      speedX: isLeft ? (Math.random() - 0.3) * 0.8 : (Math.random() - 0.7) * 0.8,
      speedY: isLeft ? -(Math.random() * 1.5 + 0.5) : (Math.random() * 1.5 + 0.5), // Embers rise, lightning falls
      opacity: Math.random() * 0.6 + 0.2,
      isFire: isLeft,
      pulse: Math.random() * Math.PI,
      pulseSpeed: 0.03 + Math.random() * 0.04
    };
  }

  /* Trigger explosive spark burst on strikes */
  triggerBurst(x, y, type = 'fire', count = 25) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      this.sparkBurstList.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        life: 1.0,
        decay: Math.random() * 0.03 + 0.02,
        type: type // 'fire' or 'thunder' or 'crit'
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Update & draw ambient particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.pulse += p.pulseSpeed;

      // Wrap around
      if (p.y < -10) p.y = this.height + 10;
      if (p.y > this.height + 10) p.y = -10;
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;

      const currentAlpha = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

      if (p.isFire) {
        this.ctx.fillStyle = `rgba(255, ${Math.floor(60 + Math.random() * 60)}, 40, ${currentAlpha})`;
        this.ctx.shadowColor = '#ff2a44';
        this.ctx.shadowBlur = p.size * 3;
      } else {
        this.ctx.fillStyle = `rgba(0, ${Math.floor(200 + Math.random() * 55)}, 255, ${currentAlpha})`;
        this.ctx.shadowColor = '#00e5ff';
        this.ctx.shadowBlur = p.size * 3;
      }

      this.ctx.fill();
    }

    // Reset shadow
    this.ctx.shadowBlur = 0;

    // Update & draw hit spark bursts
    for (let i = this.sparkBurstList.length - 1; i >= 0; i--) {
      const s = this.sparkBurstList[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.94;
      s.vy *= 0.94;
      s.life -= s.decay;

      if (s.life <= 0) {
        this.sparkBurstList.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);

      if (s.type === 'fire') {
        this.ctx.fillStyle = `rgba(255, 90, 30, ${s.life})`;
        this.ctx.shadowColor = '#ff3300';
        this.ctx.shadowBlur = 10;
      } else if (s.type === 'thunder') {
        this.ctx.fillStyle = `rgba(0, 240, 255, ${s.life})`;
        this.ctx.shadowColor = '#00f2fe';
        this.ctx.shadowBlur = 10;
      } else {
        // Critical Gold
        this.ctx.fillStyle = `rgba(255, 230, 0, ${s.life})`;
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 15;
      }

      this.ctx.fill();
    }

    this.ctx.shadowBlur = 0;
    requestAnimationFrame(() => this.animate());
  }
}

// Global Particle Instance variable
let particleEngine = null;
window.addEventListener('DOMContentLoaded', () => {
  particleEngine = new ParticleEngine('particle-canvas');
});
