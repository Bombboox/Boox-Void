const praises = [
    "EXCELLENT!", 
    "GOOD JOB!", 
    "WELL DONE!", 
    "AWESOME", 
    "FANTASTIC!", 
    "IMPRESSIVE!", 
    "UNSTOPPABLE!",
    "CRUSHING IT!",
    "FINNA NUT 😩"
];

class Waves {
    constructor(worldContainer, waves, special_instructions = {}) {
        this.worldContainer = worldContainer;

        this.waves = waves;
        this.waveCount = waves.length;
        this.current_wave = 0;
        this.actual_wave = 1;

        this.delayBetweenWaves = 1000;
        this.timer = 0;

        this.in_between_waves = false;
        this.completed = false;
        
        // Text animation properties
        this.waveText = null;
        this.praiseText = null;
        this.enemiesRemainingText = null;
        this.textAnimationDuration = 2000;
        this.textAnimationTimer = 0;
        this.showingWaveText = false;
        this.showingPraiseText = false;
        
        // Create text objects
        this.createTextElements();
        
        // Track enemies for the counter
        this.totalEnemiesInWave = 0;
        this.remainingEnemies = 0;

        // Special instructions for the level
        this.special_instructions = special_instructions;
        
        // Run any initial special instructions
        if (this.special_instructions.onStart) {
            this.special_instructions.onStart();
        }

        if(this.special_instructions.survival) {
            this.survival = true;
            this.survival_instructions = this.special_instructions.survival;
            this.survival_enemy_count = this.special_instructions.survival_enemy_count;

            for(const enemy of enemies) {
                if(enemy.boss) enemy.boss = false;
            }

            this.spawn_survival_wave();
        }
    }
    
    createTextElements() {
        // Create wave number text
        this.waveText = new PIXI.Text({
            text: '',
            style: {
                fontFamily: 'Arial',
                fontSize: 48,
                fontWeight: 'bold',
                fill: 0xff0000,
                align: 'center',
                stroke: {width: 4, color: 0x000000}
            }
        });
        this.waveText.anchor.set(0.5, 0.5);
        this.waveText.zIndex = 1000;
        this.waveText.visible = false;
        
        // Create praise text
        this.praiseText = new PIXI.Text({
            text: '',
            style: {
                fontFamily: 'Arial',
                fontSize: 36,
                fontWeight: 'bold',
                fill: 0xff0000,
                align: 'center',
                stroke: {width: 3, color: 0x000000}
            }
        });
        this.praiseText.anchor.set(0.5, 0.5);
        this.praiseText.zIndex = 1000;
        this.praiseText.visible = false;
        
        // Create enemies remaining text
        this.enemiesRemainingText = new PIXI.Text({
            text: '',
            style: {
                fontFamily: 'Arial',
                fontSize: 18,
                fill: 0xffffff,
                align: 'center',
            }
        });
        this.enemiesRemainingText.anchor.set(0, 0);
        this.enemiesRemainingText.zIndex = 1000;
        this.enemiesRemainingText.visible = false;
        
        // Add to world container
        this.worldContainer.addChild(this.waveText);
        this.worldContainer.addChild(this.praiseText);
        this.worldContainer.addChild(this.enemiesRemainingText);
    }
    
    showWaveText(waveNumber) {
        // Set text content
        this.waveText.text = `WAVE ${waveNumber}`;
        
        // Position at 20% down from the top of the screen
        this.waveText.position.set(
            window.innerWidth / 2 - this.worldContainer.x,
            window.innerHeight * 0.2 - this.worldContainer.y
        );
        
        // Make visible
        this.waveText.visible = true;
        
        // Start animation
        this.textAnimationTimer = this.textAnimationDuration;
        this.showingWaveText = true;
    }
    
    showPraiseText() {  
        // Pick a random praise
        const randomPraise = praises[Math.floor(Math.random() * praises.length)];
        
        // Set text content
        this.praiseText.text = randomPraise;
        
        // Position in center of screen
        this.praiseText.position.set(
            window.innerWidth / 2 - this.worldContainer.x,
            window.innerHeight / 2 + 50 - this.worldContainer.y
        );
        
        // Make visible
        this.praiseText.visible = true;
        
        // Start animation
        this.textAnimationTimer = this.textAnimationDuration;
        this.showingPraiseText = true;
    }
    
    updateEnemiesRemainingText(enemies) {
        if (!this.in_between_waves || this.completed) {
            this.enemiesRemainingText.visible = false;
            return;
        }
        
        // Update text
        let wave = this.waves[this.current_wave];
        this.enemiesRemainingText.text = `enemies: ${wave.getRemainingEnemies()}/${wave.getTotalEnemies()}`;
        
        // Position at bottom left of the screen
        this.enemiesRemainingText.position.set(
            10 - this.worldContainer.x,
            window.innerHeight - 30 - this.worldContainer.y
        );
        
        // Make visible
        this.enemiesRemainingText.visible = true;
    }
    
