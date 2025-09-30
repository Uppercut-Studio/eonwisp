// Enemy Configuration Editor
// This script reads and modifies the actual EnemyTypes.js file
import { EnemyTypes } from './js/config/EnemyTypes.js';

const fs = require('fs');
const path = require('path');

class EnemyEditor {
    constructor() {
        this.enemyTypes = EnemyTypes;
        this.configPath = './js/config/EnemyTypes.js';
    }

    // Get current enemy configuration
    getEnemyConfiguration() {
        const config = {};
        
        Object.keys(EnemyTypes).forEach(key => {
            if (key !== 'chooseEnemyType' && key !== 'chooseDangerWavePattern') {
                const enemy = EnemyTypes[key];
                config[key] = {
                    name: enemy.name,
                    color: enemy.color,
                    glowColor: enemy.glowColor,
                    radius: enemy.radius,
                    attributes: enemy.attributes ? { ...enemy.attributes } : undefined,
                    getHealth: enemy.getHealth ? 'function' : undefined,
                    getCoreDamage: enemy.getCoreDamage ? 'function' : undefined
                };
            }
        });
        
        return config;
    }

    // Update enemy properties
    updateEnemyProperty(enemyType, propertyPath, value) {
        if (!EnemyTypes[enemyType]) return false;
        
        try {
            if (propertyPath.includes('.')) {
                // Handle nested properties like "attributes.health"
                const parts = propertyPath.split('.');
                let target = EnemyTypes[enemyType];
                for (let i = 0; i < parts.length - 1; i++) {
                    target = target[parts[i]];
                }
                target[parts[parts.length - 1]] = value;
            } else {
                // Handle direct properties like "color" or "radius"
                EnemyTypes[enemyType][propertyPath] = value;
            }
            return true;
        } catch (error) {
            console.error('Error updating property:', error);
            return false;
        }
    }

    // Generate the updated EnemyTypes.js file content
    generateUpdatedFileContent() {
        const content = [];
        content.push('// Enhanced Enemy Configuration System with proper names and tweakable attributes');
        content.push('export const EnemyTypes = {');
        
        // Process each enemy type
        const enemyKeys = Object.keys(EnemyTypes).filter(key => 
            key !== 'chooseEnemyType' && key !== 'chooseDangerWavePattern' && key !== 'DangerWavePatterns' && key !== 'EnemySelection'
        );
        
        enemyKeys.forEach((enemyType, index) => {
            const enemy = EnemyTypes[enemyType];
            content.push('');
            content.push(`    // ${enemy.name.toUpperCase()} - ${this.getEnemyDescription(enemyType)}`);
            content.push(`    ${enemyType}: {`);
            content.push(`        name: '${enemy.name}',`);
            content.push(`        color: ${this.formatColorValue(enemy.color)},`);
            content.push(`        glowColor: ${this.formatColorValue(enemy.glowColor)},`);
            content.push(`        radius: ${enemy.radius},`);
            
            if (enemy.attributes) {
                content.push('        ');
                content.push('        // Tweakable attributes');
                content.push('        attributes: {');
                
                const attrKeys = Object.keys(enemy.attributes);
                attrKeys.forEach((key, i) => {
                    const value = enemy.attributes[key];
                    const comma = i < attrKeys.length - 1 ? ',' : '';
                    content.push(`            ${key}: ${this.formatValue(value)}${comma}`);
                });
                
                content.push('        },');
            }
            
            // Add getHealth function
            if (enemy.getHealth) {
                content.push('        ');
                content.push(`        getHealth: ${enemy.getHealth.toString() || '() => Math.max(1, (window.gameState?.config?.combat?.enemyHealth || 1) * ${enemyType}.attributes.health)'},`);
            }
            
            // Add getCoreDamage function
            if (enemy.getCoreDamage) {
                content.push('        ');
                content.push(`        getCoreDamage: ${enemy.getCoreDamage.toString() || '() => (window.gameState?.config?.physics?.maxLength || 190) * ${enemyType}.attributes.coreDamagePercent'},`);
            }
            
            content.push('        ');
            
            // Add createGfx function
            if (enemy.createGfx) {
                content.push('        createGfx() {');
                content.push('            const gfx = new PIXI.Graphics();');
                const lines = enemy.createGfx.toString().split('\n');
                lines.forEach((line, i) => {
                    if (i > 0 && i < lines.length - 1) {
                        content.push('            ' + line.trim());
                    }
                });
                content.push('        },');
                content.push('        ');
            }
            
            // Add other methods
            if (enemy.onSpawn) {
                content.push('        onSpawn(enemy) {');
                const lines = enemy.onSpawn.toString().split('\n');
                lines.forEach((line, i) => {
                    if (i > 0 && i < lines.length - 1) {
                        content.push('            ' + line.trim());
                    }
                });
                content.push('        },');
                content.push('        ');
            }
            
            if (enemy.onHit) {
                content.push('        onHit(enemy, hitInfo) {');
                const lines = enemy.onHit.toString().split('\n');
                lines.forEach((line, i) => {
                    if (i > 0 && i < lines.length - 1) {
                        content.push('            ' + line.trim());
                    }
                });
                content.push('        },');
                content.push('        ');
            }
            
            if (enemy.update) {
                content.push('        update(enemy, delta) {');
                const lines = enemy.update.toString().split('\n');
                lines.forEach((line, i) => {
                    if (i > 0 && i < lines.length - 1) {
                        content.push('            ' + line.trim());
                    }
                });
                content.push('        },');
                content.push('        ');
            }
            
            if (enemy.onDeath) {
                content.push('        onDeath(enemy) {');
                const lines = enemy.onDeath.toString().split('\n');
                lines.forEach((line, i) => {
                    if (i > 0 && i < lines.length - 1) {
                        content.push('            ' + line.trim());
                    }
                });
                content.push('        },');
                content.push('        ');
            }
            
            content.push('    }');
            
            if (index < enemyKeys.length - 1) {
                content[content.length - 1] += ',';
            }
        });
        
        // Add danger wave patterns and enemy selection
        content.push('};');
        content.push('');
        content.push('// Danger wave patterns with updated enemy names');
        content.push('export const DangerWavePatterns = [');
        // Add danger wave patterns here
        content.push('];');
        content.push('');
        content.push('// Enemy selection logic with updated type names');
        content.push('export const EnemySelection = {');
        content.push('};');
        
        return content.join('\n');
    }

