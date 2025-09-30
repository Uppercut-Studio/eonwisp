// Enhanced Enemy Configuration System
export const EnemyTypes = {
    // CRIMSON SEEKER
    crimsonSeeker: {
        name: 'Crimson Seeker',
        color: 16730698,
        glowColor: 16730698,
        radius: 20,
        
        attributes: {
            health: 1,
            speed: 2.2,
            coreDamagePercent: 0.05,
            glowDistance: 12,
            glowStrength: 0.5
        }
    },

    // AMBER TITAN
    amberTitan: {
        name: 'Amber Titan',
        color: 16754253,
        glowColor: 16754253,
        radius: 32,
        
        attributes: {
            health: 3,
            speed: 1.35,
            coreDamagePercent: 0.15,
            glowDistance: 12,
            glowStrength: 1.2
        }
    },

    // ASTRAL ORBITER
    astralOrbiter: {
        name: 'Astral Orbiter',
        color: 16743384,
        glowColor: 16743384,
        radius: 19,
        
        attributes: {
            health: 1.8,
            inwardSpeed: 0.8,
            angularSpeed: 0.045,
            shootTimer: 47,
            projectileCooldown: 81,
            coreDamagePercent: 0.12,
            glowDistance: 14,
            glowStrength: 1.2
        }
    },

    // EMERALD BOW
    emeraldBow: {
        name: 'Emerald Bow',
        color: 8257416,
        glowColor: 8257416,
        radius: 23,
        
        attributes: {
            health: 2.5,
            maxAmmo: 3,
            shootInterval: 120,
            arrowSpeed: 3.5,
            coreDamagePercent: 0.18,
            glowDistance: 12,
            glowStrength: 1.3
        }
    }
};

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
        
        return 'crimsonSeeker';
    }
};
