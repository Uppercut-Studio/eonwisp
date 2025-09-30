// Enemy Behavior System - Uses data from EnemyTypes.js
import { EnemyTypes } from '../config/EnemyTypes.js';

export class EnemyBehaviors {
    constructor(gameState) {
        this.gameState = gameState;
    }

    // Create enemy graphics based on type
    createEnemyGraphics(enemyType) {
        const config = EnemyTypes[enemyType];
        if (!config) return null;

        const behaviors = {
            crimsonSeeker: this.createCrimsonSeekerGfx.bind(this),
            amberTitan: this.createAmberTitanGfx.bind(this),
            astralOrbiter: this.createAstralOrbiterGfx.bind(this),
            emeraldBow: this.createEmeraldBowGfx.bind(this)
        };

        const createFn = behaviors[enemyType];
        return createFn ? createFn(config) : null;
    }

    createCrimsonSeekerGfx(config) {
        const gfx = new PIXI.Graphics();
        gfx.beginFill(config.color).drawCircle(0, 0, config.radius).endFill();
        gfx.filters = [new PIXI.filters.GlowFilter({ 
            distance: config.attributes.glowDistance, 
            outerStrength: config.attributes.glowStrength, 
            color: config.glowColor 
        })];
        return gfx;
    }

    createAmberTitanGfx(config) {
        const gfx = new PIXI.Graphics();
        gfx.beginFill(0xffa64d).drawCircle(0, 0, 32).endFill();
        gfx.lineStyle(3, 0xffd37a, 0.6).drawCircle(0, 0, 12);
        
        gfx.shield = new PIXI.Graphics();
        gfx.shield.beginFill(0xd4941f, 4.0).drawRoundedRect(-10, -20, 8, 16, 2).endFill();
        gfx.shield.lineStyle(2, 0x8b6914, 4.0).drawRoundedRect(-10, -20, 8, 16, 2);
        gfx.addChild(gfx.shield);
        
        gfx.shieldCracks = new PIXI.Graphics();
        gfx.shieldCracks.alpha = 0;
        gfx.shield.addChild(gfx.shieldCracks);
        
        gfx.filters = [new PIXI.filters.GlowFilter({ 
            distance: config.attributes.glowDistance, 
            outerStrength: config.attributes.glowStrength, 
            color: config.glowColor 
        })];
        return gfx;
    }

    createAstralOrbiterGfx(config) {
        const gfx = new PIXI.Graphics();
        gfx.beginFill(0xff7bd8, 0.85).drawCircle(0, 0, config.radius).endFill();
        gfx.lineStyle(2, 0xffffff, 0.9).drawCircle(0, 0, 8);
        gfx.moveTo(-4, 0).lineTo(4, 0);
        gfx.filters = [new PIXI.filters.GlowFilter({ 
            distance: config.attributes.glowDistance, 
            outerStrength: config.attributes.glowStrength, 
            color: config.glowColor 
        })];
        return gfx;
    }

    createEmeraldBowGfx(config) {
        const gfx = new PIXI.Graphics();
        gfx.lineStyle(4, 0x7dff88, 1.0);
        gfx.arc(0, 0, 12, -Math.PI * 0.6, Math.PI * 0.6);
        gfx.moveTo(-8, -8).lineTo(-8, 8);
        
        gfx.ammoIndicators = [];
        const maxAmmo = config.attributes.maxAmmo || 3;
        for (let i = 0; i < maxAmmo; i++) {
            const indicator = new PIXI.Graphics();
            indicator.beginFill(0xc8ffd5).drawCircle(0, 0, 2).endFill();
            indicator.x = -15 - (i * 5);
            indicator.y = 0;
            gfx.addChild(indicator);
            gfx.ammoIndicators.push(indicator);
        }
        
        gfx.filters = [new PIXI.filters.GlowFilter({ 
            distance: config.attributes.glowDistance, 
            outerStrength: config.attributes.glowStrength, 
            color: config.glowColor 
        })];
        return gfx;
    }

