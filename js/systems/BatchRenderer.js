// Batched rendering system to minimize draw calls and maximize FPS
export class BatchRenderer {
    constructor(app, performanceManager) {
        this.app = app;
        this.performanceManager = performanceManager;
        
        // Batch containers for different types of objects
        this.batches = {
            enemies: new PIXI.Graphics(),
            particles: new PIXI.Graphics(),
            trails: new PIXI.Graphics(),
            projectiles: new PIXI.Graphics(),
            effects: new PIXI.Graphics()
        };
        
        // Add batch containers to stage
        Object.values(this.batches).forEach(batch => {
            this.app.stage.addChild(batch);
        });
        
        // Culling system
        this.cullingBounds = {
            left: -100,
            right: this.app.screen.width + 100,
            top: -100,
            bottom: this.app.screen.height + 100
        };
        
        // Batch queues for deferred rendering
        this.renderQueues = {
            circles: [],
            lines: [],
            polygons: [],
            sprites: []
        };
        
        // Performance optimization flags
        this.useSimplifiedRendering = false;
        this.skipNonEssential = false;
        
        // LOD (Level of Detail) system
        this.lodDistances = {
            high: 300,    // Full detail
            medium: 600,  // Reduced detail
            low: 1000     // Minimal detail
        };
    }

    updateCullingBounds() {
        const margin = 150;
        this.cullingBounds = {
            left: -margin,
            right: this.app.screen.width + margin,
            top: -margin,
            bottom: this.app.screen.height + margin
        };
    }

    isVisible(x, y, radius = 0) {
        return (
            x + radius >= this.cullingBounds.left &&
            x - radius <= this.cullingBounds.right &&
            y + radius >= this.cullingBounds.top &&
            y - radius <= this.cullingBounds.bottom
        );
    }

    getLOD(x, y, cameraX = 0, cameraY = 0) {
        const distance = Math.hypot(x - cameraX, y - cameraY);
        if (distance < this.lodDistances.high) return 'high';
        if (distance < this.lodDistances.medium) return 'medium';
        if (distance < this.lodDistances.low) return 'low';
        return 'skip'; // Too far, skip rendering
    }

    // Queue system for batched rendering
    queueCircle(x, y, radius, color, alpha = 1, outline = null) {
        if (!this.isVisible(x, y, radius)) return;
        
        this.renderQueues.circles.push({
            x, y, radius, color, alpha, outline
        });
    }

    queueLine(x1, y1, x2, y2, thickness, color, alpha = 1) {
        if (!this.isVisible((x1 + x2) / 2, (y1 + y2) / 2)) return;
        
        this.renderQueues.lines.push({
            x1, y1, x2, y2, thickness, color, alpha
        });
    }

    queuePolygon(points, color, alpha = 1, outline = null) {
        // Simple bounds check using first point
        if (points.length >= 2 && !this.isVisible(points[0], points[1])) return;
        
        this.renderQueues.polygons.push({
            points, color, alpha, outline
        });
    }

    // Batch render all queued objects
    renderBatches() {
        const optimizedSettings = this.performanceManager.getOptimizedSettings();
        this.useSimplifiedRendering = optimizedSettings.shouldUseSimplifiedEffects;
        this.skipNonEssential = optimizedSettings.shouldSkipNonEssentialUpdates;

        // Clear all batch graphics
        Object.values(this.batches).forEach(batch => batch.clear());

        // Render circles in batches by color
        this.renderCircleBatches();
        
        // Render lines in batches by color and thickness
        this.renderLineBatches();
        
        // Render polygons
        this.renderPolygonBatches();

        // Clear queues for next frame
        this.clearRenderQueues();
        
        // Record performance metrics
        this.performanceManager.recordDrawCall();
    }

