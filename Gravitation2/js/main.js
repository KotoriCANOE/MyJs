class Gravitation2
{
    constructor(width, height, depth = null,
        maxNodesNum = 2048, scale = 4, speed = null, life = null)
    {
        // physics constants
        this.g = 9.81;
        this.density = 1;
        this.radius2mass = 4 / 3 * Math.PI * this.density;

        // constants
        this.margin = {
            left: 5,
            top: 5,
            right: 5,
            bottom: 5
        };

        this.radius = 3;
        this.mass = this.radius * this.radius * this.radius * this.radius2mass;
        this.colorClose = { 'r': 0.5, 'g': 0.7, 'b': 1 }; // in linear scale [0,1]
        this.colorFar = { 'r': 0.7, 'g': 0.5, 'b': 0.35 }; // in linear scale [0,1]

        this.simTick = 5; // ms
        this.innerScale = 1 / 3;

        // options
        this.width = width;
        this.height = height;
        if(!depth) this.depth = width;
        else this.depth = depth;
        this.maxNodesNum = maxNodesNum;

        this.scale = scale;
        this.simTickSec = this.simTick / 1000 * this.scale; // s
        var yAcc = this.g * this.simTickSec * this.simTickSec;
        this.gravity = new Vector3(0, yAcc, 0);

        if(!speed)
        {
            var ySpeed = Math.sqrt(yAcc * this.height);
            this.speed = ySpeed;
        }
        else
        {
            this.speed = speed * this.simTickSec;
        }

        this.life = life;

        // initialization
        this.canvas = d3.select("#vis")
            .append("canvas")
                .attr('width', this.width)
                .attr('height', this.height);
        this.context = this.canvas.node().getContext('2d');

        this.context.translate(this.margin.left, this.margin.top);
        this.width -= this.margin.left + this.margin.right;
        this.height -= this.margin.top + this.margin.bottom;

        var detachedContainer = document.createElement('custom');
        this.dataContainer = d3.select(detachedContainer);

        this.depthScale = d3.scaleLinear()
            .domain([0, this.depth])
            .range([1, this.innerScale]);

        this.random = new Random();
    }

    // Helper functions
    createRandomNode(that = null, position = null)
    {
        if(!that) that = this;
        if(!position) position = new Vector3(that.width * 0.5, that.height * 0.5, that.depth * 0.5);
        var random = that.random;

        var speed = random.normal(that.speed, that.speed * 0.5);
        var longitude = random.uniform(0, Math.PI * 2);
        var latitude = random.uniform(Math.PI * -0.5, Math.PI * 0.5);
        var speedXZ = speed * Math.cos(latitude);

        return new Particle3D(
            position,
            new Vector3(speedXZ * Math.cos(longitude),
                speed * Math.sin(latitude), speedXZ * Math.sin(longitude)),
            that.gravity,
            that.radius,
            null,
            that.life ? random.normal(that.life, that.life * 0.5) : Infinity
        );
    }

    appendRandomNodes(nodes, number, that = null, position = null)
    {
        if(!that) that = this;
        for(var i = 0; i < number; ++i)
        {
            nodes.push(that.createRandomNode(that, position));
        }
    }

    // Main methods
    initialize(nodes)
    {
        this.appendRandomNodes(nodes, this.maxNodesNum);
    }

    simulate(nodes)
    {
        var that = this;

        // run continuously by ticks
        d3.interval(function()
        {
            var width = that.width;
            var height = that.height;
            var depth = that.depth;

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

                if(pos.y > height)
                { // reflect if hitting the ground
                    pos.y = height + height - pos.y;
                    vel.y = yAcc - vel.y;
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
            return d3.rgb(r, g, b);
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

            context.clearRect(-that.margin.left, -that.margin.top,
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
                var r = d.radius * depthScale;

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

            context.font = '15px Consolas';
            context.fillStyle = 'white';
            context.fillText('FPS: ' + fps, 10, 20);
        });
    }

    Run()
    {
        var that = this;
        var nodes = new Array();
        this.initialize(nodes);
        this.simulate(nodes);
        this.draw(nodes);
    }
}


// Instantiation
window.onload = function()
{
    var instance = new Gravitation2(
        document.documentElement.clientWidth - 4,
        document.documentElement.clientHeight - 4);

    instance.Run();
}
