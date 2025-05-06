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
        this.remainingHits = this.pierce; // Use the assigned pierce value
        this.color = options.color || 0xffffff;
        this.hbtype = options.hbtype || "circle";

        if (!this.worldContainer) {
            console.error("Bullet created without worldContainer!");
            // Handle error appropriately, maybe throw an error or return?
        }

        this.graphics = new PIXI.Graphics();
        this.graphics.position.set(this.position.x, this.position.y);
        this.renderGraphics(); // Initial draw
        if (this.worldContainer) { // Check again in case error handling didn't stop execution
            this.worldContainer.addChild(this.graphics);
        }
    }

    checkCollision() {
        // check collision with enemies
        for (const enemy of enemies) {
            if (checkCollision(this, enemy)) {
                this.hit(enemy);
                activeEnemy = enemy;
                healthBarTimer = healthBarDuration;
            }
        }
        
        // check collision with level obstacles
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

    hit(enemy) {
        enemy.damage(this.damage);
        this.pierce--;
        if(this.pierce <= 0) {
            this.destroy();
        }
    }

    renderGraphics() {
        this.graphics.clear();
        this.graphics.circle(0, 0, this.radius);
        this.graphics.fill({color: 0xffffff});

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
        if (this.graphics && this.worldContainer) { // Check if graphics exist before removing
            this.worldContainer.removeChild(this.graphics);
        } else if (!this.worldContainer) {
            console.warn("Bullet trying to destroy graphics without worldContainer reference.");
        }
        
        // Check if graphics exist and haven't been destroyed already
        if (this.graphics && !this.graphics._destroyed) {
             this.graphics.destroy();
        }
        this.graphics = null; // Set graphics to null after destroying

        // Remove from player bullets array
        let index = bullets.indexOf(this);
        if (index !== -1) {
            bullets.splice(index, 1);
            return; // Exit if found and removed from player bullets
        }

        // Remove from enemy bullets array if not found in player bullets
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
        enemy.damage(this.damage);
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
        if(super.checkCollision()) {
            this.explode();
        }
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
        // Update the size of the explosion graphics to match the new radius
        this.graphics.clear();
        this.renderGraphics();
        this.checkCollision();
    }

    checkCollision() {
        // check collision with enemies
        for (const enemy of enemies) {
            if (checkCollision(this, enemy)) {
                this.hit(enemy);
            }
        }
    }
}

class EnemyBullet extends Bullet {
    constructor(options = {}) {
        super(options);
    }

    renderGraphics() {
        super.renderGraphics();
        this.graphics.circle(0, 0, this.radius);
        this.graphics.fill({color: this.color});
    }   

    checkCollision() {
        for (const shape of activeLevel.shapes) {
            const shapeCollider = {
                position: vector(shape.x, shape.y),
                ...(shape.type === 'Rectangle' ? { width: shape.width, height: shape.height } : {}),
                ...(shape.type === 'Circle' ? { radius: shape.radius } : {})
            };

            const bulletCollider = { position: this.position, radius: this.radius };

            if (checkCollision(bulletCollider, shapeCollider)) {
                this.destroy(); 
                return true; 
            }
        }

        if(checkCollision(this, player)) {
            this.destroy();
            player.takeDamage(this.damage);
        }
        return false; 
    }
}