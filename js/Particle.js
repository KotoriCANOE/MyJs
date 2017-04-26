class Particle3D
{
    constructor(position, velocity, acceleration, radius = 0.5, color = null, life = Infinity)
    {
        this.position = position;
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.radius = radius;
        this.color = color;
        this.life = life;
        this.remain = this.life;
    }

    aging(time = 1) { this.remain -= time; return this.remain <= 0; }
    accel() { this.velocity.addSelf(this.acceleration); }
    move() { this.position.addSelf(this.velocity); }
    kinetic(accel = null)
    {
        var acceleration0 = this.acceleration;
        if(accel != null)
        { // update acceleration
            acceleration0 = acceleration0.add(accel).mulSelf(0.5); // better approximation
            this.acceleration = accel.copy();
        }

        var velocity0 = this.velocity.copy();
        this.velocity.addSelf(acceleration0);
        velocity0.addSelf(this.velocity).mulSelf(0.5); // better approximation

        this.position.addSelf(velocity0);
    }
}


function arrayAging(data, sorted = false)
{
    var nodes = data.nodes;
    var lastIndex = data.lastIndex;
    while(lastIndex >= 0 && nodes[lastIndex].aging())
    { // the last ones
        --lastIndex;
    }
    if(!sorted) for(var i = lastIndex; i >= 0; --i)
    { // the middle ones
         nodes[i].aging() && (nodes[i] = nodes[lastIndex--]);
    }
    data.lastIndex = lastIndex;
}