    renderCircleBatches() {
        const circlesByColor = new Map();
        
        // Group circles by color for batch rendering
        this.renderQueues.circles.forEach(circle => {
            const key = `${circle.color}_${circle.alpha}`;
            if (!circlesByColor.has(key)) {
                circlesByColor.set(key, []);
            }
            circlesByColor.get(key).push(circle);
        });

        // Render each color batch
        circlesByColor.forEach((circles, key) => {
            const [colorStr, alphaStr] = key.split('_');
            const color = parseInt(colorStr);
            const alpha = parseFloat(alphaStr);
            
            this.batches.effects.beginFill(color, alpha);
            
            circles.forEach(circle => {
                // LOD system - reduce circle complexity at distance
                const lod = this.getLOD(circle.x, circle.y);
                
                if (lod === 'skip') return;
                
                let segments = 16; // Default quality
                if (lod === 'medium' || this.useSimplifiedRendering) {
                    segments = 8;
                } else if (lod === 'low') {
                    segments = 6;
                }
                
                if (this.useSimplifiedRendering) {
                    // Use simple rectangles instead of circles for performance
                    const size = circle.radius * 2;
                    this.batches.effects.drawRect(
                        circle.x - circle.radius, 
                        circle.y - circle.radius, 
                        size, size
                    );
                } else {
                    this.batches.effects.drawCircle(circle.x, circle.y, circle.radius);
                }
                
                // Add outline if specified and quality allows
                if (circle.outline && !this.useSimplifiedRendering && lod === 'high') {
                    this.batches.effects.lineStyle(circle.outline.thickness, circle.outline.color, circle.outline.alpha || 1);
                    this.batches.effects.drawCircle(circle.x, circle.y, circle.radius);
                    this.batches.effects.lineStyle(0); // Reset line style
                }
            });
            
            this.batches.effects.endFill();
        });
    }

    renderLineBatches() {
        const linesByStyle = new Map();
        
        // Group lines by style for batch rendering
        this.renderQueues.lines.forEach(line => {
            const key = `${line.thickness}_${line.color}_${line.alpha}`;
            if (!linesByStyle.has(key)) {
                linesByStyle.set(key, []);
            }
            linesByStyle.get(key).push(line);
        });

        // Render each style batch
        linesByStyle.forEach((lines, key) => {
            const [thicknessStr, colorStr, alphaStr] = key.split('_');
            const thickness = parseFloat(thicknessStr);
            const color = parseInt(colorStr);
            const alpha = parseFloat(alphaStr);
            
            // Optimize thickness for performance
            let optimizedThickness = thickness;
            if (this.useSimplifiedRendering) {
                optimizedThickness = Math.max(1, thickness * 0.5);
            }
            
            this.batches.effects.lineStyle(optimizedThickness, color, alpha);
            
            lines.forEach(line => {
                this.batches.effects.moveTo(line.x1, line.y1);
                this.batches.effects.lineTo(line.x2, line.y2);
            });
            
            this.batches.effects.lineStyle(0); // Reset line style
        });
    }

    renderPolygonBatches() {
        const polygonsByColor = new Map();
        
        // Group polygons by color
        this.renderQueues.polygons.forEach(polygon => {
            const key = `${polygon.color}_${polygon.alpha}`;
            if (!polygonsByColor.has(key)) {
                polygonsByColor.set(key, []);
            }
            polygonsByColor.get(key).push(polygon);
        });

        // Render each color batch
        polygonsByColor.forEach((polygons, key) => {
            const [colorStr, alphaStr] = key.split('_');
            const color = parseInt(colorStr);
            const alpha = parseFloat(alphaStr);
            
            this.batches.effects.beginFill(color, alpha);
            
            polygons.forEach(polygon => {
                if (polygon.points.length >= 6) { // At least 3 points (x,y pairs)
                    this.batches.effects.drawPolygon(polygon.points);
                }
                
                // Add outline if specified
                if (polygon.outline && !this.useSimplifiedRendering) {
                    this.batches.effects.lineStyle(polygon.outline.thickness, polygon.outline.color, polygon.outline.alpha || 1);
                    this.batches.effects.drawPolygon(polygon.points);
                    this.batches.effects.lineStyle(0);
                }
            });
            
            this.batches.effects.endFill();
        });
    }

    clearRenderQueues() {
        this.renderQueues.circles.length = 0;
        this.renderQueues.lines.length = 0;
        this.renderQueues.polygons.length = 0;
        this.renderQueues.sprites.length = 0;
    }

