class Enemy {
    constructor(options = {}) {
        this.position = vector(options.x || 0, options.y || 0);
        this.target = vector(options.x || 0, options.y || 0);
        this.width = options.width || 50;
        this.height = options.height || 50;
        this.radius = options.radius || 25;
        this.maxHp = options.hp || 10;
        this.hp = options.hp || 10;
        this.speed = options.speed || 0.25;
        this.timeStuck = 0;
        this.stuckThreshold = 500;
        this.name = options.name || "ERROR!";
        this.invincibilityFrames = 0;
        this.invincibilityDuration = 50;
        this.dmg = options.damage || 30;
        this.targetRadius = options.targetRadius || random(250, 500);
        this.hbtype = options.hbtype || "rectangle";
        this.targeting = options.targetting || true;
        this.ghosted = options.ghosted || false;

        this.graphics = new PIXI.Graphics();
        this.isGraphicsInitialized = false;
    }

    initializeGraphics(worldContainer) {
        if (!this.isGraphicsInitialized && worldContainer) {
            worldContainer.addChild(this.graphics);
            this.isGraphicsInitialized = true;
            this.renderGraphics();
        } else if (!worldContainer) {
            console.error("Enemy initialized without worldContainer!");
        }
    }

    refreshGraphics() {
        if (this.isGraphicsInitialized) {
            this.graphics.clear();
            this.renderGraphics();
            this._updateGraphicsPosition();
        }
    }

    _updateGraphicsPosition() {
        if (this.isGraphicsInitialized) {
            if (isNaN(this.position.x) || isNaN(this.position.y)) {
                console.error("Enemy position is NaN, skipping graphics update:", this);
                return;
            }
            this.graphics.position.set(this.position.x, this.position.y);
        }
    }

    renderGraphics() {
        throw new Error("renderGraphics() must be implemented by subclass");
    }

    damage(amount, position = this.position, crit_roll = false) {
        if (this.invincibilityFrames > 0) {
            return; 
        }
        
        this.hp -= amount;
        const damageNumber = new DamageNumber({
            x: position.x,
            y: position.y,
            number: amount,
            color: crit_roll ? 0xff0000 : 0x218ede,
            font: 'Roboto',
            size: crit_roll ? 32 : 22,
            fontWeight: crit_roll ? 'bold' : 'normal',
            duration: 350,
            worldContainer: worldContainer
        });

        if(this.hp <= 0) {
            this.destroy(worldContainer);
            return;
        }
        
        this.invincibilityFrames = this.invincibilityDuration;
        playSound('hit', 0.6);
    }

    destroy(worldContainer) {
        this.graphics.clear();

        if (this.isGraphicsInitialized && worldContainer) {
            worldContainer.removeChild(this.graphics);
        }
        this.graphics.destroy();

        const index = enemies.indexOf(this);
        if (index !== -1) {
            enemies.splice(index, 1);
        }
    }

    lineOfSight(targetPos, visionRadius) {
        if (!player || !player.position) return false;
        
        const distanceToTarget = this.position.distance(targetPos);
        
        if (distanceToTarget > visionRadius) return false;
        
        let obstacles = [...activeLevel.shapes];
        // Create an array of obstacle colliders for line of sight check
        let obstacleColliders = obstacles.map(obstacle => {
            if (obstacle.type === 'Rectangle') {
                return {
                    position: vector(obstacle.x, obstacle.y),
                    width: obstacle.width,
                    height: obstacle.height,
                    hbtype: 'rectangle'
                };
            } else if (obstacle.type === 'Circle') {
                return {
                    position: vector(obstacle.x, obstacle.y),
                    radius: obstacle.radius,
                    hbtype: 'circle'
                };
            }
            return null;
        }).filter(collider => collider !== null);
        
        // Check if there's a clear line of sight to the target
        const enemyPos = this.position instanceof Vector ? this.position : vector(this.position.x, this.position.y);
        
        // Check for line of sight
        let hasLineOfSight = true;
        for (const obstacle of obstacleColliders) {
            switch(obstacle.hbtype) {
                case "circle":
                    if(rayCircleIntersection(enemyPos, targetPos, obstacle)) {
                        hasLineOfSight = false;
                        break;
                    }
                    break;
                case "rectangle":
                    if(rayRectangleIntersection(enemyPos, targetPos, obstacle)) {
                        hasLineOfSight = false;
                        break;
                    }
                    break;
            }
        }
        
        return hasLineOfSight;
    }

