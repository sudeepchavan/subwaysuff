/**
 * Subway Surfers 2D - The Inspector & Bulldog Chaser System
 * Chases the player along the railway tracks, lunging forward when the player stumbles.
 */

class Inspector {
  constructor() {
    this.reset();
  }

  reset() {
    this.distance = 280; // Distance behind player (Z units)
    this.targetDistance = 280;
    this.lane = 0;
    this.x = 0;
    this.y = 0;
    this.animTime = 0;
    this.dogBiteAnim = 0;
    this.isGrabbing = false;
    this.grabProgress = 0;
  }

  update(dt, player, currentSpeed) {
    this.animTime += dt * 10;
    this.dogBiteAnim += dt * 15;

    // Follow player's lane with a slight lag
    const targetX = player.x;
    this.x += (targetX - this.x) * Math.min(1, 4 * dt);
    this.y += (player.groundY - this.y) * Math.min(1, 8 * dt);

    // Chaser distance logic
    if (player.isStumbled) {
      // Surge forward right behind player!
      this.targetDistance = 75;
    } else if (player.isDead) {
      // Catch / tackle player
      this.targetDistance = 20;
      this.isGrabbing = true;
    } else {
      // Fall back to trailing distance
      this.targetDistance = 280;
    }

    const distDelta = this.targetDistance - this.distance;
    this.distance += distDelta * Math.min(1, 3.5 * dt);

    if (this.isGrabbing) {
      this.grabProgress = Math.min(1, this.grabProgress + dt * 2);
    }
  }

  render(ctx, camera, projectFn) {
    // Only render if within reasonable camera view behind player
    // Since inspector is behind player (z < 0 in player space), project with z = -distance
    const inspectorZ = -this.distance;
    const dogZ = -this.distance + 25; // Dog is slightly ahead of inspector!

    // Don't render if too far behind or camera cannot see
    if (inspectorZ < -camera.DISTANCE + 30) return;

    // --- Render Bulldog ---
    const dogX = this.x + 35;
    const dogProj = projectFn(dogX, this.y, dogZ);
    if (dogProj && dogProj.scale > 0.05) {
      this.renderBulldog(ctx, dogProj.x, dogProj.y, dogProj.scale);
    }

    // --- Render Inspector ---
    const inspProj = projectFn(this.x - 20, this.y, inspectorZ);
    if (inspProj && inspProj.scale > 0.05) {
      this.renderInspectorModel(ctx, inspProj.x, inspProj.y, inspProj.scale);
    }
  }

  renderBulldog(ctx, sx, sy, scale) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(scale, scale);

    const legOffset = Math.sin(this.dogBiteAnim) * 12;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.ellipse(0, -18, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#6f441d';
    ctx.beginPath();
    ctx.ellipse(12, -26, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spiked Collar
    ctx.fillStyle = '#d62424';
    ctx.fillRect(4, -24, 7, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, -23, 2, 2);
    ctx.fillRect(5, -18, 2, 2);

    // Snout / Jaws
    ctx.fillStyle = '#3a200b';
    ctx.fillRect(18, -24, 8, 8);
    // Panting Pink Tongue
    ctx.fillStyle = '#ff6b8b';
    ctx.beginPath();
    ctx.arc(22, -16 + Math.abs(legOffset) * 0.3, 4, 0, Math.PI);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(15, -29, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(16, -29, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#5c3514';
    ctx.fillRect(-12, -10 + legOffset, 6, 12);
    ctx.fillRect(6, -10 - legOffset, 6, 12);

    ctx.restore();
  }

  renderInspectorModel(ctx, sx, sy, scale) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(scale, scale);

    const runBob = Math.sin(this.animTime) * 6;
    const armSwing = Math.cos(this.animTime) * 15;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#1c2833';
    ctx.fillRect(-14, -32 + runBob * 0.5, 12, 32);
    ctx.fillRect(2, -32 - runBob * 0.5, 12, 32);

    // Boots
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(-16, -6, 15, 8);
    ctx.fillRect(0, -6, 15, 8);

    // Torso / Stout Uniform Coat
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.roundRect(-24, -80 + runBob, 48, 52, 10);
    ctx.fill();

    // Belt & Gold Buckle
    ctx.fillStyle = '#111111';
    ctx.fillRect(-23, -42 + runBob, 46, 8);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-6, -43 + runBob, 12, 10);

    // Gold Police Badge
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(10, -64 + runBob, 6, 0, Math.PI * 2);
    ctx.fill();

    // Security Tie
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(0, -74 + runBob);
    ctx.lineTo(4, -50 + runBob);
    ctx.lineTo(0, -44 + runBob);
    ctx.lineTo(-4, -50 + runBob);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = '#fcd0a1';
    ctx.beginPath();
    ctx.arc(0, -92 + runBob, 14, 0, Math.PI * 2);
    ctx.fill();

    // Angry Eyebrows & Eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(4, -94 + runBob, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#4a2f1b';
    ctx.beginPath();
    ctx.moveTo(1, -98 + runBob);
    ctx.lineTo(8, -96 + runBob);
    ctx.stroke();

    // Mustache
    ctx.fillStyle = '#4a2f1b';
    ctx.fillRect(2, -88 + runBob, 10, 4);

    // Security Cap
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.ellipse(0, -104 + runBob, 17, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cap Visor
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.ellipse(6, -101 + runBob, 15, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Cap Gold Trim
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-14, -104 + runBob, 28, 3);

    // Left Arm (holding swinging baton or flashlight)
    ctx.fillStyle = '#2c3e50';
    ctx.save();
    ctx.translate(-22, -72 + runBob);
    ctx.rotate(-armSwing * Math.PI / 180);
    ctx.fillRect(-6, 0, 10, 30);
    // Flashlight
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(-8, 25, 8, 16);
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(-9, 40, 10, 4);
    ctx.restore();

    // Right Arm (outstretched forward to grab)
    ctx.fillStyle = '#2c3e50';
    ctx.save();
    ctx.translate(22, -72 + runBob);
    ctx.rotate(armSwing * Math.PI / 180 + (this.isGrabbing ? 0.6 : 0.2));
    ctx.fillRect(-4, 0, 10, 32);
    ctx.fillStyle = '#fcd0a1'; // Hand
    ctx.beginPath();
    ctx.arc(1, 34, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }
}