    updateTextAnimation(deltaTime) {
        // Handle wave text animation
        if (this.showingWaveText) {
            this.textAnimationTimer -= deltaTime;
            
            // Animation progress from 0 to 1
            const progress = 1 - (this.textAnimationTimer / this.textAnimationDuration);
            
            // Scale animation
            const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
            this.waveText.scale.set(scale, scale);
            
            // Alpha animation
            if (progress > 0.7) {
                const fadeOutProgress = (progress - 0.7) / 0.3;
                this.waveText.alpha = 1 - fadeOutProgress;
            } else {
                this.waveText.alpha = 1;
            }
            
            // Update position to stay at 20% from the top of screen
            this.waveText.position.set(
                window.innerWidth / 2 - this.worldContainer.x,
                window.innerHeight * 0.2 - this.worldContainer.y
            );
            
            // End animation
            if (this.textAnimationTimer <= 0) {
                this.waveText.visible = false;
                this.showingWaveText = false;
            }
        }
        
        // Handle praise text animation
        if (this.showingPraiseText) {
            this.textAnimationTimer -= deltaTime;
            
            // Animation progress from 0 to 1
            const progress = 1 - (this.textAnimationTimer / this.textAnimationDuration);
            
            // Scale animation
            const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
            this.praiseText.scale.set(scale, scale);
            
            // Alpha animation
            if (progress > 0.7) {
                const fadeOutProgress = (progress - 0.7) / 0.3;
                this.praiseText.alpha = 1 - fadeOutProgress;
            } else {
                this.praiseText.alpha = 1;
            }
            
            // Update position to stay centered on screen
            this.praiseText.position.set(
                window.innerWidth / 2 - this.worldContainer.x,
                window.innerHeight / 2 + 50 - this.worldContainer.y
            );
            
            // End animation
            if (this.textAnimationTimer <= 0) {
                this.praiseText.visible = false;
                this.showingPraiseText = false;
            }
        }
    }

    spawn_survival_wave() {
        let enemyCount = this.survival_instructions.enemyCount || 10;
        let availableEnemies = this.survival_instructions.enemyTypes || {
            "DefaultEnemy": 1,
            "MiniBlueEnemy": 0.7,
            "ToxicGreenEnemy": 0.5,
            "ShriekerEnemy": 0.3,
            "GhostEnemy": 0.2
        };
        
        let enemyTypes = {};
        let enemyKeys = Object.keys(availableEnemies);
        
        // Create cumulative sum array for enemy chances
        let cumulativeChances = [];
        let totalWeight = 0;
        
        for (let enemyType of enemyKeys) {
            totalWeight += availableEnemies[enemyType];
            cumulativeChances.push({
                type: enemyType,
                value: totalWeight
            });
        }
        
        for (let i = 0; i < enemyCount; i++) {
            // Generate random number between 0 and total weight
            let roll = Math.random() * totalWeight;
            
            // Find the corresponding enemy using the cumulative chances
            for (let j = 0; j < cumulativeChances.length; j++) {
                if (roll <= cumulativeChances[j].value) {
                    let enemyType = cumulativeChances[j].type;
                    enemyTypes[enemyType] = (enemyTypes[enemyType] || 0) + 1;
                    break;
                }
            }
        }
        
        const waveNumber = this.current_wave + 1;
        const hpScale = 1 + (waveNumber * 0.1); // Increase by 10% per wave
        const dmgScale = 1 + (waveNumber * 0.05); // Increase by 5% per wave
        const speedScale = 1 + (waveNumber * 0.03); // Increase by 3% per wave
        
        let wave = new Wave({
            hp_scale: hpScale,
            dmg_scale: dmgScale,
            speed_scale: speedScale,
            size_scale: 1,
        }, enemyTypes);
        this.waves.push(wave);
        
        // Increase enemy count for next wave
        this.survival_instructions.enemyCount = Math.floor(enemyCount * 1.2);
    }

    update(deltaTime, enemies) {
        this.updateTextAnimation(deltaTime);
        if(this.completed) return;

        if(this.in_between_waves) {
            this.updateEnemiesRemainingText(enemies);
            
            if(this.waves[this.current_wave].completed()) {
                this.trigger_next_wave();
            }
        }
    
        if(!this.in_between_waves) {
            this.timer += deltaTime;
            if(this.timer >= this.delayBetweenWaves) { 
                this.enemiesRemainingText.visible = true;
                
                // Calculate total enemies in this wave
                this.totalEnemiesInWave = this.waves[this.current_wave].getTotalEnemies();
                this.remainingEnemies = this.totalEnemiesInWave;
                
                this.waves[this.current_wave].spawn_wave(enemies);
                this.in_between_waves = true;
                this.timer = 0;
                
                // Show wave text animation
                if(!this.waves[this.current_wave].options.fake_wake) {
                    this.showWaveText(this.actual_wave);
                }
            }
        }
    }