    move(deltaTime) {
        if(this.ghosted) {
            let moveVector = this.target.sub(this.position);
            const distanceToTarget = moveVector.length();
            
            if (distanceToTarget > 0) {
                let normalized = normalize(moveVector);
                let potentialMove = normalized.mul(this.speed * deltaTime);

                this.position.x += potentialMove.x;
                this.position.y += potentialMove.y;
            }
            
            return;
        }

        let moveVector = this.target.sub(this.position);
        const distanceToTarget = moveVector.length();

        if (distanceToTarget > 0) {
            let normalized = normalize(moveVector);
            let potentialMove = normalized.mul(this.speed * deltaTime); 

            let potentialX = this.position.x + potentialMove.x;
            let potentialY = this.position.y + potentialMove.y;
            let canMoveX = true;
            let canMoveY = true;

            let enemyColliderX;
            let enemyColliderY;
            let enemyColliderBoth;

            switch(this.hbtype) {
                case "circle":
                    enemyColliderX = { position: vector(potentialX, this.position.y), radius: this.radius };
                    enemyColliderY = { position: vector(this.position.x, potentialY), radius: this.radius };
                    enemyColliderBoth = { position: vector(potentialX, potentialY), radius: this.radius };
                    break;

                case "default":
                case "rectangle":
                    enemyColliderX = { position: vector(potentialX, this.position.y), width: this.width, height: this.height };
                    enemyColliderY = { position: vector(this.position.x, potentialY), width: this.width, height: this.height };
                    enemyColliderBoth = { position: vector(potentialX, potentialY), width: this.width, height: this.height };
                    break;
            }

            const obstacles = [...activeLevel.shapes, ...enemies.filter(e => e !== this)];

            for (const obstacle of obstacles) {
                if(obstacle.tag == "epassable") continue;
                let obstacleCollider;
                if (obstacle.type === 'Rectangle') {
                    obstacleCollider = {
                        position: vector(obstacle.x, obstacle.y),
                        width: obstacle.width,
                        height: obstacle.height
                    };
                } else if (obstacle.type === 'Circle') {
                    obstacleCollider = {
                        position: vector(obstacle.x, obstacle.y),
                        radius: obstacle.radius
                    };
                } else {
                    continue;
                }

                if (potentialMove.x !== 0 && checkCollision(enemyColliderX, obstacleCollider)) {
                    canMoveX = false;
                }

                if (potentialMove.y !== 0 && checkCollision(enemyColliderY, obstacleCollider)) {
                    canMoveY = false;
                }
                 
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

            if (Math.abs(actualMoveX) < Math.abs(potentialMove.x) || Math.abs(actualMoveY) < Math.abs(potentialMove.y)) {
                if(potentialMove.x !== 0 || potentialMove.y !== 0){
                   this.timeStuck += deltaTime;
                }
            } else {
                this.timeStuck = 0;
            }

            this.position.x += actualMoveX;
            this.position.y += actualMoveY;

            if (this.timeStuck >= this.stuckThreshold && this.targeting) {
                this.target = randomTargetTowardsPlayer(this.position, this.targetRadius);
                this.timeStuck = 0;
            }

        } else {
            this.timeStuck = 0;
        }
    }

    update(deltaTime, worldContainer) {
        if (this.hp <= 0) {
            this.destroy(worldContainer);
            return true;
        }

        this.move(deltaTime);
        this._updateGraphicsPosition();

        if (this.invincibilityFrames > 0) {
            this.invincibilityFrames -= deltaTime;
        }

        const distanceToTarget = this.position.distance(this.target);
        if (distanceToTarget < 10) {
            if(this.targeting) {
                this.target = randomTargetTowardsPlayer(this.position, this.targetRadius);
            }
            this.timeStuck = 0;
        }
        return false;
    }

    get_center() {
        switch(this.hbtype) {
            case "circle":
                return this.position;
            case "rectangle":
                return this.position.add(vector(this.width/2, this.height/2));
        }
    }
    
    static find_nearest_enemy(position) {
        if (!enemies || enemies.length === 0) {
            return null;
        }

        let nearestEnemy = null;
        let shortestDistance = Infinity;

        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];

            if (!(enemy instanceof Enemy)) continue;
            if (!enemy) continue;

            const dx = enemy.position.x - position.x;
            const dy = enemy.position.y - position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestEnemy = enemy;
            }
        }

        return nearestEnemy;
    }
}