    // Initialize enemy on spawn
    initializeEnemy(enemy, enemyType) {
        const config = EnemyTypes[enemyType];
        if (!config) return;

        const initializers = {
            crimsonSeeker: this.initCrimsonSeeker.bind(this),
            amberTitan: this.initAmberTitan.bind(this),
            astralOrbiter: this.initAstralOrbiter.bind(this),
            emeraldBow: this.initEmeraldBow.bind(this)
        };

        const initFn = initializers[enemyType];
        if (initFn) initFn(enemy, config);
    }

    initCrimsonSeeker(enemy, config) {
        enemy.speed = config.attributes.speed;
    }

    initAmberTitan(enemy, config) {
        enemy.speed = config.attributes.speed;
        enemy.originalSpeed = config.attributes.speed;
        enemy.shieldHealth = 3;
        enemy.maxShieldHealth = 3;
        enemy.isStunned = false;
        enemy.stunTimer = 0;
        enemy.isShieldBroken = false;
    }

    initAstralOrbiter(enemy, config) {
        enemy.data = {
            angle: enemy.spawnAngle,
            radius: enemy.spawnRadius,
            inwardSpeed: config.attributes.inwardSpeed,
            angularSpeed: config.attributes.angularSpeed,
            shootTimer: config.attributes.shootTimer,
            projectileCooldown: config.attributes.projectileCooldown,
        };
    }

    initEmeraldBow(enemy, config) {
        const isDangerState = this.gameState.isDangerState;
        const currentCoreRadius = this.gameState.currentCoreRadius;
        const dynamicMaxLength = this.gameState.config.physics.maxLength;
        
        let targetDistance;
        if (isDangerState) {
            targetDistance = Math.max(currentCoreRadius + 60, dynamicMaxLength * 0.7);
        } else {
            targetDistance = Math.min(
                dynamicMaxLength * 0.85, 
                Math.max(currentCoreRadius + 50, dynamicMaxLength * 0.6)
            );
        }
        
        const targetAngle = enemy.spawnAngle;
        const targetX = this.gameState.core.x + Math.cos(targetAngle) * targetDistance;
        const targetY = this.gameState.core.y + Math.sin(targetAngle) * targetDistance;
        
        enemy.state = 'approaching';
        enemy.speed = 2.8;
        
        enemy.data = {
            targetPosition: { x: targetX, y: targetY },
            targetAngle: targetAngle + Math.PI,
            ammoRemaining: config.attributes.maxAmmo,
            shootTimer: config.attributes.shootInterval,
            brokenParts: 0,
            isLocked: false
        };
    }

    // Update enemy behavior
    updateEnemy(enemy, delta, enemyType) {
        const updaters = {
            crimsonSeeker: this.updateCrimsonSeeker.bind(this),
            amberTitan: this.updateAmberTitan.bind(this),
            astralOrbiter: this.updateAstralOrbiter.bind(this),
            emeraldBow: this.updateEmeraldBow.bind(this)
        };

        const updateFn = updaters[enemyType];
        if (updateFn) updateFn(enemy, delta);
    }

    updateCrimsonSeeker(enemy, delta) {
        const dx = this.gameState.core.x - enemy.gfx.x;
        const dy = this.gameState.core.y - enemy.gfx.y;
        const distance = Math.hypot(dx, dy) || 1;
        enemy.gfx.x += (dx / distance) * enemy.speed * delta;
        enemy.gfx.y += (dy / distance) * enemy.speed * delta;
    }

    updateAmberTitan(enemy, delta) {
        if (enemy.isStunned && enemy.stunTimer > 0) {
            enemy.stunTimer -= delta;
            if (enemy.stunTimer <= 0) {
                enemy.isStunned = false;
                enemy.speed = enemy.originalSpeed;
                enemy.gfx.tint = 0xffffff;
                
                if (enemy.gfx.shield && !enemy.isShieldBroken) {
                    enemy.gfx.shield.rotation = 0;
                    enemy.gfx.shield.alpha = 1.0;
                }
            }
        }
        
        if (!enemy.isStunned) {
            const dx = this.gameState.core.x - enemy.gfx.x;
            const dy = this.gameState.core.y - enemy.gfx.y;
            const distance = Math.hypot(dx, dy) || 1;
            enemy.gfx.x += (dx / distance) * enemy.speed * delta;
            enemy.gfx.y += (dy / distance) * enemy.speed * delta;
            
            if (enemy.gfx.shield && !enemy.isShieldBroken) {
                const shieldAngle = Math.atan2(dy, dx) - Math.PI / 2;
                enemy.gfx.shield.rotation = shieldAngle;
            }
        }
    }