    // Specialized rendering methods
    renderEnemies(enemies, coreX, coreY) {
        this.batches.enemies.clear();
        
        const enemiesByType = new Map();
        
        enemies.forEach(enemy => {
            if (!this.isVisible(enemy.gfx.x, enemy.gfx.y, enemy.collisionRadius)) return;
            
            const type = enemy.type || 'default';
            if (!enemiesByType.has(type)) {
                enemiesByType.set(type, []);
            }
            enemiesByType.get(type).push(enemy);
        });

        // Batch render enemies by type
        enemiesByType.forEach((typeEnemies, type) => {
            this.renderEnemyType(typeEnemies, type, coreX, coreY);
        });

        this.performanceManager.recordDrawCall();
    }

    renderEnemyType(enemies, type, coreX, coreY) {
        enemies.forEach(enemy => {
            const lod = this.getLOD(enemy.gfx.x, enemy.gfx.y, coreX, coreY);
            if (lod === 'skip') return;

            const color = enemy.visualBaseTint || enemy.baseColor || 0xff4a4a;
            const radius = enemy.collisionRadius || 10;
            
            // Simplified rendering for distant or low-performance scenarios
            if (lod === 'low' || this.useSimplifiedRendering) {
                // Simple colored rectangles
                this.batches.enemies.beginFill(color, 0.8);
                const size = radius * 2;
                this.batches.enemies.drawRect(
                    enemy.gfx.x - radius,
                    enemy.gfx.y - radius,
                    size, size
                );
                this.batches.enemies.endFill();
            } else {
                // Full quality rendering
                this.batches.enemies.beginFill(color, 0.9);
                this.batches.enemies.drawCircle(enemy.gfx.x, enemy.gfx.y, radius);
                this.batches.enemies.endFill();
                
                // Add details for high LOD
                if (lod === 'high' && !this.useSimplifiedRendering) {
                    // Add enemy-specific details based on type
                    this.addEnemyDetails(enemy, type);
                }
            }
        });
    }

    addEnemyDetails(enemy, type) {
        const x = enemy.gfx.x;
        const y = enemy.gfx.y;
        
        switch (type) {
            case 'orange':
                // Inner circle for orange enemies
                this.batches.enemies.lineStyle(2, 0xffd37a, 0.6);
                this.batches.enemies.drawCircle(x, y, enemy.collisionRadius * 0.75);
                this.batches.enemies.lineStyle(0);
                break;
                
            case 'pink':
                // Cross pattern for pink enemies
                this.batches.enemies.lineStyle(2, 0xffffff, 0.9);
                this.batches.enemies.moveTo(x - 4, y).lineTo(x + 4, y);
                this.batches.enemies.lineStyle(0);
                break;
                
            case 'green':
                // Arrow shape for green enemies
                if (enemy.gfx.rotation !== undefined) {
                    const cos = Math.cos(enemy.gfx.rotation);
                    const sin = Math.sin(enemy.gfx.rotation);
                    const size = 8;
                    
                    this.batches.enemies.lineStyle(2, 0xc8ffd5, 0.8);
                    this.batches.enemies.moveTo(x, y - size);
                    this.batches.enemies.lineTo(x, y + size * 0.5);
                    this.batches.enemies.lineStyle(0);
                }
                break;
        }
    }

