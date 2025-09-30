// Enhanced Enemy Visualizer with all properties exposed
let originalData = null;
let currentData = null;
let serverStatus = 'loading';

// Color utilities
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexColorToInt(hex) {
    return parseInt(hex.replace('#', '0x'));
}

function intToHexColor(int) {
    // Handle both integer colors and hex colors
    if (typeof int === 'number') {
        return '0x' + int.toString(16).padStart(6, '0');
    } else if (typeof int === 'string' && int.startsWith('0x')) {
        return int;
    }
    return '0xff4a4a'; // fallback
}

function colorToHexString(color) {
    // Convert any color format to hex string
    if (typeof color === 'number') {
        return '0x' + color.toString(16).padStart(6, '0');
    } else if (typeof color === 'string' && color.startsWith('0x')) {
        return color;
    }
    return '0xff4a4a';
}

// Initialize the enhanced editor
async function initEnhancedEditor() {
    try {
        updateStatus('Loading enemy configuration from server...', '');
        
        // Check if server is running
        const serverCheck = await fetch('/api/enemies')
            .then(res => ({ status: res.status, ok: res.ok }))
            .catch(err => ({ status: 'error', ok: false }));
        
        if (!serverCheck.ok) {
            updateStatus('Server not running. Start with: node enemy-editor-server.js', 'error');
            serverStatus = 'offline';
            return;
        }
        
        serverStatus = 'online';
        
        // Load enemy data
        const response = await fetch('/api/enemies');
        const data = await response.json();
        
        console.log('Loaded enemy data:', data); // Debug log
        
        if (!data || Object.keys(data).length === 0) {
            updateStatus('No enemy data loaded from server', 'error');
            return;
        }
        
        originalData = JSON.parse(JSON.stringify(data));
        currentData = data;
        
        // Initialize enhanced form with current values
        initializeEnhancedForm();
        
        updateStatus('Loaded enemy configuration successfully', 'success');
        renderEnhancedEnemies();
        
    } catch (error) {
        updateStatus(`Error loading configuration: ${error.message}`, 'error');
        console.error('Init error:', error);
    }
}

function initializeEnhancedForm() {
    try {
        // Crimson Seeker
        if (currentData.crimsonSeeker) {
            document.getElementById('crimsonColor').value = intToHexColor(currentData.crimsonSeeker.color || 0xff4a4a);
            document.getElementById('crimsonColorPicker').value = intToHexColor(currentData.crimsonSeeker.color || 0xff4a4a);
            document.getElementById('crimsonGlowColor').value = intToHexColor(currentData.crimsonSeeker.glowColor || 0xff4a4a);
            document.getElementById('crimsonGlowColorPicker').value = intToHexColor(currentData.crimsonSeeker.glowColor || 0xff4a4a);
            document.getElementById('crimsonRadius').value = currentData.crimsonSeeker.radius || 10;
            document.getElementById('crimsonRadiusValue').textContent = currentData.crimsonSeeker.radius || 10;
        }
        
        // Amber Titan
        if (currentData.amberTitan) {
            document.getElementById('amberColor').value = intToHexColor(currentData.amberTitan.color || 0xffa64d);
            document.getElementById('amberColorPicker').value = intToHexColor(currentData.amberTitan.color || 0xffa64d);
            document.getElementById('amberRadius').value = currentData.amberTitan.radius || 10;
            document.getElementById('amberRadiusValue').textContent = currentData.amberTitan.radius || 10;
        }
        
        // Astral Orbiter
        if (currentData.astralOrbiter) {
            document.getElementById('astralColor').value = intToHexColor(currentData.astralOrbiter.color || 0xff7bd8);
            document.getElementById('astralColorPicker').value = intToHexColor(currentData.astralOrbiter.color || 0xff7bd8);
            document.getElementById('astralRadius').value = currentData.astralOrbiter.radius || 12;
            document.getElementById('astralRadiusValue').textContent = currentData.astralOrbiter.radius || 12;
        }
        
        // Emerald Bow
        if (currentData.emeraldBow) {
            document.getElementById('emeraldColor').value = intToHexColor(currentData.emeraldBow.color || 0x7dff88);
            document.getElementById('emeraldColorPicker').value = intToHexColor(currentData.emeraldBow.color || 0x7dff88);
            document.getElementById('emeraldRadius').value = currentData.emeraldBow.radius || 14;
            document.getElementById('emeraldRadiusValue').textContent = currentData.emeraldBow.radius || 14;
        }
    } catch (error) {
        console.error('Error initializing form:', error);
        updateStatus('Error initializing form: ' + error.message, 'error');
    }
}

