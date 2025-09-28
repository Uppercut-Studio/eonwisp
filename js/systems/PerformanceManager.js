// Performance management and monitoring system
export class PerformanceManager {
    constructor() {
        this.metrics = {
            fps: 60,
            frameTime: 16.67,
            drawCalls: 0,
            activeObjects: 0,
            memoryUsage: 0,
            updateTime: 0,
            renderTime: 0
        };
        
        this.history = {
            fps: [],
            frameTime: [],
            drawCalls: []
        };
        
        this.maxHistoryLength = 60; // 1 second at 60fps
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.updateCallbacks = [];
        
        // Performance settings that can be adjusted dynamically
        this.settings = {
            maxParticles: 200,
            maxTrailPoints: 100,
            cullDistance: 1500,
            batchSize: 100,
            targetFPS: 60,
            adaptiveQuality: true,
            particleQuality: 1.0, // 0.1 to 1.0
            effectsQuality: 1.0    // 0.1 to 1.0
        };
        
        this.isLowPerformance = false;
        this.adaptiveTimer = 0;
        this.adaptiveCheckInterval = 180; // Check every 3 seconds
    }

    update(deltaTime) {
        const currentTime = performance.now();
        const frameTime = currentTime - this.lastFrameTime;
        
        this.metrics.frameTime = frameTime;
        this.metrics.fps = 1000 / frameTime;
        
        // Update history
        this.history.fps.push(this.metrics.fps);
        this.history.frameTime.push(frameTime);
        this.history.drawCalls.push(this.metrics.drawCalls);
        
        // Trim history
        if (this.history.fps.length > this.maxHistoryLength) {
            this.history.fps.shift();
            this.history.frameTime.shift();
            this.history.drawCalls.shift();
        }
        
        // Adaptive quality management
        if (this.settings.adaptiveQuality) {
            this.updateAdaptiveQuality(deltaTime);
        }
        
        // Notify callbacks
        this.updateCallbacks.forEach(callback => callback(this.metrics));
        
        this.lastFrameTime = currentTime;
        this.frameCount++;
        
        // Reset per-frame counters
        this.metrics.drawCalls = 0;
    }

    updateAdaptiveQuality(deltaTime) {
        this.adaptiveTimer += deltaTime;
        
        if (this.adaptiveTimer >= this.adaptiveCheckInterval) {
            const avgFPS = this.getAverageFPS();
            const targetFPS = this.settings.targetFPS;
            
            if (avgFPS < targetFPS * 0.8 && !this.isLowPerformance) {
                // Performance is poor, reduce quality
                this.isLowPerformance = true;
                this.settings.particleQuality *= 0.7;
                this.settings.effectsQuality *= 0.8;
                this.settings.maxParticles = Math.floor(this.settings.maxParticles * 0.6);
                this.settings.maxTrailPoints = Math.floor(this.settings.maxTrailPoints * 0.7);
                console.log('🎮 Performance: Reducing quality for better FPS');
            } else if (avgFPS > targetFPS * 0.95 && this.isLowPerformance) {
                // Performance is good, can increase quality
                this.isLowPerformance = false;
                this.settings.particleQuality = Math.min(1.0, this.settings.particleQuality * 1.2);
                this.settings.effectsQuality = Math.min(1.0, this.settings.effectsQuality * 1.1);
                console.log('🎮 Performance: Restoring quality');
            }
            
            this.adaptiveTimer = 0;
        }
    }

    recordDrawCall() {
        this.metrics.drawCalls++;
    }

    recordActiveObjects(count) {
        this.metrics.activeObjects = count;
    }

    getAverageFPS(samples = 30) {
        const recentFPS = this.history.fps.slice(-Math.min(samples, this.history.fps.length));
        return recentFPS.reduce((sum, fps) => sum + fps, 0) / recentFPS.length;
    }

    getPerformanceGrade() {
        const avgFPS = this.getAverageFPS();
        const targetFPS = this.settings.targetFPS;
        
        if (avgFPS >= targetFPS * 0.9) return 'A'; // Excellent
        if (avgFPS >= targetFPS * 0.7) return 'B'; // Good
        if (avgFPS >= targetFPS * 0.5) return 'C'; // Fair
        return 'D'; // Poor
    }

    onUpdate(callback) {
        this.updateCallbacks.push(callback);
    }

    // Get optimized settings based on current performance
    getOptimizedSettings() {
        return {
            ...this.settings,
            shouldUseSimplifiedEffects: this.isLowPerformance,
            shouldSkipNonEssentialUpdates: this.getAverageFPS() < this.settings.targetFPS * 0.6,
            particleMultiplier: this.settings.particleQuality,
            effectsMultiplier: this.settings.effectsQuality
        };
    }

    // Manual quality adjustment
    setQualityLevel(level) {
        // level: 0 (lowest) to 1 (highest)
        const clampedLevel = Math.max(0, Math.min(1, level));
        
        this.settings.particleQuality = clampedLevel;
        this.settings.effectsQuality = clampedLevel;
        this.settings.maxParticles = Math.floor(200 * clampedLevel + 50);
        this.settings.maxTrailPoints = Math.floor(100 * clampedLevel + 30);
        
        console.log(`🎮 Performance: Quality set to ${Math.round(clampedLevel * 100)}%`);
    }

    // Debug display
    getDebugInfo() {
        return {
            'FPS': Math.round(this.metrics.fps * 10) / 10,
            'Frame Time': `${Math.round(this.metrics.frameTime * 100) / 100}ms`,
            'Draw Calls': this.metrics.drawCalls,
            'Active Objects': this.metrics.activeObjects,
            'Grade': this.getPerformanceGrade(),
            'Particle Quality': `${Math.round(this.settings.particleQuality * 100)}%`,
            'Effects Quality': `${Math.round(this.settings.effectsQuality * 100)}%`
        };
    }
}
