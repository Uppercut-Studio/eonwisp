n// Enhanced Enemy Configuration System with proper names and tweakable attributes
export const EnemyTypes = {
    // CRIMSON SEEKER - Basic red rushing enemy
    crimsonSeeker: {
        name: 'Crimson Seeker',
        color: 0xff4a4a,
        glowColor: 0xff4a4a,
        radius: 10,
        
        // Tweakable attributes
        attributes: {
            health: 1,
            speed: 2.4,
            coreDamagePercent: 0.10,
            glowDistance: 10,
            glowStrength: 1.0
        },
        
        getHealth: () => Math.max(1, (window.gameState?.config?.combat?.enemyHealth || 1) * EnemyTypes.crimsonSeeker.attributes.health),
        getCoreDamage: () => (window.gameState?.config?.physics?.maxLength || 190) * EnemyTypes.crimsonSeeker.attributes.coreDamagePercent,
        
        createGfx() {
            const gfx = new PIXI.Graphics();
            const attr = EnemyTypes.crimsonSeeker.attributes;
            gfx.beginFill(EnemyTypes.crimsonSeeker.color).drawCircle(0, 0, EnemyTypes.crimsonSeeker.radius).endFill();
            gfx.filters = [new PIXI.filters.GlowFilter({ 
                distance: attr.glowDistance, 
                outerStrength: attr.glowStrength, 
                color: EnemyTypes.crimsonSeeker.glowColor 
            })];
            return gfx;
        },
        
        onSpawn(enemy) {
            enemy.speed = EnemyTypes.crimsonSeeker.attributes.speed;
        },
        
        update(enemy, delta) {
            const dx = window.gameState.core.x - enemy.gfx.x;
            const dy = window.gameState.core.y - enemy.gfx.y;
            const distance = Math.hypot(dx, dy) || 1;
            enemy.gfx.x += (dx / distance) * enemy.speed * delta;
            enemy.gfx.y += (dy / distance) * enemy.speed * delta;
        }
    },

    // AMBER TITAN - Orange enemy with curved shield in front
    amberTitan: {
        name: 'Amber Titan',
        color: 0xffa64d,
        glowColor: 0xffa64d,
        radius: 10, // Same size as crimson seeker
        
        attributes: {
            health: 3,
            speed: 1.35,
            coreDamagePercent: 0.14,
            glowDistance: 12,
            glowStrength: 1.4,
            crackAlpha: 0.8,
            crackWidth: 2
        },
        
        getHealth: () => Math.max(2, (window.gameState?.config?.combat?.enemyHealth || 1) * EnemyTypes.amberTitan.attributes.health),
        getCoreDamage: () => (window.gameState?.config?.physics?.maxLength || 190) * EnemyTypes.amberTitan.attributes.coreDamagePercent,
        
        createGfx() {
            const gfx = new PIXI.Graphics();
            const attr = EnemyTypes.amberTitan.attributes;
            
            // Main orange body (small ball)
            gfx.beginFill(EnemyTypes.amberTitan.color).drawCircle(0, 0, EnemyTypes.amberTitan.radius).endFill();
            
            // Curved shield in front (facing towards core)
            gfx.lineStyle(3, 0xffd37a, 1.0);
            gfx.arc(-8, 0, 12, -Math.PI * 0.4, Math.PI * 0.4); // Curved shield arc
            
            // Shield connecting lines
            gfx.moveTo(-8, -4.8).lineTo(-2, -2);
            gfx.moveTo(-8, 4.8).lineTo(-2, 2);
            
            // Crack overlay (initially invisible)
            gfx.crackOverlay = new PIXI.Graphics();
            gfx.crackOverlay.alpha = 0;
            gfx.addChild(gfx.crackOverlay);
            
            gfx.filters = [new PIXI.filters.GlowFilter({ 
                distance: attr.glowDistance, 
                outerStrength: attr.glowStrength, 
                color: EnemyTypes.amberTitan.glowColor 
            })];
            return gfx;
        },
        
        onSpawn(enemy) {
            enemy.speed = EnemyTypes.amberTitan.attributes.speed;
            enemy.isFirstHit = true;
        },
        
        onHit(enemy, hitInfo) {
            if (enemy.isFirstHit) {
                // Show crack on first hit
                enemy.isFirstHit = false;
                const attr = EnemyTypes.amberTitan.attributes;
                const crackOverlay = enemy.gfx.crackOverlay;
                
                if (crackOverlay) {
                    crackOverlay.clear();
                    crackOverlay.lineStyle(attr.crackWidth, 0x000000, attr.crackAlpha);
                    
                    // Draw multiple cracks
                    const numCracks = 4;
                    for (let i = 0; i < numCracks; i++) {
                        const angle = (Math.PI * 2 / numCracks) * i + Math.random() * 0.5;
                        const length = 8 + Math.random() * 6;
                        const startRadius = 2;
                        crackOverlay.moveTo(
                            Math.cos(angle) * startRadius, 
                            Math.sin(angle) * startRadius
                        );
                        crackOverlay.lineTo(
                            Math.cos(angle) * length, 
                            Math.sin(angle) * length
                        );
                    }
                    
                    crackOverlay.alpha = attr.crackAlpha;
                }
                
                // Reduce speed when cracked to show pain
                enemy.speed *= 0.7;
            }
        },
        
        update(enemy, delta) {
            const dx = window.gameState.core.x - enemy.gfx.x;
            const dy = window.gameState.core.y - enemy.gfx.y;
            const distance = Math.hypot(dx, dy) || 1;
            
            // Move toward core
            enemy.gfx.x += (dx / distance) * enemy.speed * delta;
            enemy.gfx.y += (dy / distance) * enemy.speed * delta;
            
            // Rotate to face core (shield points toward core)
            enemy.gfx.rotation = Math.atan2(dy, dx);
        }
    },

    // ASTRAL ORBITER - Pink enemy with orbital projectiles
    astralOrbiter: {
        name: 'Astral Orbiter',
        color: 0xff7bd8,
        glowColor: 0xff7bd8,
        radius: 12,
        
        attributes: {
            health: 1.8,
            inwardSpeed: 0.8,
            angularSpeed: 0.045,
            shootTimer: 90,
            projectileCooldown: 120,
            coreDamagePercent: 0.12,
            glowDistance: 14,
            glowStrength: 1.2
        },
        
        getHealth: () => Math.max(2, (window.gameState?.config?.combat?.enemyHealth || 1) * EnemyTypes.astralOrbiter.attributes.health),
        getCoreDamage: () => (window.gameState?.config?.physics?.maxLength || 190) * EnemyTypes.astralOrbiter.attributes.coreDamagePercent,
        
        createGfx() {
            const gfx = new PIXI.Graphics();
            const attr = EnemyTypes.astralOrbiter.attributes;
            gfx.beginFill(EnemyTypes.astralOrbiter.color, 0.85).drawCircle(0, 0, EnemyTypes.astralOrbiter.radius).endFill();
            gfx.lineStyle(2, 0xffffff, 0.9).drawCircle(0, 0, 8);
            gfx.moveTo(-4, 0).lineTo(4, 0);
            gfx.filters = [new PIXI.filters.GlowFilter({ 
                distance: attr.glowDistance, 
                outerStrength: attr.glowStrength, 
                color: EnemyTypes.astralOrbiter.glowColor 
            })];
            return gfx;
        },
        
        onSpawn(enemy) {
            const attr = EnemyTypes.astralOrbiter.attributes;
            enemy.data = {
                angle: enemy.spawnAngle,
                radius: enemy.spawnRadius,
                inwardSpeed: attr.inwardSpeed,
                angularSpeed: attr.angularSpeed,
                shootTimer: attr.shootTimer,
                projectileCooldown: attr.projectileCooldown,
            };
        },
        
        update(enemy, delta) {
            const data = enemy.data;
            const attr = EnemyTypes.astralOrbiter.attributes;
            if (!data) return;
            
            const currentCoreRadius = window.gameState?.currentCoreRadius || 30;
            const coreX = window.gameState?.core?.x || 0;
            const coreY = window.gameState?.core?.y || 0;
            
            data.radius = Math.max(currentCoreRadius + 40, data.radius - data.inwardSpeed * delta);
            data.angle += data.angularSpeed * delta;
            enemy.gfx.x = coreX + Math.cos(data.angle) * data.radius;
            enemy.gfx.y = coreY + Math.sin(data.angle) * data.radius;
            enemy.gfx.rotation = data.angle;
            data.shootTimer -= delta;
            
            if (data.shootTimer <= 0) {
                if (window.gameState?.enemySystem?.createPinkArcProjectiles) {
                    window.gameState.enemySystem.createPinkArcProjectiles(enemy);
                }
                data.shootTimer = data.projectileCooldown;
            }
        },
        
        onDeath(enemy) {
            if (window.gameState?.enemySystem?.removePinkProjectiles) {
                window.gameState.enemySystem.removePinkProjectiles(enemy);
            }
        }
    },

    // EMERALD BOW - Green arrow shooting enemy (refactored from charging)
    emeraldBow: {
        name: 'Emerald Bow',
        color: 0x7dff88,
        glowColor: 0x7dff88,
        radius: 14,
        
        attributes: {
            health: 2.5,
            maxAmmo: 3,
            shootInterval: 120, // frames between shots
            arrowSpeed: 3.5,
            coreDamagePercent: 0.18,
            glowDistance: 12,
            glowStrength: 1.3,
            reachableDistance: 0.85 // percentage of max rope length when reachable
        },
        
        getHealth: () => Math.max(2, (window.gameState?.config?.combat?.enemyHealth || 1) * EnemyTypes.emeraldBow.attributes.health),
        getCoreDamage: () => (window.gameState?.config?.physics?.maxLength || 190) * EnemyTypes.emeraldBow.attributes.coreDamagePercent,
        
        createGfx() {
            const gfx = new PIXI.Graphics();
            const attr = EnemyTypes.emeraldBow.attributes;
            
            // Draw pointy curved bow shape (recurve bow style)
            gfx.lineStyle(3, EnemyTypes.emeraldBow.color, 1.0);
            
            // Left bow limb with sharp recurve tip
            gfx.moveTo(0, -12);
            gfx.quadraticCurveTo(-6, -10, -4, -6);
            gfx.quadraticCurveTo(-2, -3, 0, 0);
            
            // Right bow limb with sharp recurve tip  
            gfx.moveTo(0, 0);
            gfx.quadraticCurveTo(-2, 3, -4, 6);
            gfx.quadraticCurveTo(-6, 10, 0, 12);
            
            // Sharp recurve tips
            gfx.moveTo(0, -12).lineTo(-2, -14).lineTo(1, -13);
            gfx.moveTo(0, 12).lineTo(-2, 14).lineTo(1, 13);
            
            // Bow string (taut)
            gfx.lineStyle(1.5, 0x9fff9f, 0.8);
            gfx.moveTo(0, -12).lineTo(0, 12);
            
            // Ammo indicators (will be updated dynamically)
            gfx.ammoIndicators = [];
            for (let i = 0; i < attr.maxAmmo; i++) {
                const indicator = new PIXI.Graphics();
                indicator.beginFill(0xc8ffd5).drawCircle(0, 0, 2).endFill();
                indicator.x = -15 - (i * 5);
                indicator.y = 0;
                gfx.addChild(indicator);
                gfx.ammoIndicators.push(indicator);
            }
            
            gfx.filters = [new PIXI.filters.GlowFilter({ 
                distance: attr.glowDistance, 
                outerStrength: attr.glowStrength, 
                color: EnemyTypes.emeraldBow.glowColor 
            })];
            return gfx;
        },
        
        onSpawn(enemy) {
            const attr = EnemyTypes.emeraldBow.attributes;
            const currentCoreRadius = window.gameState?.currentCoreRadius || 30;
            const maxLength = window.gameState?.config?.physics?.maxLength || 190;
            const isDangerState = window.gameState?.isDangerState || false;
            
            // Position based on reachability unless in danger mode
            let targetDistance;
            if (isDangerState) {
                // In danger mode, can be anywhere
                targetDistance = Math.max(currentCoreRadius + 60, maxLength * 0.7);
            } else {
                // Normal mode - always reachable
                targetDistance = Math.min(
                    maxLength * attr.reachableDistance, 
                    Math.max(currentCoreRadius + 50, maxLength * 0.6)
                );
            }
            
            // Lock in position (stays at first locked place)
            const angle = enemy.spawnAngle;
            const coreX = window.gameState?.core?.x || 0;
            const coreY = window.gameState?.core?.y || 0;
            
            enemy.gfx.x = coreX + Math.cos(angle) * targetDistance;
            enemy.gfx.y = coreY + Math.sin(angle) * targetDistance;
            enemy.gfx.rotation = angle + Math.PI; // Point toward core
            
            enemy.data = {
                isLocked: true,
                lockPosition: { x: enemy.gfx.x, y: enemy.gfx.y },
                ammoRemaining: attr.maxAmmo,
                shootTimer: attr.shootInterval,
                targetAngle: angle + Math.PI,
                brokenParts: 0
            };
            
            enemy.isStationary = true;
        },
        
        onHit(enemy, hitInfo) {
            const attr = EnemyTypes.emeraldBow.attributes;
            
            // Break and lose pieces when hit
            enemy.data.brokenParts++;
            
            // Update visual to show damage
            const brokenRatio = enemy.data.brokenParts / (attr.maxAmmo + 1);
            enemy.gfx.alpha = Math.max(0.4, 1 - brokenRatio * 0.6);
            
            // Lose ammo indicators
            if (enemy.gfx.ammoIndicators && enemy.data.brokenParts <= enemy.gfx.ammoIndicators.length) {
                const indicator = enemy.gfx.ammoIndicators[enemy.data.brokenParts - 1];
                if (indicator) {
                    indicator.visible = false;
                }
            }
            
            // Check if arrow can be deflected back
            if (hitInfo && enemy.data.lastShotDirection) {
                // Create deflected arrow
                window.gameState?.enemySystem?.createDeflectedArrow(enemy, enemy.data.lastShotDirection);
            }
        },
        
        update(enemy, delta) {
            const data = enemy.data;
            const attr = EnemyTypes.emeraldBow.attributes;
            if (!data || !data.isLocked) return;
            
            // Stay locked in position
            enemy.gfx.x = data.lockPosition.x;
            enemy.gfx.y = data.lockPosition.y;
            enemy.gfx.rotation = data.targetAngle;
            
            // Shooting logic
            if (data.ammoRemaining > 0) {
                data.shootTimer -= delta;
                if (data.shootTimer <= 0) {
                    // Shoot arrow toward core
                    const coreX = window.gameState?.core?.x || 0;
                    const coreY = window.gameState?.core?.y || 0;
                    const dx = coreX - enemy.gfx.x;
                    const dy = coreY - enemy.gfx.y;
                    const angle = Math.atan2(dy, dx);
                    
                    // Store shot direction for deflection
                    data.lastShotDirection = { x: Math.cos(angle), y: Math.sin(angle) };
                    
                    // Create arrow projectile
                    window.gameState?.enemySystem?.createArrowProjectile(enemy, angle);
                    
                    data.ammoRemaining--;
                    data.shootTimer = attr.shootInterval;
                    
                    // Update ammo indicator
                    if (enemy.gfx.ammoIndicators && enemy.gfx.ammoIndicators[data.ammoRemaining]) {
                        enemy.gfx.ammoIndicators[data.ammoRemaining].alpha = 0.3;
                    }
                }
            }
        }
    }
};

