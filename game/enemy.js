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

    damage(amount) {
        this.hp -= amount;
        if(this.hp <= 0) {
            this.destroy(worldContainer);
            return;
        }
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

            if (this.timeStuck >= this.stuckThreshold) {
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

        const distanceToTarget = this.position.distance(this.target);
        if (distanceToTarget < 10) {
            this.target = randomTargetTowardsPlayer(this.position, this.targetRadius);
            this.timeStuck = 0;
        }
        return false;
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
            name: "RED GUY"
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
        this.bulletType = EnemyBullet;
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
                color: 0x00ff00
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

        this.cannon = new EnemyCannon(this, worldContainer);
        this.angle = 0;
        this.boss = boss;
        
        this.cameraFocusTime = 1000;
        this.cameraFocusTimer = this.cameraFocusTime;
        this.cameraFocusing = true;
        this.originalPlayerCameraFollow = player.cameraFollow;
        
        player.cameraFollow = false;

        this.initializeGraphics(worldContainer);
    }

    renderGraphics() {
        this.graphics.clear();
        this.graphics.rect(0, 0, this.width, this.height);
        this.graphics.fill({color: 0x89CFF0});
    }

    update(deltaTime, worldContainer) {
        if (this.cameraFocusing) {
            this.cameraFocusTimer -= deltaTime;

            const lerpFactor = Math.min(1, deltaTime / 100);
            const targetX = app.screen.width / 2 - (this.position.x + this.width/2) * worldContainer.scale.x;
            const targetY = app.screen.height / 2 - (this.position.y + this.height/2) * worldContainer.scale.y;

            worldContainer.x = lerp(worldContainer.x, targetX, lerpFactor);
            worldContainer.y = lerp(worldContainer.y, targetY, lerpFactor);

            if (this.cameraFocusTimer <= 0) {
                this.cameraFocusing = false;
                player.lerpCameraBack();
            }
        }

        const destroyed = super.update(deltaTime, worldContainer);
        if (destroyed) return;

        const offset = Math.max(this.width, this.height) / 2 + 20;
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
            this.cannon.fire(this.angle, cannonTipX, cannonTipY);
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
