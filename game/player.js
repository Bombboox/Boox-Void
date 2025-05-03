class Player {
    constructor(x, y, radius, color, hp = 100) {
        this.position = vector(x, y);
        this.radius = radius;
        this.color = color;
        this.maxCannons = 3;
        this.cannons = [];
        this.cannonOffset = 10;
        this.angle = 0;
        this.maxHp = hp;
        this.hp = hp;
        this.armor = null;
        this.baseSpeed = 200; // Speed in pixels per second
        this.alive = true; // Track if player is alive
        this.cameraFollow = true;
        this.cameraLerping = false;
        this.healthBarInterval = 5000;
        this.healthBarTimer = 0;
        
        // Invincibility frames
        this.invincible = false;
        this.invincibilityDuration = 1000; // 1 second of invincibility
        this.invincibilityTimer = 0;
        this.flashInterval = 100; // Flash every 100ms when invincible
        this.flashTimer = 0;
        this.visible = true;

        // PixiJS Graphics
        this.graphics = new PIXI.Graphics();
        this.isGraphicsInitialized = false;
        
        // Death text
        this.deathText = new PIXI.Text({
            text: isMobile ? "YOU HAVE PERISHED" : "YOU HAVE PERISHED\nPRESS R TO RESTART",
            style: {
                fontFamily: 'Arial',
                fontSize: 48,
                fill: 0xff0000,
                align: 'center',
                fontWeight: 'bold'
            }
        });
        this.deathText.anchor.set(0.5);
        this.deathText.visible = false;
        this.deathText.zIndex = 1000;
    }

    // Call this after PixiJS app and worldContainer are ready
    initializeGraphics(worldContainer) {
        if (!this.isGraphicsInitialized) {
            worldContainer.addChild(this.graphics);
            worldContainer.addChild(this.deathText);
            this.isGraphicsInitialized = true;
            this.renderGraphics(); // Initial draw
        }
    }

    update(mouseX, mouseY, mouseDown, deltaTime) {
        if (!this.isGraphicsInitialized) return;
        
        if (!this.alive) {
            // Position death text at player's last position
            this.deathText.position.set(this.position.x, this.position.y);
            this.deathText.visible = true;
            return;
        }

        // Update invincibility
        if (this.invincible) {
            this.invincibilityTimer -= deltaTime;
            this.flashTimer -= deltaTime;
            
            // Handle flashing effect
            if (this.flashTimer <= 0) {
                this.visible = !this.visible;
                this.flashTimer = this.flashInterval;
            }
            
            // End invincibility when timer expires
            if (this.invincibilityTimer <= 0) {
                this.invincible = false;
                this.visible = true;
            }
        }

        let cameraTarget = this.getCameraClamped();

        if(this.cameraLerping) {
            const lerpFactor = deltaTime / 100;
            worldContainer.x = lerp(worldContainer.x, cameraTarget.x, lerpFactor);
            worldContainer.y = lerp(worldContainer.y, cameraTarget.y, lerpFactor);
            
            // Check if camera is close enough to player to stop lerping
            const distanceX = Math.abs(worldContainer.x - cameraTarget.x);
            const distanceY = Math.abs(worldContainer.y - cameraTarget.y);
            if (distanceX < 5 && distanceY < 5) {
                this.cameraLerping = false;
                this.cameraFollow = true;
            }
        }

        this.graphics.position.set(this.position.x, this.position.y);

        for(let i = 0; i < this.cannons.length; i++) {
            const cannon = this.cannons[i];

            const offset = this.radius + 10; 
            const cannonX = offset * Math.cos(this.angle);
            const cannonY = offset * Math.sin(this.angle);

            cannon.graphics.position.set(this.position.x + cannonX, this.position.y + cannonY);
            cannon.graphics.rotation = this.angle;
            cannon.update(deltaTime); 
        }

        if(this.cameraFollow) {
            worldContainer.x = cameraTarget.x;
            worldContainer.y = cameraTarget.y;
        }

        const worldMouseX = (mouseX - worldContainer.x);
        const worldMouseY = (mouseY - worldContainer.y);
        
        this.angle = Math.atan2(worldMouseY - this.position.y, worldMouseX - this.position.x);

        this.move(deltaTime); 

        // Handle firing
        if(mouseDown) {
            for(let i = 0; i < this.cannons.length; i++) {
                let bullet = this.cannons[i].fire(this.angle, this.position); // Pass angle and player position
                if(bullet != null) bullets.push(bullet);
            }
        }

        this.renderGraphics(); 
        this.checkEnemyCollision();
    }

    renderGraphics() {
        this.graphics.clear(); // Clear previous frame
        if (this.alive && this.visible) {
            this.graphics.circle(0, 0, this.radius);
            this.graphics.fill(this.color);
        }
        this.renderHealthBar();
    }

    renderHealthBar() {
        let hbt = clamp(this.healthBarTimer, 0, 1000) / 1000;
        if(hbt > 0) {
            this.healthBarTimer -= deltaTime;
            this.graphics.rect(-30, -this.radius - 30, 60, 10);
            this.graphics.fill({color: 0x808080, alpha: hbt});
            this.graphics.rect(-30, -this.radius - 30, 60 * (this.hp / this.maxHp), 10);
            this.graphics.fill({color: 0x008000, alpha: hbt});
        }
    }
    
    die() {
        this.alive = false;
        this.graphics.clear(); // Clear player graphics
        this.deathText.visible = true;
        
        for(let cannon of this.cannons) {
            cannon.graphics.visible = false;
        }
    }

    revive() {
        this.hp = this.maxHp;
        this.alive = true;
        this.deathText.visible = false;
        this.invincible = true;
        this.invincibilityTimer = this.invincibilityDuration;
        this.visible = true;

        for(let cannon of this.cannons) {
            cannon.graphics.visible = true;
        }
    }

    lerpCameraBack() {
        this.cameraLerping = true;
    }

    getCameraClamped() {
        let x = app.screen.width / 2 - player.position.x * worldContainer.scale.x;
        let y = app.screen.height / 2 - player.position.y * worldContainer.scale.y;

        const minContainerX = app.screen.width - worldRightBoundary * worldContainer.scale.x;
        const maxContainerX = -worldLeftBoundary * worldContainer.scale.x;
        const minContainerY = app.screen.height - worldBottomBoundary * worldContainer.scale.y;
        const maxContainerY = -worldTopBoundary * worldContainer.scale.y;

        return vector(clamp(x, minContainerX, maxContainerX), clamp(y, minContainerY, maxContainerY));
    }
    
    checkEnemyCollision() {
        if (!this.alive || this.invincible) return;
        
        const playerCollider = { 
            position: vector(this.position.x, this.position.y), 
            radius: this.radius 
        };
        
        for (const enemy of enemies) {
            const enemyCollider = {
                position: vector(enemy.position.x, enemy.position.y),
                width: enemy.width,
                height: enemy.height
            };
            
            if (checkCollision(playerCollider, enemyCollider)) {
                this.takeDamage(enemy.dmg);
                return;
            }
        }
    }

    takeDamage(damage) {
        if (this.invincible) return;
        this.healthBarTimer = this.healthBarInterval;
        this.hp -= damage;
        if(this.hp <= 0) {
            this.die();
        } else {
            // Activate invincibility frames
            this.invincible = true;
            this.invincibilityTimer = this.invincibilityDuration;
            this.flashTimer = this.flashInterval;
        }
    }

    move(deltaTime) {
        if (!this.alive) return;
        
        const moveSpeed = (this.armor ? this.armor.speed + this.baseSpeed : this.baseSpeed) * (deltaTime / 1000);
        let deltaX = 0;
        let deltaY = 0;

        if(keyboard["w"]) {
            deltaY -= moveSpeed;
        }
        if(keyboard["s"]) {
            deltaY += moveSpeed;
        }
        if(keyboard["a"]) {
            deltaX -= moveSpeed;
        }
        if(keyboard["d"]) {
            deltaX += moveSpeed;
        }

        // Collision detection
        let potentialX = this.position.x + deltaX;
        let potentialY = this.position.y + deltaY;
        let canMoveX = true;
        let canMoveY = true;

        const playerColliderX = { position: vector(potentialX, this.position.y), radius: this.radius };
        const playerColliderY = { position: vector(this.position.x, potentialY), radius: this.radius };
        const playerColliderBoth = { position: vector(potentialX, potentialY), radius: this.radius }; // For diagonal movement check

        for (const shape of activeLevel.shapes) {
            const shapeCollider = {
                position: vector(shape.x, shape.y),
                ...(shape.type === 'Rectangle' ? { width: shape.width, height: shape.height } : {}),
                ...(shape.type === 'Circle' ? { radius: shape.radius } : {})
            };

            if (deltaX !== 0 && checkCollision(playerColliderX, shapeCollider)) {
                 canMoveX = false;
            }

            if (deltaY !== 0 && checkCollision(playerColliderY, shapeCollider)) {
                canMoveY = false;
            }

            if (deltaX !== 0 && deltaY !== 0 && !canMoveX && !canMoveY) {
                 if (checkCollision(playerColliderBoth, shapeCollider)) {
                    canMoveX = false; 
                    canMoveY = false;
                 } else {
                     if (!checkCollision(playerColliderX, shapeCollider)) {
                         canMoveX = true;
                     }
                     if (!checkCollision(playerColliderY, shapeCollider)) {
                         canMoveY = true; 
                     }
                     if(!checkCollision(playerColliderX, shapeCollider) && !checkCollision(playerColliderY, shapeCollider)){
                        canMoveX = false;
                        canMoveY = false;
                     } else if (!checkCollision(playerColliderX, shapeCollider)) {
                         canMoveX = true; 
                         canMoveY = false;
                     } else if (!checkCollision(playerColliderY, shapeCollider)) {
                         canMoveY = true; 
                         canMoveX = false;
                     } else { 
                          canMoveX = false;
                          canMoveY = false;
                     }
                 }
            }
        }

        if (canMoveX) {
            this.position.x = potentialX;
        }
        if (canMoveY) {
            this.position.y = potentialY;
        }
    }
}