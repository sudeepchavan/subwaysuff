/**
 * Subway Surfers 2D - 2.5D Perspective Engine & World Renderer
 * Projects 3D world coordinates to screen space and paints dynamic skies,
 * city skylines, rails, 3D trains with graffiti, hurdles, coins, characters, and VFX.
 */

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.camera = { ...CONSTANTS.CAMERA };
    this.shake = 0;
    this.cloudOffset = 0;
    this.skylineSeed = 42;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = this.canvas.clientWidth || window.innerWidth;
    this.height = this.canvas.clientHeight || window.innerHeight;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    this.horizonY = this.height * this.camera.HORIZON_Y_RATIO;
    this.centerX = this.width / 2;
  }

  addCameraShake(amount = 8) {
    this.shake = Math.max(this.shake, amount);
  }

  // --- Perspective Math ---
  // Converts (worldX, worldY, worldZ) to screen coordinates (x, y, scale)
  project(worldX, worldY, worldZ, camOffsetX = 0) {
    const dz = worldZ + this.camera.DISTANCE;
    if (dz <= 2) return null; // Behind camera

    const scale = this.camera.FOCAL_LENGTH / dz;
    const screenX = this.centerX + (worldX - camOffsetX) * scale;
    const screenY = this.horizonY + (this.camera.HEIGHT - worldY) * scale;

    return { x: screenX, y: screenY, scale: scale, dz: dz };
  }

  // --- Main Render Frame ---
  render(player, track, inspector, particles, speedRatio) {
    const ctx = this.ctx;
    ctx.save();

    // Camera Shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.shake > 0) {
      shakeX = (Math.random() - 0.5) * this.shake;
      shakeY = (Math.random() - 0.5) * this.shake;
      this.shake = Math.max(0, this.shake - 0.5);
    }
    ctx.translate(shakeX, shakeY);

    // 1. Sky & Sun
    this.renderSky(ctx, speedRatio);

    // 2. City Skyline (Parallax)
    this.renderSkyline(ctx);

    // 3. Ground & Ballast
    this.renderGround(ctx);

    // 4. Rails & Sleepers (Ties)
    this.renderTracks(ctx, track.zDistance);

    // 5. Scenery Props & Overhead Gantries behind obstacles
    this.renderScenery(ctx, track, player);

    // 6. Sort and Render 3D World Objects from Back to Front (Painter's Algorithm)
    this.renderWorldObjects(ctx, track, player);

    // 7. Inspector & Dog
    inspector.render(ctx, this.camera, (x, y, z) => this.project(x, y, z, player.x * 0.15));

    // 8. Player Character
    this.renderPlayer(ctx, player, particles);

    // 9. Particle Systems (Sparks, Smoke, Speed Lines, Confetti, Floating Texts)
    particles.render(ctx);

    // 10. Screen Edge Vignettes (Stumble Danger, Jetpack Glow, Speed Blur)
    this.renderVignettes(ctx, player, speedRatio);

    ctx.restore();
  }

  // --- Sky & City Backdrop ---
  renderSky(ctx, speedRatio) {
    this.cloudOffset += 0.2 + speedRatio * 0.6;

    // Vibrant street-art sunset / twilight gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.horizonY + 20);
    skyGrad.addColorStop(0, '#100e2b');   // Deep twilight navy
    skyGrad.addColorStop(0.35, '#3b1d5c');// Violet
    skyGrad.addColorStop(0.7, '#d35400'); // Hot orange sunset
    skyGrad.addColorStop(0.92, '#f39c12');// Golden glow
    skyGrad.addColorStop(1, '#f1c40f');   // Bright horizon yellow

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.horizonY + 25);

    // Sunset sun glowing on horizon
    const sunGrad = ctx.createRadialGradient(this.centerX, this.horizonY - 15, 10, this.centerX, this.horizonY - 15, 110);
    sunGrad.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
    sunGrad.addColorStop(0.4, 'rgba(255, 180, 50, 0.5)');
    sunGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(this.centerX, this.horizonY - 15, 110, 0, Math.PI * 2);
    ctx.fill();

    // Stylized Clouds
    ctx.fillStyle = 'rgba(255, 220, 200, 0.18)';
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 320 + this.cloudOffset * 0.5) % (this.width + 250)) - 100;
      const cy = 35 + i * 22;
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.arc(cx + 25, cy - 8, 35, 0, Math.PI * 2);
      ctx.arc(cx + 55, cy, 28, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderSkyline(ctx) {
    // Distant dark silhouettes of skyscrapers with illuminated windows
    const baseY = this.horizonY + 2;
    ctx.fillStyle = '#1e1435';

    // Layer 1 (Far Skyline)
    const farBuildings = [
      { x: 0.05, w: 50, h: 80 }, { x: 0.15, w: 75, h: 120 }, { x: 0.28, w: 60, h: 90 },
      { x: 0.38, w: 90, h: 140 }, { x: 0.52, w: 70, h: 110 }, { x: 0.65, w: 85, h: 130 },
      { x: 0.78, w: 60, h: 95 }, { x: 0.88, w: 80, h: 115 }
    ];
    for (const b of farBuildings) {
      const bx = b.x * this.width;
      ctx.fillRect(bx, baseY - b.h, b.w, b.h);
      // Spire
      ctx.fillRect(bx + b.w / 2 - 1.5, baseY - b.h - 18, 3, 18);
    }

    // Layer 2 (Closer Skyline)
    ctx.fillStyle = '#140c26';
    const closeBuildings = [
      { x: 0.0, w: 70, h: 60 }, { x: 0.1, w: 60, h: 85 }, { x: 0.22, w: 85, h: 70 },
      { x: 0.32, w: 50, h: 95 }, { x: 0.44, w: 100, h: 80 }, { x: 0.58, w: 70, h: 90 },
      { x: 0.72, w: 75, h: 65 }, { x: 0.84, w: 90, h: 85 }, { x: 0.95, w: 60, h: 70 }
    ];
    for (const b of closeBuildings) {
      const bx = b.x * this.width;
      ctx.fillRect(bx, baseY - b.h, b.w, b.h);

      // Windows (twinkling warm yellow / cyan dots)
      ctx.fillStyle = 'rgba(255, 230, 140, 0.4)';
      for (let wy = baseY - b.h + 8; wy < baseY - 8; wy += 12) {
        for (let wx = bx + 8; wx < bx + b.w - 8; wx += 10) {
          if ((wx + wy) % 5 === 0) {
            ctx.fillRect(wx, wy, 4, 6);
          }
        }
      }
      ctx.fillStyle = '#140c26';
    }
  }

  // --- Ground & Tracks ---
  renderGround(ctx) {
    // Dark railway ground
    const groundGrad = ctx.createLinearGradient(0, this.horizonY, 0, this.height);
    groundGrad.addColorStop(0, '#22252a');
    groundGrad.addColorStop(0.4, '#1b1d22');
    groundGrad.addColorStop(1, '#111215');

    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, this.horizonY, this.width, this.height - this.horizonY);

    // Ballast trackbed polygon (trapezoid converging to vanishing point)
    const pFarL = this.project(-CONSTANTS.TRACK.BALLAST_WIDTH, 0, CONSTANTS.CAMERA.MAX_Z);
    const pFarR = this.project(CONSTANTS.TRACK.BALLAST_WIDTH, 0, CONSTANTS.CAMERA.MAX_Z);
    const pNearL = this.project(-CONSTANTS.TRACK.BALLAST_WIDTH, 0, 0);
    const pNearR = this.project(CONSTANTS.TRACK.BALLAST_WIDTH, 0, 0);

    if (pFarL && pFarR && pNearL && pNearR) {
      const ballastGrad = ctx.createLinearGradient(0, this.horizonY, 0, this.height);
      ballastGrad.addColorStop(0, '#3a3d42');
      ballastGrad.addColorStop(1, '#25272b');

      ctx.fillStyle = ballastGrad;
      ctx.beginPath();
      ctx.moveTo(pNearL.x, pNearL.y);
      ctx.lineTo(pFarL.x, pFarL.y);
      ctx.lineTo(pFarR.x, pFarR.y);
      ctx.lineTo(pNearR.x, pNearR.y);
      ctx.closePath();
      ctx.fill();

      // Outer concrete safety curbing
      ctx.strokeStyle = '#555a60';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pNearL.x, pNearL.y);
      ctx.lineTo(pFarL.x, pFarL.y);
      ctx.moveTo(pNearR.x, pNearR.y);
      ctx.lineTo(pFarR.x, pFarR.y);
      ctx.stroke();
    }
  }

  renderTracks(ctx, zDistance) {
    const lanes = CONSTANTS.TRACK.LANES;
    const halfRail = CONSTANTS.TRACK.RAIL_WIDTH / 2;
    const tieInterval = CONSTANTS.TRACK.TIE_INTERVAL;

    // 1. Wooden Sleepers (Ties) - streaming towards player
    const offsetZ = zDistance % tieInterval;
    for (let z = tieInterval - offsetZ; z < CONSTANTS.CAMERA.MAX_Z; z += tieInterval) {
      for (const lane of lanes) {
        const laneX = lane * CONSTANTS.TRACK.LANE_WIDTH;
        const pL = this.project(laneX - halfRail - 12, 0, z);
        const pR = this.project(laneX + halfRail + 12, 0, z);

        if (pL && pR && pL.scale > 0.04) {
          const tieThickness = Math.max(1, 7 * pL.scale);
          ctx.fillStyle = '#4a3319'; // Rich treated wood
          ctx.fillRect(pL.x, pL.y - tieThickness / 2, pR.x - pL.x, tieThickness);

          // Tie top highlight
          ctx.fillStyle = '#6d4c27';
          ctx.fillRect(pL.x, pL.y - tieThickness / 2, pR.x - pL.x, Math.max(1, tieThickness * 0.4));
        }
      }
    }

    // 2. Continuous Steel Rails (3 lanes x 2 rails = 6 rails)
    for (const lane of lanes) {
      const laneX = lane * CONSTANTS.TRACK.LANE_WIDTH;
      const railOffsets = [-halfRail, halfRail];

      for (const ro of railOffsets) {
        const rx = laneX + ro;
        const pNear = this.project(rx, 2, 0);
        const pFar = this.project(rx, 2, CONSTANTS.CAMERA.MAX_Z);

        if (pNear && pFar) {
          // Rail Base Shadow
          ctx.strokeStyle = '#1a1a1a';
          ctx.lineWidth = Math.max(2, 6 * pNear.scale);
          ctx.beginPath();
          ctx.moveTo(pNear.x, pNear.y);
          ctx.lineTo(pFar.x, pFar.y);
          ctx.stroke();

          // Shining Steel Crown
          ctx.strokeStyle = '#d5dbdb';
          ctx.lineWidth = Math.max(1, 3.5 * pNear.scale);
          ctx.beginPath();
          ctx.moveTo(pNear.x, pNear.y);
          ctx.lineTo(pFar.x, pFar.y);
          ctx.stroke();
        }
      }
    }
  }

  // --- Scenery Props & Gantries ---
  renderScenery(ctx, track, player) {
    // Gantries
    for (const g of track.gantries) {
      if (g.z > CONSTANTS.CAMERA.MAX_Z || g.z < -50) continue;

      const pL = this.project(-CONSTANTS.TRACK.BALLAST_WIDTH - 20, 0, g.z);
      const pR = this.project(CONSTANTS.TRACK.BALLAST_WIDTH + 20, 0, g.z);
      const pTopL = this.project(-CONSTANTS.TRACK.BALLAST_WIDTH - 20, CONSTANTS.OBSTACLES.GANTRY.HEIGHT, g.z);
      const pTopR = this.project(CONSTANTS.TRACK.BALLAST_WIDTH + 20, CONSTANTS.OBSTACLES.GANTRY.HEIGHT, g.z);

      if (pL && pR && pTopL && pTopR && pL.scale > 0.05) {
        const scale = pL.scale;
        const beamW = Math.max(3, 14 * scale);

        // Steel Pillars
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(pL.x - beamW / 2, pTopL.y, beamW, pL.y - pTopL.y);
        ctx.fillRect(pR.x - beamW / 2, pTopR.y, beamW, pR.y - pTopR.y);

        // Overhead Truss Crossbeam
        ctx.fillRect(pTopL.x - beamW / 2, pTopL.y - beamW / 2, pTopR.x - pTopL.x + beamW, beamW);

        // Overhead Sign
        if (g.hasSign) {
          const signCenter = this.project(0, CONSTANTS.OBSTACLES.GANTRY.HEIGHT - 25, g.z);
          if (signCenter) {
            const sw = 160 * scale;
            const sh = 38 * scale;
            ctx.fillStyle = '#27ae60';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = Math.max(1, 2 * scale);
            ctx.fillRect(signCenter.x - sw / 2, signCenter.y - sh / 2, sw, sh);
            ctx.strokeRect(signCenter.x - sw / 2, signCenter.y - sh / 2, sw, sh);

            // Text
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(8, 14 * scale)}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(g.signText, signCenter.x, signCenter.y);
          }
        }
      }
    }

    // Trackside Props (Signal lights & lampposts)
    for (const prop of track.sceneryProps) {
      if (prop.z > CONSTANTS.CAMERA.MAX_Z || prop.z < -50) continue;
      const x = prop.side * (CONSTANTS.TRACK.BALLAST_WIDTH + 40);
      const pBase = this.project(x, 0, prop.z);
      const pTop = this.project(x, 140, prop.z);

      if (pBase && pTop && pBase.scale > 0.04) {
        const s = pBase.scale;
        ctx.fillStyle = '#555e68';
        ctx.fillRect(pBase.x - 3 * s, pTop.y, 6 * s, pBase.y - pTop.y);

        // Glowing Lamp / Signal Head
        ctx.fillStyle = prop.signalColor;
        ctx.shadowColor = prop.signalColor;
        ctx.shadowBlur = 10 * s;
        ctx.beginPath();
        ctx.arc(pTop.x, pTop.y + 10 * s, 7 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  // --- Depth Sorting and World Objects ---
  renderWorldObjects(ctx, track, player) {
    const renderList = [];

    // Collect Trains
    for (const train of track.trains) {
      if (train.z + train.length > 0 && train.z < CONSTANTS.CAMERA.MAX_Z) {
        renderList.push({ type: 'train', z: train.z + train.length * 0.5, item: train });
      }
    }

    // Collect Barriers
    for (const b of track.barriers) {
      if (b.z > 0 && b.z < CONSTANTS.CAMERA.MAX_Z) {
        renderList.push({ type: 'barrier', z: b.z, item: b });
      }
    }

    // Collect Coins
    for (const c of track.coins) {
      if (c.z > -10 && c.z < CONSTANTS.CAMERA.MAX_Z && !c.collected) {
        renderList.push({ type: 'coin', z: c.z, item: c });
      }
    }

    // Collect Roof Coins
    for (const train of track.trains) {
      for (const rc of train.roofCoins) {
        if (rc.z > -10 && rc.z < CONSTANTS.CAMERA.MAX_Z && !rc.collected) {
          renderList.push({ type: 'coin', z: rc.z, item: rc });
        }
      }
    }

    // Collect Power-ups
    for (const p of track.powerups) {
      if (p.z > -10 && p.z < CONSTANTS.CAMERA.MAX_Z && !p.collected) {
        renderList.push({ type: 'powerup', z: p.z, item: p });
      }
    }

    // Sort far to near (descending Z)
    renderList.sort((a, b) => b.z - a.z);

    // Draw sorted items
    for (const obj of renderList) {
      if (obj.type === 'train') {
        this.renderTrain(ctx, obj.item);
      } else if (obj.type === 'barrier') {
        this.renderBarrier(ctx, obj.item);
      } else if (obj.type === 'coin') {
        this.renderCoin(ctx, obj.item);
      } else if (obj.type === 'powerup') {
        this.renderPowerup(ctx, obj.item);
      }
    }
  }

  // --- 3D Train Rendering with Perspective Box ---
  renderTrain(ctx, train) {
    const laneX = train.lane * CONSTANTS.TRACK.LANE_WIDTH;
    const halfW = train.width / 2;
    const zFront = train.z;
    const zBack = train.z + train.length;
    const h = train.height;

    // Project Front corners
    const pF_BL = this.project(laneX - halfW, 0, zFront);
    const pF_BR = this.project(laneX + halfW, 0, zFront);
    const pF_TL = this.project(laneX - halfW, h, zFront);
    const pF_TR = this.project(laneX + halfW, h, zFront);

    // Project Back corners
    const pB_BL = this.project(laneX - halfW, 0, zBack);
    const pB_BR = this.project(laneX + halfW, 0, zBack);
    const pB_TL = this.project(laneX - halfW, h, zBack);
    const pB_TR = this.project(laneX + halfW, h, zBack);

    if (!pF_BL || !pF_BR || !pF_TL || !pF_TR || !pB_BL || !pB_BR || !pB_TL || !pB_TR) return;

    // 1. Train Under-Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.moveTo(pF_BL.x, pF_BL.y);
    ctx.lineTo(pB_BL.x, pB_BL.y);
    ctx.lineTo(pB_BR.x, pB_BR.y);
    ctx.lineTo(pF_BR.x, pF_BR.y);
    ctx.closePath();
    ctx.fill();

    // 2. Visible Side Wall (Left side if train is right of center, or right side if left of center)
    if (train.lane >= 0) {
      // Left side visible
      ctx.fillStyle = '#1e272e';
      ctx.beginPath();
      ctx.moveTo(pF_BL.x, pF_BL.y);
      ctx.lineTo(pB_BL.x, pB_BL.y);
      ctx.lineTo(pB_TL.x, pB_TL.y);
      ctx.lineTo(pF_TL.x, pF_TL.y);
      ctx.closePath();
      ctx.fill();

      // Subway Windows on Side
      ctx.fillStyle = '#f5cd79';
      const sideProjMid = this.project(laneX - halfW, h * 0.6, (zFront + zBack) * 0.5);
      if (sideProjMid) {
        ctx.fillRect(sideProjMid.x - 25 * sideProjMid.scale, sideProjMid.y - 10 * sideProjMid.scale,
                     50 * sideProjMid.scale, 20 * sideProjMid.scale);
      }
    }
    if (train.lane <= 0) {
      // Right side visible
      ctx.fillStyle = '#2c3a47';
      ctx.beginPath();
      ctx.moveTo(pF_BR.x, pF_BR.y);
      ctx.lineTo(pB_BR.x, pB_BR.y);
      ctx.lineTo(pB_TR.x, pB_TR.y);
      ctx.lineTo(pF_TR.x, pF_TR.y);
      ctx.closePath();
      ctx.fill();

      // Subway Windows on Side
      ctx.fillStyle = '#f5cd79';
      const sideProjMid = this.project(laneX + halfW, h * 0.6, (zFront + zBack) * 0.5);
      if (sideProjMid) {
        ctx.fillRect(sideProjMid.x - 25 * sideProjMid.scale, sideProjMid.y - 10 * sideProjMid.scale,
                     50 * sideProjMid.scale, 20 * sideProjMid.scale);
      }
    }

    // 3. Train Roof (Top Face)
    ctx.fillStyle = '#485460';
    ctx.beginPath();
    ctx.moveTo(pF_TL.x, pF_TL.y);
    ctx.lineTo(pB_TL.x, pB_TL.y);
    ctx.lineTo(pB_TR.x, pB_TR.y);
    ctx.lineTo(pF_TR.x, pF_TR.y);
    ctx.closePath();
    ctx.fill();

    // Roof Catwalk Ribs & AC Units
    ctx.fillStyle = '#2f3542';
    const acProj = this.project(laneX, h + 8, (zFront + zBack) * 0.5);
    if (acProj && acProj.scale > 0.05) {
      const acW = 50 * acProj.scale;
      const acH = 12 * acProj.scale;
      ctx.fillRect(acProj.x - acW / 2, acProj.y - acH, acW, acH);
    }

    // 4. Train Front Face
    const frontGrad = ctx.createLinearGradient(0, pF_TL.y, 0, pF_BL.y);
    frontGrad.addColorStop(0, train.color);
    frontGrad.addColorStop(1, '#1e272e');
    ctx.fillStyle = frontGrad;

    ctx.beginPath();
    ctx.moveTo(pF_TL.x, pF_TL.y);
    ctx.lineTo(pF_TR.x, pF_TR.y);
    ctx.lineTo(pF_BR.x, pF_BR.y);
    ctx.lineTo(pF_BL.x, pF_BL.y);
    ctx.closePath();
    ctx.fill();

    // Front Windshield
    const scale = pF_TL.scale;
    const fw = (pF_TR.x - pF_TL.x) * 0.75;
    const fh = (pF_BL.y - pF_TL.y) * 0.28;
    const fMidX = (pF_TL.x + pF_TR.x) / 2;
    const fMidY = pF_TL.y + (pF_BL.y - pF_TL.y) * 0.18;

    ctx.fillStyle = '#575fcf';
    ctx.fillRect(fMidX - fw / 2, fMidY, fw, fh);
    // Windshield frame & glint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.moveTo(fMidX - fw / 2, fMidY);
    ctx.lineTo(fMidX - fw / 2 + 15 * scale, fMidY);
    ctx.lineTo(fMidX + 10 * scale, fMidY + fh);
    ctx.lineTo(fMidX - 5 * scale, fMidY + fh);
    ctx.closePath();
    ctx.fill();

    // Dual Headlights with Light Beams!
    const lightY = pF_TL.y + (pF_BL.y - pF_TL.y) * 0.65;
    const lightOffsets = [-fw * 0.38, fw * 0.38];

    for (const lo of lightOffsets) {
      const lx = fMidX + lo;
      ctx.fillStyle = '#fffa65';
      ctx.shadowColor = '#fff200';
      ctx.shadowBlur = 12 * scale;
      ctx.beginPath();
      ctx.arc(lx, lightY, 6 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Cast warm light cone onto track forward
      if (zFront > 10) {
        ctx.fillStyle = 'rgba(255, 240, 100, 0.08)';
        ctx.beginPath();
        ctx.moveTo(lx, lightY);
        ctx.lineTo(lx - 45 * scale, pF_BL.y + 40 * scale);
        ctx.lineTo(lx + 45 * scale, pF_BL.y + 40 * scale);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Front Bumper / Cowcatcher (Hazard Stripes)
    const bumpY = pF_BL.y - 18 * scale;
    const bumpH = 18 * scale;
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(pF_BL.x, bumpY, pF_BR.x - pF_BL.x, bumpH);
    ctx.fillStyle = '#2c3e50';
    // Diagonal stripes on bumper
    for (let bx = pF_BL.x; bx < pF_BR.x; bx += 14 * scale) {
      ctx.beginPath();
      ctx.moveTo(bx, bumpY + bumpH);
      ctx.lineTo(bx + 8 * scale, bumpY);
      ctx.lineTo(bx + 14 * scale, bumpY);
      ctx.lineTo(bx + 6 * scale, bumpY + bumpH);
      ctx.closePath();
      ctx.fill();
    }

    // Graffiti Tag on Front or Sides
    if (train.tag && scale > 0.1) {
      ctx.save();
      ctx.fillStyle = '#0be881';
      ctx.font = `900 ${Math.max(10, 22 * scale)}px 'Arial Black', Impact, sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(train.tag, fMidX, bumpY - 12 * scale);
      ctx.restore();
    }

    // Front Ramp (if train has ramp)
    if (train.hasRamp) {
      const pRampBaseL = this.project(laneX - halfW, 0, zFront - CONSTANTS.OBSTACLES.TRAIN.RAMP_LENGTH);
      const pRampBaseR = this.project(laneX + halfW, 0, zFront - CONSTANTS.OBSTACLES.TRAIN.RAMP_LENGTH);

      if (pRampBaseL && pRampBaseR) {
        // Ramp Surface
        const rampGrad = ctx.createLinearGradient(0, pF_TL.y, 0, pRampBaseL.y);
        rampGrad.addColorStop(0, '#f39c12');
        rampGrad.addColorStop(1, '#e67e22');
        ctx.fillStyle = rampGrad;

        ctx.beginPath();
        ctx.moveTo(pF_TL.x, pF_TL.y);
        ctx.lineTo(pF_TR.x, pF_TR.y);
        ctx.lineTo(pRampBaseR.x, pRampBaseR.y);
        ctx.lineTo(pRampBaseL.x, pRampBaseL.y);
        ctx.closePath();
        ctx.fill();

        // Ramp Arrow Decal
        ctx.fillStyle = '#ffffff';
        const midRamp = this.project(laneX, h * 0.5, zFront - CONSTANTS.OBSTACLES.TRAIN.RAMP_LENGTH * 0.5);
        if (midRamp) {
          ctx.beginPath();
          ctx.moveTo(midRamp.x, midRamp.y - 18 * midRamp.scale);
          ctx.lineTo(midRamp.x + 18 * midRamp.scale, midRamp.y + 12 * midRamp.scale);
          ctx.lineTo(midRamp.x - 18 * midRamp.scale, midRamp.y + 12 * midRamp.scale);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }

  // --- Barriers & Hurdles ---
  renderBarrier(ctx, b) {
    const laneX = b.lane * CONSTANTS.TRACK.LANE_WIDTH;
    const halfW = b.width / 2;
    const z = b.z;

    if (b.type === 'low') {
      // Low Hurdle (Jump over)
      const pBL = this.project(laneX - halfW, 0, z);
      const pBR = this.project(laneX + halfW, 0, z);
      const pTL = this.project(laneX - halfW, b.height, z);
      const pTR = this.project(laneX + halfW, b.height, z);

      if (!pBL || !pBR || !pTL || !pTR) return;
      const s = pBL.scale;

      // Wooden Legs
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(pBL.x, pTL.y, 8 * s, pBL.y - pTL.y);
      ctx.fillRect(pBR.x - 8 * s, pTR.y, 8 * s, pBR.y - pTR.y);

      // Red and White Diagonal Stripes
      const bw = pBR.x - pBL.x;
      const bh = (pBL.y - pTL.y) * 0.65;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pBL.x, pTL.y, bw, bh);

      ctx.fillStyle = '#e74c3c';
      for (let x = pBL.x - 20 * s; x < pBR.x; x += 22 * s) {
        ctx.beginPath();
        ctx.moveTo(x, pTL.y + bh);
        ctx.lineTo(x + 12 * s, pTL.y);
        ctx.lineTo(x + 22 * s, pTL.y);
        ctx.lineTo(x + 10 * s, pTL.y + bh);
        ctx.closePath();
        ctx.fill();
      }

      // Blinking Warning Lamp on top
      ctx.fillStyle = '#f39c12';
      ctx.shadowColor = '#f1c40f';
      ctx.shadowBlur = 8 * s;
      ctx.beginPath();
      ctx.arc((pTL.x + pTR.x) / 2, pTL.y - 6 * s, 6 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

    } else if (b.type === 'high') {
      // High Overhead Barrier (Slide under)
      const pBL = this.project(laneX - halfW, 0, z);
      const pBR = this.project(laneX + halfW, 0, z);
      const pClearL = this.project(laneX - halfW, b.clearance, z);
      const pClearR = this.project(laneX + halfW, b.clearance, z);
      const pTopL = this.project(laneX - halfW, b.height, z);
      const pTopR = this.project(laneX + halfW, b.height, z);

      if (!pBL || !pBR || !pClearL || !pClearR || !pTopL || !pTopR) return;
      const s = pBL.scale;

      // Side Steel Posts
      ctx.fillStyle = '#34495e';
      ctx.fillRect(pBL.x, pTopL.y, 10 * s, pBL.y - pTopL.y);
      ctx.fillRect(pBR.x - 10 * s, pTopR.y, 10 * s, pBR.y - pTopR.y);

      // Yellow and Black Overhead Caution Bar
      const bw = pTopR.x - pTopL.x;
      const bh = pClearL.y - pTopL.y;

      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(pTopL.x, pTopL.y, bw, bh);

      ctx.fillStyle = '#111111';
      for (let x = pTopL.x - 20 * s; x < pTopR.x; x += 24 * s) {
        ctx.beginPath();
        ctx.moveTo(x, pClearL.y);
        ctx.lineTo(x + 14 * s, pTopL.y);
        ctx.lineTo(x + 24 * s, pTopL.y);
        ctx.lineTo(x + 10 * s, pClearL.y);
        ctx.closePath();
        ctx.fill();
      }

      // "CAUTION" or "KEEP LOW" Text
      if (s > 0.12) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(8, 14 * s)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText('▼ CAUTION ▼', (pTopL.x + pTopR.x) / 2, (pTopL.y + pClearL.y) / 2);
        ctx.shadowBlur = 0;
      }
    }
  }

  // --- Shiny Gold Coins ---
  renderCoin(ctx, c) {
    const proj = this.project(c.x, c.y, c.z);
    if (!proj || proj.scale <= 0.03) return;

    const s = proj.scale;
    const r = 16 * s;
    const spin = (Date.now() * 0.006) + c.z * 0.01;
    const squish = Math.cos(spin);

    ctx.save();
    ctx.translate(proj.x, proj.y);

    // Coin Drop Shadow
    const groundProj = this.project(c.x, 0, c.z);
    if (groundProj && c.y > 5) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, groundProj.y - proj.y, r * Math.abs(squish) * 0.8, r * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outer Gold Rim
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(2, r * Math.abs(squish)), r, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner Bright Face
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(1, (r - 3 * s) * Math.abs(squish)), r - 3 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Specular Shine
    if (Math.abs(squish) > 0.4) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.ellipse(r * 0.3 * squish, -r * 0.3, 3 * s, 5 * s, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- Power-up Icons ---
  renderPowerup(ctx, p) {
    const proj = this.project(p.x, p.y + p.bob, p.z);
    if (!proj || proj.scale <= 0.03) return;

    const s = proj.scale;
    const size = 32 * s;

    ctx.save();
    ctx.translate(proj.x, proj.y);

    // Glowing Aura
    const colors = {
      magnet: '#ff3366',
      jetpack: '#00d2ff',
      sneakers: '#39ff14',
      multiplier: '#ffbb00'
    };
    const col = colors[p.type] || '#ffffff';

    ctx.fillStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 18 * s;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inner White Container
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.52, 0, Math.PI * 2);
    ctx.fill();

    // Power-up Symbol
    ctx.fillStyle = col;
    ctx.font = `bold ${Math.max(10, 20 * s)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (p.type === 'magnet') {
      ctx.fillText('🧲', 0, 0);
    } else if (p.type === 'jetpack') {
      ctx.fillText('🚀', 0, 0);
    } else if (p.type === 'sneakers') {
      ctx.fillText('👟', 0, 0);
    } else if (p.type === 'multiplier') {
      ctx.fillText('2X', 0, 0);
    }

    ctx.restore();
  }

  // --- Player Character & Boards ---
  renderPlayer(ctx, player, particles) {
    const proj = this.project(player.x, player.y, 0);
    if (!proj) return;

    const s = proj.scale;
    const char = player.character;
    const board = player.board;
    const isSliding = player.isSliding;
    const isHovering = player.powerups.hoverboard > 0;
    const isJetpacking = player.powerups.jetpack > 0;

    // Ground Shadow (Projected at player.groundY)
    const groundProj = this.project(player.x, player.groundY, 0);
    if (groundProj) {
      const heightAboveGround = player.y - player.groundY;
      const shadowScale = Math.max(0.2, 1 - heightAboveGround / 400);
      const shadowAlpha = Math.max(0.1, 0.5 - heightAboveGround / 500);

      ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(groundProj.x, groundProj.y, 32 * s * shadowScale, 12 * s * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trigger landing dust if flagged
      if (player.justLanded) {
        particles.addDustPuff(groundProj.x, groundProj.y, 8);
        player.justLanded = false;
      }
    }

    ctx.save();
    ctx.translate(proj.x, proj.y);
    ctx.scale(s, s);

    // Lane change banking tilt
    ctx.rotate(player.bankAngle);

    // Stumble Shake
    if (player.isStumbled) {
      ctx.rotate((Math.random() - 0.5) * 0.15);
    }

    // Invulnerability flashing
    if (player.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // 1. Hoverboard (if active)
    if (isHovering && !isJetpacking) {
      this.renderHoverboard(ctx, board);
      particles.addHoverboardTrail(proj.x, proj.y + 4 * s, board.trailColor);
    }

    // 2. Jetpack Thrusters (if active)
    if (isJetpacking) {
      this.renderJetpack(ctx);
      particles.addJetpackFlames(proj.x - 16 * s, proj.x + 16 * s, proj.y - 30 * s);
    }

    // 3. Character Body Rendering
    if (isSliding) {
      this.renderSlidePose(ctx, char, player.rollRotation);
      particles.addDustPuff(proj.x, proj.y, 1);
    } else if (isHovering) {
      this.renderSurfingPose(ctx, char);
    } else if (isJetpacking) {
      this.renderJetpackPose(ctx, char);
    } else if (player.isJumping) {
      this.renderJumpPose(ctx, char, player.vy);
    } else {
      this.renderRunPose(ctx, char, player.animTime);
    }

    // 4. Super Sneakers Glowing Wings
    if (player.powerups.sneakers > 0) {
      ctx.fillStyle = '#39ff14';
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = 10;
      // Wing on left shoe
      ctx.fillRect(-22, -14, 10, 5);
      // Wing on right shoe
      ctx.fillRect(12, -14, 10, 5);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  renderHoverboard(ctx, board) {
    ctx.save();
    ctx.translate(0, -6);

    // Neon Glow under board
    ctx.fillStyle = board.trailColor;
    ctx.shadowColor = board.trailColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.ellipse(0, 4, 38, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Board Deck
    ctx.fillStyle = board.primaryColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 42, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Board Stripe
    ctx.fillStyle = board.secondaryColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 38, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderJetpack(ctx) {
    ctx.save();
    ctx.translate(0, -55);

    // Twin Chrome Jetpack Tanks
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(-22, -25, 12, 38);
    ctx.fillRect(10, -25, 12, 38);

    // Red Caps
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(-16, -25, 6, Math.PI, 0);
    ctx.arc(16, -25, 6, Math.PI, 0);
    ctx.fill();

    // Nozzles
    ctx.fillStyle = '#34495e';
    ctx.fillRect(-20, 13, 8, 6);
    ctx.fillRect(12, 13, 8, 6);

    ctx.restore();
  }

  // --- Dynamic Character Poses ---

  renderRunPose(ctx, char, animTime) {
    const legSwing = Math.sin(animTime) * 22;
    const armSwing = Math.sin(animTime + Math.PI) * 25;
    const bob = Math.abs(Math.sin(animTime)) * 6;

    // Left Leg
    ctx.fillStyle = char.colors.pants;
    ctx.fillRect(-12, -32 + bob, 10, 32 - legSwing * 0.4);
    // Left Shoe
    ctx.fillStyle = char.colors.shoes;
    ctx.fillRect(-14, -6 + bob - legSwing * 0.4, 14, 8);

    // Right Leg
    ctx.fillStyle = char.colors.pants;
    ctx.fillRect(2, -32 + bob, 10, 32 + legSwing * 0.4);
    // Right Shoe
    ctx.fillStyle = char.colors.shoes;
    ctx.fillRect(0, -6 + bob + legSwing * 0.4, 14, 8);

    // Torso (Hoodie / Jacket)
    ctx.fillStyle = char.colors.jacket;
    ctx.beginPath();
    ctx.roundRect(-16, -72 + bob, 32, 42, 6);
    ctx.fill();

    // Shirt / Chest Graphic
    ctx.fillStyle = char.colors.shirt;
    ctx.fillRect(-7, -68 + bob, 14, 30);

    // Arms
    ctx.fillStyle = char.colors.jacket;
    // Left Arm
    ctx.save();
    ctx.translate(-16, -65 + bob);
    ctx.rotate(armSwing * Math.PI / 180);
    ctx.fillRect(-4, 0, 8, 25);
    ctx.fillStyle = char.colors.skin;
    ctx.beginPath();
    ctx.arc(0, 26, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right Arm
    ctx.fillStyle = char.colors.jacket;
    ctx.save();
    ctx.translate(16, -65 + bob);
    ctx.rotate(-armSwing * Math.PI / 180);
    ctx.fillRect(-4, 0, 8, 25);
    ctx.fillStyle = char.colors.skin;
    ctx.beginPath();
    ctx.arc(0, 26, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Head
    ctx.fillStyle = char.colors.skin;
    ctx.beginPath();
    ctx.arc(0, -82 + bob, 12, 0, Math.PI * 2);
    ctx.fill();

    // Cap (Backward red street cap)
    ctx.fillStyle = char.colors.cap;
    ctx.beginPath();
    ctx.arc(0, -84 + bob, 13, Math.PI, 0);
    ctx.fill();
    // Cap Brim turned back
    ctx.fillRect(-16, -86 + bob, 8, 4);

    // Ninja Headband (if ninja)
    if (char.colors.headband) {
      ctx.fillStyle = char.colors.headband;
      ctx.fillRect(-12, -87 + bob, 24, 4);
      // Flowing tail ribbons
      ctx.fillRect(-22, -86 + bob + armSwing * 0.1, 10, 3);
    }
  }

  renderJumpPose(ctx, char, vy) {
    // Bent jumping legs
    ctx.fillStyle = char.colors.pants;
    ctx.fillRect(-13, -28, 9, 24);
    ctx.fillRect(4, -28, 9, 24);

    ctx.fillStyle = char.colors.shoes;
    ctx.fillRect(-15, -8, 13, 8);
    ctx.fillRect(2, -8, 13, 8);

    // Torso
    ctx.fillStyle = char.colors.jacket;
    ctx.beginPath();
    ctx.roundRect(-16, -68, 32, 42, 6);
    ctx.fill();

    ctx.fillStyle = char.colors.shirt;
    ctx.fillRect(-7, -64, 14, 30);

    // Arms raised for leap
    ctx.fillStyle = char.colors.jacket;
    ctx.fillRect(-22, -74, 8, 26);
    ctx.fillRect(14, -74, 8, 26);

    // Head
    ctx.fillStyle = char.colors.skin;
    ctx.beginPath();
    ctx.arc(0, -78, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = char.colors.cap;
    ctx.beginPath();
    ctx.arc(0, -80, 13, Math.PI, 0);
    ctx.fill();
  }

  renderSlidePose(ctx, char, rollRotation) {
    ctx.save();
    ctx.translate(0, -20);
    ctx.rotate(rollRotation);

    // Compact rolling ball
    ctx.fillStyle = char.colors.jacket;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = char.colors.pants;
    ctx.beginPath();
    ctx.arc(0, 5, 14, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = char.colors.cap;
    ctx.beginPath();
    ctx.arc(0, -7, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderSurfingPose(ctx, char) {
    // Sideways skater stance
    ctx.fillStyle = char.colors.pants;
    ctx.fillRect(-12, -26, 9, 22);
    ctx.fillRect(3, -26, 9, 22);

    ctx.fillStyle = char.colors.shoes;
    ctx.fillRect(-14, -6, 12, 6);
    ctx.fillRect(2, -6, 12, 6);

    // Torso angled
    ctx.fillStyle = char.colors.jacket;
    ctx.beginPath();
    ctx.roundRect(-14, -65, 28, 40, 6);
    ctx.fill();

    // Head
    ctx.fillStyle = char.colors.skin;
    ctx.beginPath();
    ctx.arc(0, -74, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = char.colors.cap;
    ctx.beginPath();
    ctx.arc(0, -76, 13, Math.PI, 0);
    ctx.fill();
  }

  renderJetpackPose(ctx, char) {
    // Floating effortlessly
    ctx.fillStyle = char.colors.pants;
    ctx.fillRect(-10, -28, 8, 26);
    ctx.fillRect(2, -28, 8, 26);

    ctx.fillStyle = char.colors.shoes;
    ctx.fillRect(-12, -4, 11, 7);
    ctx.fillRect(1, -4, 11, 7);

    // Torso
    ctx.fillStyle = char.colors.jacket;
    ctx.beginPath();
    ctx.roundRect(-15, -68, 30, 42, 6);
    ctx.fill();

    // Hands gripping jetpack controls
    ctx.fillStyle = char.colors.skin;
    ctx.beginPath();
    ctx.arc(-16, -45, 5, 0, Math.PI * 2);
    ctx.arc(16, -45, 5, 0, Math.PI * 2);
    ctx.fill();

    // Head tilted up
    ctx.fillStyle = char.colors.skin;
    ctx.beginPath();
    ctx.arc(0, -78, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = char.colors.cap;
    ctx.beginPath();
    ctx.arc(0, -80, 13, Math.PI, 0);
    ctx.fill();
  }

  // --- Screen Vignettes & Effects ---
  renderVignettes(ctx, player, speedRatio) {
    // 1. Stumble Danger Vignette
    if (player.isStumbled) {
      const dangerGrad = ctx.createRadialGradient(
        this.width / 2, this.height / 2, this.height * 0.35,
        this.width / 2, this.height / 2, this.height * 0.75
      );
      dangerGrad.addColorStop(0, 'rgba(231, 76, 60, 0)');
      dangerGrad.addColorStop(1, 'rgba(231, 76, 60, 0.45)');
      ctx.fillStyle = dangerGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 2. Jetpack Sky Blue Vignette
    if (player.powerups.jetpack > 0) {
      const jetGrad = ctx.createRadialGradient(
        this.width / 2, this.height / 2, this.height * 0.4,
        this.width / 2, this.height / 2, this.height * 0.8
      );
      jetGrad.addColorStop(0, 'rgba(0, 210, 255, 0)');
      jetGrad.addColorStop(1, 'rgba(0, 210, 255, 0.3)');
      ctx.fillStyle = jetGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }
}

