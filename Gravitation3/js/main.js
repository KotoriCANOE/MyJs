class Gravitation3 extends Gravitation2
{
    constructor(width, height, depth = null,
        maxNodesNum = 1536, scale = 4, speed = null, life = 512)
    {
        super(width, height, depth, maxNodesNum, scale, speed, life);
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

        // run continuously by ticks
        d3.interval(function()
        {
            var width = that.width;
            var height = that.height;
            var depth = that.depth;

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
            });

            // spawn
            for(spawnUpper += spawnStep; spawnCount < spawnUpper; ++spawnCount)
            {
                nodes.push(that.createRandomNode(that));
            }
            if(spawnCount >= that.maxNodesNum)
            {
                spawnCount -= that.maxNodesNum;
                spawnUpper -= that.maxNodesNum;
            }
            //console.log('Spawn: ' + (nodes.length - 1));
        }, this.simTick);
    }

    draw(nodes)
    {
        var that = this;

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

        var lastElapsed = 0;
        var duration50 = new Array(50);
        var durationIndex = 0;

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

                context.fillStyle = scaleDepthFill(d);
                context.beginPath();
                context.arc(x, y, r, 0, PI2);
                context.closePath();
                context.fill();
            });

            // draw FPS
            var duration = elapsed - lastElapsed;
            lastElapsed = elapsed;
            duration50[durationIndex] = duration;
            durationIndex = ++durationIndex % 50;
            var fps = 50000 / duration50.reduce(function(a, b){ return a + b; }, 0);

            context.clearRect(10, 5, 200, 15);
            context.font = '15px Consolas';
            context.fillStyle = 'white';
            context.fillText('FPS: ' + fps, 10, 20);
        });
    }
}


// Instantiation
window.onload = function()
{
    var instance = new Gravitation3(
        document.documentElement.clientWidth - 4,
        document.documentElement.clientHeight - 4);

    instance.Run();
}
