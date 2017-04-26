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
        this.age = 0;
    }

    aging(time = 1) { this.age += time; return this.age >= this.life; }
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


function arrayAging(nodes)
{
    var i = nodes.length - 1;
    for(; i >= 0 && nodes[i].aging(); --i)
    { // the last ones
        nodes.pop();
    }
    for(; i >= 0; --i)
    { // the middle ones
        if(nodes[i].aging())
        {
            var last = nodes.pop();
            nodes[i] = last;
        }
    }
}
