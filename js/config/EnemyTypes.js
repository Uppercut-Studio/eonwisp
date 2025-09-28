// Enemy type definitions and behaviors
export const EnemyTypes = {
    red: {
        color: 0xff4a4a,
        glowColor: 0xff4a4a,
        radius: 10,
        getHealth: () => Math.max(1, window.gameState?.config?.combat?.enemyHealth || 1),
        getCoreDamage: () => (window.gameState?.config?.physics?.maxLength || 190) * 0.10,
        createGfx() {
            const gfx = new PIXI.Graphics();
            gfx.beginFill(0xff4a4a).drawCircle(0, 0, 10).endFill();
            gfx.filters = [new PIXI.filters.GlowFilter({ distance: 10, outerStrength: 1, color: 0xff4a4a })];
            return gfx;
        },
        onSpawn(enemy) {
            enemy.speed = 2.4;
        },
        update(enemy, delta) {
            const dx = window.gameState.core.x - enemy.gfx.x;
            const dy = window.gameState.core.y - enemy.gfx.y;
            const distance = Math.hypot(dx, dy) || 1;
            enemy.gfx.x += (dx / distance) * enemy.speed * delta;
            enemy.gfx.y += (dy / distance) * enemy.speed * delta;
        }
    },

    orange: {
        color: 0xffa64d,
        glowColor: 0xffa64d,
        radius: 16,
        getHealth: () => Math.max(2, (window.gameState?.config?.combat?.enemyHealth || 1) * 3),
        getCoreDamage: () => (window.gameState?.config?.physics?.maxLength || 190) * 0.14,
        createGfx() {
            const gfx = new PIXI.Graphics();
            gfx.beginFill(0xffa64d).drawCircle(0, 0, 16).endFill();
            gfx.lineStyle(3, 0xffd37a, 0.6).drawCircle(0, 0, 12);
            gfx.filters = [new PIXI.filters.GlowFilter({ distance: 12, outerStrength: 1.4, color: 0xffa64d })];
            return gfx;
        },
        onSpawn(enemy) {
            enemy.speed = 1.35;
        },
        update(enemy, delta) {
            const dx = window.gameState.core.x - enemy.gfx.x;
            const dy = window.gameState.core.y - enemy.gfx.y;
            const distance = Math.hypot(dx, dy) || 1;
            enemy.gfx.x += (dx / distance) * enemy.speed * delta;
            enemy.gfx.y += (dy / distance) * enemy.speed * delta;
        }
    },

    pink: {
        color: 0xff7bd8,
        glowColor: 0xff7bd8,
        radius: 12,
        getHealth: () => Math.max(2, (window.gameState?.config?.combat?.enemyHealth || 1) * 1.8),
        getCoreDamage: () => (window.gameState?.config?.physics?.maxLength || 190) * 0.12,
        createGfx() {
            const gfx = new PIXI.Graphics();
            gfx.beginFill(0xff7bd8, 0.85).drawCircle(0, 0, 12).endFill();
            gfx.lineStyle(2, 0xffffff, 0.9).drawCircle(0, 0, 8);
            gfx.moveTo(-4, 0).lineTo(4, 0);
            gfx.filters = [new PIXI.filters.GlowFilter({ distance: 14, outerStrength: 1.2, color: 0xff7bd8 })];
            return gfx;
        },
        onSpawn(enemy) {
            enemy.data = {
                angle: enemy.spawnAngle,
                radius: enemy.spawnRadius,
                inwardSpeed: 0.8,
                angularSpeed: 0.045,
                shootTimer: 90,
                projectileCooldown: 120,
            };
        },
        update(enemy, delta) {
            const data = enemy.data;
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
                // Create projectiles - this will be handled by the enemy system
                if (window.gameState?.enemySystem?.createPinkArcProjectiles) {
                    window.gameState.enemySystem.createPinkArcProjectiles(enemy);
                }
                data.shootTimer = data.projectileCooldown;
            }
        },
        onDeath(enemy) {
            // Remove related projectiles - handled by enemy system
            if (window.gameState?.enemySystem?.removePinkProjectiles) {
                window.gameState.enemySystem.removePinkProjectiles(enemy);
            }
        }
    },

    green: {
        color: 0x7dff88,
        glowColor: 0x7dff88,
        radius: 11,
        getHealth: () => Math.max(2, (window.gameState?.config?.combat?.enemyHealth || 1) * 2.2),
        getCoreDamage: (enemy) => {
            const maxLength = window.gameState?.config?.physics?.maxLength || 190;
            return enemy.state === 'dash' ? maxLength * 0.22 : maxLength * 0.16;
        },
        createGfx() {
            const gfx = new PIXI.Graphics();
            gfx.beginFill(0x7dff88).moveTo(0, -14).lineTo(9, 10).lineTo(0, 6).lineTo(-9, 10).closePath();
            gfx.endFill();
            gfx.lineStyle(2, 0xc8ffd5, 0.8).moveTo(0, -14).lineTo(0, 6);
            gfx.filters = [new PIXI.filters.GlowFilter({ distance: 12, outerStrength: 1.3, color: 0x7dff88 })];
            return gfx;
        },
        onSpawn(enemy) {
            enemy.state = 'approach';
            enemy.speed = 4.2;
            const currentCoreRadius = window.gameState?.currentCoreRadius || 30;
            const maxLength = window.gameState?.config?.physics?.maxLength || 190;
            
            enemy.data = {
                chargeTimer: 120,
                windupTint: 0xb8ffbf,
                dashTint: 0xffffff,
                pulseTime: 0,
                dashSpeed: 13,
                approachTargetRadius: Math.max(currentCoreRadius + 80, maxLength * 0.45),
            };
        },
        update(enemy, delta) {
            const data = enemy.data;
            const coreX = window.gameState?.core?.x || 0;
            const coreY = window.gameState?.core?.y || 0;
            const dx = coreX - enemy.gfx.x;
            const dy = coreY - enemy.gfx.y;
            const distance = Math.hypot(dx, dy) || 1;
            
            if (enemy.state === 'approach') {
                enemy.visualBaseTint = enemy.baseColor;
                enemy.gfx.scale.set(1, 1);
                if (distance > data.approachTargetRadius) {
                    enemy.gfx.x += (dx / distance) * enemy.speed * delta;
                    enemy.gfx.y += (dy / distance) * enemy.speed * delta;
                } else {
                    enemy.state = 'charge';
                    data.chargeTimer = 120;
                    data.pulseTime = 0;
                    data.blinkTimer = 0;
                    data.squashTimer = 0;
                }
            } else if (enemy.state === 'charge') {
                data.chargeTimer -= delta;
                data.blinkTimer += delta;
                data.squashTimer += delta;
                
                // Blinking effect - faster as we approach dash
                const blinkSpeed = 0.15 + (1 - data.chargeTimer / 120) * 0.25;
                const blinkPhase = Math.sin(data.blinkTimer * blinkSpeed);
                const isBlinking = blinkPhase > 0.3;
                
                if (isBlinking) {
                    enemy.visualBaseTint = 0xffffff;
                    enemy.gfx.filters[0].color = 0xffffff;
                    enemy.gfx.filters[0].outerStrength = 2.5;
                } else {
                    enemy.visualBaseTint = data.windupTint;
                    enemy.gfx.filters[0].color = 0x7dff88;
                    enemy.gfx.filters[0].outerStrength = 1.3;
                }
                
                // Elasticity - squash and stretch animation
                const squashProgress = data.squashTimer / 120;
                const elasticPhase = Math.sin(squashProgress * Math.PI * 3) * (1 - squashProgress);
                
                const squashAmount = 0.3 * elasticPhase;
                const scaleX = 1 - squashAmount;
                const scaleY = 1 + squashAmount * 0.5;
                
                // Final stretch before dash
                if (data.chargeTimer <= 30) {
                    const stretchProgress = (30 - data.chargeTimer) / 30;
                    const stretchX = 1 + stretchProgress * 0.4;
                    const stretchY = 1 - stretchProgress * 0.2;
                    enemy.gfx.scale.set(scaleX * stretchX, scaleY * stretchY);
                } else {
                    enemy.gfx.scale.set(scaleX, scaleY);
                }
                
                if (data.chargeTimer <= 0) {
                    enemy.state = 'dash';
                    enemy.gfx.scale.set(1.2, 1.2);
                    enemy.gfx.filters[0].color = 0x7dff88;
                    enemy.gfx.filters[0].outerStrength = 1.3;
                }
            }
            
            if (enemy.state === 'dash') {
                enemy.visualBaseTint = data.dashTint;
                enemy.gfx.x += (dx / distance) * data.dashSpeed * delta;
                enemy.gfx.y += (dy / distance) * data.dashSpeed * delta;
            }
            
            enemy.gfx.rotation = Math.atan2(dy, dx) + Math.PI / 2;
        }
    }
};

