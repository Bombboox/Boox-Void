class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(vector) {
        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    sub(vector) {
        return new Vector(this.x - vector.x, this.y - vector.y);
    }

    mul(scalar) {
        if (typeof scalar !== 'number') {
            throw new Error("Scalar must be a number");
        }
        return new Vector(this.x * scalar, this.y * scalar);
    }

    equals(vector, threshold = 0) {
        return this.x === vector.x && this.y === vector.y;
    }

    distance(vector) {
        return Math.sqrt((this.x - vector.x) ** 2 + (this.y - vector.y) ** 2);
    }

    length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }

    normalize() {
        const length = this.length();
        if (length === 0) {
            return new Vector(0, 0);
        }
        return new Vector(this.x / length, this.y / length);
    }
}

// Update the vector function to return a Vector instance
function vector(x, y) {
    return new Vector(x, y);
}

function normalize(vector) {
    if (vector instanceof Vector) {
        return vector.normalize();
    }
    
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    
    if (length === 0) {
        return { x: 0, y: 0 };
    }
    
    return {
        x: vector.x / length,
        y: vector.y / length
    };
}

function random(min, max) {
    return min + Math.random() * (max - min);
}

function randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTarget(position, radius) {
    const angle = Math.random() * 2 * Math.PI;
    const distance = random(0, radius);
    return vector(position.x + distance * Math.cos(angle), position.y + distance * Math.sin(angle));
}

function randomTargetTowardsPlayer(position, radius) {
    const dirToPlayer = normalize(player.position instanceof Vector ? 
        player.position.sub(position) : 
        {x: player.position.x - position.x, y: player.position.y - position.y});
    const angleToPlayer = Math.atan2(dirToPlayer.y, dirToPlayer.x);
    const angleVariation = (Math.random() - 0.5) * Math.PI; 
    const finalAngle = angleToPlayer + angleVariation;
    const distance = random(0, radius);
    return vector(position.x + distance * Math.cos(finalAngle), position.y + distance * Math.sin(finalAngle));
}

function checkCollision(hb1, hb2) {
    // Circle vs Circle collision
    if (hb1.radius && hb2.radius) {
        const distance = hb1.position instanceof Vector ? 
            hb1.position.distance(hb2.position) : 
            Math.sqrt((hb1.position.x - hb2.position.x) ** 2 + (hb1.position.y - hb2.position.y) ** 2);
        return distance < (hb1.radius + hb2.radius);
    }
    
    // Rectangle vs Rectangle collision
    if (!hb1.radius && !hb2.radius) {
        const x1 = hb1.position.x;
        const y1 = hb1.position.y;
        const x2 = hb2.position.x;
        const y2 = hb2.position.y;
        
        return x1 < x2 + hb2.width && 
               x1 + hb1.width > x2 && 
               y1 < y2 + hb2.height && 
               y1 + hb1.height > y2;
    }
    
    // Circle vs Rectangle collision
    let circle, rect;
    if (hb1.radius) {
        circle = hb1;
        rect = hb2;
    } else {
        circle = hb2;
        rect = hb1;
    }
    
    // Find closest point on rectangle to circle center
    const closestX = Math.max(rect.position.x, Math.min(circle.position.x, rect.position.x + rect.width));
    const closestY = Math.max(rect.position.y, Math.min(circle.position.y, rect.position.y + rect.height));
    
    // Calculate distance between closest point and circle center
    const distanceX = circle.position.x - closestX;
    const distanceY = circle.position.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    
    return distanceSquared < (circle.radius * circle.radius);
}