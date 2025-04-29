class Enemy {
    constructor(x, y, width, height, hp, speed) {
        this.position = vector(x, y);
        this.target = vector(x, y);
        this.width = width;
        this.height = height;
        this.maxHp = hp;
        this.hp = hp;
        this.speed = speed;
        this.timeStuck = 0; // Time in milliseconds the enemy has been stuck
        this.stuckThreshold = 500; // 0.5 seconds threshold
        this.hitSound = hit_sound;
        this.hitSound.volume = 0.6;
        this.name = "ERROR!";
        this.invincibilityFrames = 0;
        this.invincibilityDuration = 50;

        // PixiJS Graphics - Must be added to container by subclass or externally
        this.graphics = new PIXI.Graphics();
        this.isGraphicsInitialized = false; // Track if added to stage
    }

    // Common method to add graphics to the stage
    initializeGraphics(worldContainer) {
        if (!this.isGraphicsInitialized && worldContainer) {
            worldContainer.addChild(this.graphics);
            this.isGraphicsInitialized = true;
            this.renderGraphics(); // Initial draw specific to subclass
        } else if (!worldContainer) {
            console.error("Enemy initialized without worldContainer!");
        }
    }

    // Method to be called by subclass update
    _updateGraphicsPosition() {
        if (this.isGraphicsInitialized) {
            if (isNaN(this.position.x) || isNaN(this.position.y)) {
                console.error("Enemy position is NaN, skipping graphics update:", this);
                return;
            }
            this.graphics.position.set(this.position.x, this.position.y);
        }
    }

    // Abstract method - subclasses must implement
    renderGraphics() {
        throw new Error("renderGraphics() must be implemented by subclass");
    }

    damage(amount) {
        this.hp -= amount;
        if(this.hp <= 0) {
            this.destroy(worldContainer);
            return;
        }
        this.hitSound.currentTime = 0;
        this.hitSound.play();
    }

    destroy(worldContainer) { // Accept container to remove graphics
        this.graphics.clear(); 

        if (this.isGraphicsInitialized && worldContainer) {
            worldContainer.removeChild(this.graphics);
        }
        this.graphics.destroy(); // Free PixiJS resources

        const index = enemies.indexOf(this);
        if (index !== -1) {
            enemies.splice(index, 1);
        }
    }

    move(deltaTime) { // Accept deltaTime
        let moveVector = this.target.sub(this.position);
        const distanceToTarget = moveVector.length();

        if (distanceToTarget > 0) {
            let normalized = normalize(moveVector);
            // Calculate potential movement for this frame
            let potentialMove = normalized.mul(this.speed * deltaTime); 

            let potentialX = this.position.x + potentialMove.x;
            let potentialY = this.position.y + potentialMove.y;
            let canMoveX = true;
            let canMoveY = true;

            // Create colliders for potential positions
            const enemyColliderX = { position: vector(potentialX, this.position.y), width: this.width, height: this.height };
            const enemyColliderY = { position: vector(this.position.x, potentialY), width: this.width, height: this.height };
            const enemyColliderBoth = { position: vector(potentialX, potentialY), width: this.width, height: this.height };

            const obstacles = [...activeLevel.shapes, ...enemies.filter(e => e !== this)]; // Combine shapes and other enemies

            for (const obstacle of obstacles) {
                if(obstacle.tag == "epassable") continue;
                let obstacleCollider;
                if (obstacle.type === 'Rectangle') { // Collision with level rectangle
                    obstacleCollider = {
                        position: vector(obstacle.x, obstacle.y),
                        width: obstacle.width,
                        height: obstacle.height
                    };
                } else if (obstacle.type === 'Circle') { // Collision with level circle
                    obstacleCollider = {
                        position: vector(obstacle.x, obstacle.y),
                        radius: obstacle.radius
                    };
                } else {
                    continue; // Skip if not a known shape or enemy
                }


                // Check X-axis collision
                if (potentialMove.x !== 0 && checkCollision(enemyColliderX, obstacleCollider)) {
                    canMoveX = false;
                }

                // Check Y-axis collision
                if (potentialMove.y !== 0 && checkCollision(enemyColliderY, obstacleCollider)) {
                    canMoveY = false;
                }
                 
                // Diagonal sticking check (similar to player)
                 if (potentialMove.x !== 0 && potentialMove.y !== 0 && !canMoveX && !canMoveY) {
                     if (checkCollision(enemyColliderBoth, obstacleCollider)) {
                         canMoveX = false; 
                         canMoveY = false;
                     } else {
                         if (!checkCollision(enemyColliderX, obstacleCollider)) canMoveX = true;
                         if (!checkCollision(enemyColliderY, obstacleCollider)) canMoveY = true;
                         
                         if(!checkCollision(enemyColliderX, obstacleCollider) && !checkCollision(enemyColliderY, obstacleCollider)){
                             canMoveX = false;
                             canMoveY = false;
                         } else if (!checkCollision(enemyColliderX, obstacleCollider)) {
                             canMoveX = true; 
                             canMoveY = false;
                         } else if (!checkCollision(enemyColliderY, obstacleCollider)) {
                             canMoveY = true; 
                             canMoveX = false;
                         } else { 
                             canMoveX = false;
                             canMoveY = false;
                         }
                     }
                 }
            }

            let actualMoveX = canMoveX ? potentialMove.x : 0;
            let actualMoveY = canMoveY ? potentialMove.y : 0;

            // Check if movement occurred
            if (Math.abs(actualMoveX) < Math.abs(potentialMove.x) || Math.abs(actualMoveY) < Math.abs(potentialMove.y)) {
                // If intended move was non-zero but actual move is zero (or less than intended), increment stuck timer
                 if(potentialMove.x !== 0 || potentialMove.y !== 0){
                    this.timeStuck += deltaTime;
                 }
            } else {
                this.timeStuck = 0;
            }

            this.position.x += actualMoveX;
            this.position.y += actualMoveY;

             if (this.timeStuck >= this.stuckThreshold) {
                 this.target = randomTargetTowardsPlayer(this.position, random(250, 500)); // Or another target logic
                 this.timeStuck = 0; // Reset timer after assigning new target
             }

        } else {
             this.timeStuck = 0;
        }
    }
}

