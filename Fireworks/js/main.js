class Fireworks extends Gravitation2
{
    constructor(width, height, depth = null,
        maxNodesNum = 8, scale = 4, speed = null, life = 400)
    {
        super(width, height, depth, maxNodesNum, scale, speed, life);

        this.resistance = -0.01;
        this.radius = 2;
    }

    // Main methods
    initialize(nodes)
    {}

    simulate(nodes)
    {
        var that = this;
        var spawnStep = that.maxNodesNum / that.life;
        var spawnCount = 0;
        var spawnUpper = 0;

        var fpsCounter = new RateCounter(50, 1000);

        // run continuously by ticks
        d3.interval(function(elapsed)
        {
            var width = that.width;
            var height = that.height;
            var depth = that.depth;
            var gravity = that.gravity;
            var resistance = that.resistance;

            // aging
            for(var i = 0; i < nodes.length;)
            {
                if(nodes[i].aging())
                {
                    arrayRemove(nodes, i);
                    //console.log('Remove: ' + i);
                }
                else
                {
                    ++i;
                }
            }

            // kinetic simulation
            nodes.forEach(function(node)
            {
                var pos = node.position;
                var vel = node.velocity;
                var yAcc = node.acceleration.y;

                // air resistance
                var accelMul = Math.max(-0.5, node.velocity.length() * resistance);
                var accel = node.velocity.mul(accelMul);
                accel.addSelf(gravity);

                // update
                node.kinetic(accel);

                // boundary reflection
                if(pos.y > height)
                { // stop if hitting the ground
                    pos.y = height;
                    vel.y = 0;
                }
            });

            // spawn
            var random = that.random;
            
            for(spawnUpper += spawnStep; spawnCount < spawnUpper; ++spawnCount)
            {
                var size = random.exponential(0.4) * 0.2 + 0.2;
                var number = random.normal(size * 512, size * 64);
                var xzSTD = Math.max(0.05, 0.3 - size * 0.2);
                var ySTD = Math.min(0.05, size * 0.05);

                var position = new Vector3(
                    random.normal(width * 0.5, width * xzSTD),
                    random.normal(height * (0.8 - size * 0.4), height * ySTD),
                    random.normal(depth * 0.5, depth * xzSTD)
                );

                var speed = that.speed * 5 * size * size * size;
                var speedSTD = speed * 0.1;
                var color = d3.hsl(random.uniform(0, 360), 2 / 3, 0.5, 1);
                var life = that.life * Math.sqrt(size);
                var lifeSTD = life * 0.15;

                that.appendRandomNodes(nodes, number, that, position,
                    speed, speedSTD, color, life, lifeSTD);
            }
            if(spawnCount >= that.maxNodesNum)
            {
                spawnCount -= that.maxNodesNum;
                spawnUpper -= that.maxNodesNum;
            }

            fpsCounter.elapsed(elapsed);
            fpsCounter.drawCanvas(that.context, true, 10, 40, 15, 'Sim TPS: ');
        }, this.simTick);
    }

    draw(nodes)
    {
        var that = this;

        this.context.fillStyle = 'rgb(2,2,2)'
        this.context.fillRect(-that.margin.left, -that.margin.top,
            that.canvas.attr('width'), that.canvas.attr('height'));

        var fpsCounter = new RateCounter(50, 1000);

        d3.timer(function(elapsed)
        {
            // sort nodes by descending z-depth
            nodes.sort(function(a, b)
            {
                return b.position.z - a.position.z;
            });

            // Canvas drawing
            var context = that.context;

            context.fillStyle = 'rgba(0,0,0,0.2)'
            context.fillRect(-that.margin.left, -that.margin.top,
                that.canvas.attr('width'), that.canvas.attr('height'));

            var PI2 = Math.PI * 2;
            var xCenter = that.width * 0.5;
            var yCenter = that.height * 0.5;

            nodes.forEach(function(d)
            {
                var pos = d.position;
                var depthScale = that.depthScale(pos.z);
                var x = (pos.x - xCenter) * depthScale + xCenter;
                var y = (pos.y - yCenter) * depthScale + yCenter;
                var r = Math.max(0, d.radius * depthScale);
                //d.color.opacity = 1 - d.age / d.life;

                context.fillStyle = d.color;
                context.beginPath();
                context.arc(x, y, r, 0, PI2);
                context.closePath();
                context.fill();
            });

            // draw FPS
            fpsCounter.elapsed(elapsed);
            fpsCounter.drawCanvas(context, true, 10, 20, 15, 'FPS: ');
        });
    }
}


// Instantiation
window.onload = function()
{
    var instance = new Fireworks(
        document.documentElement.clientWidth - 4,
        document.documentElement.clientHeight - 4);

    instance.Run();
}