    // Trail rendering with optimization
    renderTrail(trailPoints, trailSize) {
        this.batches.trails.clear();
        
        if (trailPoints.length < 2) return;
        
        // Adaptive trail rendering based on performance
        const optimizedSettings = this.performanceManager.getOptimizedSettings();
        const maxPoints = Math.floor(trailPoints.length * optimizedSettings.effectsMultiplier);
        const step = Math.max(1, Math.floor(trailPoints.length / maxPoints));
        
        // Group trail points by color for batch rendering
        const trailsByColor = new Map();
        
        for (let i = 0; i < trailPoints.length; i += step) {
            const point = trailPoints[i];
            if (!point.active || !this.isVisible(point.x, point.y)) continue;
            
            const color = point.tint || 0xffffff;
            if (!trailsByColor.has(color)) {
                trailsByColor.set(color, []);
            }
            trailsByColor.get(color).push(point);
        }

        // Render each color batch
        trailsByColor.forEach((points, color) => {
            this.batches.trails.beginFill(color);
            
            points.forEach(point => {
                const alpha = Math.max(0, point.lifetime / 40) * 0.5;
                const scale = Math.max(0, point.lifetime / 40);
                const size = trailSize * scale * optimizedSettings.effectsMultiplier;
                
                if (size > 0.5) {
                    if (this.useSimplifiedRendering) {
                        // Simple squares for performance
                        this.batches.trails.drawRect(
                            point.x - size, point.y - size, 
                            size * 2, size * 2
                        );
                    } else {
                        this.batches.trails.drawCircle(point.x, point.y, size);
                    }
                }
            });
            
            this.batches.trails.endFill();
        });

        this.performanceManager.recordDrawCall();
    }

    // Projectile rendering with batching
    renderProjectiles(projectiles, coreX, coreY) {
        this.batches.projectiles.clear();
        
        if (projectiles.length === 0) return;
        
        // Group projectiles by visual properties
        const projectilesByStyle = new Map();
        
        projectiles.forEach(projectile => {
            const x = projectile.x !== undefined ? projectile.x : 
                     coreX + Math.cos(projectile.angle || 0) * projectile.radius;
            const y = projectile.y !== undefined ? projectile.y :
                     coreY + Math.sin(projectile.angle || 0) * projectile.radius;
            
            if (!this.isVisible(x, y, projectile.size)) return;
            
            const key = `${projectile.color || 0xffffff}_${projectile.size || 4}`;
            if (!projectilesByStyle.has(key)) {
                projectilesByStyle.set(key, []);
            }
            projectilesByStyle.get(key).push({ ...projectile, x, y });
        });

        // Render each style batch
        projectilesByStyle.forEach((stylizedProjectiles, key) => {
            const [colorStr, sizeStr] = key.split('_');
            const color = parseInt(colorStr);
            const size = parseFloat(sizeStr);
            
            this.batches.projectiles.beginFill(color, 0.9);
            
            stylizedProjectiles.forEach(projectile => {
                if (this.useSimplifiedRendering) {
                    // Simple squares
                    const halfSize = size;
                    this.batches.projectiles.drawRect(
                        projectile.x - halfSize, projectile.y - halfSize,
                        size * 2, size * 2
                    );
                } else {
                    this.batches.projectiles.drawCircle(projectile.x, projectile.y, size);
                }
            });
            
            this.batches.projectiles.endFill();
        });

        this.performanceManager.recordDrawCall();
    }

    // Update rendering settings based on performance
    updateSettings(performanceGrade) {
        switch (performanceGrade) {
            case 'D': // Poor performance
                this.useSimplifiedRendering = true;
                this.skipNonEssential = true;
                this.lodDistances.high = 200;
                this.lodDistances.medium = 400;
                this.lodDistances.low = 600;
                break;
            case 'C': // Fair performance
                this.useSimplifiedRendering = true;
                this.skipNonEssential = false;
                this.lodDistances.high = 250;
                this.lodDistances.medium = 500;
                this.lodDistances.low = 800;
                break;
            case 'B': // Good performance
                this.useSimplifiedRendering = false;
                this.skipNonEssential = false;
                this.lodDistances.high = 300;
                this.lodDistances.medium = 600;
                this.lodDistances.low = 1000;
                break;
            case 'A': // Excellent performance
                this.useSimplifiedRendering = false;
                this.skipNonEssential = false;
                this.lodDistances.high = 400;
                this.lodDistances.medium = 800;
                this.lodDistances.low = 1200;
                break;
        }
    }

    // Clean up resources
    destroy() {
        Object.values(this.batches).forEach(batch => {
            if (batch.parent) {
                batch.parent.removeChild(batch);
            }
            batch.destroy();
        });
        this.clearRenderQueues();
    }
}
