const WAVE_DATA = {
    0: [
        {
            options: {
                special_condition: () => {
                    return false;
                },
                fake_wake: true,
            },
            special_instructions: async () => {
                activeDialogue.showDialogue({
                    text: "Hello, hello? I hope you're getting this message, if this damn transmitter is working. You see the keyboard in front of you? Go ahead and hit spacebar if you can hear me.",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_bored.png" })),
                });
                activeDialogue.showDialogue({
                    text: "Alright, I got your signal so I guess you can hear me... Cool, I guess I should get started huh. So umm, yeah, congratulations on becoming a commander, my name is Sophia and I'll be your assistant on missions... so you don't die and stuff.",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_bored.png" })),
                });
                activeDialogue.showDialogue({
                    text: "So yeah, before we get started, I'll give you a little rundown of your controls. Pretty basic sh*t but, you know, procedures and whatnot.",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_grin.png" })),
                });
                activeDialogue.showDialogue({
                    text: "Let's practice moving around. Hit WASD on the keyboard in front of you.",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_bored.png" })),
                    special_condition: () => {
                        return keyboard["w"] || keyboard["a"] || keyboard["s"] || keyboard["d"];
                    }
                });
                activeDialogue.showDialogue({
                    text: "Good job, dude, you're a prodigy. Alright now, try hitting that mouse button, it'll fire your cannon.",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_bored.png" })),
                    special_condition: () => {
                        return player.cannons[0].cooldown > 0;
                    }
                });
                activeDialogue.showDialogue({
                    text: "Ok sweet.",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_bored.png" })),
                });
                activeDialogue.showDialogue({
                    text: "Now let's practice shooting, I'm gonna release a bad guy, and you're gonna shoot at him, so good luck...",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_bored.png" })),
                });
                activeDialogue.showDialogue({
                    text: "Be careful, little buddy!",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_pleading.png" })),
                    special_condition: () => {
                        return activeDialogue.globalTimer >= 2000;
                    },
                    onEnd: () => {
                        currentWaves.trigger_next_wave();
                    }
                });
            }
        },
        {
            special_instructions: () => {
                player.camera.queueCommands(
                    player.camera.lerpTo(enemies.find(e => e instanceof DefaultEnemySpawner).position, 1000, 'easeInOut'),
                    player.camera.shake_camera(1000, 150, 1.5, 1.2),
                    player.camera.lerpTo(player, 1000, 'easeInOut')
                );
            },
            enemies: {
                "DefaultEnemy": 1,
            }
        },
        {
            options: {
                special_condition: () => {
                    return false;
                },
                fake_wake: true,
            },
            special_instructions: async () => {
                activeDialogue.showDialogue({
                    text: "Nice, alright yeah so, that's pretty much it for your training. I wish you the best on your future missions, of course I'll be there to help you out and stuff.",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_bored.png" })),
                });
                activeDialogue.showDialogue({
                    text: "I'll see you then, bye bye.",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_default.png" })),
                    onEnd: () => {
                        currentWaves.trigger_next_wave();
                    }
                });
            }
        }
    ],
    
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
            options: {
                fake_wake: true,
                special_condition: () => {
                    return false;
                },
            },
            special_instructions: async () => {
                activeDialogue.showDialogue({
                    text: "Dude, I am detecting a massive wave incoming.",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_bored.png" })),
                });
                activeDialogue.showDialogue({
                    text: "Take out the little ones first so you can focus on the big guy.",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_bored.png" })),
                });
                activeDialogue.showDialogue({
                    text: "Be careful, alright?",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_bored.png" })),
                    special_condition: () => {
                        return activeDialogue.globalTimer >= 2000;
                    },
                    onEnd: () => {
                        currentWaves.trigger_next_wave();
                    }
                });
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
        },
        {
            options: {
                fake_wake: true,
                special_condition: () => {
                    return false;
                },
            },
            special_instructions: async () => {
                activeDialogue.showDialogue({
                    text: "Woah! That was f*cking awesome!",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_default.png" })),
                });
                activeDialogue.showDialogue({
                    text: "Nice shooting, boss!",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_grin.png" })),
                    onEnd: () => {
                        currentWaves.trigger_next_wave();
                    }
                });
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
            special_instructions: async () => {
                activeDialogue.showDialogue({
                    text: "Commander? I can't see anything, are you there?",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_bored.png" })),
                    special_condition: () => {
                        return activeDialogue.globalTimer >= 2000;
                    },
                });
                activeDialogue.showDialogue({
                    text: "Sh*t, I'm losing my sig-",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_pleading.png" })),
                    special_condition: () => {
                        return activeDialogue.globalTimer >= 2000;
                    },
                });
            },
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
    ],

    5.5: [

    ],

    6: [
        {
            enemies: {
                "DefaultEnemy": 1,
            },
            options: {
                hp_scale: 5,
                speed_scale: 2,
                size_scale: 2.5,
                dmg_scale: 2,
            }
        },
        {
            enemies: {
                "Ghost": 2,
                "ToxicGreen": 1,
            },
            options: {
                hp_scale: 5,
                speed_scale: 2,
                size_scale: 1.5,
                dmg_scale: 2,
            }
        },
        {
            enemies: {
                "Ghost": 3,
                "ToxicGreen": 2,
                "DefaultEnemy": 1,
            },
            options: {
                hp_scale: 5,
                speed_scale: 2,
                size_scale: 1.5,
                dmg_scale: 2,
            },
            special_instructions: () => {
                EnemySpawner.setSpawnRateForType(Ghost, 1500);
            }
        }
    ],

    7: [
        {
            options: {
                fake_wake: true,
                special_condition: () => {
                    return false;
                },
            },
            special_instructions: async () => {
                activeDialogue.showDialogue({
                    text: "HEY, BE ALERT! I'm detecting a bigger wave than ever.",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_bored.png" })),
                });
                activeDialogue.showDialogue({
                    text: "It seems like they're being drawn to something... be careful.",
                    sprite: new PIXI.Sprite(await PIXI.Assets.load({ src: "./sprites/sophia_bored.png" })),
                    special_condition: () => {
                        return activeDialogue.globalTimer >= 2000;
                    },
                    onEnd: () => {
                        currentWaves.trigger_next_wave();
                    }
                });
            },
        },
        {
            enemies: {
                "DefaultEnemy": 10000,
                "MiniBlue": 10000,
                "ToxicGreen": 10000,
                "Ghost": 1,
            },
            special_instructions: () => {
                const ghostSpawner = findEnemy("GhostSpawner");
                const defaultSpawners = findAllEnemies("DefaultEnemySpawner");
                const miniBlueSpawners = findAllEnemies("MiniBlueSpawner");
                const toxicGreenSpawners = findAllEnemies("ToxicGreenSpawner");

                if(ghostSpawner) {
                    ghostSpawner.hp_scale = 250;
                    ghostSpawner.speed_scale = 0.6;
                    ghostSpawner.dmg_scale = 10;
                    ghostSpawner.size_scale = 3;
                    ghostSpawner.boss = true;
                }

                for(let i = 0; i < defaultSpawners.length; i++) {
                    defaultSpawners[i].spawn_rate = 3500;
                }   

                for(let i = 0; i < miniBlueSpawners.length; i++) {
                    miniBlueSpawners[i].spawn_rate = 10000;
                }

                for(let i = 0; i < toxicGreenSpawners.length; i++) {
                    toxicGreenSpawners[i].spawn_rate = 7500;
                }
            }
        }
    ],

    8: [
        {
            special_instructions: () => {
                const defaultSpawner = findEnemy("DefaultEnemySpawner");

                if(defaultSpawner) {
                    defaultSpawner.addProperty("fireTimer", 0);
                    defaultSpawner.addProperty("fireRate", 2000);
                    defaultSpawner.addFunction(function(deltaTime, worldContainer) {
                        this.fireTimer += deltaTime;
                        if (this.fireTimer >= this.fireRate) {
                            const angle = getAngleTowardsPlayer(this.position);
                            
                            const bullet = new DefaultBullet({
                                x: this.position.x + this.width / 2,
                                y: this.position.y + this.height / 2,
                                damage: this.dmg,
                                angle: angle,
                                worldContainer: worldContainer,
                                speed: 0.5,
                                color: 0xffffff,
                                enemy_bullet: true,
                                radius: 10
                            });
                            enemy_bullets.push(bullet);
                            this.fireTimer = 0;
                        }
                    });
                }

                EnemySpawner.setPropertyForAll({
                    hp_scale: 7.5,
                    speed_scale: 1.5,
                    dmg_scale: 2,
                });

                EnemySpawner.setPropertyForType("MiniBlueSpawner", {
                    speed_scale: 1,
                    hp_scale: 4
                });
            },
            enemies: {
                "Ghost": 1,
                "ToxicGreen": 1
            },
        },
        {
            enemies: {
                "Ghost": 1,
                "MiniBlue": 1,
                "DefaultEnemy": 1,
            },
        },
        {
            enemies: {
                "Ghost": 2,
                "ToxicGreen": 1,
                "MiniBlue": 1,
                "DefaultEnemy": 3,
            },
        },
    ]
};

WAVE_DATA.level_instructions = {
    0: {
        onStart: () => {
            stopAndPlayMusic("chill_5", true, 0.3);
        }
    },

    5: {
        onStart: () => {
            lighting.setDarknessOpacity(0.99);
            stopAndPlayMusic('creepy_3', true, 0.4);
            minimap.viewable = false;
        }
    },

    5.5: {
        survival: {
            enemyCount: 2,
            enemyTypes: {
                "DefaultEnemy": 1,
                "MiniBlue": 0.8,
                "ToxicGreen": 0.5,
                "Shrieker": 0.3,
                "Ghost": 0.3,
                "DefaultBoss": 0.01,
            }
        }
    },
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