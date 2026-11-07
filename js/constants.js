/**
 * Subway Surfers 2D - Game Constants & Configurations
 */

const CONSTANTS = {
  // Perspective & Camera
  CAMERA: {
    FOV: 60,
    FOCAL_LENGTH: 340,
    HEIGHT: 180,
    DISTANCE: 260,
    HORIZON_Y_RATIO: 0.36,
    MAX_Z: 3200,
  },

  // Lanes & Track
  TRACK: {
    LANE_WIDTH: 150,
    LANES: [-1, 0, 1], // Left, Center, Right
    RAIL_WIDTH: 60,
    TIE_INTERVAL: 40,
    BALLAST_WIDTH: 520,
    SEGMENT_LENGTH: 400,
  },

  // Player Physics & Properties
  PLAYER: {
    BASE_SPEED: 480, // units per second
    MAX_SPEED: 950,
    SPEED_ACCEL: 3.5, // units/sec^2
    LANE_CHANGE_SPEED: 14, // lerp speed
    JUMP_VELOCITY: 520,
    SUPER_JUMP_VELOCITY: 800,
    GRAVITY: 1500,
    FAST_DROP_GRAVITY: 4200,
    SLIDE_DURATION: 0.75, // seconds
    WIDTH: 50,
    HEIGHT: 85,
    SLIDE_HEIGHT: 38,
  },

  // Obstacle Dimensions
  OBSTACLES: {
    TRAIN: {
      WIDTH: 125,
      HEIGHT: 120,
      MIN_LENGTH: 420,
      MAX_LENGTH: 750,
      ROOF_MARGIN: 18,
      RAMP_LENGTH: 180,
      MOVING_SPEED: 260, // extra speed toward player
    },
    LOW_BARRIER: {
      WIDTH: 120,
      HEIGHT: 48,
      CAN_JUMP: true,
      CAN_SLIDE: false,
    },
    HIGH_BARRIER: {
      WIDTH: 120,
      HEIGHT: 110,
      CLEARANCE: 42, // height from ground to bottom of bar
      CAN_JUMP: false,
      CAN_SLIDE: true,
    },
    GANTRY: {
      INTERVAL: 800,
      HEIGHT: 170,
    }
  },

  // Power-Ups
  POWERUPS: {
    MAGNET: {
      ID: 'magnet',
      NAME: 'Coin Magnet',
      BASE_DURATION: 10,
      DURATION_PER_LEVEL: 3,
      RANGE: 360,
      COLOR: '#ff3366',
    },
    JETPACK: {
      ID: 'jetpack',
      NAME: 'Super Jetpack',
      BASE_DURATION: 8,
      DURATION_PER_LEVEL: 2.5,
      FLIGHT_HEIGHT: 260,
      COLOR: '#00d2ff',
    },
    SNEAKERS: {
      ID: 'sneakers',
      NAME: 'Super Sneakers',
      BASE_DURATION: 12,
      DURATION_PER_LEVEL: 3,
      COLOR: '#39ff14',
    },
    MULTIPLIER: {
      ID: 'multiplier',
      NAME: '2x Multiplier',
      BASE_DURATION: 15,
      DURATION_PER_LEVEL: 4,
      COLOR: '#ffbb00',
    },
    HOVERBOARD: {
      ID: 'hoverboard',
      NAME: 'Hoverboard',
      DURATION: 30, // seconds or until crash
      COLOR: '#ff00aa',
    }
  },

  // Characters
  CHARACTERS: [
    {
      id: 'jake',
      name: 'Jake',
      title: 'The Subway Kid',
      price: 0,
      unlocked: true,
      colors: {
        cap: '#e62429',
        hair: '#4a2f1b',
        skin: '#fcd0a1',
        jacket: '#1a5fb4',
        shirt: '#ffffff',
        pants: '#241f31',
        shoes: '#e62429'
      },
      quote: "Let's surf these rails!"
    },
    {
      id: 'tricky',
      name: 'Tricky',
      title: 'Brainy Skater',
      price: 500,
      unlocked: false,
      colors: {
        cap: '#9a9996',
        hair: '#f6d32d',
        skin: '#fcd0a1',
        jacket: '#e01b24',
        shirt: '#26a269',
        pants: '#1c71d8',
        shoes: '#33d17a'
      },
      quote: "Catch me if you can!"
    },
    {
      id: 'fresh',
      name: 'Fresh',
      title: 'Beats Master',
      price: 1500,
      unlocked: false,
      colors: {
        cap: '#33d17a',
        hair: '#1b1b1b',
        skin: '#8a5b3a',
        jacket: '#f6d32d',
        shirt: '#9141ac',
        pants: '#3d3846',
        shoes: '#f6d32d'
      },
      quote: "Feel the subway rhythm!"
    },
    {
      id: 'ninja',
      name: 'Ninja Spike',
      title: 'Shadow Runner',
      price: 3000,
      unlocked: false,
      colors: {
        cap: '#1b1b1b',
        hair: '#1b1b1b',
        skin: '#fcd0a1',
        jacket: '#1b1b1b',
        shirt: '#e01b24',
        pants: '#1b1b1b',
        shoes: '#e01b24',
        headband: '#e01b24'
      },
      quote: "Swift like the wind."
    }
  ],

  // Hoverboards
  BOARDS: [
    {
      id: 'classic',
      name: 'Classic Cruiser',
      price: 0,
      unlocked: true,
      primaryColor: '#e01b24',
      secondaryColor: '#f6d32d',
      trailColor: '#ff7700',
      description: 'The reliable street original'
    },
    {
      id: 'miami',
      name: 'Miami Vice',
      price: 400,
      unlocked: false,
      primaryColor: '#00d2ff',
      secondaryColor: '#ff00aa',
      trailColor: '#00ffff',
      description: 'Sunset neon glow styling'
    },
    {
      id: 'cyber',
      name: 'Cyber Wave',
      price: 1000,
      unlocked: false,
      primaryColor: '#9141ac',
      secondaryColor: '#39ff14',
      trailColor: '#39ff14',
      description: 'High-tech magnetic suspension'
    },
    {
      id: 'gold',
      name: 'Golden Chariot',
      price: 2500,
      unlocked: false,
      primaryColor: '#f6d32d',
      secondaryColor: '#ffffff',
      trailColor: '#ffd700',
      description: 'Pure 24k gold prestige glide'
    }
  ],

  // Mission Objectives
  MISSIONS: [
    { id: 'coins_50', text: 'Collect 50 coins in one run', target: 50, type: 'coins_single', reward: 150 },
    { id: 'score_2000', text: 'Score 2,000 points', target: 2000, type: 'score_single', reward: 200 },
    { id: 'jump_15', text: 'Jump 15 times', target: 15, type: 'jumps', reward: 100 },
    { id: 'roll_10', text: 'Roll under 10 barriers', target: 10, type: 'rolls', reward: 150 },
    { id: 'board_1', text: 'Use a Hoverboard', target: 1, type: 'use_board', reward: 150 },
    { id: 'powerup_3', text: 'Pick up 3 power-ups', target: 3, type: 'powerups', reward: 250 },
    { id: 'coins_500_total', text: 'Collect 500 total coins', target: 500, type: 'coins_total', reward: 400 },
    { id: 'score_10000', text: 'Score 10,000 points', target: 10000, type: 'score_single', reward: 500 },
    { id: 'train_roof_5', text: 'Run on 5 train roofs', target: 5, type: 'train_roofs', reward: 300 }
  ]
};

