const MAX_STAR_LEVEL = 5; // 0 stars, 1 star, 2 stars, 3 stars, 4 stars, 5 stars (combine dupes to increase)
const MAX_RARITY = 4; // 0 is bronze, 1 is silver, 2 is gold, 3 is diamond, 4 is void

class Cannon {
    constructor(options = {}) {
        this.damage = options.damage || 1;
        this.crit_chance = options.crit_chance || 0.05;
        this.crit_damage = options.crit_damage || 2;

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
        this.star_level = options.star_level || 0;
        this.rarity = options.rarity || 0;

        if(!options.rarity_multipliers) options.rarity_multipliers = {};
        this.rarity_multipliers = {
            damage: options.rarity_multipliers.damage || 1.5,
            speed: options.rarity_multipliers.speed || 1.05,
            pierce: options.rarity_multipliers.pierce || 1.35,
            rate: options.rarity_multipliers.rate || 1,
            size: options.rarity_multipliers.size || 1,
        }

        if(!options.star_multipliers) options.star_multipliers = {};
        this.star_multipliers = {
            damage: options.star_multipliers.damage || 1.2,
            speed: options.star_multipliers.speed || 1.02,
            pierce: options.star_multipliers.pierce || 1.2,
            rate: options.star_multipliers.rate || 1,
            size: options.star_multipliers.size || 1,
        }
        
        if(!options.level_multipliers) options.level_multipliers = {};
        this.level_multipliers = {
            damage: options.level_multipliers.damage || 0.5,
            speed: options.level_multipliers.speed || 0.005,
            pierce: options.level_multipliers.pierce || 0.05,
            rate: options.level_multipliers.rate || 0.99,
            size: options.level_multipliers.size || 0.001,
        }

        this.damage = this.damage * Math.pow(this.rarity_multipliers.damage, this.rarity) * Math.pow(this.star_multipliers.damage, this.star_level);
        this.bulletSpeed = this.bulletSpeed * Math.pow(this.rarity_multipliers.speed, this.rarity) * Math.pow(this.star_multipliers.speed, this.star_level);
        this.bulletPierce = this.bulletPierce * Math.pow(this.rarity_multipliers.pierce, this.rarity) * Math.pow(this.star_multipliers.pierce, this.star_level);
        this.bulletSize = this.bulletSize * Math.pow(this.rarity_multipliers.size, this.rarity) * Math.pow(this.star_multipliers.size, this.star_level);
        this.fireRate = this.fireRate * Math.pow(this.rarity_multipliers.rate, this.rarity) * Math.pow(this.star_multipliers.rate, this.star_level);

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

            let damage = getLinearStat(this.damage, this.level_multipliers.damage, this.level)
            let crit_roll = random() < this.crit_chance;
            if(crit_roll) damage *= this.crit_damage;
            let speed = getLinearStat(this.bulletSpeed, this.level_multipliers.speed, this.level);
            let pierce = getLinearStat(this.bulletPierce, this.level_multipliers.pierce, this.level);
            let size = getLinearStat(this.bulletSize, this.level_multipliers.size, this.level);

            this.cooldown = this.fireRate * Math.pow(this.level_multipliers.rate, this.level);
            const bulletOptions = {
                x: actualFiringOriginX,
                y: actualFiringOriginY,
                damage: damage,
                speed: speed,
                pierce: pierce,
                radius: size,
                angle: angle,
                worldContainer: this.worldContainer,
                enemy_bullet: this.enemy_cannon, // Key change: bullets from enemy cannons are enemy_bullets
                color: this.bullet_color,
                crit_roll: crit_roll
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
            fireRate: options.fireRate || 1500, 
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