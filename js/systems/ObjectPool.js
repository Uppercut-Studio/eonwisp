// Object pooling system to reduce garbage collection and improve performance
export class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10, maxSize = 100) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.maxSize = maxSize;
        this.pool = [];
        this.active = new Set();
        
        // Pre-populate the pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    acquire() {
        let obj;
        
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else if (this.active.size < this.maxSize) {
            obj = this.createFn();
        } else {
            // Pool is at max capacity, return null or oldest object
            return null;
        }
        
        this.active.add(obj);
        return obj;
    }

    release(obj) {
        if (!this.active.has(obj)) {
            return false; // Object not managed by this pool
        }
        
        this.active.delete(obj);
        
        if (this.resetFn) {
            this.resetFn(obj);
        }
        
        if (this.pool.length < this.maxSize) {
            this.pool.push(obj);
        }
        
        return true;
    }

    releaseAll() {
        this.active.forEach(obj => {
            if (this.resetFn) {
                this.resetFn(obj);
            }
            if (this.pool.length < this.maxSize) {
                this.pool.push(obj);
            }
        });
        this.active.clear();
    }

    getActiveCount() {
        return this.active.size;
    }

    getPoolSize() {
        return this.pool.length;
    }

    getTotalSize() {
        return this.pool.length + this.active.size;
    }
}

// Specialized pool manager for game objects
export class GameObjectPoolManager {
    constructor(app) {
        this.app = app;
        this.pools = new Map();
        this.containers = new Map();
        
        // Initialize common pools
        this.initializePools();
    }

    initializePools() {
        // Particle pool
        this.createPool('particles', 
            () => ({ 
                x: 0, y: 0, vx: 0, vy: 0, 
                color: 0xffffff, alpha: 1, 
                lifetime: 0, size: 2, 
                active: false 
            }),
            (particle) => {
                particle.x = 0;
                particle.y = 0;
                particle.vx = 0;
                particle.vy = 0;
                particle.color = 0xffffff;
                particle.alpha = 1;
                particle.lifetime = 0;
                particle.size = 2;
                particle.active = false;
            },
            100, 300
        );

        // Trail points pool
        this.createPool('trailPoints',
            () => ({ 
                x: 0, y: 0, 
                lifetime: 0, tint: 0xffffff, 
                active: false 
            }),
            (point) => {
                point.x = 0;
                point.y = 0;
                point.lifetime = 0;
                point.tint = 0xffffff;
                point.active = false;
            },
            50, 150
        );

        // Enemy graphics pool (for simple enemies)
        this.createPool('enemyGraphics',
            () => {
                const gfx = new PIXI.Graphics();
                gfx.visible = false;
                return gfx;
            },
            (gfx) => {
                gfx.clear();
                gfx.visible = false;
                gfx.x = 0;
                gfx.y = 0;
                gfx.rotation = 0;
                gfx.scale.set(1, 1);
                gfx.tint = 0xffffff;
                gfx.alpha = 1;
                if (gfx.filters) {
                    gfx.filters = null;
                }
            },
            20, 50
        );

        // Projectile pool
        this.createPool('projectiles',
            () => ({
                type: '',
                ownerType: '',
                x: 0, y: 0,
                radius: 0, angle: 0,
                angularVelocity: 0,
                shrinkRate: 0,
                lifetime: 0,
                color: 0xffffff,
                size: 4,
                destructible: false,
                health: 1,
                active: false
            }),
            (projectile) => {
                projectile.type = '';
                projectile.ownerType = '';
                projectile.x = 0;
                projectile.y = 0;
                projectile.radius = 0;
                projectile.angle = 0;
                projectile.angularVelocity = 0;
                projectile.shrinkRate = 0;
                projectile.lifetime = 0;
                projectile.color = 0xffffff;
                projectile.size = 4;
                projectile.destructible = false;
                projectile.health = 1;
                projectile.active = false;
            },
            30, 100
        );

        // Power-up graphics pool
        this.createPool('powerUpGraphics',
            () => {
                const gfx = new PIXI.Graphics();
                gfx.visible = false;
                return gfx;
            },
            (gfx) => {
                gfx.clear();
                gfx.visible = false;
                gfx.x = 0;
                gfx.y = 0;
                gfx.rotation = 0;
                gfx.scale.set(1, 1);
                gfx.alpha = 1;
                if (gfx.filters) {
                    gfx.filters = null;
                }
            },
            10, 20
        );

        // Healing item graphics pool
        this.createPool('healingGraphics',
            () => {
                const gfx = new PIXI.Graphics();
                gfx.visible = false;
                return gfx;
            },
            (gfx) => {
                gfx.clear();
                gfx.visible = false;
                gfx.x = 0;
                gfx.y = 0;
                gfx.rotation = 0;
                gfx.scale.set(1, 1);
                gfx.alpha = 1;
                if (gfx.filters) {
                    gfx.filters = null;
                }
            },
            5, 15
        );
    }

    createPool(name, createFn, resetFn, initialSize = 10, maxSize = 100) {
        const pool = new ObjectPool(createFn, resetFn, initialSize, maxSize);
        this.pools.set(name, pool);
        return pool;
    }

    getPool(name) {
        return this.pools.get(name);
    }