class DefaultEnemy extends Enemy {
    constructor(x, y, worldContainer) {
        super(
            x,   // x
            y,   // y
            50,  // width
            50,  // height
            10,  // hp
            0.25 // speed
        );
        this.name = "RED GUY";
        this.initializeGraphics(worldContainer); 
    }

    renderGraphics() {
        this.graphics.clear();
        this.graphics.rect(0, 0, this.width, this.height);
        this.graphics.fill({color: 0xff0000});
    }

    update(deltaTime, worldContainer) { 
        this.move(deltaTime);

        this._updateGraphicsPosition();

        const distanceToTarget = this.position.distance(this.target);
        if (distanceToTarget < 10) {
            this.target = randomTargetTowardsPlayer(this.position, random(250, 500));
            this.timeStuck = 0; 
        }
        if(this.hp <= 0) {
            this.destroy(worldContainer); 
            return; 
        }
    }
}

class DefaultBoss extends Enemy {
    constructor(x, y, worldContainer, boss = true) {
        super(
            x,   // x
            y,   // y
            100,  // width
            100,  // height
            150,  // hp
            0.10 // speed
        );
        this.name = "BOSS GUY";
        this.cannon = new EnemyCannon(this, worldContainer); 
        this.angle = 0;
        this.boss = boss;
        
        // Camera focus variables
        this.cameraFocusTime = 1000; // 1 second
        this.cameraFocusTimer = this.cameraFocusTime;
        this.cameraFocusing = true;
        this.originalPlayerCameraFollow = player.cameraFollow;
        
        // Disable player camera follow during intro
        player.cameraFollow = false;

        this.initializeGraphics(worldContainer);
    }

    renderGraphics() {
        this.graphics.clear();
        this.graphics.rect(0, 0, this.width, this.height);
        this.graphics.fill({color: 0x89CFF0});
    }

    update(deltaTime, worldContainer) {
        if(this.hp <= 0) {
            this.destroy(worldContainer);
            return;
        }
        
        // Handle camera focus on boss when spawned
        if (this.cameraFocusing) {
            enemiesPaused = true;
            this.cameraFocusTimer -= deltaTime;
            
            // Lerp camera position towards boss
            const lerpFactor = Math.max(0, this.cameraFocusTimer / this.cameraFocusTime);
            const targetX = app.screen.width / 2 - (this.position.x + this.width/2) * worldContainer.scale.x;
            const targetY = app.screen.height / 2 - (this.position.y + this.height/2) * worldContainer.scale.y;
            
            worldContainer.x = lerp(targetX, worldContainer.x, lerpFactor);
            worldContainer.y = lerp(targetY, worldContainer.y, lerpFactor);
            
            // When timer is done, return camera control to player
            if (this.cameraFocusTimer <= 0) {
                enemiesPaused = false;
                this.cameraFocusing = false;
                player.cameraFollow = this.originalPlayerCameraFollow;
            }
        }

        this.move(deltaTime);
        this._updateGraphicsPosition();

        const offset = Math.max(this.width, this.height) / 2 + 20; 
        const cannonX = offset * Math.cos(this.angle);
        const cannonY = offset * Math.sin(this.angle);

        this.cannon.graphics.position.set(this.position.x + cannonX + this.width/2, this.position.y + cannonY + this.height/2);
        this.cannon.graphics.rotation = this.angle;
        this.cannon.update(deltaTime); 

        const cannonTipOffset = this.cannon.cannonLength;
        const cannonTipX = this.position.x + cannonX + cannonTipOffset * Math.cos(this.angle);
        const cannonTipY = this.position.y + cannonY + cannonTipOffset * Math.sin(this.angle);

        if (player && player.position) {
            // Calculate angle from cannon tip to player, not from enemy center
            this.angle = Math.atan2(
                player.position.y - (this.position.y + cannonY + this.height/2),
                player.position.x - (this.position.x + cannonX + this.width/2)
            );
            this.cannon.fire(this.angle, cannonTipX, cannonTipY);
        }

        const distanceToTarget = this.position.distance(this.target);
        if (distanceToTarget < 10) {
            this.target = randomTargetTowardsPlayer(this.position, random(250, 500));
            this.timeStuck = 0;
        }
    }

    destroy(worldContainer) { // Accept container to remove graphics
        super.destroy(worldContainer);
        this.cannon.destroy(worldContainer);
        
        // Ensure camera control is returned to player if boss is destroyed during intro
        if (this.cameraFocusing) {
            player.cameraFollow = this.originalPlayerCameraFollow;
        }
        
        if(this.boss) {
            destroyAllEnemies();
            stopAllMusic();
        }
    }
}