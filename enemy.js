class Enemy {
    constructor(x, y, width, height, hp, speed) {
        this.position = vector(x, y);
        this.target = vector(x, y);
        this.width = width;
        this.height = height;
        this.hp = hp;
        this.speed = speed;
        this.timeStuck = 0; // Time in milliseconds the enemy has been stuck
        this.stuckThreshold = 500; // 0.5 seconds threshold
        this.hitSound = hit_sound;

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

    bulletCollision() {
        for(let i = 0; i < bullets.length; i++) {
            if(checkCollision(this, bullets[i])) {
                this.hp -= bullets[i].damage;
                bullets[i].destroy();
                this.hitSound.currentTime = 0;
                this.hitSound.play(
                    {
                        volume: 1,
                    }
                );
                return true;
            }
        }
        return false;
    }

    destroy(worldContainer) { // Accept container to remove graphics
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
                let obstacleCollider;
                if (obstacle instanceof Enemy) { // Collision with another enemy (Rect vs Rect)
                     obstacleCollider = {
                        position: vector(obstacle.position.x, obstacle.position.y),
                        width: obstacle.width,
                        height: obstacle.height
                     };
                } else if (obstacle.type === 'Rectangle') { // Collision with level rectangle
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
        super(x, y, 60, 60, 10, 0.25);
        this.initializeGraphics(worldContainer); 
    }

    renderGraphics() {
        this.graphics.clear();
        this.graphics.beginFill(0xff0000); // Red
        this.graphics.drawRect(0, 0, this.width, this.height);
        this.graphics.endFill();
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
        this.bulletCollision();
    }
}