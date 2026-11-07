/**
 * Subway Surfers 2D - Particle & VFX System
 * Handles spark bursts, jetpack flames, hoverboard energy trails,
 * landing dust, speed streaks, floating text, and celebration confetti.
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.speedLines = [];
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.speedLines = [];
  }

  // --- Particle Creators ---

  addCoinSparkle(screenX, screenY) {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 120 + Math.random() * 180;
      this.particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        gravity: 300,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.3 ? '#ffd700' : '#ffffff',
        alpha: 1,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.45 + Math.random() * 0.25,
        shape: 'star'
      });
    }
  }

  addDustPuff(screenX, screenY, count = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * 1.2;
      const speed = 30 + Math.random() * 60;
      this.particles.push({
        x: screenX + (Math.random() - 0.5) * 20,
        y: screenY,
        vx: Math.cos(angle) * speed,
        vy: -Math.random() * 40 - 10,
        gravity: 40,
        size: 4 + Math.random() * 7,
        growth: 15,
        color: '#b0b5ba',
        alpha: 0.65,
        life: 0.4 + Math.random() * 0.2,
        maxLife: 0.4 + Math.random() * 0.2,
        shape: 'circle'
      });
    }
  }

  addJetpackFlames(screenX1, screenX2, screenY) {
    const origins = [screenX1, screenX2];
    origins.forEach(ox => {
      for (let i = 0; i < 3; i++) {
        const colors = ['#ffffff', '#ffea00', '#ff5500', '#ff1100'];
        const col = colors[Math.floor(Math.random() * colors.length)];
        this.particles.push({
          x: ox + (Math.random() - 0.5) * 6,
          y: screenY,
          vx: (Math.random() - 0.5) * 40,
          vy: 180 + Math.random() * 220,
          gravity: 50,
          size: 4 + Math.random() * 6,
          growth: -8,
          color: col,
          alpha: 0.9,
          life: 0.25 + Math.random() * 0.15,
          maxLife: 0.25 + Math.random() * 0.15,
          shape: 'circle'
        });
      }
    });
  }

  addHoverboardTrail(screenX, screenY, trailColor = '#ff00aa') {
    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: screenX + (Math.random() - 0.5) * 35,
        y: screenY + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 30,
        vy: 20 + Math.random() * 40,
        gravity: 0,
        size: 3 + Math.random() * 4,
        growth: -4,
        color: trailColor,
        alpha: 0.85,
        life: 0.3 + Math.random() * 0.15,
        maxLife: 0.3 + Math.random() * 0.15,
        shape: 'spark'
      });
    }
  }

  addBoardShatter(screenX, screenY, primaryColor = '#ff0055') {
    const count = 35;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 140 + Math.random() * 320;
      this.particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120,
        gravity: 600,
        size: 5 + Math.random() * 7,
        rotation: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 15,
        color: Math.random() > 0.4 ? primaryColor : '#ffffff',
        alpha: 1,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 0.6 + Math.random() * 0.4,
        shape: 'shard'
      });
    }
  }

  addConfetti(width, height) {
    const colors = ['#ff2a6d', '#05d9e8', '#f6d32d', '#00ff66', '#d6249f', '#ff7700'];
    for (let i = 0; i < 60; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: -20 - Math.random() * 50,
        vx: (Math.random() - 0.5) * 120,
        vy: 160 + Math.random() * 240,
        gravity: 80,
        size: 7 + Math.random() * 6,
        rotation: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 2.5 + Math.random() * 1.5,
        maxLife: 3.0,
        shape: 'confetti'
      });
    }
  }

  addFloatingText(text, screenX, screenY, color = '#ffd700', size = 20) {
    this.floatingTexts.push({
      text,
      x: screenX,
      y: screenY,
      vy: -90,
      color,
      size,
      alpha: 1,
      life: 0.85,
      maxLife: 0.85
    });
  }

  // --- Update Loop ---

  update(dt, speedRatio = 0, canvasWidth = 800, canvasHeight = 600) {
    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      if (p.growth) p.size = Math.max(1, p.size + p.growth * dt);
      if (p.rotation !== undefined) p.rotation += p.vrot * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
    }

    // Update Floating Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dt;
      ft.alpha = Math.min(1, ft.life / (ft.maxLife * 0.4));
    }

    // Update Speed Lines (only when running fast)
    if (speedRatio > 0.4 && Math.random() < speedRatio * 0.7) {
      const isLeft = Math.random() > 0.5;
      const x = isLeft ? Math.random() * (canvasWidth * 0.22) : canvasWidth * 0.78 + Math.random() * (canvasWidth * 0.22);
      this.speedLines.push({
        x: x,
        y: canvasHeight * 0.2 + Math.random() * (canvasHeight * 0.7),
        length: 60 + Math.random() * 120 * speedRatio,
        speed: 900 + Math.random() * 600,
        alpha: 0.5 + Math.random() * 0.4,
        life: 0.2,
        maxLife: 0.2
      });
    }

    for (let i = this.speedLines.length - 1; i >= 0; i--) {
      const sl = this.speedLines[i];
      sl.life -= dt;
      if (sl.life <= 0) {
        this.speedLines.splice(i, 1);
        continue;
      }
      sl.y += sl.speed * dt;
      sl.alpha = sl.life / sl.maxLife;
    }
  }

  // --- Render Loop ---

  render(ctx) {
    // Render Speed Lines
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const sl of this.speedLines) {
      ctx.globalAlpha = sl.alpha;
      ctx.moveTo(sl.x, sl.y);
      ctx.lineTo(sl.x, sl.y + sl.length);
    }
    ctx.stroke();
    ctx.restore();

    // Render Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'star') {
        ctx.translate(p.x, p.y);
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          ctx.lineTo(Math.cos((18 + j * 72) * Math.PI / 180) * p.size,
                    -Math.sin((18 + j * 72) * Math.PI / 180) * p.size);
          ctx.lineTo(Math.cos((54 + j * 72) * Math.PI / 180) * (p.size * 0.45),
                    -Math.sin((54 + j * 72) * Math.PI / 180) * (p.size * 0.45));
        }
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === 'shard') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.beginPath();
        ctx.moveTo(-p.size, -p.size * 0.5);
        ctx.lineTo(p.size, 0);
        ctx.lineTo(-p.size * 0.3, p.size);
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === 'confetti') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.7);
      } else if (p.shape === 'spark') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Render Floating Text
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `900 ${ft.size}px 'Arial Black', Impact, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}

