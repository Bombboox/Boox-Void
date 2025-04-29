class Bullet {
    constructor(x, y, damage, speed, pierce, radius, angle, worldContainer) {
        this.position = vector(x, y);
        this.damage = damage;
        this.speed = speed;
        this.pierce = pierce;
        this.radius = radius;
        this.angle = angle;
        this.lifeTime = 3000;
        this.worldContainer = worldContainer;
        this.remainingHits = pierce;

        this.graphics = new PIXI.Graphics();
        this.graphics.position.set(this.position.x, this.position.y);
        this.renderGraphics(); // Initial draw
        if (this.worldContainer) {
            this.worldContainer.addChild(this.graphics);
        } else {
            console.error("Bullet created without world Container!");
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

            const bulletCollider = { position: this.position, radius: this.radius };

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
    constructor(x, y, damage, speed, pierce, radius, angle, worldContainer) {
        super(x, y, damage, speed, pierce, radius, angle, worldContainer);
    }
}

class ExplosiveBullet extends Bullet {
    constructor(x, y, damage, speed, pierce, radius, angle, worldContainer) {
        super(x, y, damage, speed, pierce, radius, angle, worldContainer);
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
        bullets.push(new Explosion(this.position.x, this.position.y, this.damage, this.speed, this.pierce, this.radius, this.angle, this.worldContainer));
    } 

    checkCollision() {
        if(super.checkCollision()) {
            this.explode();
        }
    }
}

class Explosion extends Bullet {
    constructor(x, y, damage, speed, pierce, radius, angle, worldContainer) {
        super(x, y, damage, speed, pierce, radius, angle, worldContainer);
        this.lifeTime = 150;
        this.speed = 0;
        this.pierce = Infinity;
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
    constructor(x, y, damage, speed, pierce, radius, angle, worldContainer) {
        super(x, y, damage, speed, pierce, radius, angle, worldContainer);
    }

    renderGraphics() {
        super.renderGraphics();
        this.graphics.circle(0, 0, this.radius);
        this.graphics.fill({color: 0x808080});
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
            player.die();
        }
        return false; 
    }
}