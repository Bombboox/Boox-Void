class Bullet {
    constructor(options = {}) {
        this.position = vector(options.x || 0, options.y || 0);
        this.damage = options.damage || 1;
        this.speed = options.speed || 0.5;
        this.pierce = options.pierce || 1;
        this.radius = options.radius || 5;
        this.angle = options.angle || 0;
        this.lifeTime = options.lifeTime || 3000;
        this.worldContainer = options.worldContainer; // Required
        this.remainingHits = this.pierce; 
        this.color = options.color || 0xff0000; 
        this.hbtype = options.hbtype || "circle";
        this.enemy_bullet = options.enemy_bullet || false; 
        this.crit_roll = options.crit_roll || false;

        if (!this.worldContainer) {
            console.error("Bullet created without worldContainer!");
        }

        this.graphics = new PIXI.Graphics();
        this.graphics.position.set(this.position.x, this.position.y);
        this.renderGraphics(); 
        if (this.worldContainer) { 
            this.worldContainer.addChild(this.graphics);
        }
    }

    checkCollision() {
        if (this.enemy_bullet) {
            for (const shape of activeLevel.shapes) {
                const shapeCollider = {
                    position: vector(shape.x, shape.y),
                    ...(shape.type === 'Rectangle' ? { width: shape.width, height: shape.height } : {}),
                    ...(shape.type === 'Circle' ? { radius: shape.radius } : {})
                };

                const bulletCollider = { position: this.position, radius: this.radius, hbtype: this.hbtype };

                if (checkCollision(bulletCollider, shapeCollider)) {
                    this.destroy();
                    return true;
                }
            }

            if(checkCollision(this, player)) {
                this.destroy();
                player.takeDamage(this.damage);
                return true; 
            }
            return false; 

        } else {
            for (const enemy of enemies) {
                if (checkCollision(this, enemy)) {
                    this.hit(enemy);
                    activeEnemy = enemy;
                    healthBarTimer = healthBarDuration;
                }
            }

            for (const shape of activeLevel.shapes) {
                const shapeCollider = {
                    position: vector(shape.x, shape.y),
                    ...(shape.type === 'Rectangle' ? { width: shape.width, height: shape.height } : {}),
                    ...(shape.type === 'Circle' ? { radius: shape.radius } : {})
                };

                const bulletCollider = { position: this.position, radius: this.radius, hbtype: this.hbtype };

                if (checkCollision(bulletCollider, shapeCollider)) {
                    this.destroy();
                    return true;
                }
            }
            return false;
        }
    }

    hit(enemy) {
        enemy.damage(this.damage, this.position, this.crit_roll);
        this.pierce--;
        if(this.pierce <= 0) {
            this.destroy();
        }
    }

    renderGraphics() {
        this.graphics.clear();
        this.graphics.circle(0, 0, this.radius);
        this.graphics.fill({color: this.color});
    }

    update(deltaTime) {
        this.lifeTime -= deltaTime;
        if(this.lifeTime <= 0) {
            this.destroy();
            return;
        }

        this.position.x += this.speed * Math.cos(this.angle) * deltaTime;
        this.position.y += this.speed * Math.sin(this.angle) * deltaTime;

        this.graphics.position.set(this.position.x, this.position.y);
        
        this.checkCollision();
    }

    destroy() {
        if (this.graphics && this.worldContainer) { 
            this.worldContainer.removeChild(this.graphics);
        } else if (!this.worldContainer) {
            console.warn("Bullet trying to destroy graphics without worldContainer reference.");
        }
        
        if (this.graphics && !this.graphics._destroyed) {
             this.graphics.destroy();
        }
        this.graphics = null; 

        let index = bullets.indexOf(this);
        if (index !== -1) {
            bullets.splice(index, 1);
            return; 
        }

        index = enemy_bullets.indexOf(this);
        if (index !== -1) {
            enemy_bullets.splice(index, 1);
        }
    }
}

class DefaultBullet extends Bullet {
    constructor(options = {}) {
        super(options);
    }
}

