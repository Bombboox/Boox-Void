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
                playMusic('music_boss', true, 0.25);
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
            }
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
    ]
};

function getWaveData(level, worldContainer) {
    if (!WAVE_DATA[level]) {
        console.error(`Wave data for level ${level} not found`);
        return null;
    }
    
    const waveConfigs = WAVE_DATA[level];
    const waves = waveConfigs.map(config => {
        return new Wave(
            config.options || {},  
            config.enemies,
            config.special_instructions || null
        );
    });
    
    return new Waves(worldContainer, waves);
}