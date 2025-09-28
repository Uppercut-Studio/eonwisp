// Central game state management
import { GameConfig } from '../config/GameConfig.js';

export class GameState {
    constructor() {
        this.reset();
        this.config = { ...GameConfig }; // Deep copy of config that can be modified at runtime
        this.callbacks = new Map(); // Event callbacks
    }

    reset() {
        // Core game stats
        this.score = 0;
        this.kills = 0;
        this.currentCombo = 0;
        this.maxComboInGame = 0;
        this.backshots = 0;
        this.criticalHits = 0;

        // Game state flags
        this.isPaused = false;
        this.isGameOver = false;
        this.isMobile = false;
        this.experienceStarted = false;

        // Player state
        this.playerState = 'at_core'; // 'at_core', 'launched'
        this.isReturning = false;

        // Core state
        this.currentCoreRadius = this.config.core.baseRadius;
        this.isDangerState = false;
        this.nextHitKills = false;
        this.coreHitTimer = 0;
        this.coreHealingTimer = 0;

        // Effects and timers
        this.vibrationTimer = 0;
        this.slowMoTimer = 0;
        this.slowMoTarget = null;

        // Level progression
        this.coreRunCount = 0;
        this.coreChoiceTimer = 0;
        this.isCoreChoiceActive = false;

        // Difficulty scaling
        this.enemySpawnIntensity = this.config.spawning.enemySpawnIntensity;
        this.enemySpawnAccumulator = 0;
        this.enemySpeedMultiplier = this.config.spawning.enemySpeedMultiplier;

        // Critical mass system
        this.criticalMassTimer = 0;
        this.isInCriticalMass = false;

        // Active effects
        this.activeEffects = {
            doubleSize: 0,
            sizeMultiplier: 1,
            scalePowerups: [],
            mirror: {
                tier: 1,
                tempUpgrades: []
            },
            healing: []
        };

        // Permanent upgrades
        this.permanentEffects = {
            sizeBonus: 0,
            healingRate: 0,
            mirrorTier: 0
        };

        // Collections and history
        this.collectedUpgradeHistory = new Set();

        // Danger wave system
        this.dangerWaveState = 'cooldown';
        this.dangerWaveTimer = this.config.timers.dangerWaveCooldown;
        this.dangerWaveWarningTimer = 0;
        this.dangerWaveActiveTimer = 0;
        this.dangerWaveQueue = [];

        // Audio
        this.comboNoteIndex = 0;

        // Position tracking
        this.center = { x: 0, y: 0 }; // Will be set by scene manager
        this.previousPlayerPosition = { x: 0, y: 0 };
    }

