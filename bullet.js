class Bullet {
    constructor(x, y, damage, speed, radius, angle, worldContainer) {
        this.position = vector(x, y);
        this.damage = damage;
        this.speed = speed;
        this.radius = radius;
        this.angle = angle;
        this.lifeTime = 3000;
        this.worldContainer = worldContainer;

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

    renderGraphics() {
        this.graphics.clear();
        this.graphics.beginFill(0xffffff); // White
        this.graphics.drawCircle(0, 0, this.radius);
        this.graphics.endFill();
    }

    update(deltaTime) {
        this.lifeTime -= deltaTime;
        if(this.lifeTime <= 0) {
            this.destroy();
            return;
        }

        if (this.checkCollision()) {
            return;
        }

        this.position.x += this.speed * Math.cos(this.angle) * deltaTime;
        this.position.y += this.speed * Math.sin(this.angle) * deltaTime;

        this.graphics.position.set(this.position.x, this.position.y);
    }

    destroy() {
        if (this.worldContainer) {
            this.worldContainer.removeChild(this.graphics);
        } else {
            console.warn("Bullet trying to destroy graphics without worldContainer reference.");
        }
        this.graphics.destroy();

        const index = bullets.indexOf(this);
        if (index !== -1) {
            bullets.splice(index, 1);
        }
    }
}

class DefaultBullet extends Bullet {
    constructor(x, y, damage, speed, radius, angle, worldContainer) {
        super(x, y, damage, speed, radius, angle, worldContainer);
    }
}