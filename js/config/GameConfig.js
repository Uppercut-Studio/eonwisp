// Game configuration - all tunable parameters
export const GameConfig = {
    // Physics parameters
    physics: {
        stiffness: 0.0085,
        damping: 0.800,
        impulseMultiplier: 0.225,
        gravityPull: 1.42,
        orbitalImpulse: 0.135,
        retractionForce: 4.04,
        maxLength: 190,
        overshoot: 0.976,
        snapBackStrength: 0.575,
        coreBrake: 0.925
    },

    // Visual parameters
    visual: {
        minThickness: 4.6,
        maxThickness: 24.3,
        stretchScaleY: 0.544,
        squashScaleX: 1.346,
        rotationThreshold: 8.1,
        trailDuration: 24,
        trailSize: 7.1
    },

    // Combat parameters
    combat: {
        enemyHealth: 1,
        criticalSpeed: 4.3,
        hitVibration: 0.795,
        critVibrationMultiplier: 1
    },

    // Effects parameters
    effects: {
        slowMoStrength: 0.04,
        slowMoDuration: 40,
        cameraZoom: 1.02,
        splashAmount: 65
    },

    // Mobile controls
    mobile: {
        accelerometerMultiplier: 2.0,
        deadzone: 0.2,
        invertX: false,
        invertY: true,
        controlMode: 'joystick' // 'accelerometer' or 'joystick'
    },

    // Core game mechanics
    core: {
        baseRadius: 30,
        choiceInterval: 30 * 60, // 30 seconds at 60fps
        healingSpawnTimer: 900 + Math.random() * 600
    },

    // Colors
    colors: {
        coreBase: 0xaaaaff,
        dartNear: 0xff6bff,
        dartFar: 0x3f1ca4
    },

    // Audio scale frequencies
    audio: {
        amScaleFrequencies: [
            110, 123.47, 130.81, 146.83, 164.81, 174.61, 196, 220,
            246.94, 261.63, 293.66, 329.63, 349.23, 392, 440, 493.88,
            523.25, 587.33, 659.25, 698.46, 783.99, 880
        ]
    },

    // Timers and intervals
    timers: {
        enemySpawn: 60,
        dangerWaveCooldown: 900 + Math.random() * 600,
        dangerWaveWarning: 90,
        dangerWaveActive: 240,
        coreHit: 20,
        hitTimer: 10,
        vibration: 15,
        coreHealing: 90
    },

    // Power-up configurations
    powerUps: {
        doubleSize: {
            spawnInterval: () => (1 + Math.random() * 9) * 60,
            duration: 3 * 60,
            easeOutDuration: 0.4 * 60,
            sizeIncrease: 0.2
        },
        ropeSize: {
            spawnInterval: () => 15 * 60,
            multiplier: 1.10
        },
        mirror: {
            spawnInterval: () => 30 * 60 + Math.random() * 12 * 60,
            duration: 12 * 60
        }
    },

    // Upgrade costs and effects
    upgrades: {
        newCore: {
            size: {
                label: 'Mass Amplifier',
                color: 0xffe066,
                bonus: 0.25
            },
            healing: {
                label: 'Eternal Pulse',
                color: 0x7dfbff,
                rate: 1.2
            },
            mirror: {
                label: 'Echo Twin',
                color: 0x9cf9ff
            }
        }
    },

    // Spawn and difficulty scaling
    spawning: {
        enemySpawnIntensity: 1,
        enemySpeedMultiplier: 1,
        difficultyScaling: {
            intensity: 1.10,
            speed: 1.05
        }
    }
};

// Utility functions for configuration
export const ConfigUtils = {
    // Get a random spawn interval for power-ups
    getRandomSpawnInterval(min, max) {
        return (min + Math.random() * (max - min)) * 60;
    },

    // Calculate dynamic values based on current game state
    getDynamicValue(baseValue, multiplier = 1, additive = 0) {
        return (baseValue * multiplier) + additive;
    },

    // Validate and clamp values to reasonable ranges
    clampValue(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
};