// Danger wave patterns with updated enemy names
export const DangerWavePatterns = [
    {
        name: 'Crimson Swarm',
        entries: [
            { type: 'crimsonSeeker', count: 10, interval: 3 }
        ]
    },
    {
        name: 'Amber Giants',
        entries: [
            { type: 'amberTitan', count: 8, interval: 6 }
        ]
    },
    {
        name: 'Emerald Volley',
        entries: [
            { type: 'emeraldBow', count: 5, interval: 8 }
        ]
    },
    {
        name: 'Astral Pressure',
        entries: [
            { type: 'astralOrbiter', count: 4, interval: 10 },
            { type: 'crimsonSeeker', count: 6, interval: 4, initialDelay: 18 }
        ]
    }
];

// Enemy selection logic with updated type names
export const EnemySelection = {
    chooseEnemyType(kills = 0, score = 0, currentCombo = 0) {
        const weights = [
            { type: 'crimsonSeeker', weight: 6 },
            { type: 'amberTitan', weight: 2 + Math.min(3, kills / 15) },
            { type: 'astralOrbiter', weight: 1 + Math.min(3, score / 800) },
            { type: 'emeraldBow', weight: 0.8 + Math.min(2.5, currentCombo / 8) },
        ];
        
        const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
        let roll = Math.random() * total;
        
        for (const entry of weights) {
            roll -= entry.weight;
            if (roll <= 0) {
                return entry.type;
            }
        }
        
        return 'crimsonSeeker'; // fallback
    },

    chooseDangerWavePattern(kills = 0, score = 0) {
        const available = DangerWavePatterns.filter(pattern => {
            if (kills < 8 && pattern.entries.some(entry => entry.type === 'emeraldBow')) {
                return false;
            }
            if (score < 150 && pattern.entries.some(entry => entry.type === 'astralOrbiter')) {
                return false;
            }
            return true;
        });
        
        const pool = available.length ? available : DangerWavePatterns;
        return pool[Math.floor(Math.random() * pool.length)];
    }
};
