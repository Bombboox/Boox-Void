class Cannon {
    constructor(options = {}) {
        this.damage = options.damage || 1;
        this.bulletType = options.bulletType || DefaultBullet;
        this.bulletSpeed = options.bulletSpeed || 0.5;
        this.bulletPierce = options.bulletPierce || 1;
        this.bulletSize = options.bulletSize || 5;
        this.fireRate = options.fireRate || 100; // Cooldown in milliseconds
        this.cooldown = 0;

        this.enemy_cannon = options.enemy_cannon || false;
        this.owner = options.owner || null; // Player or Enemy instance
        this.worldContainer = options.worldContainer || worldContainer; // PIXI.Container

        this.cannonLength = options.cannonLength || 25;
        this.cannonWidth = options.cannonWidth || 10;
        this.color = options.color || (this.enemy_cannon ? 0x5CBDEA : 0xffffff); // Default enemy cannon blue, player white
        this.bullet_color = options.color || 0xffffff; 

        this.graphics = new PIXI.Graphics();
        if (this.worldContainer) {
            this.worldContainer.addChild(this.graphics);
        } else {
            console.error("Cannon created without worldContainer!", options);
        }
        this.renderGraphics();
    }

    renderGraphics() {
        this.graphics.clear();
        this.graphics.rect(0, -this.cannonWidth / 2, this.cannonLength, this.cannonWidth);
        this.graphics.fill({ color: this.color });
    }

    update(deltaTime) {
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }
    }

    fire(angle, firingPointPosition) { // firingPointPosition is where the bullet should originate
        if (this.cooldown <= 0) {
            playSound('shoot', this.enemy_cannon ? 0.08 : 0.1);

            let spawnOffset = 0;
            if (this.enemy_cannon && this.owner) {
                // Assuming owner has width/height for size, or a radius
                spawnOffset = (this.owner.radius || Math.max(this.owner.width || 0, this.owner.height || 0) / 2) + this.cannonLength / 2 + 5;
            } else if (!this.enemy_cannon && typeof player !== 'undefined' && player.radius) { // Assuming 'player' is a global or accessible scope
                spawnOffset = player.radius + this.cannonLength / 2 + 5;
            } else {
                spawnOffset = this.cannonLength / 2 + 5; // Fallback
            }
            
            const actualFiringOriginX = firingPointPosition.x + (this.cannonLength / 2) * Math.cos(angle);
            const actualFiringOriginY = firingPointPosition.y + (this.cannonLength / 2) * Math.sin(angle);


            this.cooldown = this.fireRate;
            const bulletOptions = {
                x: actualFiringOriginX,
                y: actualFiringOriginY,
                damage: this.damage,
                speed: this.bulletSpeed,
                pierce: this.bulletPierce,
                radius: this.bulletSize,
                angle: angle,
                worldContainer: this.worldContainer,
                enemy_bullet: this.enemy_cannon, // Key change: bullets from enemy cannons are enemy_bullets
                color: this.bullet_color,
            };
            
            const bullet = new this.bulletType(bulletOptions);

            if (this.enemy_cannon) {
                if (typeof enemy_bullets !== 'undefined') { // Ensure enemy_bullets array exists
                    enemy_bullets.push(bullet);
                } else {
                    console.warn("enemy_bullets array not found for enemy cannon to fire into.");
                }
            }
            return bullet; // Player cannons return bullet to be added to player's bullet array
        }
        return null;
    }

    destroy() { // Removed worldContainer from params, should use this.worldContainer
        if (this.graphics && this.worldContainer) {
            this.worldContainer.removeChild(this.graphics);
            this.graphics.destroy();
            this.graphics = null;
        }
    }
}

class DefaultCannon extends Cannon {
    constructor(options = {}) {
        super({
            damage: options.damage || 1,
            bulletType: options.bulletType || DefaultBullet,
            bulletSpeed: options.bulletSpeed || 0.5,
            bulletPierce: options.bulletPierce || 1,
            bulletSize: options.bulletSize || 5,
            fireRate: options.fireRate || 100,
            cannonLength: options.cannonLength || 25,
            cannonWidth: options.cannonWidth || 10,
            worldContainer: options.worldContainer || worldContainer,
            owner: options.owner, // Pass the owner (e.g., player or enemy entity)
            enemy_cannon: options.enemy_cannon,
            color: options.color || (options.enemy_cannon ? 0x5CBDEA : 0xffffff) // Specific color for enemy default cannon
        });
    }
}

class ExplosiveCannon extends Cannon {
    constructor(options = {}) {
        super({
            damage: options.damage || 2,
            bulletType: options.bulletType || ExplosiveBullet,
            bulletSpeed: options.bulletSpeed || 0.5,
            bulletPierce: options.bulletPierce || 1, // Explosive bullets typically don't pierce in the traditional sense
            bulletSize: options.bulletSize || 10, // Radius of the bullet itself, explosion radius is handled by ExplosiveBullet
            fireRate: options.fireRate || 500, // Slower fire rate for explosive?
            cannonLength: options.cannonLength || 15,
            cannonWidth: options.cannonWidth || 20,
            worldContainer: options.worldContainer || worldContainer,
            owner: options.owner,
            enemy_cannon: options.enemy_cannon,
            color: options.color || (options.enemy_cannon ? 0xFF6347 : 0x808080) // Tomato for enemy explosive, Gray for player
        });
    }
}

class HitscanCannon extends Cannon {
    constructor(options = {}) {
        super({
            damage: options.damage || 1,
            bulletType: options.bulletType || HitscanBullet,
            bulletSpeed: options.bulletSpeed || 5,
            bulletPierce: options.bulletPierce || 1,
            bulletSize: options.bulletSize || 5,
            fireRate: options.fireRate || 100, 
            cannonLength: options.cannonLength || 35,
            cannonWidth: options.cannonWidth || 10,
            worldContainer: options.worldContainer || worldContainer,
            owner: options.owner,
            enemy_cannon: options.enemy_cannon,
            color: options.color || (options.enemy_cannon ? 0xFF6347 : 0xFFA500)
        });
    }
}

class DroneCannon extends Cannon {
    constructor(options = {}) {
        super({
            damage: options.damage || 20,
            bulletType: options.bulletType || DroneBullet,
            bulletSpeed: options.bulletSpeed || 0.2,
            bulletPierce: options.bulletPierce || 5,
            bulletSize: options.bulletSize || 15,
            fireRate: options.fireRate || 200, 
            cannonLength: options.cannonLength || 45,
            cannonWidth: options.cannonWidth || 25,
            worldContainer: options.worldContainer || worldContainer,
            owner: options.owner,
            enemy_cannon: options.enemy_cannon,
            color: options.color || (options.enemy_cannon ? 0xFF6347 : 0x89CFF0) // Baby blue color for player drone
        });
    }
}