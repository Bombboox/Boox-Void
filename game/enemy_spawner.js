class EnemySpawner {
    constructor(x, y, enemy_type, spawn_rate = 3000, spawn_radius = 0) {
        this.position = vector(x, y); // Use vector for position to match enemy class
        this.enemy_type = enemy_type;
        this.spawn_rate = spawn_rate;
        this.spawn_radius = spawn_radius;
        this.last_spawn_time = 0;
        this.spawns_remaining = 0;
        this.power_scale = 1;
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
        enemy.hp *= this.power_scale;
        enemy.maxHp *= this.power_scale;
        
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
}

class DefaultEnemySpawner extends EnemySpawner {
    constructor(x, y) {
        super(x, y, DefaultEnemy, 3000, 0);
    }
}


class DefaultBossSpawner extends EnemySpawner {
    constructor(x, y) {
        super(x, y, DefaultBoss, 0, 0);
    }
}