// Danger wave patterns
export const DangerWavePatterns = [
    {
        name: 'Crimson Swarm',
        entries: [
            { type: 'red', count: 10, interval: 3 }
        ]
    },
    {
        name: 'Amber Giants',
        entries: [
            { type: 'orange', count: 8, interval: 6 }
        ]
    },
    {
        name: 'Emerald Charge',
        entries: [
            { type: 'green', count: 5, interval: 8 }
        ]
    },
    {
        name: 'Spiral Pressure',
        entries: [
            { type: 'pink', count: 4, interval: 10 },
            { type: 'red', count: 6, interval: 4, initialDelay: 18 }
        ]
    }
];

// Enemy selection logic
export const EnemySelection = {
    chooseEnemyType(kills = 0, score = 0, currentCombo = 0) {
        const weights = [
            { type: 'red', weight: 6 },
            { type: 'orange', weight: 2 + Math.min(3, kills / 15) },
            { type: 'pink', weight: 1 + Math.min(3, score / 800) },
            { type: 'green', weight: 0.8 + Math.min(2.5, currentCombo / 8) },
        ];
        
        const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
        let roll = Math.random() * total;
        
        for (const entry of weights) {
            roll -= entry.weight;
            if (roll <= 0) {
                return entry.type;
            }
        }
        
        return 'red'; // fallback
    },

    chooseDangerWavePattern(kills = 0, score = 0) {
        const available = DangerWavePatterns.filter(pattern => {
            if (kills < 8 && pattern.entries.some(entry => entry.type === 'green')) {
                return false;
            }
            if (score < 150 && pattern.entries.some(entry => entry.type === 'pink')) {
                return false;
            }
            return true;
        });
        
        const pool = available.length ? available : DangerWavePatterns;
        return pool[Math.floor(Math.random() * pool.length)];
    }
};
