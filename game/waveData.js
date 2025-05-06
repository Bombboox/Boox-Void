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
            config.power_scale || 1.0,
            config.enemies,
            config.special_instructions || null
        );
    });
    
    return new Waves(worldContainer, waves);
}