    // Helper methods
    formatColorValue(color) {
        if (typeof color === 'number') {
            return `0x${color.toString(16).padStart(6, '0')}`;
        }
        return color;
    }

    formatValue(value) {
        if (typeof value === 'string') return `'${value}'`;
        if (typeof value === 'number' && value < 1 && value > 0) return value.toString();
        if (typeof value === 'number') return value;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'object') return JSON.stringify(value);
        return value;
    }

    getEnemyDescription(enemyType) {
        const descriptions = {
            crimsonSeeker: 'Basic red rushing enemy',
            amberTitan: 'Orange enemy with curved shield in front',
            astralOrbiter: 'Pink enemy with orbital projectiles',
            emeraldBow: 'Green arrow shooting enemy'
        };
        return descriptions[enemyType] || 'Enemy';
    }

    // Save changes to file
    async saveChanges() {
        try {
            const updatedContent = this.generateUpdatedFileContent();
            
            // Create backup
            const backupPath = this.configPath + '.backup.' + Date.now();
            await fs.promises.copyFile(this.configPath, backupPath);
            console.log(`Backup created: ${backupPath}`);
            
            // Apply current values from currentEnemyData
            Object.keys(currentEnemyData).forEach(enemyType => {
                if (EnemyTypes[enemyType]) {
                    const data = currentEnemyData[enemyType];
                    if (data.color !== undefined) EnemyTypes[enemyType].color = data.color;
                    if (data.radius !== undefined) EnemyTypes[enemyType].radius = data.radius;
                    if (data.attributes) EnemyTypes[enemyType].attributes = { ...data.attributes };
                }
            });
            
            // Write updated content
            await fs.promises.writeFile(this.configPath, updatedContent);
            console.log('EnemyTypes.js updated successfully');
            return true;
        } catch (error) {
            console.error('Error saving changes:', error);
            return false;
        }
    }

    // Validate hex color
    validateColor(color) {
        if (typeof color === 'string' && color.match(/^0x[0-9a-fA-F]{6}$/)) {
            return parseInt(color);
        }
        if (typeof color === 'number') {
            return color;
        }
        throw new Error('Invalid color format. Use format: 0xff4a4a');
    }

    // Validate radius
    validateRadius(radius) {
        const r = parseInt(radius);
        if (r >= 5 && r <= 50) {
            return r;
        }
        throw new Error('Radius must be between 5 and 50');
    }
}