    updateAstralOrbiter(enemy, delta) {
        const data = enemy.data;
        if (!data) return;
        
        data.radius = Math.max(this.gameState.currentCoreRadius + 40, data.radius - data.inwardSpeed * delta);
        data.angle += data.angularSpeed * delta;
        enemy.gfx.x = this.gameState.core.x + Math.cos(data.angle) * data.radius;
        enemy.gfx.y = this.gameState.core.y + Math.sin(data.angle) * data.radius;
        enemy.gfx.rotation = data.angle;
        
        data.shootTimer -= delta;
        if (data.shootTimer <= 0) {
            this.gameState.enemySystem.createPinkArcProjectiles(enemy);
            data.shootTimer = data.projectileCooldown;
        }
    }

    updateEmeraldBow(enemy, delta) {
        const data = enemy.data;
        if (!data) return;
        
        if (enemy.state === 'approaching') {
            const dx = data.targetPosition.x - enemy.gfx.x;
            const dy = data.targetPosition.y - enemy.gfx.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist > 5) {
                enemy.gfx.x += (dx / dist) * enemy.speed * delta;
                enemy.gfx.y += (dy / dist) * enemy.speed * delta;
                enemy.gfx.rotation = Math.atan2(dy, dx);
            } else {
                enemy.state = 'locked';
                enemy.gfx.x = data.targetPosition.x;
                enemy.gfx.y = data.targetPosition.y;
                enemy.gfx.rotation = data.targetAngle;
                data.isLocked = true;
                data.lockPosition = { x: enemy.gfx.x, y: enemy.gfx.y };
            }
        } else if (enemy.state === 'locked' && data.isLocked) {
            enemy.gfx.x = data.lockPosition.x;
            enemy.gfx.y = data.lockPosition.y;
            enemy.gfx.rotation = data.targetAngle;
            
            if (data.ammoRemaining > 0) {
                data.shootTimer -= delta;
                if (data.shootTimer <= 0) {
                    const dx = this.gameState.core.x - enemy.gfx.x;
                    const dy = this.gameState.core.y - enemy.gfx.y;
                    const angle = Math.atan2(dy, dx);
                    
                    data.lastShotDirection = { x: Math.cos(angle), y: Math.sin(angle) };
                    this.gameState.enemySystem.createArrowProjectile(enemy, angle);
                    
                    data.ammoRemaining--;
                    data.shootTimer = EnemyTypes.emeraldBow.attributes.shootInterval;
                    
                    if (enemy.gfx.ammoIndicators && enemy.gfx.ammoIndicators[data.ammoRemaining]) {
                        enemy.gfx.ammoIndicators[data.ammoRemaining].alpha = 0.3;
                    }
                }
            }
        }
    }

    // Handle enemy hit events
    onEnemyHit(enemy, enemyType, hitInfo, createSplash) {
        const handlers = {
            amberTitan: this.onAmberTitanHit.bind(this),
            emeraldBow: this.onEmeraldBowHit.bind(this)
        };

        const handler = handlers[enemyType];
        return handler ? handler(enemy, hitInfo, createSplash) : { preventDamage: false };
    }

    onAmberTitanHit(enemy, hitInfo, createSplash) {
        const player = this.gameState.player;
        const core = this.gameState.core;
        
        const dx = player.x - enemy.gfx.x;
        const dy = player.y - enemy.gfx.y;
        const hitAngle = Math.atan2(dy, dx);
        
        const toCoreX = core.x - enemy.gfx.x;
        const toCoreY = core.y - enemy.gfx.y;
        const facingAngle = Math.atan2(toCoreY, toCoreX);
        
        let angleDiff = Math.abs(hitAngle - facingAngle);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        
        const isSideAttack = angleDiff > Math.PI / 3;
        const isFrontalAttack = angleDiff <= Math.PI / 3;
        
        if (!enemy.isShieldBroken && isFrontalAttack) {
            enemy.shieldHealth--;
            
            const crackOverlay = enemy.gfx.shieldCracks;
            if (crackOverlay) {
                crackOverlay.lineStyle(1.5, 0x000000, 0.9);
                for (let i = 0; i < enemy.maxShieldHealth - enemy.shieldHealth; i++) {
                    const crackAngle = (Math.random() - 0.5) * Math.PI * 0.4;
                    const startX = (Math.random() - 0.5) * 6;
                    const startY = -18 + Math.random() * 12;
                    const endX = startX + Math.sin(crackAngle) * (4 + Math.random() * 4);
                    const endY = startY + Math.cos(crackAngle) * (6 + Math.random() * 4);
                    crackOverlay.moveTo(startX, startY).lineTo(endX, endY);
                }
                crackOverlay.alpha = 0.8;
            }
            
            enemy.gfx.shield.alpha = 0.6;
            setTimeout(() => { if (enemy.gfx.shield) enemy.gfx.shield.alpha = 1.0; }, 100);
            
            if (enemy.shieldHealth <= 0) {
                enemy.isShieldBroken = true;
                enemy.gfx.shield.visible = false;
                createSplash(enemy.gfx.x, enemy.gfx.y, 0xd4941f, 30);
                enemy.health = 1;
            }
            
            return { preventDamage: !enemy.isShieldBroken };
        } else if (isSideAttack) {
            if (!enemy.isStunned) {
                enemy.isStunned = true;
                enemy.stunTimer = 90;
                enemy.speed = 0;
                
                if (enemy.gfx.shield && !enemy.isShieldBroken) {
                    enemy.gfx.shield.rotation = Math.PI / 4;
                    enemy.gfx.shield.alpha = 0.7;
                }
                
                createSplash(enemy.gfx.x, enemy.gfx.y, 0xffff00, 20);
                enemy.gfx.tint = 0xffffaa;
            } else {
                enemy.health = 0;
                createSplash(enemy.gfx.x, enemy.gfx.y, 0xff0000, 50);
            }
        }
        
        return { preventDamage: false };
    }

    onEmeraldBowHit(enemy, hitInfo, createSplash) {
        enemy.data.brokenParts++;
        
        const brokenRatio = enemy.data.brokenParts / 4;
        enemy.gfx.alpha = Math.max(0.4, 1 - brokenRatio * 0.6);
        
        if (enemy.gfx.ammoIndicators && enemy.data.brokenParts <= enemy.gfx.ammoIndicators.length) {
            const indicator = enemy.gfx.ammoIndicators[enemy.data.brokenParts - 1];
            if (indicator) indicator.visible = false;
        }
        
        if (hitInfo && enemy.data.lastShotDirection) {
            this.gameState.enemySystem.createDeflectedArrow(enemy, enemy.data.lastShotDirection);
        }
        
        return { preventDamage: false };
    }

    // Handle enemy death
    onEnemyDeath(enemy, enemyType) {
        if (enemyType === 'astralOrbiter') {
            // Remove associated projectiles
            const enemyProjectiles = this.gameState.enemyProjectiles || [];
            for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
                const projectile = enemyProjectiles[i];
                if (projectile.ownerType !== 'pink') continue;
                
                const px = projectile.x !== undefined ? projectile.x : 
                    this.gameState.core.x + Math.cos(projectile.angle || 0) * projectile.radius;
                const py = projectile.y !== undefined ? projectile.y : 
                    this.gameState.core.y + Math.sin(projectile.angle || 0) * projectile.radius;
                
                if (Math.hypot(px - enemy.gfx.x, py - enemy.gfx.y) <= 140) {
                    enemyProjectiles.splice(i, 1);
                }
            }
        }
    }
}
