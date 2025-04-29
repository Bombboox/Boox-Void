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
    }
    
    createTextElements() {
        // Create wave number text
        this.waveText = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 48,
            fontWeight: 'bold',
            fill: 0xff0000,
            align: 'center',
            stroke: 0x000000,
            strokeThickness: 4
        });
        this.waveText.anchor.set(0.5, 0.5);
        this.waveText.zIndex = 1000;
        this.waveText.visible = false;
        
        // Create praise text
        this.praiseText = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 36,
            fontWeight: 'bold',
            fill: 0xff0000,
            align: 'center',
            stroke: 0x000000,
            strokeThickness: 3
        });
        this.praiseText.anchor.set(0.5, 0.5);
        this.praiseText.zIndex = 1000;
        this.praiseText.visible = false;
        
        // Create enemies remaining text
        this.enemiesRemainingText = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xffffff,
            align: 'center',
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
        
        // Count remaining enemies (non-spawners)
        const regularEnemies = enemies.filter(enemy => !(enemy instanceof EnemySpawner) && Object.getPrototypeOf(enemy.constructor).name !== 'EnemySpawner');
        
        // Count remaining spawns
        let remainingSpawns = 0;
        const enemySpawners = enemies.filter(enemy => enemy instanceof EnemySpawner || Object.getPrototypeOf(enemy.constructor).name === 'EnemySpawner');
        for (let spawner of enemySpawners) {
            remainingSpawns += spawner.spawns_remaining;
        }
        
        // Calculate total remaining enemies
        this.remainingEnemies = regularEnemies.length + remainingSpawns;
        
        // Update text
        this.enemiesRemainingText.text = `enemies: ${this.remainingEnemies}/${this.totalEnemiesInWave}`;
        
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

    update(deltaTime, enemies) {
        this.updateTextAnimation(deltaTime);
        if(this.completed) return;

        if(this.in_between_waves) {
            this.updateEnemiesRemainingText(enemies);
            
            if(this.waves[this.current_wave].completed()) {
                this.current_wave++;
                this.enemiesRemainingText.visible = false;
                
                // Show praise text when a wave is completed
                if (this.current_wave > 0) {
                    this.showPraiseText();
                }
                
                if(this.current_wave >= this.waveCount) {
                    this.completed = true;
                    this.showPraiseText();
                    return;
                }
                this.in_between_waves = false;
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
                this.showWaveText(this.current_wave + 1);
            }
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
    constructor(power_scale = 1.0, enemyTypes = null, special_instructions = null) {
        this.power_scale = power_scale;
        this.enemyTypes = enemyTypes || {};
        this.special_instructions = special_instructions;
    }

    spawn_wave(enemies) {
        let enemy_spawners = enemies.filter(enemy => enemy instanceof EnemySpawner || Object.getPrototypeOf(enemy.constructor).name === 'EnemySpawner');
        
        if (Object.keys(this.enemyTypes).length === 0) {
            for(let spawner of enemy_spawners) {
                spawner.power_scale = this.power_scale;
                spawner.spawns_remaining = 1; 
            }
            return;
        }
        
        for(let spawner of enemy_spawners) {
            spawner.power_scale = this.power_scale;
 
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

        if(this.special_instructions) {
            this.special_instructions();
        }
    }
    
    getTotalEnemies() {
        if (Object.keys(this.enemyTypes).length === 0) {
            return 1;
        }
        
        return Object.values(this.enemyTypes).reduce((total, count) => total + count, 0);
    }

    completed() {
        let enemy_spawners = enemies.filter(enemy => enemy instanceof EnemySpawner || Object.getPrototypeOf(enemy.constructor).name === 'EnemySpawner');
        for(let spawner of enemy_spawners) {
            if(spawner.spawns_remaining > 0) return false;
        }
        
        let regular_enemies = enemies.filter(enemy => !(enemy instanceof EnemySpawner) && Object.getPrototypeOf(enemy.constructor).name !== 'EnemySpawner');
        if(regular_enemies.length > 0) return false;
        return true;
    }
}