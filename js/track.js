/**
 * Subway Surfers 2D - Procedural Track, Obstacle, Train & Coin Generator
 * Generates fair, thrilling railway patterns, moving trains, ramps,
 * barrier hurdles, power-ups, and coin cascades.
 */

class TrackManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.trains = [];
    this.barriers = [];
    this.coins = [];
    this.powerups = [];
    this.gantries = [];
    this.sceneryProps = [];

    this.nextSpawnZ = 700; // Give a clean runway at the start
    this.gantrySpawnZ = 600;
    this.propSpawnZ = 300;
    this.zDistance = 0; // Total distance traveled
  }

  update(dt, speed, player, particles) {
    const moveZ = speed * dt;
    this.zDistance += moveZ;

    // --- Move Elements Closer to Player ---

    // 1. Trains
    for (let i = this.trains.length - 1; i >= 0; i--) {
      const train = this.trains[i];
      // Trains moving towards player move even faster!
      const totalSpeed = speed + (train.isMoving ? CONSTANTS.OBSTACLES.TRAIN.MOVING_SPEED : 0);
      train.z -= totalSpeed * dt;

      // Update roof coins
      for (const coin of train.roofCoins) {
        coin.z -= totalSpeed * dt;
      }

      // Remove trains that passed far behind camera
      if (train.z + train.length < -200) {
        this.trains.splice(i, 1);
      }
    }

    // 2. Barriers
    for (let i = this.barriers.length - 1; i >= 0; i--) {
      const b = this.barriers[i];
      b.z -= moveZ;
      if (b.z < -100) {
        this.barriers.splice(i, 1);
      }
    }

    // 3. Coins (Ground & Sky)
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.z -= moveZ;

      // Magnet attraction
      if (player.powerups.magnet > 0 && !c.collected && c.z > -20 && c.z < CONSTANTS.POWERUPS.MAGNET.RANGE) {
        const targetX = player.x;
        const targetY = player.y + 35;
        const targetZ = 0;

        c.x += (targetX - c.x) * Math.min(1, 14 * dt);
        c.y += (targetY - c.y) * Math.min(1, 14 * dt);
        c.z += (targetZ - c.z) * Math.min(1, 16 * dt);
      }

      if (c.z < -60) {
        this.coins.splice(i, 1);
      }
    }

    // 4. Power-ups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.z -= moveZ;
      p.rotation = (p.rotation || 0) + dt * 3.5;
      p.bob = Math.sin(p.rotation) * 6;
      if (p.z < -80) {
        this.powerups.splice(i, 1);
      }
    }

    // 5. Overhead Gantries
    for (let i = this.gantries.length - 1; i >= 0; i--) {
      const g = this.gantries[i];
      g.z -= moveZ;
      if (g.z < -120) {
        this.gantries.splice(i, 1);
      }
    }

    // 6. Trackside Props (Signal lights, utility poles)
    for (let i = this.sceneryProps.length - 1; i >= 0; i--) {
      const prop = this.sceneryProps[i];
      prop.z -= moveZ;
      if (prop.z < -120) {
        this.sceneryProps.splice(i, 1);
      }
    }

    // --- Procedural Generation Ahead of Player ---
    this.generateAhead(player);
  }

  generateAhead(player) {
    const horizonSpawnLimit = 3400;

    // Spawn Scenery Props (Trackside lamps, signals)
    while (this.propSpawnZ < horizonSpawnLimit) {
      this.sceneryProps.push({
        side: Math.random() > 0.5 ? 1 : -1,
        z: this.propSpawnZ,
        type: Math.random() > 0.4 ? 'light_post' : 'signal_post',
        signalColor: Math.random() > 0.3 ? '#2ecc71' : '#e74c3c'
      });
      this.propSpawnZ += 280 + Math.random() * 220;
    }

    // Spawn Overhead Gantries
    while (this.gantrySpawnZ < horizonSpawnLimit) {
      this.gantries.push({
        z: this.gantrySpawnZ,
        hasSign: Math.random() > 0.3,
        signText: ['METRO', 'SUBWAY', 'TRACK 1-3', 'CAUTION', 'SPEED 80'][Math.floor(Math.random() * 5)]
      });
      this.gantrySpawnZ += CONSTANTS.OBSTACLES.GANTRY.INTERVAL;
    }

    // Spawn Gameplay Pattern Chunks
    while (this.nextSpawnZ < horizonSpawnLimit) {
      if (player.powerups.jetpack > 0) {
        // Special Jetpack High-Sky Coin Formation!
        this.spawnSkyCoinsPattern(this.nextSpawnZ);
        this.nextSpawnZ += 550;
      } else {
        // Standard Ground Track Pattern
        this.spawnTrackPattern(this.nextSpawnZ);
        this.nextSpawnZ += 700 + Math.random() * 250;
      }
    }
  }

  // --- Pattern Spawners ---

  spawnTrackPattern(baseZ) {
    const patterns = [
      'train_with_ramp_and_coins',
      'low_barriers_with_coin_arcs',
      'moving_train_dodge',
      'high_barrier_slide_run',
      'split_trains_corridor',
      'two_trains_one_ramp'
    ];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    const lanes = [-1, 0, 1];
    const trainColors = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#d35400', '#34495e'];
    const graffitiTags = ['SURF', 'RUSH', 'FAST', 'DASH', 'TAG', 'SUBWAY', 'JAKE'];

    switch (pattern) {
      case 'train_with_ramp_and_coins': {
        const trainLane = lanes[Math.floor(Math.random() * lanes.length)];
        const length = 550;
        const color = trainColors[Math.floor(Math.random() * trainColors.length)];
        const tag = graffitiTags[Math.floor(Math.random() * graffitiTags.length)];

        const train = {
          lane: trainLane,
          z: baseZ,
          length: length,
          height: CONSTANTS.OBSTACLES.TRAIN.HEIGHT,
          width: CONSTANTS.OBSTACLES.TRAIN.WIDTH,
          isMoving: false,
          hasRamp: true,
          color: color,
          tag: tag,
          roofCoins: []
        };

        // Coins along the ramp and roof!
        for (let rz = baseZ + 40; rz < baseZ + length - 40; rz += 45) {
          const ratio = (rz - baseZ) / CONSTANTS.OBSTACLES.TRAIN.RAMP_LENGTH;
          const coinY = ratio < 1 ? ratio * train.height + 15 : train.height + 18;
          train.roofCoins.push({
            x: trainLane * CONSTANTS.TRACK.LANE_WIDTH,
            y: coinY,
            z: rz,
            collected: false
          });
        }
        this.trains.push(train);

        // Put a barrier in an adjacent lane
        const otherLanes = lanes.filter(l => l !== trainLane);
        const barrierLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
        this.barriers.push({
          lane: barrierLane,
          z: baseZ + 150,
          type: 'low',
          height: CONSTANTS.OBSTACLES.LOW_BARRIER.HEIGHT,
          width: CONSTANTS.OBSTACLES.LOW_BARRIER.WIDTH
        });
        // Coin arc over barrier
        this.spawnCoinArc(barrierLane, baseZ + 150);

        // Maybe spawn a power-up on the train roof or empty lane!
        this.maybeSpawnPowerup(trainLane, train.height + 22, baseZ + length - 120);
        break;
      }

      case 'low_barriers_with_coin_arcs': {
        const jumpLane = lanes[Math.floor(Math.random() * lanes.length)];
        this.barriers.push({
          lane: jumpLane,
          z: baseZ,
          type: 'low',
          height: CONSTANTS.OBSTACLES.LOW_BARRIER.HEIGHT,
          width: CONSTANTS.OBSTACLES.LOW_BARRIER.WIDTH
        });
        this.spawnCoinArc(jumpLane, baseZ);

        // Second barrier slightly further
        const nextLane = lanes[Math.floor(Math.random() * lanes.length)];
        this.barriers.push({
          lane: nextLane,
          z: baseZ + 260,
          type: 'low',
          height: CONSTANTS.OBSTACLES.LOW_BARRIER.HEIGHT,
          width: CONSTANTS.OBSTACLES.LOW_BARRIER.WIDTH
        });
        this.spawnCoinArc(nextLane, baseZ + 260);
        break;
      }

      case 'moving_train_dodge': {
        const moveLane = lanes[Math.floor(Math.random() * lanes.length)];
        this.trains.push({
          lane: moveLane,
          z: baseZ + 300,
          length: 500,
          height: CONSTANTS.OBSTACLES.TRAIN.HEIGHT,
          width: CONSTANTS.OBSTACLES.TRAIN.WIDTH,
          isMoving: true,
          hasRamp: false,
          color: '#e74c3c',
          tag: 'DANGER',
          roofCoins: []
        });

        // Open lane has a trail of ground coins
        const safeLanes = lanes.filter(l => l !== moveLane);
        const safeLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
        this.spawnCoinLine(safeLane, baseZ, baseZ + 450, 0);
        this.maybeSpawnPowerup(safeLane, 15, baseZ + 220);
        break;
      }

      case 'high_barrier_slide_run': {
        const slideLane = lanes[Math.floor(Math.random() * lanes.length)];
        this.barriers.push({
          lane: slideLane,
          z: baseZ,
          type: 'high',
          height: CONSTANTS.OBSTACLES.HIGH_BARRIER.HEIGHT,
          width: CONSTANTS.OBSTACLES.HIGH_BARRIER.WIDTH,
          clearance: CONSTANTS.OBSTACLES.HIGH_BARRIER.CLEARANCE
        });
        // Low ground coins under high barrier rewarding slide!
        this.spawnCoinLine(slideLane, baseZ - 60, baseZ + 90, 8);

        // Low barrier in another lane
        const remainingLanes = lanes.filter(l => l !== slideLane);
        const bLane = remainingLanes[Math.floor(Math.random() * remainingLanes.length)];
        this.barriers.push({
          lane: bLane,
          z: baseZ + 120,
          type: 'low',
          height: CONSTANTS.OBSTACLES.LOW_BARRIER.HEIGHT,
          width: CONSTANTS.OBSTACLES.LOW_BARRIER.WIDTH
        });
        break;
      }

      case 'split_trains_corridor': {
        // Two parked trains on left and right, leaving center open or with hurdles
        [-1, 1].forEach(l => {
          this.trains.push({
            lane: l,
            z: baseZ,
            length: 480,
            height: CONSTANTS.OBSTACLES.TRAIN.HEIGHT,
            width: CONSTANTS.OBSTACLES.TRAIN.WIDTH,
            isMoving: false,
            hasRamp: Math.random() > 0.5,
            color: trainColors[Math.floor(Math.random() * trainColors.length)],
            tag: graffitiTags[Math.floor(Math.random() * graffitiTags.length)],
            roofCoins: []
          });
        });
        // Center lane has coins and a high or low barrier
        this.spawnCoinLine(0, baseZ, baseZ + 380, 0);
        this.maybeSpawnPowerup(0, 15, baseZ + 180);
        break;
      }

      case 'two_trains_one_ramp': {
        // Center train has ramp, side train has no ramp
        const rampLane = lanes[Math.floor(Math.random() * lanes.length)];
        this.trains.push({
          lane: rampLane,
          z: baseZ,
          length: 580,
          height: CONSTANTS.OBSTACLES.TRAIN.HEIGHT,
          width: CONSTANTS.OBSTACLES.TRAIN.WIDTH,
          isMoving: false,
          hasRamp: true,
          color: '#2980b9',
          tag: 'SKYLINE',
          roofCoins: []
        });
        // Roof coins
        for (let rz = baseZ + 80; rz < baseZ + 540; rz += 48) {
          this.coins.push({
            x: rampLane * CONSTANTS.TRACK.LANE_WIDTH,
            y: CONSTANTS.OBSTACLES.TRAIN.HEIGHT + 18,
            z: rz,
            collected: false
          });
        }
        break;
      }
    }
  }

  spawnSkyCoinsPattern(baseZ) {
    // Pure golden formations high in the sky!
    const patternType = Math.floor(Math.random() * 3);
    const flightY = CONSTANTS.POWERUPS.JETPACK.FLIGHT_HEIGHT;

    if (patternType === 0) {
      // 3-lane horizontal zigzag
      [-1, 0, 1].forEach(lane => {
        for (let z = baseZ; z < baseZ + 480; z += 40) {
          this.coins.push({
            x: lane * CONSTANTS.TRACK.LANE_WIDTH,
            y: flightY + Math.sin((z - baseZ) * 0.02) * 20,
            z: z,
            collected: false
          });
        }
      });
    } else if (patternType === 1) {
      // Golden Wave in Center Lane
      for (let z = baseZ; z < baseZ + 500; z += 35) {
        this.coins.push({
          x: 0,
          y: flightY + Math.sin((z - baseZ) * 0.025) * 35,
          z: z,
          collected: false
        });
      }
    } else {
      // High altitude diamond ring
      for (let z = baseZ; z < baseZ + 450; z += 38) {
        const curve = Math.sin((z - baseZ) / 450 * Math.PI);
        [-1, 1].forEach(dir => {
          this.coins.push({
            x: dir * curve * CONSTANTS.TRACK.LANE_WIDTH,
            y: flightY + curve * 25,
            z: z,
            collected: false
          });
        });
      }
    }
  }

  spawnCoinArc(lane, centerZ) {
    const startZ = centerZ - 90;
    const endZ = centerZ + 90;
    const arcHeight = 75;
    for (let z = startZ; z <= endZ; z += 36) {
      const progress = (z - startZ) / (endZ - startZ); // 0 to 1
      const y = Math.sin(progress * Math.PI) * arcHeight;
      this.coins.push({
        x: lane * CONSTANTS.TRACK.LANE_WIDTH,
        y: y,
        z: z,
        collected: false
      });
    }
  }

  spawnCoinLine(lane, startZ, endZ, y = 0) {
    for (let z = startZ; z <= endZ; z += 42) {
      this.coins.push({
        x: lane * CONSTANTS.TRACK.LANE_WIDTH,
        y: y,
        z: z,
        collected: false
      });
    }
  }

  maybeSpawnPowerup(lane, y, z) {
    if (Math.random() < 0.28) {
      const types = ['magnet', 'jetpack', 'sneakers', 'multiplier'];
      const type = types[Math.floor(Math.random() * types.length)];
      this.powerups.push({
        type: type,
        x: lane * CONSTANTS.TRACK.LANE_WIDTH,
        y: y + 20,
        z: z,
        rotation: 0,
        bob: 0,
        collected: false
      });
    }
  }
}