class DefaultEnemy extends Enemy {
    constructor(x, y, worldContainer) {
        super({
            x: x,
            y: y,
            width: 50,
            height: 50,
            hp: 10,
            speed: 0.25,
            name: "RED GUY",
        });
        this.initializeGraphics(worldContainer);
    }

    renderGraphics() {
        this.graphics.clear();
        this.graphics.rect(0, 0, this.width, this.height);
        this.graphics.fill({color: 0xff0000});
    }

    update(deltaTime, worldContainer) {
        const destroyed = super.update(deltaTime, worldContainer);
        if (destroyed) return;
    }
}

class MiniBlue extends Enemy {
    constructor(x, y, worldContainer) {
        super({
            x: x,
            y: y,
            dmg: 20,
            hp: 3,
            speed: 0.50,
            radius: 12.5,
            name: "MINI BLUE"
        }); 
        this.hbtype = "circle";
        this.initializeGraphics(worldContainer);
    }

    renderGraphics() {
        this.graphics.clear();
        this.graphics.circle(0, 0, this.radius);
        this.graphics.fill({color: 0x0000ff});
    }
}

class Shrieker extends Enemy {
    constructor(x, y, worldContainer) {
        super({
            x: x,
            y: y,
            width: 50,
            height: 50,
            name: "SHRIEKER",
            hp: 10,
            speed: 0.10,
            hbtype: "circle",
            radius: 25
        });
        this.normalSpeed = 0.10;
        this.shriekSpeed = 0.40; // 4x normal speed
        this.shriekRadius = 300; // Radius to detect player
        this.shrieking = false;
        this.rotation = 0;
        this.rotationSpeed = 0.2; // Rotation speed when shrieking
        this.shriekTimer = 0;
        this.shriekMoveTime = 1000; // 1 second of movement
        this.shriekPauseTime = 500; // 0.5 second pause
        this.shriekMoving = false;
        this.shakeAmount = 3; // Maximum shake offset in pixels
        this.shakeOffset = { x: 0, y: 0 }; // Current shake offset
        this.initializeGraphics(worldContainer);
    }

    renderGraphics() {
        this.graphics.clear();
        this.graphics.circle(0, 0, this.radius);
        this.graphics.fill({color: 0x000000});

        this.graphics.circle(this.radius * 0.6, 0, this.radius * 0.15);
        this.graphics.fill({color: 0xff0000});
        
        this.graphics.circle(-this.radius * 0.6, 0, this.radius * 0.15);
        this.graphics.fill({color: 0xff0000});
    }

