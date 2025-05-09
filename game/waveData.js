const WAVE_DATA = {
    1: [
        {
            enemies: {
                "DefaultEnemy": 1,
            }
        },
        {
            enemies: {
                "DefaultEnemy": 2,
            }
        },
        {
            enemies: {
                "DefaultEnemy": 4,
                "DefaultBoss": 1
            },
            special_instructions: () => {
                stopAllMusic();
                playMusic('boss_1', true, 0.25);
            }
        }
    ],

    2: [
        {
            enemies: {
                "ToxicGreen": 1,
            }
        },
        {
            power_scale: 1.5,
            enemies: {
                "DefaultEnemy": 1,
                "ToxicGreen": 1
            }
        },
        {
            enemies: {
                "DefaultEnemy": 1,
                "MiniBlue": 1
            }
        },
        {
            enemies: {
                "MiniBlue": 1,
                "ToxicGreen": 2,
                "DefaultEnemy": 3,
            }
        }
    ],

    3: [
        {
            enemies: {
                "ToxicGreen": 1,
            }
        },
        {
            enemies: {
                "ToxicGreen": 2,
            }
        },
        {
            enemies: {
                "ToxicGreen": 3,
            }
        }
    ],

    4: [
        {
            enemies: {
                "DefaultEnemy": 1,
                "MiniBlue": 1,
            },
            options: {
                hp_scale: 3,
                speed_scale: 0.5,
                size_scale: 2.5,
            },
        },
        {
            enemies: {
                "DefaultEnemy": 1,
                "MiniBlue": 3,
            },
            options: {
                hp_scale: 0.5,
                speed_scale: 2,
                size_scale: 0.75,
                dmg_scale: 0.5,
            }
        },
        {
            enemies: {
                "MiniBlue": 10,
            },
            options: {
                hp_scale: 0.01,
                speed_scale: 1,
                size_scale: 1,
                dmg_scale: 1,
            },
            special_instructions: () => {
                EnemySpawner.setSpawnRateForType(MiniBlue, 500);
            }
        },
    ],

    5: [
        {
            enemies: {
                "DefaultEnemy": 1,
            },
        },
        {
            enemies: {
                "Shrieker": 1,
                "DefaultEnemy": 1,
            },
        },
        {
            enemies: {
                "Ghost": 1,
                "ToxicGreen": 1,
            },
            
        },
        {
            enemies: {
                "Shrieker": 2,
                "Ghost": 1,
                "ToxicGreen": 1,
            },
            
        }
    ]
};

WAVE_DATA.level_instructions = {
    5: {
        onStart: () => {
            lighting.setDarknessOpacity(0.99);
            stopAndPlayMusic('creepy_3', true, 0.2);
            minimap.viewable = false;
        }
    }
};

function getWaveData(level, worldContainer) {
    if (!WAVE_DATA[level]) {
        console.error(`Wave data for level ${level} not found`);
        return null;
    }
    
    const waveConfigs = WAVE_DATA[level];
    const waves = waveConfigs.filter(item => !Array.isArray(item)).map(config => {
        return new Wave(
            config.options || {},  
            config.enemies,
            config.special_instructions || null
        );
    });
    
    // Get level-specific special instructions if they exist
    const special_instructions = WAVE_DATA.level_instructions[level] || {};

    return new Waves(worldContainer, waves, special_instructions);
}