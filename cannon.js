class Cannon {
    constructor(damage, bulletType, bulletSpeed, bulletSize, fireRate) {
        this.damage = damage;
        this.bulletType = bulletType;
        this.bulletSpeed = bulletSpeed;
        this.bulletSize = bulletSize;
        this.fireRate = fireRate; // Cooldown in milliseconds
        this.cooldown = 0;

        this.graphics = new PIXI.Graphics();
    }
}

class DefaultCannon extends Cannon {
    constructor(worldContainer) { 
        super(1, // damage
              DefaultBullet, // bullet type
              0.5, // bullet speed
              5, // bullet size
              100 // fire rate
            );
        this.cannonLength = 25;
        this.cannonWidth = 10;
        this.worldContainer = worldContainer; 

        if (this.worldContainer) {
            this.worldContainer.addChild(this.graphics);
        } else {
             console.error("DefaultCannon created without worldContainer!");
        }
        this.renderGraphics(); 
    }

    renderGraphics() {
        this.graphics.clear();
        this.graphics.beginFill(0xffffff); // White

        this.graphics.drawRect(-this.cannonLength / 2 + 5, -this.cannonWidth / 2, this.cannonLength, this.cannonWidth);
        this.graphics.endFill();
    }

    update(deltaTime) { 
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }
    }

    fire(angle, playerPosition) { 
        if(this.cooldown <= 0) {
            const spawnOffset = player.radius + this.cannonLength / 2 + 5; // Add a small buffer
            const startX = playerPosition.x + spawnOffset * Math.cos(angle);
            const startY = playerPosition.y + spawnOffset * Math.sin(angle);

            this.cooldown = this.fireRate;
            // Create bullet and pass worldContainer for its graphics
            return new this.bulletType(startX, startY, this.damage, this.bulletSpeed, this.bulletSize, angle, this.worldContainer);
        } else {
            return null;
        }
    }
}