class HitscanBullet extends Bullet {
    constructor(options = {}) {
        super(options);
        this.width = options.width || 30;
        this.height = options.height || 5;
    }

    renderGraphics() {
        this.graphics.clear();
        this.graphics.pivot.set(0, 5 / 2);
        this.graphics.rotation = this.angle; 
        this.graphics.rect(0, 0, 40, 5);
        this.graphics.fill({color: this.color});
    }
}

class ExplosiveBullet extends Bullet {
    constructor(options = {}) {
        super(options);
    }

    renderGraphics() {
        super.renderGraphics();
        this.graphics.circle(0, 0, this.radius);
        this.graphics.fill({color: 0x808080});
    }

    hit(enemy) {
        super.hit(this.damage);
        this.explode();
        this.destroy();
    }

    explode() {
        bullets.push(new Explosion({
             x: this.position.x,
             y: this.position.y,
             damage: this.damage,
             radius: this.radius,
             worldContainer: this.worldContainer
        }));
    } 

    checkCollision() {
        const collisionHappened = super.checkCollision();
        if(collisionHappened && !this.enemy_bullet) { 
            this.explode();
        }
        return collisionHappened; 
    }
}

class DroneBullet extends Bullet {
    constructor(options = {}) {
        const droneOptions = {
            ...options,
            radius: options.radius || 15,
            color: 0x0088ff,
            speed: options.speed || 0.2,
            lifeTime: options.lifeTime || 10000,
            damage: options.damage || 5,
            range: options.range || 100
        };
        super(droneOptions);
        this.fireRate = options.fireRate || 250; // ms between shots
        this.fireTimer = 0;
        this.bulletDamage = Math.max(this.damage * 0.25, 1);
    }

    renderGraphics() {
        this.graphics.clear();
        this.graphics.circle(0, 0, this.radius);
        this.graphics.fill({color: this.color});
    }

    update(deltaTime, worldContainer) {
        super.update(deltaTime, worldContainer);
        
        // Fire at nearest enemy
        this.fireTimer += deltaTime;
        if (this.fireTimer >= this.fireRate) {
            this.fireAtNearestEnemy(worldContainer);
            this.fireTimer = 0;
        }
    }

    fireAtNearestEnemy(worldContainer) {
        const nearestEnemy = Enemy.find_nearest_enemy(this.position);
        if (nearestEnemy) {
        if(!nearestEnemy.lineOfSight(this.position, this.range)) return;

        const center = nearestEnemy.get_center();
        const dx = center.x - this.position.x;
        const dy = center.y - this.position.y;
        const angle = Math.atan2(dy, dx);
        
        const bullet = new HitscanBullet({
            x: this.position.x,
            y: this.position.y,
            damage: this.bulletDamage,
            angle: angle,
            worldContainer: worldContainer,
            speed: 4,
            color: 0x00ffff
        });
            bullets.push(bullet);
        }
    }

    explode() {
        bullets.push(new Explosion({
             x: this.position.x,
             y: this.position.y,
             damage: this.damage,
             radius: this.radius,
             worldContainer: this.worldContainer
        }));
    } 


    destroy() {
        this.explode();
        super.destroy();
    }
}

class Explosion extends Bullet {
    constructor(options = {}) {
        const explosionOptions = {
            ...options,
            lifeTime: 150,
            speed: 0,
            pierce: Infinity
        };
        super(explosionOptions);
    }

    renderGraphics() {
        super.renderGraphics();
        this.graphics.circle(0, 0, this.radius);
        this.graphics.fill({color: 0xffff00});
    }

    update(deltaTime) {
        this.lifeTime -= deltaTime;
        if(this.lifeTime <= 0) {
            this.destroy();
            return;
        }
        this.radius += 0.5 * deltaTime;
        this.renderGraphics(); 
        this.checkCollision();
    }

    checkCollision() {
        for (const enemy of enemies) {
            if (checkCollision(this, enemy)) {
                this.hit(enemy);
            }
        }
    }
}