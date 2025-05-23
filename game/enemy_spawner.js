class EnemySpawner {
    constructor(options = {}) {
        this.position = vector(options.x || 0, options.y || 0); 
        this.enemy_type = options.enemy_type;
        this.spawn_rate = options.spawn_rate || 3000;
        this.spawn_radius = options.spawn_radius || 0;
        this.last_spawn_time = 0;
        this.spawns_remaining = options.spawns_remaining || 0;
        this.hp_scale = options.hp_scale || 1;
        this.dmg_scale = options.dmg_scale || 1;
        this.speed_scale = options.speed_scale || 1;
        this.size_scale = options.size_scale || 1;
        this.boss = options.boss || false;
        this.additionalFunctions = [];
        this.additionalProperties = {};
    }

    addFunction(func) {
        this.additionalFunctions.push(func);
    }

    addProperty(name, value) {
        this.additionalProperties[name] = value;
    }

    spawn(worldContainer) {
        let enemy = new this.enemy_type({
            x: this.position.x,
            y: this.position.y,
            worldContainer: worldContainer,
            scales: {
                hp: this.hp_scale,
                dmg: this.dmg_scale,
                speed: this.speed_scale,
                size: this.size_scale
            },
            boss: this.boss
        });

        // Add additional properties
        for (const [key, value] of Object.entries(this.additionalProperties)) {
            enemy[key] = value;
        }

        // Add additional functions to enemy's update
        if (this.additionalFunctions.length > 0) {
            const originalUpdate = enemy.update;
            enemy.update = function(deltaTime, worldContainer) {
                // Call all additional functions first
                for (const func of this.additionalFunctions) {
                    func.call(this, deltaTime, worldContainer);
                }
                // Then call original update
                originalUpdate.call(this, deltaTime, worldContainer);
            };
            enemy.additionalFunctions = this.additionalFunctions;
        }

        enemy.refreshGraphics();

        if (enemy.isGraphicsInitialized) {
            enemy.graphics.position.set(this.position.x, this.position.y);
        }
        
        enemies.push(enemy);
    }

    update(deltaTime, worldContainer) {
        this.last_spawn_time += deltaTime;
        if(this.last_spawn_time > this.spawn_rate && this.spawns_remaining > 0) {
            this.spawn(worldContainer);
            this.last_spawn_time = 0;
            this.spawns_remaining--;
        }
    }

    destroy(worldContainer) { 
        const index = enemies.indexOf(this);
        if (index !== -1) {
            enemies.splice(index, 1);
        }
    }

    static setSpawnRateForType(enemyType, newSpawnRate) {
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (enemy instanceof EnemySpawner && enemy.enemy_type === enemyType) {
                enemy.spawn_rate = newSpawnRate;
            }
        }
    }

    static setPropertyForType(enemyType, properties) {
        const enemySpawners = findAllEnemies(enemyType);
        for (let i = 0; i < enemySpawners.length; i++) {
            const enemySpawner = enemySpawners[i];
            for (const [property, value] of Object.entries(properties)) {
                enemySpawner[property] = value;
            }
        }
    }

    static setPropertyForAll(properties) {
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (enemy instanceof EnemySpawner) {
                for (const [property, value] of Object.entries(properties)) {
                    enemy[property] = value;
                }
            }
        }
    }

}

class DefaultEnemySpawner extends EnemySpawner {
    constructor(x, y) {
        super({ x, y, enemy_type: DefaultEnemy, spawn_rate: 3000, spawn_radius: 0 });
    }
}


class DefaultBossSpawner extends EnemySpawner {
    constructor(x, y, boss = true) {
        super({ x, y, enemy_type: DefaultBoss, spawn_rate: 0, spawn_radius: 0, boss: boss});
    }

    spawn(worldContainer) {
        let enemy = new this.enemy_type({
            x: this.position.x,
            y: this.position.y,
            worldContainer: worldContainer,
            boss: this.boss,
            scales: {
                hp: this.hp_scale,
                dmg: this.dmg_scale,
                speed: this.speed_scale,
                size: this.size_scale
            }
        });
        
        enemy.refreshGraphics();

        if (enemy.isGraphicsInitialized) {
            enemy.graphics.position.set(this.position.x, this.position.y);
        }
        
        enemies.push(enemy);
    }
}

class MiniBlueSpawner extends EnemySpawner {
    constructor(x, y) {
        super({ x, y, enemy_type: MiniBlue, spawn_rate: 5000, spawn_radius: 0 });
    }
}

class ToxicGreenSpawner extends EnemySpawner {
    constructor(x, y) {
        super({ x, y, enemy_type: ToxicGreen, spawn_rate: 5000, spawn_radius: 0 });
    }
}

class ShriekerSpawner extends EnemySpawner {
    constructor(x, y) {
        super({ x, y, enemy_type: Shrieker, spawn_rate: 3500, spawn_radius: 0 });
    }
}

class GhostSpawner extends EnemySpawner {
    constructor(x, y) {
        super({ x, y, enemy_type: Ghost, spawn_rate: 5000, spawn_radius: 0 });
    }
}