// Mathematical utility functions
export const MathUtils = {
    // Color interpolation
    lerpColor(start, end, t) {
        const sr = (start >> 16) & 0xff;
        const sg = (start >> 8) & 0xff;
        const sb = start & 0xff;
        const er = (end >> 16) & 0xff;
        const eg = (end >> 8) & 0xff;
        const eb = end & 0xff;
        const r = Math.round(sr + (er - sr) * t);
        const g = Math.round(sg + (eg - sg) * t);
        const b = Math.round(sb + (eb - sb) * t);
        return (r << 16) | (g << 8) | b;
    },

    // Easing functions
    easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    },

    easeOutQuart(x) {
        return 1 - Math.pow(1 - x, 4);
    },

    easeInOutQuart(x) {
        return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
    },

    // Clamping
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    // Linear interpolation
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    // Distance calculation
    distance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    },

    // Angle calculation
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    // Normalize angle to 0-2π range
    normalizeAngle(angle) {
        while (angle < 0) angle += Math.PI * 2;
        while (angle >= Math.PI * 2) angle -= Math.PI * 2;
        return angle;
    },

    // Random range
    randomRange(min, max) {
        return min + Math.random() * (max - min);
    },

    // Random integer range
    randomIntRange(min, max) {
        return Math.floor(min + Math.random() * (max - min + 1));
    },

    // Check if point is in circle
    pointInCircle(px, py, cx, cy, radius) {
        return this.distance(px, py, cx, cy) <= radius;
    },

    // Check if circles intersect
    circlesIntersect(x1, y1, r1, x2, y2, r2) {
        return this.distance(x1, y1, x2, y2) <= (r1 + r2);
    },

    // Normalize vector
    normalize(x, y) {
        const length = Math.hypot(x, y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    },

    // Vector magnitude
    magnitude(x, y) {
        return Math.hypot(x, y);
    },

    // Dot product
    dot(x1, y1, x2, y2) {
        return x1 * x2 + y1 * y2;
    },

    // Cross product (2D)
    cross(x1, y1, x2, y2) {
        return x1 * y2 - y1 * x2;
    },

    // Rotate point around origin
    rotate(x, y, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            x: x * cos - y * sin,
            y: x * sin + y * cos
        };
    },

    // Map value from one range to another
    mapRange(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },

    // Smooth step function
    smoothStep(edge0, edge1, x) {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    },

    // Check if value is approximately equal (for floating point comparisons)
    approximately(a, b, epsilon = 0.0001) {
        return Math.abs(a - b) <= epsilon;
    },

    // Wrap value to range
    wrap(value, min, max) {
        const range = max - min;
        if (range <= 0) return min;
        
        let result = value;
        while (result < min) result += range;
        while (result >= max) result -= range;
        return result;
    },

    // Oscillate between 0 and 1 based on time
    oscillate(time, frequency = 1) {
        return (Math.sin(time * frequency * Math.PI * 2) + 1) * 0.5;
    }
};

// Physics-specific math utilities
export const PhysicsUtils = {
    // Apply spring force
    applySpringForce(currentPos, targetPos, stiffness, damping, velocity) {
        const displacement = targetPos - currentPos;
        const springForce = displacement * stiffness;
        const dampingForce = velocity * damping;
        return springForce - dampingForce;
    },

    // Calculate elastic collision response
    elasticCollision(v1, v2, m1, m2) {
        const newV1 = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
        const newV2 = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
        return { v1: newV1, v2: newV2 };
    },

    // Calculate trajectory intersection
    trajectoryIntersection(pos1, vel1, pos2, vel2) {
        // Simple linear trajectory intersection
        const relativePos = { x: pos2.x - pos1.x, y: pos2.y - pos1.y };
        const relativeVel = { x: vel2.x - vel1.x, y: vel2.y - vel1.y };
        
        if (MathUtils.approximately(relativeVel.x, 0) && MathUtils.approximately(relativeVel.y, 0)) {
            return null; // Objects moving at same velocity
        }
        
        const t = -(MathUtils.dot(relativePos.x, relativePos.y, relativeVel.x, relativeVel.y)) /
                   MathUtils.dot(relativeVel.x, relativeVel.y, relativeVel.x, relativeVel.y);
        
        if (t < 0) return null; // Intersection in the past
        
        return {
            x: pos1.x + vel1.x * t,
            y: pos1.y + vel1.y * t,
            time: t
        };
    }
};
