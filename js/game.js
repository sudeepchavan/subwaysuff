/**
 * Subway Surfers 2D - Core Game Engine & Main Loop
 * Orchestrates player, tracks, physics, collision detection,
 * power-ups, scoring, Web Audio, VFX, and UI overlays.
 */

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new Renderer(this.canvas);
    this.player = new Player();
    this.inspector = new Inspector();
    this.track = new TrackManager();
    this.particles = new ParticleSystem();
    this.shop = new ShopManager();

    // Game States
    this.STATES = {
      MENU: 'MENU',
      PLAYING: 'PLAYING',
      PAUSED: 'PAUSED',
      GAMEOVER: 'GAMEOVER'
    };
    this.state = this.STATES.MENU;

    // Run Stats
    this.score = 0;
    this.coinsCollected = 0;
    this.distance = 0;
    this.speed = CONSTANTS.PLAYER.BASE_SPEED;
    this.isNewHighScore = false;

    // Time & Loop
    this.lastTime = 0;
    this.runTime = 0;

    // Multi-tap detection for Hoverboard
    this.lastTapTime = 0;

    // Cache DOM Elements
    this.initDOMElements();

    // Bind Controls
    this.bindInputs();

    // Initial character/board load
    this.applyPlayerCustomizations();

    // Setup initial UI
    this.updateHUD();
    this.renderMissionsList();

    // Start requestAnimationFrame loop
    requestAnimationFrame(this.loop.bind(this));
  }

  initDOMElements() {
    // HUD
    this.hudEl = document.getElementById('hud');
    this.scoreValEl = document.getElementById('scoreValue');
    this.highScoreValEl = document.getElementById('highScoreValue');
    this.coinsValEl = document.getElementById('coinsValue');
    this.multiplierValEl = document.getElementById('multiplierValue');
    this.powerupBarsEl = document.getElementById('powerupBars');
    this.hoverboardBtn = document.getElementById('btnHoverboard');
    this.hoverboardBadge = document.getElementById('boardCountBadge');

    // Screens
    this.startScreen = document.getElementById('startScreen');
    this.pauseScreen = document.getElementById('pauseScreen');
    this.gameOverScreen = document.getElementById('gameOverScreen');
    this.shopModal = document.getElementById('shopModal');
    this.missionsModal = document.getElementById('missionsModal');

    // Game Over stats
    this.finalScoreEl = document.getElementById('finalScore');
    this.finalCoinsEl = document.getElementById('finalCoins');
    this.finalDistanceEl = document.getElementById('finalDistance');
    this.newBestBadge = document.getElementById('newBestBadge');

    // Audio button
    this.muteBtn = document.getElementById('btnMute');
    this.updateMuteIcon();
  }

  applyPlayerCustomizations() {
    this.player.setCharacter(this.shop.getSelectedCharacter());
    this.player.setBoard(this.shop.getSelectedBoard());
  }

  bindInputs() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      // Audio activation on first interaction
      soundEngine.ensureContext();

      if (e.repeat) return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          if (this.state === this.STATES.PLAYING) this.player.moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          if (this.state === this.STATES.PLAYING) this.player.moveRight();
          break;
        case 'ArrowUp':
        case 'KeyW':
          if (this.state === this.STATES.PLAYING) {
            if (this.player.jump()) {
              this.shop.reportStat('jumps', 1);
            }
          }
          break;
        case 'ArrowDown':
        case 'KeyS':
          if (this.state === this.STATES.PLAYING) {
            if (this.player.slide()) {
              this.shop.reportStat('rolls', 1);
            }
          }
          break;
        case 'Space':
          if (this.state === this.STATES.PLAYING) {
            this.tryUseHoverboard();
          } else if (this.state === this.STATES.MENU) {
            this.startGame();
          } else if (this.state === this.STATES.GAMEOVER) {
            this.startGame();
          }
          break;
        case 'KeyP':
        case 'Escape':
          if (this.state === this.STATES.PLAYING) this.pauseGame();
          else if (this.state === this.STATES.PAUSED) this.resumeGame();
          break;
        case 'KeyM':
          this.toggleMute();
          break;
      }
    });

    // Touch Swipe Detection
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    this.canvas.addEventListener('touchstart', (e) => {
      soundEngine.ensureContext();
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        const duration = Date.now() - touchStartTime;

        // Double tap check
        const now = Date.now();
        if (now - this.lastTapTime < 300 && Math.abs(dx) < 25 && Math.abs(dy) < 25) {
          if (this.state === this.STATES.PLAYING) {
            this.tryUseHoverboard();
          }
          this.lastTapTime = 0;
          return;
        }
        this.lastTapTime = now;

        // Swipe check
        const minSwipeDist = 30;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipeDist) {
          // Horizontal swipe
          if (dx > 0) {
            if (this.state === this.STATES.PLAYING) this.player.moveRight();
          } else {
            if (this.state === this.STATES.PLAYING) this.player.moveLeft();
          }
        } else if (Math.abs(dy) > minSwipeDist) {
          // Vertical swipe
          if (dy < 0) {
            if (this.state === this.STATES.PLAYING) {
              if (this.player.jump()) this.shop.reportStat('jumps', 1);
            }
          } else {
            if (this.state === this.STATES.PLAYING) {
              if (this.player.slide()) this.shop.reportStat('rolls', 1);
            }
          }
        }
      }
    }, { passive: true });

    // On-screen control buttons
    document.getElementById('btnLeft')?.addEventListener('click', () => {
      if (this.state === this.STATES.PLAYING) this.player.moveLeft();
    });
    document.getElementById('btnRight')?.addEventListener('click', () => {
      if (this.state === this.STATES.PLAYING) this.player.moveRight();
    });
    document.getElementById('btnJump')?.addEventListener('click', () => {
      if (this.state === this.STATES.PLAYING && this.player.jump()) {
        this.shop.reportStat('jumps', 1);
      }
    });
    document.getElementById('btnSlide')?.addEventListener('click', () => {
      if (this.state === this.STATES.PLAYING && this.player.slide()) {
        this.shop.reportStat('rolls', 1);
      }
    });
    this.hoverboardBtn?.addEventListener('click', () => {
      if (this.state === this.STATES.PLAYING) this.tryUseHoverboard();
    });

    // Menu Buttons
    document.getElementById('btnStartGame')?.addEventListener('click', () => this.startGame());
    document.getElementById('btnRestartGame')?.addEventListener('click', () => this.startGame());
    document.getElementById('btnResumeGame')?.addEventListener('click', () => this.resumeGame());
    document.getElementById('btnPause')?.addEventListener('click', () => this.pauseGame());
    document.getElementById('btnQuitToMenu')?.addEventListener('click', () => this.quitToMenu());
    document.getElementById('btnPauseQuit')?.addEventListener('click', () => this.quitToMenu());
    this.muteBtn?.addEventListener('click', () => this.toggleMute());

    // Modals
    document.getElementById('btnOpenShop')?.addEventListener('click', () => this.openShop());
    document.getElementById('btnCloseShop')?.addEventListener('click', () => this.closeShop());
    document.getElementById('btnOpenMissions')?.addEventListener('click', () => this.openMissions());
    document.getElementById('btnCloseMissions')?.addEventListener('click', () => this.closeMissions());
  }

  toggleMute() {
    const isMuted = soundEngine.toggleMute();
    this.updateMuteIcon();
  }

  updateMuteIcon() {
    if (this.muteBtn) {
      this.muteBtn.innerHTML = soundEngine.isMuted ? '🔇' : '🔊';
    }
  }

  tryUseHoverboard() {
    if (this.player.powerups.hoverboard > 0) return;
    if (this.shop.data.hoverboardInventory > 0) {
      if (this.shop.consumeHoverboard()) {
        this.player.activateHoverboard();
        this.shop.reportStat('use_board', 1);
        this.particles.addFloatingText('HOVERBOARD!', this.canvas.width / 2, this.canvas.height * 0.45, '#ff00aa', 24);
        this.updateHUD();
      }
    } else {
      this.particles.addFloatingText('NO BOARDS LEFT! BUY IN SHOP', this.canvas.width / 2, this.canvas.height * 0.45, '#e74c3c', 16);
    }
  }

  // --- Game State Flow ---

  startGame() {
    soundEngine.ensureContext();
    this.state = this.STATES.PLAYING;

    // Reset stats
    this.score = 0;
    this.coinsCollected = 0;
    this.distance = 0;
    this.speed = CONSTANTS.PLAYER.BASE_SPEED;
    this.isNewHighScore = false;
    this.runTime = 0;

    // Reset entities
    this.player.reset();
    this.applyPlayerCustomizations();
    this.inspector.reset();
    this.track.reset();
    this.particles.reset();

    // Start background soundtrack
    soundEngine.startMusic();

    // Hide modals & screens
    this.startScreen.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.shopModal.classList.add('hidden');
    this.missionsModal.classList.add('hidden');
    this.hudEl.classList.remove('hidden');

    this.updateHUD();
  }

  pauseGame() {
    if (this.state !== this.STATES.PLAYING) return;
    this.state = this.STATES.PAUSED;
    this.pauseScreen.classList.remove('hidden');
  }

  resumeGame() {
    if (this.state !== this.STATES.PAUSED) return;
    this.state = this.STATES.PLAYING;
    this.pauseScreen.classList.add('hidden');
    this.lastTime = performance.now();
  }

  quitToMenu() {
    this.state = this.STATES.MENU;
    soundEngine.stopMusic();
    this.pauseScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.startScreen.classList.remove('hidden');
    this.hudEl.classList.remove('hidden');
    this.updateHUD();
  }

  triggerGameOver() {
    this.state = this.STATES.GAMEOVER;

    // Add final run coins to shop wallet
    this.shop.addCoins(this.coinsCollected);

    // Check High Score
    this.isNewHighScore = this.shop.setHighScore(this.score);

    // Report Mission stats
    this.shop.reportStat('coins_single', this.coinsCollected);
    this.shop.reportStat('score_single', Math.floor(this.score));
    this.shop.reportStat('coins_total', this.coinsCollected);

    // Update Game Over Modal text
    this.finalScoreEl.innerText = Math.floor(this.score).toLocaleString();
    this.finalCoinsEl.innerText = this.coinsCollected.toLocaleString();
    this.finalDistanceEl.innerText = `${Math.floor(this.distance)}m`;

    if (this.isNewHighScore) {
      this.newBestBadge.classList.remove('hidden');
      this.particles.addConfetti(this.canvas.width, this.canvas.height);
    } else {
      this.newBestBadge.classList.add('hidden');
    }

    setTimeout(() => {
      this.gameOverScreen.classList.remove('hidden');
    }, 900);
  }

  // --- Main Update Loop ---

  update(dt) {
    if (this.state !== this.STATES.PLAYING && this.state !== this.STATES.GAMEOVER) {
      return;
    }

    this.runTime += dt;

    // Increase speed gradually over time
    if (this.state === this.STATES.PLAYING) {
      this.speed = Math.min(
        CONSTANTS.PLAYER.MAX_SPEED,
        CONSTANTS.PLAYER.BASE_SPEED + this.runTime * CONSTANTS.PLAYER.SPEED_ACCEL
      );

      // Distance & Score calculation
      const distDelta = (this.speed * dt) * 0.1;
      this.distance += distDelta;

      const baseMultiplier = 1;
      const is2X = this.player.powerups.multiplier > 0 ? 2 : 1;
      const totalMultiplier = baseMultiplier * is2X;
      this.score += distDelta * totalMultiplier * 5;
    }

    const speedRatio = (this.speed - CONSTANTS.PLAYER.BASE_SPEED) / (CONSTANTS.PLAYER.MAX_SPEED - CONSTANTS.PLAYER.BASE_SPEED);

    // 1. Update Player
    this.player.update(dt, this.speed, this.particles);

    // 2. Update Track & Procedural Chunks
    this.track.update(dt, this.speed, this.player, this.particles);

    // 3. Update Inspector & Dog
    this.inspector.update(dt, this.player, this.speed);

    // 4. Update Particle Systems
    this.particles.update(dt, speedRatio, this.canvas.width, this.canvas.height);

    // 5. Collision Checks (Only if alive)
    if (this.state === this.STATES.PLAYING) {
      this.handleCollisions();
    }

    // 6. Update HUD UI
    this.updateHUD();
  }

  // --- Collision Detection ---

  handleCollisions() {
    const p = this.player;
    const hitbox = p.getHitbox();
    const playerZ = 0; // In camera space player is at Z = 0
    let onRoofOfTrain = null;

    // A. Train Collisions
    for (const train of this.track.trains) {
      const trainLaneX = train.lane * CONSTANTS.TRACK.LANE_WIDTH;
      const zFront = train.z;
      const zBack = train.z + train.length;
      const halfW = train.width / 2;

      // Check longitudinal Z overlap
      if (playerZ >= zFront - 20 && playerZ <= zBack) {
        // Check lateral X overlap
        const isNearTrainLane = Math.abs(p.x - trainLaneX) < (halfW + hitbox.width / 2 - 8);

        if (isNearTrainLane) {
          // If train has a ramp and player enters from the front:
          if (train.hasRamp && playerZ < zFront + 50 && playerZ >= zFront - CONSTANTS.OBSTACLES.TRAIN.RAMP_LENGTH) {
            // Glide up ramp smoothly!
            const rampProgress = (playerZ - (zFront - CONSTANTS.OBSTACLES.TRAIN.RAMP_LENGTH)) / CONSTANTS.OBSTACLES.TRAIN.RAMP_LENGTH;
            const rampY = Math.max(0, Math.min(train.height, rampProgress * train.height));
            p.groundY = rampY;
            p.y = Math.max(p.y, rampY);
          } else if (p.y >= train.height - CONSTANTS.OBSTACLES.TRAIN.ROOF_MARGIN) {
            // Running or landed on Train Roof!
            onRoofOfTrain = train;
            p.groundY = train.height;
            this.shop.reportStat('train_roofs', 1);
          } else {
            // Frontal or Side Impact!
            if (playerZ < zFront + 45) {
              // Hit front of train
              const outcome = p.crash();
              if (outcome === 'saved') {
                this.renderer.addCameraShake(12);
                this.particles.addBoardShatter(this.canvas.width / 2, this.canvas.height * 0.55, p.board.primaryColor);
                this.particles.addFloatingText('SAVED BY BOARD!', this.canvas.width / 2, this.canvas.height * 0.45, '#39ff14', 22);
              } else if (outcome === 'dead') {
                this.renderer.addCameraShake(18);
                this.triggerGameOver();
              }
            } else {
              // Side clip
              const stumbleRes = p.stumble();
              if (stumbleRes === 'saved') {
                this.renderer.addCameraShake(10);
                this.particles.addBoardShatter(this.canvas.width / 2, this.canvas.height * 0.55, p.board.primaryColor);
              } else if (stumbleRes === 'stumble') {
                this.renderer.addCameraShake(7);
                this.particles.addFloatingText('WATCH OUT!', this.canvas.width / 2, this.canvas.height * 0.4, '#e74c3c', 20);
              }
            }
          }
        }
      }
    }

    // Set ground level back to 0 if left train roof
    if (!onRoofOfTrain && p.groundY > 0 && p.powerups.jetpack <= 0) {
      p.groundY = 0;
      p.isJumping = true; // Fall off train roof onto tracks
    }

    // B. Barrier Collisions
    for (const b of this.track.barriers) {
      if (Math.abs(b.z) < 28) {
        const barrierX = b.lane * CONSTANTS.TRACK.LANE_WIDTH;
        const isLaneMatch = Math.abs(p.x - barrierX) < 45;

        if (isLaneMatch) {
          if (b.type === 'low') {
            // Must jump over
            if (p.y < b.height - 8) {
              const res = p.stumble();
              if (res === 'saved') {
                this.renderer.addCameraShake(10);
                this.particles.addBoardShatter(this.canvas.width / 2, this.canvas.height * 0.55, p.board.primaryColor);
              } else if (res === 'stumble') {
                this.renderer.addCameraShake(6);
                this.particles.addFloatingText('STUMBLE!', this.canvas.width / 2, this.canvas.height * 0.4, '#e74c3c', 20);
              }
            }
          } else if (b.type === 'high') {
            // Must slide under
            if (!p.isSliding || p.y > b.clearance) {
              if (p.groundY < b.height) { // If not running on a high train roof
                const res = p.crash();
                if (res === 'saved') {
                  this.renderer.addCameraShake(12);
                  this.particles.addBoardShatter(this.canvas.width / 2, this.canvas.height * 0.55, p.board.primaryColor);
                } else if (res === 'dead') {
                  this.renderer.addCameraShake(16);
                  this.triggerGameOver();
                }
              }
            }
          }
        }
      }
    }

    // C. Coin Collection
    const checkCoin = (c) => {
      if (c.collected) return;
      if (Math.abs(c.z) < 35 && Math.abs(c.x - p.x) < 45 && Math.abs(c.y - p.y) < 55) {
        c.collected = true;
        this.coinsCollected++;
        this.score += 25;
        soundEngine.playCoin();

        const proj = this.renderer.project(c.x, c.y, 0);
        if (proj) {
          this.particles.addCoinSparkle(proj.x, proj.y);
        }
      }
    };

    this.track.coins.forEach(checkCoin);
    for (const tr of this.track.trains) {
      tr.roofCoins.forEach(checkCoin);
    }

    // D. Power-up Collection
    for (const pw of this.track.powerups) {
      if (pw.collected) return;
      if (Math.abs(pw.z) < 40 && Math.abs(pw.x - p.x) < 50 && Math.abs(pw.y - p.y) < 65) {
        pw.collected = true;
        const duration = this.shop.getPowerupDuration(pw.type);
        p.applyPowerup(pw.type, duration);
        this.shop.reportStat('powerups', 1);

        const config = CONSTANTS.POWERUPS[pw.type.toUpperCase()];
        const proj = this.renderer.project(pw.x, pw.y, 0);
        if (proj) {
          this.particles.addFloatingText(`${config.NAME}!`, proj.x, proj.y - 20, config.COLOR, 24);
        }
      }
    }
  }

  // --- UI & HUD Synchronization ---

  updateHUD() {
    this.scoreValEl.innerText = Math.floor(this.score).toLocaleString();
    this.highScoreValEl.innerText = this.shop.data.highScore.toLocaleString();
    this.coinsValEl.innerText = (this.shop.data.coins + this.coinsCollected).toLocaleString();

    const mult = this.player.powerups.multiplier > 0 ? '2X' : '1X';
    this.multiplierValEl.innerText = mult;
    this.multiplierValEl.style.color = this.player.powerups.multiplier > 0 ? '#ffea00' : '#ffffff';

    if (this.hoverboardBadge) {
      this.hoverboardBadge.innerText = this.shop.data.hoverboardInventory;
    }

    // Power-up duration progress bars
    this.powerupBarsEl.innerHTML = '';
    const activePowerups = [
      { key: 'magnet', name: '🧲 Magnet', color: '#ff3366', max: this.shop.getPowerupDuration('magnet') },
      { key: 'jetpack', name: '🚀 Jetpack', color: '#00d2ff', max: this.shop.getPowerupDuration('jetpack') },
      { key: 'sneakers', name: '👟 Sneakers', color: '#39ff14', max: this.shop.getPowerupDuration('sneakers') },
      { key: 'multiplier', name: '⭐ 2x Boost', color: '#ffbb00', max: this.shop.getPowerupDuration('multiplier') },
      { key: 'hoverboard', name: '🛹 Shield', color: '#ff00aa', max: CONSTANTS.POWERUPS.HOVERBOARD.DURATION }
    ];

    for (const ap of activePowerups) {
      const remaining = this.player.powerups[ap.key];
      if (remaining > 0) {
        const pct = Math.max(0, Math.min(100, (remaining / ap.max) * 100));
        const barItem = document.createElement('div');
        barItem.className = 'powerup-bar-item';
        barItem.innerHTML = `
          <div class="powerup-bar-label">${ap.name}</div>
          <div class="powerup-bar-track">
            <div class="powerup-bar-fill" style="width: ${pct}%; background: ${ap.color}"></div>
          </div>
        `;
        this.powerupBarsEl.appendChild(barItem);
      }
    }
  }

  // --- Modals & Shop Controls ---

  openShop() {
    this.shopModal.classList.remove('hidden');
    this.renderShopView();
  }

  closeShop() {
    this.shopModal.classList.add('hidden');
    this.applyPlayerCustomizations();
    this.updateHUD();
  }

  renderShopView() {
    document.getElementById('shopCoins').innerText = this.shop.data.coins.toLocaleString();

    // Characters Grid
    const charContainer = document.getElementById('shopCharactersGrid');
    charContainer.innerHTML = '';
    for (const c of CONSTANTS.CHARACTERS) {
      const isUnlocked = this.shop.data.unlockedCharacters.includes(c.id);
      const isSelected = this.shop.data.selectedCharacter === c.id;

      const card = document.createElement('div');
      card.className = `shop-item-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="item-icon-box" style="background: ${c.colors.jacket}">
          <span style="font-size: 32px">🏃</span>
        </div>
        <div class="item-name">${c.name}</div>
        <div class="item-desc">${c.title}</div>
        <button class="btn-shop-action ${isSelected ? 'btn-selected' : isUnlocked ? 'btn-select' : 'btn-buy'}">
          ${isSelected ? 'EQUIPPED' : isUnlocked ? 'EQUIP' : `🪙 ${c.price}`}
        </button>
      `;

      card.querySelector('button').addEventListener('click', () => {
        if (isUnlocked) {
          this.shop.selectCharacter(c.id);
        } else {
          if (this.shop.unlockCharacter(c.id)) {
            soundEngine.playPowerup();
          } else {
            alert('Not enough coins!');
          }
        }
        this.renderShopView();
      });
      charContainer.appendChild(card);
    }

    // Hoverboards Grid
    const boardContainer = document.getElementById('shopBoardsGrid');
    boardContainer.innerHTML = '';
    for (const b of CONSTANTS.BOARDS) {
      const isUnlocked = this.shop.data.unlockedBoards.includes(b.id);
      const isSelected = this.shop.data.selectedBoard === b.id;

      const card = document.createElement('div');
      card.className = `shop-item-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="item-icon-box" style="background: ${b.primaryColor}; border: 2px solid ${b.secondaryColor}">
          <span style="font-size: 32px">🛹</span>
        </div>
        <div class="item-name">${b.name}</div>
        <div class="item-desc">${b.description}</div>
        <button class="btn-shop-action ${isSelected ? 'btn-selected' : isUnlocked ? 'btn-select' : 'btn-buy'}">
          ${isSelected ? 'EQUIPPED' : isUnlocked ? 'EQUIP' : `🪙 ${b.price}`}
        </button>
      `;

      card.querySelector('button').addEventListener('click', () => {
        if (isUnlocked) {
          this.shop.selectBoard(b.id);
        } else {
          if (this.shop.unlockBoard(b.id)) {
            soundEngine.playPowerup();
          } else {
            alert('Not enough coins!');
          }
        }
        this.renderShopView();
      });
      boardContainer.appendChild(card);
    }

    // Upgrades Grid
    const upgradesContainer = document.getElementById('shopUpgradesGrid');
    upgradesContainer.innerHTML = '';
    const upgradeKeys = [
      { id: 'magnet', name: 'Coin Magnet', icon: '🧲', desc: '+3s Magnet Pull' },
      { id: 'jetpack', name: 'Super Jetpack', icon: '🚀', desc: '+2.5s Flight Time' },
      { id: 'sneakers', name: 'Super Sneakers', icon: '👟', desc: '+3s High Jump' },
      { id: 'multiplier', name: '2x Multiplier', icon: '⭐', desc: '+4s Double Score' }
    ];

    for (const u of upgradeKeys) {
      const level = this.shop.getUpgradeLevel(u.id);
      const cost = this.shop.getUpgradeCost(u.id);
      const isMax = cost === null;

      const card = document.createElement('div');
      card.className = 'shop-upgrade-card';
      card.innerHTML = `
        <div class="upgrade-header">
          <span style="font-size: 26px">${u.icon}</span>
          <div>
            <div class="item-name">${u.name}</div>
            <div class="item-desc">${u.desc}</div>
          </div>
        </div>
        <div class="level-indicator">Level: ${level} / 5</div>
        <button class="btn-shop-action ${isMax ? 'btn-selected' : 'btn-buy'}">
          ${isMax ? 'MAX LEVEL' : `UPGRADE: 🪙 ${cost}`}
        </button>
      `;

      card.querySelector('button').addEventListener('click', () => {
        if (!isMax) {
          if (this.shop.buyUpgrade(u.id)) {
            soundEngine.playPowerup();
            this.renderShopView();
          } else {
            alert('Not enough coins!');
          }
        }
      });
      upgradesContainer.appendChild(card);
    }

    // Buy Hoverboard Pack
    const btnBuyPack = document.getElementById('btnBuyBoardPack');
    if (btnBuyPack) {
      btnBuyPack.onclick = () => {
        if (this.shop.buyHoverboardPack(3, 250)) {
          soundEngine.playPowerup();
          this.renderShopView();
        } else {
          alert('Need 250 coins for 3 Hoverboards!');
        }
      };
    }
  }

  // --- Missions Modal ---

  openMissions() {
    this.missionsModal.classList.remove('hidden');
    this.renderMissionsList();
  }

  closeMissions() {
    this.missionsModal.classList.add('hidden');
  }

  renderMissionsList() {
    const listEl = document.getElementById('missionsList');
    if (!listEl) return;

    listEl.innerHTML = '';
    for (const m of this.shop.data.missions) {
      const pct = Math.min(100, Math.floor((m.progress / m.target) * 100));
      const row = document.createElement('div');
      row.className = `mission-item ${m.completed ? 'completed' : ''}`;
      row.innerHTML = `
        <div class="mission-info">
          <div class="mission-title">${m.text}</div>
          <div class="mission-prog-bar">
            <div class="mission-prog-fill" style="width: ${pct}%"></div>
          </div>
          <div class="mission-count">${m.progress} / ${m.target}</div>
        </div>
        <div class="mission-reward">
          ${m.completed ? '✅ CLAIMED' : `🪙 +${m.reward}`}
        </div>
      `;
      listEl.appendChild(row);
    }
  }

  // --- Main Animation Frame Loop ---

  loop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    const dt = Math.min(0.05, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    // Update state
    this.update(dt);

    // Render world
    const speedRatio = (this.speed - CONSTANTS.PLAYER.BASE_SPEED) / (CONSTANTS.PLAYER.MAX_SPEED - CONSTANTS.PLAYER.BASE_SPEED);
    this.renderer.render(this.player, this.track, this.inspector, this.particles, speedRatio);

    requestAnimationFrame(this.loop.bind(this));
  }
}

// Instantiate game on window load
window.addEventListener('DOMContentLoaded', () => {
  window.subwayGame = new Game();
});