    // Event system
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.callbacks.has(event)) return;
        const callbacks = this.callbacks.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    emit(event, ...args) {
        if (!this.callbacks.has(event)) return;
        const callbacks = this.callbacks.get(event);
        callbacks.forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in event callback for ${event}:`, error);
            }
        });
    }

    // Score management
    addScore(points) {
        const oldScore = this.score;
        this.score += points;
        this.emit('scoreChanged', this.score, oldScore);
    }

    addKill() {
        this.kills++;
        this.emit('killAdded', this.kills);
    }

    updateCombo(newCombo) {
        const oldCombo = this.currentCombo;
        this.currentCombo = newCombo;
        this.maxComboInGame = Math.max(this.maxComboInGame, newCombo);
        this.emit('comboChanged', this.currentCombo, oldCombo);
    }

    // Core management
    updateCoreRadius(newRadius) {
        const oldRadius = this.currentCoreRadius;
        this.currentCoreRadius = Math.max(this.config.core.baseRadius, newRadius);
        
        // Update danger state
        const wasInDanger = this.isDangerState;
        this.isDangerState = this.currentCoreRadius > this.config.physics.maxLength;
        
        if (this.isDangerState && !wasInDanger) {
            this.nextHitKills = true;
            this.emit('dangerStateEntered');
        } else if (!this.isDangerState && wasInDanger) {
            this.emit('dangerStateExited');
        }

        this.emit('coreRadiusChanged', this.currentCoreRadius, oldRadius);
    }

    // Player state management
    setPlayerState(newState) {
        const oldState = this.playerState;
        if (oldState !== newState) {
            this.playerState = newState;
            this.emit('playerStateChanged', newState, oldState);
        }
    }

    // Game flow control
    startGame(isMobileDetected = false) {
        this.isMobile = isMobileDetected;
        this.experienceStarted = true;
        this.isPaused = false;
        this.isGameOver = false;
        this.emit('gameStarted', { isMobile: this.isMobile });
    }

    pauseGame() {
        if (!this.isPaused && !this.isGameOver) {
            this.isPaused = true;
            this.emit('gamePaused');
        }
    }

    resumeGame() {
        if (this.isPaused) {
            this.isPaused = false;
            this.emit('gameResumed');
        }
    }

    endGame() {
        if (!this.isGameOver) {
            this.isGameOver = true;
            this.isPaused = true;
            this.emit('gameEnded', {
                score: this.score,
                kills: this.kills,
                maxCombo: this.maxComboInGame,
                backshots: this.backshots,
                criticalHits: this.criticalHits
            });
        }
    }

    // Effect management
    refreshSizeMultiplier() {
        this.activeEffects.sizeMultiplier = 1 + this.permanentEffects.sizeBonus;
        this.activeEffects.scalePowerups.forEach(powerup => {
            this.activeEffects.sizeMultiplier += powerup.sizeIncrease;
        });
        this.emit('sizeMultiplierChanged', this.activeEffects.sizeMultiplier);
    }

    addScalePowerup(sizeIncrease, duration, easeOutDuration) {
        const powerup = {
            sizeIncrease,
            duration,
            easeOutDuration,
            originalSizeIncrease: sizeIncrease,
            isEasing: false,
            easeTimer: easeOutDuration
        };
        this.activeEffects.scalePowerups.push(powerup);
        this.refreshSizeMultiplier();
        this.emit('scalePowerupAdded', powerup);
    }

    // Configuration updates (for dynamic tuning)
    updateConfig(path, value) {
        const keys = path.split('.');
        let current = this.config;
        
        // Navigate to the parent of the target property
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        const oldValue = current[keys[keys.length - 1]];
        current[keys[keys.length - 1]] = value;
        
        this.emit('configChanged', path, value, oldValue);
    }

    // Getters for commonly accessed values
    get maxLength() {
        return this.config.physics.maxLength;
    }

    get coreBaseRadius() {
        return this.config.core.baseRadius;
    }

    get isWarningState() {
        return this.currentCoreRadius > this.maxLength * 0.9;
    }

    get criticalThreshold() {
        return this.maxLength * 1.5;
    }

    // Utility methods
    serialize() {
        // Create a serializable representation of the game state
        return {
            score: this.score,
            kills: this.kills,
            currentCombo: this.currentCombo,
            maxComboInGame: this.maxComboInGame,
            backshots: this.backshots,
            criticalHits: this.criticalHits,
            coreRunCount: this.coreRunCount,
            permanentEffects: { ...this.permanentEffects },
            collectedUpgradeHistory: Array.from(this.collectedUpgradeHistory),
            config: this.config
        };
    }

    deserialize(data) {
        // Restore state from serialized data
        Object.keys(data).forEach(key => {
            if (key === 'collectedUpgradeHistory') {
                this.collectedUpgradeHistory = new Set(data[key]);
            } else if (key === 'permanentEffects') {
                this.permanentEffects = { ...data[key] };
            } else if (key === 'config') {
                this.config = { ...data[key] };
            } else if (key in this) {
                this[key] = data[key];
            }
        });
    }
}

// Global game state instance
export const gameState = new GameState();

// Make it available globally for backward compatibility
window.gameState = gameState;
