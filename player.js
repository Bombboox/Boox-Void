class Player {
    constructor(x, y, radius, color) {
        this.position = vector(x, y);
        this.radius = radius;
        this.color = color;
        this.maxCannons = 3;
        this.cannons = [];
        this.cannonOffset = 10;
        this.angle = 0;
        this.armor = null;
        this.baseSpeed = 200; // Speed in pixels per second

        // PixiJS Graphics
        this.graphics = new PIXI.Graphics();
        this.isGraphicsInitialized = false;
    }

    // Call this after PixiJS app and worldContainer are ready
    initializeGraphics(worldContainer) {
        if (!this.isGraphicsInitialized) {
            worldContainer.addChild(this.graphics);
            this.isGraphicsInitialized = true;
            this.renderGraphics(); // Initial draw
        }
    }

    update(mouseX, mouseY, mouseDown, deltaTime) {
        if (!this.isGraphicsInitialized) return;

        const screenCenterX = app.screen.width / 2;
        const screenCenterY = app.screen.height / 2;

        // Calculate angle relative to screen center
        this.angle = Math.atan2(mouseY - screenCenterY, mouseX - screenCenterX);

        this.move(deltaTime); // Pass deltaTime for movement calculation

        // Update graphics position
        this.graphics.position.set(this.position.x, this.position.y);

        // Update cannon graphics positions and rotations
        for(let i = 0; i < this.cannons.length; i++) {
            const cannon = this.cannons[i];
            // Calculate offset position for the cannon relative to the player center
            const offset = this.radius + 10; // Adjust offset as needed
            const cannonX = offset * Math.cos(this.angle);
            const cannonY = offset * Math.sin(this.angle);
            // Cannons are added to the world container, but positioned relative to player
            cannon.graphics.position.set(this.position.x + cannonX, this.position.y + cannonY);
            cannon.graphics.rotation = this.angle;
            cannon.update(deltaTime); // Update cannon cooldown, etc.
        }

        // Handle firing
        if(mouseDown) {
            for(let i = 0; i < this.cannons.length; i++) {
                let bullet = this.cannons[i].fire(this.angle, this.position); // Pass angle and player position
                if(bullet != null) bullets.push(bullet);
            }
        }

        this.renderGraphics(); // Redraw player graphics (if needed, e.g., color change)
    }

    renderGraphics() {
        this.graphics.clear();
        this.graphics.circle(0, 0, this.radius);
        this.graphics.fill(this.color);
    }

    move(deltaTime) {
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