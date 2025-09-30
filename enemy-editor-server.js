// Enemy Editor Server
// This server loads your actual EnemyTypes.js and applies changes back to it

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Load EnemyTypes.js and parse it
async function loadEnemyTypes() {
    try {
        const filePath = path.join(__dirname, 'js/config/EnemyTypes.js');
        const content = await fs.readFile(filePath, 'utf8');
        
        console.log('File content length:', content.length); // Debug log
        console.log('First 500 chars:', content.substring(0, 500)); // Debug log
        
        // Extract enemy data using improved regex that handles both integer and hex colors
        const enemies = {};
        
        // Pattern to match each enemy object - handles both quoted and unquoted names
        const enemyPattern = /(\w+):\s*\{[\s\S]*?name:\s*(?:['"]?)([^'",\s]+)(?:['"]?)[\s\S]*?color:\s*([^,\s]+)[\s\S]*?glowColor:\s*([^,\s]+)[\s\S]*?radius:\s*([^,\s]+)/g;
        
        let match;
        let count = 0;
        while ((match = enemyPattern.exec(content)) !== null) {
            count++;
            const enemyType = match[1];
            const name = match[2];
            const colorStr = match[3].trim();
            const glowColorStr = match[4].trim();
            const radiusStr = match[5].trim();
            
            console.log(`Found enemy ${count}:`, enemyType, name, colorStr, glowColorStr, radiusStr);
            
            // Parse color (handle both hex and integer formats)
            let color, glowColor;
            try {
                color = colorStr.startsWith('0x') ? parseInt(colorStr) : parseInt(colorStr);
                glowColor = glowColorStr.startsWith('0x') ? parseInt(glowColorStr) : parseInt(glowColorStr);
            } catch (e) {
                console.error(`Error parsing colors for ${enemyType}:`, e);
                color = 0xff4a4a;
                glowColor = 0xff4a4a;
            }
            
            // Parse radius
            let radius;
            try {
                radius = parseInt(radiusStr);
            } catch (e) {
                console.error(`Error parsing radius for ${enemyType}:`, e);
                radius = 10;
            }
            
            enemies[enemyType] = {
                name,
                color,
                glowColor,
                radius
            };
            
            console.log(`Parsed ${enemyType}:`, enemies[enemyType]);
        }
        
        console.log(`Total enemies found: ${count}`);
        console.log('Final enemies object:', enemies);
        
        return enemies;
    } catch (error) {
        console.error('Error loading EnemyTypes.js:', error);
        throw error;
    }
}

// Update EnemyTypes.js with new values
async function updateEnemyTypes(updates) {
    try {
        const filePath = path.join(__dirname, 'js/config/EnemyTypes.js');
        let content = await fs.readFile(filePath, 'utf8');
        
        // Create backup
        const backupPath = filePath + '.backup.' + Date.now();
        await fs.copyFile(filePath, backupPath);
        console.log(`Backup created: ${backupPath}`);
        
        // Apply updates
        for (const [enemyType, properties] of Object.entries(updates)) {
            for (const [property, value] of Object.entries(properties)) {
                const regex = new RegExp(`(${enemyType}:\\s*\\{[\\s\\S]*?${property}:\\s*)(0x[0-9a-fA-F]+|\\d+)([\\s\\S]*?\\})`);
                const replacement = `$1${value}$3`;
                content = content.replace(regex, replacement);
            }
        }
        
        // Write updated content
        await fs.writeFile(filePath, content);
        console.log('EnemyTypes.js updated successfully');
        return true;
    } catch (error) {
        console.error('Error updating EnemyTypes.js:', error);
        throw error;
    }
}

// API endpoints
app.get('/api/enemies', async (req, res) => {
    try {
        const enemies = await loadEnemyTypes();
        res.json(enemies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/enemies/update', async (req, res) => {
    try {
        const updates = req.body;
        await updateEnemyTypes(updates);
        res.json({ success: true, message: 'Enemies updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve the enhanced visualizer
app.get('/editor', (req, res) => {
    res.sendFile(path.join(__dirname, 'enemy-visualizer-enhanced.html'));
});

// Serve the enhanced JavaScript
app.get('/enemy-visualizer-enhanced.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'enemy-visualizer-enhanced.js'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Enemy Editor Server running at http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT}/editor to access the visualizer`);
});

module.exports = { loadEnemyTypes, updateEnemyTypes };
