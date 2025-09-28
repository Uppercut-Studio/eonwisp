// Main performance optimization system that orchestrates all performance improvements
import { PerformanceManager } from './PerformanceManager.js';
import { GameObjectPoolManager, ParticleSystem } from './ObjectPool.js';
import { BatchRenderer } from './BatchRenderer.js';

export class PerformanceOptimizer {
    constructor(app) {
        this.app = app;
        
        // Initialize performance systems
        this.performanceManager = new PerformanceManager();
        this.poolManager = new GameObjectPoolManager(app);
        this.batchRenderer = new BatchRenderer(app, this.performanceManager);
        this.particleSystem = new ParticleSystem(this.poolManager, this.performanceManager);
        
        // Performance monitoring UI
        this.debugOverlay = null;
        this.showDebug = false;
        
        // Optimization state
        this.lastOptimizationUpdate = 0;
        this.optimizationInterval = 180; // Update every 3 seconds
        
        // Cache frequently used settings
        this.cachedSettings = {};
        this.settingsCache = {
            lastUpdate: 0,
            cacheInterval: 60 // Update cache every second
        };
        
        // Frame skip system for extremely poor performance
        this.frameSkipCounter = 0;
        this.frameSkipRate = 1; // 1 = render every frame, 2 = skip every other frame
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        console.log('🚀 Performance Optimizer initialized');
    }

