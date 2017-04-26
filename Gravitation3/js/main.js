class Gravitation3 extends Gravitation2
{
    constructor(width, height, depth = null,
        maxNodesNum = 1536, scale = 4, speed = null, life = 512)
    {
        super(width, height, depth, maxNodesNum, scale, speed, life);
    }

    // Main methods
    initialize(data)
    {
        data.nodes = new Array(this.maxNodesNum * 2);
        data.lastIndex = -1;
        data.rate = 0;
    }

    simulate(data)
    {
        var that = this;
        var spawnStep = that.maxNodesNum / that.life;
        var spawnCount = 0;
        var spawnUpper = 0;

        // run continuously by ticks
        d3.interval(function(elapsed)
        {
            var width = that.width;
            var height = that.height;
            var depth = that.depth;

            // aging
            arrayAging(data);

            // kinetic simulation
            var nodes = data.nodes;
            var length = data.lastIndex + 1;

            for(var i = 0; i < length; ++i)
            {
                var node = nodes[i];
                var pos = node.position;
                var vel = node.velocity;
                var yAcc = node.acceleration.y;

                // update
                node.kinetic();

                // boundary reflection
                if(pos.x < 0)
                { // reflect if hitting left wall
                    pos.x = -pos.x;
                    vel.x = -vel.x;
                }
                else if(pos.x > width)
                { // reflect if hitting right wall
                    pos.x = width + width - pos.x;
                    vel.x = -vel.x;
                }

                if(pos.z < 0)
                { // reflect if hitting outer wall
                    pos.z = -pos.z;
                    vel.z = -vel.z;
                }
                else if(pos.z > depth)
                { // reflect if hitting inner wall
                    pos.z = depth + depth - pos.z;
                    vel.z = -vel.z;
                }
            }

            // spawn
            var lastIndex = data.lastIndex;
            for(spawnUpper += spawnStep; spawnCount < spawnUpper; ++spawnCount)
            {
                nodes[++lastIndex] = Gravitation2.createRandomNode(that, that.gravity);
            }
            data.lastIndex = lastIndex;

            if(spawnCount >= that.maxNodesNum)
            {
                spawnCount -= that.maxNodesNum;
                spawnUpper -= that.maxNodesNum;
            }
        }, that.simTick);
    }

    draw(data)
    {
        var that = this;
        var fpsCounter = new RateCounter(50, 1000);

        this.context.fillStyle = 'rgb(2,2,2)'
        this.context.fillRect(-that.margin.left, -that.margin.top,
            that.canvas.attr('width'), that.canvas.attr('height'));

        function scaleDepthFill(d)
        {
            var colorClose = that.colorClose;
            var colorFar = that.colorFar;
            var zDistance = d.position.z / that.depth;
            var closeness = 1 - zDistance;
            var r = colorFar.r * zDistance + colorClose.r * closeness;
            r *= r * 255;
            var g = colorFar.g * zDistance + colorClose.g * closeness;
            g *= g * 255;
            var b = colorFar.b * zDistance + colorClose.b * closeness;
            b *= b * 255;
            var opacity = 1 - d.age / d.life;
            return d3.rgb(r, g, b, opacity);
        }

        d3.timer(function(elapsed)
        {
            var nodes = data.nodes.slice(0, data.lastIndex + 1);

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

                context.fillStyle = scaleDepthFill(d);
                context.beginPath();
                context.arc(x, y, r, 0, PI2);
                context.closePath();
                context.fill();
            });

            // draw FPS
            fpsCounter.elapsed(elapsed);
            fpsCounter.drawCanvas(context, true, 10, 20, 15, 'FPS: ');
            //drawRate(data.rate, context, true, 10, 40, 15, 'Sim TPS: ');
        });
    }
}
