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

    negate() {
        return new Vector(-this.x, -this.y);
    }

    perpendicular() {
        // Returns a vector perpendicular to this one (rotated 90 degrees counter-clockwise)
        return new Vector(-this.y, this.x);
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

function getLinearStat(base, multiplier, level) {
    return base * (1 + (multiplier) * (level - 1));
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

// Helper to get vertices of a rectangle hitbox
function getRectangleVertices(rect) {
    const pos = rect.position;
    const w = rect.width;
    const h = rect.height;

    const p = (pos instanceof Vector) ? pos : new Vector(pos.x, pos.y);
    return [
        p,                      // Top-left
        new Vector(p.x + w, p.y), // Top-right
        new Vector(p.x + w, p.y + h), // Bottom-right
        new Vector(p.x, p.y + h)  // Bottom-left
    ];
}

function checkCollision(hb1, hb2) {
    const type1 = hb1.hbtype || (hb1.radius ? 'circle' : 'rectangle');
    const type2 = hb2.hbtype || (hb2.radius ? 'circle' : 'rectangle');
    
    // Circle vs Circle collision
    if (type1 === 'circle' && type2 === 'circle') {
        const distance = hb1.position instanceof Vector ? 
            hb1.position.distance(hb2.position) : 
            Math.sqrt((hb1.position.x - hb2.position.x) ** 2 + (hb1.position.y - hb2.position.y) ** 2);
        return distance < (hb1.radius + hb2.radius);
    }
    
    // Rectangle vs Rectangle collision
    if (type1 === 'rectangle' && type2 === 'rectangle') {
        const verticesA = getRectangleVertices(hb1);
        const verticesB = getRectangleVertices(hb2);
        return gjk(verticesA, verticesB);
    }
    
    // Circle vs Rectangle collision
    let circle, rect;
    if (type1 === 'circle') {
        circle = hb1;
        rect = hb2;
    } else {
        circle = hb2;
        rect = hb1;
    }
    
    const closestX = Math.max(rect.position.x, Math.min(circle.position.x, rect.position.x + rect.width));
    const closestY = Math.max(rect.position.y, Math.min(circle.position.y, rect.position.y + rect.height));
    
    const distanceX = circle.position.x - closestX;
    const distanceY = circle.position.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    
    return distanceSquared < (circle.radius * circle.radius);
}



function lerp(start, end, t) {
    return start + t * (end - start);
}

function findFurthestPoint(vertices, direction) {
    let furthestPoint = vertices[0];
    let maxDot = direction.dot(furthestPoint);

    for (let i = 1; i < vertices.length; i++) {
        const dot = direction.dot(vertices[i]);
        if (dot > maxDot) {
            maxDot = dot;
            furthestPoint = vertices[i];
        }
    }
    return furthestPoint;
}

function support(verticesA, verticesB, direction) {
    const pointA = findFurthestPoint(verticesA, direction);
    const pointB = findFurthestPoint(verticesB, direction.negate());
    return pointA.sub(pointB); // Calculate point in Minkowski difference
}

function tripleProduct(a, b, c) {
    const ab = b.sub(a);
    const ac = c.sub(a);
    const perp = ab.perpendicular();

    const dot = ac.dot(perp);

    if (Math.abs(dot) < 1e-6) return 0;
    return dot;
}

// GJK algorithm for 2d collision
function gjk(verticesA, verticesB) {
    let direction = new Vector(1, 0); 
    let simplex = [support(verticesA, verticesB, direction)]; 
    direction = simplex[0].negate(); 

    for (let i = 0; i < 100; i++) { 
        const a = support(verticesA, verticesB, direction);

        if (a.dot(direction) < 0) {
            return false;
        }

        simplex.push(a);

        if (simplex.length === 2) {
            const b = simplex[0];
            const ab = b.sub(a);
            const ao = a.negate();

            const abPerp = tripleProduct(a, b, new Vector(0, 0)) > 0 ? ab.perpendicular() : ab.perpendicular().negate();
            direction = abPerp;

        } else if (simplex.length === 3) {
            // trainge case
            const b = simplex[1];
            const c = simplex[0]; 
            const ao = a.negate();
            const ab = b.sub(a);
            const ac = c.sub(a);

            const abPerp = tripleProduct(a, b, c) > 0 ? ab.perpendicular().negate() : ab.perpendicular(); // Perpendicular to AB, pointing inwards
            const acPerp = tripleProduct(a, c, b) > 0 ? ac.perpendicular().negate() : ac.perpendicular(); // Perpendicular to AC, pointing inwards

            if (abPerp.dot(ao) > 0) {
                simplex = [a, b]; 
                direction = abPerp;
            } else if (acPerp.dot(ao) > 0) {
                simplex = [a, c]; 
                direction = acPerp;
            } else {
                return true; 
            }
        }
    }
    
    console.warn("GJK did not converge"); 
    return false;
}

// Ray-Circle Intersection Test
function rayCircleIntersection(startPos, endPos, circle) {
    const center = (circle.position instanceof Vector) ? circle.position : new Vector(circle.position.x, circle.position.y);
    const radius = circle.radius;
    const d = endPos.sub(startPos); // Direction vector of the ray segment
    const f = startPos.sub(center); // Vector from circle center to ray start

    const a = d.dot(d);
    const b = 2 * f.dot(d);
    const c = f.dot(f) - radius * radius;

    let discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
        // No intersection with the line containing the segment
        return false;
    } else {
        // Ray intersects the circle's line
        discriminant = Math.sqrt(discriminant);

        // Calculate intersection times (t values along the ray segment)
        const t1 = (-b - discriminant) / (2 * a);
        const t2 = (-b + discriminant) / (2 * a);

        // Check if either intersection point lies within the segment [0, 1]
        if (t1 >= 0 && t1 <= 1) {
            return true; // Intersection on the segment
        }
        if (t2 >= 0 && t2 <= 1) {
            return true; // Intersection on the segment
        }

        if (startPos.distance(center) < radius && endPos.distance(center) < radius) {
            if ((t1 < 0 && t2 > 1) || (t2 < 0 && t1 > 1)) {
                 return true; // Segment spans across the circle
            }
        }
        
        return false; // Intersection points are outside the segment
    }
}

// Helper for Line Segment Intersection
function lineSegmentIntersection(p1, q1, p2, q2) {
    const r = q1.sub(p1);
    const s = q2.sub(p2);
    const rxs = r.x * s.y - r.y * s.x; // Cross product (in 2D)
    const qp = p2.sub(p1);
    const qpxr = qp.x * r.y - qp.y * r.x;
    const qpxs = qp.x * s.y - qp.y * s.x;

    // If rxs is zero, lines are collinear or parallel
    if (Math.abs(rxs) < 1e-6) {
        // Check if they are collinear and overlapping
        if (Math.abs(qpxr) < 1e-6) {
            // Collinear
            const t0 = qp.dot(r) / r.dot(r);
            const t1 = t0 + s.dot(r) / r.dot(r);
            // Check for overlap
            if ((t0 >= 0 && t0 <= 1) || (t1 >= 0 && t1 <= 1) || (t0 < 0 && t1 > 1) || (t1 < 0 && t0 > 1)) {
                 // Check if any endpoint of segment 2 lies on segment 1
                if ( (p2.sub(p1)).dot(r) >= 0 && (p2.sub(q1)).dot(r.negate()) >= 0 ) return true;
                if ( (q2.sub(p1)).dot(r) >= 0 && (q2.sub(q1)).dot(r.negate()) >= 0 ) return true; 
                 // Check if any endpoint of segment 1 lies on segment 2
                if ( (p1.sub(p2)).dot(s) >= 0 && (p1.sub(q2)).dot(s.negate()) >= 0 ) return true;
                if ( (q1.sub(p2)).dot(s) >= 0 && (q1.sub(q2)).dot(s.negate()) >= 0 ) return true;
            }
        }
        return false; // Parallel and non-intersecting or collinear but non-overlapping
    }

    // Calculate intersection parameters t and u
    const t = qpxs / rxs;
    const u = qpxr / rxs;

    // Intersection occurs if t and u are both between 0 and 1 (inclusive)
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

// Ray-Rectangle Intersection Test
function rayRectangleIntersection(startPos, endPos, rect) {
    const vertices = getRectangleVertices(rect);
    // Check intersection against each edge of the rectangle
    for (let i = 0; i < 4; i++) {
        const p1 = vertices[i];
        const q1 = vertices[(i + 1) % 4]; // Next vertex, wraps around
        if (lineSegmentIntersection(startPos, endPos, p1, q1)) {
            return true;
        }
    }
    return false;
}

// Raycast function: Checks if a line segment intersects any shape in a collection
function raycast(startPos, endPos, shapes) {
    // Ensure positions are Vector instances
    const start = (startPos instanceof Vector) ? startPos : new Vector(startPos.x, startPos.y);
    const end = (endPos instanceof Vector) ? endPos : new Vector(endPos.x, endPos.y);

    for (const shape of shapes) {
        // Determine hitbox type
        const type = shape.hbtype || (shape.radius ? 'circle' : 'rectangle');

        if (type === 'circle') {
            if (rayCircleIntersection(start, end, shape)) {
                return true; // Intersection found
            }
        } else if (type === 'rectangle') {
            if (rayRectangleIntersection(start, end, shape)) {
                return true; // Intersection found
            }
        } else {
            console.warn("Raycast encountered unknown shape type:", shape);
        }
    }

    return false; // No intersection found with any shape
}