// Web interface
if (typeof window !== 'undefined') {
    // Browser environment - create UI
    let originalEnemyData = null;
    let currentEnemyData = null;
    let editor = null;

    // Initialize with actual EnemyTypes data
    function initializeEditor() {
        try {
            editor = new EnemyEditor();
            
            // Load actual data
            originalEnemyData = editor.getEnemyConfiguration();
            currentEnemyData = JSON.parse(JSON.stringify(originalEnemyData));
            
            // Populate input fields
            document.getElementById('crimsonColor').value = editor.formatColorValue(originalEnemyData.crimsonSeeker.color);
            document.getElementById('crimsonRadius').value = originalEnemyData.crimsonSeeker.radius;
            document.getElementById('amberColor').value = editor.formatColorValue(originalEnemyData.amberTitan.color);
            document.getElementById('amberRadius').value = originalEnemyData.amberTitan.radius;
            document.getElementById('astralColor').value = editor.formatColorValue(originalEnemyData.astralOrbiter.color);
            document.getElementById('astralRadius').value = originalEnemyData.astralOrbiter.radius;
            document.getElementById('emeraldColor').value = editor.formatColorValue(originalEnemyData.emeraldBow.color);
            document.getElementById('emeraldRadius').value = originalEnemyData.emeraldBow.radius;
            
            updateStatus('Loaded actual enemy configuration from js/config/EnemyTypes.js', 'success');
            renderAllEnemies();
            
        } catch (error) {
            updateStatus(`Error loading configuration: ${error.message}. Make sure this is running through a web server and the path is correct.`, 'error');
            console.error('Initialization error:', error);
        }
    }

    function updateStatus(message, type = '') {
        const status = document.getElementById('status');
        if (status) {
            status.textContent = message;
            status.className = 'status' + (type ? ' ' + type : '');
        } else {
            console.log('Status:', message);
        }
    }

    function renderAllEnemies() {
        if (!window.renderEnemy || !currentEnemyData) return;
        
        window.renderEnemy('crimsonSeeker', 'crimson-canvas', currentEnemyData.crimsonSeeker);
        window.renderEnemy('amberTitan', 'amber-canvas', currentEnemyData.amberTitan);
        window.renderEnemy('astralOrbiter', 'astral-canvas', currentEnemyData.astralOrbiter);
        window.renderEnemy('emeraldBow', 'emerald-canvas', currentEnemyData.emeraldBow);
    }

    function updatePreview() {
        if (!editor || !currentEnemyData) return;
        
        try {
            // Update Crimson Seeker
            const crimsonColor = document.getElementById('crimsonColor').value;
            const crimsonRadius = parseInt(document.getElementById('crimsonRadius').value);
            currentEnemyData.crimsonSeeker.color = editor.validateColor(crimsonColor);
            currentEnemyData.crimsonSeeker.radius = editor.validateRadius(crimsonRadius);
            
            // Update Amber Titan
            const amberColor = document.getElementById('amberColor').value;
            const amberRadius = parseInt(document.getElementById('amberRadius').value);
            currentEnemyData.amberTitan.color = editor.validateColor(amberColor);
            currentEnemyData.amberTitan.radius = editor.validateRadius(amberRadius);
            
            // Update Astral Orbiter
            const astralColor = document.getElementById('astralColor').value;
            const astralRadius = parseInt(document.getElementById('astralRadius').value);
            currentEnemyData.astralOrbiter.color = editor.validateColor(astralColor);
            currentEnemyData.astralOrbiter.radius = editor.validateRadius(astralRadius);
            
            // Update Emerald Bow
            const emeraldColor = document.getElementById('emeraldColor').value;
            const emeraldRadius = parseInt(document.getElementById('emeraldRadius').value);
            currentEnemyData.emeraldBow.color = editor.validateColor(emeraldColor);
            currentEnemyData.emeraldBow.radius = editor.validateRadius(emeraldRadius);
            
            renderAllEnemies();
            updateStatus('Preview updated with your changes', 'success');
            
        } catch (error) {
            updateStatus(`Error updating preview: ${error.message}`, 'error');
        }
    }

    async function applyChanges() {
        if (!editor) return;
        
        try {
            updateStatus('Applying changes to js/config/EnemyTypes.js...', '');
            
            const success = await editor.saveChanges();
            if (success) {
                updateStatus('Changes applied successfully to js/config/EnemyTypes.js', 'success');
                
                // Update the original data reference since imports are cached
                originalEnemyData = editor.getEnemyConfiguration();
                
            } else {
                updateStatus('Failed to apply changes', 'error');
            }
        } catch (error) {
            updateStatus(`Error applying changes: ${error.message}`, 'error');
            console.error('Apply changes error:', error);
        }
    }

    // Make functions global for HTML access
    window.updatePreview = updatePreview;
    window.applyChanges = applyChanges;
    window.initializeEditor = initializeEditor;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnemyEditor;
}