    acquireFromPool(poolName) {
        const pool = this.pools.get(poolName);
        return pool ? pool.acquire() : null;
    }

    releaseToPool(poolName, obj) {
        const pool = this.pools.get(poolName);
        return pool ? pool.release(obj) : false;
    }

    // Batch operations for better performance
    acquireBatch(poolName, count) {
        const pool = this.pools.get(poolName);
        if (!pool) return [];
        
        const batch = [];
        for (let i = 0; i < count; i++) {
            const obj = pool.acquire();
            if (obj) {
                batch.push(obj);
            } else {
                break; // Pool exhausted
            }
        }
        return batch;
    }

    releaseBatch(poolName, objects) {
        const pool = this.pools.get(poolName);
        if (!pool) return false;
        
        objects.forEach(obj => pool.release(obj));
        return true;
    }

    // Container management for PIXI objects
    createContainer(name) {
        const container = new PIXI.Container();
        this.containers.set(name, container);
        return container;
    }

    getContainer(name) {
        return this.containers.get(name);
    }

    // Clean up all pools (call on game reset)
    releaseAllPools() {
        this.pools.forEach(pool => pool.releaseAll());
    }

    // Performance monitoring
    getPoolStats() {
        const stats = {};
        this.pools.forEach((pool, name) => {
            stats[name] = {
                active: pool.getActiveCount(),
                pooled: pool.getPoolSize(),
                total: pool.getTotalSize()
            };
        });
        return stats;
    }

    // Memory management - force cleanup of excess pooled objects
    cleanup() {
        this.pools.forEach(pool => {
            // Keep only half of the max size in pool to free memory
            while (pool.getPoolSize() > pool.maxSize / 2) {
                pool.pool.pop();
            }
        });
    }
}

// Specialized pools for specific game objects
export class ParticleSystem {
    constructor(poolManager, performanceManager) {
        this.poolManager = poolManager;
        this.performanceManager = performanceManager;
        this.particlePool = poolManager.getPool('particles');
        this.activeParticles = [];
        this.batchSize = 50; // Render particles in batches
    }

    createParticle(x, y, vx, vy, color, lifetime, size = 2) {
        const optimizedSettings = this.performanceManager.getOptimizedSettings();
        
        // Skip particle creation if quality is very low
        if (optimizedSettings.particleQuality < 0.3 && Math.random() > optimizedSettings.particleQuality) {
            return null;
        }

        const particle = this.particlePool.acquire();
        if (!particle) return null; // Pool exhausted

        particle.x = x;
        particle.y = y;
        particle.vx = vx * optimizedSettings.particleMultiplier;
        particle.vy = vy * optimizedSettings.particleMultiplier;
        particle.color = color;
        particle.alpha = 1;
        particle.lifetime = lifetime * optimizedSettings.particleMultiplier;
        particle.size = size * optimizedSettings.effectsMultiplier;
        particle.active = true;

        this.activeParticles.push(particle);
        return particle;
    }

    createSplash(x, y, color, amount) {
        const optimizedSettings = this.performanceManager.getOptimizedSettings();
        const adjustedAmount = Math.floor(amount * optimizedSettings.particleQuality);
        
        for (let i = 0; i < adjustedAmount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (2 + Math.random() * 4) * optimizedSettings.effectsMultiplier;
            this.createParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                20 + Math.random() * 20,
                1 + Math.random() * 2
            );
        }
    }

    update(delta) {
        const optimizedSettings = this.performanceManager.getOptimizedSettings();
        
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            
            if (!particle.active) {
                this.activeParticles.splice(i, 1);
                continue;
            }

            particle.x += particle.vx * delta;
            particle.y += particle.vy * delta;
            particle.vx *= 0.95;
            particle.vy *= 0.95;
            particle.lifetime -= delta;
            particle.alpha = Math.max(0, particle.lifetime / 40);

            if (particle.lifetime <= 0) {
                particle.active = false;
                this.particlePool.release(particle);
                this.activeParticles.splice(i, 1);
            }
        }

        // Limit active particles if performance is poor
        if (this.activeParticles.length > optimizedSettings.maxParticles) {
            const excess = this.activeParticles.length - optimizedSettings.maxParticles;
            for (let i = 0; i < excess; i++) {
                const particle = this.activeParticles.shift();
                particle.active = false;
                this.particlePool.release(particle);
            }
        }
    }

    render(graphics) {
        graphics.clear();
        
        // Batch render particles by color for better performance
        const colorBatches = new Map();
        
        this.activeParticles.forEach(particle => {
            if (!particle.active || particle.alpha <= 0) return;
            
            if (!colorBatches.has(particle.color)) {
                colorBatches.set(particle.color, []);
            }
            colorBatches.get(particle.color).push(particle);
        });

        // Render each color batch
        colorBatches.forEach((particles, color) => {
            graphics.beginFill(color);
            particles.forEach(particle => {
                graphics.drawCircle(particle.x, particle.y, particle.size);
            });
            graphics.endFill();
        });

        this.performanceManager.recordDrawCall();
    }

    clear() {
        this.activeParticles.forEach(particle => {
            particle.active = false;
            this.particlePool.release(particle);
        });
        this.activeParticles.length = 0;
    }
}
