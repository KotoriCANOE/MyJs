class Vector3
{
    constructor(x, y, z)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    copy() { return new Vector3(this.x, this.y, this.z); }
    length() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
    sqrLength() { return this.x * this.x + this.y * this.y + this.z * this.z; }
    normalize() { var inv = 1/this.length(); return new Vector3(this.x * inv, this.y * inv, this.z * inv); }
    negate() { return new Vector3(-this.x, -this.y, -this.z); }
    negateSelf() { this.x = -this.x; this.y = -this.y; this.z = -this.z; return this; }
    add(v) { return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z); }
    addSelf(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
    sub(v) { return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z); }
    subSelf(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
    mul(f) { return new Vector3(this.x * f, this.y * f, this.z * f); }
    mulSelf(f) { this.x *= f; this.y *= f; this.z *= f; return this; }
    div(f) { var invf = 1/f; return new Vector3(this.x * invf, this.y * invf, this.z * invf); }
    divSelf(f) { var invf = 1/f; this.x *= invf; this.y *= invf; this.z *= invf; return this; }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
    cross(v) { return new Vector3(-this.z * v.y + this.y * v.z, this.z * v.x - this.x * v.z, -this.y * v.x + this.x * v.y); }
}

Vector3.zero = new Vector3(0, 0, 0);
