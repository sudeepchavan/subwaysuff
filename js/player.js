/**
 * Subway Surfers 2D - Player Entity & Physics
 * Handles lane navigation, jumping, rolling/sliding, train-roof riding,
 * power-up status, and animation kinematics.
 */

class Player {
  constructor() {
    this.reset();
  }

  reset() {
    // Spatial coordinates (in world units)
    this.lane = 0; // -1, 0, 1
    this.targetLane = 0;
    this.x = 0; // Current world X (interpolates to targetLane * LANE_WIDTH)
    this.y = 0; // Current height above track/roof
    this.vy = 0; // Vertical velocity
    this.z = 0; // Distance forward along track
    this.groundY = 0; // Current ground level (0 for tracks, train.height for roofs)

    // State flags
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.isStumbled = false;
    this.stumbleTimer = 0;
    this.isDead = false;
    this.currentTrainOnRoof = null;

    // Power-up Active Timers
    this.powerups = {
      magnet: 0,
      jetpack: 0,
      sneakers: 0,
      multiplier: 0,
      hoverboard: 0
    };

    // Invulnerability frames (e.g., after hoverboard crash)
    this.invulnerableTimer = 0;

    // Active Character & Board config
    this.character = CONSTANTS.CHARACTERS[0];
    this.board = CONSTANTS.BOARDS[0];

    // Animation kinematic timers
    this.animTime = 0;
    this.rollRotation = 0;
    this.jumpSquash = 1;
    this.bankAngle = 0; // Lean while switching lanes
  }

  setCharacter(char) {
    if (char) this.character = char;
  }

  setBoard(board) {
    if (board) this.board = board;
  }

  // --- Controls & Input Actions ---

  moveLeft() {
    if (this.isDead || this.powerups.jetpack > 0) return;
    if (this.targetLane > -1) {
      this.targetLane--;
    }
  }

  moveRight() {
    if (this.isDead || this.powerups.jetpack > 0) return;
    if (this.targetLane < 1) {
      this.targetLane++;
    }
  }

  jump() {
    if (this.isDead || this.powerups.jetpack > 0) return;

    // Can jump from ground, from train roof, or if sliding
    if (!this.isJumping || Math.abs(this.y - this.groundY) < 10) {
      const hasSneakers = this.powerups.sneakers > 0;
      this.vy = hasSneakers ? CONSTANTS.PLAYER.SUPER_JUMP_VELOCITY : CONSTANTS.PLAYER.JUMP_VELOCITY;
      this.isJumping = true;
      this.isSliding = false;
      this.slideTimer = 0;
      soundEngine.playJump(hasSneakers);
      return true;
    }
    return false;
  }

  slide() {
    if (this.isDead || this.powerups.jetpack > 0) return;

    // If mid-air: dive down instantly (Fast Drop)
    if (this.isJumping && this.y > this.groundY + 15) {
      this.vy = -CONSTANTS.PLAYER.FAST_DROP_GRAVITY * 0.28;
    }

    this.isSliding = true;
    this.slideTimer = CONSTANTS.PLAYER.SLIDE_DURATION;
    this.rollRotation = 0;
    soundEngine.playSlide();
    return true;
  }

  activateHoverboard() {
    if (this.isDead || this.powerups.jetpack > 0) return false;
    if (this.powerups.hoverboard <= 0) {
      this.powerups.hoverboard = CONSTANTS.POWERUPS.HOVERBOARD.DURATION;
      soundEngine.playHoverboard();
      return true;
    }
    return false;
  }

  applyPowerup(id, duration) {
    if (this.powerups[id] !== undefined) {
      this.powerups[id] = Math.max(this.powerups[id], duration);
      soundEngine.playPowerup();

      if (id === 'jetpack') {
        soundEngine.setJetpackMusic(true);
      }
    }
  }

  stumble() {
    if (this.invulnerableTimer > 0) return false;

    if (this.powerups.hoverboard > 0) {
      // Board saves player!
      this.powerups.hoverboard = 0;
      this.invulnerableTimer = 1.6;
      soundEngine.playBoardCrash();
      return 'saved';
    }

    this.isStumbled = true;
    this.stumbleTimer = 3.5; // Seconds to recover
    soundEngine.playWhistle();
    soundEngine.playDogBark();
    return 'stumble';
  }

  crash() {
    if (this.invulnerableTimer > 0) return false;

    if (this.powerups.hoverboard > 0) {
      this.powerups.hoverboard = 0;
      this.invulnerableTimer = 1.6;
      soundEngine.playBoardCrash();
      return 'saved';
    }

    this.isDead = true;
    soundEngine.playCrash();
    soundEngine.stopMusic();
    return 'dead';
  }

  // --- Physics & Kinematics Update ---

  update(dt, currentSpeed, particles) {
    if (this.isDead) return;

    this.animTime += dt * (currentSpeed / CONSTANTS.PLAYER.BASE_SPEED) * 12;

    // Update Timers
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

    if (this.stumbleTimer > 0) {
      this.stumbleTimer -= dt;
      if (this.stumbleTimer <= 0) this.isStumbled = false;
    }

    // Power-up countdowns
    for (const key in this.powerups) {
      if (this.powerups[key] > 0) {
        this.powerups[key] -= dt;
        if (this.powerups[key] <= 0) {
          this.powerups[key] = 0;
          if (key === 'jetpack') {
            soundEngine.setJetpackMusic(false);
          }
        }
      }
    }

    // Lane change smooth interpolation (spring/lerp)
    const targetX = this.targetLane * CONSTANTS.TRACK.LANE_WIDTH;
    const dx = targetX - this.x;
    this.x += dx * Math.min(1, CONSTANTS.PLAYER.LANE_CHANGE_SPEED * dt);
    this.bankAngle = -(dx / CONSTANTS.TRACK.LANE_WIDTH) * 0.28;

    // Jetpack special flight mode
    if (this.powerups.jetpack > 0) {
      const targetFlightY = CONSTANTS.POWERUPS.JETPACK.FLIGHT_HEIGHT;
      this.y += (targetFlightY - this.y) * Math.min(1, 6 * dt);
      this.vy = 0;
      this.isJumping = false;
      this.isSliding = false;
      return;
    } else if (this.y > this.groundY + 10 && !this.isJumping) {
      // Smooth descent after jetpack ends
      this.vy = -CONSTANTS.PLAYER.GRAVITY * 0.4;
      this.isJumping = true;
    }

    // Vertical Jump & Gravity Physics
    if (this.isJumping || this.y > this.groundY) {
      this.y += this.vy * dt;
      this.vy -= CONSTANTS.PLAYER.GRAVITY * dt;

      if (this.y <= this.groundY) {
        // Landed!
        this.y = this.groundY;
        this.vy = 0;
        this.isJumping = false;
        // Trigger landing dust
        if (particles) {
          // Will be converted to screen coordinates in renderer
          this.justLanded = true;
        }
      }
    } else {
      this.y = this.groundY;
      this.vy = 0;
    }

    // Slide / Roll Timer
    if (this.isSliding) {
      this.slideTimer -= dt;
      this.rollRotation += dt * 14;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.rollRotation = 0;
      }
    }
  }

  // Bounding box for collision detection
  getHitbox() {
    const isSliding = this.isSliding;
    const currentHeight = isSliding ? CONSTANTS.PLAYER.SLIDE_HEIGHT : CONSTANTS.PLAYER.HEIGHT;
    return {
      x: this.x,
      y: this.y,
      width: CONSTANTS.PLAYER.WIDTH * 0.75,
      height: currentHeight,
      bottomY: this.y,
      topY: this.y + currentHeight
    };
  }
}

