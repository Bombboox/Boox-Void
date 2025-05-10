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

        this.level = options.level || 1;
        
        if(!options.level_multipliers) options.level_multipliers = {};
        this.level_multipliers = {
            damage: options.level_multipliers.damage || 0.5,
            speed: options.level_multipliers.speed || 0.005,
            pierce: options.level_multipliers.pierce || 0.05,
            rate: options.level_multipliers.rate || 0.99,
            size: options.level_multipliers.size || 0.001,
        }

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


            this.cooldown = this.fireRate * Math.pow(this.level_multipliers.rate, this.level);
            const bulletOptions = {
                x: actualFiringOriginX,
                y: actualFiringOriginY,
                damage: getLinearStat(this.damage, this.level_multipliers.damage, this.level),
                speed: getLinearStat(this.bulletSpeed, this.level_multipliers.speed, this.level),
                pierce: getLinearStat(this.bulletPierce, this.level_multipliers.pierce, this.level),
                radius: getLinearStat(this.bulletSize, this.level_multipliers.size, this.level),
                angle: angle,
                worldContainer: this.worldContainer,
                enemy_bullet: this.enemy_cannon, // Key change: bullets from enemy cannons are enemy_bullets
                color: this.bullet_color,
            };
            
            const bullet = new this.bulletType(bulletOptions);

            if (this.enemy_cannon) {
                if (typeof enemy_bullets !== 'undefined') {
                    enemy_bullets.push(bullet);
                } else {
                    console.warn("enemy_bullets array not found for enemy cannon to fire into.");
                }
            }
            return bullet; 
        }
        return null;
    }

    destroy() { 
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
            owner: options.owner,
            enemy_cannon: options.enemy_cannon,
            color: options.color || (options.enemy_cannon ? 0x5CBDEA : 0xffffff),
            ...options // Pass through any additional options
        });
    }
}

class ExplosiveCannon extends Cannon {
    constructor(options = {}) {
        super({
            damage: options.damage || 3,
            bulletType: options.bulletType || ExplosiveBullet,
            bulletSpeed: options.bulletSpeed || 0.5,
            bulletPierce: options.bulletPierce || 1, 
            bulletSize: options.bulletSize || 10, 
            fireRate: options.fireRate || 750, 
            cannonLength: options.cannonLength || 15,
            cannonWidth: options.cannonWidth || 20,
            worldContainer: options.worldContainer || worldContainer,
            owner: options.owner,
            enemy_cannon: options.enemy_cannon,
            color: options.color || (options.enemy_cannon ? 0xFF6347 : 0x808080),
            ...options // Pass through any additional options
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
            color: options.color || (options.enemy_cannon ? 0xFF6347 : 0xFFA500),
            ...options // Pass through any additional options
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
            color: options.color || (options.enemy_cannon ? 0xFF6347 : 0x89CFF0),
            ...options // Pass through any additional options
        });
    }
}