    update(deltaTime, worldContainer) {
        const destroyed = super.update(deltaTime, worldContainer);
        if (destroyed) return;

        // Check if player is within shriek radius
        if (player && player.position) {
            // Check if in range and line of sight
            if (this.lineOfSight(player.position, this.shriekRadius)) {
                // Start shrieking if not already
                if (!this.shrieking) {
                    this.shrieking = true;
                    this.targeting = false;
                    this.shriekTimer = 0;
                    this.shriekMoving = true;
                    this.target = vector(player.position.x, player.position.y); // Set target to player's current position
                    playSound('shriek', 0.4);
                }
                
                // Handle shriek movement pattern
                this.shriekTimer += deltaTime;
                
                if (this.shriekMoving) {
                    // Moving phase
                    this.speed = this.shriekSpeed;
                    
                    if (this.shriekTimer >= this.shriekMoveTime) {
                        // Switch to pause phase
                        this.shriekMoving = false;
                        this.shriekTimer = 0;
                        this.speed = 0; // Stop moving during pause
                    }
                } else {
                    // Pause phase
                    if (this.shriekTimer >= this.shriekPauseTime) {
                        // Switch back to moving phase and update target
                        this.target = vector(player.position.x, player.position.y); // Update target to player's current position
                        this.shriekMoving = true;
                        this.shriekTimer = 0;
                    } 
                } 
                
                // Apply rotation when shrieking
                this.rotation += this.rotationSpeed * deltaTime / 16;
                this.graphics.rotation = this.rotation;
                
                // Apply shake effect when shrieking
                this.shakeOffset.x = (Math.random() * 2 - 1) * this.shakeAmount;
                this.shakeOffset.y = (Math.random() * 2 - 1) * this.shakeAmount;
                this.graphics.position.set(this.position.x + this.shakeOffset.x, this.position.y + this.shakeOffset.y);
            } else {
                // Stop shrieking
                if (this.shrieking) {
                    this.shrieking = false;
                    this.targeting = true;
                    this.speed = this.normalSpeed;
                    // Reset shake
                    this.shakeOffset = { x: 0, y: 0 };
                    this.graphics.position.set(this.position.x, this.position.y);
                }
            }
        }
    }
}
class Ghost extends Enemy {
    constructor(x, y, worldContainer) {
        super({
            x: x,
            y: y,
            hp: 10,
            speed: 0.15,
            name: "GHOST",
            ghosted: true,
            targetting: false,
            hbtype: "circle",
            radius: 25
        });
        this.initializeGraphics(worldContainer);
    }

    renderGraphics() {
        this.graphics.clear();
        this.graphics.circle(0, 0, this.radius);
        this.graphics.fill({color: 0xFFFFFF, alpha: 0.5});
    }

    update(deltaTime, worldContainer) {
        const destroyed = super.update(deltaTime, worldContainer);
        if (destroyed) return true;

        if (player) {
            this.target = vector(player.position.x, player.position.y);
        }
        
        return false;
    }
}

class ToxicGreen extends Enemy {
    constructor(x, y, worldContainer) {
        super({
            x: x,
            y: y,
            width: 50,
            height: 50,
            hp: 5,
            speed: 0.25,
            name: "TOXIC GREEN",
            damage: 0 // will spawn bullets so doesnt need damage
        });
        this.explosionRadius = this.width + 150; // distance to player to trigger explosion
        this.bulletCount = 8;    // number of bullets in explosion
        this.bulletDamage = 25;     // damage per bullet
        this.bulletSpeed = 0.4;    // speed of explosion bullets
        this.bulletSize = 8;       // size of explosion bullets
        this.bulletPierce = 1;
        this.bulletType = DefaultBullet;
        this.initializeGraphics(worldContainer);
    }

    renderGraphics() {
        this.graphics.clear();
        this.graphics.rect(0, 0, this.width, this.height);
        this.graphics.fill({ color: 0x00ff00 }); // Green color
    }

    explode(worldContainer) {
        const angleIncrement = (2 * Math.PI) / this.bulletCount;
        const centerX = this.position.x + this.width / 2;
        const centerY = this.position.y + this.height / 2;

        for (let i = 0; i < this.bulletCount; i++) {
            const angle = i * angleIncrement;

            const bullet = new this.bulletType({
                x: centerX,
                y: centerY,
                damage: this.bulletDamage,
                speed: this.bulletSpeed,
                pierce: this.bulletPierce,
                radius: this.bulletSize,
                angle: angle,
                worldContainer: worldContainer,
                color: 0x00ff00,
                enemy_bullet: true
            });
            enemy_bullets.push(bullet); 
        }
    }