    trigger_next_wave() {
        const fake_wave = this.waves[this.current_wave].options.fake_wake;
        this.current_wave++;
        if(!fake_wave) {
            this.actual_wave++;
        }
        this.enemiesRemainingText.visible = false;
        
        if(this.survival) {
            this.spawn_survival_wave();
            this.in_between_waves = false;
        } else {
            // Show praise text when a wave is completed
            if (this.current_wave > 0 && !fake_wave) {
                this.showPraiseText();
            }
            
            if(this.current_wave >= this.waveCount) {
                this.completed = true;
                this.showPraiseText();
                gameCompleted();
                return;
            }
            this.in_between_waves = false;
        }
    }

    reset() {
        this.current_wave = 0;
        this.completed = false;
        this.in_between_waves = false;
        this.timer = 0;
        this.totalEnemiesInWave = 0;
        this.remainingEnemies = 0;
        
        if (this.waveText) {
            this.waveText.visible = false;
        }
        if (this.enemiesRemainingText) {
            this.enemiesRemainingText.visible = false;
        }
        if (this.praiseText) {
            this.praiseText.visible = false;
            this.showingPraiseText = false;
        }
    }
}

class Wave {
    constructor(options = {}, enemyTypes = null, special_instructions = null) {
        this.options = options;
        this.enemyTypes = enemyTypes || {};
        this.special_instructions = special_instructions;
        this.total_enemies = this.getTotalEnemies();
    }

    spawn_wave(enemies) {
        if(this.special_instructions) {
            this.special_instructions();
        }

        let enemy_spawners = enemies.filter(enemy => enemy instanceof EnemySpawner || Object.getPrototypeOf(enemy.constructor).name === 'EnemySpawner');
        
        if (Object.keys(this.enemyTypes).length === 0) {
            for(let spawner of enemy_spawners) {
                for (const [key, value] of Object.entries(this.options)) {
                    spawner[key] = value;
                }
                spawner.spawns_remaining = 0; 
            }
            return;
        }
        
        for(let spawner of enemy_spawners) {
            for (const [key, value] of Object.entries(this.options)) {
                spawner[key] = value;
            }
 
            const spawnerType = spawner.constructor.name;
            let enemyType = null;
            if (spawnerType.endsWith('Spawner')) {
                enemyType = spawnerType.replace('Spawner', '');
            }
            
            if (enemyType && this.enemyTypes[enemyType]) {
                spawner.spawns_remaining = this.enemyTypes[enemyType];
            } else {
                spawner.spawns_remaining = 0;
            }
        }
    }
    
    getTotalEnemies() {
        var total = 0;

        const enemySpawners = enemies.filter(enemy => 
            enemy instanceof EnemySpawner || 
            Object.getPrototypeOf(enemy.constructor).name === 'EnemySpawner'
        );

        if(enemySpawners.length == 0) return 0;

        for(let spawner of enemySpawners) {
            const spawnerType = spawner.constructor.name;
            let enemyType = null;
            if (spawnerType.endsWith('Spawner')) {
                enemyType = spawnerType.replace('Spawner', '');
            }
            
            if (enemyType && this.enemyTypes[enemyType]) {
                total += this.enemyTypes[enemyType];
            } else {
                total += spawner.spawns_remaining;
            }
        }

        return total;
    }

    getRemainingEnemies() {
        let total = 0;
        
        // Count remaining enemies in spawners
        let enemy_spawners = enemies.filter(enemy => enemy instanceof EnemySpawner || Object.getPrototypeOf(enemy.constructor).name === 'EnemySpawner');
        for(let spawner of enemy_spawners) {
            total += spawner.spawns_remaining;
        }
        
        // Count regular enemies that are already spawned
        let regular_enemies = enemies.filter(enemy => !(enemy instanceof EnemySpawner) && Object.getPrototypeOf(enemy.constructor).name !== 'EnemySpawner');
        total += regular_enemies.length;
        
        return total;
    }

    completed() {
        let enemy_spawners = enemies.filter(enemy => enemy instanceof EnemySpawner || Object.getPrototypeOf(enemy.constructor).name === 'EnemySpawner');
        for(let spawner of enemy_spawners) {
            if(spawner.spawns_remaining > 0) return false;
        }
        
        let regular_enemies = enemies.filter(enemy => !(enemy instanceof EnemySpawner) && Object.getPrototypeOf(enemy.constructor).name !== 'EnemySpawner');
        if(regular_enemies.length > 0) return false;

        if(this.options.special_condition != undefined) {
            return this.options.special_condition();
        }

        return true;
    }
}