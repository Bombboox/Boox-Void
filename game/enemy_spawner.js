class EnemySpawner {
    constructor(options = {}) {
        this.position = vector(options.x || 0, options.y || 0); // Use vector for position to match enemy class
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
    }

    spawn(worldContainer) {
        // Create enemy at the spawner's position
        let enemy = new this.enemy_type(
            this.position.x, 
            this.position.y, 
            worldContainer
        );
        
        // Ensure the enemy's position is set correctly
        enemy.position.x = this.position.x;
        enemy.position.y = this.position.y;
        enemy.hp *= this.hp_scale;
        enemy.maxHp *= this.hp_scale;
        enemy.dmg *= this.dmg_scale;
        enemy.speed *= this.speed_scale;
        switch(enemy.hbtype) {
            case "circle":
                enemy.radius *= this.size_scale;
                break;
            case "rectangle":
                enemy.width *= this.size_scale;
                enemy.height *= this.size_scale;
        }
        enemy.refreshGraphics();

        // If graphics are initialized, update position immediately
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

    destroy(worldContainer) { // Accept container to remove graphics
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
        // Create enemy at the spawner's position
        let enemy = new this.enemy_type(
            this.position.x, 
            this.position.y, 
            worldContainer,
            this.boss
        );
        
        // Ensure the enemy's position is set correctly
        enemy.position.x = this.position.x;
        enemy.position.y = this.position.y;
        enemy.hp *= this.hp_scale;
        enemy.maxHp *= this.hp_scale;
        enemy.dmg *= this.dmg_scale;
        enemy.speed *= this.speed_scale;
        switch(enemy.hbtype) {
            case "circle":
                enemy.radius *= this.size_scale;
                break;
            case "rectangle":
                enemy.width *= this.size_scale;
                enemy.height *= this.size_scale;
        }
        enemy.refreshGraphics();

        // If graphics are initialized, update position immediately
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