function updateStatus(message, type = '') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = 'status' + (type ? ' ' + type : '');
}

function switchTab(tabElement, enemyType, tabName) {
    // Extract the prefix (e.g., "crimson", "amber", "astral", "emerald") from the full enemy type
    let prefix = '';
    if (enemyType.startsWith('crimson')) prefix = 'crimson';
    else if (enemyType.startsWith('amber')) prefix = 'amber';
    else if (enemyType.startsWith('astral')) prefix = 'astral';
    else if (enemyType.startsWith('emerald')) prefix = 'emerald';

    // Hide all tab content for this enemy
    document.querySelectorAll(`#${prefix}-tab-visual, #${prefix}-tab-stats, #${prefix}-tab-effects, #${prefix}-tab-advanced`).forEach(tabContent => {
        tabContent.classList.remove('active');
    });

    // Remove active class from all tab buttons for this enemy
    document.querySelectorAll(`#${prefix}-controls .tab`).forEach(tabBtn => {
        tabBtn.classList.remove('active');
    });

    // Show selected tab content
    const selectedTab = document.getElementById(`${prefix}-tab-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Activate selected tab button
    if (tabElement) {
        tabElement.classList.add('active');
    }
}

function syncColorPicker(enemy, property) {
    const textInput = document.getElementById(`${enemy}${property.charAt(0).toUpperCase() + property.slice(1)}`);
    const colorPicker = document.getElementById(`${enemy}${property.charAt(0).toUpperCase() + property.slice(1)}Picker`);
    
    try {
        const colorValue = hexColorToInt(textInput.value);
        const rgbColor = hexToRgb(textInput.value);
        colorPicker.value = textInput.value;
        
        // Update current data
        if (property === 'color' || property === 'glowColor') {
            currentData[enemy][property] = colorValue;
        }
        
        renderEnhancedEnemies();
    } catch (error) {
        console.error('Color sync error:', error);
        textInput.value = intToHexColor(currentData[enemy][property] || 0xff0000);
    }
}

function syncTextInput(enemy, property) {
    const textInput = document.getElementById(`${enemy}${property.charAt(0).toUpperCase() + property.slice(1)}`);
    const colorPicker = document.getElementById(`${enemy}${property.charAt(0).toUpperCase() + property.slice(1)}Picker`);
    
    textInput.value = colorPicker.value;
    
    try {
        const colorValue = hexColorToInt(colorPicker.value);
        
        // Update current data
        if (property === 'color' || property === 'glowColor') {
            currentData[enemy][property] = colorValue;
        }
        
        renderEnhancedEnemies();
    } catch (error) {
        console.error('Color sync error:', error);
    }
}

function updateSliderDisplay(enemy, property) {
    const slider = document.getElementById(`${enemy}${property.charAt(0).toUpperCase() + property.slice(1)}`);
    const display = document.getElementById(`${enemy}${property.charAt(0).toUpperCase() + property.slice(1)}Value`);
    
    let value = parseFloat(slider.value);
    
    // Format based on property type
    if (property === 'damage') {
        display.textContent = Math.round(value) + '%';
    } else if (value % 1 === 0) {
        display.textContent = value.toString();
    } else {
        display.textContent = value.toFixed(1);
    }
    
    // Update current data
    if (property === 'radius' || property === 'health' || property === 'speed' || 
        property === 'glowDistance' || property === 'glowStrength' || 
        property === 'opacity' || property === 'mass' || property === 'pitch') {
        currentData[enemy][property] = value;
    }
    
    renderEnhancedEnemies();
}

function renderEnhancedEnemy(enemyType, containerId) {
    const container = document.getElementById(containerId);

    // Check if container exists
    if (!container) {
        console.error(`Container with ID ${containerId} not found`);
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    const canvas = document.createElement('canvas');
    const size = 180;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const centerX = size / 2;
    const centerY = size / 2;

    // Clear and set background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, size, size);

    const data = currentData[enemyType];
    if (!data) {
        console.error(`No data found for enemy type: ${enemyType}`);
        return;
    }

    // Use the actual game rendering logic to match the real enemy appearance
    const mainColor = data.color || 0xff4a4a;
    const glowColor = data.glowColor || data.color || 0xff4a4a;
    const radius = data.radius || 10;

    const r = (mainColor >> 16) & 0xff;
    const g = (mainColor >> 8) & 0xff;
    const b = mainColor & 0xff;

    const glowR = (glowColor >> 16) & 0xff;
    const glowG = (glowColor >> 8) & 0xff;
    const glowB = glowColor & 0xff;

    // Render based on actual game enemy types - faithful to the PIXI.Graphics rendering
    switch(enemyType) {
        case 'crimsonSeeker':
            // Simple red circle with glow - matches the actual game rendering
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1.0)`;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // Add glow effect
            for (let i = 0; i < 3; i++) {
                const glowRadius = radius + 8 + i * 2;
                const gradient = ctx.createRadialGradient(centerX, centerY, radius, centerX, centerY, glowRadius);
                gradient.addColorStop(0, `rgba(${glowR}, ${glowG}, ${glowB}, ${0.3 - i * 0.1})`);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case 'amberTitan':
            // Orange circle with shield arc - matches the actual game rendering
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1.0)`;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // Shield arc in front (facing towards core)
            ctx.strokeStyle = `rgba(${glowR}, ${glowG}, ${glowB}, 1.0)`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX - 8, centerY, 22, -Math.PI * 0.4, Math.PI * 0.4);
            ctx.stroke();

            // Shield connecting lines
            ctx.beginPath();
            ctx.moveTo(centerX - 8, centerY - 4.8);
            ctx.lineTo(centerX - 2, centerY - 2);
            ctx.moveTo(centerX - 8, centerY + 4.8);
            ctx.lineTo(centerX - 2, centerY + 2);
            ctx.stroke();

            // Add glow effect
            for (let i = 0; i < 2; i++) {
                const glowRadius = radius + 6 + i * 2;
                const gradient = ctx.createRadialGradient(centerX, centerY, radius, centerX, centerY, glowRadius);
                gradient.addColorStop(0, `rgba(${glowR}, ${glowG}, ${glowB}, ${0.4 - i * 0.2})`);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case 'astralOrbiter':
            // Pink circle with white details - matches the actual game rendering
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.85)`;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // White inner circle
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
            ctx.stroke();

            // Cross lines
            ctx.beginPath();
            ctx.moveTo(centerX - 4, centerY);
            ctx.lineTo(centerX + 4, centerY);
            ctx.moveTo(centerX, centerY - 4);
            ctx.lineTo(centerX, centerY + 4);
            ctx.stroke();

            // Add glow effect
            for (let i = 0; i < 2; i++) {
                const glowRadius = radius + 10 + i * 2;
                const gradient = ctx.createRadialGradient(centerX, centerY, radius, centerX, centerY, glowRadius);
                gradient.addColorStop(0, `rgba(${glowR}, ${glowG}, ${glowB}, ${0.3 - i * 0.15})`);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case 'emeraldBow':
            // Green bow shape - matches the actual game rendering
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 1.0)`;
            ctx.lineWidth = 3;

            // Left bow limb with sharp recurve tip
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - 12);
            ctx.quadraticCurveTo(centerX - 6, centerY - 10, centerX - 4, centerY - 6);
            ctx.quadraticCurveTo(centerX - 2, centerY - 3, centerX, centerY);
            ctx.stroke();

            // Right bow limb with sharp recurve tip
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.quadraticCurveTo(centerX - 2, centerY + 3, centerX - 4, centerY + 6);
            ctx.quadraticCurveTo(centerX - 6, centerY + 10, centerX, centerY + 12);
            ctx.stroke();

            // Sharp recurve tips
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - 12);
            ctx.lineTo(centerX - 2, centerY - 14);
            ctx.lineTo(centerX + 1, centerY - 13);
            ctx.moveTo(centerX, centerY + 12);
            ctx.lineTo(centerX - 2, centerY + 14);
            ctx.lineTo(centerX + 1, centerY + 13);
            ctx.stroke();

            // Bow string (taut)
            ctx.strokeStyle = 'rgba(159, 255, 159, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - 12);
            ctx.lineTo(centerX, centerY + 12);
            ctx.stroke();

            // Ammo indicators (3 circles)
            ctx.fillStyle = 'rgba(200, 255, 213, 1.0)';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(centerX - 15 - (i * 5), centerY, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Add glow effect
            for (let i = 0; i < 2; i++) {
                const glowRadius = 20 + i * 3;
                const gradient = ctx.createRadialGradient(centerX, centerY, 15, centerX, centerY, glowRadius);
                gradient.addColorStop(0, `rgba(${glowR}, ${glowG}, ${glowB}, ${0.4 - i * 0.2})`);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
    }

    // Add enemy type indicator
    const previewText = document.createElement('div');
    previewText.className = 'enemy-preview';
    previewText.textContent = enemyType.replace(/([A-Z])/g, ' $1').trim();
    container.appendChild(canvas);
    container.appendChild(previewText);
}

function renderEnhancedEnemies() {
    renderEnhancedEnemy('crimsonSeeker', 'crimson-canvas');
    renderEnhancedEnemy('amberTitan', 'amber-canvas');
    renderEnhancedEnemy('astralOrbiter', 'astral-canvas');
    renderEnhancedEnemy('emeraldBow', 'emerald-canvas');
}

function updatePreview(enemyType) {
    // Read ALL current form values and apply them to current data
    try {
        let prefix = '';
        if (enemyType.startsWith('crimson')) prefix = 'crimson';
        else if (enemyType.startsWith('amber')) prefix = 'amber';
        else if (enemyType.startsWith('astral')) prefix = 'astral';
        else if (enemyType.startsWith('emerald')) prefix = 'emerald';

        if (!currentData[enemyType]) {
            currentData[enemyType] = {};
        }

        // Read ALL form values for this enemy type
        // Visual properties
        const colorElement = document.getElementById(prefix + 'Color');
        const glowColorElement = document.getElementById(prefix + 'GlowColor');
        const radiusElement = document.getElementById(prefix + 'Radius');

        if (colorElement) currentData[enemyType].color = hexColorToInt(colorElement.value);
        if (glowColorElement) currentData[enemyType].glowColor = hexColorToInt(glowColorElement.value);
        if (radiusElement) currentData[enemyType].radius = Math.max(5, parseFloat(radiusElement.value));

        // Stats properties
        const healthElement = document.getElementById(prefix + 'Health');
        const speedElement = document.getElementById(prefix + 'Speed');
        const damageElement = document.getElementById(prefix + 'Damage');

        if (healthElement) currentData[enemyType].health = parseFloat(healthElement.value);
        if (speedElement) currentData[enemyType].speed = parseFloat(speedElement.value);
        if (damageElement) currentData[enemyType].coreDamagePercent = parseFloat(damageElement.value) / 100;

        // Effects properties
        const weightElement = document.getElementById(prefix + 'Weight');
        const glowDistanceElement = document.getElementById(prefix + 'GlowDistance');
        const glowStrengthElement = document.getElementById(prefix + 'GlowStrength');

        if (weightElement) currentData[enemyType].weight = parseInt(weightElement.value);
        if (glowDistanceElement) currentData[enemyType].glowDistance = parseFloat(glowDistanceElement.value);
        if (glowStrengthElement) currentData[enemyType].glowStrength = parseFloat(glowStrengthElement.value);

        // Advanced properties
        const aggressionElement = document.getElementById(prefix + 'Aggression');
        const intelligenceElement = document.getElementById(prefix + 'Intelligence');

        if (aggressionElement) currentData[enemyType].aggression = parseFloat(aggressionElement.value);
        if (intelligenceElement) currentData[enemyType].intelligence = parseFloat(intelligenceElement.value);

        // Enemy-specific properties
        if (prefix === 'amber') {
            const crackLinesElement = document.getElementById('amberCrackLines');
            const shieldThicknessElement = document.getElementById('amberShieldThickness');
            const crackOpacityElement = document.getElementById('amberCrackOpacity');
            const armorElement = document.getElementById('amberArmor');
            const regenElement = document.getElementById('amberRegen');

            if (crackLinesElement) currentData[enemyType].crackLines = parseInt(crackLinesElement.value);
            if (shieldThicknessElement) currentData[enemyType].shieldThickness = parseInt(shieldThicknessElement.value);
            if (crackOpacityElement) currentData[enemyType].crackOpacity = parseFloat(crackOpacityElement.value);
            if (armorElement) currentData[enemyType].armor = parseFloat(armorElement.value);
            if (regenElement) currentData[enemyType].shieldRegen = parseFloat(regenElement.value);
        }

        if (prefix === 'astral') {
            const ringThicknessElement = document.getElementById('astralRingThickness');
            const opacityElement = document.getElementById('astralOpacity');
            const inwardElement = document.getElementById('astralInward');
            const angularElement = document.getElementById('astralAngular');
            const cooldownElement = document.getElementById('astralCooldown');
            const timerElement = document.getElementById('astralTimer');

            if (ringThicknessElement) currentData[enemyType].ringThickness = parseInt(ringThicknessElement.value);
            if (opacityElement) currentData[enemyType].opacity = parseFloat(opacityElement.value);
            if (inwardElement) currentData[enemyType].inwardSpeed = parseFloat(inwardElement.value);
            if (angularElement) currentData[enemyType].angularSpeed = parseFloat(angularElement.value);
            if (cooldownElement) currentData[enemyType].projectileCooldown = parseInt(cooldownElement.value);
            if (timerElement) currentData[enemyType].shootTimer = parseInt(timerElement.value);
        }

        if (prefix === 'emerald') {
            const ammoElement = document.getElementById('emeraldAmmo');
            const intervalElement = document.getElementById('emeraldInterval');
            const arrowSpeedElement = document.getElementById('emeraldArrowSpeed');
            const curveElement = document.getElementById('emeraldCurve');
            const stringThicknessElement = document.getElementById('emeraldStringThickness');
            const precisionElement = document.getElementById('emeraldPrecision');
            const recoilElement = document.getElementById('emeraldRecoil');

            if (ammoElement) currentData[enemyType].maxAmmo = parseInt(ammoElement.value);
            if (intervalElement) currentData[enemyType].shootInterval = parseInt(intervalElement.value);
            if (arrowSpeedElement) currentData[enemyType].arrowSpeed = parseFloat(arrowSpeedElement.value);
            if (curveElement) currentData[enemyType].curve = parseFloat(curveElement.value);
            if (stringThicknessElement) currentData[enemyType].stringThickness = parseFloat(stringThicknessElement.value);
            if (precisionElement) currentData[enemyType].precision = parseFloat(precisionElement.value);
            if (recoilElement) currentData[enemyType].recoil = parseFloat(recoilElement.value);
        }

        // Now re-render with the updated data
        renderEnhancedEnemies();
        updateStatus('Preview updated with ALL current form values', 'success');
        console.log('Updated enemy data:', currentData[enemyType]);

    } catch (error) {
        console.error('Error updating preview:', error);
        renderEnhancedEnemies(); // Fallback to current data
        updateStatus('Preview updated (using fallback)', 'success');
    }
}

function randomizeEnemy(enemyType) {
    // Randomize properties within reasonable ranges
    currentData[enemyType] = {
        ...currentData[enemyType],
        color: Math.floor(Math.random() * 0xffffff),
        glowColor: Math.floor(Math.random() * 0xffffff),
        radius: Math.floor(Math.random() * 30) + 10,
        glowDistance: Math.floor(Math.random() * 25),
        glowStrength: Math.random() * 2 + 0.5,
        health: Math.random() * 8 + 1,
        speed: Math.random() * 6 + 1,
        damage: Math.random() * 0.4 + 0.05,
        mass: Math.random() * 3 + 0.5
    };
    
    // Update form to reflect changes
    initializeEnhancedForm();
    renderEnhancedEnemies();
    updateStatus('Enemy randomized!', 'success');
}

function resetEnemy(enemyType) {
    currentData[enemyType] = originalData[enemyType];
    initializeEnhancedForm();
    renderEnhancedEnemies();
    updateStatus('Enemy reset to original!', 'success');
}

function applyAllChanges() {
    // This would collect all form data and apply changes to the server
    updateStatus('Applying all changes to js/config/EnemyTypes.js...', '');
    
    // For now, show what would be applied
    const changes = {
        crimsonSeeker: currentData.crimsonSeeker,
        amberTitan: currentData.amberTitan,
        astralOrbiter: currentData.astralOrbiter,
        emeraldBow: currentData.emeraldBow
    };
    
    console.log('Changes that would be applied:', changes);
    
    // Apply via API
    fetch('/api/enemies/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(changes)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            updateStatus('All changes applied successfully!', 'success');
            originalData = JSON.parse(JSON.stringify(currentData));
        } else {
            updateStatus('Failed to apply changes', 'error');
        }
    })
    .catch(error => {
        updateStatus(`Error applying changes: ${error.message}`, 'error');
        console.error('Apply all error:', error);
    });
}

// Enhanced server response handling
async function loadEnhancedEnemyTypes() {
    try {
        const response = await fetch('/api/enemies');
        const enemies = await response.json();
        
        // Enhance with additional properties
        Object.keys(enemies).forEach(enemyType => {
            enemies[enemyType] = {
                ...enemies[enemyType],
                // Add enhanced properties
                opacity: 1.0,
                trailColor: enemies[enemyType].color,
                trail: true,
                particles: true,
                weight: enemyType === 'crimsonSeeker' ? 6 : enemyType === 'amberTitan' ? 2 : enemyType === 'astralOrbiter' ? 1 : 1,
                aggression: 0.8,
                pitch: 1.0,
                mass: 1.0,
                crackLines: 4,
                shieldThickness: 3,
                regen: 0,
                shieldRegen: 0,
                armored: true,
                spark: true,
                ringColor: 0xffffff,
                innerStrength: 0.8,
                reachDistance: 0.95,
                maxAmmo: 3,
                shootSpeed: 3.5,
                ammoRegen: 0,
                precision: 0.85,
                recoil: 0.2,
                pierce: false,
                explosive: false,
                damageType: 'normal'
            };
        });
        
        return enemies;
    } catch (error) {
        console.error('Error loading enhanced enemy types:', error);
        throw error;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Override the original init function
    window.initEditor = initEnhancedEditor;
    initEnhancedEditor();
});