    destroy(worldContainer) {
        this.explode(worldContainer);
        super.destroy(worldContainer);
    }

    update(deltaTime, worldContainer) {
        if (player && player.position) {
            const playerPos = player.position instanceof Vector ? player.position : vector(player.position.x, player.position.y);
            
            if (this.lineOfSight(playerPos, this.explosionRadius)) {
                this.destroy(worldContainer);
                return;
            }
        }
        super.update(deltaTime, worldContainer);
    }
}

class DefaultBoss extends Enemy {
    constructor(x, y, worldContainer, boss = true) {
        super({
            x: x,
            y: y,
            width: 100,
            height: 100,
            hp: 150,
            speed: 0.10,
            name: "BOSS GUY",
            targetRadius: random(250, 500)
        });

        this.cannon = new DefaultCannon({
            worldContainer: worldContainer,
            owner: this,
            enemy_cannon: true,
            color: 0xFF6347,
            cannonLength: 55,
            cannonWidth: 30,
            fireRate: 1500,
            bulletSize: 20,
            damage: 20
        });
        
        this.angle = 0;
        this.boss = boss;
        
        // Camera control properties
        this.cameraFocusing = false;
        this.originalPlayerCameraFollow = null;
        
        // Setup camera control when boss is created
        if (this.boss && player && player.camera) {
            this.cameraFocusing = true;
            this.originalPlayerCameraFollow = player.cameraFollow;
            
            // Queue camera commands to create dramatic boss intro
            player.camera.queueCommands(
                player.camera.lerpTo(this, 1000, 'easeInOut'),
                player.camera.shake_camera(1000, 150, 1.5, 1.2),
                player.camera.lerpTo(player, 1000, 'easeInOut')
            );
        }

        this.initializeGraphics(worldContainer);
    }

    renderGraphics() {
        this.graphics.clear();
        this.graphics.rect(0, 0, this.width, this.height);
        this.graphics.fill({color: 0x89CFF0});
    }

    update(deltaTime, worldContainer) {
        const destroyed = super.update(deltaTime, worldContainer);
        if (destroyed) return;

        const offset = Math.max(this.width, this.height) / 2;
        const cannonRelativeX = offset * Math.cos(this.angle);
        const cannonRelativeY = offset * Math.sin(this.angle);
        const cannonWorldX = this.position.x + this.width/2 + cannonRelativeX;
        const cannonWorldY = this.position.y + this.height/2 + cannonRelativeY;

        this.cannon.graphics.position.set(cannonWorldX, cannonWorldY);
        this.cannon.graphics.rotation = this.angle;
        this.cannon.update(deltaTime);

        const cannonTipOffset = this.cannon.cannonLength;
        const cannonTipX = cannonWorldX + cannonTipOffset * Math.cos(this.angle);
        const cannonTipY = cannonWorldY + cannonTipOffset * Math.sin(this.angle);

        if (player && player.position) {
            this.angle = Math.atan2(
                player.position.y - cannonWorldY,
                player.position.x - cannonWorldX
            );
            this.cannon.fire(this.angle, vector(cannonTipX, cannonTipY));
        }
    }

    destroy(worldContainer) {
        this.cannon.destroy(worldContainer);

        if (this.cameraFocusing) {
            player.cameraFollow = this.originalPlayerCameraFollow;
            if (player.cameraFollow) {
                const targetX = app.screen.width / 2 - (player.position.x + player.width/2) * worldContainer.scale.x;
                const targetY = app.screen.height / 2 - (player.position.y + player.height/2) * worldContainer.scale.y;
                worldContainer.x = targetX;
                worldContainer.y = targetY;
            }
        }

        super.destroy(worldContainer);

        if(this.boss) {
            destroyAllEnemies();
            stopAllMusic();
        }
    }
}