    setupPerformanceMonitoring() {
        // Create debug overlay
        this.createDebugOverlay();
        
        // Performance monitoring callback
        this.performanceManager.onUpdate((metrics) => {
            this.updateDebugDisplay(metrics);
            this.handlePerformanceAdaptation(metrics);
        });
        
        // Keyboard shortcut to toggle debug overlay
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'p' && e.ctrlKey) {
                e.preventDefault();
                this.toggleDebugOverlay();
            }
        });
    }

    createDebugOverlay() {
        this.debugOverlay = document.createElement('div');
        this.debugOverlay.id = 'performance-debug';
        this.debugOverlay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            display: none;
            min-width: 200px;
            border: 1px solid #333;
        `;
        document.body.appendChild(this.debugOverlay);
    }

    updateDebugDisplay(metrics) {
        if (!this.showDebug || !this.debugOverlay) return;
        
        const debugInfo = this.performanceManager.getDebugInfo();
        const poolStats = this.poolManager.getPoolStats();
        
        let html = '<div style="color: #00ff00; font-weight: bold;">PERFORMANCE MONITOR</div>';
        html += '<hr style="border: 1px solid #333; margin: 5px 0;">';
        
        // Core metrics
        html += '<div style="color: #ffff00;">Core Metrics:</div>';
        Object.entries(debugInfo).forEach(([key, value]) => {
            const color = this.getMetricColor(key, value);
            html += `<div style="color: ${color};">${key}: ${value}</div>`;
        });
        
        html += '<hr style="border: 1px solid #333; margin: 5px 0;">';
        
        // Pool statistics
        html += '<div style="color: #ffff00;">Object Pools:</div>';
        Object.entries(poolStats).forEach(([poolName, stats]) => {
            const efficiency = stats.total > 0 ? (stats.pooled / stats.total * 100).toFixed(0) : 100;
            const color = efficiency > 50 ? '#00ff00' : efficiency > 25 ? '#ffaa00' : '#ff4444';
            html += `<div style="color: ${color};">${poolName}: ${stats.active}/${stats.total} (${efficiency}% pooled)</div>`;
        });
        
        html += '<hr style="border: 1px solid #333; margin: 5px 0;">';
        
        // Optimization status
        const settings = this.getCachedSettings();
        html += '<div style="color: #ffff00;">Optimizations:</div>';
        html += `<div style="color: ${settings.shouldUseSimplifiedEffects ? '#ff4444' : '#00ff00'};">Simplified Effects: ${settings.shouldUseSimplifiedEffects ? 'ON' : 'OFF'}</div>`;
        html += `<div style="color: #cccccc;">Frame Skip: ${this.frameSkipRate}x</div>`;
        html += `<div style="color: #cccccc;">Max Particles: ${settings.maxParticles}</div>`;
        html += `<div style="color: #cccccc;">Max Trails: ${settings.maxTrailPoints}</div>`;
        
        // Instructions
        html += '<hr style="border: 1px solid #333; margin: 5px 0;">';
        html += '<div style="color: #888; font-size: 10px;">Ctrl+P to toggle</div>';
        
        this.debugOverlay.innerHTML = html;
    }

    getMetricColor(key, value) {
        if (key === 'FPS') {
            const fps = parseFloat(value);
            if (fps >= 55) return '#00ff00';
            if (fps >= 40) return '#ffaa00';
            if (fps >= 25) return '#ff8800';
            return '#ff4444';
        } else if (key === 'Grade') {
            const grade = value.toString();
            if (grade === 'A') return '#00ff00';
            if (grade === 'B') return '#88ff00';
            if (grade === 'C') return '#ffaa00';
            return '#ff4444';
        } else if (key.includes('Quality')) {
            const quality = parseInt(value);
            if (quality >= 80) return '#00ff00';
            if (quality >= 60) return '#ffaa00';
            return '#ff8800';
        }
        return '#cccccc';
    }

    toggleDebugOverlay() {
        this.showDebug = !this.showDebug;
        this.debugOverlay.style.display = this.showDebug ? 'block' : 'none';
        console.log(`🎮 Performance debug overlay: ${this.showDebug ? 'ON' : 'OFF'}`);
    }

    handlePerformanceAdaptation(metrics) {
        const currentTime = performance.now();
        
        // Update optimization settings periodically
        if (currentTime - this.lastOptimizationUpdate > this.optimizationInterval) {
            this.updateOptimizationSettings(metrics);
            this.lastOptimizationUpdate = currentTime;
        }
        
        // Update frame skip rate for extremely poor performance
        this.updateFrameSkip(metrics.fps);
    }

    updateOptimizationSettings(metrics) {
        const grade = this.performanceManager.getPerformanceGrade();
        
        // Update batch renderer settings
        this.batchRenderer.updateSettings(grade);
        
        // Update culling bounds based on screen size
        this.batchRenderer.updateCullingBounds();
        
        // Adjust pool sizes based on performance
        this.adjustPoolSizes(grade);
        
        // Clear pool excess if memory usage is high
        if (grade === 'D') {
            this.poolManager.cleanup();
        }
        
        console.log(`🎮 Performance: Optimizations updated for grade ${grade}`);
    }

    adjustPoolSizes(grade) {
        const settings = this.performanceManager.settings;
        
        // Adjust based on performance grade
        switch (grade) {
            case 'D': // Poor - reduce everything
                settings.maxParticles = 50;
                settings.maxTrailPoints = 30;
                break;
            case 'C': // Fair - moderate reduction
                settings.maxParticles = 100;
                settings.maxTrailPoints = 60;
                break;
            case 'B': // Good - normal settings
                settings.maxParticles = 150;
                settings.maxTrailPoints = 80;
                break;
            case 'A': // Excellent - high quality
                settings.maxParticles = 200;
                settings.maxTrailPoints = 100;
                break;
        }
    }

    updateFrameSkip(fps) {
        if (fps < 15) {
            this.frameSkipRate = 3; // Skip 2/3 of frames
        } else if (fps < 25) {
            this.frameSkipRate = 2; // Skip every other frame
        } else {
            this.frameSkipRate = 1; // Render every frame
        }
    }

    shouldSkipFrame() {
        this.frameSkipCounter++;
        if (this.frameSkipCounter >= this.frameSkipRate) {
            this.frameSkipCounter = 0;
            return false; // Don't skip this frame
        }
        return true; // Skip this frame
    }

    getCachedSettings() {
        const currentTime = performance.now();
        
        if (currentTime - this.settingsCache.lastUpdate > this.settingsCache.cacheInterval) {
            this.cachedSettings = this.performanceManager.getOptimizedSettings();
            this.settingsCache.lastUpdate = currentTime;
        }
        
        return this.cachedSettings;
    }

    // Main update method to be called each frame
    update(deltaTime) {
        this.performanceManager.update(deltaTime);
        
        // Skip expensive updates if performance is poor
        const settings = this.getCachedSettings();
        if (settings.shouldSkipNonEssentialUpdates && this.shouldSkipFrame()) {
            return;
        }
        
        // Update particle system
        this.particleSystem.update(deltaTime);
    }

    // Optimized rendering methods
    renderOptimized(gameObjects) {
        const settings = this.getCachedSettings();
        
        // Skip rendering if frame should be skipped
        if (this.shouldSkipFrame()) {
            return;
        }
        
        // Record active objects for monitoring
        const totalObjects = (gameObjects.enemies?.length || 0) + 
                           (gameObjects.particles?.length || 0) + 
                           (gameObjects.projectiles?.length || 0);
        this.performanceManager.recordActiveObjects(totalObjects);
        
        // Use batch renderer for optimized rendering
        if (gameObjects.enemies && gameObjects.core) {
            this.batchRenderer.renderEnemies(gameObjects.enemies, gameObjects.core.x, gameObjects.core.y);
        }
        
        if (gameObjects.trailPoints) {
            this.batchRenderer.renderTrail(gameObjects.trailPoints, gameObjects.trailSize || 7);
        }
        
        if (gameObjects.projectiles && gameObjects.core) {
            this.batchRenderer.renderProjectiles(gameObjects.projectiles, gameObjects.core.x, gameObjects.core.y);
        }
        
        // Render particles using optimized particle system
        if (gameObjects.particleGraphics) {
            this.particleSystem.render(gameObjects.particleGraphics);
        }
    }

    // Particle creation with optimization
    createOptimizedSplash(x, y, color, amount) {
        return this.particleSystem.createSplash(x, y, color, amount);
    }

    createOptimizedParticle(x, y, vx, vy, color, lifetime, size = 2) {
        return this.particleSystem.createParticle(x, y, vx, vy, color, lifetime, size);
    }

    // Enemy management with pooling
    createOptimizedEnemy(type, x, y, config) {
        const enemyGfx = this.poolManager.acquireFromPool('enemyGraphics');
        if (!enemyGfx) {
            console.warn('🎮 Performance: Enemy graphics pool exhausted');
            return null;
        }
        
        // Configure enemy graphics based on type
        this.configureEnemyGraphics(enemyGfx, type, config);
        enemyGfx.x = x;
        enemyGfx.y = y;
        enemyGfx.visible = true;
        
        return {
            gfx: enemyGfx,
            type,
            pooled: true, // Mark as pooled for cleanup
            ...config
        };
    }

    configureEnemyGraphics(gfx, type, config) {
        gfx.clear();
        
        const settings = this.getCachedSettings();
        const useSimplified = settings.shouldUseSimplifiedEffects;
        
        switch (type) {
            case 'red':
                if (useSimplified) {
                    gfx.beginFill(0xff4a4a).drawRect(-10, -10, 20, 20).endFill();
                } else {
                    gfx.beginFill(0xff4a4a).drawCircle(0, 0, 10).endFill();
                    if (!settings.shouldSkipNonEssentialUpdates) {
                        gfx.filters = [new PIXI.filters.GlowFilter({ distance: 8, outerStrength: 0.8, color: 0xff4a4a })];
                    }
                }
                break;
            case 'orange':
                if (useSimplified) {
                    gfx.beginFill(0xffa64d).drawRect(-16, -16, 32, 32).endFill();
                } else {
                    gfx.beginFill(0xffa64d).drawCircle(0, 0, 16).endFill();
                    gfx.lineStyle(2, 0xffd37a, 0.6).drawCircle(0, 0, 12);
                    if (!settings.shouldSkipNonEssentialUpdates) {
                        gfx.filters = [new PIXI.filters.GlowFilter({ distance: 10, outerStrength: 1.0, color: 0xffa64d })];
                    }
                }
                break;
            // Add other enemy types as needed
        }
    }

    releaseOptimizedEnemy(enemy) {
        if (enemy.pooled && enemy.gfx) {
            enemy.gfx.visible = false;
            this.poolManager.releaseToPool('enemyGraphics', enemy.gfx);
        }
    }

    // Resource management
    cleanup() {
        this.particleSystem.clear();
        this.poolManager.releaseAllPools();
        this.batchRenderer.clearRenderQueues();
        console.log('🎮 Performance: Resources cleaned up');
    }

    // Manual performance controls for testing
    setQualityLevel(level) {
        this.performanceManager.setQualityLevel(level);
        console.log(`🎮 Performance: Quality manually set to ${Math.round(level * 100)}%`);
    }

    enableAdaptiveQuality() {
        this.performanceManager.settings.adaptiveQuality = true;
        console.log('🎮 Performance: Adaptive quality enabled');
    }

    disableAdaptiveQuality() {
        this.performanceManager.settings.adaptiveQuality = false;
        console.log('🎮 Performance: Adaptive quality disabled');
    }

    // Export performance data for analysis
    exportPerformanceData() {
        return {
            metrics: this.performanceManager.metrics,
            history: this.performanceManager.history,
            settings: this.performanceManager.settings,
            poolStats: this.poolManager.getPoolStats()
        };
    }

    // Clean up on game end
    destroy() {
        if (this.debugOverlay) {
            document.body.removeChild(this.debugOverlay);
        }
        
        this.batchRenderer.destroy();
        this.particleSystem.clear();
        this.poolManager.releaseAllPools();
        
        console.log('🎮 Performance Optimizer destroyed');
    }
}
